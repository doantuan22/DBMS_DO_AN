// Lifecycle runner — concurrency, seat-hold expiry and compensated showtime cancellation.
//   node scripts/audit/lifecycle.mjs
// Real HTTP → Express → stored procedures → SQL Server (`CinemaBookingDB_Test` only).
// Concurrency is exercised with genuinely parallel requests (Promise.all over independent
// connections); outcomes are asserted both from HTTP results and from SQL state.
import assert from 'node:assert/strict';
import {
  ACCOUNTS,
  DEMO_PASSWORD,
  Reporter,
  apiClient,
  assertTestDatabase,
  connectTestDb,
  createPrivateShowtime,
  ensureSandbox,
  one,
  registerCustomer,
  rows,
  scalar,
  sleep,
  startBackend,
} from './lib.mjs';
import { runIntegrityChecks } from './db-integrity.mjs';

const RUN = Date.now().toString(36);
const reporter = new Reporter('lifecycle');
const { pool, identity } = await connectTestDb();
console.log(`Target: ${identity.db} as ${identity.login}  run=${RUN}`);
const backend = await startBackend();
const call = apiClient(backend.base);

const staffTokens = {};
async function staff(role) {
  if (!staffTokens[role]) {
    const r = await call('POST', '/auth/login', { body: { Email: ACCOUNTS[role], MatKhau: DEMO_PASSWORD } });
    assert.equal(r.status, 200, r.text);
    staffTokens[role] = r.body.token;
  }
  return staffTokens[role];
}
const asStaff = async (role, method, route, body) => call(method, route, { token: await staff(role), body });
const money = (v) => Number(v);
const histogram = (list) => list.reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});
const label = (r) => `${r.status}${r.body?.error?.code ? ` ${r.body.error.code}` : ''}`;

async function t(id, title, fn) {
  try {
    await assertTestDatabase(pool);
    const evidence = await fn();
    reporter.record(id, title, 'PASS', '', evidence);
  } catch (error) {
    reporter.record(id, title, 'FAIL', String(error.message).split('\n')[0].slice(0, 500));
  }
}

// ------------------------------------------------------------ helpers
async function privateShowtime({ minSeats = 8 } = {}) {
  return createPrivateShowtime(call, pool, await staff('admin'), { minSeats });
}
async function freeSeatIds(showtimeId, count) {
  const response = await call('GET', `/showtimes/${showtimeId}/seats`);
  assert.equal(response.status, 200, response.text);
  const free = response.body.seats.filter((s) => s.status === 'Trống');
  assert.ok(free.length >= count, `need ${count} free seats, have ${free.length}`);
  return free.slice(0, count).map((s) => s.id);
}
const book = (customer, showtimeId, seatIds, extra = {}) =>
  call('POST', '/bookings', { token: customer.token, body: { showtimeId, seatIds, products: [], ...extra } });
const activeTickets = (showtimeId) =>
  rows(
    pool,
    `SELECT v.GheID, d.DonDatVeID, d.NguoiDungID, d.TrangThai FROM dbo.CHITIETVE v
       JOIN dbo.DONDATVE d ON d.DonDatVeID = v.DonDatVeID
      WHERE d.SuatChieuID = @s AND v.TrangThai <> N'Đã hủy'
        AND dbo.fn_DonDangGiuGhe(d.TrangThai, d.HanGiuCho, dbo.fn_BayGio()) = 1`,
    { s: showtimeId },
  );
const cheapProduct = async () => (await call('GET', '/products')).body.products[0];

const HOLD_LIMIT = await scalar(pool, 'SELECT dbo.fn_GioiHanDonDangGiu()');

// ====================================================================== CONCURRENCY
await t('LC-CONC-01', 'Seat race: 8 customers book the SAME seat at once → exactly one 201, the rest 409, one ticket in SQL', async () => {
  const show = await privateShowtime();
  const [seat] = await freeSeatIds(show.showtimeId, 1);
  const customers = await Promise.all(Array.from({ length: 8 }, (_, i) => registerCustomer(call, pool, `race${i}`)));
  const results = await Promise.all(customers.map((c) => book(c, show.showtimeId, [seat])));
  const outcome = histogram(results.map(label));
  assert.equal(results.filter((r) => r.status === 201).length, 1, JSON.stringify(outcome));
  assert.ok(results.filter((r) => r.status !== 201).every((r) => r.status === 409), JSON.stringify(outcome));
  assert.equal(results.filter((r) => r.status >= 500).length, 0);
  const tickets = (await activeTickets(show.showtimeId)).filter((x) => x.GheID === seat);
  assert.equal(tickets.length, 1);
  return outcome;
});

await t('LC-CONC-02', 'Overlapping seat subsets: 10 customers × random 3 of 6 seats → no seat sold twice, no 5xx', async () => {
  const show = await privateShowtime();
  const pool6 = await freeSeatIds(show.showtimeId, 6);
  const customers = await Promise.all(Array.from({ length: 10 }, (_, i) => registerCustomer(call, pool, `sub${i}`)));
  const subset = () => [...pool6].sort(() => Math.random() - 0.5).slice(0, 3);
  const results = await Promise.all(customers.map((c) => book(c, show.showtimeId, subset())));
  assert.equal(results.filter((r) => r.status >= 500).length, 0, JSON.stringify(histogram(results.map(label))));
  const active = await activeTickets(show.showtimeId);
  const seatCounts = histogram(active.map((x) => x.GheID));
  assert.ok(Object.values(seatCounts).every((n) => n === 1), `a seat was sold twice: ${JSON.stringify(seatCounts)}`);
  const winners = results.filter((r) => r.status === 201).length;
  assert.ok(winners >= 1 && winners <= 2, `with 3-of-6 subsets at most 2 orders can coexist, got ${winners}`);
  assert.equal(active.length, winners * 3);
  return histogram(results.map(label));
});

await t('LC-CONC-03', `Unpaid-order limit: one customer fires 6 parallel bookings → exactly ${HOLD_LIMIT} succeed`, async () => {
  const show = await privateShowtime({ minSeats: 8 });
  const seats = await freeSeatIds(show.showtimeId, 6);
  const customer = await registerCustomer(call, pool, 'limit');
  const results = await Promise.all(seats.map((id) => book(customer, show.showtimeId, [id])));
  const outcome = histogram(results.map(label));
  assert.equal(results.filter((r) => r.status === 201).length, HOLD_LIMIT, JSON.stringify(outcome));
  assert.ok(
    results.filter((r) => r.status !== 201).every((r) => r.status === 409 && r.body.error.code === 'ACTIVE_ORDER_LIMIT_REACHED'),
    JSON.stringify(outcome),
  );
  const held = await scalar(
    pool,
    `SELECT COUNT(*) FROM dbo.DONDATVE WHERE NguoiDungID = @u AND TrangThai = N'Chờ thanh toán'`,
    { u: customer.id },
  );
  assert.equal(held, HOLD_LIMIT);
  return outcome;
});

await t('LC-CONC-04', 'Double submit of the payment result: parallel “Thành công” → one successful payment, order paid once', async () => {
  const show = await privateShowtime();
  const [seat] = await freeSeatIds(show.showtimeId, 1);
  const customer = await registerCustomer(call, pool, 'pay');
  const booked = await book(customer, show.showtimeId, [seat]);
  assert.equal(booked.status, 201, booked.text);
  const orderId = booked.body.booking.id;
  const attempt = await call('POST', `/orders/${orderId}/payments`, { token: customer.token, body: { paymentMethod: 'VNPAY' } });
  assert.equal(attempt.status, 201, attempt.text);
  const paymentId = attempt.body.payment.id;
  const results = await Promise.all(
    Array.from({ length: 6 }, () =>
      call('POST', `/orders/${orderId}/payments/${paymentId}/result`, { token: customer.token, body: { status: 'Thành công' } }),
    ),
  );
  const outcome = histogram(results.map(label));
  assert.equal(results.filter((r) => r.status >= 500).length, 0, JSON.stringify(outcome));
  assert.ok(results.some((r) => r.status === 200), JSON.stringify(outcome));
  assert.equal(
    await scalar(pool, `SELECT COUNT(*) FROM dbo.THANHTOAN WHERE DonDatVeID = @o AND TrangThai = N'Thành công'`, { o: orderId }),
    1,
  );
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @o', { o: orderId }), 'Đã thanh toán');
  return outcome;
});

await t('LC-CONC-05', 'Showtime overlap race: 6 parallel Admin creates of overlapping slots → exactly one 201', async () => {
  const sandbox = await ensureSandbox(call, pool, await staff('admin'));
  const room = { PhongID: sandbox.roomId, LoaiPhong: '2D' };
  const movie = await one(
    pool,
    `SELECT TOP 1 PhimID FROM dbo.PHIM WHERE TrangThai = N'Đang chiếu'
        AND (NgayKetThuc IS NULL OR NgayKetThuc > DATEADD(DAY, 120, CAST(dbo.fn_BayGio() AS DATE))) ORDER BY PhimID`,
  );
  const lastEnd = await scalar(pool, 'SELECT MAX(ThoiGianKetThuc) FROM dbo.SUATCHIEU WHERE PhongID = @r', { r: room.PhongID });
  const start = new Date(Math.max(Date.now() + 40 * 86400000, lastEnd ? new Date(lastEnd).getTime() + 3600000 : 0));
  start.setUTCMinutes(0, 0, 0);
  const attempts = Array.from({ length: 6 }, (_, i) => {
    const s = new Date(start.getTime() + i * 10 * 60000); // 6 slots, 10 min apart: every pair overlaps
    return asStaff('admin', 'POST', '/admin/showtimes', {
      movieId: movie.PhimID,
      roomId: room.PhongID,
      startsAt: s.toISOString(),
      endsAt: new Date(s.getTime() + 2 * 3600000).toISOString(),
      format: room.LoaiPhong,
      basePrice: 80000,
    });
  });
  const results = await Promise.all(attempts);
  const outcome = histogram(results.map(label));
  assert.equal(results.filter((r) => r.status === 201).length, 1, JSON.stringify(outcome));
  assert.ok(results.filter((r) => r.status !== 201).every((r) => r.status === 409 && r.body.error.code === 'SHOWTIME_OVERLAP'), JSON.stringify(outcome));
  const overlapping = await scalar(
    pool,
    `SELECT COUNT(*) FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON a.PhongID = b.PhongID AND a.SuatChieuID < b.SuatChieuID
      AND a.ThoiGianBatDau < b.ThoiGianKetThuc AND b.ThoiGianBatDau < a.ThoiGianKetThuc
      WHERE a.PhongID = @r AND a.TrangThai <> N'Đã hủy' AND b.TrangThai <> N'Đã hủy'`,
    { r: room.PhongID },
  );
  assert.equal(overlapping, 0);
  return outcome;
});

await t('LC-CONC-06', 'Promotion quota race: code with 1 use, 6 customers book at once → usage never above 1', async () => {
  const show = await privateShowtime();
  const seats = await freeSeatIds(show.showtimeId, 6);
  const code = `E2ELC${RUN}`.toUpperCase().slice(0, 20);
  const now = Date.now();
  const created = await asStaff('admin', 'POST', '/admin/promotions', {
    code,
    description: 'quota race',
    discountType: 'Số tiền',
    discountValue: 5000,
    minimumOrder: 0,
    startsAt: new Date(now - 3600000).toISOString(),
    endsAt: new Date(now + 7 * 86400000).toISOString(),
    quantity: 1,
  });
  assert.equal(created.status, 201, created.text);
  const customers = await Promise.all(Array.from({ length: 6 }, (_, i) => registerCustomer(call, pool, `promo${i}`)));
  const results = await Promise.all(customers.map((c, i) => book(c, show.showtimeId, [seats[i]], { promotionCode: code })));
  const outcome = histogram(results.map(label));
  assert.equal(results.filter((r) => r.status >= 500).length, 0, JSON.stringify(outcome));
  const row = await one(pool, 'SELECT KhuyenMaiID, SoLuong, SoLuongDaDung FROM dbo.KHUYENMAI WHERE MaCode = @c', { c: code });
  assert.ok(row.SoLuongDaDung <= row.SoLuong, `usage ${row.SoLuongDaDung} > quantity ${row.SoLuong}`);
  const withPromo = await scalar(pool, 'SELECT COUNT(*) FROM dbo.DONDATVE WHERE KhuyenMaiID = @k', { k: row.KhuyenMaiID });
  assert.equal(withPromo, 1, `exactly one order may carry a one-use promotion, found ${withPromo}`);
  assert.equal(results.filter((r) => r.status === 201).length, 1, JSON.stringify(outcome));
  return outcome;
});

await t('LC-CONC-07', 'Pricing overlap race: 5 parallel Manager creates of the same rule → exactly one 201', async () => {
  const cinemaId = (await one(pool, `SELECT TOP 1 p.RapID FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG n ON n.NguoiDungID = p.NguoiDungID WHERE n.Email = @e AND p.TrangThai = N'Hiệu lực' ORDER BY p.RapID`, { e: ACCOUNTS.manager })).RapID;
  const last = await scalar(pool, 'SELECT CONVERT(VARCHAR(10), DATEADD(DAY, 7, MAX(ISNULL(NgayKetThuc, NgayBatDau))), 23) FROM dbo.BANGGIA WHERE RapID = @r', { r: cinemaId });
  const startsOn = last ?? new Date().toISOString().slice(0, 10);
  const endsOn = new Date(new Date(`${startsOn}T00:00:00Z`).getTime() + 4 * 86400000).toISOString().slice(0, 10);
  const body = { seatType: 'Đôi', dayType: 'Ngày thường', format: 'ScreenX', surcharge: 3000, startsOn, endsOn };
  const results = await Promise.all(
    Array.from({ length: 5 }, () => asStaff('manager', 'POST', `/manager/cinemas/${cinemaId}/pricing`, body)),
  );
  const outcome = histogram(results.map(label));
  assert.equal(results.filter((r) => r.status === 201).length, 1, JSON.stringify(outcome));
  assert.ok(results.filter((r) => r.status !== 201).every((r) => r.status === 409), JSON.stringify(outcome));
  const created = results.find((r) => r.status === 201);
  // keep the dataset tidy for the next run
  await asStaff('manager', 'PUT', `/manager/pricing/${created.body.pricing.id}`, { surcharge: 3000, status: 'Tạm dừng' });
  return outcome;
});

await t('LC-CONC-08', 'Book vs cancel race: 6 bookings race an Admin cancel → no live hold survives on a cancelled showtime', async () => {
  const show = await privateShowtime();
  const seats = await freeSeatIds(show.showtimeId, 6);
  const customers = await Promise.all(Array.from({ length: 6 }, (_, i) => registerCustomer(call, pool, `cx${i}`)));
  const jobs = customers.map((c, i) => book(c, show.showtimeId, [seats[i]]));
  jobs.push(asStaff('admin', 'POST', `/admin/showtimes/${show.showtimeId}/cancel`, {}));
  const results = await Promise.all(jobs);
  assert.equal(results.filter((r) => r.status >= 500).length, 0, JSON.stringify(histogram(results.map(label))));
  const cancel = results.at(-1);
  const state = await scalar(pool, 'SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @s', { s: show.showtimeId });
  // Either the cancel won (200, showtime cancelled) or held orders blocked it (409, showtime still open).
  assert.ok(
    (cancel.status === 200 && state === 'Đã hủy') || (cancel.status === 409 && state === 'Mở bán'),
    `cancel=${label(cancel)} state=${state}`,
  );
  if (state === 'Đã hủy') {
    const live = await activeTickets(show.showtimeId);
    assert.equal(live.length, 0, 'cancelled showtime must not keep live holds');
  }
  return { cancel: label(cancel), showtime: state, bookings: histogram(results.slice(0, -1).map(label)) };
});

await t('LC-CONC-09', 'Cinema image lock: parallel cover switches and hide/show → at most one cover, and it is active, no 5xx', async () => {
  const cinema = await asStaff('admin', 'POST', '/admin/cinemas', { name: `E2E Lock ${RUN}`, address: '1 Lock St', city: 'Hà Nội' });
  assert.equal(cinema.status, 201, cinema.text);
  const cinemaId = cinema.body.cinema.RapID;
  const images = [];
  for (let i = 0; i < 4; i += 1) {
    const created = await asStaff('admin', 'POST', `/admin/cinemas/${cinemaId}/images`, {
      url: `/images/e2e-lock-${RUN}-${i}.jpg`,
      description: `Lock ${i}`,
      displayOrder: i,
      cover: i === 0,
    });
    assert.equal(created.status, 201, created.text);
    images.push(created.body.image.HinhAnhRapID);
  }
  const hide = (index, status) =>
    asStaff('admin', 'PUT', `/admin/cinemas/${cinemaId}/images/${images[index]}`, {
      url: `/images/e2e-lock-${RUN}-${index}.jpg`,
      description: `Lock ${index}`,
      displayOrder: index,
      status,
    });
  const jobs = [];
  for (let round = 0; round < 3; round += 1) {
    jobs.push(asStaff('admin', 'PATCH', `/admin/cinemas/${cinemaId}/images/${images[1]}/cover`, { cover: true }));
    jobs.push(hide(1, 'Tạm ẩn'));
    jobs.push(asStaff('admin', 'PATCH', `/admin/cinemas/${cinemaId}/images/${images[2]}/cover`, { cover: true }));
    jobs.push(hide(2, 'Hoạt động'));
    jobs.push(asStaff('admin', 'PATCH', `/admin/cinemas/${cinemaId}/images/${images[3]}/cover`, { cover: true }));
    jobs.push(hide(0, round % 2 ? 'Hoạt động' : 'Tạm ẩn'));
  }
  const results = await Promise.all(jobs);
  const outcome = histogram(results.map(label));
  assert.equal(results.filter((r) => r.status >= 500).length, 0, JSON.stringify(outcome));
  const covers = await rows(pool, 'SELECT HinhAnhRapID, TrangThai FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @r AND LaAnhDaiDien = 1', { r: cinemaId });
  assert.ok(covers.length <= 1, `more than one cover: ${JSON.stringify(covers)}`);
  assert.ok(covers.every((c) => c.TrangThai === 'Hoạt động'), 'the cover image must be active');
  return outcome;
});

await t('LC-CONC-10', 'Complaint processing: 6 parallel log entries → every success is logged once, status equals the latest entry', async () => {
  const customer = await registerCustomer(call, pool, 'cmpl');
  const created = await call('POST', '/complaints', {
    token: customer.token,
    body: { type: 'Dịch vụ', title: `Race ${RUN}`, content: 'Nhiều nhân viên cùng xử lý.' },
  });
  assert.equal(created.status, 201, created.text);
  const complaintId = created.body.complaint.id;
  const statuses = ['Đang xử lý', 'Đã giải quyết', 'Đang xử lý', 'Đã đóng', 'Đang xử lý', 'Đã giải quyết'];
  const results = await Promise.all(
    statuses.map((nextStatus, i) =>
      asStaff(
        i % 2 ? 'support' : 'admin',
        'POST',
        i % 2 ? `/support/complaints/${complaintId}/processings` : `/admin/complaints/${complaintId}/processings`,
        { content: `Diễn biến song song ${i}`, nextStatus },
      ),
    ),
  );
  const outcome = histogram(results.map(label));
  assert.equal(results.filter((r) => r.status >= 500).length, 0, JSON.stringify(outcome));
  const log = await rows(pool, 'SELECT XuLyID, TrangThaiSauXuLy FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID = @c ORDER BY NgayXuLy, XuLyID', { c: complaintId });
  assert.equal(log.length, results.filter((r) => r.status === 201).length, 'one log row per accepted request');
  const status = await scalar(pool, 'SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @c', { c: complaintId });
  assert.equal(status, log.at(-1).TrangThaiSauXuLy, 'complaint status must equal the latest log entry');
  return outcome;
});

await t('LC-CONC-11', 'Movie cast replacement: 6 parallel replacements → the final cast is exactly one submitted list', async () => {
  const genre = await one(pool, 'SELECT TOP 1 TheLoaiID FROM dbo.THELOAI ORDER BY TheLoaiID');
  const movie = await asStaff('admin', 'POST', '/admin/movies', {
    title: `E2E Cast Race ${RUN}`,
    durationMinutes: 100,
    releaseDate: new Date().toISOString().slice(0, 10),
    genreIds: [genre.TheLoaiID],
  });
  assert.equal(movie.status, 201, movie.text);
  const movieId = movie.body.movie.movieId;
  const actors = [];
  for (const name of ['A', 'B', 'C']) {
    const actor = await asStaff('admin', 'POST', '/admin/actors', { name: `E2E Cast ${name} ${RUN}` });
    assert.equal(actor.status, 201, actor.text);
    actors.push(actor.body.actor.DienVienID);
  }
  const [a, b, c] = actors;
  const lists = [
    [{ actorId: a, role: 'A1' }],
    [{ actorId: b, role: 'B1' }],
    [{ actorId: c, role: 'C1' }],
    [{ actorId: a, role: 'A2' }, { actorId: b, role: 'B2' }],
    [{ actorId: b, role: 'B3' }, { actorId: c, role: 'C3' }],
    [{ actorId: a, role: 'A4' }, { actorId: c, role: 'C4' }],
  ];
  const results = await Promise.all(lists.map((cast) => asStaff('admin', 'PUT', `/admin/movies/${movieId}/actors`, { cast })));
  const outcome = histogram(results.map(label));
  assert.equal(results.filter((r) => r.status >= 500).length, 0, JSON.stringify(outcome));
  const final = (await rows(pool, 'SELECT DienVienID, VaiDien FROM dbo.PHIM_DIENVIEN WHERE PhimID = @m ORDER BY DienVienID', { m: movieId })).map((r) => `${r.DienVienID}:${r.VaiDien}`);
  const candidates = lists.map((cast) => cast.map((x) => `${x.actorId}:${x.role}`).sort());
  assert.ok(candidates.some((list) => JSON.stringify(list) === JSON.stringify(final)), `cast is a mixture of submissions: ${final.join(',')}`);
  return outcome;
});

await t('LC-CONC-12', 'Room delete vs showtime create: no orphan, no 5xx; history turns the delete into a deactivation', async () => {
  const cinema = await asStaff('admin', 'POST', '/admin/cinemas', { name: `E2E RoomRace ${RUN}`, address: '2 Race St', city: 'Huế' });
  assert.equal(cinema.status, 201, cinema.text);
  const cinemaId = cinema.body.cinema.RapID;
  const room = await asStaff('admin', 'POST', '/admin/rooms', { cinemaId, name: `E2E Race Room ${RUN}`, type: '2D' });
  assert.equal(room.status, 201, room.text);
  const roomId = room.body.room.PhongID;
  const movie = await one(
    pool,
    `SELECT TOP 1 PhimID FROM dbo.PHIM WHERE TrangThai = N'Đang chiếu'
        AND (NgayKetThuc IS NULL OR NgayKetThuc > DATEADD(DAY, 120, CAST(dbo.fn_BayGio() AS DATE))) ORDER BY PhimID`,
  );
  const start = new Date(Date.now() + 45 * 86400000);
  start.setUTCMinutes(0, 0, 0);
  const results = await Promise.all([
    asStaff('admin', 'DELETE', `/admin/rooms/${roomId}`),
    asStaff('admin', 'POST', '/admin/showtimes', {
      movieId: movie.PhimID,
      roomId,
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + 2 * 3600000).toISOString(),
      format: '2D',
      basePrice: 70000,
    }),
  ]);
  const outcome = results.map(label);
  assert.ok(results.every((r) => r.status < 500), JSON.stringify(outcome));
  const roomRow = await one(pool, 'SELECT TrangThai FROM dbo.PHONGCHIEU WHERE PhongID = @r', { r: roomId });
  const showtimes = await scalar(pool, 'SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE PhongID = @r', { r: roomId });
  if (!roomRow) assert.equal(showtimes, 0, 'a showtime survived the deletion of its room');
  if (showtimes > 0) assert.equal(roomRow.TrangThai, 'Ngưng hoạt động', 'a room with showtime history must be deactivated, not left active');
  return { outcome, roomKept: Boolean(roomRow), showtimes };
});

await t('LC-CONC-13', 'Price update vs booking: a showtime with an order never changes price afterwards', async () => {
  const show = await privateShowtime();
  const [seat] = await freeSeatIds(show.showtimeId, 1);
  const customer = await registerCustomer(call, pool, 'meta');
  const format = await scalar(pool, 'SELECT DinhDang FROM dbo.SUATCHIEU WHERE SuatChieuID = @s', { s: show.showtimeId });
  const [update, booking] = await Promise.all([
    asStaff('admin', 'PUT', `/admin/showtimes/${show.showtimeId}`, {
      movieId: show.movieId,
      startsAt: show.startsAt.toISOString(),
      endsAt: show.endsAt.toISOString(),
      format,
      basePrice: 140000,
      status: 'Mở bán',
    }),
    book(customer, show.showtimeId, [seat]),
  ]);
  assert.ok(update.status < 500 && booking.status < 500, `${label(update)} / ${label(booking)}`);
  if (booking.status === 201) {
    const ticket = await one(pool, 'SELECT GiaVe FROM dbo.CHITIETVE WHERE DonDatVeID = @o', { o: booking.body.booking.id });
    const expected = await scalar(pool, 'SELECT dbo.fn_TinhGiaVe(@s, @g)', { s: show.showtimeId, g: seat });
    assert.equal(money(ticket.GiaVe), money(expected), 'ticket price must equal the showtime price that is current after the race');
    if (update.status === 409) assert.equal(update.body.error.code, 'SHOWTIME_HAS_ORDERS');
  }
  return { update: label(update), booking: label(booking) };
});

// ====================================================================== EXPIRY
async function pendingOrder(tag, { promotionCode } = {}) {
  const show = await privateShowtime();
  const seats = await freeSeatIds(show.showtimeId, 2);
  const customer = await registerCustomer(call, pool, tag);
  const booked = await book(customer, show.showtimeId, seats, promotionCode ? { promotionCode } : {});
  assert.equal(booked.status, 201, booked.text);
  return { show, seats, customer, orderId: booked.body.booking.id };
}
/** Test-only time travel on the TEST database: the hold deadline is moved into the past. */
async function expireHold(orderId) {
  await assertTestDatabase(pool);
  await pool.request().input('o', orderId).query(
    `UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(MINUTE, -5, dbo.fn_BayGio()) WHERE DonDatVeID = @o AND TrangThai = N'Chờ thanh toán'`,
  );
}

await t('LC-EXP-01', 'Elapsed hold: seats are free again immediately, payment is refused, another customer can book them', async () => {
  const { show, seats, customer, orderId } = await pendingOrder('exp');
  const before = await call('GET', `/showtimes/${show.showtimeId}/seats`);
  assert.ok(seats.every((id) => before.body.seats.find((s) => s.id === id).status === 'Đang giữ'));
  await expireHold(orderId);
  const after = await call('GET', `/showtimes/${show.showtimeId}/seats`);
  assert.ok(seats.every((id) => after.body.seats.find((s) => s.id === id).status === 'Trống'), 'seats must be bookable once the hold elapsed');
  const payment = await call('POST', `/orders/${orderId}/payments`, { token: customer.token, body: { paymentMethod: 'VNPAY' } });
  assert.equal(payment.status, 409, payment.text);
  assert.notEqual(
    await scalar(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @o', { o: orderId }),
    'Đã thanh toán',
  );
  const other = await registerCustomer(call, pool, 'expother');
  const rebook = await book(other, show.showtimeId, seats);
  assert.equal(rebook.status, 201, rebook.text);
  const active = await activeTickets(show.showtimeId);
  assert.equal(active.length, 2);
  assert.ok(active.every((x) => x.NguoiDungID === other.id));
  return { paymentAfterExpiry: payment.body.error.code, rebookedOrder: rebook.body.booking.id };
});

await t('LC-EXP-02', 'Background job (expirePendingOrders, 60 s tick) moves the elapsed order to Hết hạn and releases the promotion', async () => {
  const code = 'DEMO10';
  const promoBefore = await scalar(pool, 'SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE MaCode = @c', { c: code });
  const { customer, orderId } = await pendingOrder('job', { promotionCode: code });
  const usedWithOrder = await scalar(pool, 'SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE MaCode = @c', { c: code });
  assert.equal(usedWithOrder, promoBefore + 1);
  // Other pending orders holding the same code may elapse while this test waits for the 60 s job tick;
  // each of them releases one use too, so the expected release is counted, not assumed to be one.
  const othersPending = (
    await rows(
      pool,
      `SELECT d.DonDatVeID FROM dbo.DONDATVE d JOIN dbo.KHUYENMAI k ON k.KhuyenMaiID = d.KhuyenMaiID
        WHERE k.MaCode = @c AND d.TrangThai = N'Chờ thanh toán' AND d.DonDatVeID <> @o`,
      { c: code, o: orderId },
    )
  ).map((r) => r.DonDatVeID);
  await expireHold(orderId);
  const deadline = Date.now() + 90000;
  let status;
  while (Date.now() < deadline) {
    status = await scalar(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @o', { o: orderId });
    if (status === 'Hết hạn') break;
    await sleep(2000);
  }
  assert.equal(status, 'Hết hạn', 'the real background job did not expire the order within 90 s');
  const order = await one(pool, 'SELECT HanGiuCho, TienGiamGia FROM dbo.DONDATVE WHERE DonDatVeID = @o', { o: orderId });
  assert.ok(order.HanGiuCho === null || new Date(order.HanGiuCho) <= new Date());
  const usedAfter = await scalar(pool, 'SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE MaCode = @c', { c: code });
  const othersExpired = othersPending.length
    ? Number(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai = N'Hết hạn' AND DonDatVeID IN (${othersPending.join(',')})`,
        ),
      )
    : 0;
  assert.equal(
    usedAfter,
    usedWithOrder - 1 - othersExpired,
    'promotion use must be released when the order expires',
  );
  const tickets = await rows(pool, 'SELECT TrangThai FROM dbo.CHITIETVE WHERE DonDatVeID = @o', { o: orderId });
  assert.ok(tickets.length === 2 && tickets.every((x) => x.TrangThai === 'Đã hủy'), JSON.stringify(tickets));
  const detail = await call('GET', `/orders/${orderId}`, { token: customer.token });
  assert.equal(detail.body.order.status, 'Hết hạn');
  return { status, promotionUsage: { before: promoBefore, withOrder: usedWithOrder, after: usedAfter, othersExpired } };
});

// ====================================================================== COMPENSATED CANCELLATION
await t('LC-CMP-01', 'Cancel is refused while an unexpired hold exists (409 SHOWTIME_HAS_HELD_ORDERS) and nothing changes', async () => {
  const { show, orderId } = await pendingOrder('hold');
  const cancel = await asStaff('admin', 'POST', `/admin/showtimes/${show.showtimeId}/cancel`, {});
  assert.equal(cancel.status, 409, cancel.text);
  assert.equal(cancel.body.error.code, 'SHOWTIME_HAS_HELD_ORDERS');
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @s', { s: show.showtimeId }), 'Mở bán');
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @o', { o: orderId }), 'Chờ thanh toán');
});

const comp = {};
await t('LC-CMP-02', 'Paid order + cancelled showtime: order Đã hủy, tickets Đã hủy, points credited once, payment history kept', async () => {
  const show = await privateShowtime();
  const seats = await freeSeatIds(show.showtimeId, 2);
  const product = await cheapProduct();
  const customer = await registerCustomer(call, pool, 'comp');
  const promoCode = 'DEMO20K'; // fixed 20.000 off, minimum order 100.000
  const booked = await book(customer, show.showtimeId, seats, { products: [{ productId: product.id, quantity: 2 }], promotionCode: promoCode });
  assert.equal(booked.status, 201, booked.text);
  const orderId = booked.body.booking.id;
  const attempt = await call('POST', `/orders/${orderId}/payments`, { token: customer.token, body: { paymentMethod: 'MOMO' } });
  assert.equal(attempt.status, 201);
  const paid = await call('POST', `/orders/${orderId}/payments/${attempt.body.payment.id}/result`, { token: customer.token, body: { status: 'Thành công' } });
  assert.equal(paid.status, 200, paid.text);

  const order = await one(pool, 'SELECT TongTienVe, TongTienDoAn, TienGiamGia, KhuyenMaiID FROM dbo.DONDATVE WHERE DonDatVeID = @o', { o: orderId });
  const ticketTotal = money(order.TongTienVe);
  const foodTotal = money(order.TongTienDoAn);
  const discount = money(order.TienGiamGia);
  // Independent oracle of the documented rule (1.000 VND = 1 point on the ticket share after discount).
  const discountOnTickets = discount * ticketTotal / (ticketTotal + foodTotal);
  const expectedPoints = Math.floor(Math.max(0, ticketTotal - discountOnTickets) / 1000);
  const pointsBefore = (await scalar(pool, 'SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @u', { u: customer.id })) ?? 0;
  const promoBefore = await scalar(pool, 'SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @k', { k: order.KhuyenMaiID });
  const seatMapBefore = await call('GET', `/showtimes/${show.showtimeId}/seats`);

  const cancel = await asStaff('manager', 'POST', `/manager/showtimes/${show.showtimeId}/cancel`, {});
  // the managed cinema may not own this room: fall back to Admin (same procedure, same rules)
  const effective = cancel.status === 200 ? cancel : await asStaff('admin', 'POST', `/admin/showtimes/${show.showtimeId}/cancel`, {});
  assert.equal(effective.status, 200, effective.text);

  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @s', { s: show.showtimeId }), 'Đã hủy');
  const after = await one(pool, 'SELECT TrangThai, ThongBaoHuy, LyDoHuy FROM dbo.DONDATVE WHERE DonDatVeID = @o', { o: orderId });
  assert.equal(after.TrangThai, 'Đã hủy');
  assert.match(after.ThongBaoHuy ?? '', /bồi thường/);
  const tickets = await rows(pool, 'SELECT TrangThai FROM dbo.CHITIETVE WHERE DonDatVeID = @o', { o: orderId });
  assert.ok(tickets.length === 2 && tickets.every((x) => x.TrangThai === 'Đã hủy'));
  const credits = await rows(pool, 'SELECT DiemBoiThuong FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID = @o', { o: orderId });
  assert.equal(credits.length, 1, 'exactly one compensation row');
  assert.equal(credits[0].DiemBoiThuong, expectedPoints, 'compensation points');
  const pointsAfter = await scalar(pool, 'SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @u', { u: customer.id });
  assert.equal(pointsAfter, pointsBefore + expectedPoints, 'loyalty balance');
  const payments = await rows(pool, 'SELECT TrangThai FROM dbo.THANHTOAN WHERE DonDatVeID = @o', { o: orderId });
  assert.deepEqual(payments.map((p) => p.TrangThai), ['Thành công'], 'payment history must be untouched');
  const promoAfter = await scalar(pool, 'SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @k', { k: order.KhuyenMaiID });
  assert.equal(promoAfter, promoBefore - 1, 'promotion use released');
  const detail = await call('GET', `/orders/${orderId}`, { token: customer.token });
  assert.equal(detail.body.order.status, 'Đã hủy');
  assert.equal(detail.body.order.compensation?.points, expectedPoints);

  // idempotent: cancelling again changes nothing and never pays twice
  const again = await asStaff('admin', 'POST', `/admin/showtimes/${show.showtimeId}/cancel`, {});
  assert.equal(again.status, 200);
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID = @o', { o: orderId }), 1);
  assert.equal(await scalar(pool, 'SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @u', { u: customer.id }), pointsAfter);
  assert.ok(seatMapBefore.status === 200);
  comp.orderId = orderId;
  comp.customer = customer;
  comp.points = expectedPoints;
  return { ticketTotal, foodTotal, discount, points: expectedPoints, viaManager: cancel.status === 200 };
});

await t('LC-CMP-03', 'Cancel races: 4 parallel cancels of a paid showtime credit points exactly once', async () => {
  const show = await privateShowtime();
  const seats = await freeSeatIds(show.showtimeId, 1);
  const customer = await registerCustomer(call, pool, 'cmp2');
  const booked = await book(customer, show.showtimeId, seats);
  assert.equal(booked.status, 201);
  const orderId = booked.body.booking.id;
  const attempt = await call('POST', `/orders/${orderId}/payments`, { token: customer.token, body: { paymentMethod: 'VNPAY' } });
  await call('POST', `/orders/${orderId}/payments/${attempt.body.payment.id}/result`, { token: customer.token, body: { status: 'Thành công' } });
  const results = await Promise.all(Array.from({ length: 4 }, () => asStaff('admin', 'POST', `/admin/showtimes/${show.showtimeId}/cancel`, {})));
  assert.ok(results.every((r) => r.status === 200), JSON.stringify(histogram(results.map(label))));
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID = @o', { o: orderId }), 1);
  const expected = Math.floor(money(await scalar(pool, 'SELECT TongTienVe FROM dbo.DONDATVE WHERE DonDatVeID = @o', { o: orderId })) / 1000);
  assert.equal(await scalar(pool, 'SELECT SUM(DiemBoiThuong) FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID = @o', { o: orderId }), expected);
  return { cancels: histogram(results.map(label)) };
});

await runIntegrityChecks(pool, reporter, { prefix: 'POST-' });
backend.stop();
await pool.close();
const summary = reporter.finish({ run: RUN, holdLimit: HOLD_LIMIT, compensation: comp.points === undefined ? null : { orderId: comp.orderId, points: comp.points } });
process.exit(summary.failed === 0 ? 0 : 1);

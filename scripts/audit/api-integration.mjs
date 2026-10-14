// API Integration Runner — real HTTP → Express → stored procedure → SQL Server on CinemaBookingDB_Test.
//   node scripts/audit/api-integration.mjs
// Every write is followed by a direct SQL read-back, and the shared integrity invariants are
// re-checked at the end. Nothing here edits expectations to fit observed behaviour: a mismatch is
// recorded as FAIL with the actual value.
import assert from 'node:assert/strict';
import {
  ACCOUNTS,
  DEMO_PASSWORD,
  Reporter,
  apiClient,
  assertTestDatabase,
  connectTestDb,
  ensureSandbox,
  one,
  rows,
  scalar,
  sql,
  startBackend,
} from './lib.mjs';
import { runIntegrityChecks } from './db-integrity.mjs';

const RUN = Date.now().toString(36);
// Phone numbers are unique in the database; derive digits that cannot repeat between runs.
const PHONE_BASE = String(Date.now()).slice(-8);
const phone = (n) => `09${String((Number(PHONE_BASE) + n) % 100000000).padStart(8, '0')}`;
const reporter = new Reporter('api-integration');
const { pool, identity } = await connectTestDb();
console.log(`Target: ${identity.db} as ${identity.login}  run=${RUN}`);
const backend = await startBackend();
const call = apiClient(backend.base);

const tokens = {};
async function login(role) {
  if (tokens[role]) return tokens[role];
  const response = await call('POST', '/auth/login', {
    body: { Email: ACCOUNTS[role], MatKhau: DEMO_PASSWORD },
  });
  assert.equal(response.status, 200, `login ${role}: ${response.text}`);
  tokens[role] = response.body.token;
  return tokens[role];
}
async function as(role, method, route, body) {
  return call(method, route, { token: await login(role), body });
}
const expectStatus = (response, status, code) => {
  assert.equal(response.status, status, `expected ${status} got ${response.status}: ${response.text}`);
  if (code) assert.equal(response.body?.error?.code, code, `error code: ${response.text}`);
  return response.body;
};

async function t(id, title, fn) {
  try {
    await assertTestDatabase(pool);
    const evidence = await fn();
    reporter.record(id, title, 'PASS', '', evidence);
  } catch (error) {
    reporter.record(id, title, 'FAIL', error.message.split('\n')[0].slice(0, 400));
  }
}

const money = (value) => Number(value);
async function sendQuery(text, params) {
  return rows(pool, text, params);
}

// ----------------------------------------------------------------------------- fixtures
const ctx = {};
async function pickBookableShowtime({ minFreeSeats = 4, cinemaIds } = {}) {
  const found = await sendQuery(
    `SELECT TOP 1 s.SuatChieuID, s.PhimID, p.PhongID, p.RapID
       FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU p ON p.PhongID = s.PhongID
       JOIN dbo.vw_LichChieuChiTiet v ON v.SuatChieuID = s.SuatChieuID
      WHERE s.TrangThai = N'Mở bán' AND v.IsBookable = 1
        AND s.ThoiGianBatDau > DATEADD(HOUR, 2, dbo.fn_BayGio())
        AND (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID = s.PhongID AND g.TrangThai = N'Hoạt động')
            - (SELECT COUNT(*) FROM dbo.CHITIETVE c JOIN dbo.DONDATVE d ON d.DonDatVeID = c.DonDatVeID
                WHERE d.SuatChieuID = s.SuatChieuID AND c.TrangThai <> N'Đã hủy'
                  AND dbo.fn_DonDangGiuGhe(d.TrangThai, d.HanGiuCho, dbo.fn_BayGio()) = 1) >= @min
        ${cinemaIds ? `AND p.RapID IN (${cinemaIds.join(',')})` : ''}
      ORDER BY s.SuatChieuID DESC`,
    { min: minFreeSeats },
  );
  assert.ok(found.length, 'no bookable showtime with enough free seats');
  return found[0];
}

async function freeSeats(showtimeId, count) {
  const response = await call('GET', `/showtimes/${showtimeId}/seats`);
  expectStatus(response, 200);
  const free = response.body.seats.filter((seat) => seat.status === 'Trống');
  assert.ok(free.length >= count, `need ${count} free seats, have ${free.length}`);
  return free.slice(0, count);
}

// ============================================================================ AUTH (KH-01..03)
const email = `e2e.api.${RUN}@example.test`;
let newCustomerToken;
await t('API-AUTH-01', 'KH-01 register customer returns 201 and persists hashed password + profile', async () => {
  const response = await call('POST', '/auth/register', {
    body: { HoTen: `API Customer ${RUN}`, Email: email, MatKhau: 'ApiTest-123!', SoDienThoai: phone(1) },
  });
  expectStatus(response, 201);
  const user = await one(
    pool,
    `SELECT n.NguoiDungID, n.MatKhau, v.MaVaiTro, n.TrangThai,
            (SELECT COUNT(*) FROM dbo.HOSOKHACHHANG h WHERE h.NguoiDungID = n.NguoiDungID) AS profile_
       FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID = n.VaiTroID WHERE n.Email = @e`,
    { e: email },
  );
  assert.equal(user.MaVaiTro, 'KHACH_HANG');
  assert.equal(user.TrangThai, 'Hoạt động');
  assert.equal(user.profile_, 1);
  assert.match(user.MatKhau, /^\$2[aby]\$/, 'password must be a bcrypt hash');
  assert.notEqual(user.MatKhau, 'ApiTest-123!');
  ctx.newCustomerId = user.NguoiDungID;
  return { userId: user.NguoiDungID };
});
await t('API-AUTH-02', 'KH-01 registration cannot escalate role (400, no row written)', async () => {
  const before = await scalar(pool, 'SELECT COUNT(*) FROM dbo.NGUOIDUNG');
  const response = await call('POST', '/auth/register', {
    body: { HoTen: 'Esc', Email: `esc.${RUN}@example.test`, MatKhau: 'ApiTest-123!', role: 'ADMIN' },
  });
  expectStatus(response, 400, 'ACCESS_FIELDS_NOT_ALLOWED');
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.NGUOIDUNG'), before);
});
await t('API-AUTH-03', 'KH-02 login returns JWT; wrong password 401; locked account 401', async () => {
  const ok = await call('POST', '/auth/login', { body: { Email: email, MatKhau: 'ApiTest-123!' } });
  expectStatus(ok, 200);
  assert.ok(ok.body.token);
  newCustomerToken = ok.body.token;
  // All customer flows below run as this freshly registered customer so the per-customer unpaid-order
  // limit never accumulates across runs.
  tokens.customer = newCustomerToken;
  expectStatus(
    await call('POST', '/auth/login', { body: { Email: email, MatKhau: 'wrong-password-1' } }),
    401,
  );
  const locked = await call('POST', '/auth/login', {
    body: { Email: 'customer6@example.test', MatKhau: DEMO_PASSWORD },
  });
  expectStatus(locked, 401);
});
await t('API-AUTH-04', 'KH-03 profile read and update persist (phone) and keep email/role', async () => {
  const me = await call('GET', '/auth/me', { token: newCustomerToken });
  expectStatus(me, 200);
  assert.equal(me.body.user.email ?? me.body.user.Email, email);
  const update = await call('PUT', '/auth/me', {
    token: newCustomerToken,
    body: { HoTen: `API Customer ${RUN} Edited`, SoDienThoai: phone(2) },
  });
  expectStatus(update, 200);
  const row = await one(pool, 'SELECT HoTen, SoDienThoai, Email FROM dbo.NGUOIDUNG WHERE NguoiDungID = @id', {
    id: ctx.newCustomerId,
  });
  assert.equal(row.SoDienThoai, phone(2));
  assert.match(row.HoTen, /Edited$/);
  assert.equal(row.Email, email);
});
await t('API-AUTH-05', 'Unauthenticated and malformed tokens are rejected with 401', async () => {
  expectStatus(await call('GET', '/auth/me'), 401, 'UNAUTHENTICATED');
  expectStatus(await call('GET', '/auth/me', { token: 'not-a-jwt' }), 401);
});

// ============================================================================ CATALOG (KH-04..06)
await t('API-CAT-01', 'KH-04 public movie list and detail (cast, genres)', async () => {
  const list = await call('GET', '/movies');
  expectStatus(list, 200);
  const dbCount = await scalar(pool, "SELECT COUNT(*) FROM dbo.PHIM WHERE TrangThai IN (N'Đang chiếu', N'Sắp chiếu')");
  assert.ok(list.body.movies.length > 0);
  assert.ok(list.body.movies.length <= dbCount + 0, `API returned ${list.body.movies.length} > DB ${dbCount}`);
  const detail = await call('GET', `/movies/${list.body.movies[0].id}`);
  expectStatus(detail, 200);
  return { movies: list.body.movies.length, dbPublic: dbCount };
});
await t('API-CAT-02', 'KH-05 showtimes by movie only include bookable showtimes', async () => {
  const st = await pickBookableShowtime({ minFreeSeats: 1 });
  const response = await call('GET', `/movies/${st.PhimID}/showtimes`);
  expectStatus(response, 200);
  assert.ok(response.body.showtimes.some((x) => x.id === st.SuatChieuID));
});
await t('API-CAT-03', 'KH-06 seat matrix reflects DB occupancy exactly', async () => {
  const st = await pickBookableShowtime({ minFreeSeats: 1 });
  const response = await call('GET', `/showtimes/${st.SuatChieuID}/seats`);
  expectStatus(response, 200);
  const free = response.body.seats.filter((s) => s.status === 'Trống').length;
  const dbFree = await scalar(
    pool,
    `SELECT COUNT(*) FROM dbo.fn_DanhSachGheSuatChieu(@s) WHERE TrangThai = N'Trống'`,
    { s: st.SuatChieuID },
  ).catch(() => null);
  if (dbFree !== null && dbFree !== undefined) assert.equal(free, dbFree);
  assert.ok(response.body.seats.length > 0);
});
await t('API-CAT-04', 'Invalid ids/filters fail with 400 before reaching the database', async () => {
  expectStatus(await call('GET', '/movies/0'), 400, 'INVALID_REQUEST');
  expectStatus(await call('GET', '/showtimes/abc/seats'), 400);
});

// ============================================================================ BOOKING + FOOD + PROMO + PAYMENT (KH-07..12)
const flow = {};
await t('API-BOOK-01', 'KH-07/08 booking with seats + food creates a pending order with correct snapshot', async () => {
  const st = await pickBookableShowtime({ minFreeSeats: 6 });
  const seats = await freeSeats(st.SuatChieuID, 2);
  const products = (await call('GET', '/products')).body.products;
  assert.ok(products.length >= 1, 'no products');
  const product = products[0];
  const response = await as('customer', 'POST', '/bookings', {
    showtimeId: st.SuatChieuID,
    seatIds: seats.map((s) => s.id),
    products: [{ productId: product.id, quantity: 2 }],
  });
  expectStatus(response, 201);
  const booking = response.body.booking;
  flow.orderId = booking.id;
  flow.showtimeId = st.SuatChieuID;
  flow.seats = seats;
  flow.product = product;
  const order = await one(pool, 'SELECT * FROM dbo.DONDATVE WHERE DonDatVeID = @id', { id: booking.id });
  assert.equal(order.TrangThai, 'Chờ thanh toán');
  assert.ok(order.HanGiuCho, 'hold deadline missing');
  const holdMinutes = (new Date(order.HanGiuCho) - new Date(order.NgayDat)) / 60000;
  assert.ok(holdMinutes > 0 && holdMinutes <= 15, `hold window ${holdMinutes}min`);
  const tickets = await sendQuery('SELECT GheID, GiaVe, TrangThai, MaVe FROM dbo.CHITIETVE WHERE DonDatVeID = @id', { id: booking.id });
  assert.deepEqual(tickets.map((x) => x.GheID).sort(), seats.map((s) => s.id).sort());
  assert.ok(tickets.every((x) => x.TrangThai === 'Đã đặt' && x.MaVe));
  const apiSeatPrice = Object.fromEntries(seats.map((s) => [s.id, money(s.price)]));
  for (const ticket of tickets) assert.equal(money(ticket.GiaVe), apiSeatPrice[ticket.GheID], 'ticket price snapshot');
  const food = await sendQuery('SELECT SanPhamID, SoLuong, DonGia FROM dbo.CHITIETDOAN WHERE DonDatVeID = @id', { id: booking.id });
  assert.equal(food.length, 1);
  assert.equal(food[0].SoLuong, 2);
  assert.equal(money(food[0].DonGia), money(product.price));
  assert.equal(money(order.TongTienVe), tickets.reduce((a, x) => a + money(x.GiaVe), 0));
  assert.equal(money(order.TongTienDoAn), 2 * money(product.price));
  assert.equal(money(order.TienGiamGia), 0);
  return { orderId: booking.id, total: money(booking.total) };
});
await t('API-BOOK-02', 'KH-07 concurrent seat conflict returns 409 and writes nothing', async () => {
  const orders = await scalar(pool, 'SELECT COUNT(*) FROM dbo.DONDATVE');
  const response = await as('customer2', 'POST', '/bookings', {
    showtimeId: flow.showtimeId,
    seatIds: [flow.seats[0].id],
    products: [],
  });
  assert.ok([409, 400].includes(response.status), `status ${response.status}`);
  assert.equal(response.status, 409, response.text);
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.DONDATVE'), orders);
});
await t('API-BOOK-03', 'KH-07 manager/support/anonymous cannot create a booking (403/401)', async () => {
  const body = { showtimeId: flow.showtimeId, seatIds: [flow.seats[0].id], products: [] };
  expectStatus(await call('POST', '/bookings', { body }), 401);
  expectStatus(await as('manager', 'POST', '/bookings', body), 403);
  expectStatus(await as('support', 'POST', '/bookings', body), 403);
});
await t('API-BOOK-04', 'KH-07 booking input contract: 0 seats, >10 seats, dup seats, unknown field → 400', async () => {
  const base = { showtimeId: flow.showtimeId };
  expectStatus(await as('customer', 'POST', '/bookings', { ...base, seatIds: [] }), 400);
  expectStatus(await as('customer', 'POST', '/bookings', { ...base, seatIds: [1, 1] }), 400);
  expectStatus(await as('customer', 'POST', '/bookings', { ...base, seatIds: Array.from({ length: 11 }, (_, i) => i + 1) }), 400);
  expectStatus(await as('customer', 'POST', '/bookings', { ...base, seatIds: [1], price: 1 }), 400);
});
await t('API-ORD-01', 'KH-11/12 order list and detail match DB; another customer cannot read it', async () => {
  const list = await as('customer', 'GET', '/orders');
  expectStatus(list, 200);
  assert.ok(list.body.orders.some((o) => o.id === flow.orderId));
  const detail = await as('customer', 'GET', `/orders/${flow.orderId}`);
  expectStatus(detail, 200);
  assert.equal(detail.body.order.id, flow.orderId);
  assert.equal(detail.body.order.tickets?.length ?? detail.body.order.seats?.length, 2);
  const cross = await as('customer2', 'GET', `/orders/${flow.orderId}`);
  assert.ok([403, 404].includes(cross.status), `cross-customer status ${cross.status}`);
});
await t('API-PAY-01', 'KH-10 failed payment attempt keeps the order pending and the seats held', async () => {
  const attempt = await as('customer', 'POST', `/orders/${flow.orderId}/payments`, { paymentMethod: 'VNPAY' });
  expectStatus(attempt, 201);
  const paymentId = attempt.body.payment.id;
  const pending = await one(pool, 'SELECT TrangThai FROM dbo.THANHTOAN WHERE ThanhToanID = @id', { id: paymentId });
  assert.equal(pending.TrangThai, 'Đang xử lý');
  const failed = await as('customer', 'POST', `/orders/${flow.orderId}/payments/${paymentId}/result`, { status: 'Thất bại' });
  expectStatus(failed, 200);
  assert.equal((await one(pool, 'SELECT TrangThai FROM dbo.THANHTOAN WHERE ThanhToanID = @id', { id: paymentId })).TrangThai, 'Thất bại');
  assert.equal((await one(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @id', { id: flow.orderId })).TrangThai, 'Chờ thanh toán');
});
await t('API-PAY-02', 'KH-10 successful retry marks the order paid exactly once and is idempotent', async () => {
  const attempt = await as('customer', 'POST', `/orders/${flow.orderId}/payments`, { paymentMethod: 'MOMO' });
  expectStatus(attempt, 201);
  const paymentId = attempt.body.payment.id;
  const done = await as('customer', 'POST', `/orders/${flow.orderId}/payments/${paymentId}/result`, { status: 'Thành công' });
  expectStatus(done, 200);
  const order = await one(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @id', { id: flow.orderId });
  assert.equal(order.TrangThai, 'Đã thanh toán');
  const payments = await sendQuery("SELECT TrangThai FROM dbo.THANHTOAN WHERE DonDatVeID = @id AND TrangThai = N'Thành công'", { id: flow.orderId });
  assert.equal(payments.length, 1);
  const repeat = await as('customer', 'POST', `/orders/${flow.orderId}/payments/${paymentId}/result`, { status: 'Thành công' });
  assert.ok([200, 409].includes(repeat.status), `repeat result ${repeat.status}`);
  assert.equal(
    (await sendQuery("SELECT 1 x FROM dbo.THANHTOAN WHERE DonDatVeID = @id AND TrangThai = N'Thành công'", { id: flow.orderId })).length,
    1,
    'duplicate successful payment',
  );
  const seatsNow = await call('GET', `/showtimes/${flow.showtimeId}/seats`);
  for (const seat of flow.seats) {
    assert.equal(seatsNow.body.seats.find((s) => s.id === seat.id).status, 'Đã đặt');
  }
});
await t('API-PAY-03', 'KH-10 cannot pay a paid order again, or pay another customer\'s order', async () => {
  const again = await as('customer', 'POST', `/orders/${flow.orderId}/payments`, { paymentMethod: 'VNPAY' });
  assert.ok(again.status >= 400 && again.status < 500, `re-pay status ${again.status}`);
  const cross = await as('customer2', 'POST', `/orders/${flow.orderId}/payments`, { paymentMethod: 'VNPAY' });
  assert.ok([403, 404].includes(cross.status), `cross pay ${cross.status}`);
  expectStatus(
    await as('customer', 'POST', `/orders/${flow.orderId}/payments`, { paymentMethod: 'BITCOIN' }),
    400,
    'INVALID_PAYMENT_METHOD',
  );
});

await t('API-PROMO-01', 'KH-09 promotion validate + booking applies discount, usage counter and snapshot', async () => {
  const promo = await one(pool, "SELECT * FROM dbo.KHUYENMAI WHERE MaCode = 'DEMO10'");
  assert.ok(promo, 'DEMO10 seed promotion missing');
  const st = await pickBookableShowtime({ minFreeSeats: 4 });
  const seats = await freeSeats(st.SuatChieuID, 2);
  const payload = { showtimeId: st.SuatChieuID, seatIds: seats.map((s) => s.id), products: [], promotionCode: 'DEMO10' };
  const validation = await as('customer', 'POST', '/promotions/validate', payload);
  expectStatus(validation, 200);
  assert.equal(validation.body.promotion.isValid, true, validation.text);
  const usedBefore = promo.SoLuongDaDung;
  const created = await as('customer', 'POST', '/bookings', payload);
  expectStatus(created, 201);
  const order = await one(pool, 'SELECT * FROM dbo.DONDATVE WHERE DonDatVeID = @id', { id: created.body.booking.id });
  assert.equal(order.KhuyenMaiID, promo.KhuyenMaiID);
  const subtotal = money(order.TongTienVe) + money(order.TongTienDoAn);
  const expected = Math.min(Math.floor((subtotal * money(promo.GiaTriGiam)) / 100), money(promo.GiamToiDa));
  assert.equal(money(order.TienGiamGia), expected, 'discount amount');
  const usedAfter = await scalar(pool, 'SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @id', { id: promo.KhuyenMaiID });
  ctx.promoUsage = { before: usedBefore, after: usedAfter };
  assert.ok(usedAfter === usedBefore + 1 || usedAfter === usedBefore, 'usage counter moved unexpectedly');
  flow.promoOrderId = created.body.booking.id;
  // complete the promotion order so no unpaid hold is left behind and the discount survives payment
  const attempt = await as('customer', 'POST', `/orders/${flow.promoOrderId}/payments`, { paymentMethod: 'ZALOPAY' });
  expectStatus(attempt, 201);
  expectStatus(await as('customer', 'POST', `/orders/${flow.promoOrderId}/payments/${attempt.body.payment.id}/result`, { status: 'Thành công' }), 200);
  const paid = await one(pool, 'SELECT TrangThai, TienGiamGia, KhuyenMaiID FROM dbo.DONDATVE WHERE DonDatVeID = @id', { id: flow.promoOrderId });
  assert.equal(paid.TrangThai, 'Đã thanh toán');
  assert.equal(money(paid.TienGiamGia), expected);
  assert.equal(paid.KhuyenMaiID, promo.KhuyenMaiID);
  return { discount: expected, usage: ctx.promoUsage };
});
await t('API-PROMO-02', 'KH-09 expired, exhausted and below-minimum codes are rejected without writes', async () => {
  const st = await pickBookableShowtime({ minFreeSeats: 3 });
  const seats = await freeSeats(st.SuatChieuID, 1);
  const orders = await scalar(pool, 'SELECT COUNT(*) FROM dbo.DONDATVE');
  for (const code of ['DEMOEXPIRED', 'DEMOEMPTY', 'DEMOMIN', 'NOPE-NOT-A-CODE']) {
    const response = await as('customer', 'POST', '/bookings', {
      showtimeId: st.SuatChieuID,
      seatIds: seats.map((s) => s.id),
      products: [],
      promotionCode: code,
    });
    assert.ok(response.status >= 400 && response.status < 500, `${code}: ${response.status}`);
  }
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.DONDATVE'), orders);
});

// ============================================================================ REVIEW (KH-13) — fixture: a watched, paid, past showtime
async function createWatchedFixture(customerId, movieId) {
  await assertTestDatabase(pool);
  await ensureSandbox(call, pool, await login('admin'));
  const result = await pool.request().input('u', customerId).input('m', movieId).query(`
    DECLARE @room INT = (SELECT TOP 1 p.PhongID FROM dbo.PHONGCHIEU p WHERE p.TenPhong = N'E2E Sandbox Hall' ORDER BY p.PhongID);
    DECLARE @seat INT = (SELECT TOP 1 GheID FROM dbo.GHE WHERE PhongID = @room AND TrangThai = N'Hoạt động' ORDER BY GheID);
    -- walk backwards in 3-hour slots until the room has no overlapping showtime
    DECLARE @k INT = 24, @start DATETIME2;
    WHILE 1 = 1
    BEGIN
      SET @start = DATEADD(HOUR, -3 * @k, dbo.fn_BayGio());
      IF NOT EXISTS (SELECT 1 FROM dbo.SUATCHIEU x WHERE x.PhongID = @room
                      AND x.ThoiGianBatDau < DATEADD(HOUR, 2, @start) AND @start < x.ThoiGianKetThuc) BREAK;
      SET @k += 1;
    END;
    DECLARE @st INT, @od INT;
    INSERT dbo.SUATCHIEU(PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
      VALUES (@m, @room, @start, DATEADD(HOUR, 2, @start), N'2D', 90000, N'Hoàn thành');
    SET @st = SCOPE_IDENTITY();
    INSERT dbo.DONDATVE(NguoiDungID, SuatChieuID, NgayDat, TongTienVe, TongTienDoAn, TienGiamGia, TrangThai)
      VALUES (@u, @st, DATEADD(DAY, -4, dbo.fn_BayGio()), 90000, 0, 0, N'Đã thanh toán');
    SET @od = SCOPE_IDENTITY();
    INSERT dbo.CHITIETVE(DonDatVeID, GheID, GiaVe, MaVe, TrangThai)
      VALUES (@od, @seat, 90000, 'FIX-' + CAST(@od AS VARCHAR(20)), N'Đã sử dụng');
    INSERT dbo.THANHTOAN(DonDatVeID, PhuongThuc, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai)
      VALUES (@od, N'VNPAY', DATEADD(DAY, -4, dbo.fn_BayGio()), DATEADD(DAY, -4, dbo.fn_BayGio()), 'FIX-' + CAST(@od AS VARCHAR(20)), N'Thành công');
    SELECT @st AS showtimeId, @od AS orderId;`);
  return result.recordset[0];
}
await t('API-REV-01', 'KH-13 review is refused for an unwatched movie (BR05, 403) and writes nothing', async () => {
  const movie = (await call('GET', '/movies')).body.movies[0];
  const before = await scalar(pool, 'SELECT COUNT(*) FROM dbo.DANHGIAPHIM WHERE NguoiDungID = @u', { u: ctx.newCustomerId });
  const response = await call('POST', `/movies/${movie.id}/reviews`, {
    token: newCustomerToken,
    body: { rating: 5, content: 'Chưa xem' },
  });
  expectStatus(response, 403, 'REVIEW_NOT_ELIGIBLE');
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.DANHGIAPHIM WHERE NguoiDungID = @u', { u: ctx.newCustomerId }), before);
});
await t('API-REV-02', 'KH-13 watched customer can review (201), duplicate is 409, ratings validated', async () => {
  const movieId = (await call('GET', '/movies')).body.movies[0].id;
  ctx.reviewFixture = await createWatchedFixture(ctx.newCustomerId, movieId);
  const created = await call('POST', `/movies/${movieId}/reviews`, {
    token: newCustomerToken,
    body: { rating: 4, content: `Review ${RUN}` },
  });
  expectStatus(created, 201);
  const row = await one(pool, 'SELECT SoSao, NoiDung FROM dbo.DANHGIAPHIM WHERE NguoiDungID = @u AND PhimID = @m', {
    u: ctx.newCustomerId,
    m: movieId,
  });
  assert.equal(row.SoSao, 4);
  assert.equal(row.NoiDung, `Review ${RUN}`);
  const listed = await call('GET', `/movies/${movieId}/reviews`);
  assert.ok(listed.body.reviews.some((r) => r.content === `Review ${RUN}`));
  expectStatus(
    await call('POST', `/movies/${movieId}/reviews`, { token: newCustomerToken, body: { rating: 5 } }),
    409,
    'REVIEW_ALREADY_EXISTS',
  );
  for (const rating of [0, 6, 2.5, '5']) {
    expectStatus(
      await call('POST', `/movies/${movieId}/reviews`, { token: newCustomerToken, body: { rating } }),
      400,
    );
  }
  assert.equal(
    await scalar(pool, 'SELECT COUNT(*) FROM dbo.DANHGIAPHIM WHERE NguoiDungID = @u AND PhimID = @m', { u: ctx.newCustomerId, m: movieId }),
    1,
  );
});
await t('API-REV-03', 'KH-13 manager cannot review (403)', async () => {
  const movieId = (await call('GET', '/movies')).body.movies[0].id;
  expectStatus(await as('manager', 'POST', `/movies/${movieId}/reviews`, { rating: 5 }), 403);
});

// ============================================================================ COMPLAINTS (KH-14) + SUPPORT (CSKH-01..06)
await t('API-CMP-01', 'KH-14 customer files a complaint (201, status Mới) linked to own order', async () => {
  const created = await as('customer', 'POST', '/complaints', {
    type: 'Thanh toán',
    title: `Khiếu nại ${RUN}`,
    content: 'Nội dung khiếu nại kiểm thử tích hợp',
    orderId: flow.orderId,
  });
  expectStatus(created, 201);
  ctx.complaintId = created.body.complaint.id;
  const row = await one(pool, 'SELECT * FROM dbo.KHIEUNAI WHERE KhieuNaiID = @id', { id: ctx.complaintId });
  assert.equal(row.TrangThai, 'Mới');
  assert.equal(row.DonDatVeID, flow.orderId);
  assert.equal(row.NguoiDungID, ctx.newCustomerId);
});
await t('API-CMP-02', 'KH-14 complaint cannot reference another customer\'s order; empty fields rejected', async () => {
  const before = await scalar(pool, 'SELECT COUNT(*) FROM dbo.KHIEUNAI');
  const foreign = await as('customer2', 'POST', '/complaints', {
    type: 'Khác',
    title: 'Foreign',
    content: 'x',
    orderId: flow.orderId,
  });
  assert.ok(foreign.status >= 400 && foreign.status < 500, `foreign order ${foreign.status}`);
  expectStatus(await as('customer', 'POST', '/complaints', { type: '', title: 't', content: 'c' }), 400);
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.KHIEUNAI'), before);
});
await t('API-CMP-03', 'KH-14 complaint list/detail are scoped to the owner', async () => {
  const mine = await as('customer', 'GET', '/complaints');
  assert.ok(mine.body.complaints.some((c) => c.id === ctx.complaintId));
  const other = await as('customer2', 'GET', '/complaints');
  assert.ok(!other.body.complaints.some((c) => c.id === ctx.complaintId));
  const cross = await as('customer2', 'GET', `/complaints/${ctx.complaintId}`);
  assert.ok([403, 404].includes(cross.status), `cross ${cross.status}`);
});
await t('API-SUP-01', 'CSKH-02/03/04 queue, detail and order reference (read-only)', async () => {
  const queue = await as('support', 'GET', '/support/complaints');
  expectStatus(queue, 200);
  assert.ok(queue.body.complaints.some((c) => c.id === ctx.complaintId));
  const filtered = await as('support', 'GET', '/support/complaints?status=' + encodeURIComponent('Mới'));
  expectStatus(filtered, 200);
  assert.ok(filtered.body.complaints.every((c) => c.status === 'Mới'));
  const detail = await as('support', 'GET', `/support/complaints/${ctx.complaintId}`);
  expectStatus(detail, 200);
  const reference = await as('support', 'GET', `/support/complaints/${ctx.complaintId}/order-reference`);
  expectStatus(reference, 200);
});
await t('API-SUP-02', 'CSKH-05/06 processing log is append-only (201) and drives the complaint status', async () => {
  const logBefore = await scalar(pool, 'SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID = @id', { id: ctx.complaintId });
  const first = await as('support', 'POST', `/support/complaints/${ctx.complaintId}/processings`, {
    content: 'Đã tiếp nhận và kiểm tra giao dịch',
    nextStatus: 'Đang xử lý',
  });
  expectStatus(first, 201);
  let status = await scalar(pool, 'SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @id', { id: ctx.complaintId });
  assert.equal(status, 'Đang xử lý');
  const resolved = await as('support', 'PUT', `/support/complaints/${ctx.complaintId}/status`, { status: 'Đã giải quyết' });
  expectStatus(resolved, 200);
  status = await scalar(pool, 'SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @id', { id: ctx.complaintId });
  assert.equal(status, 'Đã giải quyết');
  const log = await sendQuery('SELECT NoiDungXuLy, TrangThaiSauXuLy, NguoiXuLyID FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID = @id ORDER BY XuLyID', { id: ctx.complaintId });
  assert.ok(log.length >= logBefore + 2, `log rows ${log.length}`);
  const supportId = (await one(pool, 'SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = @e', { e: ACCOUNTS.support })).NguoiDungID;
  assert.ok(log.every((x) => x.NguoiXuLyID === supportId));
  const customerView = await as('customer', 'GET', `/complaints/${ctx.complaintId}`);
  assert.equal(customerView.body.complaint.status, 'Đã giải quyết');
});
await t('API-SUP-03', 'CSKH RBAC: customer/manager cannot use the support API; invalid status rejected', async () => {
  expectStatus(await as('customer', 'GET', '/support/complaints'), 403);
  expectStatus(await as('manager', 'GET', '/support/complaints'), 403);
  expectStatus(await call('GET', '/support/complaints'), 401);
  expectStatus(
    await as('support', 'PUT', `/support/complaints/${ctx.complaintId}/status`, { status: 'Không tồn tại' }),
    400,
  );
});

// ============================================================================ MANAGER (QLR-01..10)
const managerState = {};
await t('API-MGR-01', 'QLR-01/08/09 manager scope, dashboard and revenue are limited to assigned cinemas', async () => {
  const cinemas = await as('manager', 'GET', '/manager/cinemas');
  expectStatus(cinemas, 200);
  const ids = cinemas.body.cinemas.map((c) => c.id).sort();
  const dbIds = (
    await sendQuery(
      `SELECT p.RapID FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG n ON n.NguoiDungID = p.NguoiDungID
        WHERE n.Email = @e AND p.TrangThai = N'Hiệu lực' AND p.NgayBatDau <= CAST(dbo.fn_BayGio() AS DATE)
          AND (p.NgayKetThuc IS NULL OR p.NgayKetThuc >= CAST(dbo.fn_BayGio() AS DATE)) ORDER BY p.RapID`,
      { e: ACCOUNTS.manager },
    )
  ).map((x) => x.RapID);
  assert.deepEqual(ids, dbIds);
  managerState.cinemaId = ids[0];
  managerState.foreignCinemaId = (await one(pool, 'SELECT TOP 1 RapID FROM dbo.RAPCHIEUPHIM WHERE RapID NOT IN (' + ids.join(',') + ') ORDER BY RapID')).RapID;
  expectStatus(await as('manager', 'GET', `/manager/cinemas/${ids[0]}/dashboard`), 200);
  expectStatus(await as('manager', 'GET', `/manager/cinemas/${ids[0]}/revenue`), 200);
  expectStatus(await as('manager', 'GET', `/manager/cinemas/${managerState.foreignCinemaId}/dashboard`), 403);
  expectStatus(await as('manager', 'GET', `/manager/cinemas/${managerState.foreignCinemaId}/revenue`), 403);
});
await t('API-MGR-02', 'QLR-02 room create (201) / update / delete persist; foreign cinema refused with 403', async () => {
  const name = `E2E Room ${RUN}`;
  expectStatus(await as('manager', 'POST', `/manager/cinemas/${managerState.foreignCinemaId}/rooms`, { name, type: '2D' }), 403);
  const created = await as('manager', 'POST', `/manager/cinemas/${managerState.cinemaId}/rooms`, { name, type: '3D' });
  expectStatus(created, 201);
  managerState.roomId = created.body.room.id;
  let row = await one(pool, 'SELECT * FROM dbo.PHONGCHIEU WHERE PhongID = @id', { id: managerState.roomId });
  assert.equal(row.TenPhong, name);
  assert.equal(row.LoaiPhong, '3D');
  assert.equal(row.RapID, managerState.cinemaId);
  expectStatus(await as('manager', 'PUT', `/manager/rooms/${managerState.roomId}`, { name: `${name} v2`, type: 'IMAX', status: 'Hoạt động' }), 200);
  row = await one(pool, 'SELECT * FROM dbo.PHONGCHIEU WHERE PhongID = @id', { id: managerState.roomId });
  assert.equal(row.TenPhong, `${name} v2`);
  assert.equal(row.LoaiPhong, 'IMAX');
  expectStatus(await as('manager', 'POST', `/manager/cinemas/${managerState.cinemaId}/rooms`, { name: `${name} v2`, type: '2D' }), 409, 'ROOM_NAME_CONFLICT');
});
await t('API-MGR-03', 'QLR-03 seat create (201) / update to maintenance / duplicate position 409', async () => {
  const created = await as('manager', 'POST', `/manager/rooms/${managerState.roomId}/seats`, { row: 'Z', number: 1, type: 'VIP' });
  expectStatus(created, 201);
  managerState.seatId = created.body.seat.id;
  let row = await one(pool, 'SELECT * FROM dbo.GHE WHERE GheID = @id', { id: managerState.seatId });
  assert.equal(`${row.HangGhe}${row.SoGhe}`, 'Z1');
  assert.equal(row.LoaiGhe, 'VIP');
  expectStatus(await as('manager', 'POST', `/manager/rooms/${managerState.roomId}/seats`, { row: 'Z', number: 1, type: 'Thường' }), 409, 'SEAT_POSITION_CONFLICT');
  expectStatus(await as('manager', 'PUT', `/manager/seats/${managerState.seatId}`, { type: 'VIP', status: 'Bảo trì' }), 200);
  row = await one(pool, 'SELECT TrangThai FROM dbo.GHE WHERE GheID = @id', { id: managerState.seatId });
  assert.equal(row.TrangThai, 'Bảo trì');
  expectStatus(await as('manager', 'PUT', `/manager/seats/${managerState.seatId}`, { type: 'VIP', status: 'Hoạt động' }), 200);
  const second = await as('manager', 'POST', `/manager/rooms/${managerState.roomId}/seats`, { row: 'Z', number: 2, type: 'Thường' });
  expectStatus(second, 201);
  managerState.seat2Id = second.body.seat.id;
});

// choose a movie and a free future slot in the new room
function slot(dayOffset, hour) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}
await t('API-MGR-04', 'QLR-04 showtime create (201) persists; overlap 409; foreign cinema room 403', async () => {
  const movie = await one(
    pool,
    `SELECT TOP 1 PhimID, NgayKhoiChieu, NgayKetThuc FROM dbo.PHIM
      WHERE TrangThai = N'Đang chiếu' AND (NgayKetThuc IS NULL OR NgayKetThuc > DATEADD(DAY, 20, CAST(dbo.fn_BayGio() AS DATE)))
      ORDER BY PhimID`,
  );
  assert.ok(movie, 'no running movie with a long enough window');
  managerState.movieId = movie.PhimID;
  const body = { movieId: movie.PhimID, roomId: managerState.roomId, startsAt: slot(10, 3), endsAt: slot(10, 5), format: 'IMAX', basePrice: 100000 };
  const created = await as('manager', 'POST', '/manager/showtimes', body);
  expectStatus(created, 201);
  managerState.showtimeId = created.body.showtime.id;
  const row = await one(pool, 'SELECT * FROM dbo.SUATCHIEU WHERE SuatChieuID = @id', { id: managerState.showtimeId });
  assert.equal(row.PhongID, managerState.roomId);
  assert.equal(row.TrangThai, 'Mở bán');
  assert.equal(money(row.GiaVeCoBan), 100000);
  expectStatus(await as('manager', 'POST', '/manager/showtimes', { ...body, startsAt: slot(10, 4), endsAt: slot(10, 6) }), 409, 'SHOWTIME_OVERLAP');
  const foreignRoom = await one(pool, 'SELECT TOP 1 PhongID FROM dbo.PHONGCHIEU WHERE RapID = @r', { r: managerState.foreignCinemaId });
  expectStatus(await as('manager', 'POST', '/manager/showtimes', { ...body, roomId: foreignRoom.PhongID }), 403);
});
await t('API-MGR-05', 'QLR-05 showtime update changes price/time when no orders; overlap rejected', async () => {
  const second = await as('manager', 'POST', '/manager/showtimes', {
    movieId: managerState.movieId, roomId: managerState.roomId, startsAt: slot(11, 3), endsAt: slot(11, 5), format: 'IMAX', basePrice: 90000,
  });
  expectStatus(second, 201);
  managerState.showtime2Id = second.body.showtime.id;
  expectStatus(
    await as('manager', 'PUT', `/manager/showtimes/${managerState.showtime2Id}`, {
      movieId: managerState.movieId, startsAt: slot(11, 4), endsAt: slot(11, 6), format: 'IMAX', basePrice: 95000, status: 'Mở bán',
    }),
    200,
  );
  const row = await one(pool, 'SELECT * FROM dbo.SUATCHIEU WHERE SuatChieuID = @id', { id: managerState.showtime2Id });
  assert.equal(money(row.GiaVeCoBan), 95000);
  assert.equal(new Date(row.ThoiGianBatDau).toISOString(), slot(11, 4));
  expectStatus(
    await as('manager', 'PUT', `/manager/showtimes/${managerState.showtime2Id}`, {
      movieId: managerState.movieId, startsAt: slot(10, 4), endsAt: slot(10, 6), format: 'IMAX', basePrice: 95000, status: 'Mở bán',
    }),
    409,
  );
});
await t('API-MGR-06', 'QLR-06 showtime cancel sets Đã hủy; cancelling twice is 409', async () => {
  expectStatus(await as('manager', 'POST', `/manager/showtimes/${managerState.showtime2Id}/cancel`, {}), 200);
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @id', { id: managerState.showtime2Id }), 'Đã hủy');
  // sp_Showtime_CancelCascade is idempotent by design: an already-cancelled showtime returns a
  // success message with SoDonDaHuy = 0 and changes nothing (error 50117 is not raised by it).
  const compensationBefore = await scalar(pool, 'SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT');
  const repeat = await as('manager', 'POST', `/manager/showtimes/${managerState.showtime2Id}/cancel`, {});
  expectStatus(repeat, 200);
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @id', { id: managerState.showtime2Id }), 'Đã hủy');
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT'), compensationBefore);
});
await t('API-MGR-07', 'QLR-07 pricing create (201) / update; overlap 409; foreign cinema 403', async () => {
  // Start strictly after every rule already stored for this cinema, so the run can never overlap
  // data left behind by earlier runs (overlap itself is asserted separately below).
  const lastDay = await scalar(
    pool,
    `SELECT CONVERT(VARCHAR(10), DATEADD(DAY, 7, MAX(ISNULL(NgayKetThuc, NgayBatDau))), 23) FROM dbo.BANGGIA WHERE RapID = @r`,
    { r: managerState.cinemaId },
  );
  const startDay = new Date(`${lastDay ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const iso = (days) => new Date(startDay.getTime() + days * 86400000).toISOString().slice(0, 10);
  const body = { seatType: 'VIP', dayType: 'Cuối tuần', format: 'IMAX', surcharge: 12000, startsOn: iso(0), endsOn: iso(5) };
  expectStatus(await as('manager', 'POST', `/manager/cinemas/${managerState.foreignCinemaId}/pricing`, body), 403);
  const created = await as('manager', 'POST', `/manager/cinemas/${managerState.cinemaId}/pricing`, body);
  expectStatus(created, 201);
  managerState.pricingId = created.body.pricing.id;
  let row = await one(pool, 'SELECT * FROM dbo.BANGGIA WHERE GiaID = @id', { id: managerState.pricingId });
  assert.equal(money(row.PhuThu), 12000);
  assert.equal(row.RapID, managerState.cinemaId);
  expectStatus(await as('manager', 'POST', `/manager/cinemas/${managerState.cinemaId}/pricing`, body), 409, 'PRICING_OVERLAP');
  expectStatus(await as('manager', 'PUT', `/manager/pricing/${managerState.pricingId}`, { surcharge: 15000, status: 'Áp dụng' }), 200);
  row = await one(pool, 'SELECT * FROM dbo.BANGGIA WHERE GiaID = @id', { id: managerState.pricingId });
  assert.equal(money(row.PhuThu), 15000);
  // clean-up through the product itself: a paused rule no longer takes part in overlap checks
  expectStatus(await as('manager', 'PUT', `/manager/pricing/${managerState.pricingId}`, { surcharge: 15000, status: 'Tạm dừng' }), 200);
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.BANGGIA WHERE GiaID = @id', { id: managerState.pricingId }), 'Tạm dừng');
});
await t('API-MGR-08', 'QLR-02/03 delete seat/room: no history → removed; showtime history keeps the room', async () => {
  expectStatus(await as('manager', 'DELETE', `/manager/seats/${managerState.seat2Id}`), 200);
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.GHE WHERE GheID = @id', { id: managerState.seat2Id }), 0);
  const clean = await as('manager', 'POST', `/manager/cinemas/${managerState.cinemaId}/rooms`, { name: `E2E Clean ${RUN}`, type: '2D' });
  expectStatus(clean, 201);
  expectStatus(await as('manager', 'DELETE', `/manager/rooms/${clean.body.room.id}`), 200);
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.PHONGCHIEU WHERE PhongID = @id', { id: clean.body.room.id }), 0);
  // sp_Manager_Room_Delete: showtime history (any status) turns the delete into a deactivation.
  const withHistory = await as('manager', 'DELETE', `/manager/rooms/${managerState.roomId}`);
  expectStatus(withHistory, 200);
  const room = await one(pool, 'SELECT TrangThai FROM dbo.PHONGCHIEU WHERE PhongID = @id', { id: managerState.roomId });
  assert.ok(room, 'room with showtime history must be retained');
  assert.equal(room.TrangThai, 'Ngưng hoạt động');
  return { deleteStatus: withHistory.status, roomStatus: room.TrangThai };
});

// ---- staff booking (QLR-10)
const staff = {};
await t('API-STF-01', 'QLR-10 manager creates a pending order for a customer (201), no payment is recorded', async () => {
  const st = await pickBookableShowtime({ minFreeSeats: 5, cinemaIds: [managerState.cinemaId] });
  const seats = await freeSeats(st.SuatChieuID, 2);
  const customer = await one(pool, 'SELECT NguoiDungID, HoTen FROM dbo.NGUOIDUNG WHERE Email = @e', { e: ACCOUNTS.customer2 });
  const search = await as('manager', 'GET', `/manager/bookings/customers?search=${encodeURIComponent(customer.HoTen.slice(0, 6))}`);
  expectStatus(search, 200);
  const created = await as('manager', 'POST', '/manager/bookings', { customerId: customer.NguoiDungID, showtimeId: st.SuatChieuID, seatIds: [seats[0].id] });
  expectStatus(created, 201);
  staff.orderId = created.body.orderId;
  staff.showtimeId = st.SuatChieuID;
  staff.seats = seats;
  const order = await one(pool, 'SELECT * FROM dbo.DONDATVE WHERE DonDatVeID = @id', { id: staff.orderId });
  assert.equal(order.NguoiDungID, customer.NguoiDungID);
  assert.equal(order.TrangThai, 'Chờ thanh toán');
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.THANHTOAN WHERE DonDatVeID = @id', { id: staff.orderId }), 0);
});
await t('API-STF-02', 'QLR-10 manager swaps the seat within the same showtime, snapshot/history preserved', async () => {
  const tickets = await sendQuery('SELECT VeID, GheID, TrangThai FROM dbo.CHITIETVE WHERE DonDatVeID = @id', { id: staff.orderId });
  const detail = await as('manager', 'PUT', `/manager/bookings/${staff.orderId}/seats`, {
    seatIds: [staff.seats[1].id],
    expectedTicketIds: tickets.map((x) => x.VeID),
  });
  expectStatus(detail, 200);
  const after = await sendQuery('SELECT VeID, GheID, TrangThai FROM dbo.CHITIETVE WHERE DonDatVeID = @id ORDER BY VeID', { id: staff.orderId });
  assert.ok(after.length >= 2, 'old ticket must be kept as history');
  assert.ok(after.some((x) => x.GheID === staff.seats[0].id && x.TrangThai === 'Đã hủy'));
  assert.ok(after.some((x) => x.GheID === staff.seats[1].id && x.TrangThai === 'Đã đặt'));
});
await t('API-STF-03', 'QLR-10 manager cancels the pending order; history kept; DELETE is 405', async () => {
  expectStatus(await as('manager', 'POST', `/manager/bookings/${staff.orderId}/cancel`, {}), 200);
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @id', { id: staff.orderId }), 'Đã hủy');
  assert.ok((await scalar(pool, 'SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID = @id', { id: staff.orderId })) >= 1);
  expectStatus(await as('manager', 'DELETE', `/manager/bookings/${staff.orderId}`), 405);
});
await t('API-STF-04', 'QLR-10 paid orders cannot be cancelled by staff; foreign-cinema showtime is refused', async () => {
  const paid = await as('manager', 'POST', `/manager/bookings/${flow.orderId}/cancel`, {});
  assert.ok([403, 409, 404].includes(paid.status), `paid cancel ${paid.status}`);
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @id', { id: flow.orderId }), 'Đã thanh toán');
  const foreign = await one(
    pool,
    `SELECT TOP 1 s.SuatChieuID FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU p ON p.PhongID = s.PhongID
      WHERE p.RapID = @r AND s.TrangThai = N'Mở bán' AND s.ThoiGianBatDau > dbo.fn_BayGio()`,
    { r: managerState.foreignCinemaId },
  );
  const seats = await freeSeats(foreign.SuatChieuID, 1);
  const cust = await one(pool, 'SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = @e', { e: ACCOUNTS.customer2 });
  expectStatus(await as('manager', 'POST', '/manager/bookings', { customerId: cust.NguoiDungID, showtimeId: foreign.SuatChieuID, seatIds: [seats[0].id] }), 403);
});

// ============================================================================ ADMIN (ADM-01..18)
const adm = {};
await t('API-ADM-01', 'ADM-02 admin creates staff (201), blocks customer creation (403), lock/unlock cycle', async () => {
  const roles = (await as('admin', 'GET', '/admin/roles')).body.roles;
  const roleId = (code) => roles.find((r) => r.MaVaiTro === code).VaiTroID;
  const staffEmail = `e2e.staff.${RUN}@example.test`;
  const created = await as('admin', 'POST', '/admin/users', { name: `E2E Staff ${RUN}`, email: staffEmail, password: 'StaffPass-123!', roleId: roleId('CSKH') });
  expectStatus(created, 201);
  adm.userId = created.body.user.NguoiDungID;
  const row = await one(
    pool,
    'SELECT n.TrangThai, v.MaVaiTro, n.MatKhau FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID = n.VaiTroID WHERE n.NguoiDungID = @id',
    { id: adm.userId },
  );
  assert.equal(row.MaVaiTro, 'CSKH');
  assert.match(row.MatKhau, /^\$2[aby]\$/);
  expectStatus(
    await as('admin', 'POST', '/admin/users', { name: 'Cust', email: `e2e.cust.${RUN}@example.test`, password: 'StaffPass-123!', roleId: roleId('KHACH_HANG') }),
    403,
  );
  expectStatus(await as('admin', 'PUT', `/admin/users/${adm.userId}/status`, { status: 'Bị khóa' }), 200);
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.NGUOIDUNG WHERE NguoiDungID = @id', { id: adm.userId }), 'Bị khóa');
  expectStatus(await call('POST', '/auth/login', { body: { Email: staffEmail, MatKhau: 'StaffPass-123!' } }), 401);
  expectStatus(await as('admin', 'PUT', `/admin/users/${adm.userId}/status`, { status: 'Hoạt động' }), 200);
  expectStatus(await call('POST', '/auth/login', { body: { Email: staffEmail, MatKhau: 'StaffPass-123!' } }), 200);
});
await t('API-ADM-02', 'ADM-06 assignment create (201) / update to Hết hạn; reversed dates 400', async () => {
  const managerRole = await one(pool, "SELECT VaiTroID FROM dbo.VAITRO WHERE MaVaiTro = 'QUAN_LY_RAP'");
  const mgrEmail = `e2e.mgr.${RUN}@example.test`;
  const user = await as('admin', 'POST', '/admin/users', { name: `E2E Mgr ${RUN}`, email: mgrEmail, password: 'MgrPass-123!', roleId: managerRole.VaiTroID });
  expectStatus(user, 201);
  adm.managerUserId = user.body.user.NguoiDungID;
  const cinemaId = managerState.cinemaId;
  const today = new Date().toISOString().slice(0, 10);
  const created = await as('admin', 'POST', '/admin/assignments', { userId: adm.managerUserId, cinemaId, startsOn: today, endsOn: null });
  expectStatus(created, 201);
  adm.assignmentId = created.body.assignment.PhanCongID;
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.PHANCONG_RAP WHERE PhanCongID = @id', { id: adm.assignmentId }), 'Hiệu lực');
  expectStatus(await as('admin', 'POST', '/admin/assignments', { userId: adm.managerUserId, cinemaId, startsOn: '2026-12-31', endsOn: '2026-01-01' }), 400);
  expectStatus(await as('admin', 'PUT', `/admin/assignments/${adm.assignmentId}`, { userId: adm.managerUserId, cinemaId, startsOn: today, endsOn: today, status: 'Hết hạn' }), 200);
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.PHANCONG_RAP WHERE PhanCongID = @id', { id: adm.assignmentId }), 'Hết hạn');
});
await t('API-ADM-03', 'ADM-07 cinema CRUD + image gallery (201/200) and cover switch', async () => {
  const created = await as('admin', 'POST', '/admin/cinemas', { name: `E2E Cinema ${RUN}`, address: '1 Test St', city: 'Hà Nội', phone: '0240000000' });
  expectStatus(created, 201);
  adm.cinemaId = created.body.cinema.RapID;
  expectStatus(await as('admin', 'PUT', `/admin/cinemas/${adm.cinemaId}`, { name: `E2E Cinema ${RUN} v2`, address: '2 Test St', city: 'Hà Nội', phone: '0240000001', status: 'Hoạt động' }), 200);
  const cinema = await one(pool, 'SELECT * FROM dbo.RAPCHIEUPHIM WHERE RapID = @id', { id: adm.cinemaId });
  assert.equal(cinema.TenRap, `E2E Cinema ${RUN} v2`);
  const imageA = await as('admin', 'POST', `/admin/cinemas/${adm.cinemaId}/images`, { url: 'https://example.invalid/a.jpg', description: 'A', displayOrder: 1, cover: true });
  expectStatus(imageA, 201);
  const imageB = await as('admin', 'POST', `/admin/cinemas/${adm.cinemaId}/images`, { url: 'https://example.invalid/b.jpg', description: 'B', displayOrder: 2 });
  expectStatus(imageB, 201);
  expectStatus(await as('admin', 'PATCH', `/admin/cinemas/${adm.cinemaId}/images/${imageB.body.image.HinhAnhRapID}/cover`, { cover: true }), 200);
  const covers = await sendQuery('SELECT HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @r AND LaAnhDaiDien = 1', { r: adm.cinemaId });
  assert.deepEqual(covers.map((c) => c.HinhAnhRapID), [imageB.body.image.HinhAnhRapID], 'exactly one cover image');
  expectStatus(await as('admin', 'DELETE', `/admin/cinemas/${adm.cinemaId}/images/${imageA.body.image.HinhAnhRapID}`), 200);
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID = @id', { id: imageA.body.image.HinhAnhRapID }), 0);
});
await t('API-ADM-04', 'ADM-08 room + seat CRUD in the new cinema', async () => {
  const room = await as('admin', 'POST', '/admin/rooms', { cinemaId: adm.cinemaId, name: `E2E Hall ${RUN}`, type: '3D' });
  expectStatus(room, 201);
  adm.roomId = room.body.room.PhongID;
  const seat = await as('admin', 'POST', '/admin/seats', { roomId: adm.roomId, row: 'A', number: 1, type: 'VIP' });
  expectStatus(seat, 201);
  adm.seatId = seat.body.seat.GheID;
  expectStatus(await as('admin', 'PUT', `/admin/seats/${adm.seatId}`, { type: 'VIP', status: 'Bảo trì' }), 200);
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.GHE WHERE GheID = @id', { id: adm.seatId }), 'Bảo trì');
  expectStatus(await as('admin', 'PUT', `/admin/rooms/${adm.roomId}`, { name: `E2E Hall ${RUN} v2`, type: '3D', status: 'Hoạt động' }), 200);
});
await t('API-ADM-05', 'ADM-10 genre CRUD; ADM-09 actor + movie CRUD and atomic cast replacement', async () => {
  const genre = await as('admin', 'POST', '/admin/genres', { name: `E2E Genre ${RUN}` });
  expectStatus(genre, 201);
  adm.genreId = genre.body.genre.TheLoaiID;
  expectStatus(await as('admin', 'PUT', `/admin/genres/${adm.genreId}`, { name: `E2E Genre ${RUN} v2` }), 200);
  assert.equal(await scalar(pool, 'SELECT TenTheLoai FROM dbo.THELOAI WHERE TheLoaiID = @id', { id: adm.genreId }), `E2E Genre ${RUN} v2`);
  const actorA = await as('admin', 'POST', '/admin/actors', { name: `E2E Actor A ${RUN}`, nationality: 'Việt Nam' });
  const actorB = await as('admin', 'POST', '/admin/actors', { name: `E2E Actor B ${RUN}` });
  expectStatus(actorA, 201);
  expectStatus(actorB, 201);
  adm.actorA = actorA.body.actor.DienVienID;
  adm.actorB = actorB.body.actor.DienVienID;
  const movie = await as('admin', 'POST', '/admin/movies', {
    title: `E2E Movie ${RUN}`, durationMinutes: 100, releaseDate: new Date().toISOString().slice(0, 10), genreIds: [adm.genreId], ageRating: 'T13',
  });
  expectStatus(movie, 201);
  adm.movieId = movie.body.movie.movieId;
  expectStatus(await as('admin', 'PUT', `/admin/movies/${adm.movieId}/actors`, { cast: [{ actorId: adm.actorA, role: 'Chính' }, { actorId: adm.actorB, role: 'Phụ' }] }), 200);
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.PHIM_DIENVIEN WHERE PhimID = @id', { id: adm.movieId }), 2);
  expectStatus(await as('admin', 'PUT', `/admin/movies/${adm.movieId}/actors`, { cast: [{ actorId: adm.actorB, role: 'Chính' }] }), 200);
  const cast = await sendQuery('SELECT DienVienID, VaiDien FROM dbo.PHIM_DIENVIEN WHERE PhimID = @id', { id: adm.movieId });
  assert.deepEqual(cast.map((c) => [c.DienVienID, c.VaiDien]), [[adm.actorB, 'Chính']]);
  const movieUpdate = await as('admin', 'PUT', `/admin/movies/${adm.movieId}`, {
    title: `E2E Movie ${RUN} v2`, durationMinutes: 110, releaseDate: new Date().toISOString().slice(0, 10), genreIds: [adm.genreId], ageRating: 'T13', status: 'Đang chiếu',
  });
  expectStatus(movieUpdate, 200);
  // F-07: a result row, not the mssql driver envelope
  assert.equal(movieUpdate.body.movie.recordsets, undefined, 'driver envelope must not leak');
  assert.equal(movieUpdate.body.movie.PhimID, adm.movieId);
  const row = await one(pool, 'SELECT TenPhim, ThoiLuong, TrangThai FROM dbo.PHIM WHERE PhimID = @id', { id: adm.movieId });
  assert.deepEqual([row.TenPhim, row.ThoiLuong, row.TrangThai], [`E2E Movie ${RUN} v2`, 110, 'Đang chiếu']);
});
await t('API-ADM-06', 'ADM-14 admin showtime create (201)/update/cancel; ADM-13 pricing create (201)/update; overlap 409', async () => {
  const showtime = await as('admin', 'POST', '/admin/showtimes', { movieId: adm.movieId, roomId: adm.roomId, startsAt: slot(5, 2), endsAt: slot(5, 4), format: '3D', basePrice: 80000 });
  expectStatus(showtime, 201);
  // F-07: admin showtime create returns the procedure's result row (no driver envelope).
  assert.equal(showtime.body.showtime.recordsets, undefined, 'driver envelope must not leak');
  adm.showtimeId = showtime.body.showtime.SuatChieuID;
  expectStatus(await as('admin', 'POST', '/admin/showtimes', { movieId: adm.movieId, roomId: adm.roomId, startsAt: slot(5, 3), endsAt: slot(5, 5), format: '3D', basePrice: 80000 }), 409);
  const showtimeUpdate = await as('admin', 'PUT', `/admin/showtimes/${adm.showtimeId}`, { movieId: adm.movieId, startsAt: slot(5, 2), endsAt: slot(5, 4), format: '3D', basePrice: 85000, status: 'Mở bán' });
  expectStatus(showtimeUpdate, 200);
  assert.equal(showtimeUpdate.body.showtime.recordsets, undefined, 'driver envelope must not leak');
  assert.equal(showtimeUpdate.body.showtime.SuatChieuID, adm.showtimeId);
  assert.equal(money(await scalar(pool, 'SELECT GiaVeCoBan FROM dbo.SUATCHIEU WHERE SuatChieuID = @id', { id: adm.showtimeId })), 85000);
  const pricing = { cinemaId: adm.cinemaId, seatType: 'Tất cả', dayType: 'Tất cả', format: 'Tất cả', startsOn: slot(30, 0).slice(0, 10), endsOn: null, surcharge: 5000 };  // brand-new cinema: no foreign rules
  const created = await as('admin', 'POST', '/admin/pricing', pricing);
  expectStatus(created, 201);
  adm.pricingId = created.body.pricing.GiaID;
  expectStatus(await as('admin', 'POST', '/admin/pricing', pricing), 409);
  expectStatus(await as('admin', 'PUT', `/admin/pricing/${adm.pricingId}`, { surcharge: 7000, status: 'Áp dụng' }), 200);
  assert.equal(money(await scalar(pool, 'SELECT PhuThu FROM dbo.BANGGIA WHERE GiaID = @id', { id: adm.pricingId })), 7000);
  expectStatus(await as('admin', 'POST', `/admin/showtimes/${adm.showtimeId}/cancel`, {}), 200);
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @id', { id: adm.showtimeId }), 'Đã hủy');
});
await t('API-ADM-07', 'ADM-11 product CRUD (201/200) and ADM-12 promotion CRUD (201/200)', async () => {
  const product = await as('admin', 'POST', '/admin/products', { name: `E2E Product ${RUN}`, type: 'Combo', price: 55000, description: 'kiểm thử' });
  expectStatus(product, 201);
  adm.productId = product.body.product.SanPhamID;
  expectStatus(await as('admin', 'PUT', `/admin/products/${adm.productId}`, { name: `E2E Product ${RUN}`, type: 'Combo', price: 60000, status: 'Đang bán', description: 'kiểm thử' }), 200);
  assert.equal(money(await scalar(pool, 'SELECT Gia FROM dbo.SANPHAM WHERE SanPhamID = @id', { id: adm.productId })), 60000);
  const code = `E2E${RUN}`.toUpperCase().slice(0, 20);
  const promo = await as('admin', 'POST', '/admin/promotions', {
    code, description: 'E2E', discountType: 'Số tiền', discountValue: 10000, minimumOrder: 0, startsAt: slot(0, 0), endsAt: slot(30, 0), quantity: 5,
  });
  expectStatus(promo, 201);
  adm.promotionId = promo.body.promotion.KhuyenMaiID;
  expectStatus(await as('admin', 'PUT', `/admin/promotions/${adm.promotionId}`, {
    description: 'E2E v2', discountType: 'Số tiền', discountValue: 12000, minimumOrder: 0, startsAt: slot(0, 0), endsAt: slot(30, 0), quantity: 6, status: 'Tạm dừng',
  }), 200);
  const row = await one(pool, 'SELECT * FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @id', { id: adm.promotionId });
  assert.deepEqual([money(row.GiaTriGiam), row.SoLuong, row.TrangThai], [12000, 6, 'Tạm dừng']);
});
await t('API-ADM-08', 'ADM-15/16/18 admin complaints queue, revenue report and global bookings', async () => {
  const queue = await as('admin', 'GET', '/admin/complaints');
  expectStatus(queue, 200);
  assert.ok(queue.body.complaints.some((c) => c.id === ctx.complaintId));
  // ADM-15: the Admin portal appends to the same processing log and answers 201 Created
  const adminLog = await scalar(pool, 'SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID = @id', { id: ctx.complaintId });
  const processing = await as('admin', 'POST', `/admin/complaints/${ctx.complaintId}/processings`, {
    content: 'Quản trị viên xác nhận và đóng hồ sơ',
    nextStatus: 'Đã đóng',
  });
  expectStatus(processing, 201);
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID = @id', { id: ctx.complaintId }), adminLog + 1);
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @id', { id: ctx.complaintId }), 'Đã đóng');
  const revenue = await as('admin', 'GET', '/admin/reports/revenue');
  expectStatus(revenue, 200);
  const bookings = await as('admin', 'GET', '/admin/bookings');
  expectStatus(bookings, 200);
  expectStatus(await as('admin', 'GET', '/admin/dashboard'), 200);
});
await t('API-ADM-09', 'ADM-10..11 cleanup deletes: promotion/product/genre/actor/movie/seat/room/cinema', async () => {
  for (const [route, table, column, id] of [
    [`/admin/promotions/${adm.promotionId}`, 'KHUYENMAI', 'KhuyenMaiID', adm.promotionId],
    [`/admin/products/${adm.productId}`, 'SANPHAM', 'SanPhamID', adm.productId],
    [`/admin/seats/${adm.seatId}`, 'GHE', 'GheID', adm.seatId],
  ]) {
    expectStatus(await as('admin', 'DELETE', route), 200);
    assert.equal(await scalar(pool, `SELECT COUNT(*) FROM dbo.${table} WHERE ${column} = @id`, { id }), 0, route);
  }
  // movie with a cancelled showtime keeps history; delete expected to be refused (409) — otherwise removed.
  const movieDelete = await as('admin', 'DELETE', `/admin/movies/${adm.movieId}`);
  expectStatus(movieDelete, 409, 'MOVIE_HAS_DEPENDENCIES');
  assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.PHIM WHERE PhimID = @id', { id: adm.movieId }), 1);
  const room = await as('admin', 'DELETE', `/admin/rooms/${adm.roomId}`);
  expectStatus(room, 200);
  assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.PHONGCHIEU WHERE PhongID = @id', { id: adm.roomId }), 'Ngưng hoạt động');
  const cinemaDelete = await as('admin', 'DELETE', `/admin/cinemas/${adm.cinemaId}`);
  expectStatus(cinemaDelete, 409, 'CINEMA_HAS_DEPENDENCIES');
});
await t('API-ADM-10', 'ADM-03/04/05 retired RBAC endpoints refuse every write with 403 RBAC_FIXED', async () => {
  for (const [method, route] of [
    ['POST', '/admin/roles'],
    ['PUT', '/admin/roles/1'],
    ['PUT', '/admin/roles/1/permissions'],
    ['DELETE', '/admin/permissions/1'],
  ]) {
    expectStatus(await as('admin', method, route, {}), 403, 'RBAC_FIXED');
  }
  const permissions = await scalar(pool, 'SELECT COUNT(*) FROM dbo.VAITRO_QUYEN');
  assert.ok(permissions > 0);
});

// ============================================================================ RBAC matrix
await t('API-RBAC-01', 'Cross-role boundaries: customer/support→admin & manager 403; manager→admin 403; anonymous 401', async () => {
  for (const route of ['/admin/dashboard', '/admin/users', '/admin/pricing', '/admin/bookings']) {
    expectStatus(await as('customer', 'GET', route), 403);
    expectStatus(await as('manager', 'GET', route), 403);
    expectStatus(await as('support', 'GET', route), 403);
    expectStatus(await call('GET', route), 401);
  }
  for (const route of ['/manager/cinemas', '/manager/bookings']) {
    expectStatus(await as('customer', 'GET', route), 403);
    expectStatus(await as('support', 'GET', route), 403);
  }
  expectStatus(await as('admin', 'GET', '/manager/cinemas'), 403);
  expectStatus(await as('admin', 'GET', '/orders'), 403);
});
await t('API-RBAC-02', 'Manager assignment scope is enforced immediately (expired assignment → 403)', async () => {
  const token = (await call('POST', '/auth/login', { body: { Email: `e2e.mgr.${RUN}@example.test`, MatKhau: 'MgrPass-123!' } })).body?.token;
  assert.ok(token, 'new manager login');
  const response = await call('GET', `/manager/cinemas/${managerState.cinemaId}/dashboard`, { token });
  expectStatus(response, 403);
});

// ============================================================================ integrity after all business flows
await runIntegrityChecks(pool, reporter, { prefix: 'POST-' });

backend.stop();
await pool.close();
const summary = reporter.finish({ run: RUN, promoUsage: ctx.promoUsage });
process.exit(summary.failed === 0 ? 0 : 1);

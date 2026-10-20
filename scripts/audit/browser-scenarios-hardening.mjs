// Hardening scenarios: remaining Admin flows, hold expiry and compensated cancellation in the UI,
// plus responsive and accessibility audits. Fixtures are created through the public/Admin API
// (setup only); every asserted action is a DOM interaction and every outcome is read from SQL.
import fs from 'node:fs';
import path from 'node:path';
import {
  ACCOUNTS,
  ROOT,
  apiClient,
  createPrivateShowtime,
  loginStaff,
  one,
  registerCustomer,
  rows,
  scalar,
  sleep,
} from './lib.mjs';
import {
  confirmIfAsked,
  expectPoll,
  expectText,
  pickSearchableOption,
  rowOf,
  selectCustomOption,
  uiLogin,
  visible,
} from './browser-helpers.mjs';

const axeSource = fs.readFileSync(
  path.join(ROOT, 'node_modules', 'axe-core', 'axe.min.js'),
  'utf8',
);
const digits = (text) => Number(String(text).replace(/[^\d-]/g, ''));
const businessToday = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);

async function api(apiBase) {
  const call = apiClient(apiBase);
  return call;
}
async function setupCustomer(apiBase, pool, tag) {
  return registerCustomer(await api(apiBase), pool, tag);
}
async function setupShowtime(apiBase, pool, opts) {
  const call = await api(apiBase);
  return createPrivateShowtime(call, pool, await loginStaff(call, 'admin'), opts);
}

const balanceOf = async (pool, userId) =>
  (await scalar(pool, 'SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @u', {
    u: userId,
  })) ?? 0;
async function cashLedger(pool) {
  const row = await one(
    pool,
    `SELECT ISNULL(SUM(CASE WHEN d.TongTienVe + d.TongTienDoAn - d.TienGiamGia < 0 THEN 0 ELSE d.TongTienVe + d.TongTienDoAn - d.TienGiamGia END), 0) AS cash,
            ISNULL(SUM(CAST(d.DiemSuDung AS DECIMAL(18, 2)) * 1000), 0) AS pointsValue
       FROM dbo.DONDATVE d
      WHERE EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')`,
  );
  return { cash: Number(row.cash), pointsValue: Number(row.pointsValue) };
}
async function bookAndPay(call, customer, showtimeId, seatCount) {
  const seatsResponse = await call('GET', `/showtimes/${showtimeId}/seats`);
  const seatIds = seatsResponse.body.seats
    .filter((s) => s.status === 'Trống')
    .slice(0, seatCount)
    .map((s) => s.id);
  const booked = await call('POST', '/bookings', {
    token: customer.token,
    body: { showtimeId, seatIds, products: [] },
  });
  if (booked.status !== 201)
    throw new Error(`setup booking failed: ${booked.status} ${booked.text}`);
  const orderId = booked.body.booking.id;
  const attempt = await call('POST', `/orders/${orderId}/payments`, {
    token: customer.token,
    body: { paymentMethod: 'VNPAY' },
  });
  const done = await call('POST', `/orders/${orderId}/payments/${attempt.body.payment.id}/result`, {
    token: customer.token,
    body: { status: 'Thành công' },
  });
  if (done.status !== 200) throw new Error(`setup payment failed: ${done.status} ${done.text}`);
  return { orderId };
}
/** A customer holding exactly 100 points, earned by a real cash purchase (1 point per 1.000 VND). */
async function fundedCustomer(apiBase, pool, tag) {
  const call = await api(apiBase);
  const customer = await setupCustomer(apiBase, pool, tag);
  const show = await setupShowtime(apiBase, pool, { basePrice: 100000 });
  await bookAndPay(call, customer, show.showtimeId, 1);
  return customer;
}

export const hardeningScenarios = [
  {
    id: 'E2E-MOVIE-SEARCH-NAV',
    title: 'Tìm phim navigation focuses the search control and Enter applies URL-backed filters',
    async run({ page, origin, assert }) {
      await page.goto(`${origin}/movies`);
      const search = page.getByLabel('Tìm phim hoặc đạo diễn');
      await search.focus();
      await search.fill('galaxy');
      await page.keyboard.press('Enter');
      await page.waitForURL((url) => url.pathname === '/movies' && url.searchParams.get('search') === 'galaxy');
      assert.equal(await search.inputValue(), 'galaxy');
      return { url: page.url(), focusedSearch: true };
    },
  },
  // ------------------------------------------------------------------ Admin: dashboard & revenue vs SQL
  {
    id: 'E2E-ADM-DASHBOARD',
    title: 'ADM-16 overview KPIs shown in the UI equal independent SQL aggregates',
    async run({ page, origin, pool, assert }) {
      await uiLogin(page, origin, ACCOUNTS.admin);
      await page.goto(`${origin}/admin/reports/revenue`);
      await page.locator('[data-metric="TongNguoiDung"]').waitFor();
      const ui = async (key) =>
        digits(
          await page
            .locator(`.admin-analytics__overview [data-metric="${key}"] dd`)
            .first()
            .innerText(),
        );
      const sqlRow = await one(
        pool,
        `SELECT
           (SELECT ISNULL(SUM(CASE WHEN d.TongTienVe + d.TongTienDoAn - d.TienGiamGia < 0 THEN 0 ELSE d.TongTienVe + d.TongTienDoAn - d.TienGiamGia END), 0) FROM dbo.DONDATVE d
             WHERE EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')) AS revenue,
           (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai IN (N'Đã thanh toán', N'Hoàn thành')) AS orders,
           (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')) AS paidOrders,
           (SELECT ISNULL(SUM(CAST(d.DiemSuDung AS DECIMAL(18, 2)) * 1000), 0) FROM dbo.DONDATVE d WHERE EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')) AS pointsValue,
           (SELECT ISNULL(SUM(CASE WHEN d.TongTienVe + d.TongTienDoAn - d.TienGiamGia < 0 THEN 0 ELSE d.TongTienVe + d.TongTienDoAn - d.TienGiamGia END), 0) FROM dbo.DONDATVE d WHERE d.TrangThai = N'Đã hủy' AND EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')) AS cancelledCash,
           (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE TrangThai <> N'Đã hủy'
              AND CAST(DATEADD(HOUR, 7, ThoiGianBatDau) AS DATE) = CAST(DATEADD(HOUR, 7, dbo.fn_BayGio()) AS DATE)) AS today,
           (SELECT COUNT(*) FROM dbo.KHIEUNAI WHERE TrangThai = N'Mới') AS complaints,
           (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE TrangThai = N'Hoạt động') AS users,
           (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM WHERE TrangThai = N'Hoạt động') AS cinemas,
           (SELECT COUNT(*) FROM dbo.PHONGCHIEU WHERE TrangThai = N'Hoạt động') AS rooms,
           (SELECT COUNT(*) FROM dbo.PHIM WHERE TrangThai = N'Đang chiếu') AS movies`,
      );
      const shown = {
        revenue: await ui('TongDoanhThuToanThoiGian'),
        orders: await ui('TongDonThanhCong'),
        paidOrders: await ui('TongDonThanhToanThanhCong'),
        pointsValue: await ui('TongGiaTriThanhToanBangDiem'),
        cancelledCash: await ui('TienThuocDonHuy'),
        today: await ui('SuatChieuHomNay'),
        complaints: await ui('KhieuNaiChuaXuLy'),
        users: await ui('TongNguoiDung'),
        cinemas: await ui('TongRap'),
        rooms: await ui('TongPhongChieu'),
        movies: await ui('PhimDangChieu'),
      };
      const expected = Object.fromEntries(Object.entries(sqlRow).map(([k, v]) => [k, Number(v)]));
      assert.deepEqual(shown, expected);
      return shown;
    },
  },
  {
    id: 'E2E-ADM-REVENUE',
    title:
      'ADM-16 revenue report (month to date) equals an independent SQL computation; single-day filter works',
    async run({ page, origin, pool, assert }) {
      await uiLogin(page, origin, ACCOUNTS.admin);
      await page.goto(`${origin}/admin/reports/revenue`);
      await page.locator('[data-metric="TongDoanhThuThucTe"]').waitFor();
      const today = businessToday();
      const monthStart = `${today.slice(0, 7)}-01`;
      const oracle = async (from, to) =>
        one(
          pool,
          `SELECT COUNT(*) AS orders, ISNULL(SUM(rev), 0) AS revenue, ISNULL(SUM(tickets), 0) AS tickets,
                  ISNULL(SUM(tv), 0) AS ticketMoney, ISNULL(SUM(da), 0) AS foodMoney, ISNULL(SUM(gg), 0) AS discount,
                  ISNULL(SUM(CASE WHEN ts IN (N'Đã thanh toán', N'Hoàn thành') THEN 1 ELSE 0 END), 0) AS validOrders,
                  ISNULL(SUM(CASE WHEN rev > 0 THEN 1 ELSE 0 END), 0) AS cashOrders,
                  ISNULL(SUM(pv), 0) AS pointsValue,
                  ISNULL(SUM(CASE WHEN ts = N'Đã hủy' THEN rev ELSE 0 END), 0) AS cancelledCash
             FROM (SELECT CASE WHEN d.TongTienVe + d.TongTienDoAn - d.TienGiamGia < 0 THEN 0 ELSE d.TongTienVe + d.TongTienDoAn - d.TienGiamGia END AS rev, d.TongTienVe AS tv, d.TongTienDoAn AS da, d.TienGiamGia AS gg, d.TrangThai AS ts, CAST(d.DiemSuDung AS DECIMAL(18, 2)) * 1000 AS pv,
                          (SELECT COUNT(*) FROM dbo.CHITIETVE v WHERE v.DonDatVeID = d.DonDatVeID AND v.TrangThai <> N'Đã hủy') AS tickets,
                          CAST(DATEADD(HOUR, 7, (SELECT MAX(ISNULL(t.NgayThanhToan, t.NgayTao)) FROM dbo.THANHTOAN t
                                                  WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')) AS DATE) AS bday
                     FROM dbo.DONDATVE d
                    WHERE EXISTS (SELECT 1 FROM dbo.THANHTOAN t WHERE t.DonDatVeID = d.DonDatVeID AND t.TrangThai = N'Thành công')) x
            WHERE bday BETWEEN @f AND @t`,
          { f: from, t: to },
        );
      const read = async () => ({
        revenue: digits(
          await page
            .locator('.admin-analytics__report [data-metric="TongDoanhThuThucTe"] dd')
            .first()
            .innerText(),
        ),
        orders: digits(
          await page
            .locator('.admin-analytics__report [data-metric="TongSoDonToanHeThong"] dd')
            .first()
            .innerText(),
        ),
        tickets: digits(
          await page.locator('.admin-analytics__report [data-metric="TongSoVeBan"] dd').first().innerText(),
        ),
        ticketMoney: digits(
          await page.locator('.admin-analytics__report [data-metric="TongDoanhThuVe"] dd').first().innerText(),
        ),
        foodMoney: digits(
          await page
            .locator('.admin-analytics__report [data-metric="TongDoanhThuDoAn"] dd')
            .first()
            .innerText(),
        ),
        discount: digits(
          await page.locator('.admin-analytics__report [data-metric="TongTienGiam"] dd').first().innerText(),
        ),
        validOrders: digits(
          await page.locator('.admin-analytics__report [data-metric="SoDonHopLe"] dd').first().innerText(),
        ),
        cashOrders: digits(
          await page
            .locator('.admin-analytics__report [data-metric="SoDonCoTienThucThu"] dd')
            .first()
            .innerText(),
        ),
        pointsValue: digits(
          await page
            .locator('.admin-analytics__report [data-metric="TongGiaTriThanhToanBangDiem"] dd')
            .first()
            .innerText(),
        ),
        cancelledCash: digits(
          await page
            .locator('.admin-analytics__report [data-metric="TienThuocDonHuy"] dd')
            .first()
            .innerText(),
        ),
      });
      const normal = (row) =>
        Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)]));
      assert.deepEqual(await read(), normal(await oracle(monthStart, today)));
      const month = await read();

      await page.getByLabel(/^Từ ngày/).fill(today);
      await page.getByLabel(/^Đến ngày/).fill(today);
      await page.getByRole('button', { name: 'Áp dụng lọc' }).click();
      const day = normal(await oracle(today, today));
      await expectPoll(async () => (await read()).revenue === day.revenue, {
        message: 'single-day revenue did not refresh',
      });
      assert.deepEqual(await read(), day);
      assert.ok(day.revenue <= month.revenue);
      return { month, day };
    },
  },

  // ------------------------------------------------------------------ Admin: cinema images
  {
    id: 'E2E-ADM-IMAGES',
    title:
      'ADM-07 cinema image gallery: add (cover) → add → switch cover → hide → delete, SQL verified',
    async run({ page, origin, pool, RUN, apiBase, assert }) {
      const call = await api(apiBase);
      const admin = await loginStaff(call, 'admin');
      const cinema = await call('POST', '/admin/cinemas', {
        token: admin,
        body: { name: `E2E Ảnh ${RUN}`, address: '9 Đường Ảnh', city: 'Hà Nội' },
      });
      assert.equal(cinema.status, 201, cinema.text);
      const cinemaId = cinema.body.cinema.RapID;
      await uiLogin(page, origin, ACCOUNTS.admin);
      await page.goto(`${origin}/admin/cinemas/images?cinemaId=${cinemaId}`);
      const add = async (url, caption, cover) => {
        await page.getByRole('button', { name: '＋ Thêm ảnh rạp' }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByLabel(/^URL hoặc đường dẫn ảnh/).fill(url);
        await dialog.getByLabel('Chú thích').fill(caption);
        if (cover) await dialog.getByLabel('Đặt làm ảnh chính').check();
        await dialog.getByRole('button', { name: 'Lưu ảnh rạp' }).click();
        await dialog.waitFor({ state: 'hidden' });
      };
      await add(`/images/e2e-${RUN}-a.jpg`, `Ảnh A ${RUN}`, true);
      await add(`/images/e2e-${RUN}-b.jpg`, `Ảnh B ${RUN}`, false);
      const images = () =>
        rows(
          pool,
          'SELECT HinhAnhRapID, MoTa, LaAnhDaiDien, TrangThai FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID = @r ORDER BY HinhAnhRapID',
          { r: cinemaId },
        );
      await expectPoll(async () => (await images()).length === 2, {
        message: 'two images expected',
      });
      let list = await images();
      const [a, b] = list;
      assert.deepEqual([a.LaAnhDaiDien, b.LaAnhDaiDien], [true, false]);

      // make B the cover
      await page
        .getByRole('article')
        .filter({ hasText: `Ảnh B ${RUN}` })
        .getByRole('button', { name: 'Đặt ảnh chính' })
        .click();
      await expectPoll(
        async () =>
          (await images()).find((x) => x.HinhAnhRapID === b.HinhAnhRapID).LaAnhDaiDien === true,
        { message: 'cover not switched' },
      );
      list = await images();
      assert.equal(list.filter((x) => x.LaAnhDaiDien).length, 1, 'exactly one cover image');

      // hide A (non-cover) via the editor
      await page
        .getByRole('article')
        .filter({ hasText: `Ảnh A ${RUN}` })
        .getByRole('button', { name: 'Sửa ảnh' })
        .click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Trạng thái', { exact: true }).selectOption('Tạm ẩn');
      await dialog.getByRole('button', { name: 'Lưu ảnh rạp' }).click();
      await dialog.waitFor({ state: 'hidden' });
      await expectPoll(
        async () =>
          (await images()).find((x) => x.HinhAnhRapID === a.HinhAnhRapID).TrangThai === 'Tạm ẩn',
        { message: 'image not hidden' },
      );

      // delete A
      const card = page.getByRole('article').filter({ hasText: `Ảnh A ${RUN}` });
      const summary = card.locator('summary', { hasText: 'Khác' });
      if (await summary.count()) await summary.click();
      await card.getByRole('button', { name: 'Xóa ảnh' }).click();
      await confirmIfAsked(page);
      await expectPoll(async () => (await images()).length === 1, { message: 'image not deleted' });
      return { cinemaId, remaining: (await images()).length };
    },
  },

  // ------------------------------------------------------------------ Admin: complaint handling UI
  {
    id: 'E2E-ADM-COMPLAINT',
    title:
      'ADM-15 Admin handles a complaint in the UI: process note then status; log is append-only',
    async run({ page, origin, pool, RUN, apiBase, assert }) {
      const call = await api(apiBase);
      const customer = await setupCustomer(apiBase, pool, 'admcmp');
      const title = `Admin xử lý ${RUN}`;
      const created = await call('POST', '/complaints', {
        token: customer.token,
        body: { type: 'Dịch vụ', title, content: 'Phản ánh để Admin xử lý bằng giao diện.' },
      });
      assert.equal(created.status, 201, created.text);
      const complaintId = created.body.complaint.id;
      await uiLogin(page, origin, ACCOUNTS.admin);
      await page.goto(`${origin}/admin/service/complaints`);
      await page.getByLabel('Tìm chủ đề / người gửi / email').fill(title);
      await page.getByRole('button', { name: 'Áp dụng lọc' }).click();
      await rowOf(page, title).getByRole('button', { name: /Xem/ }).click();
      await expectText(page, 'Lịch sử xử lý');
      const before = await scalar(
        pool,
        'SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID = @c',
        { c: complaintId },
      );
      await page.getByLabel('Nội dung xử lý').fill('Quản trị viên đã tiếp nhận và đối soát.');
      await page.getByLabel('Trạng thái sau xử lý').selectOption('Đang xử lý');
      await page.getByRole('button', { name: 'Ghi nhận xử lý' }).click();
      await confirmIfAsked(page);
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID = @c', {
            c: complaintId,
          })) ===
          before + 1,
        { message: 'processing entry missing' },
      );
      assert.equal(
        await scalar(pool, 'SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @c', {
          c: complaintId,
        }),
        'Đang xử lý',
      );
      await page.getByLabel('Trạng thái hồ sơ').selectOption('Đã giải quyết');
      await page.getByRole('button', { name: 'Cập nhật trạng thái' }).click();
      await confirmIfAsked(page);
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @c', {
            c: complaintId,
          })) === 'Đã giải quyết',
        { message: 'status not updated' },
      );
      const log = await rows(
        pool,
        `SELECT x.TrangThaiSauXuLy, n.Email FROM dbo.XULY_KHIEUNAI x JOIN dbo.NGUOIDUNG n ON n.NguoiDungID = x.NguoiXuLyID
          WHERE x.KhieuNaiID = @c ORDER BY x.XuLyID`,
        { c: complaintId },
      );
      assert.ok(log.every((entry) => entry.Email === ACCOUNTS.admin));
      assert.equal(log.at(-1).TrangThaiSauXuLy, 'Đã giải quyết');
      return { complaintId, entries: log.length };
    },
  },

  // ------------------------------------------------------------------ Admin: rooms & seats workspaces
  {
    id: 'E2E-ADM-ROOMS-SEATS',
    title:
      'ADM-08 Admin room workspace (edit/delete) and seat workspace (create → maintenance → delete)',
    async run({ page, origin, pool, RUN, apiBase, assert }) {
      const call = await api(apiBase);
      const admin = await loginStaff(call, 'admin');
      const cinemaName = `E2E Hall Rạp ${RUN}`;
      const cinema = await call('POST', '/admin/cinemas', {
        token: admin,
        body: { name: cinemaName, address: '5 Phòng Ghế', city: 'Huế' },
      });
      assert.equal(cinema.status, 201, cinema.text);
      const cinemaId = cinema.body.cinema.RapID;
      const roomName = `E2E Phòng ${RUN}`;
      const room = await call('POST', '/admin/rooms', {
        token: admin,
        body: { cinemaId, name: roomName, type: '2D' },
      });
      assert.equal(room.status, 201, room.text);
      const roomId = room.body.room.PhongID;
      await uiLogin(page, origin, ACCOUNTS.admin);

      // ---- seats workspace: choose cinema → room, create, set maintenance, delete
      await page.goto(`${origin}/admin/facilities/seats`);
      await pickSearchableOption(page, 'Rạp chiếu', cinemaName);
      await pickSearchableOption(page, 'Phòng', roomName);
      await page.getByRole('button', { name: '＋ Thêm ghế' }).click();
      let dialog = page.getByRole('dialog');
      await dialog.getByLabel('Hàng ghế').fill('K');
      await dialog.getByLabel('Số ghế').fill('3');
      await selectCustomOption(dialog, 'Loại ghế', 'Sweetbox');
      await dialog.getByRole('button', { name: 'Lưu ghế' }).click();
      await dialog.waitFor({ state: 'hidden' });
      let seat;
      await expectPoll(
        async () =>
          (seat = await one(
            pool,
            "SELECT * FROM dbo.GHE WHERE PhongID = @r AND HangGhe = N'K' AND SoGhe = 3",
            { r: roomId },
          )),
        { message: 'seat missing' },
      );
      assert.equal(seat.LoaiGhe, 'Sweetbox');
      await page.getByRole('button', { name: 'Danh sách', exact: true }).click();
      await page.getByRole('button', { name: 'Xem K3' }).click();
      await page.getByRole('button', { name: 'Sửa ghế' }).click();
      // The seat inspector stays open behind its editor; assert that the editor closes.
      dialog = page.getByRole('dialog', { name: 'Chỉnh sửa ghế' });
      await selectCustomOption(dialog, 'Trạng thái', 'Hỏng');
      await dialog.getByRole('button', { name: 'Lưu ghế' }).click();
      await dialog.waitFor({ state: 'hidden' });
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT TrangThai FROM dbo.GHE WHERE GheID = @g', {
            g: seat.GheID,
          })) === 'Hỏng',
        { message: 'seat status not updated' },
      );
      await page.getByRole('button', { name: 'Xóa ghế' }).click();
      await confirmIfAsked(page);
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT COUNT(*) FROM dbo.GHE WHERE GheID = @g', {
            g: seat.GheID,
          })) === 0,
        { message: 'seat not deleted' },
      );

      // ---- rooms workspace: edit then delete
      await page.goto(`${origin}/admin/facilities/rooms?cinemaId=${cinemaId}`);
      await page.getByRole('button', { name: `Sửa ${roomName} · ${cinemaName}` }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Tên phòng').fill(`${roomName} v2`);
      await selectCustomOption(dialog, 'Loại phòng', 'IMAX');
      await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
      await dialog.waitFor({ state: 'hidden' });
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT LoaiPhong FROM dbo.PHONGCHIEU WHERE PhongID = @r', {
            r: roomId,
          })) === 'IMAX',
        { message: 'room not updated' },
      );
      const label = `${roomName} v2 · ${cinemaName}`;
      const summary = page.locator(`summary[aria-label="Thao tác khác ${label}"]`);
      if (await summary.count()) await summary.click();
      await page.getByRole('button', { name: `Xóa ${label}` }).click();
      await confirmIfAsked(page, /Xác nhận xử lý phòng|Xác nhận/);
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT COUNT(*) FROM dbo.PHONGCHIEU WHERE PhongID = @r', {
            r: roomId,
          })) === 0,
        { message: 'room not deleted' },
      );
      return { cinemaId, roomId, seatId: seat.GheID };
    },
  },

  // ------------------------------------------------------------------ Admin: bookings CRUD + showtime edit
  {
    id: 'E2E-ADM-BOOKING-CRUD',
    title:
      'ADM-18 Admin creates a booking for a customer through the wizard, then cancels it (history kept)',
    async run({ page, origin, pool, apiBase, assert }) {
      const show = await setupShowtime(apiBase, pool, { isolated: true });
      const customer = await setupCustomer(apiBase, pool, 'admbook');
      await uiLogin(page, origin, ACCOUNTS.admin);
      await page.goto(`${origin}/admin/bookings`);
      await page.getByRole('button', { name: 'Tạo đơn đặt vé' }).click();
      await page.getByLabel('Tìm Customer bằng tên/email/SĐT').fill(customer.email);
      await page.getByRole('button', { name: 'Tìm khách hàng' }).click();
      await page.getByLabel('Khách hàng có sẵn').selectOption(String(customer.id));
      await page.getByRole('button', { name: 'Tiếp tục' }).click();
      await page.getByLabel('Rạp đặt vé').selectOption(String(show.cinemaId));
      await page.getByLabel('Suất chiếu / phim / phòng').selectOption(String(show.showtimeId));
      await page.getByRole('button', { name: 'Tiếp tục' }).click();
      const seats = page.locator('button.seat-button[data-status="Trống"]');
      await seats.first().waitFor();
      const labels = [
        (await seats.nth(0).textContent()).trim(),
        (await seats.nth(1).textContent()).trim(),
      ];
      await seats.nth(0).click();
      await seats.nth(1).click();
      await page.getByRole('button', { name: 'Tiếp tục' }).click();
      await page.getByRole('button', { name: 'Tạo đơn Chờ thanh toán' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
      let order;
      await expectPoll(
        async () =>
          (order = await one(
            pool,
            'SELECT * FROM dbo.DONDATVE WHERE NguoiDungID = @u AND SuatChieuID = @s',
            { u: customer.id, s: show.showtimeId },
          )),
        { message: 'order missing' },
      );
      assert.equal(order.TrangThai, 'Chờ thanh toán');
      const seatLabels = (
        await rows(
          pool,
          `SELECT g.HangGhe + CAST(g.SoGhe AS VARCHAR(10)) AS l FROM dbo.CHITIETVE v JOIN dbo.GHE g ON g.GheID = v.GheID WHERE v.DonDatVeID = @o`,
          { o: order.DonDatVeID },
        )
      ).map((r) => r.l);
      assert.deepEqual(seatLabels.sort(), [...labels].sort());
      await expectText(page, `Đơn #${order.DonDatVeID}`);
      await page.getByRole('button', { name: 'Hủy đơn', exact: true }).first().click();
      await page.getByRole('dialog').getByRole('button', { name: 'Hủy đơn', exact: true }).last().click();
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @o', {
            o: order.DonDatVeID,
          })) === 'Đã hủy',
        { message: 'order not cancelled' },
      );
      assert.equal(
        await scalar(pool, 'SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID = @o', {
          o: order.DonDatVeID,
        }),
        2,
      );
      return { orderId: order.DonDatVeID };
    },
  },
  {
    id: 'E2E-ADM-SHOWTIME-EDIT',
    title:
      'ADM-14 Admin edits the base price of a showtime without orders through the Operations screen',
    async run({ page, origin, pool, apiBase, assert }) {
      const show = await setupShowtime(apiBase, pool, { minSeats: 4 });
      const date = new Date(show.startsAt.getTime() + 7 * 3600000).toISOString().slice(0, 10);
      await uiLogin(page, origin, ACCOUNTS.admin);
      await page.goto(
        `${origin}/admin/operations/showtimes?cinemaId=${show.cinemaId}&movieId=${show.movieId}`,
      );
      await page.getByRole('textbox', { name: /^Từ ngày/ }).fill(date);
      await page.getByRole('textbox', { name: /^Đến ngày/ }).fill(date);
      await selectCustomOption(page, 'Phòng lọc lịch', String(show.roomId));
      await page.getByRole('button', { name: 'Áp dụng lọc' }).click();
      await expectPoll(
        async () => (await page.getByRole('button', { name: /^Sửa / }).count()) >= 1,
        { message: 'showtime row missing' },
      );
      const edit = page.getByRole('button', { name: /^Sửa / });
      await edit.last().click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel(/Giá vé cơ bản/).fill('99000');
      await dialog
        .getByRole('button', { name: /^(Lưu|Cập nhật)/ })
        .first()
        .click();
      await dialog.waitFor({ state: 'hidden' });
      await expectPoll(
        async () =>
          Number(
            await scalar(pool, 'SELECT GiaVeCoBan FROM dbo.SUATCHIEU WHERE SuatChieuID = @s', {
              s: show.showtimeId,
            }),
          ) === 99000,
        { message: 'price not updated' },
      );
      return { showtimeId: show.showtimeId };
    },
  },

  // ------------------------------------------------------------------ Seat-hold expiry in the UI
  {
    id: 'E2E-EXP-HOLD',
    title:
      'Hold expiry (UI): expired order cannot be paid, background job expires it, seats are free again on the booking page',
    async run({ page, origin, pool, apiBase, assert }) {
      const show = await setupShowtime(apiBase, pool, { minSeats: 8 });
      const customer = await setupCustomer(apiBase, pool, 'expui');
      await uiLogin(page, origin, customer.email, customer.password);
      await page.goto(`${origin}/booking/${show.showtimeId}`);
      const seat = page.locator('button.cp-seat[data-status="Trống"]').first();
      await seat.waitFor();
      const seatLabel = (await seat.textContent()).trim();
      await seat.click();
      await visible(page.getByRole('button', { name: 'Đặt vé', exact: true }))
        .first()
        .click();
      await expectText(page, 'Đã tạo đơn, chờ thanh toán');
      const order = await one(
        pool,
        'SELECT TOP 1 DonDatVeID FROM dbo.DONDATVE WHERE NguoiDungID = @u ORDER BY DonDatVeID DESC',
        { u: customer.id },
      );
      await page.getByRole('link', { name: 'Thanh toán đơn này' }).click();
      await page.getByRole('button', { name: 'Xác nhận thanh toán' }).waitFor();

      // test-only time travel on the TEST database
      await pool
        .request()
        .input('o', order.DonDatVeID)
        .query(
          `UPDATE dbo.DONDATVE SET HanGiuCho = DATEADD(MINUTE, -5, dbo.fn_BayGio()) WHERE DonDatVeID = @o AND TrangThai = N'Chờ thanh toán'`,
        );
      await page.reload();
      await expectPoll(
        async () =>
          !(await page
            .getByRole('button', { name: 'Xác nhận thanh toán' })
            .isEnabled()
            .catch(() => false)),
        { message: 'payment must not be possible after the hold elapsed' },
      );
      // the real background job (60 s tick) expires it; the page polls and shows the final state
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @o', {
            o: order.DonDatVeID,
          })) === 'Hết hạn',
        { timeout: 95000, message: 'background job did not expire the order within 95 s' },
      );
      await expectText(page, 'Ghế đã được giải phóng', 20000);
      assert.equal(await page.getByRole('button', { name: 'Xác nhận thanh toán' }).count(), 0);
      await page.goto(`${origin}/booking/${show.showtimeId}`);
      const again = page.locator('button.cp-seat', { hasText: new RegExp(`^${seatLabel}$`) });
      await again.waitFor();
      assert.equal(await again.getAttribute('data-status'), 'Trống');
      return { orderId: order.DonDatVeID, seat: seatLabel };
    },
  },

  // ------------------------------------------------------------------ Compensated cancellation in the UI
  {
    id: 'E2E-CMP-CANCEL',
    title:
      'Compensated cancel (UI): customer pays, Admin cancels the showtime, customer sees cancelled order + points',
    async run({ page, context, origin, pool, apiBase, assert }) {
      const show = await setupShowtime(apiBase, pool, { minSeats: 8 });
      const customer = await setupCustomer(apiBase, pool, 'cmpui');
      await uiLogin(page, origin, customer.email, customer.password);
      await page.goto(`${origin}/booking/${show.showtimeId}`);
      const seats = page.locator('button.cp-seat[data-status="Trống"]');
      await seats.first().waitFor();
      await seats.nth(0).click();
      await seats.nth(1).click();
      await page
        .getByRole('button', { name: /^Tăng số lượng / })
        .first()
        .click();
      await page.getByLabel('Mã khuyến mãi').fill('DEMO20K');
      await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
      await expectText(page, 'Giảm tạm tính');
      await visible(page.getByRole('button', { name: 'Đặt vé', exact: true }))
        .first()
        .click();
      await expectText(page, 'Đã tạo đơn, chờ thanh toán');
      await page.getByRole('link', { name: 'Thanh toán đơn này' }).click();
      await page.getByLabel('Phương thức').selectOption('ZALOPAY');
      await page.getByRole('button', { name: 'Xác nhận thanh toán' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await expectText(page, 'Đã xác nhận thanh toán thành công');
      const order = await one(
        pool,
        'SELECT TOP 1 * FROM dbo.DONDATVE WHERE NguoiDungID = @u ORDER BY DonDatVeID DESC',
        { u: customer.id },
      );
      assert.equal(order.TrangThai, 'Đã thanh toán');
      const ticket = Number(order.TongTienVe);
      const food = Number(order.TongTienDoAn);
      const discount = Number(order.TienGiamGia);
      assert.ok(discount > 0, 'promotion should apply');
      const expectedPoints = Math.floor(
        Math.max(0, ticket - (discount * ticket) / (ticket + food)) / 1000,
      );
      const pointsBefore =
        (await scalar(pool, 'SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @u', {
          u: customer.id,
        })) ?? 0;

      // Admin cancels the showtime from the Operations screen
      const admin = await context.browser().newContext({ viewport: { width: 1366, height: 900 } });
      const adminPage = await admin.newPage();
      await uiLogin(adminPage, origin, ACCOUNTS.admin);
      const date = new Date(show.startsAt.getTime() + 7 * 3600000).toISOString().slice(0, 10);
      await adminPage.goto(`${origin}/admin/operations/showtimes?cinemaId=${show.cinemaId}`);
      await adminPage.getByRole('textbox', { name: /^Từ ngày/ }).fill(date);
      await adminPage.getByRole('textbox', { name: /^Đến ngày/ }).fill(date);
      await adminPage.getByLabel('Phòng lọc lịch').selectOption(String(show.roomId));
      await adminPage.getByRole('button', { name: 'Áp dụng lọc' }).click();
      await expectPoll(
        async () => (await adminPage.getByRole('button', { name: /^Hủy / }).count()) >= 1,
        { message: 'cancel button missing' },
      );
      await adminPage.getByRole('button', { name: /^Hủy / }).last().click();
      await adminPage.getByRole('dialog').getByRole('button', { name: 'Hủy suất chiếu' }).click();
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @s', {
            s: show.showtimeId,
          })) === 'Đã hủy',
        { message: 'showtime not cancelled' },
      );
      await admin.close();

      const after = await one(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @o', {
        o: order.DonDatVeID,
      });
      assert.equal(after.TrangThai, 'Đã hủy');
      const credit = await rows(
        pool,
        'SELECT DiemBoiThuong FROM dbo.BOITHUONG_HUYSUAT WHERE DonDatVeID = @o',
        { o: order.DonDatVeID },
      );
      assert.deepEqual(
        credit.map((c) => c.DiemBoiThuong),
        [expectedPoints],
      );
      assert.equal(
        await scalar(pool, 'SELECT DiemTichLuy FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @u', {
          u: customer.id,
        }),
        pointsBefore + expectedPoints,
      );
      assert.deepEqual(
        (
          await rows(pool, 'SELECT TrangThai FROM dbo.THANHTOAN WHERE DonDatVeID = @o', {
            o: order.DonDatVeID,
          })
        ).map((p) => p.TrangThai),
        ['Thành công'],
      );

      // customer sees it
      await page.goto(`${origin}/orders/${order.DonDatVeID}`);
      await expectText(page, 'Suất chiếu đã bị hủy');
      await expectText(page, `Điểm bồi thường đã cộng: ${expectedPoints}`);
      return { orderId: order.DonDatVeID, points: expectedPoints, discount };
    },
  },

  // ------------------------------------------------------------------ Points payment & revenue (business rule)
  {
    id: 'E2E-PTS-PARTIAL',
    title:
      'Points (UI): spend 30 of 100 points on a 100.000 ticket → server preview, order, cash 70.000, revenue +70.000',
    async run({ page, origin, pool, apiBase, assert }) {
      const funded = await fundedCustomer(apiBase, pool, 'ptspart');
      const show = await setupShowtime(apiBase, pool, { basePrice: 100000 });
      const before = await cashLedger(pool);
      await uiLogin(page, origin, funded.email, funded.password);
      await page.goto(`${origin}/booking/${show.showtimeId}`);
      await page.locator('button.cp-seat[data-status="Trống"]').first().click();
      await expectText(page, '100 điểm');
      await page.getByLabel('Số điểm muốn dùng').fill('30');
      await expectText(page, 'Dùng 30 điểm: giảm');
      await expectText(page, '70.000');
      assert.equal(await balanceOf(pool, funded.id), 100, 'preview never spends points');
      await visible(page.getByRole('button', { name: 'Đặt vé', exact: true }))
        .first()
        .click();
      await expectText(page, 'Đã dùng 30 điểm');
      const order = await one(
        pool,
        'SELECT TOP 1 * FROM dbo.DONDATVE WHERE NguoiDungID = @u ORDER BY DonDatVeID DESC',
        { u: funded.id },
      );
      assert.deepEqual([order.DiemSuDung, Number(order.TienGiamGia)], [30, 30000]);
      assert.equal(await balanceOf(pool, funded.id), 70);
      await page.getByRole('link', { name: 'Thanh toán đơn này' }).click();
      await expectText(page, 'Đã dùng 30 điểm');
      await page.getByLabel('Phương thức').selectOption('VNPAY');
      await page.getByRole('button', { name: 'Xác nhận thanh toán' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await expectText(page, 'Đã xác nhận thanh toán thành công');
      const after = await cashLedger(pool);
      assert.equal(after.cash - before.cash, 70000);
      assert.equal(after.pointsValue - before.pointsValue, 30000);
      assert.equal(await balanceOf(pool, funded.id), 70 + 70);
      return { cash: 70000, pointsValue: 30000 };
    },
  },
  {
    id: 'E2E-PTS-FULL',
    title:
      'Points (UI): "Dùng tối đa" pays 100 % with points → points-only confirmation, DIEM payment, cash +0',
    async run({ page, origin, pool, apiBase, assert }) {
      const funded = await fundedCustomer(apiBase, pool, 'ptsfull');
      const show = await setupShowtime(apiBase, pool, { basePrice: 100000 });
      const before = await cashLedger(pool);
      await uiLogin(page, origin, funded.email, funded.password);
      await page.goto(`${origin}/booking/${show.showtimeId}`);
      await page.locator('button.cp-seat[data-status="Trống"]').first().click();
      await expectPoll(
        async () => await page.getByRole('button', { name: 'Dùng tối đa' }).isEnabled(),
        { message: 'max points never became available' },
      );
      await page.getByRole('button', { name: 'Dùng tối đa' }).click();
      await expectPoll(
        async () => (await page.getByLabel('Số điểm muốn dùng').inputValue()) === '100',
        { message: 'max points not applied' },
      );
      await expectText(page, 'Còn phải thanh toán:');
      await visible(page.getByRole('button', { name: 'Đặt vé', exact: true }))
        .first()
        .click();
      await expectText(page, 'Đơn đã được trả đủ bằng điểm');
      await page.getByRole('link', { name: 'Thanh toán đơn này' }).click();
      await expectText(page, 'Đơn đã được trả đủ bằng điểm. Hãy xác nhận để hoàn tất đơn.');
      assert.equal(
        await page.getByLabel('Phương thức').count(),
        0,
        'no cash method selector for a fully paid order',
      );
      await page.getByRole('button', { name: 'Xác nhận thanh toán bằng điểm' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await expectText(page, 'Đã xác nhận thanh toán thành công');
      const order = await one(
        pool,
        'SELECT TOP 1 * FROM dbo.DONDATVE WHERE NguoiDungID = @u ORDER BY DonDatVeID DESC',
        { u: funded.id },
      );
      assert.equal(order.TrangThai, 'Đã thanh toán');
      assert.deepEqual(
        (
          await rows(
            pool,
            'SELECT PhuongThuc, TrangThai FROM dbo.THANHTOAN WHERE DonDatVeID = @o',
            { o: order.DonDatVeID },
          )
        ).map((p) => `${p.PhuongThuc}:${p.TrangThai}`),
        ['DIEM:Thành công'],
      );
      const after = await cashLedger(pool);
      assert.equal(
        after.cash - before.cash,
        0,
        'no cash revenue for a ticket paid 100 % with points',
      );
      assert.equal(await balanceOf(pool, funded.id), 0);
      return { cash: 0, pointsValue: after.pointsValue - before.pointsValue };
    },
  },
  {
    id: 'E2E-PTS-COMPENSATION',
    title:
      'Compensation (UI): showtime cancelled by Admin → points shown to the customer, money kept; points then buy a new ticket at 0 cash',
    async run({ page, context, origin, pool, apiBase, assert }) {
      const call = await api(apiBase);
      const customer = await setupCustomer(apiBase, pool, 'ptscomp');
      const show = await setupShowtime(apiBase, pool, { basePrice: 100000 });
      const paidShow = await bookAndPay(call, customer, show.showtimeId, 1);
      const earned = await balanceOf(pool, customer.id); // 100 earned from the cash payment
      const before = await cashLedger(pool);

      const admin = await context.browser().newContext({ viewport: { width: 1366, height: 900 } });
      const adminPage = await admin.newPage();
      await uiLogin(adminPage, origin, ACCOUNTS.admin);
      const date = new Date(show.startsAt.getTime() + 7 * 3600000).toISOString().slice(0, 10);
      await adminPage.goto(`${origin}/admin/operations/showtimes?cinemaId=${show.cinemaId}`);
      await adminPage.getByRole('textbox', { name: /^Từ ngày/ }).fill(date);
      await adminPage.getByRole('textbox', { name: /^Đến ngày/ }).fill(date);
      await adminPage.getByLabel('Phòng lọc lịch').selectOption(String(show.roomId));
      await adminPage.getByRole('button', { name: 'Áp dụng lọc' }).click();
      await expectPoll(
        async () => (await adminPage.getByRole('button', { name: /^Hủy / }).count()) >= 1,
        { message: 'cancel button missing' },
      );
      await adminPage.getByRole('button', { name: /^Hủy / }).last().click();
      await adminPage.getByRole('dialog').getByRole('button', { name: 'Hủy suất chiếu' }).click();
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @s', {
            s: show.showtimeId,
          })) === 'Đã hủy',
        { message: 'showtime not cancelled' },
      );
      await admin.close();

      const afterCancel = await cashLedger(pool);
      assert.equal(
        afterCancel.cash,
        before.cash,
        'cancelling a showtime never reduces money received',
      );
      assert.equal(
        await balanceOf(pool, customer.id),
        earned + 100,
        'compensation = ticket value paid / 1.000',
      );

      await uiLogin(page, origin, customer.email, customer.password);
      await page.goto(`${origin}/orders/${paidShow.orderId}`);
      await expectText(page, 'Điểm bồi thường đã cộng: 100');

      // the compensation is spendable: a new 100.000 ticket is paid fully with 100 of the 200 points
      const next = await setupShowtime(apiBase, pool, { basePrice: 100000 });
      await page.goto(`${origin}/booking/${next.showtimeId}`);
      await page.locator('button.cp-seat[data-status="Trống"]').first().click();
      await expectPoll(
        async () => await page.getByRole('button', { name: 'Dùng tối đa' }).isEnabled(),
        { message: 'max points never became available' },
      );
      await page.getByRole('button', { name: 'Dùng tối đa' }).click();
      await expectPoll(
        async () => (await page.getByLabel('Số điểm muốn dùng').inputValue()) === '100',
        { message: 'max points not applied' },
      );
      await visible(page.getByRole('button', { name: 'Đặt vé', exact: true }))
        .first()
        .click();
      await page.getByRole('link', { name: 'Thanh toán đơn này' }).click();
      await page.getByRole('button', { name: 'Xác nhận thanh toán bằng điểm' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await expectText(page, 'Đã xác nhận thanh toán thành công');
      const afterReuse = await cashLedger(pool);
      assert.equal(
        afterReuse.cash,
        before.cash,
        'spending compensation points creates no new cash revenue',
      );
      assert.equal(await balanceOf(pool, customer.id), earned + 100 - 100);
      return { compensated: 100, cashUnchanged: before.cash };
    },
  },
];

// ====================================================================== responsive & accessibility
async function runAxe(page) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
    return result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
    }));
  });
}

async function auditPages(ctx, viewport) {
  const { browser, origin, pool, apiBase, assert } = ctx;
  const screenshotDir = path.join(
    ROOT,
    '.audit-output',
    'frontend-page-audit',
    `${viewport.width}x${viewport.height}`,
  );
  fs.mkdirSync(screenshotDir, { recursive: true });
  const auditCustomer = await one(
    pool,
    `SELECT TOP 1 n.Email FROM dbo.NGUOIDUNG n
      WHERE n.Email LIKE @prefix
        AND EXISTS (SELECT 1 FROM dbo.DONDATVE d WHERE d.NguoiDungID = n.NguoiDungID)
        AND EXISTS (SELECT 1 FROM dbo.KHIEUNAI k WHERE k.NguoiDungID = n.NguoiDungID)
      ORDER BY n.NguoiDungID DESC`,
    { prefix: 'e2e.ui.%' },
  );
  const auditCustomerEmail = auditCustomer?.Email ?? ACCOUNTS.customer;
  const complaint = await one(
    pool,
    `SELECT TOP 1 k.KhieuNaiID FROM dbo.KHIEUNAI k JOIN dbo.NGUOIDUNG n ON n.NguoiDungID = k.NguoiDungID
      WHERE n.Email = @e ORDER BY k.KhieuNaiID DESC`,
    { e: auditCustomerEmail },
  );
  const plan = {
    manager: [
      '/manager/rooms',
      '/manager/seats',
      '/manager/showtimes',
      '/manager/pricing',
      '/manager/bookings',
      '/manager/revenue',
    ],
    support: [
      '/support/complaints',
      `/support/complaints/${complaint?.KhieuNaiID ?? 1}`,
    ],
    admin: [
      '/admin/access/users',
      '/admin/access/assignments',
      '/admin/catalog/movies',
      '/admin/catalog/genres',
      '/admin/catalog/actors',
      '/admin/commerce/products',
      '/admin/commerce/promotions',
      '/admin/cinemas',
      '/admin/cinemas/images',
      '/admin/facilities/rooms',
      '/admin/facilities/seats',
      '/admin/operations/showtimes',
      '/admin/operations/pricing',
      '/admin/bookings',
      '/admin/service/complaints',
      '/admin/service/escalations',
      '/admin/reports/revenue',
    ],
  };
  const accountFor = {
    manager: ACCOUNTS.manager,
    support: ACCOUNTS.support,
    admin: ACCOUNTS.admin,
  };
  const findings = [];
  let pages = 0;
  for (const [role, paths] of Object.entries(plan)) {
    const { deviceScaleFactor = 1, ...pageViewport } = viewport;
    const context = await browser.newContext({ viewport: pageViewport, deviceScaleFactor });
    const page = await context.newPage();
    if (role !== 'public')
      await uiLogin(
        page,
        origin,
        accountFor[role],
        role === 'customer' && auditCustomer ? 'E2eTest-123!' : undefined,
      );
    for (const route of paths) {
      const runtimeErrors = [];
      const onPageError = (error) => runtimeErrors.push(`uncaught JavaScript: ${error.message}`);
      const onConsole = (message) => {
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:'))
          runtimeErrors.push(`console.error: ${message.text()}`);
      };
      const onResponse = (response) => {
        if (response.url().startsWith(apiBase) && response.status() >= 500)
          runtimeErrors.push(`API ${response.status()}: ${response.request().method()} ${response.url()}`);
      };
      page.on('pageerror', onPageError);
      page.on('console', onConsole);
      page.on('response', onResponse);
      await page.goto(`${origin}${route}`);
      await page.waitForLoadState('networkidle').catch(() => {});
      await sleep(400);
      pages += 1;
      const main = page.locator('main').first();
      const mainVisible = await main.isVisible().catch(() => false);
      const mainText = mainVisible ? await main.innerText().catch(() => '') : '';
      if (!mainVisible || !mainText.trim())
        findings.push(`${role} ${route}: no visible, populated main content (landed ${page.url()})`);
      if (role === 'admin' && route.startsWith('/admin/')) {
        const navPaths = await page.locator('.staff-shell__nav-group a').evaluateAll((links) =>
          links.map((link) => new URL(link.href).pathname),
        );
        if (!navPaths.includes(route))
          findings.push(`${role} ${route}: page has no matching staff navigation link`);
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      if (overflow > 1) findings.push(`${role} ${route}: horizontal overflow ${overflow}px`);
      for (const violation of await runAxe(page))
        findings.push(
          `${role} ${route}: ${violation.id} (${violation.impact}) ${violation.nodes.join(' | ')}`,
        );
      const routeName = route.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '') || 'home';
      await page.screenshot({
        path: path.join(screenshotDir, `${role}-${routeName}.png`),
        fullPage: true,
      });
      const localOrigins = [new URL(origin).origin, new URL(apiBase).origin];
      const brokenImages = await page.locator('img').evaluateAll((images, allowedOrigins) =>
        images
          .filter((image) => {
            const rect = image.getBoundingClientRect();
            const style = getComputedStyle(image);
            let imageOrigin = '';
            try {
              imageOrigin = new URL(image.currentSrc || image.src, window.location.href).origin;
            } catch {
              return false;
            }
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              image.complete &&
              image.naturalWidth === 0 &&
              allowedOrigins.includes(imageOrigin)
            );
          })
          .map((image) => image.currentSrc || image.src),
        localOrigins,
      );
      if (brokenImages.length)
        findings.push(`${role} ${route}: broken images ${brokenImages.join(' | ')}`);
      if (runtimeErrors.length)
        findings.push(`${role} ${route}: ${runtimeErrors.join(' | ')}`);
      page.off('pageerror', onPageError);
      page.off('console', onConsole);
      page.off('response', onResponse);
    }
    await context.close();
  }
  for (const finding of findings) console.log(`[PAGE-AUDIT] ${finding}`);
  assert.deepEqual(findings, [], `${findings.length} responsive/accessibility findings`);
  return { pages, viewport: `${viewport.width}x${viewport.height}` };
}

const viewports = [
  ['E2E-A11Y-DESKTOP', 'Desktop 1366×900', { width: 1366, height: 900 }],
  ['E2E-A11Y-TABLET', 'Tablet 768×1024', { width: 768, height: 1024 }],
  ['E2E-A11Y-MOBILE', 'Mobile 390×844', { width: 390, height: 844 }],
  [
    'E2E-A11Y-ZOOM-200',
    'Desktop 200% zoom equivalent (683×450 CSS px at 2× device scale)',
    { width: 683, height: 450, deviceScaleFactor: 2 },
  ],
];
export const responsiveScenarios = [
  ...viewports.map(([id, name, viewport]) => ({
    id,
    title: `${name}: WCAG 2.2 A/AA and no horizontal overflow on all active Admin, Manager and CSKH filter routes`,
    async run(ctx) {
      return auditPages({ ...ctx, browser: ctx.context.browser() }, viewport);
    },
  })),
  {
    id: 'E2E-RESP-MOBILE-FLOWS',
    title:
      'Mobile 390×844: booking via the bottom bar, staff drawer navigation and tap targets stay usable',
    async run({ context, origin, pool, apiBase, assert }) {
      const browser = context.browser();
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await ctx.newPage();
      const show = await setupShowtime(apiBase, pool, { minSeats: 6 });
      const customer = await setupCustomer(apiBase, pool, 'mobile');
      await uiLogin(page, origin, customer.email, customer.password);
      await page.goto(`${origin}/booking/${show.showtimeId}`);
      const seat = page.locator('button.cp-seat[data-status="Trống"]').first();
      await seat.waitFor();
      const box = await seat.boundingBox();
      assert.ok(box.width >= 24 && box.height >= 24, `seat tap target ${box.width}x${box.height}`);
      await seat.tap();
      const bar = page
        .locator('.cp-booking-mobile-bar')
        .getByRole('button', { name: 'Đặt vé', exact: true });
      await bar.waitFor({ state: 'visible' });
      await bar.tap();
      await expectText(page, 'Đã tạo đơn, chờ thanh toán');
      assert.equal(
        await scalar(
          pool,
          `SELECT COUNT(*) FROM dbo.DONDATVE WHERE NguoiDungID = @u AND TrangThai = N'Chờ thanh toán'`,
          { u: customer.id },
        ),
        1,
      );
      await ctx.close();

      // staff drawer
      const staff = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      });
      const admin = await staff.newPage();
      await uiLogin(admin, origin, ACCOUNTS.admin);
      await admin.goto(`${origin}/admin/overview`);
      await admin.getByRole('button', { name: 'Mở điều hướng quản trị' }).tap();
      const nav = admin.getByRole('dialog').getByRole('link', { name: 'Thể loại' });
      await nav.waitFor({ state: 'visible' });
      const navigationEvidence = path.join(
        ROOT,
        '.audit-output',
        'acceptance',
        'screenshots',
        'E2E-RESP-MOBILE-FLOWS-NAV-DRAWER.png',
      );
      fs.mkdirSync(path.dirname(navigationEvidence), { recursive: true });
      await admin.screenshot({ path: navigationEvidence, fullPage: true });
      await nav.tap();
      await admin.waitForURL('**/admin/catalog/genres');
      const overflow = await admin.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      assert.ok(overflow <= 1, `overflow ${overflow}`);
      await staff.close();
      return { showtimeId: show.showtimeId };
    },
  },
  {
    id: 'E2E-A11Y-KEYBOARD',
    title:
      'Keyboard: seat map arrow navigation + Space toggles; dialogs trap focus, Esc closes and restores focus',
    async run({ page, origin, pool, apiBase, assert }) {
      const show = await setupShowtime(apiBase, pool, { minSeats: 8 });
      await page.goto(`${origin}/booking/${show.showtimeId}`);
      const first = page.locator('button.cp-seat[data-status="Trống"]').first();
      await first.waitFor();
      await first.focus();
      const firstId = await first.getAttribute('data-seat-id');
      await page.keyboard.press('ArrowRight');
      const movedTo = await page.evaluate(() =>
        document.activeElement?.getAttribute('data-seat-id'),
      );
      assert.ok(movedTo && movedTo !== firstId, 'ArrowRight must move focus to the next free seat');
      await page.keyboard.press('Space');
      assert.equal(
        await page
          .locator(`button.cp-seat[data-seat-id="${movedTo}"]`)
          .getAttribute('aria-pressed'),
        'true',
      );
      await page.keyboard.press('Space');
      assert.equal(
        await page
          .locator(`button.cp-seat[data-seat-id="${movedTo}"]`)
          .getAttribute('aria-pressed'),
        'false',
      );

      // Capture the actual focus path from the reloaded route through the skip target.
      await page.goto(`${origin}/movies`);
      const focusBeforeTab = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        id: document.activeElement?.id,
        className: document.activeElement?.className,
        text: document.activeElement?.textContent?.trim(),
      }));
      await page.keyboard.press('Tab');
      const skipFocus = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        id: document.activeElement?.id,
        className: document.activeElement?.className,
        href: document.activeElement?.getAttribute('href'),
        text: document.activeElement?.textContent?.trim(),
      }));
      assert.match(skipFocus.text ?? '', /Chuyển đến nội dung chính/);
      assert.equal(skipFocus.href, '#main-content');
      await page.keyboard.press('Enter');
      const mainFocus = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        id: document.activeElement?.id,
      }));
      assert.equal(mainFocus.id, 'main-content', 'skip link must focus the main region');

      // dialog: focus is inside, Escape closes, focus returns to the trigger
      await uiLogin(page, origin, ACCOUNTS.admin);
      await page.goto(`${origin}/admin/catalog/genres`);
      const trigger = page.getByRole('button', { name: 'Thêm thể loại' });
      await expectPoll(async () => trigger.isEnabled(), {
        message: 'add button never became enabled',
      });
      await trigger.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog');
      await dialog.waitFor({ state: 'visible' });
      const insideDialog = async () =>
        page.evaluate(() => Boolean(document.activeElement?.closest('dialog[open]')));
      assert.equal(await insideDialog(), true, 'focus must move into the dialog');
      // A modal <dialog> makes the rest of the page inert: Tab may leave to the browser UI (activeElement
      // becomes <body>) but must never land on page content behind the dialog.
      const behindDialog = async () =>
        page.evaluate(() => {
          const el = document.activeElement;
          return Boolean(el && el !== document.body && !el.closest('dialog[open]'));
        });
      for (let i = 0; i < 12; i += 1) {
        await page.keyboard.press('Tab');
        assert.equal(
          await behindDialog(),
          false,
          'focus escaped to content behind the modal dialog',
        );
      }
      await dialog.locator('input, button').first().focus();
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      const restored = await page.evaluate(() => document.activeElement?.textContent?.trim());
      assert.match(restored ?? '', /Thêm thể loại/);
      return { seat: movedTo, focusBeforeTab, skipFocus, mainFocus };
    },
  },
];

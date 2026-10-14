// Scenario definitions for the Interactive Browser E2E runner. Each `run` receives
// { page, context, pool, origin, RUN, assert, ... } and returns a small evidence object.
import { ACCOUNTS, apiClient, assertTestDatabase, ensureSandbox, loginStaff, one, rows, scalar } from './lib.mjs';
import { uiLogin, uiRegister, expectText, confirmIfAsked, expectPoll, visible } from './browser-helpers.mjs';
import { managerScenarios } from './browser-scenarios-manager.mjs';
import { adminScenarios } from './browser-scenarios-admin.mjs';
import { hardeningScenarios, responsiveScenarios } from './browser-scenarios-hardening.mjs';

const money = (value) => Number(value);

const phoneFor = (RUN, n) => `09${String((parseInt(RUN, 36) * 7 + n) % 100000000).padStart(8, '0')}`;

async function userId(pool, email) {
  return (await one(pool, 'SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = @e', { e: email })).NguoiDungID;
}

// A freshly registered customer through the UI, reused by the customer scenarios.
const customer = {};
async function ensureCustomer({ page, origin, pool, RUN }) {
  if (customer.email) return customer;
  customer.email = `e2e.ui.${RUN}@example.test`;
  customer.password = 'E2eTest-123!';
  customer.name = `E2E Khách ${RUN}`;
  await uiRegister(page, origin, {
    name: customer.name,
    email: customer.email,
    password: customer.password,
    phone: phoneFor(RUN, 11),
  });
  customer.id = await userId(pool, customer.email);
  return customer;
}

export const scenarios = [
  // ======================================================================= CUSTOMER: register
  {
    id: 'E2E-CUST-REG',
    title: 'KH-01/02 register through the form, then sign in; account persisted with hashed password',
    async run({ page, origin, pool, RUN, assert }) {
      const account = await ensureCustomer({ page, origin, pool, RUN });
      await expectText(page, 'Đăng ký tài khoản thành công');
      const row = await one(
        pool,
        `SELECT n.MatKhau, n.TrangThai, v.MaVaiTro FROM dbo.NGUOIDUNG n
           JOIN dbo.VAITRO v ON v.VaiTroID = n.VaiTroID WHERE n.NguoiDungID = @id`,
        { id: account.id },
      );
      assert.equal(row.MaVaiTro, 'KHACH_HANG');
      assert.equal(row.TrangThai, 'Hoạt động');
      assert.match(row.MatKhau, /^\$2[aby]\$/);
      await uiLogin(page, origin, account.email, account.password);
      assert.equal(new URL(page.url()).pathname, '/');
      const profile = await scalar(pool, 'SELECT COUNT(*) FROM dbo.HOSOKHACHHANG WHERE NguoiDungID = @id', { id: account.id });
      assert.equal(profile, 1);
      return { userId: account.id };
    },
  },

  // ======================================================================= CUSTOMER: seats → food → promo → pay
  {
    id: 'E2E-CUST-BOOK',
    title: 'KH-06..10 pick seats → food → promotion → create order → pay; order/tickets/food/payment verified in SQL',
    async run({ page, origin, pool, RUN, assert }) {
      const account = await ensureCustomer({ page, origin, pool, RUN });
      await uiLogin(page, origin, account.email, account.password);

      const target = await one(
        pool,
        `SELECT TOP 1 s.SuatChieuID, s.PhimID FROM dbo.SUATCHIEU s
           JOIN dbo.vw_LichChieuChiTiet v ON v.SuatChieuID = s.SuatChieuID
          WHERE s.TrangThai = N'Mở bán' AND v.IsBookable = 1 AND v.SoGheDaDat <= v.TongSoGhe - 6
            AND s.ThoiGianBatDau > DATEADD(HOUR, 3, dbo.fn_BayGio())
          ORDER BY s.ThoiGianBatDau`,
      );
      assert.ok(target, 'no bookable showtime');

      // Browse: movie detail → pick the showtime link (real navigation, no URL typing for booking).
      await page.goto(`${origin}/movies/${target.PhimID}`);
      await page.locator(`a[href="/booking/${target.SuatChieuID}"]`).first().click();
      await page.waitForURL(`**/booking/${target.SuatChieuID}`);

      // Seats
      const seatButtons = page.locator('button.cp-seat[data-status="Trống"]');
      await seatButtons.first().waitFor();
      const seatNames = [];
      for (let i = 0; i < 2; i += 1) {
        const seat = seatButtons.nth(i);
        seatNames.push((await seat.textContent()).trim());
        await seat.click();
      }
      await expectText(page, 'Đã chọn 2/');

      // Food
      const increase = page.getByRole('button', { name: /^Tăng số lượng / }).first();
      const productName = (await increase.getAttribute('aria-label')).replace('Tăng số lượng ', '');
      await increase.click();
      await increase.click();
      await page.getByRole('button', { name: `Giảm số lượng ${productName}` }).click(); // net quantity 1

      // Promotion
      const promoBefore = await one(pool, "SELECT SoLuongDaDung, GiaTriGiam, GiamToiDa FROM dbo.KHUYENMAI WHERE MaCode = 'DEMO10'");
      await page.getByLabel('Mã khuyến mãi').fill('DEMO10');
      await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
      await expectText(page, 'Giảm tạm tính');

      // Order
      await visible(page.getByRole('button', { name: 'Đặt vé', exact: true })).first().click();
      await expectText(page, 'Đã tạo đơn, chờ thanh toán');

      const order = await one(
        pool,
        `SELECT TOP 1 * FROM dbo.DONDATVE WHERE NguoiDungID = @u ORDER BY DonDatVeID DESC`,
        { u: account.id },
      );
      assert.equal(order.SuatChieuID, target.SuatChieuID);
      assert.equal(order.TrangThai, 'Chờ thanh toán');
      assert.ok(order.HanGiuCho);
      const tickets = await rows(
        pool,
        `SELECT g.HangGhe + CAST(g.SoGhe AS VARCHAR(10)) AS seat, v.GiaVe, v.TrangThai
           FROM dbo.CHITIETVE v JOIN dbo.GHE g ON g.GheID = v.GheID WHERE v.DonDatVeID = @id`,
        { id: order.DonDatVeID },
      );
      assert.deepEqual(tickets.map((t) => t.seat).sort(), [...seatNames].sort());
      const food = await rows(
        pool,
        `SELECT p.TenSanPham, c.SoLuong, c.DonGia FROM dbo.CHITIETDOAN c
           JOIN dbo.SANPHAM p ON p.SanPhamID = c.SanPhamID WHERE c.DonDatVeID = @id`,
        { id: order.DonDatVeID },
      );
      assert.equal(food.length, 1);
      assert.equal(food[0].TenSanPham, productName);
      assert.equal(food[0].SoLuong, 1);
      const subtotal = money(order.TongTienVe) + money(order.TongTienDoAn);
      assert.equal(money(order.TongTienVe), tickets.reduce((a, t) => a + money(t.GiaVe), 0));
      assert.equal(money(order.TongTienDoAn), money(food[0].SoLuong) * money(food[0].DonGia));
      const expectedDiscount = Math.min(
        Math.floor((subtotal * money(promoBefore.GiaTriGiam)) / 100),
        money(promoBefore.GiamToiDa),
      );
      assert.equal(money(order.TienGiamGia), expectedDiscount);
      assert.ok(order.KhuyenMaiID, 'promotion not linked to the order');

      // Payment page
      await page.getByRole('link', { name: 'Thanh toán đơn này' }).click();
      await page.waitForURL(`**/orders/${order.DonDatVeID}/payment`);
      await page.getByLabel('Phương thức').selectOption('MOMO');
      await page.getByRole('button', { name: 'Xác nhận thanh toán' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await expectText(page, 'Đã xác nhận thanh toán thành công');

      const paid = await one(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @id', { id: order.DonDatVeID });
      assert.equal(paid.TrangThai, 'Đã thanh toán');
      const payments = await rows(pool, 'SELECT PhuongThuc, TrangThai FROM dbo.THANHTOAN WHERE DonDatVeID = @id', {
        id: order.DonDatVeID,
      });
      assert.deepEqual(payments, [{ PhuongThuc: 'MOMO', TrangThai: 'Thành công' }]);
      const usedAfter = await scalar(pool, "SELECT SoLuongDaDung FROM dbo.KHUYENMAI WHERE MaCode = 'DEMO10'");
      assert.equal(usedAfter, promoBefore.SoLuongDaDung + 1, 'promotion usage counter');

      // The order is visible in the customer's history through the UI.
      await page.goto(`${origin}/orders`);
      await expectText(page, `#${order.DonDatVeID}`);
      customer.paidOrderId = order.DonDatVeID;
      customer.showtimeId = target.SuatChieuID;
      return { orderId: order.DonDatVeID, seats: seatNames, product: productName, discount: expectedDiscount, total: subtotal - expectedDiscount };
    },
  },
  // ======================================================================= CUSTOMER: review (KH-13)
  {
    id: 'E2E-CUST-REVIEW',
    title: 'KH-13 review form: refused for an unwatched movie, accepted after a watched paid order, duplicate refused',
    async run({ page, origin, pool, RUN, apiBase, assert }) {
      const account = await ensureCustomer({ page, origin, pool, RUN });
      const movies = await rows(pool, "SELECT TOP 2 PhimID FROM dbo.PHIM WHERE TrangThai = N'Đang chiếu' ORDER BY PhimID");
      const [unwatched, watched] = movies.map((m) => m.PhimID);
      await uiLogin(page, origin, account.email, account.password);

      // 1. no watched order → BR05 message from the database trigger, nothing written
      await page.goto(`${origin}/movies/${unwatched}`);
      await page.getByLabel('Nội dung (không bắt buộc)').fill('Chưa xem nhưng muốn chấm');
      await page.getByRole('button', { name: 'Gửi đánh giá' }).click();
      await expectText(page, 'Bạn chỉ có thể đánh giá sau khi đã xem phim');
      assert.equal(
        await scalar(pool, 'SELECT COUNT(*) FROM dbo.DANHGIAPHIM WHERE NguoiDungID = @u AND PhimID = @m', { u: account.id, m: unwatched }),
        0,
      );

      // 2. Test setup: a paid order for a showtime that already started (the app cannot create
      //    past showtimes). The review itself still goes through the UI → API → SP → trigger.
      await assertTestDatabase(pool);
      {
        const call = apiClient(apiBase);
        await ensureSandbox(call, pool, await loginStaff(call, 'admin'));
      }
      await pool.request().input('u', account.id).input('m', watched).query(`
        DECLARE @room INT = (SELECT TOP 1 p.PhongID FROM dbo.PHONGCHIEU p WHERE p.TenPhong = N'E2E Sandbox Hall' ORDER BY p.PhongID);
        DECLARE @seat INT = (SELECT TOP 1 GheID FROM dbo.GHE WHERE PhongID = @room AND TrangThai = N'Hoạt động' ORDER BY GheID);
        DECLARE @k INT = 24, @start DATETIME2, @st INT, @od INT;
        WHILE 1 = 1
        BEGIN
          SET @start = DATEADD(HOUR, -3 * @k, dbo.fn_BayGio());
          IF NOT EXISTS (SELECT 1 FROM dbo.SUATCHIEU x WHERE x.PhongID = @room
                          AND x.ThoiGianBatDau < DATEADD(HOUR, 2, @start) AND @start < x.ThoiGianKetThuc) BREAK;
          SET @k += 1;
        END;
        INSERT dbo.SUATCHIEU(PhimID, PhongID, ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai)
          VALUES (@m, @room, @start, DATEADD(HOUR, 2, @start), N'2D', 90000, N'Hoàn thành');
        SET @st = SCOPE_IDENTITY();
        INSERT dbo.DONDATVE(NguoiDungID, SuatChieuID, NgayDat, TongTienVe, TongTienDoAn, TienGiamGia, TrangThai)
          VALUES (@u, @st, DATEADD(HOUR, -3 * @k - 24, dbo.fn_BayGio()), 90000, 0, 0, N'Đã thanh toán');
        SET @od = SCOPE_IDENTITY();
        INSERT dbo.CHITIETVE(DonDatVeID, GheID, GiaVe, MaVe, TrangThai)
          VALUES (@od, @seat, 90000, 'FIX-' + CAST(@od AS VARCHAR(20)), N'Đã sử dụng');
        INSERT dbo.THANHTOAN(DonDatVeID, PhuongThuc, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai)
          VALUES (@od, N'VNPAY', DATEADD(HOUR, -3 * @k - 24, dbo.fn_BayGio()), DATEADD(HOUR, -3 * @k - 24, dbo.fn_BayGio()), 'FIX-' + CAST(@od AS VARCHAR(20)), N'Thành công');`);

      await page.goto(`${origin}/movies/${watched}`);
      await page.getByLabel('Điểm').selectOption('4');
      const text = `Đánh giá E2E ${RUN}`;
      await page.getByLabel('Nội dung (không bắt buộc)').fill(text);
      await page.getByRole('button', { name: 'Gửi đánh giá' }).click();
      await expectText(page, 'Đã gửi đánh giá');
      await expectText(page, text);
      const review = await one(
        pool,
        'SELECT SoSao, NoiDung FROM dbo.DANHGIAPHIM WHERE NguoiDungID = @u AND PhimID = @m',
        { u: account.id, m: watched },
      );
      assert.deepEqual([review.SoSao, review.NoiDung], [4, text]);

      // 3. a second review of the same film is refused (one review per customer and film)
      await page.getByRole('button', { name: 'Gửi đánh giá' }).click();
      await expectText(page, 'Bạn đã đánh giá phim này');
      assert.equal(
        await scalar(pool, 'SELECT COUNT(*) FROM dbo.DANHGIAPHIM WHERE NguoiDungID = @u AND PhimID = @m', { u: account.id, m: watched }),
        1,
      );
      return { movieId: watched, rating: review.SoSao };
    },
  },

  // ======================================================================= CUSTOMER: complaint (KH-14) + Chat
  {
    id: 'E2E-CUST-COMPLAINT',
    title: "KH-14 complaint form creates a Mới complaint linked to order, and customer sends first chat message",
    async run({ page, origin, pool, RUN, assert }) {
      const account = await ensureCustomer({ page, origin, pool, RUN });
      if (!customer.paidOrderId) {
        const lastOrder = await one(
          pool,
          `SELECT TOP 1 DonDatVeID FROM dbo.DONDATVE WHERE NguoiDungID = @id AND TrangThai = N'Đã thanh toán' ORDER BY DonDatVeID DESC`,
          { id: account.id },
        );
        if (lastOrder) customer.paidOrderId = lastOrder.DonDatVeID;
      }
      assert.ok(customer.paidOrderId, 'E2E-CUST-BOOK must run first (it creates the order to reference)');
      await uiLogin(page, origin, account.email, account.password);
      await page.goto(`${origin}/complaints`);
      const title = `E2E khiếu nại ${RUN}`;
      await page.getByLabel('Loại khiếu nại').fill('Thanh toán');
      await page.getByLabel('Tiêu đề').fill(title);
      await page.getByLabel(/^Nội dung/).fill('Tôi muốn kiểm tra giao dịch của đơn này.');
      await page.getByLabel('Đơn liên quan').selectOption(String(customer.paidOrderId));
      await page.getByRole('button', { name: 'Gửi khiếu nại' }).click();
      await expectText(page, 'Đã gửi khiếu nại');
      const row = await one(
        pool,
        'SELECT KhieuNaiID, DonDatVeID, TrangThai, LoaiKhieuNai, NguoiDungID FROM dbo.KHIEUNAI WHERE TieuDe = @t',
        { t: title },
      );
      assert.equal(row.NguoiDungID, account.id);
      assert.equal(row.DonDatVeID, customer.paidOrderId);
      assert.equal(row.TrangThai, 'Mới');
      assert.equal(row.LoaiKhieuNai, 'Thanh toán');
      customer.complaintId = row.KhieuNaiID;
      customer.complaintTitle = title;
      await expectText(page, title);

      // Customer navigates to complaint detail and sends first message
      await page.goto(`${origin}/complaints/${row.KhieuNaiID}`);
      await expectText(page, 'Đang chờ CSKH tiếp nhận');
      await page.getByLabel('Nội dung tin nhắn gửi CSKH').fill('Tôi cần kiểm tra giao dịch đơn hàng này ạ.');
      await page.getByRole('button', { name: 'Gửi', exact: true }).click();
      await expectText(page, 'Tôi cần kiểm tra giao dịch đơn hàng này ạ.');

      const chatMsg = await one(
        pool,
        'SELECT NoiDung, LoaiTinNhan, NguoiGuiID FROM dbo.TINNHAN_KHIEUNAI WHERE KhieuNaiID = @id',
        { id: row.KhieuNaiID },
      );
      assert.equal(chatMsg.NoiDung, 'Tôi cần kiểm tra giao dịch đơn hàng này ạ.');
      assert.equal(chatMsg.LoaiTinNhan, 'Công khai');
      assert.equal(chatMsg.NguoiGuiID, account.id);

      return { complaintId: row.KhieuNaiID };
    },
  },

  // ======================================================================= CSKH: claim, chat, internal note, points inspection, escalate
  {
    id: 'E2E-CSKH-PROCESS',
    title: 'CSKH claim complaint → 2-way chat → internal note → points lookup → escalate to Admin',
    async run({ page, origin, pool, assert }) {
      if (!customer.complaintId) {
        const lastComplaint = await one(
          pool,
          `SELECT TOP 1 KhieuNaiID, TieuDe FROM dbo.KHIEUNAI ORDER BY KhieuNaiID DESC`,
        );
        if (lastComplaint) {
          customer.complaintId = lastComplaint.KhieuNaiID;
          customer.complaintTitle = lastComplaint.TieuDe;
        }
      }
      assert.ok(customer.complaintId, 'E2E-CUST-COMPLAINT must run first');
      await uiLogin(page, origin, ACCOUNTS.support);
      assert.ok(new URL(page.url()).pathname.startsWith('/support'), `landed on ${page.url()}`);
      await page.goto(`${origin}/support/complaints`);
      await page.getByLabel('Tìm khiếu nại').fill(customer.complaintTitle);
      await page.getByRole('button', { name: 'Áp dụng bộ lọc' }).click();
      await page.getByRole('button', { name: new RegExp(customer.complaintTitle) }).click();
      await expectText(page, 'HỒ SƠ ĐANG XEM');
      await expectText(page, 'Đơn tham chiếu');

      // 1. Claim complaint
      await page.getByRole('button', { name: 'Tiếp nhận khiếu nại' }).click();
      await expectText(page, 'Đã tiếp nhận khiếu nại thành công');
      const supportUser = await one(pool, 'SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = @e', { e: ACCOUNTS.support });
      const assigned = await one(pool, 'SELECT NhanVienPhuTrachID FROM dbo.KHIEUNAI WHERE KhieuNaiID = @id', { id: customer.complaintId });
      assert.equal(assigned.NhanVienPhuTrachID, supportUser.NguoiDungID);

      const noHistoryTable = await scalar(pool, "SELECT COUNT(*) FROM sys.tables WHERE name = 'LICHSU_PHANCONG_KHIEUNAI'");
      assert.equal(noHistoryTable, 0);

      // 2. See customer's message and reply publicly
      await expectText(page, 'Tôi cần kiểm tra giao dịch đơn hàng này ạ.');
      await page.getByLabel('Nội dung tin nhắn hoặc ghi chú').fill('Chào bạn, CSKH đã tiếp nhận và đang đối soát.');
      await page.getByRole('button', { name: 'Gửi', exact: true }).click();
      await expectPoll(
        async () => {
          const m = await one(
            pool,
            "SELECT LoaiTinNhan FROM dbo.TINNHAN_KHIEUNAI WHERE KhieuNaiID = @id AND NoiDung LIKE N'%CSKH đã tiếp nhận%'",
            { id: customer.complaintId },
          );
          return m && m.LoaiTinNhan === 'Công khai';
        },
        { message: 'CSKH public reply was not written to database' },
      );

      // 3. Send internal note
      await page.getByLabel('🔒 Ghi chú nội bộ (chỉ nhân viên/Admin thấy)').check();
      await page.getByLabel('Nội dung tin nhắn hoặc ghi chú').fill('Ghi chú nội bộ: Giao dịch có dấu hiệu chờ cổng thanh toán xác nhận.');
      await page.getByRole('button', { name: 'Lưu ghi chú' }).click();
      await expectPoll(
        async () => {
          const m = await one(
            pool,
            "SELECT LoaiTinNhan FROM dbo.TINNHAN_KHIEUNAI WHERE KhieuNaiID = @id AND NoiDung LIKE N'%Giao dịch có dấu hiệu%'",
            { id: customer.complaintId },
          );
          return m && m.LoaiTinNhan === 'Nội bộ';
        },
        { message: 'Internal note was not written to database' },
      );

      // 4. Points & Compensation reference inspection
      await expectText(page, 'Điểm hiện tại:');
      await expectText(page, 'Điểm bồi thường:');

      // 5. Escalate to Admin
      await page.getByRole('button', { name: '🚀 Chuyển cấp lên Admin' }).click();
      await page.getByLabel('Lý do chuyển cấp').fill('Vấn đề đối soát tài chính vượt thẩm quyền CSKH, nhờ Admin kiểm tra.');
      await page.getByRole('button', { name: 'Xác nhận gửi' }).click();
      await expectPoll(
        async () => {
          const e = await one(
            pool,
            'SELECT YeuCauID, TrangThai, MucDoUuTien, NguoiYeuCauID FROM dbo.YEUCAU_CHUYENCAP WHERE KhieuNaiID = @id',
            { id: customer.complaintId },
          );
          if (e && e.TrangThai === 'Chờ tiếp nhận') {
            customer.escalationId = e.YeuCauID;
            return true;
          }
          return false;
        },
        { message: 'Escalation was not created in database' },
      );

      return { complaintId: customer.complaintId, escalationId: customer.escalationId };
    },
  },

  // ======================================================================= ADMIN: claim & resolve escalation
  {
    id: 'E2E-ADM-ESCALATION',
    title: 'Admin view pending escalation queue → claim → provide resolution → mark resolved',
    async run({ page, origin, pool, assert }) {
      if (!customer.escalationId) {
        const lastEsc = await one(
          pool,
          `SELECT TOP 1 YeuCauID FROM dbo.YEUCAU_CHUYENCAP WHERE TrangThai = N'Chờ tiếp nhận' ORDER BY YeuCauID DESC`,
        );
        if (lastEsc) customer.escalationId = lastEsc.YeuCauID;
      }
      assert.ok(customer.escalationId, 'E2E-CSKH-PROCESS must run first');
      await uiLogin(page, origin, ACCOUNTS.admin);
      await page.goto(`${origin}/admin/service/escalations`);
      await expectText(page, 'Yêu cầu hỗ trợ từ CSKH');
      await expectText(page, `Yêu cầu #${customer.escalationId}`);

      // Open escalation detail
      await page.getByRole('button', { name: new RegExp(`Yêu cầu #${customer.escalationId}`) }).click();
      await expectText(page, 'Vấn đề đối soát tài chính vượt thẩm quyền');

      // Claim escalation
      await page.getByRole('button', { name: 'Tiếp nhận yêu cầu này' }).click();
      const adminUser = await one(pool, 'SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = @e', { e: ACCOUNTS.admin });
      await expectPoll(
        async () => {
          const claimedEsc = await one(pool, 'SELECT TrangThai, AdminPhuTrachID FROM dbo.YEUCAU_CHUYENCAP WHERE YeuCauID = @id', {
            id: customer.escalationId,
          });
          return claimedEsc && claimedEsc.TrangThai === 'Đang xử lý' && claimedEsc.AdminPhuTrachID === adminUser.NguoiDungID;
        },
        { message: 'Escalation was not claimed in database' },
      );

      // Process escalation with resolution
      const resText = 'Admin đã đối soát hoàn tất với đối tác thanh toán, giao dịch hợp lệ.';
      await page.getByLabel('Kết luận xử lý / Chỉ đạo cho CSKH').fill(resText);
      await page.getByRole('button', { name: '✓ Đã giải quyết' }).click();
      let finishedEsc = null;
      await expectPoll(
        async () => {
          finishedEsc = await one(
            pool,
            'SELECT TrangThai, KetQuaXuLy, ThoiGianHoanTat FROM dbo.YEUCAU_CHUYENCAP WHERE YeuCauID = @id',
            { id: customer.escalationId },
          );
          return (
            finishedEsc &&
            finishedEsc.TrangThai === 'Đã giải quyết' &&
            finishedEsc.KetQuaXuLy === resText &&
            finishedEsc.ThoiGianHoanTat
          );
        },
        { message: 'Escalation was not completed in database' },
      );

      return { escalationId: customer.escalationId, status: finishedEsc?.TrangThai };
    },
  },

  // ======================================================================= CSKH: view resolution & finalize complaint
  {
    id: 'E2E-CSKH-FINALIZE',
    title: 'CSKH views Admin resolution → informs customer → marks complaint resolved',
    async run({ page, origin, pool, assert }) {
      if (!customer.complaintId) {
        const lastComplaint = await one(
          pool,
          `SELECT TOP 1 KhieuNaiID, TieuDe FROM dbo.KHIEUNAI ORDER BY KhieuNaiID DESC`,
        );
        if (lastComplaint) {
          customer.complaintId = lastComplaint.KhieuNaiID;
          customer.complaintTitle = lastComplaint.TieuDe;
        }
      }
      assert.ok(customer.complaintId, 'E2E-CSKH-PROCESS must run first');
      await uiLogin(page, origin, ACCOUNTS.support);
      await page.goto(`${origin}/support/complaints`);
      await page.getByLabel('Tìm khiếu nại').fill(customer.complaintTitle);
      await page.getByRole('button', { name: 'Áp dụng bộ lọc' }).click();
      await page.getByRole('button', { name: new RegExp(customer.complaintTitle) }).click();
      await expectText(page, 'HỒ SƠ ĐANG XEM');

      // CSKH sees Admin feedback in history
      await expectText(page, 'Lịch sử phản hồi từ Admin');

      // CSKH sends final public message
      await page.getByLabel('Nội dung tin nhắn hoặc ghi chú').fill('Admin đã đối soát thành công, khiếu nại của bạn đã được giải quyết.');
      await page.getByRole('button', { name: 'Gửi', exact: true }).click();
      await expectPoll(
        async () => {
          const m = await one(
            pool,
            "SELECT LoaiTinNhan FROM dbo.TINNHAN_KHIEUNAI WHERE KhieuNaiID = @id AND NoiDung LIKE N'%Admin đã đối soát thành công%'",
            { id: customer.complaintId },
          );
          return m && m.LoaiTinNhan === 'Công khai';
        },
        { message: 'Final message was not recorded in database' },
      );

      // CSKH records processing and marks resolved
      await page.getByLabel('Nội dung xử lý').fill('Đã hoàn tất xử lý khiếu nại sau chỉ đạo từ Admin.');
      await page.getByLabel('Trạng thái sau xử lý').selectOption('Đã giải quyết');
      await page.getByRole('button', { name: 'Ghi diễn biến' }).click();
      await confirmIfAsked(page);
      await expectText(page, 'Đã thêm diễn biến xử lý');

      const state = await one(pool, 'SELECT TrangThai FROM dbo.KHIEUNAI WHERE KhieuNaiID = @id', { id: customer.complaintId });
      assert.equal(state.TrangThai, 'Đã giải quyết');

      return { complaintId: customer.complaintId };
    },
  },

  // ======================================================================= CUSTOMER sees the outcome & privacy check
  {
    id: 'E2E-CUST-COMPLAINT-RESULT',
    title: 'KH-14 customer sees resolution & public replies, but internal notes are hidden',
    async run({ page, origin, pool, assert }) {
      if (!customer.complaintId) {
        const lastComplaint = await one(
          pool,
          `SELECT TOP 1 KhieuNaiID, TieuDe FROM dbo.KHIEUNAI WHERE TrangThai = N'Đã giải quyết' ORDER BY KhieuNaiID DESC`,
        );
        if (lastComplaint) {
          customer.complaintId = lastComplaint.KhieuNaiID;
          customer.complaintTitle = lastComplaint.TieuDe;
        }
      }
      assert.ok(customer.complaintId, 'complaint scenario must run first');
      await uiLogin(page, origin, customer.email, customer.password);
      await page.goto(`${origin}/complaints/${customer.complaintId}`);
      await expectText(page, 'Đã giải quyết');
      await expectText(page, 'Chào bạn, CSKH đã tiếp nhận và đang đối soát.');
      await expectText(page, 'Admin đã đối soát thành công, khiếu nại của bạn đã được giải quyết.');

      // Customer must NOT see internal note
      const bodyText = await page.textContent('body');
      assert.ok(!bodyText.includes('Ghi chú nội bộ: Giao dịch có dấu hiệu'));

      return {};
    },
  },

  // ======================================================================= ADMIN: single staff assignment & immutability
  {
    id: 'E2E-ADM-ASSIGNMENT',
    title: 'Admin assigns complaint staff once on unassigned complaint and verifies immutability on assigned complaint',
    async run({ page, origin, pool, assert }) {
      if (!customer.complaintId) {
        const lastComplaint = await one(
          pool,
          `SELECT TOP 1 KhieuNaiID, TieuDe FROM dbo.KHIEUNAI ORDER BY KhieuNaiID DESC`,
        );
        if (lastComplaint) {
          customer.complaintId = lastComplaint.KhieuNaiID;
          customer.complaintTitle = lastComplaint.TieuDe;
        }
      }
      assert.ok(customer.complaintId, 'complaint scenario must run first');
      await uiLogin(page, origin, ACCOUNTS.admin);

      // 1. Complaint that is already assigned must display static immutable badge, not assignment form
      await page.goto(`${origin}/admin/service/complaints?selectedId=${customer.complaintId}`);
      await expectText(page, 'Nhân viên CSKH phụ trách');
      await expectText(page, 'Đã phân công cho nhân viên:');
      await expectText(page, 'Quy tắc nghiệp vụ: Mỗi khiếu nại chỉ được phân công một lần duy nhất.');

      // 2. Test first-time assignment on an unassigned complaint
      const unassignedRow = await one(
        pool,
        `INSERT INTO dbo.KHIEUNAI (NguoiDungID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai, NhanVienPhuTrachID)
         OUTPUT INSERTED.KhieuNaiID
         VALUES (
           (SELECT TOP 1 NguoiDungID FROM dbo.NGUOIDUNG WHERE VaiTroID = (SELECT VaiTroID FROM dbo.VAITRO WHERE MaVaiTro = 'KHACH_HANG')),
           N'Dịch vụ',
           N'E2E Khiếu nại chờ phân công',
           N'Nội dung khiếu nại chờ Admin phân công lần đầu.',
           N'Trung bình',
           dbo.fn_BayGio(),
           N'Mới',
           NULL
         )`
      );

      await page.goto(`${origin}/admin/service/complaints?selectedId=${unassignedRow.KhieuNaiID}`);
      await expectText(page, 'Khiếu nại chưa có người tiếp nhận. Quản trị viên có thể phân công nhân viên CSKH phụ trách lần đầu.');

      const supportStaff = await one(pool, 'SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = @e', { e: ACCOUNTS.support });
      await page.getByLabel('Chọn nhân viên CSKH phụ trách').selectOption(String(supportStaff.NguoiDungID));
      await page.getByPlaceholder('Ghi chú phân công…').fill('Admin phân công ca sáng phụ trách.');
      await page.getByRole('button', { name: 'Xác nhận phân công' }).click();
      await expectText(page, 'Đã phân công nhân viên CSKH thành công.');

      // Verify in SQL Server
      const dbAssigned = await one(pool, 'SELECT NhanVienPhuTrachID FROM dbo.KHIEUNAI WHERE KhieuNaiID = @id', { id: unassignedRow.KhieuNaiID });
      assert.equal(dbAssigned.NhanVienPhuTrachID, supportStaff.NguoiDungID);

      return { complaintId: unassignedRow.KhieuNaiID };
    },
  },
];

scenarios.push(...managerScenarios, ...adminScenarios, ...hardeningScenarios, ...responsiveScenarios);

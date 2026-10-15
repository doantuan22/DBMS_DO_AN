// Admin portal (ADM-02..18) + cross-role RBAC. DOM-driven, SQL-verified.
import { ACCOUNTS, one, rows, scalar } from './lib.mjs';
import { confirmIfAsked, expectPoll, expectText, rowOf, uiLogin } from './browser-helpers.mjs';

const state = {};
async function adminSearch(page, label, text) {
  await page.getByLabel(label, { exact: true }).fill(text);
  await page.getByRole('button', { name: 'Áp dụng lọc' }).click();
}
const USER_SEARCH = 'Tìm tên / email / số điện thoại';
async function dialogSubmit(page, name) {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name, exact: true }).click();
  await dialog.waitFor({ state: 'hidden', timeout: 15000 });
}
async function confirmSave(page) {
  // Resource saves that overwrite an existing record go through a confirmation dialog.
  await confirmIfAsked(page);
}

export const adminScenarios = [
  {
    id: 'E2E-ADM-USER',
    title: 'ADM-02 create an internal account, lock it (login refused in the UI), unlock it (login works)',
    async run({ page, context, origin, pool, RUN, assert }) {
      await uiLogin(page, origin, ACCOUNTS.admin);
      assert.equal(new URL(page.url()).pathname.startsWith('/admin'), true, `landed on ${page.url()}`);
      await page.goto(`${origin}/admin/access/users`);
      const email = `e2e.cskh.${RUN}@example.test`;
      await page.getByRole('button', { name: 'Tạo tài khoản nội bộ' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Họ tên').fill(`E2E CSKH ${RUN}`);
      await dialog.getByLabel('Email').fill(email);
      await dialog.getByLabel('Vai trò tài khoản nội bộ', { exact: true }).selectOption({ label: 'Chăm sóc khách hàng' });
      await dialog.getByLabel(/^Mật khẩu ban đầu/).fill('E2eStaff-123!');
      await dialog.getByRole('button', { name: 'Tạo mới' }).click();
      await dialog.waitFor({ state: 'hidden' });
      let user;
      await expectPoll(
        async () =>
          (user = await one(
            pool,
            `SELECT n.NguoiDungID, n.TrangThai, n.MatKhau, v.MaVaiTro FROM dbo.NGUOIDUNG n
               JOIN dbo.VAITRO v ON v.VaiTroID = n.VaiTroID WHERE n.Email = @e`,
            { e: email },
          )),
        { message: 'account not created' },
      );
      assert.deepEqual([user.MaVaiTro, user.TrangThai], ['CSKH', 'Hoạt động']);
      assert.match(user.MatKhau, /^\$2[aby]\$/);
      state.staffEmail = email;
      state.staffId = user.NguoiDungID;

      // lock
      await adminSearch(page, USER_SEARCH, email);
      await rowOf(page, email).getByRole('button', { name: /^Sửa / }).click();
      await page.getByRole('dialog').getByLabel('Trạng thái tài khoản').selectOption('Bị khóa');
      await page.getByRole('dialog').getByRole('button', { name: 'Lưu thay đổi' }).click();
      await confirmSave(page);
      await expectPoll(
        async () => (await scalar(pool, 'SELECT TrangThai FROM dbo.NGUOIDUNG WHERE NguoiDungID = @id', { id: user.NguoiDungID })) === 'Bị khóa',
        { message: 'account not locked' },
      );

      // locked account cannot sign in through the login form
      const guest = await context.browser().newContext();
      const guestPage = await guest.newPage();
      await guestPage.goto(`${origin}/login`);
      await guestPage.getByLabel('Email').fill(email);
      await guestPage.getByLabel(/^Mật khẩu/).fill('E2eStaff-123!');
      await guestPage.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await expectText(guestPage, 'Email hoặc mật khẩu không đúng, hoặc tài khoản chưa hoạt động');
      assert.ok(new URL(guestPage.url()).pathname.startsWith('/login'));

      // unlock
      await page.reload();
      await adminSearch(page, USER_SEARCH, email);
      await rowOf(page, email).getByRole('button', { name: /^Sửa / }).click();
      await page.getByRole('dialog').getByLabel('Trạng thái tài khoản').selectOption('Hoạt động');
      await page.getByRole('dialog').getByRole('button', { name: 'Lưu thay đổi' }).click();
      await confirmSave(page);
      await expectPoll(
        async () => (await scalar(pool, 'SELECT TrangThai FROM dbo.NGUOIDUNG WHERE NguoiDungID = @id', { id: user.NguoiDungID })) === 'Hoạt động',
        { message: 'account not unlocked' },
      );
      await uiLogin(guestPage, origin, email, 'E2eStaff-123!');
      assert.ok(new URL(guestPage.url()).pathname.startsWith('/support'), `landed on ${guestPage.url()}`);
      await guest.close();
      return { userId: user.NguoiDungID };
    },
  },

  {
    id: 'E2E-ADM-CATALOG',
    title: 'ADM-09/10 genre, actor and movie catalogue: create → edit → cast → delete via the Admin UI',
    async run({ page, origin, pool, RUN, assert }) {
      await uiLogin(page, origin, ACCOUNTS.admin);
      // ---- genre
      await page.goto(`${origin}/admin/catalog/genres`);
      const genre = `E2E Thể loại ${RUN}`;
      await page.getByRole('button', { name: 'Thêm thể loại' }).click();
      await page.getByRole('dialog').getByLabel('Tên thể loại').fill(genre);
      await dialogSubmit(page, 'Tạo mới');
      let genreRow;
      await expectPoll(async () => (genreRow = await one(pool, 'SELECT * FROM dbo.THELOAI WHERE TenTheLoai = @n', { n: genre })), { message: 'genre missing' });
      await adminSearch(page, 'Tìm thể loại', genre);
      await page.getByRole('button', { name: `Sửa ${genre}` }).click();
      await page.getByRole('dialog').getByLabel('Tên thể loại').fill(`${genre} v2`);
      await page.getByRole('dialog').getByRole('button', { name: 'Lưu thay đổi' }).click();
      await confirmSave(page);
      await expectPoll(async () => (await scalar(pool, 'SELECT TenTheLoai FROM dbo.THELOAI WHERE TheLoaiID = @id', { id: genreRow.TheLoaiID })) === `${genre} v2`, { message: 'genre not renamed' });

      // ---- actor
      await page.goto(`${origin}/admin/catalog/actors`);
      const actorName = `E2E Diễn viên ${RUN}`;
      await page.getByRole('button', { name: 'Thêm diễn viên' }).click();
      let dialog = page.getByRole('dialog');
      await dialog.getByLabel('Họ tên diễn viên').fill(actorName);
      await dialog.getByLabel('Quốc tịch').fill('Việt Nam');
      await dialogSubmit(page, 'Tạo mới');
      let actor;
      await expectPoll(async () => (actor = await one(pool, 'SELECT * FROM dbo.DIENVIEN WHERE HoTen = @n', { n: actorName })), { message: 'actor missing' });
      assert.equal(actor.QuocTich, 'Việt Nam');

      // ---- movie (genre picked from the lookup, cast replaced atomically)
      await page.goto(`${origin}/admin/catalog/movies`);
      const title = `E2E Phim ${RUN}`;
      await page.getByRole('button', { name: 'Thêm phim' }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Tên phim').fill(title);
      await dialog.getByLabel('Thời lượng (phút)').fill('105');
      await dialog.getByLabel('Đạo diễn').fill('E2E Director');
      await dialog.getByLabel('Phân loại độ tuổi').selectOption('T16');
      await dialog.getByLabel('Thêm thể loại phim', { exact: true }).selectOption({ label: `${genre} v2` });
      await dialogSubmit(page, 'Tạo mới');
      let movie;
      await expectPoll(async () => (movie = await one(pool, 'SELECT * FROM dbo.PHIM WHERE TenPhim = @n', { n: title })), { message: 'movie missing' });
      // release date defaults to today → the procedure derives the status 'Đang chiếu'
      assert.deepEqual([movie.ThoiLuong, movie.DoTuoi, movie.TrangThai], [105, 'T16', 'Đang chiếu']);
      assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.PHIM_THELOAI WHERE PhimID = @m AND TheLoaiID = @g', { m: movie.PhimID, g: genreRow.TheLoaiID }), 1);

      await adminSearch(page, 'Tìm tên phim / đạo diễn', title);
      await page.getByRole('button', { name: `Diễn viên ${title}` }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Thêm diễn viên', { exact: true }).selectOption({ label: actorName });
      await dialog.getByLabel(`Vai diễn của ${actorName}`).fill('Vai chính');
      await dialog.getByRole('button', { name: /^(Lưu|Tạo)/ }).first().click();
      await confirmSave(page);
      await expectPoll(
        async () => (await scalar(pool, 'SELECT COUNT(*) FROM dbo.PHIM_DIENVIEN WHERE PhimID = @m AND DienVienID = @a AND VaiDien = N\'Vai chính\'', { m: movie.PhimID, a: actor.DienVienID })) === 1,
        { message: 'cast not saved' },
      );

      // movie delete is refused while actors/genres are attached? (no showtimes/reviews → allowed)
      await page.getByRole('button', { name: `Xóa ${title}` }).click();
      await confirmSave(page);
      await expectPoll(async () => (await scalar(pool, 'SELECT COUNT(*) FROM dbo.PHIM WHERE PhimID = @m', { m: movie.PhimID })) === 0, { message: 'movie not deleted' });
      assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.PHIM_DIENVIEN WHERE PhimID = @m', { m: movie.PhimID }), 0, 'cast links removed with the movie');

      // actor and genre are now unreferenced → deletable
      await page.goto(`${origin}/admin/catalog/actors`);
      await adminSearch(page, 'Tìm diễn viên', actorName);
      await page.getByRole('button', { name: `Xóa ${actorName}` }).click();
      await confirmSave(page);
      await expectPoll(async () => (await scalar(pool, 'SELECT COUNT(*) FROM dbo.DIENVIEN WHERE DienVienID = @a', { a: actor.DienVienID })) === 0, { message: 'actor not deleted' });
      await page.goto(`${origin}/admin/catalog/genres`);
      await adminSearch(page, 'Tìm thể loại', genre);
      await page.getByRole('button', { name: `Xóa ${genre} v2` }).click();
      await confirmSave(page);
      await expectPoll(async () => (await scalar(pool, 'SELECT COUNT(*) FROM dbo.THELOAI WHERE TheLoaiID = @g', { g: genreRow.TheLoaiID })) === 0, { message: 'genre not deleted' });
      return { movieId: movie.PhimID };
    },
  },

  {
    id: 'E2E-ADM-COMMERCE',
    title: 'ADM-11/12 product filters and CRUD; promotion validation',
    async run({ page, origin, pool, RUN, assert }) {
      await uiLogin(page, origin, ACCOUNTS.admin);
      await page.goto(`${origin}/admin/commerce/products`);
      const product = `E2E Sản phẩm ${RUN}`;
      await page.getByRole('button', { name: 'Thêm sản phẩm' }).click();
      let dialog = page.getByRole('dialog');
      await dialog.getByLabel('Tên sản phẩm').fill(product);
      await dialog.getByLabel('Loại sản phẩm').selectOption('Combo');
      await dialog.getByLabel('Giá bán (VND)').fill('59000');
      await dialogSubmit(page, 'Tạo mới');
      let row;
      await expectPoll(async () => (row = await one(pool, 'SELECT * FROM dbo.SANPHAM WHERE TenSanPham = @n', { n: product })), { message: 'product missing' });
      assert.deepEqual([Number(row.Gia), row.LoaiSanPham, row.TrangThai], [59000, 'Combo', 'Đang bán']);
      await page.getByRole('button', { name: `Sửa ${product}` }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Giá bán (VND)').fill('64000');
      await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
      await confirmSave(page);
      await expectPoll(async () => Number(await scalar(pool, 'SELECT Gia FROM dbo.SANPHAM WHERE SanPhamID = @id', { id: row.SanPhamID })) === 64000, { message: 'price not updated' });

      const priceFilter = page.locator('.product-filters__price');
      await priceFilter.locator('summary').click();
      await page.getByLabel('Giá từ').fill('63000');
      await priceFilter.getByRole('button', { name: 'Xong' }).click();
      await page.getByRole('button', { name: 'Lọc', exact: true }).click();
      const minimumChip = page.getByRole('button', { name: 'Xóa bộ lọc Giá từ' });
      await minimumChip.waitFor({ state: 'visible' });
      assert.equal(await rowOf(page, product).count(), 1, 'applied minimum price keeps the matching product');
      await minimumChip.click();
      await minimumChip.waitFor({ state: 'detached' });
      assert.equal(await rowOf(page, product).count(), 1, 'removing the chip clears only the applied minimum');

      await page.getByRole('button', { name: `Xóa ${product}` }).click();
      await confirmSave(page);
      await expectPoll(async () => (await scalar(pool, 'SELECT COUNT(*) FROM dbo.SANPHAM WHERE SanPhamID = @id', { id: row.SanPhamID })) === 0, { message: 'product not deleted' });

      // promotion
      await page.goto(`${origin}/admin/commerce/promotions`);
      const code = `E2E${RUN}`.toUpperCase();
      await page.getByRole('button', { name: 'Thêm khuyến mãi' }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Mã khuyến mãi').fill(code);
      await dialog.getByLabel('Loại giảm giá').selectOption('Số tiền');
      await dialog.getByLabel(/^Giá trị giảm/).fill('15000');
      const now = new Date(Date.now() + 7 * 3600000);
      const local = (offsetDays) => new Date(now.getTime() + offsetDays * 86400000).toISOString().slice(0, 16);
      await dialog.getByLabel(/^Bắt đầu/).fill(local(-1));
      await dialog.getByLabel(/^Kết thúc/).fill(local(30));
      await dialog.getByLabel('Tổng số lượt').fill('7');
      await dialogSubmit(page, 'Tạo mới');
      let promo;
      await expectPoll(async () => (promo = await one(pool, 'SELECT * FROM dbo.KHUYENMAI WHERE MaCode = @c', { c: code })), { message: 'promotion missing' });
      assert.deepEqual([Number(promo.GiaTriGiam), promo.SoLuong, promo.SoLuongDaDung, promo.TrangThai], [15000, 7, 0, 'Hoạt động']);
      await page.getByRole('button', { name: `Sửa ${code}` }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Tổng số lượt').fill('9');
      await dialog.getByLabel('Trạng thái khuyến mãi').selectOption('Tạm dừng');
      await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
      await confirmSave(page);
      await expectPoll(async () => (await scalar(pool, 'SELECT SoLuong FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @id', { id: promo.KhuyenMaiID })) === 9, { message: 'promotion not updated' });
      assert.equal(await scalar(pool, 'SELECT TrangThai FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @id', { id: promo.KhuyenMaiID }), 'Tạm dừng');
      await page.getByRole('button', { name: `Xóa ${code}` }).click();
      await confirmSave(page);
      await expectPoll(async () => (await scalar(pool, 'SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE KhuyenMaiID = @id', { id: promo.KhuyenMaiID })) === 0, { message: 'promotion not deleted' });

      // DEMO10 was consumed by a real order → the database refuses deletion; the row must stay.
      await page.reload();
      await adminSearch(page, 'Tìm khuyến mãi', 'DEMO10');
      await page.getByRole('button', { name: 'Xóa DEMO10' }).click();
      await confirmIfAsked(page);
      const refusal = page.getByRole('alert').filter({ hasText: /./ }).first();
      await refusal.waitFor({ state: 'visible', timeout: 10000 });
      const refusalText = (await refusal.textContent()).trim();
      assert.equal(await scalar(pool, "SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE MaCode = 'DEMO10'"), 1, 'used promotion must be kept');
      return { productId: row.SanPhamID, promotionId: promo.KhuyenMaiID, refusalShownToUser: refusalText };
    },
  },

  {
    id: 'E2E-ADM-FACILITY',
    title: 'ADM-07/08/13/14 cinema → room → showtime → pricing → cleanup through the Admin UI',
    async run({ page, origin, pool, RUN, assert }) {
      await uiLogin(page, origin, ACCOUNTS.admin);
      // ---- cinema
      await page.goto(`${origin}/admin/cinemas`);
      const cinema = `E2E Rạp ${RUN}`;
      await page.getByRole('button', { name: '＋ Thêm rạp' }).click();
      let dialog = page.getByRole('dialog');
      await dialog.getByLabel('Tên rạp').fill(cinema);
      await dialog.getByLabel('Địa chỉ').fill('1 Đường Kiểm Thử');
      await dialog.getByLabel('Thành phố').fill('Hà Nội');
      await dialog.getByRole('button', { name: 'Lưu rạp' }).click();
      await dialog.waitFor({ state: 'hidden' });
      let cinemaRow;
      await expectPoll(async () => (cinemaRow = await one(pool, 'SELECT * FROM dbo.RAPCHIEUPHIM WHERE TenRap = @n', { n: cinema })), { message: 'cinema missing' });
      assert.equal(cinemaRow.TrangThai, 'Hoạt động');

      // edit
      await page.getByPlaceholder('Nhập tên rạp, địa chỉ...').fill(cinema);
      await page.keyboard.press('Enter');
      await rowOf(page, cinema).getByRole('button', { name: 'Sửa' }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Điện thoại').fill('0241234567');
      await dialog.getByRole('button', { name: 'Lưu rạp' }).click();
      await dialog.waitFor({ state: 'hidden' });
      await expectPoll(async () => (await scalar(pool, 'SELECT SoDienThoai FROM dbo.RAPCHIEUPHIM WHERE RapID = @id', { id: cinemaRow.RapID })) === '0241234567', { message: 'cinema not edited' });

      // ---- room (admin room workspace)
      await page.goto(`${origin}/admin/facilities/rooms?cinemaId=${cinemaRow.RapID}`);
      const roomName = `E2E Hall ${RUN}`;
      await page.getByRole('button', { name: /Thêm phòng/ }).first().click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Tên phòng').fill(roomName);
      await dialog.getByLabel('Loại phòng').selectOption('3D');
      await dialog.getByRole('button', { name: 'Thêm phòng' }).click();
      await dialog.waitFor({ state: 'hidden' });
      let room;
      await expectPoll(async () => (room = await one(pool, 'SELECT * FROM dbo.PHONGCHIEU WHERE TenPhong = @n', { n: roomName })), { message: 'room missing' });
      assert.deepEqual([room.RapID, room.LoaiPhong], [cinemaRow.RapID, '3D']);

      // ---- showtime (Operations screen, cinema chosen by name)
      const movie = await one(
        pool,
        `SELECT TOP 1 PhimID, TenPhim FROM dbo.PHIM WHERE TrangThai = N'Đang chiếu'
            AND (NgayKetThuc IS NULL OR NgayKetThuc > DATEADD(DAY, 60, CAST(dbo.fn_BayGio() AS DATE))) ORDER BY PhimID DESC`,
      );
      await page.goto(`${origin}/admin/operations/showtimes?cinemaId=${cinemaRow.RapID}`);
      const date = new Date(Date.now() + (15 + (parseInt(RUN, 36) % 20)) * 86400000).toISOString().slice(0, 10);
      await page.getByRole('button', { name: 'Thêm suất chiếu' }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Phim', { exact: true }).selectOption({ label: movie.TenPhim });
      await dialog.getByLabel('Phòng', { exact: true }).selectOption({ label: roomName });
      await dialog.getByLabel('Bắt đầu', { exact: true }).fill(`${date}T09:00`);
      await dialog.getByLabel('Kết thúc', { exact: true }).fill(`${date}T11:00`);
      await dialog.getByLabel('Định dạng', { exact: true }).selectOption('3D');
      await dialog.getByLabel('Giá vé cơ bản', { exact: true }).fill('88000');
      await dialog.getByRole('button', { name: 'Tạo suất' }).click();
      await dialog.waitFor({ state: 'hidden' });
      let showtime;
      await expectPoll(async () => (showtime = await one(pool, 'SELECT * FROM dbo.SUATCHIEU WHERE PhongID = @r', { r: room.PhongID })), { message: 'showtime missing' });
      assert.equal(Number(showtime.GiaVeCoBan), 88000);
      assert.equal(new Date(showtime.ThoiGianBatDau).toISOString(), new Date(`${date}T09:00:00+07:00`).toISOString());

      // an overlapping showtime must be refused by the database and surfaced in the UI
      await page.getByRole('button', { name: 'Thêm suất chiếu' }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Phim', { exact: true }).selectOption({ label: movie.TenPhim });
      await dialog.getByLabel('Phòng', { exact: true }).selectOption({ label: roomName });
      await dialog.getByLabel('Bắt đầu', { exact: true }).fill(`${date}T10:00`);
      await dialog.getByLabel('Kết thúc', { exact: true }).fill(`${date}T12:00`);
      await dialog.getByLabel('Giá vé cơ bản', { exact: true }).fill('88000');
      await dialog.getByRole('button', { name: 'Tạo suất' }).click();
      await expectText(page, 'phòng', 8000);
      assert.equal(await scalar(pool, 'SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE PhongID = @r', { r: room.PhongID }), 1, 'overlap must not create a row');
      await dialog.getByRole('button', { name: 'Đóng form' }).click();
      await confirmIfAsked(page);

      // ---- pricing for the new cinema
      await page.goto(`${origin}/admin/operations/pricing?cinemaId=${cinemaRow.RapID}`);
      await page.getByRole('button', { name: 'Thêm bảng giá' }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Phụ thu', { exact: true }).fill('4000');
      await dialog.getByLabel('Ngày áp dụng', { exact: true }).fill(date);
      await dialog.getByRole('button', { name: 'Tạo giá' }).click();
      await dialog.waitFor({ state: 'hidden' });
      await expectPoll(async () => (await scalar(pool, 'SELECT COUNT(*) FROM dbo.BANGGIA WHERE RapID = @r AND PhuThu = 4000', { r: cinemaRow.RapID })) === 1, { message: 'pricing missing' });

      // ---- cancel showtime (admin) then the room keeps history → deactivated, cinema kept
      await page.goto(`${origin}/admin/operations/showtimes?cinemaId=${cinemaRow.RapID}`);
      await page.getByRole('textbox', { name: /^Từ ngày/ }).fill(date);
      await page.getByRole('textbox', { name: /^Đến ngày/ }).fill(date);
      await page.getByRole('button', { name: 'Áp dụng lọc' }).click();
      await page.getByRole('button', { name: /^Hủy / }).first().click();
      await page.getByRole('dialog').getByRole('button', { name: 'Hủy suất chiếu' }).click();
      await expectPoll(async () => (await scalar(pool, 'SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @id', { id: showtime.SuatChieuID })) === 'Đã hủy', { message: 'showtime not cancelled' });
      return { cinemaId: cinemaRow.RapID, roomId: room.PhongID, showtimeId: showtime.SuatChieuID };
    },
  },

  {
    id: 'E2E-ADM-ASSIGN',
    title: 'ADM-06 assign a new Manager to a cinema; the Manager portal reflects it; expiring it removes access',
    async run({ page, context, origin, pool, RUN, assert }) {
      await uiLogin(page, origin, ACCOUNTS.admin);
      await page.goto(`${origin}/admin/access/users`);
      const email = `e2e.mgr.${RUN}@example.test`;
      await page.getByRole('button', { name: 'Tạo tài khoản nội bộ' }).click();
      let dialog = page.getByRole('dialog');
      await dialog.getByLabel('Họ tên').fill(`E2E Manager ${RUN}`);
      await dialog.getByLabel('Email').fill(email);
      await dialog.getByLabel('Vai trò tài khoản nội bộ', { exact: true }).selectOption({ label: 'Quản lý rạp' });
      await dialog.getByLabel(/^Mật khẩu ban đầu/).fill('E2eMgr-123!');
      await dialogSubmit(page, 'Tạo mới');
      let manager;
      await expectPoll(async () => (manager = await one(pool, 'SELECT NguoiDungID FROM dbo.NGUOIDUNG WHERE Email = @e', { e: email })), { message: 'manager missing' });

      const cinema = await one(pool, 'SELECT TOP 1 RapID, TenRap FROM dbo.RAPCHIEUPHIM WHERE TrangThai = N\'Hoạt động\' ORDER BY RapID DESC');
      await page.goto(`${origin}/admin/access/assignments`);
      await page.getByRole('button', { name: 'Thêm phân công' }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Manager', { exact: true }).selectOption({ label: `E2E Manager ${RUN} · ${email}` });
      await dialog.getByLabel('Rạp phân công', { exact: true }).selectOption({ label: cinema.TenRap });
      await dialog.getByRole('button', { name: 'Tạo mới' }).click();
      await confirmSave(page);
      let assignment;
      await expectPoll(async () => (assignment = await one(pool, 'SELECT * FROM dbo.PHANCONG_RAP WHERE NguoiDungID = @u', { u: manager.NguoiDungID })), { message: 'assignment missing' });
      assert.deepEqual([assignment.RapID, assignment.TrangThai], [cinema.RapID, 'Hiệu lực']);

      // the new Manager signs in through the UI and only sees that cinema
      const guest = await context.browser().newContext();
      const managerPage = await guest.newPage();
      await uiLogin(managerPage, origin, email, 'E2eMgr-123!');
      assert.ok(new URL(managerPage.url()).pathname.startsWith('/manager'));
      await managerPage.goto(`${origin}/manager/rooms`);
      const selector = managerPage.locator('select[aria-label="Rạp hiện tại"]');
      await selector.waitFor({ state: 'attached' });
      await expectPoll(async () => (await selector.evaluate((el) => el.options.length)) === 1, { message: 'manager must see exactly one cinema' });
      assert.equal(await selector.evaluate((el) => el.value), String(cinema.RapID));

      // expire the assignment from the admin UI
      await adminSearch(page, 'Tìm Manager / email / rạp', email);
      await rowOf(page, email).getByRole('button', { name: /Sửa/ }).click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel('Trạng thái phân công').selectOption('Hết hạn');
      await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
      await confirmSave(page);
      await expectPoll(async () => (await scalar(pool, 'SELECT TrangThai FROM dbo.PHANCONG_RAP WHERE PhanCongID = @id', { id: assignment.PhanCongID })) === 'Hết hạn', { message: 'assignment not expired' });
      await managerPage.reload();
      await expectText(managerPage, 'Bạn không có phân công rạp còn hiệu lực');
      await guest.close();
      return { managerId: manager.NguoiDungID, assignmentId: assignment.PhanCongID };
    },
  },

  {
    id: 'E2E-ADM-BOOKING-VIEW',
    title: 'ADM-18 global bookings: search a paid order, detail is read-only (no edit/cancel for paid orders)',
    async run({ page, origin, pool, assert }) {
      await uiLogin(page, origin, ACCOUNTS.admin);
      const paid = await one(pool, "SELECT TOP 1 DonDatVeID FROM dbo.DONDATVE WHERE TrangThai = N'Đã thanh toán' ORDER BY DonDatVeID DESC");
      assert.ok(paid, 'no paid order');
      await page.goto(`${origin}/admin/bookings`);
      await page.getByLabel('Tìm mã đơn / vé / khách hàng / phim').fill(String(paid.DonDatVeID));
      await page.getByRole('button', { name: 'Áp dụng lọc' }).click();
      await page.getByRole('button', { name: new RegExp(`^Xem đơn #${paid.DonDatVeID} `) }).click();
      await expectText(page, `Đơn #${paid.DonDatVeID}`);
      await expectText(page, 'Đơn chỉ đọc theo trạng thái');
      assert.equal(await page.getByRole('button', { name: 'Hủy đơn', exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Sửa ghế' }).count(), 0);
      const order = await one(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @id', { id: paid.DonDatVeID });
      assert.equal(order.TrangThai, 'Đã thanh toán');
      return { orderId: paid.DonDatVeID };
    },
  },

  {
    id: 'E2E-RBAC-ROUTES',
    title: 'RBAC in the browser: anonymous → /login; customer/manager/support/admin are redirected out of foreign portals',
    async run({ page, context, origin, assert }) {
      const path = () => new URL(page.url()).pathname;
      // anonymous
      await page.goto(`${origin}/orders`);
      await page.waitForURL('**/login');
      await page.goto(`${origin}/admin/overview`);
      await page.waitForURL('**/login');

      // customer
      await uiLogin(page, origin, ACCOUNTS.customer);
      for (const target of ['/admin/overview', '/manager/overview', '/support/complaints']) {
        await page.goto(`${origin}${target}`);
        await page.waitForURL('**/forbidden');
      }
      // manager
      const m = await context.browser().newContext();
      const mp = await m.newPage();
      await uiLogin(mp, origin, ACCOUNTS.manager);
      for (const target of ['/admin/overview', '/support/complaints', '/orders']) {
        await mp.goto(`${origin}${target}`);
        await mp.waitForURL('**/forbidden');
      }
      await m.close();
      // support
      const s = await context.browser().newContext();
      const sp = await s.newPage();
      await uiLogin(sp, origin, ACCOUNTS.support);
      for (const target of ['/admin/overview', '/manager/overview', '/orders']) {
        await sp.goto(`${origin}${target}`);
        await sp.waitForURL('**/forbidden');
      }
      await s.close();
      // admin
      const a = await context.browser().newContext();
      const ap = await a.newPage();
      await uiLogin(ap, origin, ACCOUNTS.admin);
      for (const target of ['/manager/overview', '/support/complaints', '/orders']) {
        await ap.goto(`${origin}${target}`);
        await ap.waitForURL('**/forbidden');
      }
      await a.close();
      assert.ok(path().length > 0);
      return {};
    },
  },
];

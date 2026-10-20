// Manager portal (QLR-02..10): every step is a DOM interaction, every outcome read back from SQL.
import { ACCOUNTS, one, rows, scalar } from './lib.mjs';
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

// UI date-time → UTC instant; the app shows UTC+7 (Asia/Ho_Chi_Minh, no DST).
const toUtcIso = (local) => new Date(`${local}:00+07:00`).toISOString();
const state = {};

async function managerCinemaId(pool) {
  return (
    await one(
      pool,
      `SELECT TOP 1 p.RapID FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG n ON n.NguoiDungID = p.NguoiDungID
        WHERE n.Email = @e AND p.TrangThai = N'Hiệu lực' ORDER BY p.RapID`,
      { e: ACCOUNTS.manager },
    )
  ).RapID;
}

async function searchByName(page, label, value) {
  // The filter bar's keyword input is identified by placeholder or label
  const input = page
    .getByPlaceholder(label)
    .or(page.getByLabel(label))
    .or(page.getByPlaceholder('Nhập tên hoặc số trong tên phòng'))
    .or(page.getByPlaceholder('Nhập từ khóa'))
    .first();
  await input.fill(value);
  await page.keyboard.press('Enter');
}

export const managerScenarios = [
  {
    id: 'E2E-MGR-ROOM',
    title: 'QLR-02 rooms: create → edit → delete through the Manager UI (SQL verified)',
    async run({ page, origin, pool, RUN, assert }) {
      await uiLogin(page, origin, ACCOUNTS.manager);
      assert.ok(new URL(page.url()).pathname.startsWith('/manager'), `landed on ${page.url()}`);
      const cinemaId = await managerCinemaId(pool);
      state.cinemaId = cinemaId;
      await page.goto(`${origin}/manager/rooms?cinemaId=${cinemaId}`);
      const name = `E2E Phòng ${RUN}`;
      await page.getByRole('button', { name: '＋ Thêm phòng' }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Tên phòng').fill(name);
      await dialog.getByLabel('Loại phòng').selectOption('3D');
      await dialog.getByRole('button', { name: 'Lưu phòng' }).click();
      await dialog.waitFor({ state: 'hidden' });
      let room;
      await expectPoll(
        async () =>
          (room = await one(pool, 'SELECT * FROM dbo.PHONGCHIEU WHERE TenPhong = @n', { n: name })),
        {
          message: 'room not created',
        },
      );
      assert.deepEqual([room.RapID, room.LoaiPhong, room.TrangThai], [cinemaId, '3D', 'Hoạt động']);
      state.roomId = room.PhongID;
      state.roomName = name;

      // edit
      await searchByName(page, 'Nhập từ khóa', name);
      await rowOf(page, name).getByRole('button', { name: 'Sửa' }).click();
      const edit = page.getByRole('dialog');
      await edit.getByLabel('Tên phòng').fill(`${name} sửa`);
      await edit.getByLabel('Loại phòng').selectOption('IMAX');
      await edit.getByRole('button', { name: 'Lưu phòng' }).click();
      await edit.waitFor({ state: 'hidden' });
      await expectPoll(
        async () =>
          (
            await one(pool, 'SELECT TenPhong, LoaiPhong FROM dbo.PHONGCHIEU WHERE PhongID = @id', {
              id: room.PhongID,
            })
          ).LoaiPhong === 'IMAX',
        { message: 'room not updated' },
      );
      const updated = await one(
        pool,
        'SELECT TenPhong, LoaiPhong FROM dbo.PHONGCHIEU WHERE PhongID = @id',
        { id: room.PhongID },
      );
      assert.equal(updated.TenPhong, `${name} sửa`);
      state.roomName = `${name} sửa`;

      // a throw-away room deleted from the UI (no history → physical delete)
      const temp = `E2E Phòng tạm ${RUN}`;
      await page.getByRole('button', { name: '＋ Thêm phòng' }).click();
      await page.getByRole('dialog').getByLabel('Tên phòng').fill(temp);
      await page.getByRole('dialog').getByRole('button', { name: 'Lưu phòng' }).click();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      await searchByName(page, 'Nhập từ khóa', temp);
      const tempRow = rowOf(page, temp);
      const summary = tempRow.locator('summary', { hasText: 'Khác' });
      if (await summary.count()) await summary.click();
      await tempRow.getByRole('button', { name: /Xóa/ }).click();
      await confirmIfAsked(page);
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT COUNT(*) FROM dbo.PHONGCHIEU WHERE TenPhong = @n', {
            n: temp,
          })) === 0,
        {
          message: 'temporary room still exists',
        },
      );
      return { roomId: room.PhongID };
    },
  },

  {
    id: 'E2E-MGR-SEAT',
    title: 'QLR-03 seats: create (VIP) → set to maintenance → delete through the seat inspector',
    async run({ page, origin, pool, assert }) {
      assert.ok(state.roomId, 'E2E-MGR-ROOM must run first');
      await uiLogin(page, origin, ACCOUNTS.manager);
      await page.goto(`${origin}/manager/seats?cinemaId=${state.cinemaId}`);
      // choose the room like a user: pick it in the room selector
      await pickSearchableOption(page, 'Phòng', state.roomName);
      await page.getByRole('button', { name: '＋ Thêm ghế' }).click();
      let dialog = page.getByRole('dialog');
      await dialog.getByLabel('Hàng ghế').fill('Q');
      await dialog.getByLabel('Số ghế').fill('7');
      await dialog.getByLabel('Loại ghế').selectOption('VIP');
      await dialog.getByRole('button', { name: 'Lưu ghế' }).click();
      await dialog.waitFor({ state: 'hidden' });
      let seat;
      await expectPoll(
        async () =>
          (seat = await one(
            pool,
            'SELECT * FROM dbo.GHE WHERE PhongID = @r AND HangGhe = @h AND SoGhe = 7',
            { r: state.roomId, h: 'Q' },
          )),
        { message: 'seat not created' },
      );
      assert.deepEqual([seat.LoaiGhe, seat.TrangThai], ['VIP', 'Hoạt động']);

      // select the seat on the map → inspector → edit
      await page.getByRole('button', { name: 'Danh sách', exact: true }).click();
      const seatTrigger = page.getByRole('button', { name: 'Xem Q7' });
      await seatTrigger.click();
      const inspector = page.getByRole('dialog', { name: 'Chi tiết ghế · Q7' });
      await inspector.waitFor({ state: 'visible' });
      await inspector.locator('.ui-dialog__header button').click();
      await inspector.waitFor({ state: 'hidden' });
      assert.equal(
        await seatTrigger.evaluate((element) => element === document.activeElement),
        true,
        'closing the seat inspector restores focus to its trigger',
      );
      await seatTrigger.click();
      await page.getByRole('button', { name: 'Sửa ghế' }).click();
      // The seat inspector stays open behind its editor; assert that the editor closes.
      dialog = page.getByRole('dialog', { name: 'Chỉnh sửa ghế' });
      await dialog.getByLabel('Trạng thái').selectOption('Bảo trì');
      await dialog.getByRole('button', { name: 'Lưu ghế' }).click();
      await dialog.waitFor({ state: 'hidden' });
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT TrangThai FROM dbo.GHE WHERE GheID = @id', {
            id: seat.GheID,
          })) === 'Bảo trì',
        { message: 'seat status not updated' },
      );

      await page.getByRole('button', { name: 'Xóa ghế' }).click();
      await confirmIfAsked(page);
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT COUNT(*) FROM dbo.GHE WHERE GheID = @id', {
            id: seat.GheID,
          })) === 0,
        {
          message: 'seat not deleted',
        },
      );
      return { seatId: seat.GheID };
    },
  },

  {
    id: 'E2E-MGR-SHOWTIME',
    title: 'QLR-04..06 showtimes: create → edit price → cancel through the Manager UI',
    async run({ page, origin, pool, RUN, assert }) {
      assert.ok(state.roomId, 'E2E-MGR-ROOM must run first');
      await uiLogin(page, origin, ACCOUNTS.manager);
      await page.goto(`${origin}/manager/showtimes?cinemaId=${state.cinemaId}`);
      const movie = await one(
        pool,
        `SELECT TOP 1 PhimID, TenPhim FROM dbo.PHIM WHERE TrangThai = N'Đang chiếu'
            AND (NgayKetThuc IS NULL OR NgayKetThuc > DATEADD(DAY, 60, CAST(dbo.fn_BayGio() AS DATE))) ORDER BY PhimID`,
      );
      assert.ok(movie, 'no running movie');
      const day = new Date(Date.now() + (20 + (parseInt(RUN, 36) % 25)) * 86400000);
      const date = day.toISOString().slice(0, 10);
      const startLocal = `${date}T10:00`;
      const endLocal = `${date}T12:00`;

      await page.getByRole('button', { name: 'Thêm suất chiếu' }).click();
      let dialog = page.getByRole('dialog');
      await pickSearchableOption(dialog, 'Phim', movie.TenPhim);
      await pickSearchableOption(dialog, 'Phòng', state.roomName);
      await dialog.getByLabel(/Bắt đầu/).fill(startLocal);
      await dialog.getByLabel(/Kết thúc/).fill(endLocal);
      await selectCustomOption(dialog, 'Định dạng', 'IMAX');
      await dialog.getByLabel(/Giá vé cơ bản/).fill('110000');
      await dialog.getByRole('button', { name: 'Tạo suất' }).click();
      await dialog.waitFor({ state: 'hidden' });
      let showtime;
      await expectPoll(
        async () =>
          (showtime = await one(
            pool,
            'SELECT * FROM dbo.SUATCHIEU WHERE PhongID = @r AND PhimID = @m',
            { r: state.roomId, m: movie.PhimID },
          )),
        { message: 'showtime not created' },
      );
      assert.equal(new Date(showtime.ThoiGianBatDau).toISOString(), toUtcIso(startLocal));
      assert.equal(new Date(showtime.ThoiGianKetThuc).toISOString(), toUtcIso(endLocal));
      assert.deepEqual(
        [Number(showtime.GiaVeCoBan), showtime.TrangThai, showtime.DinhDang],
        [110000, 'Mở bán', 'IMAX'],
      );

      // edit the base price
      await selectCustomOption(page, 'Phòng lọc lịch', { label: state.roomName });
      await page.getByRole('textbox', { name: /^Từ ngày/ }).fill(date);
      await page.getByRole('textbox', { name: /^Đến ngày/ }).fill(date);
      await page.getByRole('button', { name: 'Áp dụng lọc' }).click();
      await page.getByRole('button', { name: /^Sửa / }).first().click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel(/Giá vé cơ bản/).fill('125000');
      await dialog
        .getByRole('button', { name: /^(Lưu|Cập nhật)/ })
        .first()
        .click();
      await dialog.waitFor({ state: 'hidden' });
      await expectPoll(
        async () =>
          Number(
            await scalar(pool, 'SELECT GiaVeCoBan FROM dbo.SUATCHIEU WHERE SuatChieuID = @id', {
              id: showtime.SuatChieuID,
            }),
          ) === 125000,
        { message: 'showtime price not updated' },
      );

      // cancel
      await page.getByRole('button', { name: /^Hủy / }).first().click();
      const confirm = page.getByRole('dialog');
      await confirm.getByRole('button', { name: 'Hủy suất chiếu' }).click();
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID = @id', {
            id: showtime.SuatChieuID,
          })) === 'Đã hủy',
        { message: 'showtime not cancelled' },
      );
      state.showtimeId = showtime.SuatChieuID;
      return { showtimeId: showtime.SuatChieuID };
    },
  },

  {
    id: 'E2E-MGR-PRICING',
    title: 'QLR-07 pricing: create rule → edit surcharge → pause, scoped to the assigned cinema',
    async run({ page, origin, pool, RUN, assert }) {
      await uiLogin(page, origin, ACCOUNTS.manager);
      const cinemaId = state.cinemaId ?? (await managerCinemaId(pool));
      await page.goto(`${origin}/manager/pricing?cinemaId=${cinemaId}`);
      // strictly after every rule already stored for the cinema → cannot collide with earlier runs
      const lastDay = await scalar(
        pool,
        `SELECT CONVERT(VARCHAR(10), DATEADD(DAY, 7, MAX(ISNULL(NgayKetThuc, NgayBatDau))), 23) FROM dbo.BANGGIA WHERE RapID = @r`,
        { r: cinemaId },
      );
      const first = new Date(`${lastDay ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`);
      const startsOn = first.toISOString().slice(0, 10);
      const endsOn = new Date(first.getTime() + 3 * 86400000).toISOString().slice(0, 10);
      await page.getByRole('button', { name: 'Thêm bảng giá' }).click();
      let dialog = page.getByRole('dialog');
      await selectCustomOption(dialog, 'Loại ghế bảng giá', 'Sweetbox');
      await selectCustomOption(dialog, 'Loại ngày', 'Cuối tuần');
      await selectCustomOption(dialog, 'Định dạng bảng giá', '4DX');
      await dialog.getByLabel(/Phụ thu/).fill('9000');
      await dialog.getByLabel('Ngày áp dụng', { exact: true }).fill(startsOn);
      await dialog.getByLabel('Ngày kết thúc', { exact: true }).fill(endsOn);
      await dialog.getByRole('button', { name: 'Tạo giá' }).click();
      await dialog.waitFor({ state: 'hidden' });
      let rule;
      await expectPoll(
        async () =>
          (rule = await one(
            pool,
            `SELECT * FROM dbo.BANGGIA WHERE RapID = @r AND LoaiGhe = N'Sweetbox' AND LoaiNgay = N'Cuối tuần'
               AND DinhDang = N'4DX' AND NgayBatDau = @d`,
            { r: cinemaId, d: startsOn },
          )),
        { message: 'pricing rule not created' },
      );
      assert.deepEqual([Number(rule.PhuThu), rule.TrangThai], [9000, 'Áp dụng']);

      // narrow the list to the rule created above (earlier runs leave paused Sweetbox rules)
      await selectCustomOption(page, 'Loại ghế', 'Sweetbox');
      await page.getByLabel('Có hiệu lực ngày').fill(startsOn);
      await page.getByRole('button', { name: 'Áp dụng lọc' }).click();
      await expectPoll(
        async () => (await page.getByRole('button', { name: /^Sửa / }).count()) === 1,
        { message: 'filter should leave exactly the new rule' },
      );
      await page.getByRole('button', { name: /^Sửa / }).first().click();
      dialog = page.getByRole('dialog');
      await dialog.getByLabel(/Phụ thu/).fill('11000');
      await dialog
        .getByRole('button', { name: /^(Lưu|Cập nhật)/ })
        .first()
        .click();
      await dialog.waitFor({ state: 'hidden' });
      await expectPoll(
        async () =>
          Number(
            await scalar(pool, 'SELECT PhuThu FROM dbo.BANGGIA WHERE GiaID = @id', {
              id: rule.GiaID,
            }),
          ) === 11000,
        { message: 'surcharge not updated' },
      );
      // pause the rule so re-runs never collide with an active overlapping rule
      await page.getByRole('button', { name: /^Sửa / }).first().click();
      dialog = page.getByRole('dialog');
      await selectCustomOption(dialog, 'Trạng thái', 'Tạm dừng');
      await dialog
        .getByRole('button', { name: /^(Lưu|Cập nhật)/ })
        .first()
        .click();
      await dialog.waitFor({ state: 'hidden' });
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT TrangThai FROM dbo.BANGGIA WHERE GiaID = @id', {
            id: rule.GiaID,
          })) === 'Tạm dừng',
        { message: 'rule not paused' },
      );
      return { pricingId: rule.GiaID };
    },
  },

  {
    id: 'E2E-MGR-BOOKING',
    title: 'QLR-10 staff booking: create for a customer → change seat → cancel (history kept)',
    async run({ page, origin, pool, assert }) {
      await uiLogin(page, origin, ACCOUNTS.manager);
      const cinemaId = state.cinemaId ?? (await managerCinemaId(pool));
      await page.goto(`${origin}/manager/bookings?cinemaId=${cinemaId}`);
      const target = await one(
        pool,
        `SELECT TOP 1 s.SuatChieuID FROM dbo.SUATCHIEU s JOIN dbo.PHONGCHIEU p ON p.PhongID = s.PhongID
           JOIN dbo.vw_LichChieuChiTiet v ON v.SuatChieuID = s.SuatChieuID
          WHERE p.RapID = @r AND s.TrangThai = N'Mở bán' AND v.IsBookable = 1 AND v.SoGheDaDat <= v.TongSoGhe - 6
            AND s.ThoiGianBatDau > DATEADD(HOUR, 3, dbo.fn_BayGio()) ORDER BY s.ThoiGianBatDau`,
        { r: cinemaId },
      );
      assert.ok(target, 'no bookable showtime in the managed cinema');
      const customer = await one(
        pool,
        'SELECT NguoiDungID, HoTen, Email FROM dbo.NGUOIDUNG WHERE Email = @e',
        {
          e: ACCOUNTS.customer2,
        },
      );

      await page.getByRole('button', { name: 'Tạo đơn đặt vé' }).click();
      await page.getByLabel('Tìm Customer bằng tên/email/SĐT').fill(customer.Email);
      await page.getByRole('button', { name: 'Tìm khách hàng' }).click();
      await page.getByLabel('Khách hàng có sẵn').selectOption(String(customer.NguoiDungID));
      await page.getByRole('button', { name: 'Tiếp tục' }).click();
      await page.getByLabel('Suất chiếu / phim / phòng').selectOption(String(target.SuatChieuID));
      await page.getByRole('button', { name: 'Tiếp tục' }).click();
      const seats = page.locator('button.seat-button[data-status="Trống"]');
      await seats.first().waitFor();
      const firstSeat = (await seats.nth(0).textContent()).trim();
      const secondSeat = (await seats.nth(1).textContent()).trim();
      await seats.nth(0).click();
      await page.getByRole('button', { name: 'Tiếp tục' }).click();
      const lastOrderId =
        (await scalar(
          pool,
          'SELECT MAX(DonDatVeID) FROM dbo.DONDATVE WHERE NguoiDungID = @u AND SuatChieuID = @s',
          { u: customer.NguoiDungID, s: target.SuatChieuID },
        )) ?? 0;
      await page.getByRole('button', { name: 'Tạo đơn Chờ thanh toán' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
      let order;
      await expectPoll(
        async () =>
          (order = await one(
            pool,
            'SELECT TOP 1 * FROM dbo.DONDATVE WHERE NguoiDungID = @u AND SuatChieuID = @s AND DonDatVeID > @last ORDER BY DonDatVeID DESC',
            { u: customer.NguoiDungID, s: target.SuatChieuID, last: lastOrderId },
          )),
        { message: 'staff order not created' },
      );
      assert.equal(order.TrangThai, 'Chờ thanh toán');
      assert.equal(
        await scalar(pool, 'SELECT COUNT(*) FROM dbo.THANHTOAN WHERE DonDatVeID = @id', {
          id: order.DonDatVeID,
        }),
        0,
      );
      const seatsOf = async (status) =>
        (
          await rows(
            pool,
            `SELECT g.HangGhe + CAST(g.SoGhe AS VARCHAR(10)) AS label FROM dbo.CHITIETVE v JOIN dbo.GHE g ON g.GheID = v.GheID
              WHERE v.DonDatVeID = @id AND v.TrangThai = @st`,
            { id: order.DonDatVeID, st: status },
          )
        ).map((r) => r.label);
      assert.deepEqual(await seatsOf('Đã đặt'), [firstSeat]);

      // open the order and change the seat (same showtime, same hold)
      await expectText(page, `Đơn #${order.DonDatVeID}`);
      await page.getByRole('button', { name: 'Sửa ghế' }).click();
      await page.getByRole('button', { name: `Bỏ ghế ${firstSeat}` }).click();
      await page.locator(`button.seat-button[aria-label^="${secondSeat} "]`).click();
      await page.getByRole('button', { name: 'Tiếp tục' }).click();
      await page.getByRole('button', { name: 'Lưu ghế' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await expectPoll(async () => (await seatsOf('Đã đặt')).join() === secondSeat, {
        message: 'seat not swapped',
      });
      assert.deepEqual(await seatsOf('Đã hủy'), [firstSeat], 'released seat must stay as history');

      // cancel
      await page.getByRole('button', { name: 'Hủy đơn', exact: true }).first().click();
      await page.getByRole('dialog').getByRole('button', { name: 'Hủy đơn', exact: true }).last().click();
      await expectPoll(
        async () =>
          (await scalar(pool, 'SELECT TrangThai FROM dbo.DONDATVE WHERE DonDatVeID = @id', {
            id: order.DonDatVeID,
          })) === 'Đã hủy',
        { message: 'order not cancelled' },
      );
      assert.ok(
        (await scalar(pool, 'SELECT COUNT(*) FROM dbo.CHITIETVE WHERE DonDatVeID = @id', {
          id: order.DonDatVeID,
        })) >= 2,
      );
      return { orderId: order.DonDatVeID };
    },
  },

  {
    id: 'E2E-MGR-SCOPE',
    title: 'QLR-01/08/09 manager portal shows only assigned cinemas; foreign cinema URL is refused',
    async run({ page, origin, pool, assert }) {
      await uiLogin(page, origin, ACCOUNTS.manager);
      const assigned = (
        await rows(
          pool,
          `SELECT p.RapID FROM dbo.PHANCONG_RAP p JOIN dbo.NGUOIDUNG n ON n.NguoiDungID = p.NguoiDungID
            WHERE n.Email = @e AND p.TrangThai = N'Hiệu lực'`,
          { e: ACCOUNTS.manager },
        )
      ).map((r) => r.RapID);
      const foreign = (
        await one(
          pool,
          `SELECT TOP 1 RapID FROM dbo.RAPCHIEUPHIM WHERE RapID NOT IN (${assigned.join(',')}) ORDER BY RapID`,
        )
      ).RapID;
      await page.goto(`${origin}/manager`);
      await expectText(page, 'Phòng chiếu');
      await page.goto(`${origin}/manager/rooms`);
      const selector = page.locator('select[aria-label="Rạp hiện tại"]');
      await selector.waitFor({ state: 'attached' });
      await expectPoll(async () => (await selector.evaluate((el) => el.options.length)) > 0, {
        message: 'cinema options not loaded',
      });
      const options = await selector.evaluate((el) => el.options.length);
      assert.equal(
        options,
        assigned.length,
        `cinema selector lists ${options} cinemas, assigned ${assigned.length}`,
      );
      await page.goto(`${origin}/manager/rooms?cinemaId=${foreign}`);
      await expectText(page, 'Dùng rạp hiện tại');
      await page.goto(`${origin}/manager/revenue`);
      await expectText(page, 'Doanh thu');
      return { assigned, foreign };
    },
  },
];

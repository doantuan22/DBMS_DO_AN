import assert from 'node:assert/strict';
import test from 'node:test';
import { pricingUpdate } from '../src/validators/managerValidator.js';
import { createManagerService } from '../src/services/managerService.js';
import { createSupportService } from '../src/services/supportService.js';

test('R7 pricing edits keep partial updates compatible and validate complete condition/date edits', async () => {
  assert.deepEqual(pricingUpdate({ surcharge: 500, status: 'Tạm dừng' }), {
    surcharge: 500,
    status: 'Tạm dừng',
  });
  const full = {
    seatType: 'VIP',
    dayType: 'Cuối tuần',
    format: 'IMAX',
    surcharge: 500,
    startsOn: '2027-02-03',
    endsOn: null,
    status: 'Áp dụng',
  };
  assert.deepEqual(pricingUpdate(full), full);
  for (const invalid of [
    { ...full, endsOn: '2027-02-02' },
    { ...full, dayType: 'bad' },
    { ...full, surcharge: 0.001 },
    { surcharge: 0, status: 'Áp dụng', seatType: 'VIP' },
    { ...full, cinemaId: 2 },
  ]) {
    assert.throws(() => pricingUpdate(invalid), { status: 400 });
  }
  const calls = [];
  const service = createManagerService({
    execute: async (key, params) => {
      calls.push({ key, params });
      return { recordset: [{}] };
    },
  });
  await service.updatePricing(2, 7, full);
  assert.equal(calls[0].key, 'MANAGER_PRICING_UPDATE');
  assert.equal(calls[0].params.NguoiDungID.value, 2);
  assert.equal(calls[0].params.NgayBatDau.value, '2027-02-03');
  assert.equal(calls[0].params.NgayKetThuc.value, null);
  assert.equal(calls[0].params.CapNhatDieuKien.value, true);
  assert.ok(!Object.hasOwn(calls[0].params, 'RapID'));
  await service.updatePricing(2, 7, { surcharge: 500, status: 'Tạm dừng' });
  assert.ok(!Object.hasOwn(calls[1].params, 'CapNhatDieuKien'));
});

test('R7 Support maps all complaint-scoped order recordsets and excludes unrelated/sensitive columns', async () => {
  const calls = [];
  const service = createSupportService({
    execute: async (key, params) => {
      calls.push({ key, params });
      return {
        recordsets: [
          [
            {
              DonDatVeID: 20,
              NguoiDungID: 5,
              HoTenKhachHang: 'Fixture',
              TongTienVe: 80000,
              TongTienDoAn: 20000,
              TienGiamGia: 10000,
              TongTienThanhToan: 90000,
              TrangThaiDon: 'Đã hủy',
              DiemBoiThuong: 72,
              NgayBoiThuong: '2027-01-01T00:00:00Z',
              MatKhau: 'DO_NOT_RETURN',
              extraSecret: 'DO_NOT_RETURN',
            },
          ],
          [{ VeID: 1, TenGhe: 'A1', GiaVe: 80000, TrangThaiVe: 'Đã hủy' }],
          [{ ChiTietDoAnID: 2, TenSanPham: 'Food', SoLuong: 2, DonGia: 10000, ThanhTien: 20000 }],
          [
            { ThanhToanID: 3, SoTien: 90000, TrangThai: 'Thất bại' },
            { ThanhToanID: 4, SoTien: 90000, TrangThai: 'Thành công' },
          ],
        ],
      };
    },
  });
  const { order } = await service.orderReference(4, 9);
  assert.deepEqual(
    Object.fromEntries(Object.entries(calls[0].params).map(([key, value]) => [key, value.value])),
    { NguoiDungID: 4, KhieuNaiID: 9 },
  );
  assert.equal(order.id, 20);
  assert.equal(order.total, 90000);
  assert.equal(order.tickets[0].status, 'Đã hủy');
  assert.equal(order.products[0].total, 20000);
  assert.deepEqual(
    order.payments.map((payment) => payment.status),
    ['Thất bại', 'Thành công'],
  );
  assert.equal(order.compensation.points, 72);
  assert.ok(!JSON.stringify(order).includes('DO_NOT_RETURN'));
  assert.deepEqual(
    await createSupportService({
      execute: async () => ({ recordset: [{ Message: 'No linked order' }] }),
    }).orderReference(4, 9),
    { order: null, message: 'No linked order' },
  );
});

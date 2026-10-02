import assert from 'node:assert/strict';
import test from 'node:test';
import { createBookingService } from '../src/services/bookingService.js';

function fixture() {
  const calls = [];
  const results = new Map();
  const execute = async (key, params) => { calls.push({ key, params, kind: 'execute' }); return results.get(key); };
  const executeWithOutputs = async (key, params, outputs) => { calls.push({ key, params, outputs, kind: 'outputs' }); const result = results.get(key); if (result instanceof Error) throw result; return result; };
  return { calls, results, service: createBookingService({ execute, executeWithOutputs }) };
}

test('seat and product endpoints preserve the database recordset contract', async () => {
  const { service, results, calls } = fixture();
  results.set('SEAT_LIST_BY_SHOWTIME', { recordset: [{ GheID: 2, PhongID: 3, HangGhe: 'A', SoGhe: 2, TenGhe: 'A2', LoaiGhe: 'VIP', GiaVe: 100000, TrangThaiGhe: 'Đang giữ' }] });
  results.set('PRODUCT_LIST_ACTIVE', { recordset: [{ SanPhamID: 4, TenSanPham: 'Popcorn', LoaiSanPham: 'Snack', Gia: 45000, TrangThai: 'Đang bán' }] });
  assert.deepEqual(await service.listSeats(7), [{ id: 2, roomId: 3, row: 'A', number: 2, label: 'A2', type: 'VIP', price: 100000, status: 'Đang giữ' }]);
  assert.deepEqual(await service.listProducts(), [{ id: 4, name: 'Popcorn', type: 'Snack', price: 45000, description: undefined, imageUrl: undefined, status: 'Đang bán' }]);
  assert.deepEqual(calls.map((call) => call.key), ['SEAT_LIST_BY_SHOWTIME', 'PRODUCT_LIST_ACTIVE']);
});

test('booking maps IDs and quantities to the one authoritative booking procedure', async () => {
  const { service, results, calls } = fixture();
  results.set('BOOKING_CREATE', { recordsets: [
    [{ IsValid: 1, MaCode: 'SAVE10', TienGiam: 10000 }],
    [{ DonDatVeID: 14, NguoiDungID: 5, SuatChieuID: 7, TongTienVe: 170000, TongTienDoAn: 45000, TienGiamGia: 10000, TongThanhToan: 205000, TrangThai: 'Chờ thanh toán', SoLuongVe: 2 }],
  ] });
  const booking = await service.createBooking(5, { showtimeId: 7, seatIds: [11, 12], products: [{ productId: 4, quantity: 1 }], promotionCode: 'SAVE10' });
  assert.equal(calls[0].key, 'BOOKING_CREATE');
  assert.equal(calls[0].params.NguoiDungID.value, 5);
  assert.equal(calls[0].params.DanhSachGheId.value, '11,12');
  assert.equal(calls[0].params.DanhSachDoAnJson.value, '[{"SanPhamID":4,"SoLuong":1}]');
  assert.equal(booking.total, 205000);
  assert.equal(booking.id, 14);
});

test('database seat conflicts become HTTP 409 without exposing SQL details', async () => {
  const { service, results } = fixture();
  const conflict = new Error('SQL seat message');
  conflict.number = 50025;
  results.set('BOOKING_CREATE', conflict);
  await assert.rejects(service.createBooking(5, { showtimeId: 7, seatIds: [11], products: [], promotionCode: null }), {
    status: 409, code: 'SEAT_CONFLICT',
  });
});

test('booking limit errors and numeric overflow map to fixed 4xx responses', async () => {
  const input = { showtimeId: 7, seatIds: [11], products: [], promotionCode: null };
  const cases = [[50026, 400, 'SEAT_LIMIT_EXCEEDED'], [50027, 400, 'PRODUCT_QUANTITY_LIMIT_EXCEEDED'], [50028, 409, 'ACTIVE_ORDER_LIMIT_REACHED'],
    [248, 400, 'INVALID_REQUEST'], [245, 400, 'INVALID_REQUEST'], [8115, 400, 'INVALID_REQUEST']];
  for (const [number, status, code] of cases) {
    const { service, results } = fixture();
    const error = new Error('The conversion of the nvarchar value overflowed an int column in table dbo.CHITIETDOAN'); error.number = number;
    results.set('BOOKING_CREATE', error);
    await assert.rejects(service.createBooking(5, input), (thrown) => thrown.status === status && thrown.code === code && !/dbo|CHITIET|nvarchar/i.test(thrown.message));
  }
  const { service, results } = fixture();
  const unknown = new Error('other'); unknown.number = 2627; results.set('BOOKING_CREATE', unknown);
  await assert.rejects(service.createBooking(5, input), (thrown) => thrown === unknown); // unrelated SQL errors still surface as 500
});

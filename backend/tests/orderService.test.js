import assert from 'node:assert/strict';
import test from 'node:test';
import { createOrderService } from '../src/services/orderService.js';

function sqlError(number) {
  const error = new Error('SQL');
  error.number = number;
  return error;
}

function detailResult(payments = []) {
  return {
    recordsets: [
      [
        {
          DonDatVeID: 12,
          NguoiDungID: 5,
          SuatChieuID: 9,
          PhimID: 3,
          TenPhim: 'Film',
          TenRap: 'Cinema',
          TenPhong: 'A',
          TongTienVe: 100000,
          TongTienDoAn: 20000,
          TienGiamGia: 5000,
          TongTienThanhToan: 115000,
          TrangThaiDon: 'Chờ thanh toán',
        },
      ],
      [{ VeID: 1, TenGhe: 'A1', GiaVe: 100000, TrangThaiVe: 'Đã đặt' }],
      [],
      payments,
    ],
  };
}

test('orders map the four database recordsets without client prices or ownership fields', async () => {
  const calls = [];
  const service = createOrderService({
    execute: async (key, params) => {
      calls.push({ key, params });
      return detailResult([
        { ThanhToanID: 7, PhuongThuc: 'MOMO', SoTien: 115000, TrangThai: 'Thất bại' },
      ]);
    },
  });
  const order = await service.getOrderDetail(5, 12);
  assert.equal(calls[0].key, 'ORDER_GET_DETAIL_BY_CUSTOMER');
  assert.equal(calls[0].params.NguoiDungID.value, 5);
  assert.equal(order.total, 115000);
  assert.deepEqual(order.payments[0], {
    id: 7,
    method: 'MOMO',
    amount: 115000,
    createdAt: undefined,
    paidAt: undefined,
    transactionCode: undefined,
    status: 'Thất bại',
    note: undefined,
  });
});

test('payment creation first performs the database ownership lookup and never accepts amount', async () => {
  const calls = [];
  const service = createOrderService({
    execute: async (key, params) => {
      calls.push({ key, params });
      return detailResult();
    },
    executeWithOutputs: async (key, params, outputs) => {
      calls.push({ key, params, outputs });
      return {
        recordset: [
          {
            ThanhToanID: 20,
            DonDatVeID: 12,
            PhuongThuc: 'VNPAY',
            SoTien: 115000,
            MaGiaoDich: 'TXN-20',
            TrangThai: 'Đang xử lý',
          },
        ],
      };
    },
  });
  const payment = await service.createPaymentAttempt(5, 12, { paymentMethod: 'VNPAY' });
  assert.deepEqual(
    calls.map((call) => call.key),
    ['ORDER_GET_DETAIL_BY_CUSTOMER', 'PAYMENT_CREATE_ATTEMPT'],
  );
  assert.equal(calls[1].params.DonDatVeID.value, 12);
  assert.equal(calls[1].params.PhuongThuc.value, 'VNPAY');
  assert.equal(payment.amount, 115000);
});

test('payment result checks that the attempt belongs to the customer order before the completion procedure', async () => {
  const calls = [];
  let detailCalls = 0;
  const service = createOrderService({
    execute: async (key) => {
      calls.push(key);
      if (key === 'PAYMENT_UPDATE_RESULT') return { recordset: [] };
      detailCalls += 1;
      return detailResult([
        {
          ThanhToanID: 20,
          PhuongThuc: 'VNPAY',
          SoTien: 115000,
          TrangThai: detailCalls === 1 ? 'Đang xử lý' : 'Thành công',
        },
      ]);
    },
  });
  const result = await service.updatePaymentResult(5, 12, 20, { status: 'Thành công' });
  assert.deepEqual(calls, [
    'ORDER_GET_DETAIL_BY_CUSTOMER',
    'PAYMENT_UPDATE_RESULT',
    'ORDER_GET_DETAIL_BY_CUSTOMER',
  ]);
  assert.equal(result.payment.status, 'Thành công');
});

test('database ownership and state errors map to safe REST errors', async () => {
  const service = createOrderService({
    execute: async () => {
      throw sqlError(50033);
    },
  });
  await assert.rejects(service.getOrderDetail(5, 12), { status: 404, code: 'ORDER_NOT_FOUND' });
  const expired = createOrderService({
    execute: async () => detailResult(),
    executeWithOutputs: async () => {
      throw sqlError(50111);
    },
  });
  await assert.rejects(expired.createPaymentAttempt(5, 12, { paymentMethod: 'MOMO' }), {
    status: 409,
    code: 'ORDER_HOLD_EXPIRED',
  });
});

test('numeric overflow while paying maps to 400 and unrelated errors are untouched', async () => {
  for (const number of [8115, 245, 248]) {
    const service = createOrderService({
      execute: async () => {
        throw sqlError(number);
      },
    });
    await assert.rejects(service.getOrderDetail(5, 12), { status: 400, code: 'INVALID_REQUEST' });
  }
  const service = createOrderService({
    execute: async () => {
      throw sqlError(2627);
    },
  });
  await assert.rejects(service.getOrderDetail(5, 12), (error) => error.number === 2627);
});

test('R2 compensation comes from DB and successful payment history is unchanged', async () => {
  const result = detailResult([
    {
      ThanhToanID: 7,
      PhuongThuc: 'MOMO',
      SoTien: 150000,
      TrangThai: 'Thành công',
      GhiChu: 'Original',
    },
  ]);
  Object.assign(result.recordsets[0][0], {
    TrangThaiDon: 'Đã hủy',
    DiemBoiThuong: 90,
    NgayBoiThuong: '2026-10-04T05:00:00Z',
    ThongBaoHuy: 'Điểm bồi thường đã cộng.',
  });
  const order = await createOrderService({ execute: async () => result }).getOrderDetail(5, 12);
  assert.deepEqual(order.compensation, { points: 90, creditedAt: '2026-10-04T05:00:00Z' });
  assert.equal(order.payments[0].status, 'Thành công');
  assert.equal(order.payments[0].note, 'Original');
});

test('R2 payment on ineligible showtime maps to a domain conflict', async () => {
  const service = createOrderService({
    execute: async () => detailResult(),
    executeWithOutputs: async () => {
      throw sqlError(50121);
    },
  });
  await assert.rejects(service.createPaymentAttempt(5, 12, { paymentMethod: 'MOMO' }), {
    status: 409,
    code: 'SHOWTIME_NOT_PAYABLE',
  });
});

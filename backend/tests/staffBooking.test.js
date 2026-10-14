import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {
  createStaffBookingService,
  mapStaffBookingError,
} from '../src/services/staffBookingService.js';
import { createStaffBookingRouter } from '../src/routes/staffBookingRoutes.js';
import * as validate from '../src/validators/staffBookingValidator.js';
import { PROCEDURES } from '../src/db/procedures.js';

test('staff booking rejects spoofed identity, payment, prices and unsupported edits', () => {
  const input = { customerId: 5, showtimeId: 1, seatIds: [1, 2] };
  assert.equal(validate.createBooking(input).customerId, 5);
  for (const extra of [
    { actorId: 1 },
    { role: 'ADMIN' },
    { status: 'Đã thanh toán' },
    { price: 0 },
    { products: [] },
  ])
    assert.throws(
      () => validate.createBooking({ ...input, ...extra }),
      (e) => e.status === 400,
    );
  for (const customerId of [0, -1, 1.5, '5', 2147483648])
    assert.throws(() => validate.createBooking({ ...input, customerId }));
  for (const seats of [[1, 1], [], Array.from({ length: 11 }, (_, i) => i + 1)])
    assert.throws(() => validate.createBooking({ ...input, seatIds: seats }));
  assert.deepEqual(validate.updateSeats({ seatIds: [2], expectedTicketIds: [8] }), {
    seatIds: [2],
    expectedTicketIds: [8],
  });
  assert.throws(() =>
    validate.updateSeats({ seatIds: [2], expectedTicketIds: [8], customerId: 6 }),
  );
  assert.throws(() => validate.cancelBooking({ refund: true }));
  assert.throws(() => validate.customerSearch({ search: 'a' }));
  assert.throws(() => validate.bookingOptions({ orderId: '1' }));
  assert.throws(() => validate.listFilters({ pageSize: '101' }));
  assert.throws(() => validate.listFilters({ status: 'fake' }));
  assert.equal(validate.listFilters({ status: 'Hoàn tiền' }).status, 'Hoàn tiền');
});

test('staff service binds trusted actor/portal and typed RPC, returns SQL availability/history', async () => {
  const calls = [];
  const execute = async (key, input, output) => {
    calls.push({ key, input, output });
    return {
      recordsets: [
        [{ DonDatVeID: 9, NguoiDungID: 5, CanEdit: 1, CanCancel: 0 }],
        [{ VeID: 7, GheID: 2, GiaVe: 90000, TrangThaiVe: 'Đã hủy' }],
        [],
        [{ ThanhToanID: 3, TrangThai: 'Thất bại', SoTien: 90000 }],
      ],
      output: { NewDonDatVeID: 9 },
    };
  };
  const service = createStaffBookingService({ execute, executeWithOutputs: execute });
  assert.deepEqual(
    await service.create(2, 'QUAN_LY_RAP', { customerId: 5, showtimeId: 1, seatIds: [1, 2] }),
    { orderId: 9 },
  );
  const create = calls[0];
  assert.equal(create.input.ActorID.value, 2);
  assert.equal(create.input.CustomerID.value, 5);
  assert.equal(create.input.PortalRole.value, 'QUAN_LY_RAP');
  assert.equal(create.input.DanhSachGheId.value, '1,2');
  assert.equal(PROCEDURES[create.key], 'dbo.sp_StaffBooking_Create');
  const order = await service.updateSeats(1, 'ADMIN', 9, { seatIds: [2], expectedTicketIds: [7] });
  assert.equal(calls[1].input.ExpectedVeIdList.value, '7');
  assert.equal(order.canEdit, true);
  assert.equal(order.canCancel, false);
  assert.equal(order.tickets[0].status, 'Đã hủy');
  assert.equal(order.payments[0].status, 'Thất bại');
  await service.list(2, 'QUAN_LY_RAP', validate.listFilters({ cinemaId: '1', search: 'abc' }));
  await service.customers(2, 'QUAN_LY_RAP', 'ab');
  await service.options(
    2,
    'QUAN_LY_RAP',
    validate.bookingOptions({ showtimeId: '1', orderId: '9' }),
  );
  await service.detail(1, 'ADMIN', 9);
  await service.cancel(1, 'ADMIN', 9);
  assert.equal(calls.length, 7);
  assert.ok(calls.every((call) => call.input.ActorID.type && call.input.PortalRole.type));
});

test('staff SQL errors preserve denial, validation and conflict without raw SQL details', () => {
  for (const [number, status, code] of [
    [50303, 403, 'CINEMA_SCOPE_DENIED'],
    [50510, 400, 'CUSTOMER_UNAVAILABLE'],
    [50511, 400, 'INVALID_REQUEST'],
    [50512, 409, 'ORDER_READ_ONLY'],
    [50513, 409, 'HOLD_EXPIRED'],
    [50514, 409, 'PAYMENT_HISTORY_PROTECTED'],
    [50515, 409, 'ORDER_CHANGED'],
    [50025, 409, 'SEAT_CONFLICT'],
    [50021, 404, 'SHOWTIME_NOT_FOUND'],
  ])
    assert.throws(
      () => mapStaffBookingError({ number, message: 'secret SQL details' }),
      (e) => e.status === status && e.code === code && !e.message.includes('secret'),
    );
});

test('staff HTTP router ignores untrusted actor/role and exposes no physical delete', async () => {
  const received = [];
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.user = { userId: 2 };
    next();
  });
  app.use(
    '/bookings',
    createStaffBookingRouter('QUAN_LY_RAP', {
      create: async (...args) => {
        received.push(args);
        return { orderId: 8 };
      },
    }),
  );
  app.use((error, req, res, _next) => {
    res.status(error.status ?? 500).json({ code: error.code });
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/bookings`;
    const response = await fetch(base, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ customerId: 5, showtimeId: 1, seatIds: [1] }),
    });
    assert.equal(response.status, 201);
    assert.deepEqual(received[0].slice(0, 2), [2, 'QUAN_LY_RAP']);
    assert.equal((await fetch(`${base}/8`, { method: 'DELETE' })).status, 405);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

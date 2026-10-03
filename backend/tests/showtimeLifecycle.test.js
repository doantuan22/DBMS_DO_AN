import test from 'node:test';
import assert from 'node:assert/strict';
import { createManagerService } from '../src/services/managerService.js';
import { mapAdminProcedureError } from '../src/services/adminService.js';
import { showtimeWrite } from '../src/validators/adminValidator.js';
import { showtimeUpdate } from '../src/validators/managerValidator.js';
import { createOrderService } from '../src/services/orderService.js';

const conflictCodes = [50119, 50120, 50123, 50207];

test('new lifecycle SQL errors map to 409 in admin and manager services', async () => {
  for (const number of conflictCodes) {
    assert.throws(() => mapAdminProcedureError({ number }), (error) => error.status === 409);
    const manager = createManagerService({ execute: async () => { throw { number }; } });
    await assert.rejects(manager.updateSeat(1, 2, { type: 'VIP', status: 'Bảo trì' }), (error) => error.status === 409);
  }
});

test('both showtime validators force cancellation through the cancel route', () => {
  const body = { movieId: 1, startsAt: '2030-01-01T10:00:00Z', endsAt: '2030-01-01T12:00:00Z', format: '2D', basePrice: 100000, status: 'Đã hủy' };
  assert.throws(() => showtimeWrite(body), (error) => error.status === 400 && error.code === 'SHOWTIME_CANCEL_ROUTE_REQUIRED');
  assert.throws(() => showtimeUpdate(body), (error) => error.status === 400 && error.code === 'SHOWTIME_CANCEL_ROUTE_REQUIRED');
});

test('expired or invalid-showtime payment conflicts map to 409 for customers', async () => {
  const service = createOrderService({
    execute: async () => ({ recordsets: [[{ DonDatVeID: 9, NguoiDungID: 5 }], [], [], []] }),
    executeWithOutputs: async () => { throw { number: 50121 }; },
  });
  await assert.rejects(service.createPaymentAttempt(5, 9, { paymentMethod: 'MOMO' }), { status: 409, code: 'SHOWTIME_UNAVAILABLE_FOR_PAYMENT' });
});

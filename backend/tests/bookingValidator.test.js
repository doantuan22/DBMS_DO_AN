import assert from 'node:assert/strict';
import test from 'node:test';
import { validateBooking, validatePromotion } from '../src/validators/bookingValidator.js';

test('booking accepts only identity-free IDs, quantities, and an optional promotion code', () => {
  assert.deepEqual(validateBooking({ showtimeId: 9, seatIds: [10, 11], products: [{ productId: 2, quantity: 1 }], promotionCode: ' SAVE10 ' }), {
    showtimeId: 9, seatIds: [10, 11], products: [{ productId: 2, quantity: 1 }], promotionCode: 'SAVE10',
  });
  assert.throws(() => validateBooking({ showtimeId: 9, seatIds: [10, 10] }), { code: 'DUPLICATE_SEAT' });
  assert.throws(() => validateBooking({ showtimeId: 9, seatIds: [], products: [] }), { code: 'INVALID_REQUEST' });
  assert.throws(() => validateBooking({ showtimeId: 9, seatIds: [10], total: 100000 }), { code: 'UNKNOWN_REQUEST_FIELD' });
  assert.throws(() => validateBooking({ showtimeId: 9, seatIds: [10], products: [{ productId: 2, quantity: 0 }] }), { code: 'INVALID_REQUEST' });
});

test('promotion preview needs the same DB-identifiable booking inputs and a code', () => {
  assert.deepEqual(validatePromotion({ showtimeId: 9, seatIds: [10], products: [], promotionCode: 'SAVE10' }), {
    showtimeId: 9, seatIds: [10], products: [], promotionCode: 'SAVE10',
  });
  assert.throws(() => validatePromotion({ showtimeId: 9, seatIds: [10], products: [] }), { code: 'INVALID_REQUEST' });
});

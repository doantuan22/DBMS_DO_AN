import assert from 'node:assert/strict';
import test from 'node:test';
import { validateBooking, validatePromotion } from '../src/validators/bookingValidator.js';

test('booking accepts only identity-free IDs, quantities, and an optional promotion code', () => {
  assert.deepEqual(
    validateBooking({
      showtimeId: 9,
      seatIds: [10, 11],
      products: [{ productId: 2, quantity: 1 }],
      promotionCode: ' SAVE10 ',
    }),
    {
      showtimeId: 9,
      seatIds: [10, 11],
      products: [{ productId: 2, quantity: 1 }],
      promotionCode: 'SAVE10',
    },
  );
  assert.throws(() => validateBooking({ showtimeId: 9, seatIds: [10, 10] }), {
    code: 'DUPLICATE_SEAT',
  });
  assert.throws(() => validateBooking({ showtimeId: 9, seatIds: [], products: [] }), {
    code: 'INVALID_REQUEST',
  });
  assert.throws(() => validateBooking({ showtimeId: 9, seatIds: [10], total: 100000 }), {
    code: 'UNKNOWN_REQUEST_FIELD',
  });
  assert.throws(
    () =>
      validateBooking({ showtimeId: 9, seatIds: [10], products: [{ productId: 2, quantity: 0 }] }),
    { code: 'INVALID_REQUEST' },
  );
});

test('promotion preview needs the same DB-identifiable booking inputs and a code', () => {
  assert.deepEqual(
    validatePromotion({ showtimeId: 9, seatIds: [10], products: [], promotionCode: 'SAVE10' }),
    {
      showtimeId: 9,
      seatIds: [10],
      products: [],
      promotionCode: 'SAVE10',
    },
  );
  assert.throws(() => validatePromotion({ showtimeId: 9, seatIds: [10], products: [] }), {
    code: 'INVALID_REQUEST',
  });
});

test('booking limits: at most 10 seats and 10 units per product line, IDs bounded to SQL INT', () => {
  const seats = (n) => Array.from({ length: n }, (_, i) => i + 1);
  assert.equal(
    validateBooking({ showtimeId: 9, seatIds: seats(10), products: [] }).seatIds.length,
    10,
  );
  assert.throws(() => validateBooking({ showtimeId: 9, seatIds: seats(11), products: [] }), {
    status: 400,
    code: 'SEAT_LIMIT_EXCEEDED',
  });
  assert.equal(
    validateBooking({ showtimeId: 9, seatIds: [1], products: [{ productId: 2, quantity: 10 }] })
      .products[0].quantity,
    10,
  );
  assert.throws(
    () =>
      validateBooking({ showtimeId: 9, seatIds: [1], products: [{ productId: 2, quantity: 11 }] }),
    { status: 400, code: 'PRODUCT_QUANTITY_LIMIT_EXCEEDED' },
  );
  for (const quantity of [2147483647, 2147483648, 1e9, -1, 0, 1.5, '3']) {
    assert.throws(
      () =>
        validateBooking({ showtimeId: 9, seatIds: [1], products: [{ productId: 2, quantity }] }),
      { status: 400 },
    );
  }
  // the same product split over two lines is rejected (the stored procedure additionally sums such lines before checking the cap)
  assert.throws(
    () =>
      validateBooking({
        showtimeId: 9,
        seatIds: [1],
        products: [
          { productId: 2, quantity: 6 },
          { productId: 2, quantity: 6 },
        ],
      }),
    { status: 400, code: 'DUPLICATE_PRODUCT' },
  );
  assert.throws(() => validateBooking({ showtimeId: 2147483648, seatIds: [1], products: [] }), {
    status: 400,
    code: 'INVALID_REQUEST',
  });
  assert.throws(() => validateBooking({ showtimeId: 9, seatIds: [2147483648], products: [] }), {
    status: 400,
    code: 'INVALID_REQUEST',
  });
  assert.throws(() => validateBooking({ showtimeId: 9, seatIds: [1, 1], products: [] }), {
    status: 400,
    code: 'DUPLICATE_SEAT',
  });
});

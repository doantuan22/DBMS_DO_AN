import assert from 'node:assert/strict';
import test from 'node:test';
import { orderId, paymentAttempt, paymentResult } from '../src/validators/orderValidator.js';

test('payment validators accept only the exact database method and result states', () => {
  assert.equal(orderId('4'), 4);
  assert.deepEqual(paymentAttempt({ paymentMethod: 'MOMO' }), { paymentMethod: 'MOMO' });
  assert.deepEqual(paymentResult({ status: 'Thất bại' }), { status: 'Thất bại' });
  assert.throws(() => paymentAttempt({ paymentMethod: 'CARD', amount: 1 }), {
    code: 'UNKNOWN_REQUEST_FIELD',
  });
  assert.throws(() => paymentResult({ status: 'SUCCESS' }), { code: 'INVALID_PAYMENT_RESULT' });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  complaintId,
  complaintInput,
  movieId,
  reviewInput,
} from '../src/validators/feedbackValidator.js';

test('review validation matches the SQL rating, nullable content and movie-id contract', () => {
  assert.equal(movieId('4'), 4);
  assert.deepEqual(reviewInput({ rating: 5, content: null }), { rating: 5, content: null });
  assert.throws(() => movieId('0'), { code: 'INVALID_REQUEST' });
  assert.throws(() => reviewInput({ rating: 6 }), { code: 'INVALID_RATING' });
  assert.throws(() => reviewInput({ rating: 4, content: 'x'.repeat(1001) }), {
    code: 'INVALID_REQUEST',
  });
  assert.throws(() => reviewInput({ rating: 4, userId: 9 }), { code: 'UNKNOWN_REQUEST_FIELD' });
});

test('complaint accepts optional orderId and rejects authority fields', () => {
  assert.equal(complaintId('7'), 7);
  assert.deepEqual(complaintInput({ type: 'Payment', title: 'Missing', content: 'Please help' }), {
    type: 'Payment',
    title: 'Missing',
    content: 'Please help',
    orderId: null,
  });
  assert.equal(
    complaintInput({ type: 'Payment', title: 'Missing', content: 'Please help', orderId: '12' })
      .orderId,
    12,
  );
  assert.throws(() => complaintInput({ type: 'T', title: 'S', content: 'C', senderId: 2 }), {
    code: 'UNKNOWN_REQUEST_FIELD',
  });
  assert.throws(() => complaintInput({ type: 'T', title: '', content: 'C' }), {
    code: 'INVALID_REQUEST',
  });
});

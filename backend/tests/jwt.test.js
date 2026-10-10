import assert from 'node:assert/strict';
import test from 'node:test';
import { createJwtService } from '../src/utils/jwt.js';

const secret = 'test-key-that-is-at-least-32-bytes-long!';

test('issues a signed identity token with expiry and verifies it', () => {
  let now = 1_800_000_000_000;
  const jwt = createJwtService({ secret, expiresIn: '15m', now: () => now });
  const issued = jwt.issue(42);
  assert.equal(issued.expiresIn, '15m');
  assert.deepEqual(jwt.verify(issued.token), { userId: 42 });
  now += 15 * 60 * 1000;
  assert.throws(() => jwt.verify(issued.token), { code: 'UNAUTHENTICATED', status: 401 });
});

test('rejects tampered tokens and refuses weak/missing secrets', () => {
  const jwt = createJwtService({ secret });
  const { token } = jwt.issue(1);
  const [header, payload, signature] = token.split('.');
  const tamperedSignature = `${signature[0] === 'a' ? 'b' : 'a'}${signature.slice(1)}`;
  assert.throws(() => jwt.verify(`${header}.${payload}.${tamperedSignature}`), {
    code: 'UNAUTHENTICATED',
  });
  assert.throws(() => createJwtService({ secret: '' }).issue(1), {
    code: 'AUTH_NOT_CONFIGURED',
    status: 503,
  });
});

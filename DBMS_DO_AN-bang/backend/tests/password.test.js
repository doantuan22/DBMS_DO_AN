import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

test('hashes are salted bcrypt hashes and verify correctly', async () => {
  const a = await hashPassword('123456');
  const b = await hashPassword('123456');
  assert.notEqual(a, b);
  assert.match(a, /^\$2[aby]\$10\$/);
  assert.equal(await verifyPassword('123456', a), true);
  assert.equal(await verifyPassword('wrong', a), false);
});

test('demo seed hash matches the documented demo password', async () => {
  const seed = '$2b$10$8tgi4pX7cNyczr/vOe6iy.ZXU6zs3NgNeu/myqJoRLM1oDpz8Jk/S';
  assert.equal(await verifyPassword('123456', seed), true);
});

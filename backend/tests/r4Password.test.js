import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword, validatePassword } from '../src/utils/password.js';
import { userCreate, roleWrite } from '../src/validators/adminValidator.js';
import { validateRegister, validateLogin } from '../src/validators/authValidator.js';
const invalid = (err) => err.status === 400;
test('all new account entry points enforce UTF-8 byte boundaries and preserve password whitespace', async () => {
  for (const password of [
    'a'.repeat(71),
    'a'.repeat(72),
    'é'.repeat(36),
    '🙂'.repeat(18),
    ' abcdefg ',
  ]) {
    assert.equal(
      userCreate({ name: 'R4', email: 'r4@example.test', roleId: 1, password }).password,
      password,
    );
    assert.equal(
      validateRegister({ HoTen: 'R4', Email: 'r4@example.test', MatKhau: password }).MatKhau,
      password,
    );
    const hash = await hashPassword(password);
    assert.equal(await verifyPassword(password, hash), true);
  }
  for (const password of ['a'.repeat(73), 'é'.repeat(36) + 'a', '🙂'.repeat(18) + 'a']) {
    assert.throws(() => validatePassword(password), invalid);
    assert.throws(
      () => userCreate({ name: 'R4', email: 'r4@example.test', roleId: 1, password }),
      invalid,
    );
    assert.throws(
      () => validateRegister({ HoTen: 'R4', Email: 'r4@example.test', MatKhau: password }),
      invalid,
    );
    assert.throws(() => validateLogin({ Email: 'r4@example.test', MatKhau: password }), invalid);
    assert.throws(() => hashPassword(password), invalid);
    assert.throws(() => verifyPassword(password, 'unused'), invalid);
  }
});
test('role metadata rejects blank/oversized names without accepting grant fields', () => {
  for (const name of ['', ' ', 'a'.repeat(101)]) assert.throws(() => roleWrite({ name }), invalid);
  assert.throws(() => roleWrite({ name: 'R4', permissionIds: [] }), invalid);
});

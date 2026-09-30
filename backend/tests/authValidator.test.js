import assert from 'node:assert/strict';
import test from 'node:test';
import { validateLogin, validateProfile, validateRegister } from '../src/validators/authValidator.js';

const registration = {
  HoTen: '  Nguyen An  ', Email: ' AN@example.com ', MatKhau: 'password-123',
  SoDienThoai: '', NgaySinh: '2000-02-29', GioiTinh: 'Khác',
};

test('normalizes customer registration fields and only permits the customer profile', () => {
  assert.deepEqual(validateRegister(registration), {
    HoTen: 'Nguyen An', Email: 'an@example.com', MatKhau: 'password-123',
    SoDienThoai: null, NgaySinh: '2000-02-29', GioiTinh: 'Khác',
  });
  assert.throws(() => validateRegister({ ...registration, role: 'ADMIN' }), { code: 'ACCESS_FIELDS_NOT_ALLOWED' });
  assert.throws(() => validateRegister({ ...registration, NguoiDungID: 1 }), { code: 'ACCESS_FIELDS_NOT_ALLOWED' });
});

test('validates login and prevents profile updates to immutable fields', () => {
  assert.deepEqual(validateLogin({ Email: 'ADMIN@EXAMPLE.COM', MatKhau: '123456' }), {
    Email: 'admin@example.com', MatKhau: '123456',
  });
  assert.throws(() => validateProfile({ HoTen: 'A', TrangThai: 'Hoạt động' }), { code: 'ACCESS_FIELDS_NOT_ALLOWED' });
  assert.throws(() => validateProfile({ HoTen: 'A', VaiTroID: 1 }), { code: 'ACCESS_FIELDS_NOT_ALLOWED' });
  assert.throws(() => validateRegister({ ...registration, NgaySinh: '2025-02-30' }), { code: 'INVALID_REQUEST' });
});

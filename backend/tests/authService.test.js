import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthService } from '../src/services/authService.js';

const userRow = (role = 'KHACH_HANG', status = 'Hoạt động') => ({
  NguoiDungID: 17,
  HoTen: 'Demo User',
  Email: 'demo@example.com',
  SoDienThoai: null,
  MatKhauHash: 'bcrypt-hash',
  TrangThai: status,
  MaVaiTro: role,
  TenVaiTro: role,
});

test('register hashes the password and calls the registration SP with output id', async () => {
  let call;
  let passwordHashed;
  const service = createAuthService({
    hash: async (password) => {
      passwordHashed = password;
      return 'bcrypt-hash';
    },
    executeWithOutputs: async (...args) => {
      call = args;
      return { recordset: [userRow()] };
    },
  });
  const user = await service.registerCustomer({
    HoTen: 'Demo User',
    Email: 'demo@example.com',
    MatKhau: 'long-password',
    SoDienThoai: null,
    NgaySinh: null,
    GioiTinh: null,
  });
  assert.equal(call[0], 'AUTH_REGISTER_CUSTOMER');
  assert.equal(passwordHashed, 'long-password');
  assert.equal(call[1].MatKhauHash.value, 'bcrypt-hash');
  assert.equal(call[1].MatKhauHash.value.includes('long-password'), false);
  assert.deepEqual(call[2], {
    NewUserId: (await import('../src/db/procedureClient.js')).DbTypes.Int,
  });
  assert.equal(user.role, 'KHACH_HANG');
  assert.equal('MatKhauHash' in user, false);
});

test('maps SQL duplicate errors to conflict responses without exposing SQL messages', async () => {
  const service = createAuthService({
    hash: async () => 'hash',
    executeWithOutputs: async () => {
      throw Object.assign(new Error('unique index UQ_NGUOIDUNG_Email'), { number: 50010 });
    },
  });
  await assert.rejects(service.registerCustomer({ MatKhau: 'x' }), {
    status: 409,
    code: 'EMAIL_IN_USE',
  });
});

test('login verifies the hash, uses SP permissions, and supports the four seeded roles', async (t) => {
  for (const role of ['KHACH_HANG', 'QUAN_LY_RAP', 'CSKH', 'ADMIN']) {
    await t.test(role, async () => {
      let verifiedHash;
      const service = createAuthService({
        execute: async (key) => {
          assert.equal(key, 'AUTH_LOGIN');
          return {
            recordsets: [
              [userRow(role)],
              [{ MaQuyen: 'VIEW_TEST', TenQuyen: 'View test' }],
              [{ RapID: 2, TenRap: 'Cinema', ThanhPho: 'HCMC' }],
            ],
          };
        },
        verify: async (_password, hash) => {
          verifiedHash = hash;
          return true;
        },
        createToken: (id) => ({ token: `token-${id}`, expiresIn: '1h' }),
      });
      const result = await service.login({ Email: 'demo@example.com', MatKhau: 'plain' });
      assert.equal(result.user.role, role);
      assert.deepEqual(
        result.user.permissions.map((permission) => permission.code),
        ['VIEW_TEST'],
      );
      assert.equal(result.user.cinemaAssignments.length, role === 'QUAN_LY_RAP' ? 1 : 0);
      assert.equal(verifiedHash, 'bcrypt-hash');
      assert.equal(JSON.stringify(result).includes('bcrypt-hash'), false);
    });
  }
});

test('login returns one generic unauthorized error for missing, locked, or incorrect credentials', async (t) => {
  for (const row of [undefined, userRow('KHACH_HANG', 'Bị khóa')]) {
    await t.test(row ? 'locked account' : 'unknown email', async () => {
      const service = createAuthService({
        execute: async () => ({ recordsets: [row ? [row] : [], [], []] }),
        verify: async () => false,
      });
      await assert.rejects(service.login({ Email: 'x@example.com', MatKhau: 'x' }), {
        status: 401,
        code: 'INVALID_CREDENTIALS',
      });
    });
  }
  const service = createAuthService({
    execute: async () => ({ recordsets: [[userRow()], [], []] }),
    verify: async () => false,
  });
  await assert.rejects(service.login({ Email: 'x@example.com', MatKhau: 'wrong' }), {
    status: 401,
    code: 'INVALID_CREDENTIALS',
  });
});

test('current user reloads permissions and profile updates call only the existing SP', async () => {
  const calls = [];
  const service = createAuthService({
    execute: async (key) => {
      calls.push(key);
      if (key === 'USER_GET_CURRENT') return { recordset: [userRow()] };
      if (key === 'RBAC_GET_PERMISSIONS_BY_USER')
        return { recordset: [{ MaQuyen: 'DAT_VE', TenQuyen: 'Booking' }] };
      if (key === 'USER_UPDATE_PROFILE') return { recordset: [userRow()] };
      throw new Error(`Unexpected procedure key: ${key}`);
    },
  });
  const current = await service.getCurrentUser(17);
  assert.deepEqual(
    current.permissions.map((permission) => permission.code),
    ['DAT_VE'],
  );
  const updated = await service.updateProfile(17, {
    HoTen: 'Updated',
    SoDienThoai: null,
    NgaySinh: null,
    GioiTinh: null,
  });
  assert.equal(updated.userId, 17);
  assert.ok(calls.includes('USER_UPDATE_PROFILE'));
  assert.equal(
    calls.some((key) => key.toLowerCase().includes('query')),
    false,
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createManagerService } from '../src/services/managerService.js';
import { createAdminService } from '../src/services/adminService.js';

test('room delete binds only authenticated identity and resource and forwards SQL outcomes', async () => {
  for (const historical of [false, true]) {
    const row = { PhongID: 12, Deleted: !historical, Deactivated: historical, TrangThai: historical ? 'Ngưng hoạt động' : null, Message: historical ? 'Retained history' : 'Removed' };
    const calls = [];
    const execute = async (key, params) => { calls.push({ key, params }); return { recordset: [row] }; };
    assert.deepEqual(await createManagerService({ execute }).deleteRoom(7, 12), { deleted: row.Deleted, deactivated: row.Deactivated, roomId: 12, status: row.TrangThai, message: row.Message });
    assert.deepEqual(await createAdminService({ execute }).deleteRoom(3, 12), row);
    for (const [i, identity] of ['NguoiDungID', 'ActorID'].entries()) {
      assert.deepEqual(Object.keys(calls[i].params).sort(), [identity, 'PhongID'].sort());
      assert.equal(calls[i].params[identity].value, i ? 3 : 7);
      assert.equal(calls[i].params.PhongID.value, 12);
    }
  }
});

test('room delete maps missing, scope and conflicts without leaking SQL details', async () => {
  for (const [number, status, code] of [[50052, 404, 'ROOM_NOT_FOUND'], [50050, 403, 'MANAGER_CINEMA_FORBIDDEN'], [50217, 409, 'ROOM_DELETE_CONFLICT']]) {
    const service = createManagerService({ execute: async () => { throw { originalError: { info: { number, message: 'PRIVATE SQL DETAILS' } } }; } });
    await assert.rejects(service.deleteRoom(7, 12), error => error.status === status && error.code === code && !error.message.includes('PRIVATE'));
  }
  const unknown = Object.assign(new Error('PRIVATE SQL DETAILS'), { number: 59801 });
  for (const create of [createManagerService, createAdminService]) {
    await assert.rejects(create({ execute: async () => { throw unknown; } }).deleteRoom(7, 12), error => error === unknown);
  }
});

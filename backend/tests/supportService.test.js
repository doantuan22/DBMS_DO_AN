import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupportService } from '../src/services/supportService.js';
import { listFilters, processing, statusUpdate } from '../src/validators/supportValidator.js';

const sqlError = (number) => Object.assign(new Error('SQL'), { number });

test('support service passes the authenticated support identity and maps the queue contract', async () => {
  const calls = [];
  const service = createSupportService({ execute: async (key, params) => {
    calls.push({ key, params });
    return { recordset: [{ KhieuNaiID: 7, NguoiGuiID: 6, HoTenNguoiGui: 'Customer', TieuDe: 'Need help', TrangThaiKhieuNai: 'Mới' }] };
  } });
  const result = await service.list(4, { status: null, type: null, search: null, priority: 'Cao' });
  assert.equal(calls[0].key, 'SUPPORT_COMPLAINT_LIST');
  assert.equal(calls[0].params.NguoiDungID.value, 4);
  assert.equal(calls[0].params.MucDoUuTien.value, 'Cao');
  assert.equal(calls[0].params.MucDoUuTien.type.length, 50);
  assert.deepEqual(result[0], { id: 7, senderId: 6, senderName: 'Customer', orderId: undefined, type: undefined, title: 'Need help', content: undefined, priority: undefined, status: 'Mới', createdAt: undefined, processingCount: undefined, lastProcessedAt: undefined, lastProcessorName: undefined, lastProcessingContent: undefined });
});

test('support service exposes only safe authorization and not-found errors', async () => {
  await assert.rejects(createSupportService({ execute: async () => { throw sqlError(50405); } }).list(4, { priority: 'Urgent' }), { status: 400, code: 'INVALID_PRIORITY' });
  await assert.rejects(createSupportService({ execute: async () => { throw sqlError(50060); } }).detail(4, 9), { status: 403, code: 'SUPPORT_FORBIDDEN' });
  await assert.rejects(createSupportService({ execute: async () => { throw sqlError(50061); } }).detail(4, 9), { status: 404, code: 'COMPLAINT_NOT_FOUND' });
});

test('support validators use the database status contract and exclude authority fields', () => {
  assert.deepEqual(listFilters({ status: 'Mới', search: 'wifi' }), { status: 'Mới', priority: null, type: null, search: 'wifi' });
  assert.deepEqual(processing({ content: 'Called customer', nextStatus: 'Đang xử lý' }), { content: 'Called customer', nextStatus: 'Đang xử lý' });
  assert.deepEqual(statusUpdate({ status: 'Đã đóng' }), { status: 'Đã đóng' });
  assert.deepEqual(listFilters({ priority: 'Cao' }), { status: null, priority: 'Cao', type: null, search: null });
  assert.throws(() => listFilters({ priority: 'Urgent' }), { code: 'INVALID_PRIORITY' });
  assert.throws(() => listFilters({ actorId: 1 }), { code: 'UNKNOWN_QUERY_PARAMETER' });
  assert.throws(() => processing({ content: 'x', nextStatus: 'Mới' }), { code: 'INVALID_REQUEST' });
  assert.throws(() => processing({ content: 'x', nextStatus: 'Mới', processorId: 1 }), { code: 'UNKNOWN_REQUEST_FIELD' });
});

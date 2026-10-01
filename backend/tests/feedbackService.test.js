import assert from 'node:assert/strict';
import test from 'node:test';
import { createFeedbackService } from '../src/services/feedbackService.js';

const sqlError = (number) => Object.assign(new Error('SQL'), { number });

test('reviews use the authenticated user parameter and map only procedure fields', async () => {
  const calls = [];
  const service = createFeedbackService({ execute: async (key, params) => { calls.push({ key, params }); return { recordset: [{ DanhGiaID: 9, PhimID: 3, NguoiDungID: 5, SoSao: 4, NoiDung: 'Good', NgayDanhGia: 'now' }] }; } });
  const review = await service.createReview(5, 3, { rating: 4, content: 'Good' });
  assert.equal(calls[0].key, 'REVIEW_CREATE');
  assert.equal(calls[0].params.NguoiDungID.value, 5);
  assert.deepEqual(review, { id: 9, movieId: 3, rating: 4, content: 'Good', createdAt: 'now' });
});

test('review business errors are mapped from database trigger and procedure errors', async () => {
  await assert.rejects(createFeedbackService({ execute: async () => { throw sqlError(50004); } }).createReview(5, 3, { rating: 4, content: null }), { status: 403, code: 'REVIEW_NOT_ELIGIBLE' });
  await assert.rejects(createFeedbackService({ execute: async () => { throw sqlError(50040); } }).createReview(5, 3, { rating: 4, content: null }), { status: 409, code: 'REVIEW_ALREADY_EXISTS' });
});

test('complaint create preserves null optional order and detail receives authenticated user', async () => {
  const calls = [];
  const service = createFeedbackService({ execute: async (key, params) => { calls.push({ key, params }); if (key === 'COMPLAINT_GET_BY_CUSTOMER') return { recordsets: [[{ KhieuNaiID: 6, DonDatVeID: null, LoaiKhieuNai: 'Other', TieuDe: 'Help', NoiDung: 'Text', MucDoUuTien: 'Trung bình', NgayTao: 'now', TrangThai: 'Mới' }], []] }; return { recordset: [{ KhieuNaiID: 6, DonDatVeID: null, LoaiKhieuNai: 'Other', TieuDe: 'Help', NoiDung: 'Text', MucDoUuTien: 'Trung bình', NgayTao: 'now', TrangThai: 'Mới' }] }; } });
  const complaint = await service.createComplaint(5, { type: 'Other', title: 'Help', content: 'Text', orderId: null });
  assert.equal(calls[0].params.NguoiDungID.value, 5);
  assert.equal(calls[0].params.DonDatVeID.value, null);
  assert.equal(complaint.orderId, null);
  await service.getComplaint(5, 6);
  assert.equal(calls[1].key, 'COMPLAINT_GET_BY_CUSTOMER');
  assert.equal(calls[1].params.NguoiDungID.value, 5);
});

test('complaint missing-or-foreign detail and invalid order reference map without leaking database errors', async () => {
  await assert.rejects(createFeedbackService({ execute: async () => { throw sqlError(50042); } }).getComplaint(2, 6), { status: 404, code: 'COMPLAINT_NOT_FOUND' });
  await assert.rejects(createFeedbackService({ execute: async () => { throw sqlError(50041); } }).createComplaint(2, { type: 'T', title: 'S', content: 'C', orderId: 99 }), { status: 404, code: 'ORDER_REFERENCE_INVALID' });
});

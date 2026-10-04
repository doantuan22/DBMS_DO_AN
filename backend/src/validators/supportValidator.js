import { HttpError } from '../utils/httpError.js';
import { sqlId } from '../utils/inputContract.js';

const COMPLAINT_STATUSES = new Set(['Mới', 'Đang xử lý', 'Đã giải quyết', 'Đã đóng', 'Từ chối']);
// CK_XULY_KHIEUNAI_TrangThaiSauXuLy deliberately excludes the initial state.
const PROCESSING_STATUSES = new Set(['Đang xử lý', 'Đã giải quyết', 'Đã đóng', 'Từ chối']);

function positiveId(value) {
  return sqlId(value, 'complaintId');
}

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be non-empty text.`);
  }
  return value.trim();
}

function assertOnlyFields(value, fields, errorCode) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).some((key) => !fields.includes(key))) {
    throw new HttpError(400, errorCode, 'Request contains unsupported fields.');
  }
}

function optionalText(value, field, maxLength) {
  if (value === undefined || value === '') return null;
  const text = requiredText(value, field);
  if (text.length > maxLength) throw new HttpError(400, 'INVALID_REQUEST', `${field} is too long.`);
  return text;
}

export const complaintId = positiveId;

export function listFilters(query = {}) {
  assertOnlyFields(query, ['status', 'type', 'search'], 'UNKNOWN_QUERY_PARAMETER');
  const status = optionalText(query.status, 'status', 50);
  if (status && !COMPLAINT_STATUSES.has(status)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'status is not supported.');
  }
  return {
    status,
    type: optionalText(query.type, 'type', 100),
    search: optionalText(query.search, 'search', 100),
  };
}

export function processing(value) {
  assertOnlyFields(value, ['content', 'nextStatus'], 'UNKNOWN_REQUEST_FIELD');
  const nextStatus = requiredText(value.nextStatus, 'nextStatus');
  if (!PROCESSING_STATUSES.has(nextStatus)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'nextStatus is not supported.');
  }
  return { content: requiredText(value.content, 'content'), nextStatus };
}

export function statusUpdate(value) {
  assertOnlyFields(value, ['status'], 'UNKNOWN_REQUEST_FIELD');
  const status = requiredText(value.status, 'status');
  if (!PROCESSING_STATUSES.has(status)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'status is not supported.');
  }
  return { status };
}

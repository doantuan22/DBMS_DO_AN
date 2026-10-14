import { HttpError } from '../utils/httpError.js';
import { sqlId } from '../utils/inputContract.js';

const COMPLAINT_STATUSES = new Set(['Mới', 'Đang xử lý', 'Đã giải quyết', 'Đã đóng', 'Từ chối']);
const COMPLAINT_PRIORITIES = new Set(['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp']);
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
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !fields.includes(key))
  ) {
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
  assertOnlyFields(query, ['status', 'type', 'search', 'priority'], 'UNKNOWN_QUERY_PARAMETER');
  const status = optionalText(query.status, 'status', 50);
  if (status && !COMPLAINT_STATUSES.has(status)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'status is not supported.');
  }
  const priority = optionalText(query.priority, 'priority', 50);
  if (priority && !COMPLAINT_PRIORITIES.has(priority)) {
    throw new HttpError(400, 'INVALID_PRIORITY', 'priority is not supported.');
  }
  return {
    status,
    priority,
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

export function chatMessage(value) {
  assertOnlyFields(value, ['content'], 'UNKNOWN_REQUEST_FIELD');
  const content = requiredText(value.content, 'content');
  if (content.length > 2000) {
    throw new HttpError(400, 'INVALID_REQUEST', 'content must be at most 2000 characters.');
  }
  return { content };
}

export function internalNote(value) {
  assertOnlyFields(value, ['content'], 'UNKNOWN_REQUEST_FIELD');
  const content = requiredText(value.content, 'content');
  if (content.length > 2000) {
    throw new HttpError(400, 'INVALID_REQUEST', 'content must be at most 2000 characters.');
  }
  return { content };
}

export function escalationCreate(value) {
  assertOnlyFields(value, ['reason', 'priority'], 'UNKNOWN_REQUEST_FIELD');
  const reason = requiredText(value.reason, 'reason');
  if (reason.length > 500) {
    throw new HttpError(400, 'INVALID_REQUEST', 'reason must be at most 500 characters.');
  }
  const priority = value.priority ? requiredText(value.priority, 'priority') : 'Trung bình';
  if (!COMPLAINT_PRIORITIES.has(priority)) {
    throw new HttpError(400, 'INVALID_PRIORITY', 'priority is not supported.');
  }
  return { reason, priority };
}

const ESCALATION_FINAL_STATUSES = new Set(['Đã giải quyết', 'Từ chối']);
export function escalationProcess(value) {
  assertOnlyFields(value, ['conclusion', 'resolution', 'status'], 'UNKNOWN_REQUEST_FIELD');
  const conclusion = requiredText(value.conclusion || value.resolution, 'conclusion');
  if (conclusion.length > 1000) {
    throw new HttpError(400, 'INVALID_REQUEST', 'conclusion must be at most 1000 characters.');
  }
  const status = requiredText(value.status, 'status');
  if (!ESCALATION_FINAL_STATUSES.has(status)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'status must be Đã giải quyết or Từ chối.');
  }
  return { conclusion, status };
}

export function adminAssign(value) {
  assertOnlyFields(value, ['staffId', 'reason'], 'UNKNOWN_REQUEST_FIELD');
  if (!value?.staffId) {
    throw new HttpError(400, 'INVALID_REQUEST', 'staffId is required.');
  }
  const staffId = positiveId(value.staffId);
  const reason = value.reason ? optionalText(value.reason, 'reason', 255) : null;
  return { staffId, reason };
}

const ESCALATION_STATUSES = new Set(['Chờ tiếp nhận', 'Đang xử lý', 'Đã giải quyết', 'Từ chối']);
export function escalationFilters(query = {}) {
  assertOnlyFields(query, ['status', 'priority', 'page', 'limit', 'complaintId'], 'UNKNOWN_QUERY_PARAMETER');
  const status = optionalText(query.status, 'status', 50);
  if (status && !ESCALATION_STATUSES.has(status)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'status is not supported.');
  }
  const priority = optionalText(query.priority, 'priority', 50);
  if (priority && !COMPLAINT_PRIORITIES.has(priority)) {
    throw new HttpError(400, 'INVALID_PRIORITY', 'priority is not supported.');
  }
  const complaintId = query.complaintId ? positiveId(query.complaintId) : null;
  return { status, priority, complaintId };
}

export const escalationId = positiveId;
export const customerUserId = positiveId;


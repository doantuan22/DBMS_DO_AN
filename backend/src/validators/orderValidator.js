import { HttpError } from '../utils/httpError.js';

const SQL_INT_MAX = 2147483647;
const PAYMENT_METHODS = new Set([
  'VNPAY',
  'MOMO',
  'ZALOPAY',
  'THE_NOI_DIA',
  'THE_QUOC_TE',
  'TIEN_MAT',
]);
const PAYMENT_RESULTS = new Set(['Thành công', 'Thất bại']);

function objectOnly(value, allowedKeys) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Request body must be an object.');
  }
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    throw new HttpError(400, 'UNKNOWN_REQUEST_FIELD', 'Request contains unsupported fields.');
  }
  return value;
}

export function orderId(value) {
  if (!/^\d+$/.test(String(value ?? '')))
    throw new HttpError(400, 'INVALID_REQUEST', 'orderId must be a positive integer.');
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0 || id > SQL_INT_MAX)
    throw new HttpError(400, 'INVALID_REQUEST', 'orderId must be a positive integer.');
  return id;
}

export function paymentId(value) {
  if (!/^\d+$/.test(String(value ?? '')))
    throw new HttpError(400, 'INVALID_REQUEST', 'paymentId must be a positive integer.');
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0 || id > SQL_INT_MAX)
    throw new HttpError(400, 'INVALID_REQUEST', 'paymentId must be a positive integer.');
  return id;
}

export function paymentAttempt(value) {
  const body = objectOnly(value, ['paymentMethod']);
  if (typeof body.paymentMethod !== 'string' || !PAYMENT_METHODS.has(body.paymentMethod)) {
    throw new HttpError(
      400,
      'INVALID_PAYMENT_METHOD',
      'paymentMethod is not supported by the database contract.',
    );
  }
  return { paymentMethod: body.paymentMethod };
}

export function paymentResult(value) {
  const body = objectOnly(value, ['status']);
  if (typeof body.status !== 'string' || !PAYMENT_RESULTS.has(body.status)) {
    throw new HttpError(400, 'INVALID_PAYMENT_RESULT', 'status must be Thành công or Thất bại.');
  }
  return { status: body.status };
}

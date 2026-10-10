import { HttpError } from '../utils/httpError.js';
import { sqlId } from '../utils/inputContract.js';

function positiveInteger(value, field) {
  return sqlId(value, field);
}

function objectOnly(value, allowedKeys) {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new HttpError(400, 'INVALID_REQUEST', 'Request body must be an object.');
  if (Object.keys(value).some((key) => !allowedKeys.includes(key)))
    throw new HttpError(400, 'UNKNOWN_REQUEST_FIELD', 'Request contains unsupported fields.');
  return value;
}

function requiredText(value, field, maxLength = null) {
  if (typeof value !== 'string' || !value.trim())
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be non-empty text.`);
  const normalized = value.trim();
  if (maxLength !== null && normalized.length > maxLength)
    throw new HttpError(400, 'INVALID_REQUEST', `${field} is too long.`);
  return normalized;
}

export const movieId = (value) => positiveInteger(value, 'movieId');
export const complaintId = (value) => positiveInteger(value, 'complaintId');

export function reviewInput(value) {
  const body = objectOnly(value, ['rating', 'content']);
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5)
    throw new HttpError(400, 'INVALID_RATING', 'rating must be an integer from 1 to 5.');
  if (body.content !== undefined && body.content !== null && typeof body.content !== 'string')
    throw new HttpError(400, 'INVALID_REQUEST', 'content must be text or null.');
  const content = body.content === undefined || body.content === null ? null : body.content.trim();
  if (content !== null && content.length > 1000)
    throw new HttpError(400, 'INVALID_REQUEST', 'content is too long.');
  return { rating: body.rating, content: content || null };
}

export function complaintInput(value) {
  const body = objectOnly(value, ['type', 'title', 'content', 'orderId']);
  let orderId = null;
  if (body.orderId !== undefined && body.orderId !== null && body.orderId !== '')
    orderId = positiveInteger(body.orderId, 'orderId');
  return {
    type: requiredText(body.type, 'type', 100),
    title: requiredText(body.title, 'title', 200),
    // SQL contract is NVARCHAR(MAX), so no artificial maximum is imposed.
    content: requiredText(body.content, 'content'),
    orderId,
  };
}

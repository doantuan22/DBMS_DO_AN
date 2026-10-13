import { HttpError } from './httpError.js';

export { BUSINESS_TIME_ZONE } from '../../../shared/dateTimeContract.mjs';

export function isDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
  );
}

export function isApiInstant(value) {
  if (typeof value !== 'string') return false;
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  return (
    !!match &&
    isDateOnly(match[1]) &&
    Number(match[2]) < 24 &&
    Number(match[3]) < 60 &&
    Number(match[4]) < 60 &&
    Number.isFinite(Date.parse(value))
  );
}

export function parseApiInstant(value, field = 'timestamp') {
  if (!isApiInstant(value))
    throw new HttpError(
      400,
      'INVALID_REQUEST',
      `${field} must be an ISO datetime with an explicit timezone (Z or offset).`,
    );
  return new Date(value);
}

export function serializeInstant(value) {
  if (value == null) return null;
  const date = value instanceof Date ? value : parseApiInstant(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError('Invalid instant');
  return date.toISOString();
}

// A SQL DATE arrives as a Date carrier with useUTC=true. Read its calendar
// components, never apply a timezone or serialize it as an instant.
export function serializeDateOnly(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) throw new TypeError('Invalid SQL DATE');
    return `${String(value.getUTCFullYear()).padStart(4, '0')}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
  }
  if (!isDateOnly(value)) throw new TypeError('Expected YYYY-MM-DD date-only');
  return value;
}

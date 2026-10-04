import { HttpError } from './httpError.js';
import { isDateOnly, BUSINESS_TIME_ZONE } from './dateTime.js';

export const SQL_INT_MAX = 2147483647;
export function sqlInteger(value, field, minimum = 1) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < minimum || value > SQL_INT_MAX) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be an integer from ${minimum} to ${SQL_INT_MAX}.`);
  }
  return value;
}
// Explicit parsing is limited to route/query IDs (and the existing complaint orderId contract).
export function sqlId(value, field = 'id') {
  if (!['string', 'number'].includes(typeof value) || !/^\d+$/.test(String(value))) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a positive integer.`);
  }
  return sqlInteger(Number(value), field);
}
export function sqlDecimal(value, field, precision = 18, scale = 2) {
  const parts = String(value).toLowerCase().split('e');
  const fractionalDigits = Math.max(0, (parts[0].split('.')[1]?.length ?? 0) - Number(parts[1] ?? 0));
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) >= 10 ** (precision - scale) || fractionalDigits > scale) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must fit SQL DECIMAL(${precision},${scale}) without rounding.`);
  }
  return value;
}
export const currentBusinessDate = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = key => parts.find(item => item.type === key).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};
export function birthDate(value, field = 'birthDate', now = new Date()) {
  if (value == null) return null;
  if (!isDateOnly(value) || value > currentBusinessDate(now)) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a date on or before the current business date.`);
  return value;
}
export function enumInput(value, field, options) {
  if (value !== undefined && !options.includes(value)) throw new HttpError(400, 'INVALID_REQUEST', `${field} is not supported by the database contract.`);
  return value;
}

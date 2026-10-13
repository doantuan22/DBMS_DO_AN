import { Temporal } from '@js-temporal/polyfill';
import { BUSINESS_TIME_ZONE } from '../../../shared/dateTimeContract.mjs';

export { BUSINESS_TIME_ZONE };
export function parseInstant(value) {
  if (value instanceof Date) return Temporal.Instant.fromEpochMilliseconds(value.getTime());
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  )
    throw new RangeError('An instant must include Z or an offset');
  return Temporal.Instant.from(value);
}
export function businessLocalToInstant(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value)
  )
    throw new RangeError('Expected a datetime-local value');
  return Temporal.PlainDateTime.from(value)
    .toZonedDateTime(BUSINESS_TIME_ZONE, { disambiguation: 'reject' })
    .toInstant()
    .toString({ fractionalSecondDigits: 3 });
}
export function instantToBusinessLocal(value) {
  return parseInstant(value)
    .toZonedDateTimeISO(BUSINESS_TIME_ZONE)
    .toPlainDateTime()
    .toString({ smallestUnit: 'millisecond' });
}
export function businessDate(value = new Date()) {
  return parseInstant(value).toZonedDateTimeISO(BUSINESS_TIME_ZONE).toPlainDate().toString();
}
export function defaultShowtimeLocal(days, time, now = new Date()) {
  return `${Temporal.PlainDate.from(businessDate(now)).add({ days }).toString()}T${time}:00`;
}
export function formatDate(value) {
  if (value == null || value === '') return '—';
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new RangeError('Expected date-only YYYY-MM-DD');
  return Temporal.PlainDate.from(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
const display = (value, options) =>
  value == null || value === ''
    ? '—'
    : new Intl.DateTimeFormat('vi-VN', { timeZone: BUSINESS_TIME_ZONE, ...options }).format(
        Number(parseInstant(value).epochMilliseconds),
      );
export const formatDateTime = (value) =>
  display(value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
export const formatTime = (value) =>
  display(value, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export const remainingHoldSeconds = (deadline, now = Date.now()) =>
  Math.max(0, Math.ceil((Number(parseInstant(deadline).epochMilliseconds) - now) / 1000));

// Generic admin cells contain both SQL DATE and UTC timestamp strings.
export function formatApiValue(value) {
  if (value == null) return '—';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDate(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value))
    return formatDateTime(value);
  if (typeof value === 'object')
    return JSON.stringify(value, (_, v) => (typeof v === 'string' ? formatApiValue(v) : v));
  return String(value);
}

import { isDateOnly, isApiInstant } from '../utils/dateTime.js';
import { HttpError } from '../utils/httpError.js';
import { sqlId, sqlInteger, sqlDecimal } from '../utils/inputContract.js';
import { ROOM_TYPES as roomTypes, SEAT_TYPES as seatTypes, DAY_TYPES as dayTypes, RESOURCE_STATUSES } from '../../../shared/resourceContract.mjs';

const ROOM_TYPES = new Set(roomTypes);
const ROOM_STATUSES = new Set(RESOURCE_STATUSES.rooms);
const SEAT_TYPES = new Set(seatTypes);
const SEAT_STATUSES = new Set(RESOURCE_STATUSES.seats);
const SHOWTIME_STATUSES = new Set(RESOURCE_STATUSES.showtimes);
const DAY_TYPES = new Set(dayTypes);
const PRICING_STATUSES = new Set(RESOURCE_STATUSES.pricing);

function objectOnly(value, allowedFields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Request body must be an object.');
  }
  if (Object.keys(value).some((key) => !allowedFields.includes(key))) {
    throw new HttpError(400, 'UNKNOWN_REQUEST_FIELD', 'Request contains unsupported fields.');
  }
  return value;
}

function id(value, field) {
  return sqlId(value, field);
}

function text(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} is invalid.`);
  }
  return value.trim();
}

function enumValue(value, field, supportedValues) {
  if (typeof value !== 'string' || !supportedValues.has(value)) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} is not supported by the database contract.`);
  }
  return value;
}

function nonNegative(value, field) {
  sqlDecimal(value, field);
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value >= 1e16) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a non-negative number.`);
  }
  return value;
}

function validDate(value, field) {
  if (!isDateOnly(value)) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be YYYY-MM-DD.`);
  }
  return value;
}

function validDateTime(value, field) {
  if (!isApiInstant(value)) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be an ISO datetime with Z or an explicit offset.`);
  }
  return value;
}

function showtimeTimes(body) {
  const startsAt = validDateTime(body.startsAt, 'startsAt');
  const endsAt = validDateTime(body.endsAt, 'endsAt');
  if (Date.parse(endsAt) <= Date.parse(startsAt)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'endsAt must be after startsAt.');
  }
  return { startsAt, endsAt };
}

export const cinemaId = (value) => id(value, 'cinemaId');
export const roomId = (value) => id(value, 'roomId');
export const seatId = (value) => id(value, 'seatId');
export const showtimeId = (value) => id(value, 'showtimeId');
export const pricingId = (value) => id(value, 'pricingId');

export function roomCreate(value) {
  const body = objectOnly(value, ['name', 'type']);
  return {
    name: text(body.name, 'name', 100),
    type: body.type === undefined ? '2D' : enumValue(body.type, 'type', ROOM_TYPES),
  };
}

export function roomUpdate(value) {
  const body = objectOnly(value, ['name', 'type', 'status']);
  return {
    name: text(body.name, 'name', 100),
    type: enumValue(body.type, 'type', ROOM_TYPES),
    status: enumValue(body.status, 'status', ROOM_STATUSES),
  };
}

export function seatCreate(value) {
  const body = objectOnly(value, ['row', 'number', 'type']);
  if (typeof body.row !== 'string' || !body.row.trim() || body.row.trim().length > 10
    || !Number.isInteger(body.number) || body.number <= 0 || body.number > 2147483647) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Seat row or number is invalid.');
  }
  return {
    row: body.row.trim(),
    number: body.number,
    type: body.type === undefined ? 'Thường' : enumValue(body.type, 'type', SEAT_TYPES),
  };
}

export function seatUpdate(value) {
  const body = objectOnly(value, ['type', 'status']);
  return {
    type: enumValue(body.type, 'type', SEAT_TYPES),
    status: enumValue(body.status, 'status', SEAT_STATUSES),
  };
}

export function showtimeCreate(value) {
  const body = objectOnly(value, ['movieId', 'roomId', 'startsAt', 'endsAt', 'format', 'basePrice']);
  return {
    movieId: sqlInteger(body.movieId, 'movieId'),
    roomId: sqlInteger(body.roomId, 'roomId'),
    ...showtimeTimes(body),
    format: body.format === undefined ? '2D' : enumValue(body.format, 'format', ROOM_TYPES),
    basePrice: nonNegative(body.basePrice, 'basePrice'),
  };
}

export function showtimeUpdate(value) {
  const body = objectOnly(value, ['movieId', 'startsAt', 'endsAt', 'format', 'basePrice', 'status']);
  return {
    movieId: sqlInteger(body.movieId, 'movieId'),
    ...showtimeTimes(body),
    format: enumValue(body.format, 'format', ROOM_TYPES),
    basePrice: nonNegative(body.basePrice, 'basePrice'),
    status: enumValue(body.status, 'status', SHOWTIME_STATUSES),
  };
}

export function pricingCreate(value) {
  const body = objectOnly(value, ['seatType', 'dayType', 'format', 'surcharge', 'startsOn', 'endsOn']);
  const startsOn = validDate(body.startsOn, 'startsOn');
  const endsOn = body.endsOn === null || body.endsOn === undefined || body.endsOn === ''
    ? null
    : validDate(body.endsOn, 'endsOn');
  if (endsOn && endsOn < startsOn) {
    throw new HttpError(400, 'INVALID_REQUEST', 'endsOn must not precede startsOn.');
  }
  return {
    seatType: enumValue(body.seatType, 'seatType', new Set([...SEAT_TYPES, 'Tất cả'])),
    dayType: enumValue(body.dayType, 'dayType', DAY_TYPES),
    format: enumValue(body.format, 'format', new Set([...ROOM_TYPES, 'Tất cả'])),
    surcharge: nonNegative(body.surcharge, 'surcharge'),
    startsOn,
    endsOn,
  };
}

export function pricingUpdate(value) {
  const body = objectOnly(value, ['surcharge', 'status']);
  return {
    surcharge: nonNegative(body.surcharge, 'surcharge'),
    status: enumValue(body.status, 'status', PRICING_STATUSES),
  };
}

export function dateRange(query = {}) {
  if (!query || typeof query !== 'object' || Array.isArray(query)
    || Object.keys(query).some((key) => !['fromDate', 'toDate'].includes(key))) {
    throw new HttpError(400, 'UNKNOWN_QUERY_PARAMETER', 'Request contains unsupported query parameters.');
  }
  const fromDate = query.fromDate ? validDate(query.fromDate, 'fromDate') : null;
  const toDate = query.toDate ? validDate(query.toDate, 'toDate') : null;
  if (fromDate && toDate && fromDate > toDate) {
    throw new HttpError(400, 'INVALID_REQUEST', 'fromDate must not be after toDate.');
  }
  return { fromDate, toDate };
}

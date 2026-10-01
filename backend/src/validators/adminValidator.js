import { HttpError } from '../utils/httpError.js';

function queryOnly(query, allowed) {
  if (!query || typeof query !== 'object' || Array.isArray(query)
    || Object.keys(query).some((key) => !allowed.includes(key))) {
    throw new HttpError(400, 'UNKNOWN_QUERY_PARAMETER', 'Request contains unsupported query parameters.');
  }
  return query;
}

function optionalId(value, field) {
  if (value == null || value === '') return null;
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a positive integer.`);
  }
  return Number(value);
}

function optionalText(value, field, limit) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.length > limit) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} is invalid.`);
  }
  return value.trim() || null;
}

function optionalDate(value, field) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)
    || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be YYYY-MM-DD.`);
  }
  return value;
}

export function userFilters(query) {
  const input = queryOnly(query, ['roleId', 'status', 'search']);
  return { roleId: optionalId(input.roleId, 'roleId'), status: optionalText(input.status, 'status', 50), search: optionalText(input.search, 'search', 100) };
}

export function assignmentFilters(query) {
  const input = queryOnly(query, ['cinemaId', 'userId']);
  return { cinemaId: optionalId(input.cinemaId, 'cinemaId'), userId: optionalId(input.userId, 'userId') };
}

export function movieFilters(query) {
  const input = queryOnly(query, ['status', 'genreId', 'search']);
  return { status: optionalText(input.status, 'status', 50), genreId: optionalId(input.genreId, 'genreId'), search: optionalText(input.search, 'search', 100) };
}

export function revenueFilters(query) {
  const input = queryOnly(query, ['fromDate', 'toDate', 'cinemaId']);
  const fromDate = optionalDate(input.fromDate, 'fromDate');
  const toDate = optionalDate(input.toDate, 'toDate');
  if (fromDate && toDate && fromDate > toDate) throw new HttpError(400, 'INVALID_REQUEST', 'fromDate must not be after toDate.');
  return { fromDate, toDate, cinemaId: optionalId(input.cinemaId, 'cinemaId') };
}

function bodyShape(value, schema) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'INVALID_REQUEST', 'Request body must be an object.');
  if (Object.keys(value).some((key) => !Object.hasOwn(schema, key))) throw new HttpError(400, 'UNKNOWN_REQUEST_FIELD', 'Request contains unsupported fields.');
  const result = {};
  for (const [field, ruleText] of Object.entries(schema)) {
    const optional = ruleText.endsWith('?');
    const rule = optional ? ruleText.slice(0, -1) : ruleText;
    const item = value[field];
    if ((item === undefined || item === null) && optional && rule !== 'nullable-date') continue;
    if (item === undefined || item === null && rule !== 'nullable-date') throw new HttpError(400, 'INVALID_REQUEST', `${field} is required.`);
    if (item === null && rule === 'nullable-date') { result[field] = null; continue; }
    if (rule === 'id' && (!Number.isSafeInteger(item) || item <= 0)) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a positive integer.`);
    if (rule === 'number' && (typeof item !== 'number' || !Number.isFinite(item))) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be numeric.`);
    if (rule === 'nonnegative' && (typeof item !== 'number' || !Number.isFinite(item) || item < 0)) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be non-negative.`);
    if (rule === 'positive' && (typeof item !== 'number' || !Number.isFinite(item) || item <= 0)) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be positive.`);
    if (rule === 'string' && (typeof item !== 'string' || !item.trim())) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be text.`);
    if (rule === 'email' && (typeof item !== 'string' || !/^\S+@\S+\.\S+$/.test(item))) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a valid email.`);
    if (rule === 'password' && (typeof item !== 'string' || item.length < 8 || item.length > 128)) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be 8 to 128 characters.`);
    if (rule === 'date' && (typeof item !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item) || Number.isNaN(Date.parse(`${item}T00:00:00Z`)))) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be YYYY-MM-DD.`);
    if (rule === 'nullable-date' && item !== null && (typeof item !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item) || Number.isNaN(Date.parse(`${item}T00:00:00Z`)))) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be YYYY-MM-DD or null.`);
    if (rule === 'datetime' && (typeof item !== 'string' || Number.isNaN(Date.parse(item)))) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a valid datetime.`);
    if (rule === 'ids' && (!Array.isArray(item) || item.some((id) => !Number.isSafeInteger(id) || id <= 0))) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a list of positive integers.`);
    if (rule === 'cast' && (!Array.isArray(item) || item.some((cast) => !cast || !Number.isSafeInteger(cast.actorId) || cast.actorId <= 0 || typeof cast.role !== 'string'))) throw new HttpError(400, 'INVALID_REQUEST', `${field} is invalid.`);
    if (typeof item === 'string' && item.length > 4000) throw new HttpError(400, 'INVALID_REQUEST', `${field} is too long.`);
    const fieldMax = { email: 150, phone: 20, code: 50, title: 255, name: 255, address: 255, city: 100, type: 50, status: 50, format: 50, seatType: 50, dayType: 50, discountType: 20, nationalitiy: 100, nationality: 100 }[field];
    if (fieldMax && typeof item === 'string' && item.length > fieldMax) throw new HttpError(400, 'INVALID_REQUEST', `${field} is too long.`);
    result[field] = typeof item === 'string' ? item.trim() : item;
  }
  return result;
}

export const pathId = (value, field = 'id') => optionalId(value, field) ?? (() => { throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a positive integer.`); })();
export const userCreate = (v) => bodyShape(v, { name: 'string', email: 'email', password: 'password', phone: 'string?', roleId: 'id' });
export const userStatus = (v) => {
  const result = bodyShape(v, { status: 'string' });
  if (!new Set(['Hoạt động', 'Bị khóa']).has(result.status)) throw new HttpError(400, 'INVALID_REQUEST', 'status is not supported.');
  return result;
};
export const roleWrite = (v, create = false) => bodyShape(v, create ? { code: 'string', name: 'string', description: 'string?' } : { name: 'string', description: 'string?' });
export const permissionWrite = (v, create = false) => bodyShape(v, create ? { code: 'string', name: 'string', description: 'string?' } : { name: 'string', description: 'string?' });
export const rolePermissionSet = (v) => bodyShape(v, { permissionIds: 'ids' });
export const assignmentWrite = (v) => bodyShape(v, { userId: 'id', cinemaId: 'id', startsOn: 'date', endsOn: 'nullable-date?', status: 'string' });
export const cinemaWrite = (v, create = false) => bodyShape(v, create ? { name: 'string', address: 'string', city: 'string', phone: 'string?', description: 'string?', operatingSince: 'date?' } : { name: 'string', address: 'string', city: 'string', phone: 'string?', description: 'string?', status: 'string' });
export const roomWrite = (v, create = false) => bodyShape(v, create ? { cinemaId: 'id', name: 'string', type: 'string' } : { name: 'string', type: 'string', status: 'string' });
export const seatWrite = (v, create = false) => bodyShape(v, create ? { roomId: 'id', row: 'string', number: 'positive', type: 'string' } : { type: 'string', status: 'string' });
export const pricingWrite = (v, create = false) => bodyShape(v, create ? { cinemaId: 'id', seatType: 'string', dayType: 'string', format: 'string', surcharge: 'nonnegative', startsOn: 'date', endsOn: 'nullable-date?' } : { surcharge: 'nonnegative', status: 'string' });
export const showtimeFilters = (query) => {
  const input = queryOnly(query, ['cinemaId', 'fromDate', 'toDate']);
  const fromDate = optionalDate(input.fromDate, 'fromDate'); const toDate = optionalDate(input.toDate, 'toDate');
  if (fromDate && toDate && fromDate > toDate) throw new HttpError(400, 'INVALID_REQUEST', 'fromDate must not be after toDate.');
  return { cinemaId: optionalId(input.cinemaId, 'cinemaId'), fromDate, toDate };
};
export const resourceIdFilter = (query, key) => optionalId(queryOnly(query, [key])[key], key);
export const showtimeWrite = (v, create = false) => bodyShape(v, create ? { movieId: 'id', roomId: 'id', startsAt: 'datetime', endsAt: 'datetime', format: 'string', basePrice: 'number' } : { movieId: 'id', startsAt: 'datetime', endsAt: 'datetime', format: 'string', basePrice: 'number', status: 'string' });
export const genreWrite = (v) => bodyShape(v, { name: 'string' });
export const actorWrite = (v) => bodyShape(v, { name: 'string', birthDate: 'date?', nationality: 'string?' });
export const movieWrite = (v, create = false) => bodyShape(v, create ? { title: 'string', durationMinutes: 'positive', releaseDate: 'date', endDate: 'nullable-date?', language: 'string?', subtitle: 'string?', ageRating: 'string?', director: 'string?', description: 'string?', posterUrl: 'string?', trailerUrl: 'string?', genreIds: 'ids' } : { title: 'string', durationMinutes: 'positive', releaseDate: 'date', endDate: 'nullable-date?', language: 'string?', subtitle: 'string?', ageRating: 'string?', director: 'string?', description: 'string?', posterUrl: 'string?', trailerUrl: 'string?', status: 'string', genreIds: 'ids' });
export const movieCast = (v) => bodyShape(v, { cast: 'cast' });
export const productWrite = (v, create = false) => bodyShape(v, create ? { name: 'string', type: 'string', price: 'number', description: 'string?', image: 'string?' } : { name: 'string', type: 'string', price: 'number', description: 'string?', image: 'string?', status: 'string' });
export const promotionWrite = (v, create = false) => bodyShape(v, create ? { code: 'string', description: 'string?', discountType: 'string', discountValue: 'positive', minimumOrder: 'number?', maximumDiscount: 'number?', startsAt: 'datetime', endsAt: 'datetime', quantity: 'positive' } : { description: 'string?', discountType: 'string', discountValue: 'positive', minimumOrder: 'number?', maximumDiscount: 'number?', startsAt: 'datetime', endsAt: 'datetime', quantity: 'positive', status: 'string' });

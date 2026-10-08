import { isDateOnly, isApiInstant } from '../utils/dateTime.js';
import { HttpError } from '../utils/httpError.js';
import { validatePassword } from '../utils/password.js';
import { sqlInteger, sqlId, sqlDecimal, birthDate, enumInput } from '../utils/inputContract.js';
import { RESOURCE_STATUSES, ROOM_TYPES, SEAT_TYPES, DAY_TYPES, PRODUCT_TYPES, DISCOUNT_TYPES, AGE_RATINGS } from '../../../shared/resourceContract.mjs';

function queryOnly(query, allowed) {
  if (!query || typeof query !== 'object' || Array.isArray(query)
    || Object.keys(query).some((key) => !allowed.includes(key))) {
    throw new HttpError(400, 'UNKNOWN_QUERY_PARAMETER', 'Request contains unsupported query parameters.');
  }
  return query;
}

function optionalId(value, field) {
  if (value == null || value === '') return null;
  return sqlId(value, field);
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
  if (!isDateOnly(value)) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be YYYY-MM-DD.`);
  }
  return value;
}

export function userFilters(query) {
  const input = queryOnly(query, ['roleId', 'status', 'search']);
  const status = optionalText(input.status, 'status', 50); if (status !== null) enumInput(status, 'status', RESOURCE_STATUSES.users);
  return { roleId: optionalId(input.roleId, 'roleId'), status, search: optionalText(input.search, 'search', 100) };
}

export function assignmentFilters(query) {
  const input = queryOnly(query, ['cinemaId', 'userId']);
  return { cinemaId: optionalId(input.cinemaId, 'cinemaId'), userId: optionalId(input.userId, 'userId') };
}

export function movieFilters(query) {
  const input = queryOnly(query, ['status', 'genreId', 'search']);
  const status = optionalText(input.status, 'status', 50); if (status !== null) enumInput(status, 'status', RESOURCE_STATUSES.movies);
  return { status, genreId: optionalId(input.genreId, 'genreId'), search: optionalText(input.search, 'search', 100) };
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
    const [rule, limitText] = (optional ? ruleText.slice(0, -1) : ruleText).split(':');
    const item = value[field];
    if (optional && (item === undefined || item === null && rule !== 'nullable-date')) continue;
    if (item === undefined || item === null && rule !== 'nullable-date') throw new HttpError(400, 'INVALID_REQUEST', `${field} is required.`);
    if (item === null && rule === 'nullable-date') { result[field] = null; continue; }
    if (rule === 'id' || rule === 'positive-int') sqlInteger(item, field);
    if (rule === 'nonnegative-int') sqlInteger(item, field, 0);
    if (['number', 'positive', 'nonnegative'].includes(rule)) sqlDecimal(item, field);
    if (rule === 'nonnegative' && (typeof item !== 'number' || !Number.isFinite(item) || item < 0)) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be non-negative.`);
    if (rule === 'positive' && (typeof item !== 'number' || !Number.isFinite(item) || item <= 0)) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be positive.`);
    if (rule === 'string' && (typeof item !== 'string' || !item.trim())) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be text.`);
    if (rule === 'email' && (typeof item !== 'string' || !/^\S+@\S+\.\S+$/.test(item))) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a valid email.`);
    if (rule === 'password') validatePassword(item, { field });
    if (rule === 'date' && (!isDateOnly(item))) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be YYYY-MM-DD.`);
    if (rule === 'nullable-date' && item !== null && (!isDateOnly(item))) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be YYYY-MM-DD or null.`);
    if (rule === 'datetime' && !isApiInstant(item)) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be an ISO datetime with Z or an explicit offset.`);
    if (rule === 'ids') { if (!Array.isArray(item)) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be an array.`); item.forEach(id => sqlInteger(id, field)); }
    if (rule === 'cast') {
      if (!Array.isArray(item) || item.some(cast => !cast || Object.keys(cast).some(key => !['actorId','role'].includes(key)) || typeof cast.role !== 'string' || cast.role.length > 150)) throw new HttpError(400, 'INVALID_REQUEST', `${field} is invalid.`);
      item.forEach(cast => sqlInteger(cast.actorId, 'actorId'));
    }
    if (rule === 'boolean' && typeof item !== 'boolean') throw new HttpError(400, 'INVALID_REQUEST', `${field} must be true or false.`);
    if (limitText && typeof item === 'string' && item.length > Number(limitText)) throw new HttpError(400, 'INVALID_REQUEST', `${field} must be at most ${limitText} characters.`);
    result[field] = typeof item === 'string' && rule !== 'password' ? item.trim() : item;
  }
  return result;
}

export const pathId = (value, field = 'id') => optionalId(value, field) ?? (() => { throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a positive integer.`); })();
const enums = (result, resource, fields = {}) => {
  if (result.status !== undefined) enumInput(result.status, 'status', RESOURCE_STATUSES[resource]);
  for (const [field, options] of Object.entries(fields)) enumInput(result[field], field, options);
  return result;
};
export const userCreate = (v) => bodyShape(v, { name: 'string:100', email: 'email:150', password: 'password', phone: 'string:20?', roleId: 'id' });
export const userStatus = (v) => {
  const result = bodyShape(v, { status: 'string:50' });
  return enums(result, 'users');
};
export const roleWrite = (v, create = false) => {
  const result = bodyShape(v, create ? { code: 'string:50', name: 'string:100', description: 'string:255?' } : { name: 'string:100', description: 'string:255?' });
  if (result.name.length > 100) throw new HttpError(400, 'INVALID_REQUEST', 'name must be at most 100 characters.');
  return result;
};
export const permissionWrite = (v, create = false) => bodyShape(v, create ? { code: 'string:50', name: 'string:100', description: 'string:255?' } : { name: 'string:100', description: 'string:255?' });
export const rolePermissionSet = (v) => bodyShape(v, { permissionIds: 'ids' });
export const assignmentWrite = (v, create = false) => {
  const result = enums(bodyShape(v, { userId: 'id', cinemaId: 'id', startsOn: 'date', endsOn: 'nullable-date?', status: create ? 'string:50?' : 'string:50' }), 'assignments');
  if (create && result.status !== undefined && result.status !== 'Hiệu lực') throw new HttpError(400, 'INVALID_REQUEST', 'New assignments must use the current create contract: Hiệu lực.');
  if (result.endsOn && result.endsOn < result.startsOn) throw new HttpError(400, 'INVALID_REQUEST', 'endsOn must not precede startsOn.');
  return result;
};
export const cinemaWrite = (v, create = false) => enums(bodyShape(v, create ? { name: 'string:150', address: 'string:255', city: 'string:100', phone: 'string:20?', description: 'string:500?', operatingSince: 'date?' } : { name: 'string:150', address: 'string:255', city: 'string:100', phone: 'string:20?', description: 'string:500?', status: 'string:50' }), 'cinemas');
export const roomWrite = (v, create = false) => enums(bodyShape(v, create ? { cinemaId: 'id', name: 'string:100', type: 'string:50' } : { name: 'string:100', type: 'string:50', status: 'string:50' }), 'rooms', { type: ROOM_TYPES });
export const seatWrite = (v, create = false) => enums(bodyShape(v, create ? { roomId: 'id', row: 'string:10', number: 'positive-int', type: 'string:50' } : { type: 'string:50', status: 'string:50' }), 'seats', { type: SEAT_TYPES });
export const pricingWrite = (v, create = false) => enums(bodyShape(v, create ? { cinemaId: 'id', seatType: 'string:50', dayType: 'string:50', format: 'string:50', surcharge: 'nonnegative', startsOn: 'date', endsOn: 'nullable-date?' } : { surcharge: 'nonnegative', status: 'string:50' }), 'pricing', { seatType: [...SEAT_TYPES, 'Tất cả'], dayType: DAY_TYPES, format: [...ROOM_TYPES, 'Tất cả'] });
// Mirrors CK_HINHANH_RAPCHIEUPHIM_TrangThai (migration 010).
export const CINEMA_IMAGE_STATUSES = RESOURCE_STATUSES.cinemaImages;
export const cinemaImageWrite = (v, create = false) => {
  const input = v && typeof v === 'object' && !Array.isArray(v) && v.description === '' ? { ...v, description: null } : v;
  const result = bodyShape(input, create
    ? { url: 'string:500', description: 'string:255?', cover: 'boolean?', displayOrder: 'nonnegative-int', status: 'string:50?' }
    : { url: 'string:500', description: 'string:255?', displayOrder: 'nonnegative-int', status: 'string:50' });
  if (!/^https?:\/\/\S+$/i.test(result.url) && !/^\/\S+/.test(result.url)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'url must be an http(s) URL or an absolute local path.');
  }
  if (result.status !== undefined && !CINEMA_IMAGE_STATUSES.includes(result.status)) {
    throw new HttpError(400, 'INVALID_REQUEST', `status must be one of: ${CINEMA_IMAGE_STATUSES.join(', ')}.`);
  }
  return result;
};
export const cinemaImageCover = (v) => bodyShape(v, { cover: 'boolean' });
export const showtimeFilters = (query) => {
  const input = queryOnly(query, ['cinemaId', 'fromDate', 'toDate']);
  const fromDate = optionalDate(input.fromDate, 'fromDate'); const toDate = optionalDate(input.toDate, 'toDate');
  if (fromDate && toDate && fromDate > toDate) throw new HttpError(400, 'INVALID_REQUEST', 'fromDate must not be after toDate.');
  return { cinemaId: optionalId(input.cinemaId, 'cinemaId'), fromDate, toDate };
};
export const resourceIdFilter = (query, key) => optionalId(queryOnly(query, [key])[key], key);
export const showtimeWrite = (v, create = false) => enums(bodyShape(v, create ? { movieId: 'id', roomId: 'id', startsAt: 'datetime', endsAt: 'datetime', format: 'string:50', basePrice: 'nonnegative' } : { movieId: 'id', startsAt: 'datetime', endsAt: 'datetime', format: 'string:50', basePrice: 'nonnegative', status: 'string:50' }), 'showtimes', { format: ROOM_TYPES });
export const genreWrite = (v) => bodyShape(v, { name: 'string:100' });
export const actorWrite = (v) => {
  const result = bodyShape(v, { name: 'string:150', birthDate: 'date?', nationality: 'string:100?' });
  if (result.birthDate !== undefined) birthDate(result.birthDate);
  return result;
};
const movieSchema = { title: 'string:255', durationMinutes: 'positive-int', releaseDate: 'date', endDate: 'nullable-date?', language: 'string:100?', subtitle: 'string:100?', ageRating: 'string:20?', director: 'string:150?', description: 'string?', posterUrl: 'string:500?', trailerUrl: 'string:500?', genreIds: 'ids' };
export const movieWrite = (v, create = false) => enums(bodyShape(v, create ? movieSchema : { ...movieSchema, status: 'string:50' }), 'movies', { ageRating: AGE_RATINGS });
export const movieCast = (v) => bodyShape(v, { cast: 'cast' });
export const productWrite = (v, create = false) => enums(bodyShape(v, create ? { name: 'string:150', type: 'string:50', price: 'nonnegative', description: 'string:255?', image: 'string:500?' } : { name: 'string:150', type: 'string:50', price: 'nonnegative', description: 'string:255?', image: 'string:500?', status: 'string:50' }), 'products', { type: PRODUCT_TYPES });
const PERCENT_DISCOUNT_TYPES = new Set(['Phần trăm', 'PERCENT']);
export const MAX_PERCENT_DISCOUNT = 99; // mirrors CK_KHUYENMAI_PhanTram99 and dbo.fn_GioiHanGiamGiaPhanTram
export const promotionWrite = (v, create = false) => {
  const result = promotionShape(v, create);
  if (PERCENT_DISCOUNT_TYPES.has(result.discountType) && result.discountValue > MAX_PERCENT_DISCOUNT) {
    throw new HttpError(400, 'INVALID_REQUEST', `A percent discount must be greater than 0 and at most ${MAX_PERCENT_DISCOUNT}.`);
  }
  return result;
};
const promotionSchema = { description: 'string:255?', discountType: 'string:20', discountValue: 'positive', minimumOrder: 'nonnegative?', maximumDiscount: 'nonnegative?', startsAt: 'datetime', endsAt: 'datetime', quantity: 'positive-int' };
const promotionShape = (v, create) => enums(bodyShape(v, create ? { ...promotionSchema, code: 'string:50' } : { ...promotionSchema, status: 'string:50' }), 'promotions', { discountType: DISCOUNT_TYPES });

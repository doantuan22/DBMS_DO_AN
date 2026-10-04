import { isDateOnly } from '../utils/dateTime.js';
import { HttpError } from '../utils/httpError.js';
import { enumInput } from '../utils/inputContract.js';
import { RESOURCE_STATUSES } from '../../../shared/resourceContract.mjs';

function positiveInteger(value, field) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a positive integer.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > 2147483647) throw new HttpError(400, 'INVALID_REQUEST', `${field} is invalid.`);
  return parsed;
}

function queryObject(query) {
  return query && typeof query === 'object' && !Array.isArray(query) ? query : {};
}

function rejectUnknownQuery(query, allowed) {
  const unsupported = Object.keys(query).filter((key) => !allowed.has(key));
  if (unsupported.length) {
    throw new HttpError(400, 'UNKNOWN_QUERY_PARAMETER', 'Request contains unsupported query parameters.');
  }
}

function optionalText(value, field, maxLength) {
  if (value === undefined || value === '') return null;
  if (typeof value !== 'string') throw new HttpError(400, 'INVALID_REQUEST', `${field} must be text.`);
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) throw new HttpError(400, 'INVALID_REQUEST', `${field} is too long.`);
  return normalized;
}

function optionalInteger(value, field) {
  return value === undefined || value === '' ? null : positiveInteger(value, field);
}

function validDate(value) {
  const date = optionalText(value, 'date', 10);
  if (date === null) return null;
  if (!isDateOnly(date)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'date must be a valid YYYY-MM-DD date.');
  }
  return date;
}

export const validateMovieId = (value) => positiveInteger(value, 'movieId');
export const validateCinemaId = (value) => positiveInteger(value, 'cinemaId');
export const validateShowtimeId = (value) => positiveInteger(value, 'showtimeId');

export function validateMovieListQuery(query) {
  const input = queryObject(query);
  rejectUnknownQuery(input, new Set(['status', 'genreId', 'search']));
  const status = optionalText(input.status, 'status', 50);
  if (status !== null) enumInput(status, 'status', RESOURCE_STATUSES.movies);
  return {
    status,
    genreId: optionalInteger(input.genreId, 'genreId'),
    search: optionalText(input.search, 'search', 100),
  };
}

export function validateCinemaListQuery(query) {
  const input = queryObject(query);
  rejectUnknownQuery(input, new Set(['city']));
  return { city: optionalText(input.city, 'city', 100) };
}

export function validateShowtimeListQuery(movieId, query) {
  const input = queryObject(query);
  rejectUnknownQuery(input, new Set(['cinemaId', 'date']));
  return {
    movieId: validateMovieId(movieId),
    cinemaId: optionalInteger(input.cinemaId, 'cinemaId'),
    date: validDate(input.date),
  };
}

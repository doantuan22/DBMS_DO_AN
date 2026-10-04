import { HttpError } from './httpError.js';

// SQL Server numeric-range errors: 8115 arithmetic overflow, 245 / 248 conversion failures or int overflow.
const NUMERIC_RANGE_ERRORS = new Set([8115, 245, 248]);

export const sqlErrorNumber = (error) => error.number ?? error.originalError?.info?.number ?? error.originalError?.number;
export const isNumericRangeError = (error) => NUMERIC_RANGE_ERRORS.has(sqlErrorNumber(error));

export function nativeSqlError(error) {
  if (error instanceof HttpError) return error;
  const number = sqlErrorNumber(error);
  if ([2627, 2601].includes(number)) return new HttpError(409, 'DUPLICATE_RECORD', 'A record with the same unique value already exists.');
  if (number === 547) {
    if (/\bDELETE\b/i.test(error.message ?? error.originalError?.info?.message ?? '')) return new HttpError(409, 'RECORD_IN_USE', 'This record is referenced by existing data.');
    return new HttpError(400, 'INVALID_REFERENCE', 'The request conflicts with an existing data constraint.');
  }
  if ([515, 2628, 8152].includes(number)) return new HttpError(400, 'INVALID_REQUEST', 'A required field is missing or exceeds its SQL contract.');
  return error;
}

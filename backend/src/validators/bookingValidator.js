import { HttpError } from '../utils/httpError.js';

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function requestObject(value, allowedKeys) {
  if (!isPlainObject(value)) throw new HttpError(400, 'INVALID_REQUEST', 'Request body must be an object.');
  const unknown = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (unknown.length > 0) throw new HttpError(400, 'UNKNOWN_REQUEST_FIELD', 'Request contains unsupported fields.');
  return value;
}

export function positiveInteger(value, field) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a positive integer.`);
  }
  return value;
}

function seatIds(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new HttpError(400, 'INVALID_REQUEST', 'seatIds must contain at least one seat.');
  }
  const ids = value.map((item) => positiveInteger(item, 'seatIds'));
  if (new Set(ids).size !== ids.length) throw new HttpError(400, 'DUPLICATE_SEAT', 'seatIds must not contain duplicates.');
  return ids;
}

function products(value = []) {
  if (!Array.isArray(value)) throw new HttpError(400, 'INVALID_REQUEST', 'products must be an array.');
  const items = value.map((item) => {
    if (!isPlainObject(item) || Object.keys(item).some((key) => !['productId', 'quantity'].includes(key))) {
      throw new HttpError(400, 'INVALID_REQUEST', 'Each product must contain productId and quantity only.');
    }
    return {
      productId: positiveInteger(item.productId, 'productId'),
      quantity: positiveInteger(item.quantity, 'quantity'),
    };
  });
  if (new Set(items.map((item) => item.productId)).size !== items.length) {
    throw new HttpError(400, 'DUPLICATE_PRODUCT', 'products must not contain duplicate productId values.');
  }
  return items;
}

function promotionCode(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new HttpError(400, 'INVALID_REQUEST', 'promotionCode must be a string.');
  const code = value.trim();
  if (!code || code.length > 50) throw new HttpError(400, 'INVALID_REQUEST', 'promotionCode must be between 1 and 50 characters.');
  return code;
}

export function validateBooking(value) {
  const body = requestObject(value, ['showtimeId', 'seatIds', 'products', 'promotionCode']);
  return {
    showtimeId: positiveInteger(body.showtimeId, 'showtimeId'),
    seatIds: seatIds(body.seatIds),
    products: products(body.products),
    promotionCode: promotionCode(body.promotionCode),
  };
}

export function validatePromotion(value) {
  const body = requestObject(value, ['showtimeId', 'seatIds', 'products', 'promotionCode']);
  const code = promotionCode(body.promotionCode);
  if (!code) throw new HttpError(400, 'INVALID_REQUEST', 'promotionCode is required.');
  return {
    showtimeId: positiveInteger(body.showtimeId, 'showtimeId'),
    seatIds: seatIds(body.seatIds),
    products: products(body.products),
    promotionCode: code,
  };
}

import bcrypt from 'bcryptjs';
import { HttpError } from './httpError.js';

// Passwords are hashed here; the database only ever stores and returns the hash.
const COST = 10;

export function validatePassword(plain, { field = 'password', minimumBytes = 8 } = {}) {
  if (
    typeof plain !== 'string' ||
    Buffer.byteLength(plain, 'utf8') < minimumBytes ||
    Buffer.byteLength(plain, 'utf8') > 72
  ) {
    throw new HttpError(
      400,
      'INVALID_REQUEST',
      `${field} must be ${minimumBytes} to 72 UTF-8 bytes.`,
    );
  }
  return plain;
}

// Keep the demo/legacy six-byte password usable; new-account validators require eight.
export const hashPassword = (plain) =>
  bcrypt.hash(validatePassword(plain, { minimumBytes: 1 }), COST);
export const verifyPassword = (plain, hash) =>
  bcrypt.compare(validatePassword(plain, { minimumBytes: 1 }), hash);

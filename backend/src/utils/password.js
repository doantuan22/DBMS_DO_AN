import bcrypt from 'bcryptjs';

// Passwords are hashed here; the database only ever stores and returns the hash.
const COST = 10;

export const hashPassword = (plain) => bcrypt.hash(plain, COST);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

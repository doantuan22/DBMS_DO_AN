import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from './httpError.js';

const encoder = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const decodeJson = (value) => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
const durationSeconds = (value) => {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  if (!match) throw new Error('JWT_EXPIRES_IN must use seconds, minutes, hours, or days (e.g. 1h).');
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  const seconds = Number(match[1]) * units[match[2]];
  if (!Number.isSafeInteger(seconds) || seconds < 1) throw new Error('JWT_EXPIRES_IN must be a positive duration.');
  return seconds;
};

export function createJwtService({ secret = env.jwt.secret, expiresIn = env.jwt.expiresIn, now = () => Date.now() } = {}) {
  function requireSecret() {
    if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) {
      throw new HttpError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured.');
    }
  }

  function sign(input) {
    const hmac = createHmac('sha256', secret);
    hmac.write(input);
    return hmac.digest('base64url');
  }

  function issue(userId) {
    requireSecret();
    const duration = durationSeconds(expiresIn);
    const issuedAt = Math.floor(now() / 1000);
    const head = encoder({ alg: 'HS256', typ: 'JWT' });
    const body = encoder({ sub: String(userId), iat: issuedAt, exp: issuedAt + duration });
    const input = `${head}.${body}`;
    return { token: `${input}.${sign(input)}`, expiresIn };
  }

  function verify(token) {
    requireSecret();
    if (typeof token !== 'string') throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.');
    const parts = token.split('.');
    if (parts.length !== 3 || parts.some((part) => !part)) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.');
    }

    try {
      const header = decodeJson(parts[0]);
      const payload = decodeJson(parts[1]);
      const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`), 'base64url');
      const actual = Buffer.from(parts[2], 'base64url');
      if (header.alg !== 'HS256' || header.typ !== 'JWT' || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
        throw new Error('Invalid signature');
      }
      const userId = Number(payload.sub);
      if (!Number.isSafeInteger(userId) || userId < 1 || !Number.isSafeInteger(payload.exp) || payload.exp <= Math.floor(now() / 1000)) {
        throw new Error('Invalid or expired claims');
      }
      return { userId };
    } catch {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.');
    }
  }

  return { issue, verify };
}

const jwt = createJwtService();
export const issueToken = jwt.issue;
export const verifyToken = jwt.verify;

import { performance } from 'node:perf_hooks';
import { isIP } from 'node:net';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

export function authClientKey(address) {
  const ip = String(address ?? '').split('%')[0];
  if (isIP(ip) === 4) return ip;
  if (isIP(ip) !== 6) return 'unknown';
  // URL canonicalization also converts a dotted IPv4 suffix into hex groups.
  const normalized = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const [left, right] = normalized.split('::');
  const first = left ? left.split(':') : [];
  const last = right ? right.split(':') : [];
  const groups =
    right === undefined
      ? first
      : [...first, ...Array(8 - first.length - last.length).fill('0'), ...last];
  const words = groups.map((value) => Number.parseInt(value, 16));
  if (words.slice(0, 5).every((value) => value === 0) && words[5] === 65535) {
    return [words[6] >> 8, words[6] & 255, words[7] >> 8, words[7] & 255].join('.');
  }
  return (
    'ipv6:' +
    words
      .slice(0, 4)
      .map((value) => value.toString(16))
      .join(':') +
    '/64'
  );
}

export function createAuthRateLimiter({
  policy = env.authRateLimit,
  now = () => performance.now(),
} = {}) {
  const { windowMs, loginMax, registerMax, maxKeys } = policy;
  for (const value of [windowMs, loginMax, registerMax, maxKeys]) {
    if (!Number.isSafeInteger(value) || value < 1)
      throw new TypeError('Auth rate limit policy must contain positive safe integers.');
  }
  const buckets = new Map();
  function reject(res, next, resetsAt, time) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((resetsAt - time) / 1000))));
    return next(
      new HttpError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Too many authentication requests. Please try again later.',
      ),
    );
  }
  return function authRateLimit(req, res, next) {
    const match = /^\/(login|register)\/?$/i.exec(req.path);
    if (req.method !== 'POST' || !match) return next();
    const time = now();
    // Same window and monotonic creation times keep the Map ordered by expiry.
    while (buckets.size) {
      const [key, bucket] = buckets.entries().next().value;
      if (time < bucket.resetsAt) break;
      buckets.delete(key);
    }
    const endpoint = match[1].toLowerCase();
    const key = endpoint + ':' + authClientKey(req.ip ?? req.socket?.remoteAddress);
    let bucket = buckets.get(key);
    if (!bucket) {
      if (buckets.size >= maxKeys)
        return reject(res, next, buckets.values().next().value.resetsAt, time);
      bucket = { count: 0, resetsAt: time + windowMs };
      buckets.set(key, bucket);
    }
    const maximum = endpoint === 'login' ? loginMax : registerMax;
    if (bucket.count >= maximum) return reject(res, next, bucket.resetsAt, time);
    bucket.count += 1;
    return next();
  };
}

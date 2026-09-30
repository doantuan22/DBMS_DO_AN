import { logger } from '../utils/logger.js';

// Express recognises error handlers by their four-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const unavailableCodes = new Set(['ESOCKET', 'ECONNREFUSED', 'ETIMEOUT', 'ENOTOPEN', 'ELOGIN', 'EINSTLOOKUP', 'ENOCONN']);
  const isDatabaseUnavailable = unavailableCodes.has(err.code) || err.name === 'ConnectionError';
  const status = err.status ?? (isDatabaseUnavailable ? 503 : 500);
  if (status >= 500) logger.error('Request failed', { method: req.method, path: req.originalUrl, error: err });
  res.status(status).json({
    error: {
      code: status === 503 ? (err.code === 'AUTH_NOT_CONFIGURED' ? err.code : 'SERVICE_UNAVAILABLE') : err.code ?? 'INTERNAL_ERROR',
      message: status === 503 ? err.message : status >= 500 ? 'Internal server error' : err.message,
    },
  });
}

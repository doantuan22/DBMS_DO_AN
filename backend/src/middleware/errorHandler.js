import { logger } from '../utils/logger.js';
import { authorizationError } from '../utils/authorizationErrors.js';
import { nativeSqlError } from '../utils/sqlErrors.js';
import { HttpError } from '../utils/httpError.js';

// Express recognises error handlers by their four-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  err = nativeSqlError(authorizationError(err));
  const unavailableCodes = new Set([
    'ESOCKET',
    'ECONNREFUSED',
    'ETIMEOUT',
    'ENOTOPEN',
    'ELOGIN',
    'EINSTLOOKUP',
    'ENOCONN',
  ]);
  const isDatabaseUnavailable = unavailableCodes.has(err.code) || err.name === 'ConnectionError';
  const status = err.status ?? (isDatabaseUnavailable ? 503 : 500);
  if (status >= 500)
    logger.error('Request failed', {
      method: req.method,
      path: req.originalUrl?.split('?')[0],
      error: err,
    });
  const isPublicClientError = status < 500 && err instanceof HttpError;
  // Keep existing safe application error codes; driver/internal codes are private.
  const publicServerCodes = new Set(['AUTH_RESPONSE_INVALID', 'ORDER_RESPONSE_INVALID']);
  let code =
    err instanceof HttpError && publicServerCodes.has(err.code) ? err.code : 'INTERNAL_ERROR';
  let message = 'Internal server error';
  if (status === 503) {
    code = err.code === 'AUTH_NOT_CONFIGURED' ? 'AUTH_NOT_CONFIGURED' : 'SERVICE_UNAVAILABLE';
    message = 'Service temporarily unavailable.';
  } else if (status < 500) {
    code = isPublicClientError ? err.code : 'INVALID_REQUEST';
    message = isPublicClientError ? err.message : 'Invalid request.';
  }
  res.status(status).json({
    error: { code, message },
  });
}

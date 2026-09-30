import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Express recognises error handlers by their four-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  if (status >= 500) logger.error('Request failed', { method: req.method, path: req.originalUrl, error: err });
  res.status(status).json({
    error: {
      code: err.code ?? 'INTERNAL_ERROR',
      message: status >= 500 && env.nodeEnv === 'production' ? 'Internal server error' : err.message,
    },
  });
}

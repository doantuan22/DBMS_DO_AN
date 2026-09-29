import { env } from '../config/env.js';

// Express recognises error handlers by their four-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: {
      code: err.code ?? 'INTERNAL_ERROR',
      message: status >= 500 && env.nodeEnv === 'production' ? 'Internal server error' : err.message,
    },
  });
}

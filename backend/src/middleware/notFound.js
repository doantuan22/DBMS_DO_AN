import { HttpError } from '../utils/httpError.js';

export const notFound = (req, res, next) =>
  next(new HttpError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));

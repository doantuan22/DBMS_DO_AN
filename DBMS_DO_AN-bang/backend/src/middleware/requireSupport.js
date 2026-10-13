import { HttpError } from '../utils/httpError.js';

export function requireSupport(req, res, next) {
  if (!req.user) {
    return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.'));
  }
  if (req.user.role !== 'CSKH') {
    return next(new HttpError(403, 'SUPPORT_REQUIRED', 'Support access is required.'));
  }
  return next();
}

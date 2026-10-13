import { HttpError } from '../utils/httpError.js';

export function requireAdmin(req, res, next) {
  if (!req.user) return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.'));
  if (req.user.role !== 'ADMIN')
    return next(new HttpError(403, 'ADMIN_REQUIRED', 'Admin access is required.'));
  return next();
}

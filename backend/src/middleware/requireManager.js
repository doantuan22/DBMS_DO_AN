import { HttpError } from '../utils/httpError.js';

export function requireManager(req, res, next) {
  if (!req.user) return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.'));
  if (req.user.role !== 'QUAN_LY_RAP')
    return next(new HttpError(403, 'MANAGER_REQUIRED', 'Manager access is required.'));
  return next();
}

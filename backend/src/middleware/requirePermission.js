import { HttpError } from '../utils/httpError.js';

export function requirePermission(...permissions) {
  return function permissionGuard(req, res, next) {
    if (!req.user) return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.'));
    const allowed = permissions.length > 0 && permissions.every((permission) => req.user.permissions?.some((item) => item.code === permission));
    if (!allowed) return next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
    return next();
  };
}

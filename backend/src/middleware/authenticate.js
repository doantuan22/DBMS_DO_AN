import { authService } from '../services/authService.js';
import { verifyToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';

export function createAuthenticate({
  verify = verifyToken,
  loadUser = authService.getCurrentUser,
} = {}) {
  return async function authenticate(req, res, next) {
    const match = /^Bearer\s+([^\s]+)$/i.exec(req.get('authorization') ?? '');
    if (!match) return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.'));

    try {
      const { userId } = verify(match[1]);
      req.user = await loadUser(userId);
      return next();
    } catch (error) {
      if (error.status === 503) return next(error);
      if (error.status === 401) return next(error);
      return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.'));
    }
  };
}

export const authenticate = createAuthenticate();

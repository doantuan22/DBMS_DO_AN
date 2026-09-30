import { HttpError } from '../utils/httpError.js';

export function requireCustomer(req, res, next) {
  if (!req.user) return next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.'));
  if (req.user.role !== 'KHACH_HANG') return next(new HttpError(403, 'CUSTOMER_REQUIRED', 'Booking is available to customer accounts only.'));
  return next();
}

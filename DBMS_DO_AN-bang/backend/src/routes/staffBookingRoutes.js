import { Router } from 'express';
import { staffBookingService } from '../services/staffBookingService.js';
import * as validate from '../validators/staffBookingValidator.js';
import { HttpError } from '../utils/httpError.js';

// Mounted after the existing exact-role and DAT_VE guards in each staff portal.
export function createStaffBookingRouter(role, service = staffBookingService) {
  const router = Router();
  const handle = (action, status = 200) => async (req, res, next) => {
    try { res.status(status).json(await action(req)); }
    catch (error) { next(error); }
  };
  router.get('/', handle((r) => service.list(r.user.userId, role, validate.listFilters(r.query))));
  router.get('/customers', handle((r) => service.customers(r.user.userId, role, validate.customerSearch(r.query))));
  router.get('/options', handle((r) => service.options(r.user.userId, role, validate.bookingOptions(r.query))));
  router.get('/:orderId', handle(async (r) => ({ order: await service.detail(r.user.userId, role, validate.orderId(r.params.orderId)) })));
  router.post('/', handle((r) => service.create(r.user.userId, role, validate.createBooking(r.body)), 201));
  router.put('/:orderId/seats', handle(async (r) => ({ order: await service.updateSeats(r.user.userId, role, validate.orderId(r.params.orderId), validate.updateSeats(r.body)) })));
  router.post('/:orderId/cancel', handle(async (r) => {
    validate.cancelBooking(r.body);
    return { order: await service.cancel(r.user.userId, role, validate.orderId(r.params.orderId)) };
  }));
  router.delete('/:orderId', (req, res, next) => next(new HttpError(405, 'HISTORY_PRESERVED', 'Không xóa vật lý đơn/vé. Dùng hủy khi đủ điều kiện.')));
  return router;
}

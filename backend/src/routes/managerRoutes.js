import { Router } from 'express';
import * as manager from '../controllers/managerController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireManager } from '../middleware/requireManager.js';
import { requirePermission } from '../middleware/requirePermission.js';

const router = Router();
router.use(authenticate, requireManager);
router.get('/cinemas', manager.listCinemas);
router.get('/cinemas/:cinemaId/rooms', requirePermission('QL_PHONG'), manager.listRooms);
router.post('/cinemas/:cinemaId/rooms', requirePermission('QL_PHONG'), manager.createRoom);
router.put('/rooms/:roomId', requirePermission('QL_PHONG'), manager.updateRoom);
router.delete('/rooms/:roomId', requirePermission('QL_PHONG'), manager.deleteRoom);
router.get('/rooms/:roomId/seats', requirePermission('QL_GHE'), manager.listSeats);
router.post('/rooms/:roomId/seats', requirePermission('QL_GHE'), manager.createSeat);
router.put('/seats/:seatId', requirePermission('QL_GHE'), manager.updateSeat);
router.delete('/seats/:seatId', requirePermission('QL_GHE'), manager.deleteSeat);
router.get(
  '/cinemas/:cinemaId/showtimes',
  requirePermission('QL_SUAT_CHIEU'),
  manager.listShowtimes,
);
router.post('/showtimes', requirePermission('QL_SUAT_CHIEU'), manager.createShowtime);
router.put('/showtimes/:showtimeId', requirePermission('QL_SUAT_CHIEU'), manager.updateShowtime);
router.post(
  '/showtimes/:showtimeId/cancel',
  requirePermission('QL_SUAT_CHIEU'),
  manager.cancelShowtime,
);
router.get('/cinemas/:cinemaId/pricing', requirePermission('QL_BANG_GIA'), manager.listPricing);
router.post('/cinemas/:cinemaId/pricing', requirePermission('QL_BANG_GIA'), manager.createPricing);
router.put('/pricing/:pricingId', requirePermission('QL_BANG_GIA'), manager.updatePricing);
router.get('/cinemas/:cinemaId/dashboard', requirePermission('XEM_BAO_CAO_RAP'), manager.dashboard);
router.get('/cinemas/:cinemaId/revenue', requirePermission('XEM_BAO_CAO_RAP'), manager.revenue);
export default router;

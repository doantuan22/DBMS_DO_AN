import { Router } from 'express';
import * as catalogController from '../controllers/catalogController.js';
import { listSeats } from '../controllers/bookingController.js';

const router = Router();
router.get('/:showtimeId/seats', listSeats);
router.get('/:showtimeId', catalogController.getShowtimeDetail);

export default router;

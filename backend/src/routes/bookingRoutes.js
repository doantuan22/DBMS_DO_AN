import { requirePermission } from '../middleware/requirePermission.js';
import { Router } from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireCustomer } from '../middleware/requireCustomer.js';

const router = Router();
router.post('/', authenticate, requireCustomer, requirePermission('DAT_VE'), bookingController.createBooking);

export default router;

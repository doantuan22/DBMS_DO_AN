import { requirePermission } from '../middleware/requirePermission.js';
import { Router } from 'express';
import { validatePromotion } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireCustomer } from '../middleware/requireCustomer.js';

const router = Router();
router.post(
  '/validate',
  authenticate,
  requireCustomer,
  requirePermission('DAT_VE'),
  validatePromotion,
);

export default router;

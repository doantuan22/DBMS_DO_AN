import { Router } from 'express';
import { validatePromotion } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireCustomer } from '../middleware/requireCustomer.js';

const router = Router();
router.post('/validate', authenticate, requireCustomer, validatePromotion);

export default router;

import { Router } from 'express';
import { listProducts } from '../controllers/bookingController.js';

const router = Router();
router.get('/', listProducts);

export default router;

import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireCustomer } from '../middleware/requireCustomer.js';

const router = Router();
router.use(authenticate, requireCustomer);
router.get('/', orderController.listOrders);
router.get('/:orderId', orderController.getOrder);
router.post('/:orderId/payments', orderController.createPayment);
router.post('/:orderId/payments/:paymentId/result', orderController.updatePayment);

export default router;

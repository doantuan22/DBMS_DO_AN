import { requirePermission } from '../middleware/requirePermission.js';
import { Router } from 'express';
import * as orderController from '../controllers/orderController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireCustomer } from '../middleware/requireCustomer.js';

const router = Router();
router.use(authenticate, requireCustomer);
router.get('/', orderController.listOrders);
router.get('/:orderId', orderController.getOrder);
router.post('/:orderId/payments', requirePermission('THANH_TOAN'), orderController.createPayment);
router.post('/:orderId/payments/:paymentId/result', requirePermission('THANH_TOAN'), orderController.updatePayment);

export default router;

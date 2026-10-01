import { Router } from 'express';
import * as controller from '../controllers/supportController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { requireSupport } from '../middleware/requireSupport.js';

const router = Router();

router.use(authenticate, requireSupport);

router.get('/complaints', requirePermission('QL_KHIEUNAI'), controller.list);
router.get('/complaints/:complaintId', requirePermission('QL_KHIEUNAI'), controller.detail);
router.get(
  '/complaints/:complaintId/order-reference',
  requirePermission('QL_KHIEUNAI'),
  controller.orderReference,
);
router.post(
  '/complaints/:complaintId/processings',
  requirePermission('XULY_KHIEUNAI'),
  controller.addProcessing,
);
router.put(
  '/complaints/:complaintId/status',
  requirePermission('XULY_KHIEUNAI'),
  controller.updateStatus,
);

export default router;

import { Router } from 'express';
import * as controller from '../controllers/supportController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/requirePermission.js';
import { requireSupport } from '../middleware/requireSupport.js';

const router = Router();

router.use(authenticate, requireSupport);

// Complaints queue & list
router.get('/complaints', requirePermission('QL_KHIEUNAI'), controller.list);
router.get('/complaints/unassigned', requirePermission('KHIEUNAI_TIEPNHAN'), controller.listUnassigned);
router.get('/complaints/:complaintId', requirePermission('QL_KHIEUNAI'), controller.detail);
router.get(
  '/complaints/:complaintId/order-reference',
  requirePermission('QL_KHIEUNAI', 'TRA_CUU_DON'),
  controller.orderReference,
);

// Claim unassigned complaint
router.post(
  '/complaints/:complaintId/claim',
  requirePermission('KHIEUNAI_TIEPNHAN'),
  controller.claimComplaint,
);

// Processing & Status
router.post(
  '/complaints/:complaintId/processings',
  requirePermission('QL_KHIEUNAI', 'XULY_KHIEUNAI'),
  controller.addProcessing,
);
router.put(
  '/complaints/:complaintId/status',
  requirePermission('QL_KHIEUNAI', 'XULY_KHIEUNAI'),
  controller.updateStatus,
);

// Chat & Internal Notes
router.get(
  '/complaints/:complaintId/messages',
  requirePermission('KHIEUNAI_CHAT_XEM'),
  controller.listMessages,
);
router.post(
  '/complaints/:complaintId/messages',
  requirePermission('KHIEUNAI_CHAT_GUI'),
  controller.sendMessage,
);
router.post(
  '/complaints/:complaintId/internal-notes',
  requirePermission('KHIEUNAI_NOIBO_GHI'),
  controller.addInternalNote,
);

// Escalation
router.post(
  '/complaints/:complaintId/escalations',
  requirePermission('CHUYENCAP_TAO'),
  controller.createEscalation,
);
router.get(
  '/escalations',
  requirePermission('CHUYENCAP_XEM'),
  controller.listEscalations,
);
router.get(
  '/escalations/:escalationId',
  requirePermission('CHUYENCAP_XEM'),
  controller.escalationDetail,
);

// Customer Points Lookup (Read-only verification)
router.get(
  '/customers/:userId/points',
  requirePermission('TRA_CUU_DON'),
  controller.customerPoints,
);

export default router;

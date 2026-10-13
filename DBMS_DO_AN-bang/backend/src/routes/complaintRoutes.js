import { requirePermission } from '../middleware/requirePermission.js';
import { Router } from 'express';
import * as feedbackController from '../controllers/feedbackController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireCustomer } from '../middleware/requireCustomer.js';

const router = Router();
router.use(authenticate, requireCustomer);
router.get('/', feedbackController.listComplaints);
router.post('/', requirePermission('GUI_KHIEU_NAI'), feedbackController.createComplaint);
router.get('/:complaintId', feedbackController.getComplaint);

export default router;

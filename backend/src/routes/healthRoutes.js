import { Router } from 'express';
import * as healthController from '../controllers/healthController.js';

const router = Router();
router.get('/', healthController.getHealth);
router.get('/db', healthController.getDatabaseHealth);

export default router;

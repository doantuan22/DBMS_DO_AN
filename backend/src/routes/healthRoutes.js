import { Router } from 'express';
import * as healthController from '../controllers/healthController.js';

export function createHealthRouter({ checkDatabase } = {}) {
  const router = Router();
  router.get('/', healthController.getHealth);
  router.get('/db', healthController.createDatabaseHealthHandler(checkDatabase));
  return router;
}

export default createHealthRouter();

import { Router } from 'express';
import * as catalogController from '../controllers/catalogController.js';

const router = Router();
router.get('/', catalogController.listCinemas);

export default router;

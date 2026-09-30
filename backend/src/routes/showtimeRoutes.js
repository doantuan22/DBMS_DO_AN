import { Router } from 'express';
import * as catalogController from '../controllers/catalogController.js';

const router = Router();
router.get('/:showtimeId', catalogController.getShowtimeDetail);

export default router;

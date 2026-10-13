import { Router } from 'express';
import * as catalogController from '../controllers/catalogController.js';

const router = Router();
router.get('/', catalogController.listCinemas);
router.get('/:cinemaId/images', catalogController.listCinemaImages);

export default router;

import { Router } from 'express';
import * as catalogController from '../controllers/catalogController.js';

const router = Router();
router.get('/', catalogController.listMovies);
router.get('/:movieId/showtimes', catalogController.listShowtimes);
router.get('/:movieId', catalogController.getMovieDetail);

export default router;

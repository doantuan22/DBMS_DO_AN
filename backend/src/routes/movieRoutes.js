import { requirePermission } from '../middleware/requirePermission.js';
import { Router } from 'express';
import * as catalogController from '../controllers/catalogController.js';
import * as feedbackController from '../controllers/feedbackController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireCustomer } from '../middleware/requireCustomer.js';

const router = Router();
router.get('/', catalogController.listMovies);
router.get('/:movieId/showtimes', catalogController.listShowtimes);
router.get('/:movieId/reviews', feedbackController.listReviews);
router.post(
  '/:movieId/reviews',
  authenticate,
  requireCustomer,
  requirePermission('DANH_GIA'),
  feedbackController.createReview,
);
router.get('/:movieId', catalogController.getMovieDetail);

export default router;

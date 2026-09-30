import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import movieRoutes from './movieRoutes.js';
import cinemaRoutes from './cinemaRoutes.js';
import genreRoutes from './genreRoutes.js';
import showtimeRoutes from './showtimeRoutes.js';

// Feature routers (auth, movies, bookings, ...) are mounted here as they are built.
const router = Router();
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/cinemas', cinemaRoutes);
router.use('/genres', genreRoutes);
router.use('/showtimes', showtimeRoutes);

export default router;

import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';

// Feature routers (auth, movies, bookings, ...) are mounted here as they are built.
const router = Router();
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

export default router;

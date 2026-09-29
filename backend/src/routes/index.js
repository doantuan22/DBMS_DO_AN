import { Router } from 'express';
import healthRoutes from './healthRoutes.js';

// Feature routers (auth, movies, bookings, ...) are mounted here as they are built.
const router = Router();
router.use('/health', healthRoutes);

export default router;

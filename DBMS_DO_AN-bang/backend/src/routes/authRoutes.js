import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.currentUser);
router.put('/me', authenticate, authController.updateCurrentUser);
router.get('/permissions', authenticate, authController.currentPermissions);

export default router;

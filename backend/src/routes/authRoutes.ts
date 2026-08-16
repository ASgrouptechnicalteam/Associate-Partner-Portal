import { Router } from 'express';
import { login, logout, getMe, changeInitialPassword } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post('/change-initial-password', authenticate, changeInitialPassword);

export default router;

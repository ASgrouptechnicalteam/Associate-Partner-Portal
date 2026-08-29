import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { upload } from '../utils/fileUpload';

const router = Router();

// ALL user routes require authentication
router.use(authenticate);

// Profile routes (accessible by the owner)
router.patch('/profile/me', userController.updateMyProfile);
router.post('/profile/me/photo', upload.single('photo'), userController.uploadProfilePhoto);

// MD, CHANNEL_PARTNER_MANAGER, and ASSOCIATE can create users (Associates can refer)
router.post('/', requireRole('MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'), userController.createUser);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), userController.updateUser);
router.patch('/:id/status', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), userController.updateStatus);
router.post('/:id/reset-password', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), userController.resetPassword);

// ONLY MD can approve users
router.patch('/:id/approve', requireRole('MD'), userController.approveUser);

// Delete User
router.delete('/:id', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), userController.deleteUser);

export default router;

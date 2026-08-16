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

// MD, ASSOCIATE_MANAGER, and ASSOCIATE can create users (Associates can refer)
router.post('/', requireRole('MD', 'ASSOCIATE_MANAGER', 'ASSOCIATE'), userController.createUser);

router.get('/', requireRole('MD', 'ASSOCIATE_MANAGER'), userController.getUsers);
router.get('/:id', requireRole('MD', 'ASSOCIATE_MANAGER'), userController.getUser);
router.patch('/:id', requireRole('MD', 'ASSOCIATE_MANAGER'), userController.updateUser);
router.patch('/:id/status', requireRole('MD', 'ASSOCIATE_MANAGER'), userController.updateStatus);
router.post('/:id/reset-password', requireRole('MD', 'ASSOCIATE_MANAGER'), userController.resetPassword);

// ONLY MD can approve users
router.patch('/:id/approve', requireRole('MD'), userController.approveUser);

export default router;

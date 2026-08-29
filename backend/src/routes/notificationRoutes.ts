import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { 
  listNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  dismissNotification
} from '../controllers/notificationController';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.patch('/:id/dismiss', dismissNotification);

export default router;

import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

// Request endpoints
router.post('/requests', requireRole('ASSOCIATE'), ReviewController.createRequest);
router.get('/requests', ReviewController.getRequests);

// Analytics
router.get('/analytics', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), ReviewController.getAnalytics);

// Block mutations explicitly on authenticated side
router.put('/:id', ReviewController.blockMutation);
router.patch('/:id', ReviewController.blockMutation);
router.delete('/:id', ReviewController.blockMutation);

export default router;

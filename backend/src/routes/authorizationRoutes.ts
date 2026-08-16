import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { getPendingAuthorizationSummary } from '../controllers/authorizationController';

const router = Router();

// Strict MD-only authentication
router.use(authenticate);
router.use(requireRole('MD'));

router.get('/summary', getPendingAuthorizationSummary);

export default router;

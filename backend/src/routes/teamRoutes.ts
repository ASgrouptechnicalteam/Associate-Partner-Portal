import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { 
  getMyDownline, 
  getTeamHierarchy, 
  getTeamStatistics,
  createTeamRequest,
  getTeamRequests,
  approveTeamRequest,
  rejectTeamRequest
} from '../controllers/teamController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Associates and above can view their downline and stats
router.get('/downline', getMyDownline);
router.get('/statistics', getTeamStatistics);

// Team Requests (Associates can propose, MD/AM can review/approve depending on level)
router.post('/requests', createTeamRequest);
router.get('/requests', getTeamRequests);
router.patch('/requests/:id/approve', requireRole('MD', 'ASSOCIATE_MANAGER'), approveTeamRequest);
router.patch('/requests/:id/reject', requireRole('MD', 'ASSOCIATE_MANAGER'), rejectTeamRequest);

// Only MD and AM can view full hierarchy mapping
router.get('/hierarchy', requireRole('MD', 'ASSOCIATE_MANAGER'), getTeamHierarchy);

export default router;

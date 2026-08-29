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
  rejectTeamRequest,
  getTeams,
  createTeam,
  updateTeamHead,
  getTeamHierarchyData,
  deleteTeam
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
router.patch('/requests/:id/approve', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), approveTeamRequest);
router.patch('/requests/:id/reject', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), rejectTeamRequest);

// Only MD and AM can view full hierarchy mapping
router.get('/hierarchy', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), getTeamHierarchy);

// Dynamic Team Routes
router.get('/main-teams', getTeams); // Available to all authenticated users? Or maybe MD/CPM? Let's say all, as team info is public
router.post('/main-teams', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), createTeam);
router.patch('/main-teams/:id/head', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), updateTeamHead);
router.get('/main-teams/:id/hierarchy', getTeamHierarchyData);
router.delete('/main-teams/:id', requireRole('MD', 'CHANNEL_PARTNER_MANAGER'), deleteTeam);

export default router;

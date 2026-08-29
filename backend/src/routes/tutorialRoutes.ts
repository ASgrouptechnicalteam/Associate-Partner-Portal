import { Router } from 'express';
import { 
  getTutorials, 
  getTutorialBySlug, 
  createTutorial, 
  updateTutorial, 
  deleteTutorial,
  createTutorialStep,
  updateTutorialStep,
  deleteTutorialStep
} from '../controllers/tutorialController';
import { authenticate, roleCheck } from '../middleware/authMiddleware';

const router = Router();

// Publicly readable for authenticated users (service handles filtering)
router.get('/', authenticate, getTutorials);
router.get('/:slug', authenticate, getTutorialBySlug);

// CMS Endpoints - Tutorials
router.post('/', authenticate, roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), createTutorial);
router.patch('/:id', authenticate, roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), updateTutorial);
router.delete('/:id', authenticate, roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), deleteTutorial);

// CMS Endpoints - Steps
router.post('/:id/steps', authenticate, roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), createTutorialStep);
router.patch('/:id/steps/:stepId', authenticate, roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), updateTutorialStep);
router.delete('/:id/steps/:stepId', authenticate, roleCheck(['MD', 'CHANNEL_PARTNER_MANAGER']), deleteTutorialStep);

export default router;

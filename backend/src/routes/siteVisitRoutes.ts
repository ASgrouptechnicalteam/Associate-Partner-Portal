import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  createSiteVisit,
  getSiteVisits,
  getSiteVisitById,
  updateStatus,
  updateOutcome
} from '../controllers/siteVisitController';

const router = express.Router();

// All Site Visit routes require authentication
router.use(authenticate);

router.get('/', getSiteVisits);
router.post('/', createSiteVisit);
router.get('/:id', getSiteVisitById);
router.patch('/:id/status', updateStatus);
router.patch('/:id/outcome', updateOutcome);

export default router;

import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController';

const router = Router();

// Rate limiting should be applied here if available in the app.
// For now, no external dependency will be added as per instructions.

router.get('/:token', ReviewController.getPublicRequest);
router.post('/:token', ReviewController.submitReview);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { 
  getOffers, 
  getOfferById, 
  createOffer, 
  updateOffer, 
  deleteOffer
} from '../controllers/offerController';

const router = Router();

router.use(authenticate);

// Public reads (gated internally by role to restrict what associates see)
router.get('/', getOffers);
router.get('/:id', getOfferById);

// AM and MD routes
router.post('/', requireRole('MD', 'ASSOCIATE_MANAGER'), createOffer);
router.patch('/:id', requireRole('MD', 'ASSOCIATE_MANAGER'), updateOffer);
router.delete('/:id', requireRole('MD', 'ASSOCIATE_MANAGER'), deleteOffer);

export default router;

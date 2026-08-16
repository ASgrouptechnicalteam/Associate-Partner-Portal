import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { upload } from '../utils/fileUpload';
import { 
  getCarousels, 
  getCarouselById, 
  createCarousel, 
  updateCarousel, 
  deleteCarousel, 
  reorderCarousels,
  uploadCarouselImage
} from '../controllers/carouselController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Public reads (gated internally by role for includeInactive)
router.get('/', getCarousels);
router.get('/:id', getCarouselById);

// AM and MD routes
// Reorder route MUST be before the dynamic /:id route
router.patch('/reorder', requireRole('MD', 'ASSOCIATE_MANAGER'), reorderCarousels);

router.post('/', requireRole('MD', 'ASSOCIATE_MANAGER'), createCarousel);
router.post('/upload', requireRole('MD', 'ASSOCIATE_MANAGER'), upload.single('file'), uploadCarouselImage);

router.patch('/:id', requireRole('MD', 'ASSOCIATE_MANAGER'), updateCarousel);
router.delete('/:id', requireRole('MD', 'ASSOCIATE_MANAGER'), deleteCarousel);

export default router;

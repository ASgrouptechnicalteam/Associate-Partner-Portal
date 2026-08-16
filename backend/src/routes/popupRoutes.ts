import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { 
  getPopups, 
  getPopupById, 
  createPopup, 
  updatePopup, 
  deletePopup
} from '../controllers/popupController';

const router = Router();

router.use(authenticate);

router.get('/', getPopups);
router.get('/:id', getPopupById);

router.post('/', requireRole('MD', 'ASSOCIATE_MANAGER'), createPopup);
router.patch('/:id', requireRole('MD', 'ASSOCIATE_MANAGER'), updatePopup);
router.delete('/:id', requireRole('MD', 'ASSOCIATE_MANAGER'), deletePopup);

export default router;

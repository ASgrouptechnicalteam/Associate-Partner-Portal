import { Router } from 'express';
import { searchController } from '../controllers/searchController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);
router.get('/', searchController.globalSearch);

export default router;

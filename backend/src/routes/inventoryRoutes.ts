import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { 
  createInventoryUnit, 
  updateInventoryUnit, 
  updateInventoryStatus, 
  getInventoryByProject, 
  getInventoryUnitById 
} from '../controllers/inventoryController';
import { validateCreateInventory, validateUpdateInventoryStatus } from '../validators/inventoryValidator';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// Public (to authenticated users) but data is gated in controller
router.get('/project/:projectId', getInventoryByProject);
router.get('/:id', getInventoryUnitById);

// AM and MD routes
router.post('/', requireRole('MD', 'ASSOCIATE_MANAGER'), validateCreateInventory, createInventoryUnit);
router.patch('/:id', requireRole('MD', 'ASSOCIATE_MANAGER'), updateInventoryUnit);
router.patch('/:id/status', requireRole('MD', 'ASSOCIATE_MANAGER'), validateUpdateInventoryStatus, updateInventoryStatus);

export default router;

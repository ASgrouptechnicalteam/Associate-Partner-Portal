import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import { upload } from '../utils/fileUpload';
import {
  createTravelRequest,
  listTravelRequests,
  getTravelRequestById,
  submitRequest,
  reviewRequest,
  markPaid
} from '../controllers/travelController';

const router = Router();

// All travel routes require authentication
router.use(authenticate);

// Any authenticated user
router.get('/', listTravelRequests);
router.get('/:id', getTravelRequestById);

// File upload via multipart/form-data for bill; single field 'bill'
router.post('/', upload.single('bill'), createTravelRequest);

// Requester submits own request (PENDING → MD_REVIEW)
router.patch('/:id/submit', submitRequest);

// MD-only: review (approve or reject)
router.patch('/:id/review', requireRole('MD'), reviewRequest);

// MD-only: mark payment completed
router.patch('/:id/pay', requireRole('MD'), markPaid);

export default router;

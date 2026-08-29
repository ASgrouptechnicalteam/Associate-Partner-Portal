import { Router } from 'express';
import { 
  createDemoBooking,
  getDemoBookings,
  getDemoBookingById,
  updateDemoBookingStatus
} from '../controllers/demoBookingController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// Create Demo Booking
router.post('/', createDemoBooking);

// List Demo Bookings
router.get('/', getDemoBookings);

// Get specific Demo Booking
router.get('/:id', getDemoBookingById);

// Update Status
router.patch('/:id/status', updateDemoBookingStatus);

export default router;

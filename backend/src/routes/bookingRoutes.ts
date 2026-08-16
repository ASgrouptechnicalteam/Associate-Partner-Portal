import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  createBooking,
  getMyBookings,
  getTeamBookings,
  getAllBookings,
  getBookingById,
  updateBookingStatus
} from '../controllers/bookingController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Routes
router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.get('/team-bookings', getTeamBookings);
router.get('/', getAllBookings); // MD/AM only (controller checks)
router.get('/:id', getBookingById);
router.patch('/:id/status', updateBookingStatus); // MD/AM only (controller checks)

export default router;

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { BookingService } from '../services/bookingService';
import { z } from 'zod';

const createBookingSchema = z.object({
  projectId: z.string().uuid(),
  inventoryUnitId: z.string().uuid(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(10),
  alternatePhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerAddress: z.string().optional(),
  preferredLocation: z.string().optional(),
  bookingDate: z.string().datetime(),
  expectedAmount: z.number().positive(),
  paymentMode: z.string().min(2),
  bookingAmount: z.number().positive(),
  notes: z.string().optional(),
  documents: z.array(z.string()).optional() // Array of validated URLs/paths
});

const updateStatusSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'PAYMENT_PENDING', 'CANCELLED']),
  reason: z.string().optional()
});

export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const validatedData = createBookingSchema.parse(req.body);

    // Document protection: ensure no arbitrary paths
    if (validatedData.documents) {
      for (const doc of validatedData.documents) {
        if (doc.includes('..') || (!doc.startsWith('http') && !doc.startsWith('/uploads/'))) {
          return res.status(400).json({ success: false, message: 'Invalid document path detected.' });
        }
      }
    }

    const ipAddress = req.ip || req.socket.remoteAddress;

    const booking = await BookingService.createBooking(userId, validatedData, ipAddress);

    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    console.error('Booking creation error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create booking' });
  }
};

export const getMyBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const bookings = await BookingService.getBookingsList(userId, role, { view: 'MY' });
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch bookings' });
  }
};

export const getTeamBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Enforce role checks if needed, but BookingService handles hierarchy
    const bookings = await BookingService.getBookingsList(userId, role, { view: 'TEAM' });
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch team bookings' });
  }
};

export const getAllBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (role === 'ASSOCIATE') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const filters = req.query;
    const bookings = await BookingService.getBookingsList(userId, role, filters);
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch all bookings' });
  }
};

export const getBookingById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id as string;
    const booking = await BookingService.getBookingById(id, userId, role);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error: any) {
    res.status(403).json({ success: false, message: error.message || 'Failed to fetch booking' });
  }
};

export const updateBookingStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id as string;
    const validatedData = updateStatusSchema.parse(req.body);

    const ipAddress = req.ip || req.socket.remoteAddress;

    const booking = await BookingService.updateBookingStatus(id, validatedData.status, userId, role, validatedData.reason, ipAddress);

    res.json({ success: true, data: booking });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update status' });
  }
};

import { Request, Response } from 'express';
import { DemoBookingService } from '../services/demoBookingService';
import { z } from 'zod';

const createDemoBookingSchema = z.object({
  projectId: z.string().uuid(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  customerEmail: z.string().email().optional().nullable(),
  scheduledDate: z.string().datetime(), // expects ISO string
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  notes: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.string().min(1),
  outcome: z.string().optional()
});

export const createDemoBooking = async (req: Request, res: Response) => {
  try {
    const data = createDemoBookingSchema.parse(req.body);
    const userId = (req as any).user.id;
    const booking = await DemoBookingService.createDemoBooking(data, userId);
    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    console.error('createDemoBooking error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
    } else {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

export const getDemoBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const filters = {
      status: req.query.status ? String(req.query.status) : undefined,
      projectId: req.query.projectId ? String(req.query.projectId) : undefined
    };
    const bookings = await DemoBookingService.getDemoBookings(userId, role, filters);
    res.json({ success: true, data: bookings });
  } catch (error: any) {
    console.error('getDemoBookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve demo bookings' });
  }
};

export const getDemoBookingById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const booking = await DemoBookingService.getDemoBookingById(id, userId, role);
    res.json({ success: true, data: booking });
  } catch (error: any) {
    console.error('getDemoBookingById error:', error);
    if (error.message.includes('Forbidden')) {
      res.status(403).json({ success: false, message: error.message });
    } else {
      res.status(404).json({ success: false, message: error.message });
    }
  }
};

export const updateDemoBookingStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const data = updateStatusSchema.parse(req.body);

    const booking = await DemoBookingService.updateStatus(id, data.status, userId, role, data.outcome);
    res.json({ success: true, data: booking });
  } catch (error: any) {
    console.error('updateStatus error:', error);
    if (error.message.includes('Forbidden')) {
      res.status(403).json({ success: false, message: error.message });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
    } else {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

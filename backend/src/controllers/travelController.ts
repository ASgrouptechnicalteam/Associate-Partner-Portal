import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { TravelService } from '../services/travelService';

// ── Validators ────────────────────────────────────────────────────
const CreateTravelSchema = z.object({
  travelDate:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  fromLocation:    z.string().min(1, 'From location is required').max(255),
  toLocation:      z.string().min(1, 'To location is required').max(255),
  purpose:         z.string().min(3, 'Purpose is required').max(1000),
  projectId:       z.string().uuid().optional().or(z.literal('')),
  customerName:    z.string().max(255).optional().or(z.literal('')),
  distanceKm:      z.coerce.number().positive('Distance must be > 0'),
  travelMode:      z.enum(['OWN_VEHICLE', 'TAXI', 'PUBLIC_TRANSPORT', 'AUTO', 'OTHER']),
  amountRequested: z.coerce.number().positive('Amount must be > 0'),
  notes:           z.string().max(2000).optional().or(z.literal('')),
});

const ReviewSchema = z.object({
  decision:        z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().max(1000).optional(),
});

const PaySchema = z.object({
  amountPaid:   z.coerce.number().positive('Amount paid must be > 0'),
  paymentNotes: z.string().max(1000).optional(),
});

// ── Helpers ───────────────────────────────────────────────────────
function getIp(req: AuthenticatedRequest): string {
  return (req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress || 'unknown');
}

function sendValidationError(res: Response, error: z.ZodError) {
  const issues = (error as any).issues ?? (error as any).errors ?? [];
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: issues.map((e: any) => ({ field: Array.isArray(e.path) ? e.path.join('.') : '', message: e.message }))
  });
}

// ── Controllers ───────────────────────────────────────────────────

export const createTravelRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = CreateTravelSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(res, parsed.error);

    const data = parsed.data;
    // Clean empty optional strings to undefined
    const billUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const travel = await TravelService.createTravelRequest(
      req.user!.id,
      {
        travelDate:      data.travelDate,
        fromLocation:    data.fromLocation,
        toLocation:      data.toLocation,
        purpose:         data.purpose,
        projectId:       data.projectId || undefined,
        customerName:    data.customerName || undefined,
        distanceKm:      data.distanceKm,
        travelMode:      data.travelMode,
        amountRequested: data.amountRequested,
        notes:           data.notes || undefined,
      },
      billUrl,
      getIp(req)
    );

    return res.status(201).json({ success: true, data: travel });
  } catch (err: any) {
    console.error('createTravelRequest error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Server error' });
  }
};

export const listTravelRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, projectId } = req.query as Record<string, string>;
    const requests = await TravelService.listTravelRequests(
      req.user!.id,
      req.user!.role,
      { status, projectId }
    );
    return res.json({ success: true, data: requests });
  } catch (err: any) {
    console.error('listTravelRequests error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getTravelRequestById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const travel = await TravelService.getTravelRequestById(id, req.user!.id, req.user!.role);
    if (!travel) return res.status(404).json({ success: false, message: 'Travel request not found' });
    return res.json({ success: true, data: travel });
  } catch (err: any) {
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this request' });
    }
    console.error('getTravelRequestById error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const submitRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const updated = await TravelService.submitRequest(id, req.user!.id, req.user!.role, getIp(req));
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.message === 'FORBIDDEN') {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this request' });
    }
    console.error('submitRequest error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Server error' });
  }
};

export const reviewRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = ReviewSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(res, parsed.error);

    const { decision, rejectionReason } = parsed.data;
    const updated = await TravelService.reviewRequest(id, req.user!.id, decision, rejectionReason, getIp(req));
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('reviewRequest error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Server error' });
  }
};

export const markPaid = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = PaySchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(res, parsed.error);

    const { amountPaid, paymentNotes } = parsed.data;
    const updated = await TravelService.markPaid(id, req.user!.id, amountPaid, paymentNotes, getIp(req));
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('markPaid error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Server error' });
  }
};

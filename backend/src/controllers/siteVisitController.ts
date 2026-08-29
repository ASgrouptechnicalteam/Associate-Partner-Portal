import { Request, Response } from 'express';
import { SiteVisitService } from '../services/siteVisitService';
import { z } from 'zod';

const createSiteVisitSchema = z.object({
  projectId: z.string().uuid(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().min(1, 'Customer phone is required'),
  customerEmail: z.string().email().optional().nullable(),
  visitDate: z.string().datetime(), // expects ISO string
  visitTime: z.string().min(1, 'Visit time is required'),
  remarks: z.string().optional(),
  isDemo: z.boolean().optional()
});

const updateStatusSchema = z.object({
  status: z.string().min(1),
  outcome: z.string().optional()
});

export const createSiteVisit = async (req: Request, res: Response) => {
  try {
    const data = createSiteVisitSchema.parse(req.body);
    const userId = (req as any).user.id;
    const visit = await SiteVisitService.createSiteVisit(data, userId);
    res.status(201).json({ success: true, data: visit });
  } catch (error: any) {
    console.error('createSiteVisit error:', error);
    if (error instanceof z.ZodError) {
      console.error('Zod Validation errors:', JSON.stringify(error.issues, null, 2));
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
    } else {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

export const getSiteVisits = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const filters = {
      status: req.query.status ? String(req.query.status) : undefined,
      projectId: req.query.projectId ? String(req.query.projectId) : undefined,
      isDemo: req.query.isDemo !== undefined ? req.query.isDemo === 'true' : undefined
    };
    const visits = await SiteVisitService.getSiteVisits(userId, role, filters);
    res.json({ success: true, data: visits });
  } catch (error: any) {
    console.error('getSiteVisits error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve site visits' });
  }
};

export const getSiteVisitById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const visit = await SiteVisitService.getSiteVisitById(id, userId, role);
    res.json({ success: true, data: visit });
  } catch (error: any) {
    console.error('getSiteVisitById error:', error);
    if (error.message.includes('Forbidden')) {
      res.status(403).json({ success: false, message: error.message });
    } else {
      res.status(404).json({ success: false, message: error.message });
    }
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const data = updateStatusSchema.parse(req.body);

    const visit = await SiteVisitService.updateStatus(id, data.status, userId, role, data.outcome);
    res.json({ success: true, data: visit });
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

export const updateOutcome = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    
    const visit = await SiteVisitService.updateOutcome(id, req.body, userId, role);
    res.json({ success: true, data: visit });
  } catch (error: any) {
    console.error('updateOutcome error:', error);
    if (error.message.includes('Forbidden')) {
      res.status(403).json({ success: false, message: error.message });
    } else {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

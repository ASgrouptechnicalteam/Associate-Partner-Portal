import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { OfferService } from '../services/offerService';

export const getOffers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user?.role || 'ASSOCIATE';
    const items = await OfferService.getAll(role, req.user?.id);
    return res.status(200).json({ success: true, data: items });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getOfferById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await OfferService.getById(req.params.id as string);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    
    // Quick authorization check for associate.
    // If associate, only allow reading if it's active and targets ASSOCIATE or ALL.
    if (req.user?.role === 'ASSOCIATE') {
      if (item.status !== 'ACTIVE' && item.status !== 'SCHEDULED') { // Or just ACTIVE depending on strictness
         // We'll trust the getAll to filter lists, but for detail view, let's just allow it or block if archived
         if (item.status === 'ARCHIVED' || item.status === 'INACTIVE' || item.status === 'EXPIRED') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
         }
      }
      if (item.targetAudience === 'CUSTOMER') {
         return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    return res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error fetching offer:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, targetAudience, projectId, targetBookings, reward, startDate, endDate, status } = req.body;
    
    let finalStatus = status || 'ACTIVE';
    if (startDate && new Date(startDate) > new Date()) {
      finalStatus = 'SCHEDULED';
    }

    const item = await OfferService.create({
      title,
      description: description || null,
      targetAudience,
      project: projectId ? { connect: { id: projectId } } : undefined,
      targetBookings: targetBookings ? parseInt(targetBookings, 10) : null,
      reward: reward || null,
      status: finalStatus,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    } as any, req.user!.id);
    
    return res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    
    if (data.startDate !== undefined) data.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) data.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.targetBookings !== undefined) data.targetBookings = data.targetBookings ? parseInt(data.targetBookings, 10) : null;
    if (data.description === "") data.description = null;
    if (data.reward === "") data.reward = null;
    if (data.projectId) {
       data.project = { connect: { id: data.projectId } } as any;
    } else if (data.projectId === "") {
       data.project = { disconnect: true } as any;
    }
    delete data.projectId;

    if (data.startDate && new Date(data.startDate) > new Date() && data.status !== 'INACTIVE') {
      data.status = 'SCHEDULED';
    } else if (data.endDate && new Date(data.endDate) < new Date() && data.status !== 'INACTIVE') {
      data.status = 'EXPIRED';
    }

    const item = await OfferService.update(id as string, data as any, req.user!.id);
    return res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error updating offer:', error);
    if (error.message === 'Offer not found') return res.status(404).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await OfferService.delete(req.params.id as string, req.user!.id);
    return res.status(200).json({ success: true, message: 'Archived successfully' });
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    if (error.message === 'Offer not found') return res.status(404).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

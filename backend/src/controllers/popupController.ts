import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { PopupService } from '../services/popupService';

export const getPopups = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const includeInactive = userRole === 'MD' || userRole === 'CHANNEL_PARTNER_MANAGER';
    const items = await PopupService.getAll(includeInactive);
    return res.status(200).json({ success: true, data: items });
  } catch (error: any) {
    console.error('Error fetching popups:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getPopupById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await PopupService.getById(req.params.id as string);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error fetching popup:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createPopup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { heading, description, imageUrl, ctaLabel, ctaTargetUrl, projectId, status, startAt, endAt } = req.body;
    
    let finalStatus = status || 'ACTIVE';
    if (startAt && new Date(startAt) > new Date()) {
      finalStatus = 'SCHEDULED';
    }

    const item = await PopupService.create({
      heading,
      description: description || null,
      imageUrl: imageUrl || null,
      ctaLabel: ctaLabel || null,
      ctaTargetUrl: ctaTargetUrl || null,
      project: projectId ? { connect: { id: projectId } } : undefined,
      status: finalStatus,
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null
    } as any, req.user!.id);
    
    return res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error creating popup:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updatePopup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    
    if (data.startAt !== undefined) data.startAt = data.startAt ? new Date(data.startAt) : null;
    if (data.endAt !== undefined) data.endAt = data.endAt ? new Date(data.endAt) : null;
    if (data.description === "") data.description = null;
    if (data.imageUrl === "") data.imageUrl = null;
    if (data.ctaLabel === "") data.ctaLabel = null;
    if (data.ctaTargetUrl === "") data.ctaTargetUrl = null;
    if (data.projectId) {
       data.project = { connect: { id: data.projectId } } as any;
    } else if (data.projectId === "") {
       data.project = { disconnect: true } as any;
    }
    delete data.projectId;

    if (data.startAt && new Date(data.startAt) > new Date() && data.status !== 'INACTIVE') {
      data.status = 'SCHEDULED';
    } else if (data.endAt && new Date(data.endAt) < new Date() && data.status !== 'INACTIVE') {
      data.status = 'EXPIRED';
    }

    const item = await PopupService.update(id as string, data as any, req.user!.id);
    return res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error updating popup:', error);
    if (error.message === 'Popup not found') return res.status(404).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deletePopup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await PopupService.delete(req.params.id as string, req.user!.id);
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting popup:', error);
    if (error.message === 'Popup not found') return res.status(404).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

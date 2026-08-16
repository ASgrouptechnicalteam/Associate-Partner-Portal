import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CarouselService } from '../services/carouselService';

export const getCarousels = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const includeInactive = userRole === 'MD' || userRole === 'ASSOCIATE_MANAGER';
    const items = await CarouselService.getAll(includeInactive);
    return res.status(200).json({ success: true, data: items });
  } catch (error: any) {
    console.error('Error fetching carousels:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCarouselById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = await CarouselService.getById(req.params.id as string);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error fetching carousel:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createCarousel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, subtitle, imageUrl, ctaLabel, ctaTargetUrl, projectId, status, displayOrder, startAt, endAt } = req.body;
    
    // Status is determined by dates if startAt is future
    let finalStatus = status || 'ACTIVE';
    if (startAt && new Date(startAt) > new Date()) {
      finalStatus = 'SCHEDULED';
    }

    const item = await CarouselService.create({
      title: title || null,
      subtitle: subtitle || null,
      imageUrl,
      ctaLabel: ctaLabel || null,
      ctaTargetUrl: ctaTargetUrl || null,
      project: projectId ? { connect: { id: projectId } } : undefined,
      status: finalStatus,
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null
    } as any, req.user!.id);
    
    return res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error creating carousel:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateCarousel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    
    if (data.displayOrder !== undefined) data.displayOrder = parseInt(data.displayOrder, 10);
    if (data.startAt !== undefined) data.startAt = data.startAt ? new Date(data.startAt) : null;
    if (data.endAt !== undefined) data.endAt = data.endAt ? new Date(data.endAt) : null;
    if (data.title === "") data.title = null;
    if (data.subtitle === "") data.subtitle = null;
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
      data.status = 'EXPIRED'; // EXPIRED is valid for our internal checks, though Prisma schema might be standard ACTIVE/INACTIVE for carousel. Actually, for Carousel, status is ACTIVE/INACTIVE string default. We can store EXPIRED.
    }

    const item = await CarouselService.update(id as string, data as any, req.user!.id);
    return res.status(200).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error updating carousel:', error);
    if (error.message === 'Carousel item not found') return res.status(404).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteCarousel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await CarouselService.delete(req.params.id as string, req.user!.id);
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting carousel:', error);
    if (error.message === 'Carousel item not found') return res.status(404).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const reorderCarousels = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid payload. Expected { items: [{id, displayOrder}] }' });
    }
    await CarouselService.reorder(items, req.user!.id);
    return res.status(200).json({ success: true, message: 'Reordered successfully' });
  } catch (error: any) {
    console.error('Error reordering carousels:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const uploadCarouselImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    return res.status(200).json({ success: true, data: { url } });
  } catch (error: any) {
    console.error('Error uploading carousel image:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

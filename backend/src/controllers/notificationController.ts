import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { NotificationService } from '../services/notificationService';

export const listNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string | undefined;
    
    let isRead: boolean | undefined = undefined;
    if (req.query.isRead === 'true') isRead = true;
    if (req.query.isRead === 'false') isRead = false;

    const result = await NotificationService.listForUser(userId, { page, limit, category, isRead });
    res.status(200).json(result);
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await NotificationService.getUnreadCount(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notificationId = req.params.id as string;
    const userId = req.user!.id;
    
    const notification = await NotificationService.markAsRead(notificationId, userId);
    res.status(200).json(notification);
  } catch (error: any) {
    console.error('Mark as read error:', error);
    if (error.message === 'Notification not found') {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    if (error.message === 'Forbidden') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await NotificationService.markAllAsRead(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

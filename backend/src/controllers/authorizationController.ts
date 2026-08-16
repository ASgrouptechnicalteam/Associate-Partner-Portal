import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import AuthorizationService from '../services/authorizationService';

export const getPendingAuthorizationSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await AuthorizationService.getPendingAuthorizations();
    return res.status(200).json({ success: true, data: summary });
  } catch (error: any) {
    console.error('getPendingAuthorizationSummary error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

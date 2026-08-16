import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    sessionId?: string;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { status: true, activeSessionId: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: `Account is ${user.status}` });
    }

    // Single-device policy for MD and ASSOCIATE_MANAGER
    if (decoded.role === 'MD' || decoded.role === 'ASSOCIATE_MANAGER') {
      if (user.activeSessionId && user.activeSessionId !== decoded.sessionId) {
        // Clear token so client knows they're fully logged out
        res.clearCookie('token', { path: '/' });
        return res.status(401).json({ 
          success: false, 
          message: 'Active Session Detected: This account is already active on another device. Please log out from the existing device before trying again.' 
        });
      }
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const roleCheck = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

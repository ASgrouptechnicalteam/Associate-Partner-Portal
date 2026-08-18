import { Request, Response } from 'express';
import { loginSchema, changePasswordSchema } from '../validators/authValidator';
import * as authService from '../services/authService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.loginUser(validatedData.associateId, validatedData.password);

    if (!result.success) {
      return res.status(result.status || 401).json({ success: false, message: result.message });
    }

    // Set HttpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/',
    });

    return res.status(200).json({ success: true, user: result.user });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: error.errors });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('token', { path: '/' });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const result = await authService.getUserById(req.user.id);
    if (!result.success) {
      // Clear token if user not found or inactive
      res.clearCookie('token', { path: '/' });
      return res.status(result.status || 401).json({ success: false, message: result.message });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({ success: true, user: result.user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const changeInitialPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const validatedData = changePasswordSchema.parse(req.body);
    
    const result = await authService.changeInitialPassword(
      req.user.id, 
      validatedData.currentPassword, 
      validatedData.newPassword
    );

    if (!result.success) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, message: 'Invalid input', errors: error.errors });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

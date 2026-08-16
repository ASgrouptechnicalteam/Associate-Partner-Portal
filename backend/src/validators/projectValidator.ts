import { Request, Response, NextFunction } from 'express';

export const validateCreateProject = (req: Request, res: Response, next: NextFunction) => {
  const { code, name, location, projectType } = req.body;
  if (!code || !name || !location || !projectType) {
    return res.status(400).json({ success: false, message: 'code, name, location, and projectType are required.' });
  }
  next();
};

export const validateUpdateProject = (req: Request, res: Response, next: NextFunction) => {
  // Add more specific validations if needed
  next();
};

export const validateProjectRejection = (req: Request, res: Response, next: NextFunction) => {
  const { rejectionReason } = req.body;
  if (!rejectionReason || rejectionReason.trim() === '') {
    return res.status(400).json({ success: false, message: 'rejectionReason is required when rejecting a project.' });
  }
  next();
};

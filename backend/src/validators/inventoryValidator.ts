import { Request, Response, NextFunction } from 'express';

export const validateCreateInventory = (req: Request, res: Response, next: NextFunction) => {
  const { projectId, unitNumber, propertyType, price } = req.body;
  if (!projectId || !unitNumber || !propertyType || price === undefined) {
    return res.status(400).json({ success: false, message: 'projectId, unitNumber, propertyType, and price are required.' });
  }
  next();
};

export const validateUpdateInventory = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const validateUpdateInventoryStatus = (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  if (!status || !['AVAILABLE', 'BOOKED', 'BLOCKED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing status.' });
  }
  next();
};

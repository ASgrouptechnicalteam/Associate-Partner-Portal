import { Request, Response, NextFunction } from 'express';

export const validateCreateInventory = (req: Request, res: Response, next: NextFunction) => {
  const { projectId, unitNumber, propertyType, price, facing, area, northBoundary, southBoundary, eastBoundary, westBoundary, towerBlock, floor } = req.body;
  if (!projectId || !unitNumber || !propertyType || price === undefined) {
    return res.status(400).json({ success: false, message: 'projectId, unitNumber, propertyType, and price are required.' });
  }
  
  if (propertyType === 'PLOT') {
    if (!area) return res.status(400).json({ success: false, message: 'area is required for plots.' });
  } else if (propertyType === 'APARTMENT' || propertyType === 'UNIT') {
    if (!towerBlock || !floor) return res.status(400).json({ success: false, message: 'towerBlock and floor are required for apartments.' });
  }
  
  next();
};

export const validateUpdateInventory = (req: Request, res: Response, next: NextFunction) => {
  const { propertyType, area, towerBlock, floor } = req.body;
  
  if (propertyType === 'PLOT') {
    if (area === null) return res.status(400).json({ success: false, message: 'area cannot be null for plots.' });
  } else if (propertyType === 'APARTMENT' || propertyType === 'UNIT') {
    if (towerBlock === null || floor === null) return res.status(400).json({ success: false, message: 'towerBlock and floor cannot be null for apartments.' });
  }
  
  next();
};

export const validateUpdateInventoryStatus = (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  if (!status || !['AVAILABLE', 'BOOKED', 'BLOCKED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing status.' });
  }
  next();
};

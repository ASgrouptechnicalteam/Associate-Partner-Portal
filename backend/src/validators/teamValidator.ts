import { Request, Response, NextFunction } from 'express';

export const validateTeamRelationship = (req: Request, res: Response, next: NextFunction) => {
  const { childAssociateId } = req.body;
  if (!childAssociateId) {
    return res.status(400).json({ success: false, message: 'childAssociateId is required' });
  }
  next();
};

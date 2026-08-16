import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { InventoryService } from '../services/inventoryService';

export const createInventoryUnit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const unit = await InventoryService.createInventoryUnit(req.body);
    return res.status(201).json({ success: true, data: unit });
  } catch (error: any) {
    console.error('Error creating inventory:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Unit number already exists in this project' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateInventoryUnit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const unit = await InventoryService.updateInventoryUnit(id, req.body);
    return res.status(200).json({ success: true, data: unit });
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateInventoryStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body;
    const unit = await InventoryService.updateInventoryStatus(id, status);
    return res.status(200).json({ success: true, data: unit });
  } catch (error: any) {
    console.error('Error updating inventory status:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getInventoryByProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params as { projectId: string };
    const isManager = req.user!.role === 'MD' || req.user!.role === 'ASSOCIATE_MANAGER';
    const inventory = await InventoryService.getInventoryByProject(projectId, isManager);
    return res.status(200).json({ success: true, data: inventory });
  } catch (error: any) {
    console.error('Error getting project inventory:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getInventoryUnitById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const isManager = req.user!.role === 'MD' || req.user!.role === 'ASSOCIATE_MANAGER';
    const unit = await InventoryService.getInventoryUnitById(id, isManager);
    if (!unit) {
      return res.status(404).json({ success: false, message: 'Inventory not found or access denied' });
    }
    return res.status(200).json({ success: true, data: unit });
  } catch (error: any) {
    console.error('Error getting inventory by id:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

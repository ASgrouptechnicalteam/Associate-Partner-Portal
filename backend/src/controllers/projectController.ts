import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ProjectService } from '../services/projectService';

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const project = await ProjectService.createProject(req.body, userId);
    return res.status(201).json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error creating project:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Project code already exists' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const project = await ProjectService.updateProject(id, req.body);
    return res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error updating project:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const submitProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const project = await ProjectService.submitProject(id);
    return res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error submitting project:', error);
    return res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
};

export const approveProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user!.id;
    const project = await ProjectService.approveProject(id, userId);
    return res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error approving project:', error);
    return res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
};

export const rejectProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { rejectionReason } = req.body;
    const userId = req.user!.id;
    const project = await ProjectService.rejectProject(id, rejectionReason, userId);
    return res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error rejecting project:', error);
    return res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
};

export const toggleHotStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { isHot } = req.body;
    
    // Only MD and Channel Partner Manager can toggle hot status
    const role = req.user!.role;
    if (role !== 'MD' && role !== 'CHANNEL_PARTNER_MANAGER') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only management can toggle hot status' });
    }

    const project = await ProjectService.toggleHotStatus(id, Boolean(isHot));
    return res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error toggling hot status:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const toggleFeaturedStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { isFeatured } = req.body;
    
    const role = req.user!.role;
    if (role !== 'MD' && role !== 'CHANNEL_PARTNER_MANAGER') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only management can toggle featured status' });
    }

    const project = await ProjectService.toggleFeaturedStatus(id, Boolean(isFeatured));
    return res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error toggling featured status:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    
    const role = req.user!.role;
    if (role !== 'MD' && role !== 'CHANNEL_PARTNER_MANAGER') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only management can delete projects' });
    }

    await ProjectService.safeDeleteProject(id);
    return res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const archiveProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const project = await ProjectService.archiveProject(id);
    return res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error archiving project:', error);
    return res.status(400).json({ success: false, message: 'Server error' });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isManager = req.user!.role === 'MD' || req.user!.role === 'CHANNEL_PARTNER_MANAGER';
    
    let projects;
    if (isManager) {
      projects = await ProjectService.getAllProjectsForManagement();
    } else {
      projects = await ProjectService.getProjectsForAssociates();
    }
    
    return res.status(200).json({ success: true, data: projects });
  } catch (error: any) {
    console.error('Error getting projects:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const isManager = req.user!.role === 'MD' || req.user!.role === 'CHANNEL_PARTNER_MANAGER';
    
    const project = await ProjectService.getProjectById(id, isManager);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or access denied' });
    }
    
    return res.status(200).json({ success: true, data: project });
  } catch (error: any) {
    console.error('Error getting project by id:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

import { Request, Response } from 'express';
import { TutorialService } from '../services/tutorialService';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

const tutorialService = new TutorialService();

export const getTutorials = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role || 'ASSOCIATE';
    const tutorials = await tutorialService.getTutorials(userRole);
    res.json({ success: true, data: tutorials });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTutorialBySlug = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role || 'ASSOCIATE';
    const tutorial = await tutorialService.getTutorialBySlug(req.params.slug as string, userRole);
    res.json({ success: true, data: tutorial });
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTutorial = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tutorial = await tutorialService.createTutorial(req.body, req.user.id);
    res.status(201).json({ success: true, data: tutorial });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTutorial = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tutorial = await tutorialService.updateTutorial(req.params.id as string, req.body, req.user.id);
    res.json({ success: true, data: tutorial });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTutorial = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tutorial = await tutorialService.deleteTutorial(req.params.id as string, req.user.id);
    res.json({ success: true, data: tutorial });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createTutorialStep = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const step = await tutorialService.createTutorialStep(req.params.id as string, req.body, req.user.id);
    res.status(201).json({ success: true, data: step });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTutorialStep = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const step = await tutorialService.updateTutorialStep(req.params.stepId as string, req.body, req.user.id);
    res.json({ success: true, data: step });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTutorialStep = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const step = await tutorialService.deleteTutorialStep(req.params.stepId as string, req.user.id);
    res.json({ success: true, data: step });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

import { Request, Response } from 'express';
import { FaqService } from '../services/faqService';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

const faqService = new FaqService();

export const getFaqs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role || 'ASSOCIATE';
    const faqs = await faqService.getFaqs(userRole);
    res.json({ success: true, data: faqs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFaqById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role || 'ASSOCIATE';
    const faq = await faqService.getFaqById(req.params.id as string, userRole);
    res.json({ success: true, data: faq });
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

export const createFaq = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const faq = await faqService.createFaq(req.body, req.user.id);
    res.status(201).json({ success: true, data: faq });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateFaq = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const faq = await faqService.updateFaq(req.params.id as string, req.body, req.user.id);
    res.json({ success: true, data: faq });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFaq = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const faq = await faqService.deleteFaq(req.params.id as string, req.user.id);
    res.json({ success: true, data: faq });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

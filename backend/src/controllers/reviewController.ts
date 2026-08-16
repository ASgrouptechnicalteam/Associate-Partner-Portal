import { Request, Response } from 'express';
import { ReviewService } from '../services/reviewService';
import { createReviewRequestSchema, submitReviewSchema } from '../validators/reviewValidator';
import { AuditService } from '../services/auditService';

export class ReviewController {
  static async createRequest(req: Request, res: Response) {
    try {
      const { bookingId, interactionSummary } = createReviewRequestSchema.parse(req.body);
      const associateId = (req as any).user.id;

      const reviewRequest = await ReviewService.createReviewRequest(associateId, bookingId, interactionSummary);
      res.status(201).json({ success: true, data: reviewRequest });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Invalid input', errors: error.errors });
      }
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getRequests(req: Request, res: Response) {
    try {
      const requests = await ReviewService.getReviewRequests((req as any).user.id, (req as any).user.role);
      res.json({ success: true, data: requests });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAnalytics(req: Request, res: Response) {
    try {
      const analytics = await ReviewService.getAnalytics((req as any).user.id, (req as any).user.role);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPublicRequest(req: Request, res: Response) {
    try {
      const token = req.params.token as string;
      const reviewRequest = await ReviewService.getPublicReviewRequest(token);
      res.json({ success: true, data: reviewRequest });
    } catch (error: any) {
      res.status(404).json({ success: false, message: 'Invalid or expired review link' });
    }
  }

  static async submitReview(req: Request, res: Response) {
    try {
      const token = req.params.token as string;
      const data = submitReviewSchema.parse(req.body);
      const ip = (req.ip || req.socket.remoteAddress) as string;

      const review = await ReviewService.submitReview(token, data, ip);
      res.status(201).json({ success: true, data: review });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Invalid input', errors: error.errors });
      }
      if (error.message === 'Invalid token') {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message === 'Review already submitted') {
        return res.status(409).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // To catch unauthorized mutations from authenticated routes if requested
  static async blockMutation(req: Request, res: Response) {
    // Log unauthorized mutation
    await AuditService.log(
      (req as any).user ? (req as any).user.id : 'UNKNOWN',
      'UNAUTHORIZED_REVIEW_MUTATION_ATTEMPT',
      'Review',
      (req.params.id as string) || 'UNKNOWN'
    );
    res.status(403).json({ success: false, message: 'Reviews are immutable and cannot be edited' });
  }
}

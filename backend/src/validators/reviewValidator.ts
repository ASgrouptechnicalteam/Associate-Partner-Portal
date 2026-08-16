import { z } from 'zod';

export const createReviewRequestSchema = z.object({
  bookingId: z.string().uuid(),
  interactionSummary: z.string().optional()
});

export const submitReviewSchema = z.object({
  overallExperience: z.number().int().min(1).max(5),
  communication: z.number().int().min(1).max(5),
  propertyExperience: z.number().int().min(1).max(5),
  associateSupport: z.number().int().min(1).max(5),
  writtenReview: z.string().optional()
});

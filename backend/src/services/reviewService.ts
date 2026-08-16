import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { AuditService } from './auditService';
import { TeamService } from './teamService';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

export class ReviewService {
  static async createReviewRequest(associateId: string, bookingId: string, interactionSummary?: string) {
    // Check if booking belongs to associate and is VERIFIED
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { associate: true }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.associateId !== associateId) {
      throw new Error('Unauthorized: Booking does not belong to you');
    }

    if (booking.status !== 'VERIFIED') {
      throw new Error('Unauthorized: Only VERIFIED bookings are eligible for review requests');
    }

    // Check if review request already exists for this booking
    const existing = await prisma.reviewRequest.findUnique({
      where: { bookingId }
    });
    if (existing) {
      throw new Error('Review request already exists for this booking');
    }

    const token = crypto.randomBytes(32).toString('hex');

    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        token,
        associateId,
        projectId: booking.projectId,
        bookingId,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        interactionSummary
      }
    });

    await AuditService.log(
      associateId,
      'CREATE_REVIEW_REQUEST',
      'ReviewRequest',
      reviewRequest.id,
      undefined,
      reviewRequest
    );

    return reviewRequest;
  }

  static async getReviewRequests(userId: string, roleName: string) {
    if (roleName === 'ASSOCIATE') {
      return prisma.reviewRequest.findMany({
        where: { associateId: userId },
        include: {
          project: { select: { name: true } },
          booking: { select: { unitNumber: true, status: true, customerName: true, inventoryUnit: { select: { unitNumber: true } } } },
          review: true
        },
        orderBy: { requestDate: 'desc' }
      });
    } else if (roleName === 'ASSOCIATE_MANAGER' || roleName === 'MD') {
      let associateIds: string[] | undefined;
      
      if (roleName === 'ASSOCIATE_MANAGER') {
        const downline = await TeamService.getFullDownline(userId);
        associateIds = downline;
      }
      // MD sees all

      return prisma.reviewRequest.findMany({
        where: associateIds ? { associateId: { in: associateIds } } : undefined,
        include: {
          associate: { select: { name: true, associateId: true } },
          project: { select: { name: true } },
          booking: { select: { status: true, customerName: true, inventoryUnit: { select: { unitNumber: true } } } },
          review: true
        },
        orderBy: { requestDate: 'desc' }
      });
    }

    return [];
  }

  static async getPublicReviewRequest(token: string) {
    const request = await prisma.reviewRequest.findUnique({
      where: { token },
      select: {
        token: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        requestDate: true,
        status: true,
        interactionSummary: true,
        associate: { select: { name: true } },
        project: { select: { name: true } },
        booking: { select: { inventoryUnit: { select: { propertyType: true } } } }
      }
    });

    if (!request) {
      throw new Error('Invalid token');
    }

    return request;
  }

  static async submitReview(token: string, data: { overallExperience: number, communication: number, propertyExperience: number, associateSupport: number, writtenReview?: string }, requestIp?: string) {
    return prisma.$transaction(async (tx) => {
      const reviewRequest = await tx.reviewRequest.findUnique({
        where: { token }
      });

      if (!reviewRequest) {
        throw new Error('Invalid token');
      }

      if (reviewRequest.status !== 'PENDING') {
        throw new Error('Review already submitted');
      }

      const review = await tx.review.create({
        data: {
          reviewRequestId: reviewRequest.id,
          overallExperience: data.overallExperience,
          communication: data.communication,
          propertyExperience: data.propertyExperience,
          associateSupport: data.associateSupport,
          writtenReview: data.writtenReview
        }
      });

      await tx.reviewRequest.update({
        where: { id: reviewRequest.id },
        data: { status: 'SUBMITTED' }
      });

      await tx.auditLog.create({
        data: {
          actor: 'CUSTOMER',
          action: 'SUBMIT_REVIEW',
          entity: 'Review',
          entityId: review.id,
          afterJson: review,
          metadata: { ip: requestIp }
        }
      });

      await NotificationService.createNotification({
        userId: reviewRequest.associateId,
        category: 'Review',
        title: 'New Review Submitted',
        message: `Your customer ${reviewRequest.customerName} has submitted a review for their booking.`,
        entityType: 'Review',
        entityId: review.id,
        actionUrl: `/reviews`,
        eventKey: `REVIEW_SUBMITTED_${review.id}`
      }, tx as any);

      return review;
    });
  }

  static async getAnalytics(userId: string, roleName: string) {
    // Only MD gets all analytics easily, AM gets their downline
    if (roleName === 'ASSOCIATE') {
      throw new Error('Unauthorized');
    }

    let associateIds: string[] | undefined;
    if (roleName === 'ASSOCIATE_MANAGER') {
      associateIds = await TeamService.getFullDownline(userId);
    }

    const whereAssociate = associateIds ? { associateId: { in: associateIds } } : {};

    const [totalReviews, averageRatings, totalBookings, totalSiteVisits, commissionSum] = await Promise.all([
      prisma.review.count({
        where: { reviewRequest: whereAssociate }
      }),
      prisma.review.aggregate({
        _avg: {
          overallExperience: true,
          communication: true,
          propertyExperience: true,
          associateSupport: true
        },
        where: { reviewRequest: whereAssociate }
      }),
      prisma.booking.count({
        where: { ...whereAssociate, status: 'VERIFIED' }
      }),
      prisma.siteVisit.count({
        where: { ...whereAssociate }
      }),
      prisma.commissionTransaction.aggregate({
        _sum: { amountCalculated: true },
        where: { ...whereAssociate }
      })
    ]);

    const conversion = totalSiteVisits > 0 ? (totalBookings / totalSiteVisits) * 100 : 0;
    
    // Average rating over all 4 metrics
    const avgMap = averageRatings._avg;
    let avgTotalRating = 0;
    if (avgMap.overallExperience !== null) {
      avgTotalRating = (
        (avgMap.overallExperience || 0) +
        (avgMap.communication || 0) +
        (avgMap.propertyExperience || 0) +
        (avgMap.associateSupport || 0)
      ) / 4;
    }

    return {
      totalReviews,
      averageRating: avgTotalRating,
      details: {
        overallExperience: avgMap.overallExperience || 0,
        communication: avgMap.communication || 0,
        propertyExperience: avgMap.propertyExperience || 0,
        associateSupport: avgMap.associateSupport || 0,
      },
      bookings: totalBookings,
      siteVisits: totalSiteVisits,
      conversion: parseFloat(conversion.toFixed(2)),
      commissionGenerated: Number(commissionSum._sum.amountCalculated || 0)
    };
  }
}

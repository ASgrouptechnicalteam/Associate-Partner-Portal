import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { TeamService } from '../services/teamService';
import { AuditService } from '../services/auditService';
import { NotificationService } from '../services/notificationService';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Safe DTO mapper to exclude sensitive data
const mapSafeUser = (user: any) => ({
  id: user.id,
  associateId: user.associateId,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  upline: user.upline
});

export const getMyDownline = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    
    let whereClause: any = { status: 'ACTIVE', id: { not: userId } };
    
    if (userRole !== 'MD' && userRole !== 'ASSOCIATE_MANAGER') {
      const downlineIds = await TeamService.getFullDownline(userId);
      whereClause.id = { in: downlineIds };
    }

    const downlineUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        associateId: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: { select: { name: true } },
        createdAt: true,
        upline: { select: { parentAssociateId: true } },
        _count: {
          select: {
            bookings: true,
            siteVisits: true
          }
        },
        commissionTransactions: {
          where: { status: 'RECEIVED' },
          select: { amountCalculated: true }
        }
      }
    });

    // Compute total commission for each user
    const downlineWithKPIs = downlineUsers.map((user: any) => {
      const totalCommission = user.commissionTransactions?.reduce((sum: number, txn: any) => sum + Number(txn.amountCalculated), 0) || 0;
      return {
        ...user,
        commissionTransactions: undefined, // remove raw transactions
        totalCommission,
        bookingsCount: user._count?.bookings || 0,
        siteVisitsCount: user._count?.siteVisits || 0
      };
    });

    return res.status(200).json({ success: true, data: downlineWithKPIs });
  } catch (error: any) {
    console.error('Error fetching downline:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getTeamHierarchy = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const relationships = await prisma.teamRelationship.findMany({
      where: { status: 'ACTIVE' },
      include: {
        parent: { select: { id: true, associateId: true, name: true, role: { select: { name: true } } } },
        child: { select: { id: true, associateId: true, name: true, role: { select: { name: true } } } }
      }
    });
    return res.status(200).json({ success: true, data: relationships });
  } catch (error: any) {
    console.error('Error fetching team hierarchy:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getTeamStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // If targetId is provided, enforce downward hierarchy visibility
    const targetId = req.query.targetId as string;
    let effectiveUserId = userId;

    if (targetId && targetId !== userId) {
      if (req.user!.role === 'MD') {
        effectiveUserId = targetId;
      } else {
        const isInDownline = await TeamService.isAssociateInDownline(userId, targetId);
        if (!isInDownline) {
          return res.status(403).json({ success: false, message: 'Forbidden: Target is outside permitted hierarchy' });
        }
        effectiveUserId = targetId;
      }
    }

    const stats = await TeamService.getTeamStatistics(effectiveUserId);
    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching team statistics:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// --- TEAM REQUESTS WORKFLOW ---

const createRequestSchema = z.object({
  targetAssociateId: z.string().uuid(),
  proposedParentId: z.string().uuid().optional().nullable(),
  requestType: z.enum(['ADD', 'REMOVE']),
  reason: z.string().optional()
});

export const createTeamRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetAssociateId, proposedParentId, requestType, reason } = createRequestSchema.parse(req.body);
    const requesterId = req.user!.id;

    // Additional validations
    if (requestType === 'ADD' && !proposedParentId) {
      return res.status(400).json({ success: false, message: 'proposedParentId is required for ADD request' });
    }

    if (proposedParentId === targetAssociateId) {
      return res.status(400).json({ success: false, message: 'Cannot assign user to themselves' });
    }

    const teamReq = await prisma.teamRequest.create({
      data: {
        requesterId,
        targetAssociateId,
        proposedParentId,
        requestType,
        reason,
        status: 'PENDING'
      }
    });

    await AuditService.log(requesterId, 'CREATE_TEAM_REQUEST', 'TeamRequest', teamReq.id, null, teamReq);

    return res.status(201).json({ success: true, data: teamReq });
  } catch (error: any) {
    console.error('Error creating team request:', error);
    return res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getTeamRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    let whereClause: any = {};
    if (role === 'ASSOCIATE') {
      whereClause = { requesterId: userId };
    } else if (role === 'ASSOCIATE_MANAGER') {
      // AM might see all or just their own, let's let them see all for now to manage
      whereClause = {}; 
    }

    const requests = await prisma.teamRequest.findMany({
      where: whereClause,
      include: {
        requester: { select: { id: true, name: true, associateId: true } },
        targetAssociate: { select: { id: true, name: true, associateId: true } },
        proposedParent: { select: { id: true, name: true, associateId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    console.error('Error fetching team requests:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const approveTeamRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = String(req.params.id);
    const reviewerId = req.user!.id;

    const result = await prisma.$transaction(async (tx) => {
      const teamReq = await tx.teamRequest.findUnique({ where: { id: requestId } });
      if (!teamReq) throw new Error('Request not found');
      if (teamReq.status !== 'PENDING') throw new Error('Request is not PENDING');

      if (teamReq.requestType === 'ADD' && teamReq.proposedParentId) {
        await TeamService.assignAssociateToParentTx(tx, teamReq.proposedParentId, teamReq.targetAssociateId);
      } else if (teamReq.requestType === 'REMOVE') {
        await TeamService.removeAssociateFromParentTx(tx, teamReq.targetAssociateId);
      }

      const updated = await tx.teamRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', reviewedBy: reviewerId, reviewedAt: new Date() }
      });

      await AuditService.logWithTx(tx, reviewerId, 'APPROVE_TEAM_REQUEST', 'TeamRequest', requestId, teamReq, updated);

      await NotificationService.createNotification({
        userId: teamReq.requesterId,
        category: 'Team',
        title: 'Team Request Approved',
        message: `Your team request to ${teamReq.requestType.toLowerCase()} associate has been approved.`,
        entityType: 'TeamRequest',
        entityId: requestId,
        actionUrl: `/team`,
        eventKey: `TEAM_APPROVED_${requestId}`
      }, tx as any);

      return updated;
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error approving team request:', error);
    return res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
};

export const rejectTeamRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = String(req.params.id);
    const reviewerId = req.user!.id;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const teamReq = await prisma.teamRequest.findUnique({ where: { id: requestId } });
    if (!teamReq) return res.status(404).json({ success: false, message: 'Request not found' });
    if (teamReq.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Request is not PENDING' });

    const updated = await prisma.teamRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', reviewedBy: reviewerId, reviewedAt: new Date(), rejectionReason }
    });

    await AuditService.log(reviewerId, 'REJECT_TEAM_REQUEST', 'TeamRequest', requestId, teamReq, updated);

    await NotificationService.createNotification({
      userId: teamReq.requesterId,
      category: 'Team',
      title: 'Team Request Rejected',
      message: `Your team request to ${teamReq.requestType.toLowerCase()} associate has been rejected.`,
      entityType: 'TeamRequest',
      entityId: requestId,
      actionUrl: `/team`,
      eventKey: `TEAM_REJECTED_${requestId}`
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error rejecting team request:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

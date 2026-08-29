import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { TeamService } from '../services/teamService';
import { AuditService } from '../services/auditService';
import { NotificationService } from '../services/notificationService';
import { HierarchyService } from '../services/hierarchyService';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Safe DTO mapper to exclude sensitive data
const mapSafeUser = (user: any) => ({
  id: user.id,
  userIdentifier: user.userIdentifier,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  parentId: user.parentId
});

export const getMyDownline = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    
    let whereClause: any = { status: 'ACTIVE', id: { not: userId } };
    
    if (userRole !== 'MD') {
      const downlineIds = await TeamService.getFullDownline(userId);
      whereClause.id = { in: downlineIds };
    }

    const downlineUsers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        userIdentifier: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: { select: { name: true } },
        createdAt: true,
        parentId: true,
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
    const relationships = await prisma.user.findMany({
      where: { parentId: { not: null } },
      select: {
        id: true,
        userIdentifier: true,
        name: true,
        role: { select: { name: true } },
        parent: { select: { id: true, userIdentifier: true, name: true, role: { select: { name: true } } } }
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
  targetUserId: z.string().uuid(),
  proposedParentId: z.string().uuid().optional().nullable(),
  requestType: z.enum(['ADD', 'REMOVE']),
  reason: z.string().optional()
});

export const createTeamRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetUserId, proposedParentId, requestType, reason } = createRequestSchema.parse(req.body);
    const requesterId = req.user!.id;

    // Additional validations
    if (requestType === 'ADD' && !proposedParentId) {
      return res.status(400).json({ success: false, message: 'proposedParentId is required for ADD request' });
    }

    if (proposedParentId === targetUserId) {
      return res.status(400).json({ success: false, message: 'Cannot assign user to themselves' });
    }

    const teamReq = await prisma.teamRequest.create({
      data: {
        requesterId,
        targetUserId,
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
    } else if (role === 'CHANNEL_PARTNER_MANAGER') {
      // AM might see all or just their own, let's let them see all for now to manage
      whereClause = {}; 
    }

    const requests = await prisma.teamRequest.findMany({
      where: whereClause,
      include: {
        requester: { select: { id: true, name: true, userIdentifier: true } },
        targetUser: { select: { id: true, name: true, userIdentifier: true } },
        proposedParent: { select: { id: true, name: true, userIdentifier: true } }
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
        await TeamService.assignAssociateToParentTx(tx, teamReq.proposedParentId, teamReq.targetUserId);
      } else if (teamReq.requestType === 'REMOVE') {
        await TeamService.removeAssociateFromParentTx(tx, teamReq.targetUserId);
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

export const getTeams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const where: any = {};
    if (req.user!.role !== 'MD' && req.user!.role !== 'CHANNEL_PARTNER_MANAGER') {
      const currentUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (currentUser?.teamId) {
        where.id = currentUser.teamId;
      } else {
        return res.json({ success: true, data: [] }); // User has no team
      }
    }

    const teams = await prisma.team.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    // Fetch head users and stats
    const teamsWithStats = await Promise.all(teams.map(async (team) => {
      let headUser = null;
      if (team.headUserId) {
        headUser = await prisma.user.findUnique({
          where: { id: team.headUserId },
          select: { id: true, userIdentifier: true, name: true, email: true, designation: true, profileImageUrl: true }
        });
      }
      
      const totalMembers = await prisma.user.count({ where: { teamId: team.id } });
      const activeMembers = await prisma.user.count({ where: { teamId: team.id, status: 'ACTIVE' } });
      
      let directMembers = 0;
      if (headUser) {
         directMembers = await prisma.user.count({ where: { teamId: team.id, parentId: headUser.id } });
      }

      return {
        ...team,
        headUser,
        totalMembers,
        activeMembers,
        directMembers
      };
    }));

    return res.json({ success: true, data: teamsWithStats });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch teams' });
  }
};

export const createTeam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, headUserId, memberIds } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Team name is required' });

    // Ensure uniqueness if needed
    const existing = await prisma.team.findFirst({ where: { name } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Team name already exists' });
    }

    // Resolve headUserId
    let actualHeadId = null;
    if (headUserId) {
      const headUser = await prisma.user.findFirst({ where: { OR: [{ id: headUserId }, { userIdentifier: headUserId }] } });
      if (headUser) {
        if (headUser.designation !== 'Marketing Director') {
          return res.status(400).json({ success: false, message: 'Only users with designation Marketing Director can be assigned as Team Head.' });
        }
        actualHeadId = headUser.id;
      }
      else return res.status(400).json({ success: false, message: 'Invalid Team Head ID' });
    }

    // Resolve memberIds
    let actualMemberIds: string[] = [];
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      const users = await prisma.user.findMany({ where: { OR: [{ id: { in: memberIds } }, { userIdentifier: { in: memberIds } }] } });
      actualMemberIds = users.map(u => u.id);
    }

    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: {
          name,
          headUserId: actualHeadId
        }
      });

      if (actualHeadId) {
        await tx.user.update({
          where: { id: actualHeadId },
          data: { teamId: newTeam.id }
        });
      }

      if (actualMemberIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: actualMemberIds } },
          data: { teamId: newTeam.id }
        });
      }

      return newTeam;
    });

    return res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error('Error creating team:', error);
    return res.status(500).json({ success: false, message: 'Failed to create team' });
  }
};

export const updateTeamHead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { headUserId } = req.body;

    if (headUserId) {
      const headUser = await prisma.user.findUnique({ where: { id: headUserId } });
      if (!headUser) return res.status(404).json({ success: false, message: 'User not found' });
      if (headUser.designation !== 'Marketing Director') {
        return res.status(400).json({ success: false, message: 'Only users with designation Marketing Director can be assigned as Team Head.' });
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: { headUserId }
    });

    if (headUserId) {
      await prisma.user.update({
        where: { id: headUserId },
        data: { teamId: team.id }
      });
    }

    return res.json({ success: true, data: team });
  } catch (error) {
    console.error('Error updating team head:', error);
    return res.status(500).json({ success: false, message: 'Failed to update team head' });
  }
};

export const getTeamHierarchyData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    
    if (req.user!.role !== 'MD') {
      const currentUser = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (currentUser?.teamId !== id) {
        return res.status(403).json({ success: false, message: 'Forbidden: Outside permitted hierarchy' });
      }
    }

    const tree = await HierarchyService.buildTree(null, id);
    return res.json({ success: true, data: tree });
  } catch (error) {
    console.error('Error fetching team hierarchy data:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch team hierarchy' });
  }
};

export const deleteTeam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Check if users belong to this team
    const activeMembers = await prisma.user.count({ where: { teamId: id } });
    if (activeMembers > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete this team while members are assigned. Reassign the members first.' 
      });
    }

    await prisma.team.delete({ where: { id } });
    
    return res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete team' });
  }
};

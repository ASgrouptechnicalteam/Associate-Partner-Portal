import { PrismaClient } from '@prisma/client';
import { AuditService } from './auditService';
import { TeamService } from './teamService';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

const VALID_TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ['ON_THE_WAY', 'CANCELLED', 'RESCHEDULED'],
  ON_THE_WAY: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['CUSTOMER_MET', 'CANCELLED'],
  CUSTOMER_MET: ['COMPLETED'],
  RESCHEDULED: ['SCHEDULED'],
  COMPLETED: [],
  CANCELLED: []
};

export class SiteVisitService {
  /**
   * Retrieves Site Visits with hierarchical visibility enforced.
   */
  static async getSiteVisits(userId: string, role: string, filters: any = {}) {
    let whereClause: any = {};

    if (role === 'MD') {
      // MD sees all
    } else if (role === 'ASSOCIATE_MANAGER') {
      const downlineIds = await TeamService.getFullDownline(userId);
      whereClause.associateId = { in: [userId, ...downlineIds] };
    } else {
      whereClause.associateId = userId;
    }

    if (filters.status) whereClause.status = filters.status;
    if (filters.projectId) whereClause.projectId = filters.projectId;

    return await prisma.siteVisit.findMany({
      where: whereClause,
      include: {
        project: { select: { name: true, code: true } },
        associate: { select: { name: true, associateId: true } }
      },
      orderBy: { visitDate: 'desc' }
    });
  }

  /**
   * Retrieves a specific Site Visit and validates IDOR access.
   */
  static async getSiteVisitById(id: string, userId: string, role: string) {
    const visit = await prisma.siteVisit.findUnique({
      where: { id },
      include: {
        project: { select: { name: true, code: true } },
        associate: { select: { name: true, associateId: true } }
      }
    });

    if (!visit) throw new Error('Site visit not found');

    if (role !== 'MD' && visit.associateId !== userId) {
      if (role === 'ASSOCIATE_MANAGER') {
        const downlineIds = await TeamService.getFullDownline(userId);
        if (!downlineIds.includes(visit.associateId)) {
          throw new Error('Forbidden: Outside permitted hierarchy');
        }
      } else {
        throw new Error('Forbidden: Outside permitted hierarchy');
      }
    }

    return visit;
  }

  /**
   * Creates a new Site Visit
   */
  static async createSiteVisit(data: any, userId: string) {
    // Validate Project
    const project = await prisma.project.findUnique({
      where: { id: data.projectId }
    });
    
    // In actual implementation, you might check if project status allows visits.
    if (!project) throw new Error('Project not found or invalid');

    const visit = await prisma.siteVisit.create({
      data: {
        ...data,
        associateId: userId,
        status: 'SCHEDULED'
      }
    });

    await AuditService.log(
      userId,
      'CREATE_SITE_VISIT',
      'SiteVisit',
      visit.id,
      null,
      visit
    );

    return visit;
  }

  /**
   * Updates status of a Site Visit.
   */
  static async updateStatus(id: string, newStatus: string, userId: string, role: string, outcome?: string) {
    const visit = await this.getSiteVisitById(id, userId, role);

    const allowedNextStatuses = VALID_TRANSITIONS[visit.status] || [];
    if (!allowedNextStatuses.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${visit.status} to ${newStatus}`);
    }

    const updateData: any = { status: newStatus };

    if (newStatus === 'COMPLETED') {
      if (!outcome || outcome.trim() === '') {
        throw new Error('Outcome is required before completing the site visit.');
      }
      updateData.outcome = outcome;
      updateData.completedAt = new Date();
    } else if (newStatus === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    } else if (newStatus === 'RESCHEDULED') {
      updateData.rescheduledAt = new Date();
    }

    const updatedVisit = await prisma.siteVisit.update({
      where: { id },
      data: updateData
    });

    await AuditService.log(
      userId,
      'SITE_VISIT_STATUS_UPDATED',
      'SiteVisit',
      id,
      { status: visit.status, outcome: visit.outcome },
      { status: newStatus, outcome: updateData.outcome }
    );

    if (userId !== visit.associateId) {
      await NotificationService.createNotification({
        userId: visit.associateId,
        category: 'Site Visit',
        title: `Site Visit ${newStatus}`,
        message: `Your site visit for ${visit.project.name} has been updated to ${newStatus}.`,
        entityType: 'SiteVisit',
        entityId: id,
        actionUrl: `/site-visits`,
        eventKey: `SITE_VISIT_${newStatus}_${id}`
      });
    }

    return updatedVisit;
  }

  /**
   * Update outcome separately (if needed).
   */
  static async updateOutcome(id: string, outcomeData: any, userId: string, role: string) {
    const visit = await this.getSiteVisitById(id, userId, role);
    
    const updatedVisit = await prisma.siteVisit.update({
      where: { id },
      data: {
        outcome: outcomeData.outcome,
        followUpRequired: outcomeData.followUpRequired,
        followUpDate: outcomeData.followUpDate ? new Date(outcomeData.followUpDate) : null,
        remarks: outcomeData.remarks
      }
    });

    await AuditService.log(
      userId,
      'SITE_VISIT_OUTCOME_UPDATED',
      'SiteVisit',
      id,
      { outcome: visit.outcome },
      { outcome: updatedVisit.outcome }
    );

    return updatedVisit;
  }
}

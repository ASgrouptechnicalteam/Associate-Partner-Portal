import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

export class ProjectService {
  static async createProject(data: any, createdBy: string) {
    const project = await prisma.project.create({
      data: {
        ...data,
        createdBy,
        status: 'DRAFT',
        verificationStatus: 'UNVERIFIED'
      }
    });

    // Notify MD/CPM about new draft project (fire and forget)
    try {
      const [managers, creator] = await Promise.all([
        prisma.user.findMany({
          where: { role: { name: { in: ['MD', 'CHANNEL_PARTNER_MANAGER'] } }, status: 'ACTIVE' },
          select: { id: true }
        }),
        prisma.user.findUnique({ where: { id: createdBy }, select: { name: true, userIdentifier: true } })
      ]);
      const creatorLabel = `${creator?.name || 'A user'} (${creator?.userIdentifier || ''})`;
      const notifications = managers.filter(m => m.id !== createdBy).map(m => ({
        userId: m.id,
        category: 'Project',
        title: 'New Project Created',
        message: `${creatorLabel} created a new project draft: "${project.name}".`,
        entityType: 'Project',
        entityId: project.id,
        actionUrl: `/projects/${project.id}`,
        eventKey: `PROJECT_CREATED_${project.id}_${m.id}`
      }));
      NotificationService.createNotifications(notifications).catch(err =>
        console.error('Failed to send project creation notifications:', err)
      );
    } catch (e) {
      console.error('Non-critical: project creation notification error:', e);
    }

    return project;
  }

  static async updateProject(projectId: string, data: any) {
    return prisma.project.update({
      where: { id: projectId },
      data
    });
  }

  static async submitProject(projectId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');
    if (project.status !== 'DRAFT' && project.status !== 'REJECTED') {
      throw new Error('Only DRAFT or REJECTED projects can be submitted');
    }
    
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { status: 'PENDING_APPROVAL' }
    });

    // Notify MD/CPM that approval is needed (fire and forget)
    try {
      const managers = await prisma.user.findMany({
        where: { role: { name: { in: ['MD', 'CHANNEL_PARTNER_MANAGER'] } }, status: 'ACTIVE' },
        select: { id: true }
      });
      const notifications = managers.map(m => ({
        userId: m.id,
        category: 'Project',
        title: 'Project Approval Required',
        message: `Project "${project.name}" has been submitted and is awaiting your approval.`,
        entityType: 'Project',
        entityId: project.id,
        actionUrl: `/projects/${project.id}`,
        eventKey: `PROJECT_SUBMIT_${project.id}_${m.id}`
      }));
      NotificationService.createNotifications(notifications).catch(err =>
        console.error('Failed to send project submission notifications:', err)
      );
    } catch (e) {
      console.error('Non-critical: project submission notification error:', e);
    }

    return updated;
  }

  static async approveProject(projectId: string, approvedBy: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');
    if (project.status !== 'PENDING_APPROVAL') {
      throw new Error('Only PENDING_APPROVAL projects can be approved');
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        approvedBy,
        approvedAt: new Date(),
        rejectionReason: null
      }
    });

    // Notify all active users about the newly live project (fire and forget)
    try {
      const recipients = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true }
      });
      const notifications = recipients.filter(r => r.id !== approvedBy).map(r => ({
        userId: r.id,
        category: 'Project',
        title: 'Project Approved',
        message: `Project "${project.name}" has been approved and is now available for bookings.`,
        entityType: 'Project',
        entityId: project.id,
        actionUrl: `/projects/${project.id}`,
        eventKey: `PROJECT_APPROVED_${project.id}_${r.id}`
      }));
      NotificationService.createNotifications(notifications).catch(err =>
        console.error('Failed to send project approval notifications:', err)
      );
    } catch (e) {
      console.error('Non-critical: project approval notification error:', e);
    }

    return updated;
  }

  static async rejectProject(projectId: string, rejectionReason: string, rejectedBy: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');
    if (project.status !== 'PENDING_APPROVAL') {
      throw new Error('Only PENDING_APPROVAL projects can be rejected');
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'REJECTED',
        verificationStatus: 'REJECTED',
        rejectionReason,
      }
    });

    // Notify the project creator (fire and forget)
    try {
      if (project.createdBy) {
        NotificationService.createNotification({
          userId: project.createdBy,
          category: 'Project',
          title: 'Project Rejected',
          message: `Your project "${project.name}" has been rejected. Reason: ${rejectionReason || 'No reason provided'}.`,
          entityType: 'Project',
          entityId: project.id,
          actionUrl: `/projects/${project.id}`,
          eventKey: `PROJECT_REJECTED_${project.id}`
        }).catch(err => console.error('Failed to send rejection notification:', err));
      }
    } catch (e) {
      console.error('Non-critical: project rejection notification error:', e);
    }

    return updated;
  }

  static async toggleHotStatus(projectId: string, isHot: boolean) {
    return prisma.project.update({
      where: { id: projectId },
      data: { isHot }
    });
  }

  static async toggleFeaturedStatus(projectId: string, isFeatured: boolean) {
    return prisma.project.update({
      where: { id: projectId },
      data: { isFeatured }
    });
  }

  static async safeDeleteProject(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        bookings: true,
        siteVisits: true,
        commissionPolicies: true,
        inventory: {
          where: { status: { not: 'AVAILABLE' } }
        }
      }
    });

    if (!project) throw new Error('Project not found');

    const hasDependencies = 
      project.bookings.length > 0 || 
      project.siteVisits.length > 0 || 
      project.commissionPolicies.length > 0 ||
      project.inventory.length > 0;

    if (hasDependencies) {
      // Safe Archive if dependencies exist
      return prisma.project.update({
        where: { id: projectId },
        data: { status: 'ARCHIVED' }
      });
    }

    // Hard delete if perfectly safe
    return prisma.project.delete({
      where: { id: projectId }
    });
  }

  static async archiveProject(projectId: string) {
    return prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'ARCHIVED'
      }
    });
  }

  static async getProjectsForAssociates() {
    return prisma.project.findMany({
      where: {
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED'
      },
      include: { media: true, inventory: true }
    });
  }

  static async getAllProjectsForManagement() {
    return prisma.project.findMany({
      include: { media: true, inventory: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getProjectById(projectId: string, isManager: boolean) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { media: true, inventory: true }
    });

    if (!project) return null;

    if (!isManager) {
      if (project.status !== 'ACTIVE' || project.verificationStatus !== 'VERIFIED') {
        return null; // IDOR Protection
      }
    }
    return project;
  }
}

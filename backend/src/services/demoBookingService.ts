import { PrismaClient } from '@prisma/client';
import { AuditService } from './auditService';
import { TeamService } from './teamService';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

const VALID_TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ['CONDUCTED', 'CANCELLED', 'RESCHEDULED'],
  RESCHEDULED: ['SCHEDULED'],
  CONDUCTED: [],
  CANCELLED: []
};

export class DemoBookingService {
  /**
   * Retrieves Demo Bookings with hierarchical visibility enforced.
   */
  static async getDemoBookings(userId: string, role: string, filters: any = {}) {
    let whereClause: any = {};

    if (role === 'MD') {
      // MD sees all
    } else if (role === 'CHANNEL_PARTNER_MANAGER') {
      const downlineIds = await TeamService.getFullDownline(userId);
      whereClause.userId = { in: [userId, ...downlineIds] };
    } else {
      whereClause.userId = userId;
    }

    if (filters.status) whereClause.status = filters.status;
    if (filters.projectId) whereClause.projectId = filters.projectId;

    return await prisma.demoBooking.findMany({
      where: whereClause,
      include: {
        project: { select: { name: true, code: true } },
        user: { select: { name: true, userIdentifier: true } }
      },
      orderBy: { scheduledDate: 'desc' }
    });
  }

  /**
   * Retrieves a specific Demo Booking and validates IDOR access.
   */
  static async getDemoBookingById(id: string, userId: string, role: string) {
    const booking = await prisma.demoBooking.findUnique({
      where: { id },
      include: {
        project: { select: { name: true, code: true } },
        user: { select: { name: true, userIdentifier: true } }
      }
    });

    if (!booking) throw new Error('Demo booking not found');

    if (role !== 'MD' && booking.userId !== userId) {
      if (role === 'CHANNEL_PARTNER_MANAGER') {
        const downlineIds = await TeamService.getFullDownline(userId);
        if (!downlineIds.includes(booking.userId)) {
          throw new Error('Forbidden: Outside permitted hierarchy');
        }
      } else {
        throw new Error('Forbidden: Outside permitted hierarchy');
      }
    }

    return booking;
  }

  /**
   * Creates a new Demo Booking
   */
  static async createDemoBooking(data: any, userId: string) {
    // Validate Project
    const project = await prisma.project.findUnique({
      where: { id: data.projectId }
    });
    
    if (!project) throw new Error('Project not found or invalid');

    const booking = await prisma.demoBooking.create({
      data: {
        ...data,
        userId: userId,
        status: 'SCHEDULED',
        scheduledDate: new Date(data.scheduledDate)
      }
    });

    await AuditService.log(
      userId,
      'CREATE_DEMO_BOOKING',
      'DemoBooking',
      booking.id,
      null,
      booking
    );

    // Notify management (fire and forget)
    try {
      const [managers, creator] = await Promise.all([
        prisma.user.findMany({
          where: { role: { name: { in: ['MD', 'CHANNEL_PARTNER_MANAGER'] } }, status: 'ACTIVE' },
          select: { id: true }
        }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true } })
      ]);
      const scheduledDate = data.scheduledDate ? new Date(data.scheduledDate).toLocaleDateString() : 'TBD';
      const notifications = managers.filter(m => m.id !== userId).map(m => ({
        userId: m.id,
        category: 'Demo Booking',
        title: 'Demo Booking Scheduled',
        message: `${creator?.name || 'An associate'} scheduled a demo booking for ${project.name} on ${scheduledDate}.`,
        entityType: 'DemoBooking',
        entityId: booking.id,
        actionUrl: `/demo-bookings`,
        eventKey: `DEMO_BOOKING_CREATED_${booking.id}_${m.id}`
      }));
      NotificationService.createNotifications(notifications).catch(err =>
        console.error('Failed to send demo booking creation notifications:', err)
      );
    } catch (e) {
      console.error('Non-critical: demo booking creation notification error:', e);
    }

    return booking;
  }

  /**
   * Updates status of a Demo Booking
   */
  static async updateStatus(id: string, newStatus: string, userId: string, role: string, outcome?: string) {
    const booking = await this.getDemoBookingById(id, userId, role);

    const allowed = VALID_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(newStatus) && role !== 'MD') {
      throw new Error(`Invalid status transition from ${booking.status} to ${newStatus}`);
    }

    const dataToUpdate: any = { status: newStatus };
    if (outcome !== undefined) dataToUpdate.outcome = outcome;

    if (newStatus === 'CONDUCTED') {
      dataToUpdate.completedAt = new Date();
    } else if (newStatus === 'CANCELLED') {
      dataToUpdate.cancelledAt = new Date();
    } else if (newStatus === 'RESCHEDULED') {
      dataToUpdate.rescheduledAt = new Date();
    }

    const updated = await prisma.demoBooking.update({
      where: { id },
      data: dataToUpdate
    });

    await AuditService.log(
      userId,
      'UPDATE_DEMO_BOOKING_STATUS',
      'DemoBooking',
      booking.id,
      { status: booking.status },
      { status: newStatus }
    );

    // Notify the booking owner if updated by someone else (fire and forget)
    if (userId !== booking.userId) {
      NotificationService.createNotification({
        userId: booking.userId,
        category: 'Demo Booking',
        title: `Demo Booking ${newStatus}`,
        message: `Your demo booking for ${booking.project.name} has been updated to ${newStatus}.`,
        entityType: 'DemoBooking',
        entityId: id,
        actionUrl: `/demo-bookings`,
        eventKey: `DEMO_BOOKING_${newStatus}_${id}`
      }).catch(err => console.error('Failed to send demo booking status notification:', err));
    }

    return updated;
  }
}

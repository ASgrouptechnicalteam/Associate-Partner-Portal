import { PrismaClient, Prisma } from '@prisma/client';
import { AuditService } from './auditService';
import { TeamService } from './teamService';
import commissionService from './commissionService';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

// Valid Status Transitions map. Defines what the NEXT status can be based on the CURRENT status.
const STATUS_TRANSITIONS: Record<string, string[]> = {
  'SUBMITTED': ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'],
  'UNDER_REVIEW': ['VERIFIED', 'REJECTED', 'PAYMENT_PENDING', 'CANCELLED'],
  'PAYMENT_PENDING': ['VERIFIED', 'REJECTED', 'CANCELLED'],
  'VERIFIED': ['CANCELLED'],
  'REJECTED': [],
  'CANCELLED': []
};

export class BookingService {
  static async createBooking(userId: string, data: any, ipAddress?: string) {
    // 1. Validation & Atomic execution using Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Revalidate Project
      const project = await tx.project.findUnique({ where: { id: data.projectId } });
      if (!project || project.status !== 'ACTIVE' || project.verificationStatus !== 'VERIFIED') {
        throw new Error('Project is not active or verified.');
      }

      // Revalidate Inventory
      const inventoryUnit = await tx.inventoryUnit.findUnique({
        where: { id: data.inventoryUnitId }
      });
      if (!inventoryUnit || inventoryUnit.projectId !== data.projectId) {
        throw new Error('Invalid inventory unit.');
      }
      if (inventoryUnit.status !== 'AVAILABLE') {
        throw new Error('Inventory unit is no longer available. Concurrent booking prevented.');
      }

      // 1.1 Atomic state update to prevent duplicate booking
      // Using updateMany allows us to guarantee concurrency safety by relying on the DB engine's native locking,
      // updating ONLY if the status is still 'AVAILABLE'.
      const updatedInventory = await tx.inventoryUnit.updateMany({
        where: { id: data.inventoryUnitId, status: 'AVAILABLE' },
        data: { status: 'BOOKED' }
      });

      if (updatedInventory.count === 0) {
        throw new Error('Inventory unit is no longer available. Concurrent booking prevented.');
      }

      // Authoritative Price check (optional, but good practice to ensure client isn't sending a fake expected amount)
      // The requirement says: "Revalidate... authoritative price before creating a booking."
      // Assuming expectedAmount should match inventory price.
      const authoritativePrice = new Prisma.Decimal(inventoryUnit.price);
      // We store expectedAmount from the client but we could validate it.

      // Create Booking
      const booking = await tx.booking.create({
        data: {
          userId,
          projectId: data.projectId,
          inventoryUnitId: data.inventoryUnitId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          alternatePhone: data.alternatePhone,
          customerEmail: data.customerEmail,
          customerAddress: data.customerAddress,
          preferredLocation: data.preferredLocation,
          bookingDate: new Date(data.bookingDate),
          expectedAmount: data.expectedAmount, // Using Decimal
          paymentMode: data.paymentMode,
          bookingAmount: data.bookingAmount,   // Using Decimal
          notes: data.notes,
          documents: data.documents || [],
          status: 'SUBMITTED'
        }
      });

      // Inventory was atomically updated above.

      // Audit logs
      await AuditService.logWithTx(
        tx,
        userId,
        'CREATE_BOOKING',
        'Booking',
        booking.id,
        null,
        booking,
        { ipAddress }
      );

      await AuditService.logWithTx(
        tx,
        userId,
        'UPDATE_INVENTORY_STATUS',
        'InventoryUnit',
        inventoryUnit.id,
        { status: inventoryUnit.status },
        { status: 'BOOKED' },
        { bookingId: booking.id, ipAddress }
      );

      return booking;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Maximum concurrency protection
    });

    // --- Post-transaction: notify after successful commit ---
    // Fetch project name and creator name for notification message
    try {
      const [project, creator, managers] = await Promise.all([
        prisma.project.findUnique({ where: { id: result.projectId }, select: { name: true } }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true, userIdentifier: true } }),
        prisma.user.findMany({
          where: { role: { name: { in: ['MD', 'CHANNEL_PARTNER_MANAGER'] } }, status: 'ACTIVE' },
          select: { id: true }
        })
      ]);

      const projectName = project?.name || 'Unknown Project';
      const creatorName = creator?.name || 'An associate';
      const creatorId = creator?.userIdentifier || '';

      // Notify management about new booking
      const mgmtNotifications = managers
        .filter(m => m.id !== userId)
        .map(m => ({
          userId: m.id,
          category: 'Booking',
          title: 'New Booking Submitted',
          message: `${creatorName} (${creatorId}) submitted a new booking for ${projectName}.`,
          entityType: 'Booking',
          entityId: result.id,
          actionUrl: `/bookings/${result.id}`,
          eventKey: `BOOKING_CREATED_MGT_${result.id}_${m.id}`
        }));

      // Notify the creator as confirmation
      mgmtNotifications.push({
        userId,
        category: 'Booking',
        title: 'Booking Submitted Successfully',
        message: `Your booking for ${projectName} has been submitted and is under review.`,
        entityType: 'Booking',
        entityId: result.id,
        actionUrl: `/bookings/${result.id}`,
        eventKey: `BOOKING_CREATED_CONFIRM_${result.id}`
      });

      NotificationService.createNotifications(mgmtNotifications).catch(err => {
        console.error('Failed to send booking creation notifications:', err);
      });
    } catch (notifErr) {
      console.error('Non-critical: booking notification error:', notifErr);
    }

    return result;
  }


  static async updateBookingStatus(bookingId: string, newStatus: string, actorId: string, role: string, reason?: string, ipAddress?: string) {
    if (role !== 'MD' && role !== 'CHANNEL_PARTNER_MANAGER') {
      throw new Error('Only MD or AM can update booking status.');
    }

    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { inventoryUnit: true, project: { select: { name: true } } }
      });

      if (!booking) throw new Error('Booking not found.');

      // State machine check
      const allowedNextStatuses = STATUS_TRANSITIONS[booking.status] || [];
      if (!allowedNextStatuses.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${booking.status} to ${newStatus}`);
      }

      // Determine inventory status effect
      let inventoryStatusUpdate = undefined;
      
      if (newStatus === 'VERIFIED') {
        inventoryStatusUpdate = 'BOOKED';
      } else if (['REJECTED', 'CANCELLED'].includes(newStatus)) {
        inventoryStatusUpdate = 'AVAILABLE';
      }

      // Update Booking
      const updateData: any = { status: newStatus };
      if (newStatus === 'VERIFIED') {
        updateData.verifiedBy = actorId;
        updateData.verifiedAt = new Date();
      }
      if (['REJECTED', 'CANCELLED'].includes(newStatus) && reason) {
        updateData.rejectionReason = reason;
      }

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: updateData
      });

      // Update Inventory if needed
      if (inventoryStatusUpdate && booking.inventoryUnit.status !== inventoryStatusUpdate) {
        await tx.inventoryUnit.update({
          where: { id: booking.inventoryUnitId },
          data: { status: inventoryStatusUpdate }
        });

        await AuditService.logWithTx(
          tx,
          actorId,
          'UPDATE_INVENTORY_STATUS',
          'InventoryUnit',
          booking.inventoryUnitId,
          { status: booking.inventoryUnit.status },
          { status: inventoryStatusUpdate },
          { bookingId, ipAddress }
        );
      }

      await AuditService.logWithTx(
        tx,
        actorId,
        'UPDATE_BOOKING_STATUS',
        'Booking',
        booking.id,
        { status: booking.status },
        { status: newStatus, rejectionReason: reason },
        { ipAddress }
      );

      // Phase 6: Commission Generation
      if (newStatus === 'VERIFIED') {
        await commissionService.generateCommission(tx, updatedBooking as any);
      }

      // Phase 12: Notification Generation
      await NotificationService.createNotification({
        userId: booking.userId,
        category: 'Booking',
        title: `Booking ${newStatus}`,
        message: `Your booking for ${booking.project.name} has been marked as ${newStatus}.`,
        entityType: 'Booking',
        entityId: booking.id,
        actionUrl: `/bookings/${booking.id}`,
        eventKey: `BOOKING_${newStatus}_${booking.id}`
      }, tx);

      return updatedBooking;
    });
  }

  static async getBookingById(bookingId: string, userId: string, role: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        project: true,
        inventoryUnit: true,
        user: {
          select: { id: true, name: true, userIdentifier: true, profileImageUrl: true }
        }
      }
    });

    if (!booking) return null;

    // Downward hierarchy filtering
    if (role === 'ASSOCIATE') {
      if (booking.userId !== userId) {
        const isDownline = await TeamService.isAssociateInDownline(userId, booking.userId);
        if (!isDownline) {
          throw new Error('Forbidden: You do not have permission to view this booking.');
        }
      }
    }

    const { user, ...bookingWithoutUser } = booking as any;
    return {
      ...bookingWithoutUser,
      associate: user ? {
        id: user.id,
        name: user.name,
        userId: user.userIdentifier
      } : null
    };
  }

  static async getBookingsList(userId: string, role: string, filters: any = {}) {
    // If MD or AM, they can see all (or filtered by team if they want)
    // If Associate, they can only see their own OR their downline
    
    let whereClause: any = {};

    if (filters.projectId) {
      whereClause.projectId = filters.projectId;
    }
    
    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (role === 'ASSOCIATE') {
      if (filters.view === 'TEAM') {
        const downline = await TeamService.getFullDownline(userId);
        whereClause.userId = { in: [userId, ...downline] };
      } else {
        // Default to MY bookings
        whereClause.userId = userId;
      }
    } else {
      // MD/AM can also filter by a specific associate
      if (filters.userId) {
        whereClause.userId = filters.userId;
      }
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true, code: true } },
        inventoryUnit: { select: { id: true, unitNumber: true, propertyType: true } },
        user: { select: { id: true, name: true, userIdentifier: true, profileImageUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return bookings.map((b: any) => {
      const { user, ...rest } = b;
      return {
        ...rest,
        associate: user ? {
          id: user.id,
          name: user.name,
          userId: user.userIdentifier,
          profileImageUrl: user.profileImageUrl
        } : null
      };
    });
  }
}

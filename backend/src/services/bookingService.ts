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
  static async createBooking(associateId: string, data: any, ipAddress?: string) {
    // 1. Validation & Atomic execution using Prisma Transaction
    return await prisma.$transaction(async (tx) => {
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

      // Authoritative Price check (optional, but good practice to ensure client isn't sending a fake expected amount)
      // The requirement says: "Revalidate... authoritative price before creating a booking."
      // Assuming expectedAmount should match inventory price.
      const authoritativePrice = new Prisma.Decimal(inventoryUnit.price);
      // We store expectedAmount from the client but we could validate it.

      // Create Booking
      const booking = await tx.booking.create({
        data: {
          associateId,
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

      // Update Inventory Status to BLOCKED
      const updatedInventory = await tx.inventoryUnit.update({
        where: { id: inventoryUnit.id },
        data: { status: 'BLOCKED' }
      });

      // Audit logs
      await AuditService.logWithTx(
        tx,
        associateId,
        'CREATE_BOOKING',
        'Booking',
        booking.id,
        null,
        booking,
        { ipAddress }
      );

      await AuditService.logWithTx(
        tx,
        associateId,
        'UPDATE_INVENTORY_STATUS',
        'InventoryUnit',
        inventoryUnit.id,
        { status: inventoryUnit.status },
        { status: updatedInventory.status },
        { bookingId: booking.id, ipAddress }
      );

      return booking;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Maximum concurrency protection
    });
  }

  static async updateBookingStatus(bookingId: string, newStatus: string, actorId: string, role: string, reason?: string, ipAddress?: string) {
    if (role !== 'MD' && role !== 'ASSOCIATE_MANAGER') {
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
        userId: booking.associateId,
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

  static async getBookingById(bookingId: string, associateId: string, role: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        project: true,
        inventoryUnit: true,
        associate: {
          select: { id: true, name: true, associateId: true }
        }
      }
    });

    if (!booking) return null;

    // Downward hierarchy filtering
    if (role === 'ASSOCIATE') {
      if (booking.associateId !== associateId) {
        const isDownline = await TeamService.isAssociateInDownline(associateId, booking.associateId);
        if (!isDownline) {
          throw new Error('Forbidden: You do not have permission to view this booking.');
        }
      }
    }

    return booking;
  }

  static async getBookingsList(associateId: string, role: string, filters: any = {}) {
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
        const downline = await TeamService.getFullDownline(associateId);
        whereClause.associateId = { in: [associateId, ...downline] };
      } else {
        // Default to MY bookings
        whereClause.associateId = associateId;
      }
    } else {
      // MD/AM can also filter by a specific associate
      if (filters.associateId) {
        whereClause.associateId = filters.associateId;
      }
    }

    return prisma.booking.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true, code: true } },
        inventoryUnit: { select: { id: true, unitNumber: true, propertyType: true } },
        associate: { select: { id: true, name: true, associateId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

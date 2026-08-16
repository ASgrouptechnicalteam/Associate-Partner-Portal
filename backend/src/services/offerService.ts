import { PrismaClient, Offer, Prisma } from '@prisma/client';
import { AuditService } from './auditService';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

export class OfferService {
  static async getAll(role: string, associateId?: string): Promise<any[]> {
    const isAssociate = role === 'ASSOCIATE';
    const where: any = isAssociate ? {
      status: 'ACTIVE',
      OR: [
        { startDate: null },
        { startDate: { lte: new Date() } }
      ],
      AND: [
        { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
        { OR: [{ targetAudience: 'ASSOCIATE' }, { targetAudience: 'ALL' }] }
      ]
    } : {}; // AM/MD sees all

    const offers = await prisma.offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });

    if (!isAssociate || !associateId) return offers;

    // For Associate, calculate dynamic progress
    const enrichedOffers = [];
    for (const offer of offers) {
      let achievedBookings = 0;

      if (offer.targetBookings) {
        // Find VERIFIED bookings for this associate, within offer dates, for the specific project if applicable
        const bookingWhere: any = {
          associateId: associateId,
          status: 'VERIFIED'
        };

        if (offer.projectId) {
          bookingWhere.projectId = offer.projectId;
        }

        if (offer.startDate || offer.endDate) {
          bookingWhere.bookingDate = {};
          if (offer.startDate) bookingWhere.bookingDate.gte = offer.startDate;
          if (offer.endDate) bookingWhere.bookingDate.lte = offer.endDate;
        }

        achievedBookings = await prisma.booking.count({ where: bookingWhere });
      }

      enrichedOffers.push({
        ...offer,
        achievedBookings,
        remainingBookings: offer.targetBookings ? Math.max(0, offer.targetBookings - achievedBookings) : null,
        progressPercentage: offer.targetBookings ? Math.min(100, Math.round((achievedBookings / offer.targetBookings) * 100)) : null
      });
    }

    return enrichedOffers;
  }

  static async getById(id: string): Promise<Offer | null> {
    return prisma.offer.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });
  }

  static async create(data: Omit<Prisma.OfferCreateInput, 'id' | 'createdAt' | 'updatedAt'>, actorId: string): Promise<Offer> {
    const item = await prisma.offer.create({
      data
    });
    
    await AuditService.log(actorId, 'CREATE_OFFER', 'Offer', item.id, null, item);

    if (item.status === 'ACTIVE' && (item.targetAudience === 'ALL' || item.targetAudience === 'ASSOCIATE')) {
      const activeAssociates = await prisma.user.findMany({
        where: { role: { name: 'ASSOCIATE' }, status: 'ACTIVE' },
        select: { id: true }
      });

      const notifications = activeAssociates.map(user => ({
        userId: user.id,
        category: 'Offer',
        title: 'New Offer Available',
        message: `A new offer "${item.title}" is now available.`,
        entityType: 'Offer',
        entityId: item.id,
        actionUrl: `/offers`,
        eventKey: `OFFER_PUBLISHED_${item.id}_${user.id}`
      }));

      // Fire and forget (don't block the request)
      NotificationService.createNotifications(notifications).catch(err => {
        console.error('Failed to send offer notifications:', err);
      });
    }

    return item;
  }

  static async update(id: string, data: Partial<Omit<Prisma.OfferUpdateInput, 'id' | 'createdAt' | 'updatedAt'>>, actorId: string): Promise<Offer> {
    const before = await prisma.offer.findUnique({ where: { id } });
    if (!before) throw new Error('Offer not found');

    const item = await prisma.offer.update({
      where: { id },
      data
    });
    
    await AuditService.log(actorId, 'UPDATE_OFFER', 'Offer', item.id, before, item);
    return item;
  }

  static async delete(id: string, actorId: string): Promise<Offer> {
    const before = await prisma.offer.findUnique({ where: { id } });
    if (!before) throw new Error('Offer not found');

    const item = await prisma.offer.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
    
    await AuditService.log(actorId, 'ARCHIVE_OFFER', 'Offer', id, before, item);
    return item;
  }
}

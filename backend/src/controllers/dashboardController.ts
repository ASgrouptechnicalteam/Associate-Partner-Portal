import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { TeamService } from '../services/teamService';

const prisma = new PrismaClient();
const teamService = new TeamService();

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    if (!reqUser) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: reqUser.id },
      select: { id: true, name: true, associateId: true, role: { select: { name: true } } }
    });

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const now = new Date();

    // 1. Team Count
    let teamCount = 0;
    if (user.role.name === 'MD' || user.role.name === 'ASSOCIATE_MANAGER') {
      const fullDownline = await TeamService.getFullDownline(user.id);
      teamCount = fullDownline.length;
    }

    // 2. Booking Count
    let bookingCount = 0;
    if (user.role.name === 'MD' || user.role.name === 'ASSOCIATE_MANAGER') {
      bookingCount = await prisma.booking.count();
    } else {
      const downline = await TeamService.getFullDownline(user.id);
      bookingCount = await prisma.booking.count({
        where: { associateId: { in: [user.id, ...downline] } }
      });
    }

    // 2.5 Commission Count
    let commissionTotal = new Prisma.Decimal(0);
    if (user.role.name === 'MD' || user.role.name === 'ASSOCIATE_MANAGER') {
      const allTx = await prisma.commissionTransaction.findMany();
      allTx.forEach(t => commissionTotal = commissionTotal.add(t.amountCalculated));
    } else {
      const myTx = await prisma.commissionTransaction.findMany({ where: { associateId: user.id }});
      myTx.forEach(t => commissionTotal = commissionTotal.add(t.amountCalculated));
    }

    // 3. Featured Projects (Use visibility rules from Phase 3)
    // For MD, all ACTIVE/DRAFT projects are visible. For AM/Associate, only ACTIVE and VERIFIED projects.
    // Dashboard just shows a limited list of active, verified, featured projects.
    const projectWhere: any = { status: 'ACTIVE', verificationStatus: 'VERIFIED', isFeatured: true };
    
    // MDs can see all featured projects regardless of verification status
    if (user.role.name === 'MD') {
       delete projectWhere.verificationStatus;
    }

    const featuredProjects = await prisma.project.findMany({
      where: projectWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          where: { status: 'ACTIVE', mediaType: 'GALLERY' },
          take: 1,
          orderBy: { displayOrder: 'asc' }
        },
        inventory: {
          where: { status: 'AVAILABLE' }
        }
      }
    });

    const mappedProjects = featuredProjects.map(p => ({
      id: p.id,
      name: p.name,
      code: p.code,
      location: p.location,
      projectType: p.projectType,
      status: p.status,
      verificationStatus: p.verificationStatus,
      availableUnits: p.inventory.length,
      image: p.media[0]?.url || null
    }));

    // 4. Carousel Items
    const activeCarouselItems = await prisma.carouselItem.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [
          { OR: [{ endAt: null }, { endAt: { gte: now } }] }
        ]
      },
      orderBy: { displayOrder: 'asc' }
    });

    const activePopup = await prisma.promotionalPopup.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [
          { OR: [{ endAt: null }, { endAt: { gte: now } }] }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    // 6. Active Offers
    const activeOffers = await prisma.offer.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [
          { OR: [{ endDate: null }, { endDate: { gte: now } }] }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          name: user.name,
          associateId: user.associateId,
          role: user.role.name
        },
        statistics: {
          team: teamCount,
          bookings: bookingCount,
          commission: commissionTotal.toNumber(),
          siteVisits: null // "Coming soon"
        },
        featuredProjects: mappedProjects,
        carouselItems: activeCarouselItems,
        popup: activePopup,
        activeOffers
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthorizationService {
  async getPendingAuthorizations() {
    // 1. Projects
    const projects = await prisma.project.findMany({
      where: { status: 'PENDING_APPROVAL' },
      select: { id: true, name: true, code: true, createdAt: true, createdBy: true },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Bookings
    const bookings = await prisma.booking.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      select: {
        id: true,
        bookingDate: true,
        customerName: true,
        expectedAmount: true,
        status: true,
        project: { select: { name: true } },
        associate: { select: { name: true, associateId: true } }
      },
      orderBy: { bookingDate: 'desc' }
    });

    // 3. Team Requests
    const teamRequests = await prisma.teamRequest.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        requestType: true,
        createdAt: true,
        requester: { select: { name: true, associateId: true } },
        targetAssociate: { select: { name: true, associateId: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Travel Requests
    const travelRequests = await prisma.travelRequest.findMany({
      where: { status: 'MD_REVIEW' },
      select: {
        id: true,
        travelDate: true,
        fromLocation: true,
        toLocation: true,
        amountRequested: true,
        requester: { select: { name: true, associateId: true } }
      },
      orderBy: { travelDate: 'desc' }
    });

    // 5. Commission Policies
    const commissionPolicies = await prisma.commissionPolicy.findMany({
      where: { status: 'PENDING_APPROVAL' },
      select: {
        id: true,
        type: true,
        value: true,
        createdAt: true,
        associate: { select: { name: true, associateId: true } },
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      projects: { count: projects.length, items: projects },
      bookings: { count: bookings.length, items: bookings },
      teamRequests: { count: teamRequests.length, items: teamRequests },
      travelRequests: { count: travelRequests.length, items: travelRequests },
      commissionPolicies: { count: commissionPolicies.length, items: commissionPolicies },
      total: projects.length + bookings.length + teamRequests.length + travelRequests.length + commissionPolicies.length
    };
  }
}

export default new AuthorizationService();

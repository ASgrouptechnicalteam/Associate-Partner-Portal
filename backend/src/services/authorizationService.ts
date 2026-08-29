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
        user: { select: { name: true, userIdentifier: true } }
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
        requester: { select: { name: true, userIdentifier: true } },
        targetUser: { select: { name: true, userIdentifier: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Commission Policies
    const commissionPolicies = await prisma.commissionPolicy.findMany({
      where: { status: 'PENDING_APPROVAL' },
      select: {
        id: true,
        type: true,
        value: true,
        createdAt: true,
        user: { select: { name: true, userIdentifier: true } },
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      projects: { count: projects.length, items: projects },
      bookings: { count: bookings.length, items: bookings },
      teamRequests: { count: teamRequests.length, items: teamRequests },
      commissionPolicies: { count: commissionPolicies.length, items: commissionPolicies },
      total: projects.length + bookings.length + teamRequests.length + commissionPolicies.length
    };
  }
}

export default new AuthorizationService();

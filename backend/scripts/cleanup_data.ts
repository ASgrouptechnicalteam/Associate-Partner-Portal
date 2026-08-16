import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('=== TEST DATA CLEANUP STARTING ===');
  
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: 'associate@sonthillu.com' },
        { email: 'manager@sonthillu.com' },
        { email: { contains: 'test.com' } },
        { name: { contains: 'test' } },
        { role: { name: 'TEST' } }
      ],
      NOT: [
        { email: 'md@sonthillu.com' },
        { email: 'am@sonthillu.com' }
      ]
    }
  });

  const testProjects = await prisma.project.findMany({
    where: {
      OR: [
        { name: { contains: 'test' } },
        { name: 'TP01' },
        { name: 'Test Project' }
      ]
    }
  });

  const testUserIds = testUsers.map(u => u.id);
  const testProjectIds = testProjects.map(p => p.id);

  console.log(`Found ${testUserIds.length} Test Users.`);
  console.log(`Found ${testProjectIds.length} Test Projects.`);

  if (testUserIds.length === 0 && testProjectIds.length === 0) {
    console.log('No test records found. Exiting.');
    return;
  }

  // Define where clauses for dependencies
  // Empty arrays in Prisma 'in' clause will match nothing, so we use conditionally undefined to bypass OR conditions that rely on empty arrays
  const userWhere = testUserIds.length > 0 ? { in: testUserIds } : undefined;
  const projectWhere = testProjectIds.length > 0 ? { in: testProjectIds } : undefined;

  // Since prisma where OR requires an array of conditions, let's construct the OR array dynamically to avoid empty objects in OR
  const reviewRequestOr = [];
  if (userWhere) reviewRequestOr.push({ associateId: userWhere });
  if (projectWhere) reviewRequestOr.push({ projectId: projectWhere });

  // 1. Notifications
  if (userWhere) {
    const notifs = await prisma.notification.deleteMany({
      where: { userId: userWhere }
    });
    console.log(`Deleted ${notifs.count} Notifications.`);
  }

  // 2. Reviews and Review Requests
  if (reviewRequestOr.length > 0) {
    const reviewRequestsToDelete = await prisma.reviewRequest.findMany({
      where: { OR: reviewRequestOr }
    });
    const reviewRequestIds = reviewRequestsToDelete.map(r => r.id);
    if (reviewRequestIds.length > 0) {
      const reviews = await prisma.review.deleteMany({
        where: { reviewRequestId: { in: reviewRequestIds } }
      });
      console.log(`Deleted ${reviews.count} Reviews.`);
      const rReqs = await prisma.reviewRequest.deleteMany({
        where: { id: { in: reviewRequestIds } }
      });
      console.log(`Deleted ${rReqs.count} ReviewRequests.`);
    }
  }

  // 3. Commission Transactions
  if (reviewRequestOr.length > 0) {
    const bookingsToDelete = await prisma.booking.findMany({
      where: { OR: reviewRequestOr }
    });
    const bookingIds = bookingsToDelete.map(b => b.id);
    if (bookingIds.length > 0) {
      const commTxs = await prisma.commissionTransaction.deleteMany({
        where: { bookingId: { in: bookingIds } }
      });
      console.log(`Deleted ${commTxs.count} CommissionTransactions.`);
      const bks = await prisma.booking.deleteMany({
        where: { id: { in: bookingIds } }
      });
      console.log(`Deleted ${bks.count} Bookings.`);
    }
  }

  // 4. Commission Policies
  if (reviewRequestOr.length > 0) {
    const policiesDeleted = await prisma.commissionPolicy.deleteMany({
      where: { OR: reviewRequestOr }
    });
    console.log(`Deleted ${policiesDeleted.count} CommissionPolicies.`);
  }

  // 5. LayoutUnits and InventoryUnits
  if (projectWhere) {
    const layouts = await prisma.projectLayout.findMany({
      where: { projectId: projectWhere }
    });
    const layoutIds = layouts.map(l => l.id);
    if (layoutIds.length > 0) {
      const lu = await prisma.layoutUnit.deleteMany({
        where: { layoutId: { in: layoutIds } }
      });
      console.log(`Deleted ${lu.count} LayoutUnits.`);
      const pl = await prisma.projectLayout.deleteMany({
        where: { id: { in: layoutIds } }
      });
      console.log(`Deleted ${pl.count} ProjectLayouts.`);
    }

    const iu = await prisma.inventoryUnit.deleteMany({
      where: { projectId: projectWhere }
    });
    console.log(`Deleted ${iu.count} InventoryUnits.`);

    const pm = await prisma.projectMedia.deleteMany({
      where: { projectId: projectWhere }
    });
    console.log(`Deleted ${pm.count} ProjectMedia.`);

    const offers = await prisma.offer.deleteMany({
      where: { projectId: projectWhere }
    });
    console.log(`Deleted ${offers.count} Offers.`);

    const carousels = await prisma.carouselItem.deleteMany({
      where: { projectId: projectWhere }
    });
    console.log(`Deleted ${carousels.count} CarouselItems.`);

    const popups = await prisma.promotionalPopup.deleteMany({
      where: { projectId: projectWhere }
    });
    console.log(`Deleted ${popups.count} PromotionalPopups.`);
  }

  // 6. Travel and Site Visits
  const travelOr = [];
  if (userWhere) travelOr.push({ requesterId: userWhere });
  if (projectWhere) travelOr.push({ projectId: projectWhere });
  if (travelOr.length > 0) {
    const travelDeleted = await prisma.travelRequest.deleteMany({
      where: { OR: travelOr }
    });
    console.log(`Deleted ${travelDeleted.count} TravelRequests.`);
  }

  if (reviewRequestOr.length > 0) {
    const siteVisitsDeleted = await prisma.siteVisit.deleteMany({
      where: { OR: reviewRequestOr }
    });
    console.log(`Deleted ${siteVisitsDeleted.count} SiteVisits.`);
  }

  // 7. Team relationships and requests
  if (userWhere) {
    const rels = await prisma.teamRelationship.deleteMany({
      where: {
        OR: [
          { parentAssociateId: userWhere },
          { childAssociateId: userWhere }
        ]
      }
    });
    console.log(`Deleted ${rels.count} TeamRelationships.`);

    // proposedParentId can be null, so we must be careful. If userWhere is `{ in: [...] }`, it's safe.
    const reqs = await prisma.teamRequest.deleteMany({
      where: {
        OR: [
          { requesterId: userWhere },
          { targetAssociateId: userWhere },
          { proposedParentId: userWhere }
        ]
      }
    });
    console.log(`Deleted ${reqs.count} TeamRequests.`);
  }

  // 8. Delete Projects and Users
  if (projectWhere) {
    const pDeleted = await prisma.project.deleteMany({
      where: { id: projectWhere }
    });
    console.log(`Deleted ${pDeleted.count} Projects.`);
  }

  if (userWhere) {
    const uDeleted = await prisma.user.deleteMany({
      where: { id: userWhere }
    });
    console.log(`Deleted ${uDeleted.count} Users.`);
  }

  console.log('=== CLEANUP COMPLETE ===');
  await prisma.$disconnect();
}

cleanup().catch(e => {
  console.error('Cleanup failed:', e);
  process.exit(1);
});

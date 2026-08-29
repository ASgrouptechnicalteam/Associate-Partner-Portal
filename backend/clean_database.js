const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING PRE-DEPLOYMENT DATA CLEANUP ---');
  
  // Step 1: Initial counts
  const modelNames = [
    'user', 'team', 'project', 'inventoryUnit', 'projectLayout', 'layoutElement',
    'booking', 'siteVisit', 'demoBooking', 'notification', 'commissionTransaction',
    'commissionPolicy', 'reviewRequest', 'offer', 'fAQ', 'fAQCategory', 'tutorial',
    'carouselItem', 'popup', 'auditLog'
  ];
  
  const initialCounts = {};
  for (const m of modelNames) {
    if (prisma[m]) {
      initialCounts[m] = await prisma[m].count();
    }
  }
  console.log('Initial Counts:', initialCounts);

  // Identify Protected Accounts
  const protectedRoles = await prisma.role.findMany({
    where: { name: { in: ['MD', 'CHANNEL_PARTNER_MANAGER'] } }
  });
  const protectedRoleIds = protectedRoles.map(r => r.id);

  const allUsers = await prisma.user.findMany({ include: { role: true } });
  
  const protectedUsers = allUsers.filter(u => protectedRoleIds.includes(u.roleId));
  const testUsers = allUsers.filter(u => !protectedRoleIds.includes(u.roleId));

  console.log(`Protected Accounts (${protectedUsers.length}):`);
  protectedUsers.forEach(u => console.log(`- ${u.userIdentifier} (${u.name}) - ${u.role.name}`));
  
  console.log(`Test Accounts to Delete (${testUsers.length}):`);
  testUsers.forEach(u => console.log(`- ${u.userIdentifier} (${u.name}) - ${u.role.name}`));

  // Perform Deletions
  try {
    // 1. Clear relations on Protected Users before we delete test data they might be linked to
    for (const u of protectedUsers) {
      await prisma.user.update({
        where: { id: u.id },
        data: { parentId: null, teamId: null }
      });
    }
    console.log('Cleared parent/team relationships from protected users.');

    // 2. Delete Bookings, SiteVisits, DemoBookings, Notifications, Commissions, Reviews, Offers
    if (prisma.booking) await prisma.booking.deleteMany();
    if (prisma.siteVisit) await prisma.siteVisit.deleteMany();
    if (prisma.demoBooking) await prisma.demoBooking.deleteMany();
    if (prisma.notification) await prisma.notification.deleteMany();
    if (prisma.commissionTransaction) await prisma.commissionTransaction.deleteMany();
    // Assuming commissionPolicies are test data if created by users or specific ones. 
    // Usually all commission policies are cleared in a reset unless they are system defaults. We'll clear all.
    if (prisma.commissionPolicy) await prisma.commissionPolicy.deleteMany();
    if (prisma.reviewRequest) await prisma.reviewRequest.deleteMany();
    if (prisma.offer) await prisma.offer.deleteMany();
    
    console.log('Deleted transactional test data (Bookings, Visits, Commissions, etc).');

    // 3. Delete Layouts & Inventory
    if (prisma.layoutElement) await prisma.layoutElement.deleteMany();
    if (prisma.projectLayout) await prisma.projectLayout.deleteMany();
    if (prisma.inventoryUnit) await prisma.inventoryUnit.deleteMany();
    console.log('Deleted Layouts & Inventory.');

    // 4. Delete Projects and remaining dependencies
    if (prisma.projectMedia) await prisma.projectMedia.deleteMany();
    if (prisma.promotionalPopup) await prisma.promotionalPopup.deleteMany();
    if (prisma.project) await prisma.project.deleteMany();
    console.log('Deleted Projects.');

    // 5. Delete Teams
    if (prisma.team) {
      // First nullify Team Head relationships
      await prisma.team.updateMany({ data: { headUserId: null } });
      await prisma.team.deleteMany();
      console.log('Deleted Teams.');
    }

    // 6. Delete Test Users
    for (const u of testUsers) {
      await prisma.user.delete({ where: { id: u.id } });
    }
    console.log('Deleted Test Users.');

    // 7. Delete CMS / FAQs / Tutorials
    if (prisma.fAQ) await prisma.fAQ.deleteMany();
    if (prisma.fAQCategory) await prisma.fAQCategory.deleteMany();
    if (prisma.tutorial) await prisma.tutorial.deleteMany();
    if (prisma.carouselItem) await prisma.carouselItem.deleteMany();
    if (prisma.popup) await prisma.popup.deleteMany();
    console.log('Deleted CMS data.');

    // 8. Delete Audit Logs
    if (prisma.auditLog) await prisma.auditLog.deleteMany();
    console.log('Deleted Audit Logs.');

    // Step Final: Final counts
    const finalCounts = {};
    for (const m of modelNames) {
      if (prisma[m]) {
        finalCounts[m] = await prisma[m].count();
      }
    }
    console.log('Final Counts:', finalCounts);
    
    // Save report data
    fs.writeFileSync('cleanup_report.json', JSON.stringify({
      initialCounts,
      finalCounts,
      protectedUsers: protectedUsers.map(u => ({ id: u.id, uid: u.userIdentifier, role: u.role.name })),
      testUsersDeleted: testUsers.length
    }, null, 2));

  } catch (error) {
    console.error('Error during database cleanup:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

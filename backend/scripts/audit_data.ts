import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function audit() {
  console.log('=== DATABASE AUDIT ===');
  
  // 1. Users
  const users = await prisma.user.findMany();
  console.log(`\nTotal Users: ${users.length}`);
  
  const testUsers = users.filter(u => 
    u.email === 'associate@sonthillu.com' ||
    u.email === 'manager@sonthillu.com' ||
    u.email.includes('test.com') ||
    u.name.toLowerCase().includes('test') ||
    u.role === 'TEST'
  );
  
  const mdAmUsers = users.filter(u => 
    u.email === 'md@sonthillu.com' || 
    u.email === 'am@sonthillu.com'
  );
  
  const otherUsers = users.filter(u => 
    !testUsers.includes(u) && !mdAmUsers.includes(u)
  );

  console.log('MD/AM Users to PRESERVE:');
  mdAmUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));
  
  console.log('\nTEST Users to DELETE:');
  testUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));
  
  console.log('\nAmbiguous/Other Users:');
  otherUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));

  // 2. Projects
  const projects = await prisma.project.findMany();
  console.log(`\nTotal Projects: ${projects.length}`);
  const testProjects = projects.filter(p => 
    p.name.toLowerCase().includes('test') || 
    p.name === 'TP01' ||
    p.name === 'Test Project'
  );
  const otherProjects = projects.filter(p => !testProjects.includes(p));

  console.log('\nTEST Projects to DELETE:');
  testProjects.forEach(p => console.log(`  - ${p.name}`));
  
  console.log('\nAmbiguous/Other Projects:');
  otherProjects.forEach(p => console.log(`  - ${p.name}`));

  // 3. Other Records
  const inventoryUnits = await prisma.inventoryUnit.count();
  const bookings = await prisma.booking.count();
  const policies = await prisma.commissionPolicy.count();
  const tx = await prisma.commissionTransaction.count();
  const relationships = await prisma.teamRelationship.count();
  const teamRequests = await prisma.teamRequest.count();
  const travel = await prisma.travelRequest.count();
  const siteVisits = await prisma.siteVisit.count();
  const offers = await prisma.offer.count();
  const carousels = await prisma.carouselItem.count();
  const popups = await prisma.promotionalPopup.count();
  const reviewRequests = await prisma.reviewRequest.count();
  const reviews = await prisma.review.count();
  const notifications = await prisma.notification.count();
  // const authRequests = await prisma.authorizationRequest.count().catch(() => 0);

  console.log('\nTotal Counts for Other Models:');
  console.log(`  InventoryUnits: ${inventoryUnits}`);
  console.log(`  Bookings: ${bookings}`);
  console.log(`  CommissionPolicies: ${policies}`);
  console.log(`  CommissionTransactions: ${tx}`);
  console.log(`  TeamRelationships: ${relationships}`);
  console.log(`  TeamRequests: ${teamRequests}`);
  console.log(`  TravelRequests: ${travel}`);
  console.log(`  SiteVisits: ${siteVisits}`);
  console.log(`  Offers: ${offers}`);
  console.log(`  CarouselItems: ${carousels}`);
  console.log(`  PromotionalPopups: ${popups}`);
  console.log(`  ReviewRequests: ${reviewRequests}`);
  console.log(`  Reviews: ${reviews}`);
  console.log(`  Notifications: ${notifications}`);
  // console.log(`  AuthRequests: ${authRequests}`);

  await prisma.$disconnect();
}

audit().catch(e => {
  console.error(e);
  process.exit(1);
});

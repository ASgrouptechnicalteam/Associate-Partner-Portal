const { PrismaClient } = require('@prisma/client');
const { userService } = require('./src/services/userService');
const { TeamService } = require('./src/services/teamService');
const { BookingService } = require('./src/services/bookingService');

const prisma = new PrismaClient();

async function runTests() {
  console.log("Running Security Tests...");
  
  // Find or create test users
  const md = await prisma.user.findFirst({ where: { role: { name: 'MD' } } });
  const cpm = await prisma.user.findFirst({ where: { role: { name: 'CHANNEL_PARTNER_MANAGER' } } });
  
  if (!md || !cpm) {
      console.log("Test users missing");
      return;
  }
  
  // Find an associate in CPM's downline
  const cpmDownlineIds = await TeamService.getFullDownline(cpm.id);
  const downlineAssoc = await prisma.user.findFirst({ where: { id: { in: cpmDownlineIds }, role: { name: 'ASSOCIATE' } } });
  
  // Find an unrelated associate
  const unrelatedAssoc = await prisma.user.findFirst({ where: { id: { notIn: [cpm.id, ...cpmDownlineIds] }, role: { name: 'ASSOCIATE' } } });

  console.log(`Test users mapped:
    MD: ${md.id}
    CPM: ${cpm.id}
    Assoc (Downline): ${downlineAssoc?.id}
    Assoc (Unrelated): ${unrelatedAssoc?.id}
  `);

  let results = {};

  if (!downlineAssoc || !unrelatedAssoc) {
      console.log("Could not find required associates for testing.");
      return;
  }

  // SEC-001: Associate fetch own user
  try {
    await userService.getUserById(downlineAssoc.id, downlineAssoc.id, 'ASSOCIATE');
    results['SEC-001'] = '200 OK';
  } catch (e) { results['SEC-001'] = e.message; }

  // SEC-002: Associate fetch downline user
  // Let's assume downlineAssoc has a downline, else skip or mock
  try {
    const assocDownlineIds = await TeamService.getFullDownline(downlineAssoc.id);
    if(assocDownlineIds.length > 0) {
      await userService.getUserById(assocDownlineIds[0], downlineAssoc.id, 'ASSOCIATE');
      results['SEC-002'] = '200 OK';
    } else {
      results['SEC-002'] = '200 OK (Simulated - no downline)';
    }
  } catch (e) { results['SEC-002'] = e.message; }

  // SEC-003: Associate fetch unrelated user
  try {
    await userService.getUserById(unrelatedAssoc.id, downlineAssoc.id, 'ASSOCIATE');
    results['SEC-003'] = '200 OK';
  } catch (e) { results['SEC-003'] = e.message.includes('Forbidden') ? '403 Forbidden' : e.message; }

  // SEC-004: CPM fetch permitted user
  try {
    await userService.getUserById(downlineAssoc.id, cpm.id, 'CHANNEL_PARTNER_MANAGER');
    results['SEC-004'] = '200 OK';
  } catch (e) { results['SEC-004'] = e.message; }

  // SEC-005: CPM fetch unrelated user
  try {
    await userService.getUserById(unrelatedAssoc.id, cpm.id, 'CHANNEL_PARTNER_MANAGER');
    results['SEC-005'] = '200 OK';
  } catch (e) { results['SEC-005'] = e.message.includes('Forbidden') ? '403 Forbidden' : e.message; }

  // SEC-006: CPM update permitted user
  try {
    await userService.updateUser(downlineAssoc.id, { name: 'Test' }, cpm.id, 'CHANNEL_PARTNER_MANAGER');
    results['SEC-006'] = '200 OK';
  } catch (e) { results['SEC-006'] = e.message; }

  // SEC-007: CPM update unrelated user
  try {
    await userService.updateUser(unrelatedAssoc.id, { name: 'Test' }, cpm.id, 'CHANNEL_PARTNER_MANAGER');
    results['SEC-007'] = '200 OK';
  } catch (e) { results['SEC-007'] = e.message.includes('Forbidden') ? '403 Forbidden' : e.message; }

  // Role escalation protection
  try {
    await userService.updateUser(downlineAssoc.id, { role: 'MD' }, cpm.id, 'CHANNEL_PARTNER_MANAGER');
    results['SEC-016'] = '200 OK';
  } catch (e) { results['SEC-016'] = e.message.includes('Forbidden') ? '403 Forbidden' : e.message; }

  // Parent escalation protection
  try {
    await userService.updateUser(downlineAssoc.id, { referralUserId: unrelatedAssoc.userIdentifier }, cpm.id, 'CHANNEL_PARTNER_MANAGER');
    results['SEC-018'] = '200 OK';
  } catch (e) { results['SEC-018'] = e.message.includes('Forbidden') ? '403 Forbidden' : e.message; }

  console.log("Results:\n", JSON.stringify(results, null, 2));
  process.exit(0);
}

runTests().catch(console.error);

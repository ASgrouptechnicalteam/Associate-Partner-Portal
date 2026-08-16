const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { TeamService } = require('./dist/services/teamService');

async function test() {
  console.log("Starting Phase 7 Team Validation Tests...");
  
  const md = await prisma.user.findFirst({ where: { role: { name: 'MD' } } });
  const am = await prisma.user.findFirst({ where: { role: { name: 'ASSOCIATE_MANAGER' } } });
  const associate = await prisma.user.findFirst({ where: { role: { name: 'ASSOCIATE' } } });
  
  if (!md || !am || !associate) {
    console.log("Test skipping: missing required seed data.");
    return;
  }

  // 1. Create a dummy child associate
  const child1 = await prisma.user.create({
    data: {
      associateId: 'TEST-CHILD-' + Date.now(),
      name: 'Test Child 1',
      email: 'child1_' + Date.now() + '@test.com',
      passwordHash: 'hashed',
      roleId: associate.roleId
    }
  });

  const child2 = await prisma.user.create({
    data: {
      associateId: 'TEST-CHILD-2-' + Date.now(),
      name: 'Test Child 2',
      email: 'child2_' + Date.now() + '@test.com',
      passwordHash: 'hashed',
      roleId: associate.roleId
    }
  });

  // 2. Add Request Workflow (Associate -> Child 1)
  console.log("Test 1: Create ADD Request");
  const addReq = await prisma.teamRequest.create({
    data: {
      requesterId: associate.id,
      targetAssociateId: child1.id,
      proposedParentId: associate.id,
      requestType: 'ADD',
      reason: 'Testing add workflow'
    }
  });
  console.log("Created ADD Request:", addReq.id);

  // 3. Approve Request
  await prisma.$transaction(async (tx) => {
    await TeamService.assignAssociateToParentTx(tx, addReq.proposedParentId, addReq.targetAssociateId);
    await tx.teamRequest.update({ where: { id: addReq.id }, data: { status: 'APPROVED' }});
  });
  console.log("Approved ADD Request -> Assigned successfully");

  // 4. Test Downline Scope
  const downline = await TeamService.getFullDownline(associate.id);
  if (downline.includes(child1.id)) {
    console.log("Scope Test: child1 successfully in Associate's downline");
  } else {
    throw new Error("child1 missing from downline");
  }

  // 5. Test Cycle Detection
  console.log("Test 2: Cycle Detection");
  let cycleDetected = false;
  try {
    // Attempt to make associate a child of child1 (Cycle: associate -> child1 -> associate)
    await prisma.$transaction(async (tx) => {
      await TeamService.assignAssociateToParentTx(tx, child1.id, associate.id);
    });
  } catch (err) {
    cycleDetected = true;
    console.log("Cycle detected successfully:", err.message);
  }
  if (!cycleDetected) throw new Error("Failed to detect cycle!");

  // 6. Test Stats
  const stats = await TeamService.getTeamStatistics(associate.id);
  console.log("Team Stats for Associate:", stats);

  console.log("All manual verification tests passed.");
}

test().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const mdUser = await prisma.user.findFirst({ where: { role: { name: 'MD' } } });
  const associateRole = await prisma.role.findFirst({ where: { name: 'ASSOCIATE' } });
  
  // Find or create a team
  let team = await prisma.team.findFirst();
  if (!team) {
    team = await prisma.team.create({ data: { name: 'Test Team', headUserId: mdUser.id } });
  }

  // Create Parent User
  const parent = await prisma.user.create({
    data: {
      userIdentifier: `TEST-${Date.now().toString().slice(-4)}`,
      name: 'Test Parent',
      email: `testparent${Date.now()}@example.com`,
      passwordHash: await bcrypt.hash('password123', 10),
      roleId: associateRole.id,
      teamId: team.id,
      status: 'ACTIVE'
    }
  });

  console.log(`Created parent: ${parent.userIdentifier} in Team ${team.name}`);

  // Simulate CreateUser payload
  const payload = {
    name: 'Test Child',
    email: `testchild${Date.now()}@example.com`,
    password: 'password123',
    referralUserId: parent.userIdentifier, // Provided raw from frontend
    teamId: 'invalid-team-id' // Should be ignored
  };

  // Run the logic from userService.createUser
  let parentId = null;
  let teamId = null;

  if (payload.referralUserId) {
    const parentUser = await prisma.user.findUnique({ where: { userIdentifier: payload.referralUserId } });
    if (!parentUser) throw new Error('Referral User ID not found');
    parentId = parentUser.id;
    teamId = parentUser.teamId; // STRICTLY INHERIT TEAM FROM REFERRAL
  } else if (payload.teamId) {
    teamId = payload.teamId; // ONLY USE MANUAL TEAM IF NO REFERRAL
  }

  const child = await prisma.user.create({
    data: {
      userIdentifier: `TEST-${(Date.now() + 1).toString().slice(-4)}`,
      name: payload.name,
      email: payload.email,
      passwordHash: await bcrypt.hash(payload.password, 10),
      roleId: associateRole.id,
      parentId: parentId,
      teamId: teamId,
      status: 'ACTIVE'
    },
    include: { parent: true, team: true }
  });

  console.log(`Created child: ${child.userIdentifier}`);
  console.log(`  Parent is: ${child.parent?.userIdentifier}`);
  console.log(`  Team is: ${child.team?.name}`);

  // Check Hierarchy Service output
  const HierarchyService = require('./src/services/hierarchyService').HierarchyService;
  const tree = await HierarchyService.buildTree(null, team.id);
  
  function printTree(nodes, depth = 0) {
    for (const node of nodes) {
      console.log(`${' '.repeat(depth * 2)}- ${node.userIdentifier} (${node.name})`);
      if (node.children && node.children.length > 0) {
        printTree(node.children, depth + 1);
      }
    }
  }

  console.log('\nHierarchy Tree:');
  printTree(tree);

  // Clean up
  await prisma.user.delete({ where: { id: child.id } });
  await prisma.user.delete({ where: { id: parent.id } });
}

main().catch(console.error).finally(() => prisma.$disconnect());

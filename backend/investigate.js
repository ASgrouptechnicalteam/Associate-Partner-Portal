const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== CHECKING TEAM DETAIL AND TEAM OVERVIEW API ===");
  
  const mdUser = await prisma.user.findFirst({ where: { role: { name: 'MD' } } });
  if (mdUser) {
    console.log("Found MD:", mdUser.userIdentifier, mdUser.name);
  }

  // Find a user with a referral
  const usersWithParent = await prisma.user.findMany({
    where: { parentId: { not: null } },
    include: { parent: true, team: true },
    take: 5
  });

  console.log("\n=== USERS WITH PARENT ===");
  for (const u of usersWithParent) {
    console.log(`User: ${u.userIdentifier} (${u.name})`);
    console.log(`  Parent: ${u.parent.userIdentifier} (${u.parent.name})`);
    console.log(`  Team: ${u.teamId ? u.team.name : 'NULL'} | Parent Team: ${u.parent.teamId}`);
  }

  // Check how many users have a parent but teamId is null, while parent has teamId
  const missedTeams = await prisma.user.findMany({
    where: {
      parentId: { not: null },
      teamId: null
    },
    include: { parent: true }
  });
  
  console.log(`\n=== USERS WITH PARENT BUT NO TEAM (${missedTeams.length}) ===`);
  for (const u of missedTeams) {
    if (u.parent.teamId) {
      console.log(`Mismatch! User ${u.userIdentifier} has no team, but parent ${u.parent.userIdentifier} has team ${u.parent.teamId}`);
    }
  }

  console.log("\n=== CHECKING IF HIERARCHY SERVICE RELIES ON TEAM OR PARENT ===");
  
  // Just log how many teams and users we have
  const teams = await prisma.team.count();
  const users = await prisma.user.count();
  console.log(`Total Teams: ${teams}, Total Users: ${users}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

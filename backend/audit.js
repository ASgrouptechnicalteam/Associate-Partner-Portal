const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mds = await prisma.user.findMany({
    where: { designation: 'Marketing Director' },
    select: { id: true, name: true, parentId: true, teamId: true }
  });
  
  const results = [];
  for (const md of mds) {
    const teams = await prisma.team.findMany({ where: { headUserId: md.id }, select: { id: true, name: true } });
    results.push({ ...md, headedTeams: teams });
  }
  
  console.log(JSON.stringify(results, null, 2));
}

main().finally(() => prisma.$disconnect());

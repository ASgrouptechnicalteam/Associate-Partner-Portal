const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mds = await prisma.user.findMany({
    where: { designation: 'Marketing Director' },
    select: { id: true, name: true, parentId: true, teamId: true, headedTeams: { select: { id: true, name: true } } }
  });
  console.log(JSON.stringify(mds, null, 2));
}

main().finally(() => prisma.$disconnect());

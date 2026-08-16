const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function m() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, associateId: true }});
  console.log(JSON.stringify(users, null, 2));
}

m().finally(() => prisma.$disconnect());

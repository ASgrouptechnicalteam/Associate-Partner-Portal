const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      status: true,
      associateId: true,
      role: { select: { name: true } }
    }
  });
  console.log(JSON.stringify(users, null, 2));
}
run().finally(() => prisma.$disconnect());

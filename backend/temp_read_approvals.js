const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      status: true,
      approvedBy: true,
      createdAt: true
    }
  });
  console.log(JSON.stringify(users, null, 2));
}
run().finally(() => prisma.$disconnect());

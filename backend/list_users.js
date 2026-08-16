const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ select: { email: true, role: { select: { name: true } } } });
  console.log(users);
}
run().finally(() => prisma.$disconnect());

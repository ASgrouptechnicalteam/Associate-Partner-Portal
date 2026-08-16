import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log(users.map(u => ({ id: u.id, role: u.role, associateId: u.associateId, email: u.email })));
  await prisma.$disconnect();
}

run();

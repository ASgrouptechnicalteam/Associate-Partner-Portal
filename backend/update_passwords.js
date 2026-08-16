const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function run() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.updateMany({ data: { passwordHash: hash, status: 'ACTIVE' } });
  console.log('Passwords updated');
}
run().finally(() => prisma.$disconnect());

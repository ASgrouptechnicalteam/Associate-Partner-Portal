import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkPasswords() {
  const md = await prisma.user.findUnique({ where: { email: 'md@sonthillu.com' } });
  const am = await prisma.user.findUnique({ where: { email: 'am@sonthillu.com' } });
  
  if (!md || !am) {
    console.log('MD or AM not found!');
    process.exit(1);
  }
  
  const mdValid = await bcrypt.compare('Password123!', md.passwordHash);
  const amValid = await bcrypt.compare('Password123!', am.passwordHash);
  
  console.log(`MD Login Valid: ${mdValid}`);
  console.log(`AM Login Valid: ${amValid}`);
  
  await prisma.$disconnect();
}

checkPasswords().catch(console.error);

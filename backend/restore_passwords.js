const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function run() {
  const hashMain = await bcrypt.hash('Password123!', 10);
  
  // 1. Restore the main test accounts
  const mainEmails = ['md@sonthillu.com', 'am@sonthillu.com', 'associate@sonthillu.com', 'manager@sonthillu.com'];
  const updateMain = await prisma.user.updateMany({
    where: { email: { in: mainEmails } },
    data: { passwordHash: hashMain, status: 'ACTIVE' }
  });
  console.log(`Restored ${updateMain.count} main test accounts to Password123!`);

  // 2. Restore child test accounts created via test_team.js
  const updateChild = await prisma.user.updateMany({
    where: { email: { startsWith: 'child' } },
    data: { passwordHash: 'hashed', status: 'ACTIVE' }
  });
  console.log(`Restored ${updateChild.count} child test accounts to 'hashed'`);

  // 3. Restore any other manual accounts to Password123! as a safe fallback
  const otherEmails = ['amruthswaroopvasamsetti@gmail.com', 'amruth@gmail.com'];
  const updateOther = await prisma.user.updateMany({
    where: { email: { in: otherEmails } },
    data: { passwordHash: hashMain, status: 'ACTIVE' }
  });
  console.log(`Restored ${updateOther.count} other manual accounts to Password123!`);
  
  // Also check if they should be PENDING_APPROVAL
  // If amruthswaroopvasamsetti was never approved, they should be PENDING_APPROVAL?
  // Let's leave them ACTIVE for now as they might have been active.
  
}
run().catch(console.error).finally(() => prisma.$disconnect());

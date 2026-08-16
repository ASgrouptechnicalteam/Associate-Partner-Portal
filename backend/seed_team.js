const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  await prisma.teamRelationship.deleteMany({});
  const am = await prisma.user.findFirst({where: {email: 'am@sonthillu.com'}});
  const assoc = await prisma.user.findFirst({where: {email: 'associate@sonthillu.com'}});
  await prisma.teamRelationship.create({
    data: { 
      status: 'ACTIVE', 
      parent: { connect: { id: am.id } },
      child: { connect: { id: assoc.id } }
    }
  });
  console.log('Created relationship'); 
} 
run().catch(console.error).finally(()=>prisma.$disconnect());

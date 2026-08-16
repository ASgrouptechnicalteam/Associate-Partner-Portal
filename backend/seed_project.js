const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  const md = await prisma.user.findFirst({where: {email: 'md@sonthillu.com'}});
  const p = await prisma.project.create({ 
    data: { name: 'Test Project', code: 'TP01', location: 'City', status: 'ACTIVE', projectType: 'RESIDENTIAL', createdBy: md.id } 
  }); 
  console.log('Created project', p.id); 
} 
run().catch(console.error).finally(()=>prisma.$disconnect());

require('ts-node').register();
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedTestData() {
  const md = await prisma.user.findFirst({ where: { role: { name: 'MD' } } });
  
  if (!md) {
    console.error('MD not found');
    return;
  }

  // Create a verified project
  const project = await prisma.project.create({
    data: {
      code: 'TEST-PROJ-' + Date.now(),
      name: 'Test Project',
      location: 'Test Location',
      projectType: 'RESIDENTIAL',
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      createdBy: md.id,
      approvedBy: md.id,
      approvedAt: new Date()
    }
  });

  // Create available inventory
  await prisma.inventoryUnit.create({
    data: {
      projectId: project.id,
      unitNumber: 'UNIT-TEST-1',
      propertyType: 'PLOT',
      price: 10000,
      status: 'AVAILABLE'
    }
  });

  console.log('Test project and inventory created successfully!');
}

seedTestData().catch(console.error).finally(() => prisma.$disconnect());

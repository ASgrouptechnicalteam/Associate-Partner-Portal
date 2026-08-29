const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const teamRelationships = await prisma.teamRelationship.count();
  const travelRequests = await prisma.travelRequest.count();
  
  console.log(`Users: ${users}`);
  console.log(`TeamRelationships: ${teamRelationships}`);
  console.log(`TravelRequests: ${travelRequests}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

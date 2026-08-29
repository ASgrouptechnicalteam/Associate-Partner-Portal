import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 3 Dynamic Main Teams for scalability testing...');
  
  const teamsToCreate = [
    { name: 'Alpha Sales Team' },
    { name: 'Beta Horizon Group' },
    { name: 'Gamma Prestige Team' }
  ];

  for (const t of teamsToCreate) {
    const existing = await prisma.team.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.team.create({ data: t });
      console.log(`Created team: ${t.name}`);
    } else {
      console.log(`Team ${t.name} already exists`);
    }
  }

  const allTeams = await prisma.team.findMany();
  console.log(`Total Teams in DB: ${allTeams.length}`);
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

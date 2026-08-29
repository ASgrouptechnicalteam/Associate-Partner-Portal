const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const models = [
    'user',
    'role',
    'permission',
    'team',
    'project',
    'projectLayout',
    'layoutElement',
    'inventoryUnit',
    'booking',
    'siteVisit',
    'demoBooking',
    'notification',
    'commissionTransaction',
    'commissionPolicy',
    'reviewRequest',
    'offer',
    'fAQ',
    'fAQCategory',
    'tutorial',
    'carouselItem',
    'popup',
    'auditLog'
  ];

  const backup = {};
  const counts = {};

  for (const model of models) {
    if (prisma[model]) {
      const data = await prisma[model].findMany();
      backup[model] = data;
      counts[model] = data.length;
    }
  }

  fs.writeFileSync('database_backup.json', JSON.stringify(backup, null, 2));
  fs.writeFileSync('database_counts.json', JSON.stringify(counts, null, 2));

  console.log('Backup successful. Counts:', counts);
}

main().catch(console.error).finally(() => prisma.$disconnect());

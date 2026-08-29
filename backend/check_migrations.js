const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRawUnsafe('SELECT * FROM _prisma_migrations')
  .then(rows => console.log(rows.map(r => r.migration_name)))
  .catch(console.error)
  .finally(()=>p.$disconnect());

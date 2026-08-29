const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$executeRawUnsafe('CREATE DATABASE IF NOT EXISTS shadow_db')
  .then(()=>console.log('done'))
  .catch(console.error)
  .finally(()=>p.$disconnect());

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const crypto = require('crypto');

const p = new PrismaClient();
const sql = fs.readFileSync('../prisma/migrations/20260825134800_phase2_features/migration.sql', 'utf8');
const checksum = crypto.createHash('sha256').update(sql).digest('hex');

p.$executeRawUnsafe(`INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES (UUID(), '${checksum}', NOW(), '20260825134800_phase2_features', NULL, NULL, NOW(), 1)`)
  .then(() => console.log('Migration inserted'))
  .catch(console.error)
  .finally(() => p.$disconnect());

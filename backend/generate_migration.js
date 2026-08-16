const fs = require('fs');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  let updateStatements = '';
  const usedIds = new Set();
  
  function generateId(prefix) {
    let id;
    do {
      const num = crypto.randomInt(1000, 10000).toString();
      id = `${prefix}-${num}`;
    } while (usedIds.has(id));
    usedIds.add(id);
    return id;
  }
  
  for (const user of users) {
    let newId = null;
    if (user.employeeId === 'MD-001') {
      newId = generateId('ASSOC-MD');
    } else if (user.employeeId === 'MGR-001') {
      newId = generateId('ASSOC-MN');
    } else if (user.employeeId) {
      newId = generateId('ASSOC-RS');
    }
    
    if (newId) {
      updateStatements += `UPDATE \`user\` SET \`associateId\` = '${newId}' WHERE \`id\` = '${user.id}';\n`;
    }
  }

  const sql = `-- DropIndex
DROP INDEX \`User_employeeId_key\` ON \`user\`;

-- AlterTable: Rename employeeId to associateId and add new fields
ALTER TABLE \`user\` CHANGE COLUMN \`employeeId\` \`associateId\` VARCHAR(191) NULL,
    ADD COLUMN \`aadhaarNumber\` VARCHAR(191) NULL,
    ADD COLUMN \`accountNumber\` VARCHAR(191) NULL,
    ADD COLUMN \`activeSessionId\` VARCHAR(191) NULL,
    ADD COLUMN \`approvedAt\` DATETIME(3) NULL,
    ADD COLUMN \`approvedBy\` VARCHAR(191) NULL,
    ADD COLUMN \`bankName\` VARCHAR(191) NULL,
    ADD COLUMN \`bloodGroup\` VARCHAR(191) NULL,
    ADD COLUMN \`branchName\` VARCHAR(191) NULL,
    ADD COLUMN \`commissionPercentage\` DOUBLE NULL,
    ADD COLUMN \`createdBy\` VARCHAR(191) NULL,
    ADD COLUMN \`currentAddress\` VARCHAR(191) NULL,
    ADD COLUMN \`dateOfJoining\` DATETIME(3) NULL,
    ADD COLUMN \`department\` VARCHAR(191) NULL,
    ADD COLUMN \`emergencyContactName\` VARCHAR(191) NULL,
    ADD COLUMN \`emergencyContactPhone\` VARCHAR(191) NULL,
    ADD COLUMN \`emergencyContactRelation\` VARCHAR(191) NULL,
    ADD COLUMN \`ifscCode\` VARCHAR(191) NULL,
    ADD COLUMN \`jobTitle\` VARCHAR(191) NULL,
    ADD COLUMN \`mustChangePassword\` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN \`panNumber\` VARCHAR(191) NULL,
    ADD COLUMN \`permanentAddress\` VARCHAR(191) NULL,
    ADD COLUMN \`rejectionReason\` VARCHAR(191) NULL,
    ADD COLUMN \`secondaryPhone\` VARCHAR(191) NULL,
    ADD COLUMN \`socialMedia\` JSON NULL,
    ADD COLUMN \`status\` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN \`whatsappNumber\` VARCHAR(191) NULL,
    ADD COLUMN \`workLocation\` VARCHAR(191) NULL;

-- Migrate Status
UPDATE \`user\` SET \`status\` = 'DEACTIVATED' WHERE \`isActive\` = false;
UPDATE \`user\` SET \`status\` = 'ACTIVE' WHERE \`isActive\` = true;

-- Assign Secure Generated IDs
${updateStatements}

-- Drop isActive
ALTER TABLE \`user\` DROP COLUMN \`isActive\`;

-- CreateIndex
CREATE UNIQUE INDEX \`User_associateId_key\` ON \`User\`(\`associateId\`);
`;

  fs.writeFileSync('../temp_migration_final.sql', sql);
  console.log('Successfully wrote temp_migration_final.sql');
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const backup = JSON.parse(fs.readFileSync('database_backup.json'));
  const am = backup.user.find(u => u.userIdentifier === 'AM-001');
  
  if (!am) {
    console.error('AM-001 not found in backup');
    return;
  }

  // Find roles
  const roles = await prisma.role.findMany();
  const cpmDuplicate = roles.find(r => r.name === 'CHANNEL_PARTNER_MANAGER');
  const amOriginal = roles.find(r => r.name === 'ASSOCIATE_MANAGER');

  // Delete duplicate CPM role if it exists and it's not the original AM role
  if (cpmDuplicate && (!amOriginal || cpmDuplicate.id !== amOriginal.id)) {
    console.log(`Deleting duplicate CPM role... ${cpmDuplicate.id}`);
    await prisma.role.delete({ where: { id: cpmDuplicate.id } });
  }

  // Rename original AM role to CPM
  if (amOriginal) {
    console.log(`Renaming original AM role ${amOriginal.id} to CHANNEL_PARTNER_MANAGER...`);
    await prisma.role.update({
      where: { id: amOriginal.id },
      data: {
        name: 'CHANNEL_PARTNER_MANAGER',
        description: 'Channel Partner Manager'
      }
    });
  } else if (!cpmDuplicate) {
    console.log('Original AM role missing and no CPM role exists. Need manual intervention.');
  } else {
    console.log('AM role was already renamed previously.');
  }

  // Restore the user
  const currentRole = await prisma.role.findFirst({ where: { name: 'CHANNEL_PARTNER_MANAGER' } });
  if (!currentRole) {
    console.error('Could not find CHANNEL_PARTNER_MANAGER role');
    return;
  }

  console.log(`Restoring user ${am.userIdentifier}...`);
  // clean up roleId from backup data just in case, we'll set it to the correct one
  const { id, roleId, teamId, parentId, ...userData } = am;
  
  await prisma.user.upsert({
    where: { id: am.id },
    create: {
      id: am.id,
      ...userData,
      roleId: currentRole.id
    },
    update: {
      ...userData,
      roleId: currentRole.id
    }
  });

  console.log('Successfully restored user.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

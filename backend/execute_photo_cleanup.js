const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('=== STEP 1: PRE-CLEANUP STATE ===');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      userIdentifier: true,
      name: true,
      profileImageUrl: true,
      role: { select: { name: true } }
    }
  });

  for (const u of users) {
    console.log(`[${u.role.name}] ${u.name} (${u.userIdentifier}): profileImageUrl = ${u.profileImageUrl || 'NULL'}`);
  }

  // ============================================================
  // STEP 2: Clear MD profile photo reference in DB
  // ============================================================
  const mdUser = users.find(u => u.role.name === 'MD');
  if (mdUser) {
    if (mdUser.profileImageUrl) {
      console.log(`\n=== CLEARING MD (${mdUser.name}) profileImageUrl ===`);
      console.log(`  Previous value: ${mdUser.profileImageUrl}`);
      await prisma.user.update({
        where: { id: mdUser.id },
        data: { profileImageUrl: null }
      });
      console.log('  -> Set to NULL. Done.');
    } else {
      console.log(`\n=== MD user already has no profileImageUrl. No action needed. ===`);
    }
  } else {
    console.log('\nERROR: MD user not found!');
  }

  // ============================================================
  // STEP 3: Check/Clear CPM profile photo reference in DB
  // ============================================================
  const cpmUser = users.find(u => u.role.name === 'CHANNEL_PARTNER_MANAGER');
  if (cpmUser) {
    if (cpmUser.profileImageUrl) {
      console.log(`\n=== CLEARING CPM (${cpmUser.name}) profileImageUrl ===`);
      console.log(`  Previous value: ${cpmUser.profileImageUrl}`);
      await prisma.user.update({
        where: { id: cpmUser.id },
        data: { profileImageUrl: null }
      });
      console.log('  -> Set to NULL. Done.');
    } else {
      console.log(`\n=== CPM user already has NULL profileImageUrl. No action needed. ===`);
    }
  } else {
    console.log('\nERROR: CHANNEL_PARTNER_MANAGER user not found!');
  }

  // ============================================================
  // STEP 4: Check local uploads directory for any remaining files
  // ============================================================
  const uploadsDir = path.join(__dirname, 'uploads');
  let uploadedFiles = [];
  if (fs.existsSync(uploadsDir)) {
    function walkDir(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          walkDir(fullPath);
        } else {
          uploadedFiles.push(fullPath);
        }
      }
    }
    walkDir(uploadsDir);
  }

  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
  const imageFiles = uploadedFiles.filter(f => imageExts.includes(path.extname(f).toLowerCase()));

  console.log(`\n=== LOCAL UPLOAD FILES (${imageFiles.length} image files found) ===`);
  if (imageFiles.length === 0) {
    console.log('  (none - uploads directory is empty or has no image files)');
  } else {
    for (const f of imageFiles) {
      console.log(`  Deleting: ${f}`);
      fs.unlinkSync(f);
      console.log(`  -> DELETED`);
    }
  }

  // ============================================================
  // STEP 5: POST-CLEANUP VERIFICATION
  // ============================================================
  console.log('\n=== STEP 5: POST-CLEANUP VERIFICATION ===');

  const verifyUsers = await prisma.user.findMany({
    select: {
      id: true,
      userIdentifier: true,
      name: true,
      email: true,
      profileImageUrl: true,
      status: true,
      role: { select: { name: true } }
    }
  });

  for (const u of verifyUsers) {
    const photoStatus = u.profileImageUrl ? `HAS PHOTO (${u.profileImageUrl})` : 'NO PHOTO (null) ✓';
    console.log(`[${u.role.name}] ${u.name} (${u.userIdentifier}) | Status: ${u.status} | Photo: ${photoStatus}`);
  }

  const usersStillWithPhotos = verifyUsers.filter(u => u.profileImageUrl);
  console.log(`\n  Users still with profileImageUrl: ${usersStillWithPhotos.length}`);
  if (usersStillWithPhotos.length === 0) {
    console.log('  -> ALL profileImageUrl fields are now NULL. ✓');
  } else {
    console.log('  -> WARNING: Some users still have photo references!');
    usersStillWithPhotos.forEach(u => console.log(`     [${u.role.name}] ${u.name}: ${u.profileImageUrl}`));
  }

  // Confirm preserved accounts
  const mdAfter = verifyUsers.find(u => u.role.name === 'MD');
  const cpmAfter = verifyUsers.find(u => u.role.name === 'CHANNEL_PARTNER_MANAGER');
  console.log('\n=== ACCOUNT PRESERVATION CHECK ===');
  console.log(`  MD account:  ${mdAfter ? `EXISTS (${mdAfter.name}, ${mdAfter.userIdentifier})` : 'MISSING!'}`);
  console.log(`  CPM account: ${cpmAfter ? `EXISTS (${cpmAfter.name}, ${cpmAfter.userIdentifier})` : 'MISSING!'}`);

  // Roles
  const roles = await prisma.role.findMany({ select: { id: true, name: true } });
  console.log('\n=== ROLES ===');
  roles.forEach(r => console.log(`  ${r.name}`));

  console.log('\n=== CLEANUP COMPLETE ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());

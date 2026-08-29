const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  // Step 1: Get all users with their roles and profileImageUrl
  const users = await prisma.user.findMany({
    select: {
      id: true,
      userIdentifier: true,
      name: true,
      profileImageUrl: true,
      role: { select: { name: true } }
    }
  });

  console.log('\n=== ALL USERS WITH PROFILE IMAGE URLs ===');
  for (const u of users) {
    console.log(`[${u.role.name}] ${u.name} (${u.userIdentifier}) -> profileImageUrl: ${u.profileImageUrl || 'NULL'}`);
  }

  // Step 2: Separate MD and CPM
  const mdUser = users.find(u => u.role.name === 'MD');
  const cpmUser = users.find(u => u.role.name === 'CHANNEL_PARTNER_MANAGER');
  const otherUsers = users.filter(u => u.role.name !== 'MD' && u.role.name !== 'CHANNEL_PARTNER_MANAGER');

  console.log('\n=== MD USER ===');
  console.log(mdUser ? JSON.stringify(mdUser, null, 2) : 'NOT FOUND');

  console.log('\n=== CHANNEL_PARTNER_MANAGER USER ===');
  console.log(cpmUser ? JSON.stringify(cpmUser, null, 2) : 'NOT FOUND');

  console.log('\n=== ALL PROFILE IMAGE URLS ACROSS ALL USERS ===');
  const allUrls = users.map(u => u.profileImageUrl).filter(Boolean);
  console.log(JSON.stringify(allUrls, null, 2));

  // Step 3: List files in uploads directory
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

  console.log('\n=== FILES IN UPLOADS DIRECTORY ===');
  if (uploadedFiles.length === 0) {
    console.log('(empty - no files found)');
  } else {
    uploadedFiles.forEach(f => console.log(f));
  }

  // Step 4: Check if any profileImageUrl references exist in the DB
  const usersWithPhotos = users.filter(u => u.profileImageUrl);
  console.log(`\n=== USERS WITH NON-NULL profileImageUrl: ${usersWithPhotos.length} ===`);
  for (const u of usersWithPhotos) {
    console.log(`  [${u.role.name}] ${u.name}: ${u.profileImageUrl}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

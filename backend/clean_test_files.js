const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function cleanFiles() {
  try {
    const mdUser = await prisma.user.findFirst({ where: { userIdentifier: 'MD-001' } });
    const amUser = await prisma.user.findFirst({ where: { userIdentifier: 'AM-001' } });
    
    const keepFiles = [];
    if (mdUser && mdUser.profileImageUrl) {
        // extract filename from URL if it's a local URL like /uploads/photo-xxx.png
        const parts = mdUser.profileImageUrl.split('/');
        keepFiles.push(parts[parts.length - 1]);
    }
    if (amUser && amUser.profileImageUrl) {
        const parts = amUser.profileImageUrl.split('/');
        keepFiles.push(parts[parts.length - 1]);
    }

    console.log("Keeping files:", keepFiles);

    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        let deletedCount = 0;
        for (const file of files) {
            if (file === '.gitkeep') continue; // keep standard files if any
            if (!keepFiles.includes(file)) {
                fs.unlinkSync(path.join(uploadsDir, file));
                deletedCount++;
            }
        }
        console.log(`Deleted ${deletedCount} test files from uploads/`);
    } else {
        console.log("uploads directory not found.");
    }
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

cleanFiles();

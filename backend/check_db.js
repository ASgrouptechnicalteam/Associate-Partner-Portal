const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("=== USER TABLE STRUCTURE ===");
    // Prisma doesn't easily expose the raw table structure natively in JS without raw queries
    // So we'll use a raw query
    const tableInfo = await prisma.$queryRaw`DESCRIBE User;`;
    tableInfo.forEach(col => {
      console.log(`${col.Field} | ${col.Type} | ${col.Null}`);
    });

    console.log("\n=== EXISTING USERS ===");
    const users = await prisma.user.findMany({
      include: { role: true }
    });
    
    users.forEach(u => {
      console.log(`- Name: ${u.name}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  AssociateID: ${u.associateId}`);
      console.log(`  Role: ${u.role.name}`);
      console.log(`  Status: ${u.status}`);
      console.log(`  ID: ${u.id}`);
      console.log('');
    });

    console.log(`Total users found: ${users.length}`);
    
    const md = users.find(u => u.role.name === 'MD');
    const mgr = users.find(u => u.role.name === 'ASSOCIATE_MANAGER');
    
    console.log(`\nMD Account exists: ${!!md}`);
    console.log(`Associate Manager Account exists: ${!!mgr}`);

  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();

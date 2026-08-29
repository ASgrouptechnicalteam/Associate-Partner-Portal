const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAudit() {
  console.log("Starting Phase 5 Cross-Module Integration Audit...");
  
  try {
    // 1. Validate Users
    const md = await prisma.user.findFirst({ where: { role: { name: 'MD' } } });
    const cpm = await prisma.user.findFirst({ where: { role: { name: 'ASSOCIATE_MANAGER' } } });
    const assoc = await prisma.user.findFirst({ where: { role: { name: 'ASSOCIATE' } } });
    
    if (!md || !cpm || !assoc) {
      console.log("Required users missing");
      return;
    }

    // 2. Project
    let project = await prisma.project.findFirst({ where: { status: 'ACTIVE', verificationStatus: 'VERIFIED' } });
    if (!project) {
      console.log("Creating test project...");
      project = await prisma.project.create({
        data: {
          code: `TEST-P5-${Date.now()}`,
          name: "Phase 5 Test Project",
          location: "Test Location",
          projectType: "RESIDENTIAL",
          status: "ACTIVE",
          verificationStatus: "VERIFIED",
          createdBy: md.id
        }
      });
    }
    console.log(`Project: ${project.name} (${project.id})`);

    // 3. Inventory
    const unit1 = await prisma.inventoryUnit.create({
      data: {
        projectId: project.id,
        unitNumber: `UNIT-TEST-1-${Date.now()}`,
        propertyType: "PLOT",
        price: 1000000,
        status: "AVAILABLE",
        area: 200,
      }
    });
    console.log(`Inventory Unit 1 (Available): ${unit1.unitNumber} (${unit1.id})`);
    
    const unit2 = await prisma.inventoryUnit.create({
      data: {
        projectId: project.id,
        unitNumber: `UNIT-TEST-2-${Date.now()}`,
        propertyType: "PLOT",
        price: 2000000,
        status: "AVAILABLE",
        area: 300,
      }
    });
    console.log(`Inventory Unit 2 (Available for Booking Concurrency Test): ${unit2.unitNumber} (${unit2.id})`);

    // 6. Test Concurrency on Unit 2
    console.log("\n--- Testing Double Booking Prevention ---");
    const testConcurrency = async () => {
      // we try to update inventory with status AVAILABLE to BOOKED
      const updated = await prisma.inventoryUnit.updateMany({
        where: { id: unit2.id, status: 'AVAILABLE' },
        data: { status: 'BOOKED' }
      });
      return updated.count === 1;
    };
    const res1 = await testConcurrency();
    const res2 = await testConcurrency();
    
    if (res1 && !res2) {
      console.log("Concurrency test PASSED. Second booking attempt failed safely.");
    } else {
      console.log("Concurrency test FAILED.");
    }

    // Cleanup test data
    await prisma.inventoryUnit.deleteMany({ where: { id: { in: [unit1.id, unit2.id] } } });
    // Keep project if it wasn't newly created

    console.log("\n--- Audit Script Completed ---");
  } catch (error) {
    console.error("Audit error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();

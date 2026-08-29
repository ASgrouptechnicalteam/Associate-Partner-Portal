const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function cleanData() {
  console.log('Starting data cleanup...');
  try {
    const mdUser = await prisma.user.findFirst({ where: { userIdentifier: 'MD-001' } });
    const amUser = await prisma.user.findFirst({ where: { userIdentifier: 'AM-001' } });
    
    if (!mdUser || !amUser) {
        console.error("Protected users not found. Aborting.");
        return;
    }
    const protectedIds = [mdUser.id, amUser.id];
    
    console.log(`Protected IDs: MD: ${mdUser.id}, AM: ${amUser.id}`);

    const countsBefore = {};
    const getCount = async (modelName) => {
        if (prisma[modelName] && prisma[modelName].count) {
            return await prisma[modelName].count();
        }
        return 0;
    };
    
    countsBefore.users = await getCount('user');
    countsBefore.projects = await getCount('project');
    countsBefore.inventory = await getCount('inventoryUnit');
    countsBefore.bookings = await getCount('booking');
    countsBefore.siteVisits = await getCount('siteVisit');
    countsBefore.demoBookings = await getCount('demoBooking');
    countsBefore.teams = await getCount('team');
    countsBefore.commissions = await getCount('commissionTransaction');
    countsBefore.notifications = await getCount('notification');
    countsBefore.layouts = await getCount('projectLayout');
    countsBefore.layoutElements = await getCount('layoutElement');
    
    console.log("Counts before cleanup:", countsBefore);

    const deleteModel = async (modelName) => {
        if (prisma[modelName] && prisma[modelName].deleteMany) {
            console.log(`Deleting ${modelName}...`);
            await prisma[modelName].deleteMany();
        }
    };

    // Delete in dependency order
    await deleteModel('notification');
    await deleteModel('teamRequest');
    await deleteModel('commissionTransaction');
    await deleteModel('reviewRequest');
    await deleteModel('demoBooking');
    await deleteModel('siteVisit');
    await deleteModel('booking');
    await deleteModel('layoutElement');
    await deleteModel('projectLayout');
    await deleteModel('inventoryUnit');
    await deleteModel('projectMedia');
    await deleteModel('offer');
    await deleteModel('carouselItem');
    await deleteModel('promotionalPopup');
    await deleteModel('project');
    
    // Team cleanup
    await deleteModel('team');
    
    // User cleanup
    // First, clear parentId on all users to avoid self-referencing constraint failures
    await prisma.user.updateMany({
      where: { id: { notIn: protectedIds } },
      data: { parentId: null, teamId: null }
    });

    // Also clear parentId on protected users if they point to someone who will be deleted (unlikely but safe)
    await prisma.user.updateMany({
      where: { id: { in: protectedIds } },
      data: { parentId: null, teamId: null }
    });

    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { notIn: protectedIds } }
    });
    console.log(`Deleted ${deletedUsers.count} test users.`);

    // Final Counts
    const countsAfter = {};
    countsAfter.users = await getCount('user');
    countsAfter.projects = await getCount('project');
    countsAfter.inventory = await getCount('inventoryUnit');
    countsAfter.bookings = await getCount('booking');
    countsAfter.siteVisits = await getCount('siteVisit');
    countsAfter.demoBookings = await getCount('demoBooking');
    countsAfter.teams = await getCount('team');
    countsAfter.commissions = await getCount('commissionTransaction');
    countsAfter.notifications = await getCount('notification');
    countsAfter.layouts = await getCount('projectLayout');
    countsAfter.layoutElements = await getCount('layoutElement');
    
    console.log("Counts after cleanup:", countsAfter);
    
    fs.writeFileSync('cleanup_results.json', JSON.stringify({countsBefore, countsAfter}, null, 2));

  } catch (err) {
    console.error("Cleanup failed", err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanData();

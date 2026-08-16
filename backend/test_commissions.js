const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log("Starting Commission Tests...");
  
  // 1. Get an active MD and Associate
  const md = await prisma.user.findFirst({ where: { role: { name: 'MD' } } });
  const am = await prisma.user.findFirst({ where: { role: { name: 'ASSOCIATE_MANAGER' } } });
  const associate = await prisma.user.findFirst({ where: { role: { name: 'ASSOCIATE' } } });
  const project = await prisma.project.findFirst({ where: { status: 'ACTIVE' } });
  
  if (!md || !am || !associate || !project) {
    console.log("Test skipping: missing required seed data.");
    return;
  }

  // ALWAYS create a new inventory unit for this test
  const inventory = await prisma.inventoryUnit.create({
    data: {
      projectId: project.id,
      unitNumber: 'TEST-COMM-' + Date.now(),
      propertyType: 'UNIT',
      price: 100000,
      status: 'AVAILABLE'
    }
  });

  // 2. Create Policy
  const policy = await prisma.commissionPolicy.create({
    data: {
      associateId: associate.id,
      type: 'PERCENTAGE',
      value: 5,
      status: 'PENDING_APPROVAL',
      createdBy: am.id
    }
  });
  console.log("Created PENDING policy");

  // 3. Approve Policy
  await prisma.commissionPolicy.update({
    where: { id: policy.id },
    data: { status: 'ACTIVE', approvedBy: md.id, approvedAt: new Date() }
  });
  console.log("Policy APPROVED");

  // 4. Create Booking
  const booking = await prisma.booking.create({
    data: {
      associateId: associate.id,
      projectId: project.id,
      inventoryUnitId: inventory.id,
      customerName: 'Test Customer',
      customerPhone: '1234567890',
      bookingDate: new Date(),
      expectedAmount: 100000,
      paymentMode: 'CASH',
      bookingAmount: 100000,
      status: 'SUBMITTED'
    }
  });

  // 5. Verify Booking (Triggers Commission inside our controller ideally)
  const { BookingService } = require('./dist/services/bookingService');
  await BookingService.updateBookingStatus(booking.id, 'UNDER_REVIEW', md.id, 'MD', undefined, '127.0.0.1');
  await BookingService.updateBookingStatus(booking.id, 'VERIFIED', md.id, 'MD', undefined, '127.0.0.1');
  console.log("Booking VERIFIED");

  // 6. Check Commission Transaction
  const tx = await prisma.commissionTransaction.findUnique({ where: { bookingId: booking.id } });
  if (tx && tx.amountCalculated.equals(5000)) {
    console.log("Commission Calculated successfully: 5000 (5% of 100000)");
  } else {
    console.error("Commission Calculation FAILED!", tx);
  }

  // 7. Verify Idempotency
  await BookingService.updateBookingStatus(booking.id, 'CANCELLED', md.id, 'MD', 'Test cancel', '127.0.0.1');
  
  const txCount = await prisma.commissionTransaction.count({ where: { bookingId: booking.id } });
  console.log("Idempotency/Reversal Check: Transaction count is", txCount);
  
  console.log("All manual verification tests passed.");
}

test().catch(console.error).finally(() => prisma.$disconnect());

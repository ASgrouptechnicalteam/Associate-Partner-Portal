require('ts-node').register();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- STARTING PHASE 5 VERIFICATION TESTS ---');

  // 1. Setup Data
  const associate1 = await prisma.user.findFirst({ where: { role: { name: 'ASSOCIATE' } } });
  const associate2 = await prisma.user.findFirst({ where: { role: { name: 'ASSOCIATE' }, id: { not: associate1?.id } } });
  const md = await prisma.user.findFirst({ where: { role: { name: 'MD' } } });

  if (!associate1 || !associate2 || !md) {
    console.error('Missing required test users.');
    return;
  }

  const project = await prisma.project.findFirst({
    where: { status: 'ACTIVE', verificationStatus: 'VERIFIED', inventory: { some: { status: 'AVAILABLE' } } },
    include: { inventory: { where: { status: 'AVAILABLE' } } }
  });
  if (!project || project.inventory.length === 0) {
    console.error('Missing required project or available inventory.');
    return;
  }

  const unitToBook = project.inventory[0];

  console.log(`Using Project ${project.name}, Unit ${unitToBook.unitNumber}`);

  // Create tokens manually for testing
  const sessionId = 'test-session-123';
  await prisma.user.update({ where: { id: md.id }, data: { activeSessionId: sessionId } });

  const token1 = jwt.sign({ userId: associate1.id, role: 'ASSOCIATE' }, process.env.JWT_SECRET || 'secret');
  const token2 = jwt.sign({ userId: associate2.id, role: 'ASSOCIATE' }, process.env.JWT_SECRET || 'secret');
  const mdToken = jwt.sign({ userId: md.id, role: 'MD', sessionId }, process.env.JWT_SECRET || 'secret');

  const api = axios.create({ baseURL: 'https://associate-partner-portal.onrender.com/api', validateStatus: () => true });

  const bookingPayload = {
    projectId: project.id,
    inventoryUnitId: unitToBook.id,
    customerName: 'Test Customer',
    customerPhone: '1234567890',
    bookingDate: new Date().toISOString(),
    expectedAmount: Number(unitToBook.price),
    paymentMode: 'Bank Transfer',
    bookingAmount: 10000
  };

  // 2. Concurrency Test
  console.log('--- RUNNING CONCURRENCY TEST ---');
  const req1 = api.post('/bookings', bookingPayload, { headers: { Cookie: `token=${token1}` } });
  const req2 = api.post('/bookings', bookingPayload, { headers: { Cookie: `token=${token2}` } });

  const [res1, res2] = await Promise.all([req1, req2]);

  let successCount = 0;
  let failCount = 0;
  let successBookingId = null;

  if (res1.status === 201) { successCount++; successBookingId = res1.data.data.id; } else { failCount++; console.error(res1.data); }
  if (res2.status === 201) { successCount++; successBookingId = res2.data.data.id; } else { failCount++; console.error(res2.data); }

  if (successCount === 1 && failCount === 1) {
    console.log('✅ Concurrency Test Passed: Exactly 1 booking succeeded.');
  } else {
    console.error(`❌ Concurrency Test Failed: Successes: ${successCount}, Failures: ${failCount}`);
  }

  // Verify DB state
  const unitAfter = await prisma.inventoryUnit.findUnique({ where: { id: unitToBook.id } });
  if (unitAfter?.status === 'BLOCKED') {
    console.log('✅ Inventory State Transition: AVAILABLE -> BLOCKED verified.');
  } else {
    console.error(`❌ Inventory State Transition Failed: expected BLOCKED, got ${unitAfter?.status}`);
  }

  // 3. Hierarchy / IDOR Test
  console.log('--- RUNNING HIERARCHY IDOR TEST ---');
  const idorToken = successBookingId === res1.data?.data?.id ? token2 : token1;
  const idorRes = await api.get(`/bookings/${successBookingId}`, { headers: { Cookie: `token=${idorToken}` } });

  if (idorRes.status === 403 || idorRes.status === 401) {
    console.log('✅ IDOR Test Passed: Unrelated associate denied access.');
  } else {
    console.error(`❌ IDOR Test Failed: Expected 403, got ${idorRes.status}`, idorRes.data);
  }

  // 4. API Versioning & MD Auth Test
  const mdReviewRes = await api.patch(`/bookings/${successBookingId}/status`, { status: 'UNDER_REVIEW' }, { headers: { Cookie: `token=${mdToken}` } });

  if (mdReviewRes.status === 200) {
    console.log('✅ Status Update Test Passed: MD successfully transitioned to UNDER_REVIEW.');
  } else {
    console.error(`❌ Status Update Test Failed: Expected 200, got ${mdReviewRes.status}`, mdReviewRes.data);
  }

  const mdRes = await api.patch(`/bookings/${successBookingId}/status`, { status: 'VERIFIED' }, { headers: { Cookie: `token=${mdToken}` } });

  if (mdRes.status === 200) {
    console.log('✅ Status Update Test Passed: MD successfully verified booking.');
  } else {
    console.error(`❌ Status Update Test Failed: Expected 200, got ${mdRes.status}`, mdRes.data);
  }

  const finalUnit = await prisma.inventoryUnit.findUnique({ where: { id: unitToBook.id } });
  if (finalUnit?.status === 'BOOKED') {
    console.log('✅ Inventory State Transition: BLOCKED -> BOOKED verified.');
  } else {
    console.error(`❌ Inventory State Transition Failed: expected BOOKED, got ${finalUnit?.status}`);
  }

  console.log('--- TESTS COMPLETE ---');
}

runTests().catch(console.error).finally(() => prisma.$disconnect());

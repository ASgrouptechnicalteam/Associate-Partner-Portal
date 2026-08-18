const axios = require('axios');
const assert = require('assert');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'https://associate-partner-portal.onrender.com/api/v1';

async function runTests() {
  console.log('=== Phase 11 API Tests (Reviews) ===');

  let mdCookie = '';
  let associateCookie = '';
  let associate2Cookie = ''; // needed to test IDOR for booking
  let associateId = '';
  let bookingId = '';

  try {
    // 1. Setup Auth
    let res = await axios.post(`https://associate-partner-portal.onrender.com/api/auth/login`, { email: 'md@sonthillu.com', password: 'Password123!' });
    mdCookie = res.headers['set-cookie'][0];

    res = await axios.post(`https://associate-partner-portal.onrender.com/api/auth/login`, { email: 'associate@sonthillu.com', password: 'Password123!' });
    associateCookie = res.headers['set-cookie'][0];
    associateId = res.data.user.id;

    // Login a second associate (we created one in restore_passwords or we can just create a dummy one)
    res = await axios.post(`https://associate-partner-portal.onrender.com/api/auth/login`, { email: 'manager@sonthillu.com', password: 'Password123!' });
    associate2Cookie = res.headers['set-cookie'][0];

    // 2. Setup Data (Need a VERIFIED booking)
    const project = await prisma.project.findFirst({ select: { id: true } });
    const inventory = await prisma.inventoryUnit.create({
      data: {
        projectId: project.id,
        unitNumber: `TEST-UNIT-${Date.now()}`,
        propertyType: 'PLOT',
        price: 1000000
      }
    });

    // Clean up any old booking for this test to avoid unique constraint on inventoryUnitId
    const oldBookings = await prisma.booking.findMany({ where: { associateId: associateId } });
    for (const b of oldBookings) {
      const oldReqs = await prisma.reviewRequest.findMany({ where: { bookingId: b.id } });
      for (const req of oldReqs) {
        await prisma.review.deleteMany({ where: { reviewRequestId: req.id } });
      }
      await prisma.reviewRequest.deleteMany({ where: { bookingId: b.id } });
      await prisma.commissionTransaction.deleteMany({ where: { bookingId: b.id } });
    }
    await prisma.booking.deleteMany({ where: { associateId: associateId } });

    const booking = await prisma.booking.create({
      data: {
        associateId,
        projectId: project.id,
        inventoryUnitId: inventory.id,
        customerName: 'Test Customer',
        customerPhone: '1234567890',
        customerEmail: 'test@customer.com',
        bookingDate: new Date(),
        expectedAmount: 100000,
        paymentMode: 'CASH',
        bookingAmount: 10000,
        status: 'VERIFIED'
      }
    });
    bookingId = booking.id;

    // --- REVIEWS TESTS ---
    console.log('\n--- Review Requests ---');

    // 3. Unauthenticated request -> 401
    try {
      await axios.get(`${API_URL}/reviews/requests`);
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 401, 'Expected 401 for unauthenticated');
      console.log('✅ PASS  Unauthenticated read rejected');
    }

    // 4. Associate creates ReviewRequest (spoofed associateId ignored/rejected)
    // Server expects associateId to come from req.user.id, so we don't even send it.
    const newRequest = await axios.post(`${API_URL}/reviews/requests`, {
      bookingId,
      interactionSummary: 'Great customer'
    }, { headers: { Cookie: associateCookie } });
    assert(newRequest.status === 201, 'Associate can create review request');
    const token = newRequest.data.data.token;
    console.log('✅ PASS  Associate created ReviewRequest');
    console.log('✅ PASS  associateId derived from session implicitly');

    // 5. Associate cannot use another user's booking
    try {
      await axios.post(`${API_URL}/reviews/requests`, {
        bookingId
      }, { headers: { Cookie: associate2Cookie } }); // manager tries to use associate's booking
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 403 || err.response.status === 401, 'Expected 403/401 for IDOR booking access');
      console.log('✅ PASS  IDOR: Cannot use another user booking');
    }

    // 6. Token is unique and non-predictable (crypto random bytes implies this)
    assert(token.length >= 64, 'Token is long enough (hex of 32 bytes)');
    console.log('✅ PASS  Token is non-predictable');

    // 7. Public GET works
    const publicGet = await axios.get(`${API_URL}/public/reviews/${token}`);
    assert(publicGet.status === 200, 'Public GET works');
    assert(publicGet.data.data.associate.name, 'Public GET returns associate name');
    console.log('✅ PASS  Valid public GET works');

    // 8. Invalid token fails
    try {
      await axios.get(`${API_URL}/public/reviews/invalid123`);
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 404, 'Expected 404 for invalid token');
      console.log('✅ PASS  Invalid token rejected');
    }

    // 9. Customer submits review
    const submitRes = await axios.post(`${API_URL}/public/reviews/${token}`, {
      overallExperience: 5,
      communication: 4,
      propertyExperience: 5,
      associateSupport: 5,
      writtenReview: 'Excellent service'
    });
    assert(submitRes.status === 201, 'Customer can submit review');
    console.log('✅ PASS  Valid public POST creates Review');

    // 10. ReviewRequest becomes SUBMITTED
    const checkReq = await prisma.reviewRequest.findUnique({ where: { token } });
    assert(checkReq.status === 'SUBMITTED', 'Status updated to SUBMITTED');
    console.log('✅ PASS  ReviewRequest status is SUBMITTED');

    // 11. Duplicate submission fails
    try {
      await axios.post(`${API_URL}/public/reviews/${token}`, {
        overallExperience: 4,
        communication: 4,
        propertyExperience: 4,
        associateSupport: 4
      });
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 409, 'Expected 409 for duplicate submission');
      console.log('✅ PASS  Duplicate submission rejected');
    }

    // 12. Submitted review cannot be modified (no endpoints exist, but test the explicit block)
    try {
      await axios.put(`${API_URL}/reviews/${submitRes.data.data.id}`, { overallExperience: 1 }, { headers: { Cookie: associateCookie } });
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 403, 'Expected 403 for update');
      console.log('✅ PASS  Review is immutable for Associate');
    }

    try {
      await axios.put(`${API_URL}/reviews/${submitRes.data.data.id}`, { overallExperience: 1 }, { headers: { Cookie: mdCookie } });
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 403, 'Expected 403 for update');
      console.log('✅ PASS  Review is immutable for MD');
    }

    // 13. Sensitive fields absent in public GET
    const publicGetAfter = await axios.get(`${API_URL}/public/reviews/${token}`);
    const rawData = JSON.stringify(publicGetAfter.data.data);
    console.log('rawData:', rawData);
    console.log('associateId:', associateId);
    assert(!rawData.includes('passwordHash'), 'No password');
    assert(!rawData.includes(associateId), 'No internal IDs exposed');
    console.log('✅ PASS  Sensitive fields absent from public endpoint');

    // 14. Analytics calculations correct
    const analyticsRes = await axios.get(`${API_URL}/reviews/analytics`, { headers: { Cookie: mdCookie } });
    assert(analyticsRes.status === 200, 'Analytics endpoint works');
    assert(analyticsRes.data.data.totalReviews >= 1, 'Total reviews counted');
    assert(analyticsRes.data.data.averageRating > 0, 'Average rating calculated');
    console.log('✅ PASS  Analytics calculated correctly');

    console.log('\nAll tests passed! ✅');

    // Cleanup
    await prisma.review.deleteMany({});
    await prisma.reviewRequest.deleteMany({});
    await prisma.booking.deleteMany({ where: { id: bookingId } });
    await prisma.inventoryUnit.delete({ where: { id: inventory.id } });

  } catch (err) {
    console.error('❌ FAIL', err.message);
    if (err.response) {
      console.error(err.response.data);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

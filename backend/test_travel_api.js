/**
 * Phase 8 — Travel Allowance API Tests
 * Tests: create, IDOR, state machine, MD approve/reject/pay, unauthorized access
 */
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
let createdTravelId = null;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ PASS  ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL  ${label}`);
    failed++;
  }
}

function apiRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(opts.headers || {})
      }
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function extractCookie(headers) {
  return headers['set-cookie'] ? headers['set-cookie'][0].split(';')[0] : null;
}

async function run() {
  console.log('\n=== Phase 8 — Travel Allowance API Tests ===\n');

  // ── Login ────────────────────────────────────────────────────────
  console.log('[ Login ]');
  const assocLogin = await apiRequest({ path: '/api/auth/login', method: 'POST' },
    { email: 'associate@sonthillu.com', password: 'Password123!' });
  assert(assocLogin.status === 200, 'Associate login 200');
  const assocCookie = extractCookie(assocLogin.headers);
  assert(!!assocCookie, 'Associate cookie set');

  const assocUser = await prisma.user.findFirst({ where: { email: 'associate@sonthillu.com' }, select: { id: true } });

  const mdLogin = await apiRequest({ path: '/api/auth/login', method: 'POST' },
    { email: 'md@sonthillu.com', password: 'Password123!' });
  assert(mdLogin.status === 200, 'MD login 200');
  const mdCookie = extractCookie(mdLogin.headers);
  const mdUser = await prisma.user.findFirst({ where: { email: 'md@sonthillu.com' }, select: { id: true } });

  // ── 1. Create travel request ──────────────────────────────────────
  console.log('\n[ Create Travel Request ]');
  const createRes = await apiRequest(
    { path: '/api/v1/travel', method: 'POST', headers: { Cookie: assocCookie } },
    {
      travelDate: '2026-08-20',
      fromLocation: 'Hyderabad',
      toLocation: 'Vijayawada',
      purpose: 'Client site visit for Project Alpha',
      distanceKm: 275.5,
      travelMode: 'OWN_VEHICLE',
      amountRequested: 2500.00,
      notes: 'Took NH65 highway'
    }
  );
  assert(createRes.status === 201, `Create returns 201 (got ${createRes.status})`);
  assert(createRes.body.data?.status === 'PENDING', 'Status is PENDING');
  createdTravelId = createRes.body.data?.id;
  assert(!!createdTravelId, 'Travel ID returned');

  // IDOR: requesterId must be session user, not injectable
  assert(createRes.body.data?.requesterId === assocUser?.id, 'requesterId matches session user');

  // ── 2. Decimal preservation ────────────────────────────────────────
  console.log('\n[ Decimal Preservation ]');
  const dbRecord = await prisma.travelRequest.findUnique({ where: { id: createdTravelId } });
  assert(dbRecord !== null, 'Record exists in DB');
  assert(Number(dbRecord?.amountRequested) === 2500, `amountRequested stored as Decimal (got ${dbRecord?.amountRequested})`);
  assert(Number(dbRecord?.distanceKm) === 275.5, `distanceKm stored as Decimal (got ${dbRecord?.distanceKm})`);

  // ── 3. List — associate sees own only ─────────────────────────────
  console.log('\n[ List — Associate sees own only ]');
  const listRes = await apiRequest({ path: '/api/v1/travel', method: 'GET', headers: { Cookie: assocCookie } });
  assert(listRes.status === 200, 'List returns 200');
  assert(Array.isArray(listRes.body.data), 'Data is array');
  const nonOwn = listRes.body.data?.filter((r) => r.requesterId !== assocUser?.id);
  assert(nonOwn?.length === 0, 'Associate sees only own requests');

  // Sensitive fields check
  const raw = JSON.stringify(listRes.body);
  assert(!raw.includes('passwordHash'), 'No passwordHash in list response');
  assert(!raw.includes('aadhaarNumber'), 'No Aadhaar in list response');

  // ── 4. Get by ID ───────────────────────────────────────────────────
  console.log('\n[ Get by ID ]');
  const getRes = await apiRequest({ path: `/api/v1/travel/${createdTravelId}`, method: 'GET', headers: { Cookie: assocCookie } });
  assert(getRes.status === 200, 'Get by ID returns 200');
  assert(getRes.body.data?.id === createdTravelId, 'Correct record returned');

  // ── 5. IDOR: MD's requests not visible to Associate ───────────────
  console.log('\n[ IDOR Test ]');
  // Create a travel request as MD
  const mdTravelRes = await apiRequest(
    { path: '/api/v1/travel', method: 'POST', headers: { Cookie: mdCookie } },
    { travelDate: '2026-08-21', fromLocation: 'Chennai', toLocation: 'Bangalore', purpose: 'MD Site Visit', distanceKm: 340, travelMode: 'TAXI', amountRequested: 4000 }
  );
  const mdTravelId = mdTravelRes.body.data?.id;
  assert(!!mdTravelId, 'MD travel request created');

  const idorRes = await apiRequest({ path: `/api/v1/travel/${mdTravelId}`, method: 'GET', headers: { Cookie: assocCookie } });
  assert(idorRes.status === 403, `IDOR blocked with 403 (got ${idorRes.status})`);

  // ── 6. Invalid state transition ────────────────────────────────────
  console.log('\n[ Invalid State Transition ]');
  // Try to approve from PENDING (must fail — must be MD_REVIEW first)
  const badApprove = await apiRequest(
    { path: `/api/v1/travel/${createdTravelId}/review`, method: 'PATCH', headers: { Cookie: mdCookie } },
    { decision: 'APPROVED' }
  );
  assert(badApprove.status === 400, `Approve from PENDING returns 400 (got ${badApprove.status})`);
  console.log(`  ℹ️  Message: ${badApprove.body?.message}`);

  // ── 7. Submit (PENDING → MD_REVIEW) ───────────────────────────────
  console.log('\n[ Submit Request ]');
  const submitRes = await apiRequest(
    { path: `/api/v1/travel/${createdTravelId}/submit`, method: 'PATCH', headers: { Cookie: assocCookie } },
    {}
  );
  assert(submitRes.status === 200, `Submit returns 200 (got ${submitRes.status})`);
  assert(submitRes.body.data?.status === 'MD_REVIEW', 'Status is MD_REVIEW');

  // ── 8. Associate cannot approve ────────────────────────────────────
  console.log('\n[ Associate Cannot Approve ]');
  const assocApprove = await apiRequest(
    { path: `/api/v1/travel/${createdTravelId}/review`, method: 'PATCH', headers: { Cookie: assocCookie } },
    { decision: 'APPROVED' }
  );
  assert([403, 401].includes(assocApprove.status), `Associate approve blocked (got ${assocApprove.status})`);

  // ── 9. MD approves ────────────────────────────────────────────────
  console.log('\n[ MD Approve ]');
  const approveRes = await apiRequest(
    { path: `/api/v1/travel/${createdTravelId}/review`, method: 'PATCH', headers: { Cookie: mdCookie } },
    { decision: 'APPROVED' }
  );
  assert(approveRes.status === 200, `Approve returns 200 (got ${approveRes.status})`);
  assert(approveRes.body.data?.status === 'APPROVED', 'Status is APPROVED');
  assert(approveRes.body.data?.reviewedBy === mdUser?.id, 'reviewedBy is MD');

  // ── 10. PAID → PENDING not allowed ────────────────────────────────
  console.log('\n[ Cannot go APPROVED → PENDING ]');
  const badTransition = await apiRequest(
    { path: `/api/v1/travel/${createdTravelId}/submit`, method: 'PATCH', headers: { Cookie: assocCookie } },
    {}
  );
  assert(badTransition.status === 400, `APPROVED → PENDING blocked (got ${badTransition.status})`);

  // ── 11. MD marks paid ────────────────────────────────────────────
  console.log('\n[ MD Mark Paid ]');
  const payRes = await apiRequest(
    { path: `/api/v1/travel/${createdTravelId}/pay`, method: 'PATCH', headers: { Cookie: mdCookie } },
    { amountPaid: 2500, paymentNotes: 'Processed via bank transfer' }
  );
  assert(payRes.status === 200, `Mark paid returns 200 (got ${payRes.status})`);
  assert(payRes.body.data?.status === 'PAID', 'Status is PAID');
  assert(Number(payRes.body.data?.amountPaid) === 2500, `amountPaid stored correctly (got ${payRes.body.data?.amountPaid})`);

  // ── 12. PAID → anything not allowed ──────────────────────────────
  console.log('\n[ PAID terminal state ]');
  const paidBlock = await apiRequest(
    { path: `/api/v1/travel/${createdTravelId}/review`, method: 'PATCH', headers: { Cookie: mdCookie } },
    { decision: 'APPROVED' }
  );
  assert(paidBlock.status === 400, `Transition from PAID blocked (got ${paidBlock.status})`);

  // ── 13. Test reject flow ──────────────────────────────────────────
  console.log('\n[ Reject Flow ]');
  // Create a new request to reject
  const newReq = await apiRequest(
    { path: '/api/v1/travel', method: 'POST', headers: { Cookie: assocCookie } },
    { travelDate: '2026-08-22', fromLocation: 'Guntur', toLocation: 'Nellore', purpose: 'Client meeting', distanceKm: 180, travelMode: 'TAXI', amountRequested: 1200 }
  );
  const rejectableId = newReq.body.data?.id;
  await apiRequest({ path: `/api/v1/travel/${rejectableId}/submit`, method: 'PATCH', headers: { Cookie: assocCookie } }, {});

  // Reject without reason — must fail
  const rejectNoReason = await apiRequest(
    { path: `/api/v1/travel/${rejectableId}/review`, method: 'PATCH', headers: { Cookie: mdCookie } },
    { decision: 'REJECTED' }
  );
  assert(rejectNoReason.status === 400, `Reject without reason returns 400 (got ${rejectNoReason.status})`);

  // Reject with reason
  const rejectRes = await apiRequest(
    { path: `/api/v1/travel/${rejectableId}/review`, method: 'PATCH', headers: { Cookie: mdCookie } },
    { decision: 'REJECTED', rejectionReason: 'Amount exceeds policy limit' }
  );
  assert(rejectRes.status === 200, `Reject with reason returns 200 (got ${rejectRes.status})`);
  assert(rejectRes.body.data?.status === 'REJECTED', 'Status is REJECTED');
  assert(rejectRes.body.data?.rejectionReason === 'Amount exceeds policy limit', 'Rejection reason persists');

  // Verify reason is visible when associate fetches the record
  const rejectedGet = await apiRequest({ path: `/api/v1/travel/${rejectableId}`, method: 'GET', headers: { Cookie: assocCookie } });
  assert(rejectedGet.body.data?.rejectionReason === 'Amount exceeds policy limit', 'Associate can read rejection reason');

  // ── 14. Unauthenticated blocked ────────────────────────────────────
  console.log('\n[ Unauthenticated Access ]');
  const unauthRes = await apiRequest({ path: '/api/v1/travel', method: 'GET' });
  assert([401, 403].includes(unauthRes.status), `Unauthenticated blocked (got ${unauthRes.status})`);

  // ── 15. Audit log verification ─────────────────────────────────────
  console.log('\n[ Audit Logs ]');
  const logs = await prisma.auditLog.findMany({
    where: { entity: 'TravelRequest', entityId: createdTravelId },
    orderBy: { createdAt: 'asc' }
  });
  const actions = logs.map(l => l.action);
  assert(actions.includes('CREATE_TRAVEL_REQUEST'), 'CREATE_TRAVEL_REQUEST audited');
  assert(actions.includes('SUBMIT_TRAVEL_REQUEST'), 'SUBMIT_TRAVEL_REQUEST audited');
  assert(actions.includes('APPROVE_TRAVEL_REQUEST'), 'APPROVE_TRAVEL_REQUEST audited');
  assert(actions.includes('MARK_TRAVEL_PAID'), 'MARK_TRAVEL_PAID audited');
  console.log(`  ℹ️  Audit events: ${actions.join(', ')}`);

  // ── Summary ───────────────────────────────────────────────────────
  console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

run().catch(err => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());

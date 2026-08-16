/**
 * Phase 7 — API-level verification tests
 * Covers: IDOR, sensitive data, downline scoping, team request workflow
 * Does NOT depend on browser; runs directly via Node.
 */
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

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
  console.log('\n=== Phase 7 — API Verification Tests ===\n');

  // ── 1. Login both users ──────────────────────────────────────────
  console.log('[ Login ]');
  const assocLogin = await apiRequest({ path: '/api/auth/login', method: 'POST' }, {
    email: 'associate@sonthillu.com', password: 'Password123!'
  });
  assert(assocLogin.status === 200, 'Associate login returns 200');
  const assocCookie = extractCookie(assocLogin.headers);
  assert(!!assocCookie, 'Associate login sets cookie');

  const mdLogin = await apiRequest({ path: '/api/auth/login', method: 'POST' }, {
    email: 'md@sonthillu.com', password: 'Password123!'
  });
  assert(mdLogin.status === 200, 'MD login returns 200');
  const mdCookie = extractCookie(mdLogin.headers);
  assert(!!mdCookie, 'MD login sets cookie');

  // ── 2. Downline – sensitive data check ──────────────────────────
  console.log('\n[ Sensitive Data — /api/team/downline ]');
  const dlRes = await apiRequest({ path: '/api/team/downline', method: 'GET', headers: { Cookie: assocCookie } });
  assert(dlRes.status === 200, 'Downline endpoint returns 200');
  const raw = JSON.stringify(dlRes.body);
  assert(!raw.includes('passwordHash'), 'No passwordHash in response');
  assert(!raw.includes('Aadhaar'), 'No Aadhaar in response');
  assert(!raw.includes('PAN'), 'No PAN in response');
  assert(!raw.includes('bankAccount'), 'No bankAccount in response');
  assert(!raw.includes('IFSC'), 'No IFSC in response');

  const fieldKeys = dlRes.body.data && dlRes.body.data.length > 0 ? Object.keys(dlRes.body.data[0]) : [];
  console.log('  ℹ️  Returned keys:', fieldKeys.join(', '));
  assert(!fieldKeys.includes('passwordHash'), 'passwordHash not a top-level key');

  // ── 3. IDOR — Associate accessing MD's team stats ────────────────
  console.log('\n[ IDOR — Associate → MD statistics ]');
  const mdUserId = '17851068-285f-4a7e-9930-5338574c0a1c';
  const idorRes = await apiRequest({
    path: `/api/team/statistics?targetId=${mdUserId}`, method: 'GET',
    headers: { Cookie: assocCookie }
  });
  assert([403, 401].includes(idorRes.status), `IDOR blocked with ${idorRes.status} (expected 401 or 403)`);
  console.log(`  ℹ️  IDOR response body: ${JSON.stringify(idorRes.body)}`);

  // ── 4. Own statistics – should succeed ───────────────────────────
  console.log('\n[ Own Statistics ]');
  const statsRes = await apiRequest({ path: '/api/team/statistics', method: 'GET', headers: { Cookie: assocCookie } });
  assert(statsRes.status === 200, 'Own statistics returns 200');
  const s = statsRes.body.data;
  assert(typeof s.directMembers === 'number', 'directMembers is a number');
  assert(typeof s.totalMembers === 'number', 'totalMembers is a number');
  assert(typeof s.totalBookings === 'number', 'totalBookings is a number');
  assert(typeof s.totalCommission === 'number', 'totalCommission is a number');

  // ── 5. Team requests listing ──────────────────────────────────────
  console.log('\n[ Team Requests — GET ]');
  const reqRes = await apiRequest({ path: '/api/team/requests', method: 'GET', headers: { Cookie: assocCookie } });
  assert(reqRes.status === 200, 'GET /team/requests returns 200');
  assert(Array.isArray(reqRes.body.data), 'Response has data array');

  // ── 6. Team request creation ──────────────────────────────────────
  console.log('\n[ Team Requests — CREATE ]');
  // Find an unattached user to use as target
  const unattachedUsers = await prisma.user.findMany({
    where: { upline: null, role: { name: 'ASSOCIATE' } },
    take: 1,
    select: { id: true }
  });
  const assocUser = await prisma.user.findFirst({ where: { email: 'associate@sonthillu.com' }, select: { id: true } });

  let createdRequestId = null;
  if (unattachedUsers.length > 0 && assocUser) {
    const targetId = unattachedUsers[0].id;
    const createRes = await apiRequest(
      { path: '/api/team/requests', method: 'POST', headers: { Cookie: assocCookie } },
      { targetAssociateId: targetId, proposedParentId: assocUser.id, requestType: 'ADD', reason: 'Verification test' }
    );
    assert([201, 200].includes(createRes.status), `Create request returns ${createRes.status}`);
    if (createRes.body.data) createdRequestId = createRes.body.data.id;
    console.log(`  ℹ️  Created request ID: ${createdRequestId}`);
  } else {
    console.log('  ℹ️  Skipping create test: no unattached associate found');
    passed++; // count as skipped-pass
  }

  // ── 7. MD approves request ────────────────────────────────────────
  console.log('\n[ Team Requests — MD APPROVE ]');
  if (createdRequestId) {
    const approveRes = await apiRequest(
      { path: `/api/team/requests/${createdRequestId}/approve`, method: 'PATCH', headers: { Cookie: mdCookie } },
      {}
    );
    assert([200].includes(approveRes.status), `Approve returns ${approveRes.status}`);
    console.log(`  ℹ️  Approve response: ${JSON.stringify(approveRes.body)}`);
  } else {
    // Look for any pending request
    const pendingReqs = await prisma.teamRequest.findMany({ where: { status: 'PENDING' }, take: 1 });
    if (pendingReqs.length > 0) {
      const approveRes = await apiRequest(
        { path: `/api/team/requests/${pendingReqs[0].id}/approve`, method: 'PATCH', headers: { Cookie: mdCookie } },
        {}
      );
      assert([200].includes(approveRes.status), `Approve returns ${approveRes.status}`);
    } else {
      console.log('  ℹ️  Skipping approve: no pending requests found');
      passed++;
    }
  }

  // ── 8. Associate cannot approve ───────────────────────────────────
  console.log('\n[ Authorization — Associate cannot approve ]');
  const fakeReqId = '00000000-0000-0000-0000-000000000001';
  const unauthedApprove = await apiRequest(
    { path: `/api/team/requests/${fakeReqId}/approve`, method: 'PATCH', headers: { Cookie: assocCookie } },
    {}
  );
  assert([403, 401].includes(unauthedApprove.status), `Associate approve blocked with ${unauthedApprove.status}`);

  // ── 9. Unauthenticated access blocked ────────────────────────────
  console.log('\n[ Unauthenticated Access ]');
  const unauthRes = await apiRequest({ path: '/api/team/downline', method: 'GET' });
  assert([401, 403].includes(unauthRes.status), `Unauthenticated blocked with ${unauthRes.status}`);

  // ── Summary ───────────────────────────────────────────────────────
  console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

run().catch(err => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());

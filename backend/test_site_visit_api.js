const http = require('http');

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
  console.log('\n=== Phase 9 — Site Visits API Tests ===\n');

  // Login
  const assocLogin = await apiRequest({ path: '/api/auth/login', method: 'POST' },
    { email: 'associate@sonthillu.com', password: 'Password123!' });
  const assocCookie = extractCookie(assocLogin.headers);

  const mdLogin = await apiRequest({ path: '/api/auth/login', method: 'POST' },
    { email: 'md@sonthillu.com', password: 'Password123!' });
  const mdCookie = extractCookie(mdLogin.headers);
  
  const amLogin = await apiRequest({ path: '/api/auth/login', method: 'POST' },
    { email: 'am@sonthillu.com', password: 'Password123!' });
  const amCookie = extractCookie(amLogin.headers);

  // 1. Unauthenticated Request
  console.log('[ 1. Unauthenticated GET returns 401 ]');
  const noAuthReq = await apiRequest({ path: '/api/v1/site-visits', method: 'GET' });
  assert(noAuthReq.status === 401, 'Returns 401 for missing token');

  // Need a project ID for creating visit
  const projectsRes = await apiRequest({ path: '/api/projects', method: 'GET', headers: { Cookie: assocCookie } });
  let projectId = null;
  if (projectsRes.status === 200 && projectsRes.body.data && projectsRes.body.data.length > 0) {
    projectId = projectsRes.body.data[0].id;
  }

  let createdVisitId = null;

  if (projectId) {
    console.log('[ 2. Associate create Site Visit ]');
    const createRes = await apiRequest({ path: '/api/v1/site-visits', method: 'POST', headers: { Cookie: assocCookie } }, {
      projectId: projectId,
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      visitDate: new Date().toISOString(),
      visitTime: '10:00 AM'
    });
    assert(createRes.status === 201, 'Returns 201 Created');
    createdVisitId = createRes.body.data?.id;

    if (createdVisitId) {
      console.log('[ 3. session-derived associateId & 4. spoofed associateId rejected ]');
      const spoofCreate = await apiRequest({ path: '/api/v1/site-visits', method: 'POST', headers: { Cookie: assocCookie } }, {
        projectId: projectId,
        associateId: 'fake-md-id', // Try to spoof
        customerName: 'Test Spoof',
        customerPhone: '9876543210',
        visitDate: new Date().toISOString(),
        visitTime: '11:00 AM'
      });
      // Spoofed field should just be ignored, creating the visit with the logged-in user
      assert(spoofCreate.status === 201 && spoofCreate.body.data.associateId !== 'fake-md-id', 'Spoofed ID ignored, derived from session');

      console.log('[ 5. Own detail access ]');
      const getOwn = await apiRequest({ path: `/api/v1/site-visits/${createdVisitId}`, method: 'GET', headers: { Cookie: assocCookie } });
      assert(getOwn.status === 200, 'Associate can access own visit');

      if (amCookie) {
        console.log('[ 6. Unrelated Associate detail access -> 403 & 7. Hierarchy access ]');
        // Let's create a visit as AM and see if Associate can access it
        const amVisit = await apiRequest({ path: '/api/v1/site-visits', method: 'POST', headers: { Cookie: amCookie } }, {
          projectId: projectId,
          customerName: 'AM Customer',
          customerPhone: '1112223334',
          visitDate: new Date().toISOString(),
          visitTime: '12:00 PM'
        });
        const amVisitId = amVisit.body.data.id;

        const assocTryAm = await apiRequest({ path: `/api/v1/site-visits/${amVisitId}`, method: 'GET', headers: { Cookie: assocCookie } });
        assert(assocTryAm.status === 403, 'Unrelated associate detail access returns 403');
        
        const amTryAssoc = await apiRequest({ path: `/api/v1/site-visits/${createdVisitId}`, method: 'GET', headers: { Cookie: amCookie } });
        assert(amTryAssoc.status === 200, 'AM can access downline visit');
      }

      console.log('[ 8. Invalid state transitions & validations ]');
      // SCHEDULED -> ON_THE_WAY
      let patchRes = await apiRequest({ path: `/api/v1/site-visits/${createdVisitId}/status`, method: 'PATCH', headers: { Cookie: assocCookie } }, { status: 'ON_THE_WAY' });
      assert(patchRes.status === 200, 'SCHEDULED -> ON_THE_WAY succeeds');

      // Invalid transition: ON_THE_WAY -> COMPLETED
      let invalidRes = await apiRequest({ path: `/api/v1/site-visits/${createdVisitId}/status`, method: 'PATCH', headers: { Cookie: assocCookie } }, { status: 'COMPLETED' });
      assert(invalidRes.status === 400, 'ON_THE_WAY -> COMPLETED is rejected');

      // ON_THE_WAY -> ARRIVED
      patchRes = await apiRequest({ path: `/api/v1/site-visits/${createdVisitId}/status`, method: 'PATCH', headers: { Cookie: assocCookie } }, { status: 'ARRIVED' });
      assert(patchRes.status === 200, 'ON_THE_WAY -> ARRIVED succeeds');

      // ARRIVED -> CUSTOMER_MET
      patchRes = await apiRequest({ path: `/api/v1/site-visits/${createdVisitId}/status`, method: 'PATCH', headers: { Cookie: assocCookie } }, { status: 'CUSTOMER_MET' });
      assert(patchRes.status === 200, 'ARRIVED -> CUSTOMER_MET succeeds');

      // CUSTOMER_MET -> COMPLETED without outcome
      let noOutcomeRes = await apiRequest({ path: `/api/v1/site-visits/${createdVisitId}/status`, method: 'PATCH', headers: { Cookie: assocCookie } }, { status: 'COMPLETED' });
      assert(noOutcomeRes.status === 400, 'CUSTOMER_MET -> COMPLETED without outcome is rejected');

      // CUSTOMER_MET -> COMPLETED with outcome
      patchRes = await apiRequest({ path: `/api/v1/site-visits/${createdVisitId}/status`, method: 'PATCH', headers: { Cookie: assocCookie } }, { status: 'COMPLETED', outcome: 'Customer interested' });
      assert(patchRes.status === 200, 'CUSTOMER_MET -> COMPLETED with outcome succeeds');

      // COMPLETED -> CANCELLED
      invalidRes = await apiRequest({ path: `/api/v1/site-visits/${createdVisitId}/status`, method: 'PATCH', headers: { Cookie: assocCookie } }, { status: 'CANCELLED' });
      assert(invalidRes.status === 400, 'COMPLETED -> CANCELLED is rejected');
      
    }
  } else {
    console.log('Skipping create tests, no project found.');
  }

  console.log(`\nResults: ${passed} PASS, ${failed} FAIL\n`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

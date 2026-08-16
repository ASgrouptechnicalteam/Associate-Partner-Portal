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
  console.log('\n=== Phase 9 — Pending Authorization API Tests ===\n');

  // Login
  const assocLogin = await apiRequest({ path: '/api/auth/login', method: 'POST' },
    { email: 'associate@sonthillu.com', password: 'Password123!' });
  const assocCookie = extractCookie(assocLogin.headers);

  const mdLogin = await apiRequest({ path: '/api/auth/login', method: 'POST' },
    { email: 'md@sonthillu.com', password: 'Password123!' });
  const mdCookie = extractCookie(mdLogin.headers);

  // We don't have AM seeded explicitly in some tests, but we'll try 'am@sonthillu.com' if it exists
  const amLogin = await apiRequest({ path: '/api/auth/login', method: 'POST' },
    { email: 'am@sonthillu.com', password: 'Password123!' });
  const amCookie = extractCookie(amLogin.headers);

  console.log('[ 1. Unauthenticated Request ]');
  const noAuthReq = await apiRequest({ path: '/api/v1/authorizations/summary', method: 'GET' });
  console.log('noAuthReq status:', noAuthReq.status);
  assert(noAuthReq.status === 401, 'Returns 401 for missing token');

  console.log('[ 2. Associate Request ]');
  const assocReq = await apiRequest({ path: '/api/v1/authorizations/summary', method: 'GET', headers: { 'Cookie': assocCookie } });
  assert(assocReq.status === 403, 'Returns 403 for Associate');

  if (amCookie) {
    console.log('[ 3. AM Request ]');
    const amReq = await apiRequest({ path: '/api/v1/authorizations/summary', method: 'GET', headers: { 'Cookie': amCookie } });
    assert(amReq.status === 403, 'Returns 403 for AM');
  } else {
    console.log('[ 3. AM Request ] (Skipped, no AM test user found)');
  }

  console.log('[ 4. MD Request ]');
  const mdReq = await apiRequest({ path: '/api/v1/authorizations/summary', method: 'GET', headers: { 'Cookie': mdCookie } });
  assert(mdReq.status === 200, 'Returns 200 OK for MD');
  
  if (mdReq.status === 200) {
    const data = mdReq.body.data;
    assert(data.hasOwnProperty('total'), 'Response has total');
    assert(data.hasOwnProperty('projects'), 'Response has projects');
    assert(data.hasOwnProperty('bookings'), 'Response has bookings');
    assert(data.hasOwnProperty('teamRequests'), 'Response has teamRequests');
    assert(data.hasOwnProperty('travelRequests'), 'Response has travelRequests');
    assert(data.hasOwnProperty('commissionPolicies'), 'Response has commissionPolicies');
    console.log(`  Aggregated Total Pending Items: ${data.total}`);
  }

  console.log(`\nResults: ${passed} PASS, ${failed} FAIL\n`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

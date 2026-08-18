const axios = require('axios');

async function testSecurity() {
  const API_URL = 'https://associate-partner-portal.onrender.com/api';
  let passed = 0;
  let failed = 0;

  console.log('--- RUNNING SECURITY TESTS ---');

  // Test 1: Unauthenticated access should be rejected
  try {
    await axios.get(`${API_URL}/users/me`);
    console.error('FAIL: Unauthenticated access to /users/me succeeded');
    failed++;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('PASS: Unauthenticated access rejected (401)');
      passed++;
    } else {
      console.error(`FAIL: Unexpected error for unauthenticated access: ${error.message}`);
      failed++;
    }
  }

  // Test 2: Verify security headers
  try {
    const res = await axios.get(`${API_URL}/health`);
    const headers = res.headers;
    let headersOk = true;

    if (headers['x-content-type-options'] !== 'nosniff') {
      console.error('FAIL: Missing/incorrect X-Content-Type-Options');
      headersOk = false;
    }
    if (headers['x-frame-options'] !== 'DENY') {
      console.error('FAIL: Missing/incorrect X-Frame-Options');
      headersOk = false;
    }
    if (headers['x-xss-protection'] !== '1; mode=block') {
      console.error('FAIL: Missing/incorrect X-XSS-Protection');
      headersOk = false;
    }

    if (headersOk) {
      console.log('PASS: Security headers are present');
      passed++;
    } else {
      failed++;
    }
  } catch (error) {
    console.error(`FAIL: Health check failed: ${error.message}`);
    failed++;
  }

  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

testSecurity();

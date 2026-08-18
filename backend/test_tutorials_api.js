const axios = require('axios');
const assert = require('assert');

const API_URL = 'https://associate-partner-portal.onrender.com/api/v1';

async function runTests() {
  console.log('=== Phase 13 API Tests (Tutorials) ===');

  try {
    // 1. Setup Auth
    let res = await axios.post(`https://associate-partner-portal.onrender.com/api/auth/login`, { email: 'md@sonthillu.com', password: 'Password123!' });
    const mdCookie = res.headers['set-cookie'][0];

    res = await axios.post(`https://associate-partner-portal.onrender.com/api/auth/login`, { email: 'associate@sonthillu.com', password: 'Password123!' });
    const associateCookie = res.headers['set-cookie'][0];

    // 2. Unauthenticated read -> 401
    try {
      await axios.get(`${API_URL}/tutorials`);
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 401, 'Expected 401 for unauthenticated');
      console.log('✅ PASS  Unauthenticated read rejected');
    }

    // 3. MD Create Tutorial
    const newTutorial = await axios.post(`${API_URL}/tutorials`, {
      title: 'Create a Booking',
      slug: 'create-booking',
      category: 'Bookings',
      description: 'Learn how to create a booking',
      roleVisibility: ['ASSOCIATE', 'MD'],
      isPublished: true,
      displayOrder: 1
    }, { headers: { Cookie: mdCookie } });
    assert(newTutorial.status === 201, 'MD can create Tutorial');
    const tutorialId = newTutorial.data.data.id;
    console.log('✅ PASS  MD create Tutorial works');

    // 4. MD Create Step
    const newStep = await axios.post(`${API_URL}/tutorials/${tutorialId}/steps`, {
      stepNumber: 1,
      title: 'Click Bookings',
      explanation: 'Navigate to Bookings in the sidebar.',
      targetSelector: 'a[href="/bookings"]'
    }, { headers: { Cookie: mdCookie } });
    assert(newStep.status === 201, 'MD can create TutorialStep');
    const stepId = newStep.data.data.id;
    console.log('✅ PASS  MD create TutorialStep works');

    // 5. Associate Read Tutorial
    res = await axios.get(`${API_URL}/tutorials`, { headers: { Cookie: associateCookie } });
    assert(res.data.data.length > 0, 'Associate can read Tutorials');
    const hasMyTutorial = res.data.data.find(t => t.id === tutorialId);
    assert(hasMyTutorial, 'Associate sees their Tutorial');
    assert(hasMyTutorial.steps.length === 1, 'Steps are included');
    console.log('✅ PASS  Associate read allowed and steps included');

    // 6. Associate get by slug
    res = await axios.get(`${API_URL}/tutorials/create-booking`, { headers: { Cookie: associateCookie } });
    assert(res.data.data.id === tutorialId, 'Get by slug works');
    console.log('✅ PASS  Get by slug works');

    // 7. Associate mutation -> 403
    try {
      await axios.post(`${API_URL}/tutorials`, {
        title: 'Hack',
        slug: 'hack',
        category: 'Hack',
        roleVisibility: []
      }, { headers: { Cookie: associateCookie } });
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 403, 'Expected 403 for associate mutation');
      console.log('✅ PASS  Associate mutation rejected');
    }

    try {
      await axios.post(`${API_URL}/tutorials/${tutorialId}/steps`, {
        stepNumber: 2,
        title: 'Hack',
        explanation: 'Hack'
      }, { headers: { Cookie: associateCookie } });
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 403, 'Expected 403 for associate step mutation');
      console.log('✅ PASS  Associate step mutation rejected');
    }

    // 8. Role Filtering & Published Status
    const mdOnlyTutorial = await axios.post(`${API_URL}/tutorials`, {
      title: 'Admin Secret',
      slug: 'admin-secret',
      category: 'Security',
      roleVisibility: ['MD'],
      isPublished: true
    }, { headers: { Cookie: mdCookie } });

    const unpublishedTutorial = await axios.post(`${API_URL}/tutorials`, {
      title: 'Coming Soon',
      slug: 'coming-soon',
      category: 'Account',
      roleVisibility: ['ASSOCIATE'],
      isPublished: false
    }, { headers: { Cookie: mdCookie } });

    res = await axios.get(`${API_URL}/tutorials`, { headers: { Cookie: associateCookie } });
    const visibleTutorials = res.data.data;
    const seesMdTutorial = visibleTutorials.find(t => t.id === mdOnlyTutorial.data.data.id);
    const seesUnpublished = visibleTutorials.find(t => t.id === unpublishedTutorial.data.data.id);

    assert(!seesMdTutorial, 'Associate should not see MD-only Tutorial');
    assert(!seesUnpublished, 'Associate should not see unpublished Tutorial');
    console.log('✅ PASS  Role and Published filtering works');

    // MD sees all unpublished / other roles depending on logic, but MD generally has access
    const mdRes = await axios.get(`${API_URL}/tutorials`, { headers: { Cookie: mdCookie } });
    const mdSeesUnpublished = mdRes.data.data.find(t => t.id === unpublishedTutorial.data.data.id);
    assert(mdSeesUnpublished, 'MD can see unpublished Tutorial');
    console.log('✅ PASS  MD can see unpublished Tutorials');

    // 9. Cleanup
    await axios.delete(`${API_URL}/tutorials/${tutorialId}`, { headers: { Cookie: mdCookie } }); // Cascade should delete steps
    await axios.delete(`${API_URL}/tutorials/${mdOnlyTutorial.data.data.id}`, { headers: { Cookie: mdCookie } });
    await axios.delete(`${API_URL}/tutorials/${unpublishedTutorial.data.data.id}`, { headers: { Cookie: mdCookie } });
    console.log('✅ PASS  Cleanup successful');

    console.log('\nAll Tutorial tests passed! ✅');
  } catch (err) {
    console.error('❌ FAIL', err.message);
    if (err.response) {
      console.error(err.response.data);
    }
    process.exit(1);
  }
}

runTests();

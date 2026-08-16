const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('=== Phase 13 API Tests (FAQ) ===');

  try {
    // 1. Setup Auth
    let res = await axios.post(`http://localhost:5000/api/auth/login`, { email: 'md@sonthillu.com', password: 'Password123!' });
    const mdCookie = res.headers['set-cookie'][0];
    
    res = await axios.post(`http://localhost:5000/api/auth/login`, { email: 'associate@sonthillu.com', password: 'Password123!' });
    const associateCookie = res.headers['set-cookie'][0];

    // 2. Unauthenticated read -> 401
    try {
      await axios.get(`${API_URL}/faqs`);
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 401, 'Expected 401 for unauthenticated');
      console.log('✅ PASS  Unauthenticated read rejected');
    }

    // 3. MD Create FAQ
    const newFaq = await axios.post(`${API_URL}/faqs`, {
      question: 'How do I create a booking?',
      answer: 'Go to Bookings and click Create.',
      category: 'Bookings',
      roleVisibility: ['ASSOCIATE', 'MD'],
      isPublished: true,
      displayOrder: 1
    }, { headers: { Cookie: mdCookie } });
    assert(newFaq.status === 201, 'MD can create FAQ');
    const faqId = newFaq.data.data.id;
    console.log('✅ PASS  MD create works');

    // 4. Associate Read FAQ
    res = await axios.get(`${API_URL}/faqs`, { headers: { Cookie: associateCookie } });
    assert(res.data.data.length > 0, 'Associate can read FAQs');
    const hasMyFaq = res.data.data.find(f => f.id === faqId);
    assert(hasMyFaq, 'Associate sees their FAQ');
    console.log('✅ PASS  Associate read allowed');

    // 5. Associate mutation -> 403
    try {
      await axios.post(`${API_URL}/faqs`, {
        question: 'Hack',
        answer: 'Hack',
        category: 'Hack',
        roleVisibility: []
      }, { headers: { Cookie: associateCookie } });
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 403, 'Expected 403 for associate mutation');
      console.log('✅ PASS  Associate mutation rejected');
    }

    // 6. Role Filtering & Published Status
    const mdOnlyFaq = await axios.post(`${API_URL}/faqs`, {
      question: 'Admin Secret?',
      answer: 'Secret Answer.',
      category: 'Security',
      roleVisibility: ['MD'],
      isPublished: true
    }, { headers: { Cookie: mdCookie } });

    const unpublishedFaq = await axios.post(`${API_URL}/faqs`, {
      question: 'Coming Soon?',
      answer: 'Draft',
      category: 'Account',
      roleVisibility: ['ASSOCIATE'],
      isPublished: false
    }, { headers: { Cookie: mdCookie } });

    res = await axios.get(`${API_URL}/faqs`, { headers: { Cookie: associateCookie } });
    const visibleFaqs = res.data.data;
    const seesMdFaq = visibleFaqs.find(f => f.id === mdOnlyFaq.data.data.id);
    const seesUnpublished = visibleFaqs.find(f => f.id === unpublishedFaq.data.data.id);
    
    assert(!seesMdFaq, 'Associate should not see MD-only FAQ');
    assert(!seesUnpublished, 'Associate should not see unpublished FAQ');
    console.log('✅ PASS  Role and Published filtering works');

    // MD sees all unpublished / other roles depending on logic, but MD generally has access
    // Wait, md can see unpublished:
    const mdRes = await axios.get(`${API_URL}/faqs`, { headers: { Cookie: mdCookie } });
    const mdSeesUnpublished = mdRes.data.data.find(f => f.id === unpublishedFaq.data.data.id);
    assert(mdSeesUnpublished, 'MD can see unpublished FAQ');
    console.log('✅ PASS  MD can see unpublished FAQs');

    // 7. Cleanup
    await axios.delete(`${API_URL}/faqs/${faqId}`, { headers: { Cookie: mdCookie } });
    await axios.delete(`${API_URL}/faqs/${mdOnlyFaq.data.data.id}`, { headers: { Cookie: mdCookie } });
    await axios.delete(`${API_URL}/faqs/${unpublishedFaq.data.data.id}`, { headers: { Cookie: mdCookie } });
    console.log('✅ PASS  Cleanup successful');

    console.log('\nAll FAQ tests passed! ✅');
  } catch (err) {
    console.error('❌ FAIL', err.message);
    if (err.response) {
      console.error(err.response.data);
    }
    process.exit(1);
  }
}

runTests();

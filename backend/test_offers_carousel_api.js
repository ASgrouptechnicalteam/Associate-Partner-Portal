const axios = require('axios');
const assert = require('assert');

const API_URL = 'https://associate-partner-portal.onrender.com/api/v1';

async function runTests() {
  console.log('=== Phase 10 API Tests ===');

  let mdToken = '';
  let associateToken = '';

  try {
    // 1. Setup Auth
    let res = await axios.post(`https://associate-partner-portal.onrender.com/api/auth/login`, { email: 'md@sonthillu.com', password: 'Password123!' });
    const mdCookie = res.headers['set-cookie'][0];

    res = await axios.post(`https://associate-partner-portal.onrender.com/api/auth/login`, { email: 'associate@sonthillu.com', password: 'Password123!' });
    const associateCookie = res.headers['set-cookie'][0];

    // --- CAROUSEL TESTS ---
    console.log('\n--- Carousel ---');

    // 2. Unauthenticated access
    try {
      await axios.get(`${API_URL}/carousel`);
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 401, 'Expected 401 for unauthenticated');
      console.log('✅ PASS  Unauthenticated read rejected');
    }

    // 3. Associate read
    res = await axios.get(`${API_URL}/carousel`, { headers: { Cookie: associateCookie } });
    assert(res.status === 200, 'Associate can read active carousel');
    console.log('✅ PASS  Associate read allowed');

    // 4. Associate mutation -> 403
    try {
      await axios.post(`${API_URL}/carousel`, { title: 'Hacked', imageUrl: '/hack.jpg' }, { headers: { Cookie: associateCookie } });
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 403, 'Expected 403 for associate mutation');
      console.log('✅ PASS  Associate mutation rejected');
    }

    // 5. MD Create & Edit
    const newCarousel = await axios.post(`${API_URL}/carousel`, {
      title: 'A',
      imageUrl: '/imgA.jpg',
      displayOrder: 1
    }, { headers: { Cookie: mdCookie } });
    assert(newCarousel.status === 201, 'MD can create carousel');
    const idA = newCarousel.data.data.id;
    console.log('✅ PASS  MD create works');

    const carouselB = await axios.post(`${API_URL}/carousel`, { title: 'B', imageUrl: '/imgB.jpg', displayOrder: 2 }, { headers: { Cookie: mdCookie } });
    const idB = carouselB.data.data.id;

    const carouselC = await axios.post(`${API_URL}/carousel`, { title: 'C', imageUrl: '/imgC.jpg', displayOrder: 3 }, { headers: { Cookie: mdCookie } });
    const idC = carouselC.data.data.id;

    // 6. Reorder (C, A, B)
    res = await axios.patch(`${API_URL}/carousel/reorder`, {
      items: [
        { id: idC, displayOrder: 1 },
        { id: idA, displayOrder: 2 },
        { id: idB, displayOrder: 3 }
      ]
    }, { headers: { Cookie: mdCookie } });
    assert(res.status === 200, 'Reorder works');
    console.log('✅ PASS  Reorder works');

    // 7. Verify Reorder Persistence
    res = await axios.get(`${API_URL}/carousel`, { headers: { Cookie: mdCookie } });
    const carousels = res.data.data;
    assert(carousels[0].id === idC && carousels[0].displayOrder === 1, 'C is first');
    assert(carousels[1].id === idA && carousels[1].displayOrder === 2, 'A is second');
    assert(carousels[2].id === idB && carousels[2].displayOrder === 3, 'B is third');
    console.log('✅ PASS  Reorder persistence verified');

    // 8. Delete / Archive
    await axios.delete(`${API_URL}/carousel/${idA}`, { headers: { Cookie: mdCookie } });
    await axios.delete(`${API_URL}/carousel/${idB}`, { headers: { Cookie: mdCookie } });
    await axios.delete(`${API_URL}/carousel/${idC}`, { headers: { Cookie: mdCookie } });
    console.log('✅ PASS  Delete works');

    // --- OFFERS TESTS ---
    console.log('\n--- Offers ---');

    // 9. MD Create Offer
    const newOffer = await axios.post(`${API_URL}/offers`, {
      title: 'Bonus Reward',
      description: 'Get extra 5% for 3 bookings',
      targetAudience: 'ASSOCIATE',
      targetBookings: 3,
      reward: '5% extra'
    }, { headers: { Cookie: mdCookie } });
    assert(newOffer.status === 201, 'MD can create offer');
    const offerId = newOffer.data.data.id;
    console.log('✅ PASS  MD create offer works');

    // 10. Associate Read Offer
    res = await axios.get(`${API_URL}/offers`, { headers: { Cookie: associateCookie } });
    assert(res.status === 200, 'Associate can read offers');
    const myOffer = res.data.data.find(o => o.id === offerId);
    assert(myOffer, 'Offer exists');
    assert(myOffer.achievedBookings !== undefined, 'Progress dynamically calculated');
    console.log('✅ PASS  Dynamic progress calculation works');

    // 11. Associate edit fails
    try {
      await axios.patch(`${API_URL}/offers/${offerId}`, { title: 'Hacked' }, { headers: { Cookie: associateCookie } });
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 403, 'Expected 403 for associate mutation');
      console.log('✅ PASS  Associate mutation rejected for offers');
    }

    // 12. Scheduling
    const scheduledOffer = await axios.post(`${API_URL}/offers`, {
      title: 'Future Offer',
      targetAudience: 'ASSOCIATE',
      startDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
    }, { headers: { Cookie: mdCookie } });
    assert(scheduledOffer.data.data.status === 'SCHEDULED', 'Future start date correctly resolves to SCHEDULED');
    console.log('✅ PASS  Scheduling status enforced');

    // Cleanup Offers
    await axios.delete(`${API_URL}/offers/${offerId}`, { headers: { Cookie: mdCookie } });
    await axios.delete(`${API_URL}/offers/${scheduledOffer.data.data.id}`, { headers: { Cookie: mdCookie } });
    console.log('✅ PASS  Offer archive works');

    // --- POPUP TESTS ---
    console.log('\n--- Popups ---');
    const newPopup = await axios.post(`${API_URL}/popups`, {
      heading: 'Diwali Sale',
      status: 'ACTIVE'
    }, { headers: { Cookie: mdCookie } });
    assert(newPopup.status === 201, 'MD can create popup');
    console.log('✅ PASS  MD create popup works');

    try {
      await axios.delete(`${API_URL}/popups/${newPopup.data.data.id}`, { headers: { Cookie: associateCookie } });
      throw new Error('Should have failed');
    } catch (err) {
      assert(err.response.status === 403, 'Expected 403 for associate mutation');
      console.log('✅ PASS  Associate mutation rejected for popups');
    }

    await axios.delete(`${API_URL}/popups/${newPopup.data.data.id}`, { headers: { Cookie: mdCookie } });
    console.log('✅ PASS  Popup delete works');

    console.log('\nAll tests passed! ✅');
  } catch (err) {
    console.error('❌ FAIL', err.message);
    if (err.response) {
      console.error(err.response.data);
    }
    process.exit(1);
  }
}

runTests();

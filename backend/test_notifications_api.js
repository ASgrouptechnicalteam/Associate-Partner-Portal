const axios = require('axios');

const API_URL = 'https://associate-partner-portal.onrender.com/api/v1';

async function testNotifications() {
  console.log('--- Testing Notifications API ---');

  let adminCookie;
  try {
    const loginRes = await axios.post(`https://associate-partner-portal.onrender.com/api/auth/login`, {
      email: 'md@sonthillu.com',
      password: 'Password123!'
    });
    adminCookie = loginRes.headers['set-cookie'][0];
    console.log('Login successful');
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
    return;
  }

  const authHeader = { Cookie: adminCookie };

  // 1. Get Notifications
  let notificationId;
  try {
    const listRes = await axios.get(`${API_URL}/notifications?limit=5`, { headers: authHeader });
    console.log('GET /notifications response count:', listRes.data.notifications.length);
    if (listRes.data.notifications.length > 0) {
      notificationId = listRes.data.notifications[0].id;
    }
  } catch (err) {
    console.error('GET /notifications failed:', err.response?.data || err.message);
  }

  // 2. Get Unread Count
  try {
    const countRes = await axios.get(`${API_URL}/notifications/unread-count`, { headers: authHeader });
    console.log('GET /notifications/unread-count:', countRes.data);
  } catch (err) {
    console.error('GET /unread-count failed:', err.response?.data || err.message);
  }

  // 3. Mark as read
  if (notificationId) {
    try {
      const readRes = await axios.patch(`${API_URL}/notifications/${notificationId}/read`, {}, { headers: authHeader });
      console.log('PATCH /notifications/:id/read success, isRead:', readRes.data.isRead);
    } catch (err) {
      console.error('PATCH /read failed:', err.response?.data || err.message);
    }
  } else {
    console.log('Skipping mark as read test because no notifications found.');
  }

  // 4. Mark all as read
  try {
    const readAllRes = await axios.patch(`${API_URL}/notifications/read-all`, {}, { headers: authHeader });
    console.log('PATCH /notifications/read-all success, count:', readAllRes.data.count);
  } catch (err) {
    console.error('PATCH /read-all failed:', err.response?.data || err.message);
  }
}

testNotifications();

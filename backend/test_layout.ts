import axios from 'axios';

const API_URL = 'https://associate-partner-portal.onrender.com/api';

async function run() {
  console.log('Testing Layout API Endpoints...');

  // 1. Get token
  console.log('Logging in as MD...');
  const loginRes = await axios.post(`${API_URL}/auth/login`, {
    email: 'md@sonthillu.com',
    password: 'password123'
  });
  const token = loginRes.data.data.token;
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // 2. Find a project
  const projRes = await axios.get(`${API_URL}/projects`, config);
  const project = projRes.data.data[0];
  console.log(`Using Project: ${project.name} (${project.id})`);

  // 3. Get Draft (Should create one if none exists)
  console.log('Fetching draft...');
  const draftRes = await axios.get(`${API_URL}/projects/${project.id}/layout/draft`, config);
  const draft = draftRes.data.data;
  console.log(`Draft ID: ${draft.id}`);

  // 4. Save Draft with Elements
  console.log('Saving Draft...');
  const saveRes = await axios.post(`${API_URL}/projects/${project.id}/layout/draft`, {
    name: 'Test Plan',
    canvasWidth: 800,
    canvasHeight: 600,
    elements: [
      { type: 'PLOT', x: 10, y: 10, width: 50, height: 50, zIndex: 1, elementData: { label: '1A' } },
      { type: 'ROAD', x: 100, y: 100, width: 200, height: 20, zIndex: 0, elementData: { label: 'Main Road' } }
    ]
  }, config);
  console.log(`Draft Elements saved: ${saveRes.data.data.elements.length}`);

  // 5. Publish Draft
  console.log('Publishing Draft...');
  await axios.post(`${API_URL}/projects/layout/${draft.id}/publish`, {}, config);
  console.log('Draft Published!');

  // 6. Get Published
  console.log('Fetching Published Layout...');
  const pubRes = await axios.get(`${API_URL}/projects/${project.id}/layout/published`, config);
  console.log(`Published Layout ID: ${pubRes.data.data.id}`);
  console.log(`Published Elements: ${pubRes.data.data.elements.length}`);

  console.log('Test completed successfully!');
}

run().catch(console.error);

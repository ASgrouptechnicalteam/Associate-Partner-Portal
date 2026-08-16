const app = require('./dist/app').default;
const request = require('supertest');
const jwt = require('jsonwebtoken');
require('dotenv').config({path:'../.env'});

const token = jwt.sign({
  userId: '17851068-285f-4a7e-9930-5338574c0a1c',
  role: 'MD',
  associateId: 'ASSOC-MD-4056',
  sessionId: '0c87d53c8a48526e3a6114130caee5e1'
}, process.env.JWT_SECRET || 'fallback', { expiresIn: '1h' });

request(app)
  .patch('/api/projects/media/220ca55d-3e24-49d8-9339-426b4ac8f70e/cover')
  .set('Cookie', `token=${token}`)
  .end((err, res) => {
    console.log('Response Status:', res.status);
    console.log('Response Text:', res.text);
    process.exit(0);
  });

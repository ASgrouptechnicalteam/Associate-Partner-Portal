const express = require('express');
const app = express();
const router = express.Router();

router.patch('/:id', (req, res, next) => {
  console.log('Hit /:id with id =', req.params.id);
  res.send('Matched /:id');
});

router.patch('/media/:mediaId/cover', (req, res) => {
  console.log('Hit /media/:mediaId/cover');
  res.send('Matched /media/:mediaId/cover');
});

app.use('/api/projects', router);

const req = {
  method: 'PATCH',
  url: '/api/projects/media/123/cover',
  headers: {}
};

app.handle(req, {
  send: (data) => console.log('RESPONSE:', data),
  end: () => console.log('ENDED')
}, (err) => console.log('NEXT called. Error?', err || 'none'));

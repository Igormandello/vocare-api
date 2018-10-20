const router = require('express').Router();

router.get('/', (req, res) => {
  res.status(501).send('GET response');
});

router.get('/:id(\\d+)', (req, res) => {
  res.status(501).send('GET response');
});

router.get('/:id(\\d+)/views', (req, res) => {
  res.status(501).send('GET response');
});

router.post('/', (req, res) => {
  res.status(501).send('POST response');
});

router.put('/:id(\\d+)', (req, res) => {
  res.status(501).send('PUT response');
});

router.delete('/:id(\\d+)', (req, res) => {
  res.status(501).send('DELETE response');
});

module.exports = router;
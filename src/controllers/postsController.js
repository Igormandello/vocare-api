const router = require('express').Router();
const { runSql } = require('../db');

router.get('/', (req, res) => {
  let offset = 0;
  if (req.body.page && req.body.page > 0)
    offset = 10 * page;

  runSql(`exec sp_discussion_posts ${offset}, 10`).then(result => {
    res.send(result.recordset);
  }).catch(e => res.status(400).send(e));
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
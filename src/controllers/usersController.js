const router = require('express').Router();
const { runSql } = require('../db');

router.get('/', (req, res) => {
  runSql('select * from [user]').then((result) => {
    res.send(result.recordset);
  });
});

router.post('/', (req, res) => {
  res.status(501).send('POST response');
});

router.put('/', (req, res) => {
  res.status(501).send('PUT response');
});

router.delete('/', (req, res) => {
  res.status(501).send('DELETE response');
});

module.exports = router;
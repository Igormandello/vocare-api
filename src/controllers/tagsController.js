const router = require('express').Router();
const mssql = require('mssql');
const { runSql } = require('../db');

router.get('/', (req, res) => {
  runSql('exec sp_tags').then(result => {
    res.send(result.recordset);
  }).catch(e => res.status(400).send(e));
});

router.get('/:id(\\d+)', (req, res) => {
  runSql('exec sp_tags @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then((result) => {
    if (result.recordset.length == 0) {
      res.status(400).send();
      return;
    }

    res.send(result.recordset[0]);
  }).catch(e => res.status(400).send(e));
});

module.exports = router;
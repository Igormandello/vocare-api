const router = require('express').Router();
const mssql = require('mssql');
const { runSql } = require('../db');

router.get('/', (req, res) => {
  runSql('exec sp_courses').then(result => {
    res.send(result.recordset);
  }).catch(e => res.status(400).send(e));
});

router.get('/:id(\\d+)', (req, res) => {
  runSql('exec sp_courses @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then((result) => {
    if (result.recordset.length == 0) {
      res.status(400).send();
      return;
    }

    res.send(result.recordset[0]);
  }).catch(e => res.status(400).send(e));
});

router.post('/', (req, res) => {
  runSql('exec sp_create_course @name, @shortname, @description, @area_name',
    { name: 'name', type: mssql.VarChar(50), value: req.body.name },
    { name: 'shortname', type: mssql.VarChar(30), value: req.body.shortname },
    { name: 'description', type: mssql.VarChar(300), value: req.body.description },
    { name: 'area_name', type: mssql.VarChar(30), value: req.body.area }
  ).then(() => res.status(201).send())
  .catch(e => res.status(400).send(e));
});

module.exports = router;
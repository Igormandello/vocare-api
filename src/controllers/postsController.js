const router = require('express').Router();
const mssql = require('mssql');
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
  runSql('exec sp_discussion_posts 0, 0, @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then((result) => {
    if (result.recordset.length == 0) {
      res.status(400).send();
      return;
    }

    res.send(result.recordset[0]);
  });
});

router.get('/:id(\\d+)/views', (req, res) => {
  res.status(501).send('GET response');
});

router.post('/', (req, res) => {
  runSql('exec sp_post_create @user_id, @title, @message, @area',
    { name: 'user_id', type: mssql.Int, value: req.body.user_id },
    { name: 'title', type: mssql.VarChar(100), value: req.body.title },
    { name: 'message', type: mssql.VarChar(mssql.MAX), value: req.body.message },
    { name: 'area', type: mssql.VarChar(30), value: req.body.area }
  ).then((result) => {
    let obj = result.recordset[0];
    res.status(201).send({
      id: obj.id,
      area_id: obj.area_id
    });
  }).catch((e) => res.status(400).send(e));
});

router.put('/:id(\\d+)', (req, res) => {
  res.status(501).send('PUT response');
});

router.delete('/:id(\\d+)', (req, res) => {
  res.status(501).send('DELETE response');
});

module.exports = router;
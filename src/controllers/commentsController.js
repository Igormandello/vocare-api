const router = require('express').Router();
const mssql = require('mssql');
const { runSql } = require('../db');

router.get('/', (req, res) => {
  runSql('exec sp_comments').then(result => {
    res.send(result.recordset);
  }).catch(e => res.status(400).send(e));
});

router.get('/:id(\\d+)', (req, res) => {
  runSql('exec sp_comments @id',
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
  runSql('exec sp_comment_create @post_id, @user_id, @message',
    { name: 'post_id', type: mssql.Int, value: req.body.post_id },
    { name: 'user_id', type: mssql.Int, value: req.body.user_id },
    { name: 'message', type: mssql.VarChar(mssql.MAX), value: req.body.message }
  ).then(() => res.status(201).send())
  .catch(e => res.status(400).send(e));
});

router.put('/:id(\\d+)', (req, res) => {
  runSql('exec sp_update_comment @id, @message',
    { name: 'id', type: mssql.Int, value: req.params.id },
    { name: 'message', type: mssql.VarChar(mssql.MAX), value: req.body.message }
  ).then(() => res.send())
  .catch(e => res.status(400).send(e));
});

router.delete('/:id(\\d+)', (req, res) => {
  runSql('exec sp_delete_comment @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then(() => res.send())
  .catch(e => res.status(400).send(e));
});

module.exports = router;
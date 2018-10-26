const router = require('express').Router();
const mssql = require('mssql');
const { runSql } = require('../db');

router.get('/', (req, res) => {
  runSql('exec sp_comments').then(result => {
    res.send(result.recordset);
  }).catch(e => res.status(400).send(e.originalError.info.message));
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
  }).catch(e => res.status(400).send(e.originalError.info.message));
});

router.post('/', (req, res) => {
  if (req.user != req.body.user_id)
    return res.status(401).send('Not Allowed');

  runSql('exec sp_comment_create @post_id, @user_id, @message',
    { name: 'post_id', type: mssql.Int, value: req.body.post_id },
    { name: 'user_id', type: mssql.Int, value: req.body.user_id },
    { name: 'message', type: mssql.VarChar(mssql.MAX), value: req.body.message }
  ).then(() => res.status(201).send())
  .catch(e => res.status(400).send(e.originalError.info.message));
});

router.put('/:id(\\d+)', (req, res) => {
  runSql('exec sp_update_comment @id, @message, @user_id',
    { name: 'id', type: mssql.Int, value: req.params.id },
    { name: 'message', type: mssql.VarChar(mssql.MAX), value: req.body.message },
    { name: 'user_id', type: mssql.Int, value: req.user }
  ).then(() => res.send())
  .catch((e) => res.status(errors[e.state - 1]).send(e.originalError.info.message));
});

router.delete('/:id(\\d+)', (req, res) => {
  runSql('exec sp_delete_comment @id, @user_id',
    { name: 'id', type: mssql.Int, value: req.params.id },
    { name: 'user_id', type: mssql.Int, value: req.user }
  ).then(() => res.send())
  .catch((e) => res.status(errors[e.state - 1]).send(e.originalError.info.message));
});

module.exports = router;
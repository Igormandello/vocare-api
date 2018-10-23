const router = require('express').Router();
const sha256 = require('sha256');
const mssql = require('mssql');
const { runSql } = require('../db');

router.get('/', (req, res) => {
  runSql('exec sp_users').then((result) => {
    res.send(result.recordset.map(obj => {
      return {
        id: obj.id,
        username: obj.username,
        profile_picture: obj.profile_picture
      }
    }));
  });
});

router.get('/:id(\\d+)', (req, res) => {
  runSql('exec sp_users @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then((result) => {
    if (result.recordset.length == 0) {
      res.status(400).send();
      return;
    }

    let obj = result.recordset[0];
    res.send({
      id: obj.id,
      username: obj.username,
      profile_picture: obj.profile_picture
    });
  });
});

router.get('/:id(\\d+)/messages', (req, res) => {
  runSql('exec sp_count_messages @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then(result => res.send(result.recordset[0]));
});

router.get('/:id(\\d+)/notifications', (req, res) => {
  let offset = 0;
  if (req.body.page && req.body.page > 0)
    offset = 10 * req.body.page;

  runSql('exec sp_user_notifications @id, @offset, 10',
    { name: 'id', type: mssql.Int, value: req.params.id },
    { name: 'offset', type: mssql.Int, value: offset }
  ).then(result => res.send(result.recordset[0]))
  .catch((e) => res.status(400).send(e));
});

router.get('/:id(\\d+)/notifications/unreaden', (req, res) => {
  runSql('exec sp_unreaden_notifications @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then(result => res.send({ amount: result.recordset[0].amount }))
  .catch((e) => res.status(400).send(e));
});

router.get('/login', (req, res) => {
  if (req.body.email && req.body.password)
    runSql('exec sp_user_login @email, @password',
      { name: 'email', type: mssql.VarChar(255), value: req.body.email },
      { name: 'password', type: mssql.VarChar(64), value: sha256(req.body.password) }
    ).then((result) => {
      if (result.recordset.length == 0) {
        res.status(400).send();
        return;
      }

      let obj = result.recordset[0];
      res.send({
        id: obj.id,
        username: obj.username,
        profile_picture: obj.profile_picture
      });
    }).catch((e) => res.status(400).send(e));
  else
    runSql('exec sp_user_login_provider @access_token, @provider',
      { name: 'access_token', type: mssql.VarChar(mssql.MAX), value: req.body.access_token },
      { name: 'provider', type: mssql.VarChar(50), value: req.body.provider }
    ).then((result) => {
      if (result.recordset.length == 0) {
        res.status(400).send();
        return;
      }

      let obj = result.recordset[0];
      res.send({
        id: obj.id,
        username: obj.username,
        profile_picture: obj.profile_picture
      });
    }).catch((e) => res.status(400).send(e));
});

router.post('/', (req, res) => {
  if (req.body.email && req.body.password)
    runSql('exec sp_register_user @email, @password, @username',
      { name: 'email', type: mssql.VarChar(255), value: req.body.email },
      { name: 'password', type: mssql.VarChar(64), value: sha256(req.body.password) },
      { name: 'username', type: mssql.VarChar(30), value: req.body.username }
    ).then((result) => {
      result = result.recordset[0];
      res.status(201).send({
        id: result.id,
        username: result.username,
        profile_picture: result.profile_picture
      });
    }).catch(e => res.status(400).send(e));
  else
    runSql('exec sp_register_user_media @provider, @access_token, -1, @username',
      { name: 'provider', type: mssql.VarChar(50), value: req.body.provider },
      { name: 'access_token', type: mssql.VarChar(mssql.MAX), value: req.body.access_token },
      { name: 'username', type: mssql.VarChar(30), value: req.body.username }
    ).then((result) => {
      result = result.recordset[0];
      res.status(201).send({
        id: result.id,
        username: result.username,
        profile_picture: result.profile_picture
      });
    }).catch(e => res.status(400).send(e));
});

router.put('/:id(\\d+)', (req, res) => {
  runSql('exec sp_update_user @id, @email, @password, @username, @profile_picture',
    { name: 'id', type: mssql.Int, value: req.params.id },
    { name: 'email', type: mssql.VarChar(255), value: req.body.email },
    { name: 'password', type: mssql.VarChar(64), value: sha256(req.body.password) },
    { name: 'username', type: mssql.VarChar(30), value: req.body.username },
    { name: 'profile_picture', type: mssql.VarBinary(mssql.MAX), value: req.body.profile_picture }
  ).then(() => res.status(200).send())
  .catch(e => res.status(400).send(e));
});

router.delete('/:id(\\d+)', (req, res) => {
  runSql('exec sp_delete_user @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then(() => res.status(200).send())
  .catch(e => res.status(400).send(e));
});

module.exports = router;
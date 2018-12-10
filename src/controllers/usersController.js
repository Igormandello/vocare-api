const router = require('express').Router();
const sha256 = require('sha256');
const mssql = require('mssql');
const { runSql } = require('../db');
const { createToken, invalidate, getToken } = require('../middleware/auth');

router.get('/', (req, res) => {
  runSql('exec sp_users').then((result) => {
    res.send(result.recordset.map(obj => {
      return {
        id: obj.id,
        username: obj.username,
        level: obj.level
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
      level: obj.level,
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
  if (req.user != req.params.id)
    return res.status(401).send();

  let offset = 0;
  let page = req.param('page', 0);
  if (page && page > 0)
    offset = 10 * page;

  runSql('exec sp_user_notifications @id, @offset, 10',
    { name: 'id', type: mssql.Int, value: req.params.id },
    { name: 'offset', type: mssql.Int, value: offset }
  ).then(result => res.send(result.recordset))
  .catch((e) => res.status(400).send(e));
});

router.get('/:id(\\d+)/notifications/unreaden', (req, res) => {
  if (req.user != req.params.id)
    return res.status(401).send();

  runSql('exec sp_unreaden_notifications @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then(result => res.send({ amount: result.recordset[0].amount }))
  .catch((e) => res.status(400).send(e));
});

router.post('/', (req, res) => {
  const { email, password, username, access_token, provider } = req.body;

  if (email && password && username) {
    try {
      if (email.trim() === '' || password.trim() === '' || username.trim() === '') {
        res.status(400).send();
        return;
      }
    } catch(e) {
      res.status(400).send('Invalid parameters');
      return;
    }

    let usernameArr = username.split(' ');
    usernameArr = usernameArr.map(obj => {
      let str = obj.trim();
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    runSql('exec sp_register_user @email, @password, @username',
      { name: 'email', type: mssql.VarChar(255), value: email },
      { name: 'password', type: mssql.VarChar(64), value: sha256(password) },
      { name: 'username', type: mssql.VarChar(30), value: usernameArr.join(' ') }
    ).then((result) => {
      obj = result.recordset[0];
      res.status(201).send({
        id: obj.id,
        email: obj.email,
        username: obj.username,
        level: obj.level,
        profile_picture: obj.profile_picture,
        access_token: createToken(obj.id)
      });
    }).catch(e => res.status(400).send(e));
  } else if (access_token && provider)
    runSql('exec sp_register_user_media @provider, @access_token, -1, @username',
      { name: 'provider', type: mssql.VarChar(50), value: provider },
      { name: 'access_token', type: mssql.VarChar(mssql.MAX), value: access_token },
      { name: 'username', type: mssql.VarChar(30), value: username }
    ).then((result) => {
      result = result.recordset[0];
      res.status(201).send({
        id: obj.id,
        email: obj.email,
        username: obj.username,
        level: obj.level,
        profile_picture: obj.profile_picture,
        access_token: createToken(obj.id)
      });
    }).catch(e => res.status(400).send(e));
  else
    res.status(400).send();
});

router.put('/:id(\\d+)', (req, res) => {
  if (req.user != req.params.id)
    return res.status(401).send();

  const { id, email, password, username } = req.body;
  if (email.trim() === '' || password.trim() === '' || username.trim() === '') {
    res.status(400).send();
    return;
  }

  let usernameArr = username.split(' ');
  usernameArr = usernameArr.map(obj => {
    let str = obj.trim();
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  runSql('exec sp_update_user @id, @email, @password, @username',
    { name: 'id', type: mssql.Int, value: id },
    { name: 'email', type: mssql.VarChar(255), value: email },
    { name: 'password', type: mssql.VarChar(64), value: sha256(password) },
    { name: 'username', type: mssql.VarChar(30), value: usernameArr.join(' ') }
  ).then((result) => {
    if (result.recordset.length == 0) {
      res.status(400).send();
      return;
    }

    let obj = result.recordset[0];
    res.send({
      id: obj.id,
      username: obj.username,
      email: obj.email,
      level: obj.level,
      profile_picture: obj.profile_picture,
      access_token: getToken(obj.id)
    });
  })
  .catch(e => res.status(400).send(e));
});

router.put('/:id(\\d+)/profile_picture', (req, res) => {
  if (req.user != req.params.id)
    return res.status(401).send();

  runSql('exec sp_update_user_picture @id, @profile_picture',
    { name: 'id', type: mssql.Int, value: req.params.id },
    { name: 'profile_picture', type: mssql.VarChar(mssql.MAX), value: req.body.profile_picture }
  ).then((result) => {
    if (result.recordset.length == 0) {
      res.status(400).send();
      return;
    }

    let obj = result.recordset[0];
    res.send({
      id: obj.id,
      username: obj.username,
      email: obj.email,
      level: obj.level,
      profile_picture: obj.profile_picture,
      access_token: getToken(obj.id)
    });
  })
  .catch(e => res.status(400).send(e));
});

router.delete('/:id(\\d+)', (req, res) => {
  if (req.user != req.params.id)
    return res.status(401).send();

  runSql('exec sp_delete_user @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then(() => {
    res.status(200).send()
  })
  .catch(e => res.status(400).send(e));
});

module.exports = router;
const router = require('express').Router();
const sha256 = require('sha256');
const mssql = require('mssql');
const { runSql } = require('../db');
const { createToken, invalidate, getToken } = require('../middleware/auth');

router.post('/login', (req, res) => {
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
        level: obj.level,
        profile_picture: obj.profile_picture,
        access_token: createToken(obj.id)
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
        level: obj.level,
        profile_picture: obj.profile_picture,
        access_token: createToken(obj.id)
      });
    }).catch((e) => res.status(400).send(e));
});

router.post('/verify', (req, res) => {
  if (req.user != req.body.id)
    return res.status(401).send();

  runSql('exec sp_users @id',
    { name: 'id', type: mssql.Int, value: req.body.id }
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
  });
});

router.post('/logout', (req, res) => {
  if (req.user != req.body.id)
    return res.status(401).send();
  
  if (invalidate(req.user))
    return res.send();

  return res.status(500).send();
});

module.exports = router;
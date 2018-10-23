const router = require('express').Router();
const sha256 = require('sha256');
const mssql = require('mssql');
const crypto = require('crypto');
const { runSql } = require('../db');

let valid_tokens = {};
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
        profile_picture: obj.profile_picture,
        access_token: createToken(obj.id)
      });
    }).catch((e) => res.status(400).send(e));
});

router.get('/logoff', (req, res) => {
  if (req.body.access_token && req.body.id) {
    let token = req.body.access_token,
        id = req.body.id;

    if (valid_tokens[token] == id) {
      delete valid_tokens[token];
      res.send();
      return;
    }
  }

  res.status(400).send();
});

function createToken(id) {
  let token = crypto.randomBytes(64).toString('hex');
  valid_tokens[token] = id;

  return token;
}

module.exports = router;
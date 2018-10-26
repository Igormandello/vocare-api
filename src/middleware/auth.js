const crypto = require('crypto');

let valid_tokens = {}, valid_users = {};
function checkAuth(req, res, next) {
  if (req.headers.authorization) {
    let auth = req.headers.authorization.split(' ');

    if (auth[0].toUpperCase() != 'BEARER')
      return next();
    
    if (valid_tokens[auth[1]])
      req.user = valid_tokens[auth[1]];
  }

  next();
}

function createToken(id) {
  if (valid_users[id])
    delete valid_tokens[valid_users[id]];

  let token = crypto.randomBytes(64).toString('hex');
  valid_tokens[token] = id;

  valid_users[id] = token;
  return token;
}

module.exports = {
  checkAuth,
  createToken
};
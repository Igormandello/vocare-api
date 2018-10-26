var app = require('express').Router();

app.get('/', function(req, res) {
  res.json({
    status: 200,
    user: req.user
  });
});

module.exports = app;
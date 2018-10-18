require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
var app = express();


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/user', require('./src/controllers/userController'));

app.use('/api/health', require('./health'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at: ${port}`);
});

module.exports = app;
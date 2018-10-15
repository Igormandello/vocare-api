var express     = require('express');
var bodyParser  = require('body-parser');
var app = express();

var postController = require('./src/controllers/postController');
app.use('/api/post', postController);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let port = 3000
if (process.env.PORT)
  port = process.env.PORT;

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});
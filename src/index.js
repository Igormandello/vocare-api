require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
var app = express();

global.errors = [
  400,
  401
];

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '2MB', type:'application/json'}));
app.use(require('./middleware/auth').checkAuth);

app.use('/api/users', require('./controllers/usersController'));
app.use('/api/posts', require('./controllers/postsController'));
app.use('/api/tags', require('./controllers/tagsController'));
app.use('/api/areas', require('./controllers/areasController'));
app.use('/api/comments', require('./controllers/commentsController'));
app.use('/api/courses', require('./controllers/coursesController'));
app.use('/api/auth', require('./controllers/authController'));
app.use('/api/health', require('./health'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at: ${port}`);
});

module.exports = app;
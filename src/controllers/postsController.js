const router = require('express').Router();
const mssql = require('mssql');
const { runSql } = require('../db');

router.get('/', (req, res) => {
  let offset = 0;
  if (req.body.page && req.body.page > 0)
    offset = 10 * req.body.page;

  runSql(`exec sp_discussion_posts ${offset}, 10`).then(result => {
    res.send(result.recordset);
  }).catch(e => res.status(400).send(e));
});

router.get('/:id(\\d+)', (req, res) => {
  runSql('exec sp_discussion_posts 0, 0, @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then((result) => {
    if (result.recordset.length == 0) {
      res.status(400).send();
      return;
    }

    res.send(result.recordset[0]);
  });
});

router.get('/:id(\\d+)/views', (req, res) => {
  runSql('exec sp_post_views @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then((result) => {
    if (result.recordset.length == 0) {
      res.status(400).send();
      return;
    }

    res.send(result.recordset[0]);
  }).catch((e) => res.status(400).send(e));
});

router.get('/:id(\\d+)/tags', (req, res) => {
  runSql('exec sp_post_tags @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then((result) => res.send(result.recordset.map(obj => obj.name)))
  .catch((e) => res.status(400).send(e));
});

router.get('/:id(\\d+)/comments', (req, res) => {
  runSql('exec sp_post_comments @id, @user_id',
    { name: 'id', type: mssql.Int, value: req.params.id },
    { name: 'user_id', type: mssql.Int, value: req.body.user_id }
  ).then((result) => res.send(result.recordset))
  .catch((e) => res.status(400).send(e));
});

router.post('/', (req, res) => {
  if (req.user != req.body.user_id)
    return res.status(401).send();

  runSql('exec sp_post_create @user_id, @title, @message, @area',
    { name: 'user_id', type: mssql.Int, value: req.body.user_id },
    { name: 'title', type: mssql.VarChar(100), value: req.body.title },
    { name: 'message', type: mssql.VarChar(mssql.MAX), value: req.body.message },
    { name: 'area', type: mssql.VarChar(30), value: req.body.area }
  ).then((result) => {
    let obj = result.recordset[0];
    res.status(201).send({
      id: obj.id,
      area_id: obj.area_id
    });
  }).catch((e) => res.status(400).send(e.originalError.info.message));
});

router.post('/:id(\\d+)/tags', async (req, res) => {
  if (Array.isArray(req.body.tags)) {
    let error = false;
    for (let i = 0; i < req.body.tags.length && !error; i++)
      await runSql('exec sp_add_tag @id, @tag, @user_id', 
        { name: 'id', type: mssql.Int, value: req.params.id },
        { name: 'tag', type: mssql.VarChar(30), value: req.body.tags[i] },
        { name: 'user_id', type: mssql.Int, value: req.user }
      ).catch((e) => { error = true; res.status(errors[e.state - 1]).send(e.originalError.info.message); });

    if (!error)
      res.status(201).send();
  } else if (req.body.tags)
    runSql('exec sp_add_tag @id, @tag, @user_id',
      { name: 'id', type: mssql.Int, value: req.params.id },
      { name: 'tag', type: mssql.VarChar(30), value: req.body.tags },
      { name: 'user_id', type: mssql.Int, value: req.user }
    ).then(() => res.status(201).send())
    .catch((e) => res.status(errors[e.state - 1]).send(e.originalError.info.message));
  else
    res.status(400).send();
});

router.put('/:id(\\d+)', (req, res) => {
  runSql('exec sp_edit_post @id, @title, @message, @area, @user_id',
    { name: 'id', type: mssql.Int, value: req.params.id },
    { name: 'title', type: mssql.VarChar(100), value: req.body.title },
    { name: 'message', type: mssql.VarChar(mssql.MAX), value: req.body.message },
    { name: 'area', type: mssql.VarChar(30), value: req.body.area },
    { name: 'user_id', type: mssql.Int, value: req.user }
  ).then(() => res.status(200).send())
  .catch(e => res.status(errors[e.state - 1]).send(e.originalError.info.message));
});

router.delete('/:id(\\d+)', (req, res) => {
  runSql('exec sp_delete_post @id',
    { name: 'id', type: mssql.Int, value: req.params.id }
  ).then(() => res.status(200).send())
  .catch(e => res.status(400).send(e));
});

router.delete('/:id(\\d+)/tags', async (req, res) => {
  if (Array.isArray(req.body.tags)) {
    let error = false;
    for (let i = 0; i < req.body.tags.length && !error; i++)
      await runSql('exec sp_remove_tag @id, @tag, @user_id', 
        { name: 'id', type: mssql.Int, value: req.params.id },
        { name: 'tag', type: mssql.VarChar(30), value: req.body.tags[i] },
        { name: 'user_id', type: mssql.Int, value: req.user }
      ).catch((e) => { error = true; res.status(errors[e.state - 1]).send(e.originalError.info.message); });

    if (!error)
      res.status(200).send();
  } else if (req.body.tags)
    runSql('exec sp_remove_tag @id, @tag, @user_id',
      { name: 'id', type: mssql.Int, value: req.params.id },
      { name: 'tag', type: mssql.VarChar(30), value: req.body.tags },
      { name: 'user_id', type: mssql.Int, value: req.user }
    ).then(() => res.status(200).send())
    .catch(e => res.status(errors[e.state - 1]).send(e.originalError.info.message));
  else
    res.status(400).send();
});

module.exports = router;
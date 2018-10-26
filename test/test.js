const fs = require('fs');
const sha256 = require('sha256');
const ContainerManager = require('./ContainerManager');

let cm = new ContainerManager();
cm.createContainer().then(async () => {
	console.log('\nCreating tables...');
	let sqlScript = fs.readFileSync('./sql/create_tables.sql', 'utf8');
	await cm.execSql(sqlScript);
	console.log('Tables created');

	console.log('\nSetting foreign keys...');
	sqlScript = fs.readFileSync('./sql/foreign_keys.sql', 'utf8');
	await cm.execSql(sqlScript);
	console.log('Foreign keys created');

	console.log('\nCreating stored procedures...');
	sqlScript = fs.readFileSync('./sql/stored_procedures.sql', 'utf8');
	sqlScript = sqlScript.split('GO');

	let procedures = [];
	for (let i = 0; i < sqlScript.length; i++)
		procedures.push(cm.execSql(sqlScript[i]));

	await Promise.all(procedures);
	console.log('Stored procedures created');
	
	await cm.closeConnection();
	run();
});

deleteData = async function() {
	return new Promise(async resolve => {
		await cm.openConnection()

		let deleteScript = fs.readFileSync('./sql/delete_tables.sql', 'utf8');
		await cm.execSql(deleteScript);

		await cm.closeConnection();
		resolve();
	});
}

describe('Api health test', () => {
	it('should return status 200', (done) => {
		request.get('/api/health')
			.expect(200)
			.end((err, res) => {
				expect(res.body.status).to.equal(200);
				done(err);
			});
	});
});

describe('Users endpoint tests', () => {
	before(async function() {
		this.timeout(0);

		await deleteData();
		await cm.openConnection()
		await cm.execSql('INSERT INTO provider VALUES (\'github\')');
		await cm.closeConnection();
	});

	it('should return 0 users', (done) => {
		request.get('/api/users')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(0);
				done(err);
			});
	});

	let user1AccessToken;
	it('should insert a user with email and password and return their id, username and profile picture', (done) => {
		request.post('/api/users')
			.send({
				email: 'testmail@gmail.com',
				password: 'examplePassword',
				username: 'user1',
				profile_picture: null
			})
			.expect(201)
			.end((err, res) => {
				expect(res.body.id).to.equal(1);
				expect(res.body.username).to.equal('user1');
				expect(res.body.profile_picture).to.equal(null);
				user1AccessToken = res.body.access_token;
				done(err);
			});
	});

	let user2AccessToken;
	it('should insert a user without email and password and return their id, username and profile picture', (done) => {
		request.post('/api/users')
			.send({
				provider: 'github',
				access_token: 'generatedAccessToken:)',
				username: 'user2',
				profile_picture: null
			})
			.expect(201)
			.end((err, res) => {
				expect(res.body.id).to.equal(2);
				expect(res.body.username).to.equal('user2');
				expect(res.body.profile_picture).to.equal(null);
				user2AccessToken = res.body.access_token;
				done(err);
			});
	});

	it('should throw an error trying to insert a user with an used email', (done) => {
		request.post('/api/users')
			.send({
				email: 'testmail@gmail.com',
				password: 'examplePassword',
				username: 'user3',
				profile_picture: null
			})
			.expect(400)
			.end(err => done(err));
	});

	it('should return the user with the id 1 and user name "user1"', (done) => {
		request.get('/api/users/1')
			.expect(200)
			.end((err, res) => {
				expect(res.body.id).to.equal(1);
				expect(res.body.username).to.equal('user1');
				expect(res.body.profile_picture).to.equal(null);
				done(err);
			});
	});

	it('should change the data from user with id 1', (done) => {
		request.put('/api/users/1')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				email: 'newtestmail@gmail.com',
				password: 'newExamplePassword',
				username: 'newuser1',
				profile_picture: null
			})
			.expect(200)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to update an user without token', (done) => {
		request.put('/api/users/3')
			.send({
				email: 'newtestmail2@gmail.com',
				password: 'newExamplePassword',
				username: 'newuser3',
				profile_picture: null
			})
			.expect(401)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to update the user with id 2 because the email already exists', (done) => {
		request.put('/api/users/2')
			.set('Authorization', 'Bearer ' + user2AccessToken)
			.send({
				email: 'newtestmail@gmail.com',
				password: 'newExamplePassword',
				username: 'newuser2',
				profile_picture: null
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should return the user with id 1, now with the username equals to "newuser1"', (done) => {
		request.get('/api/users/1')
			.expect(200)
			.end((err, res) => {
				expect(res.body.id).to.equal(1);
				expect(res.body.username).to.equal('newuser1');
				expect(res.body.profile_picture).to.equal(null);
				done(err);
			});
	});

	it('should throw an error trying to get an nonexistent user id', (done) => {
		request.get('/api/users/3')
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should return 2 users', (done) => {
		request.get('/api/users')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(2);
				done(err);
			});
	});

	it('should delete the user with id 2', (done) => {
		request.delete('/api/users/2')
			.set('Authorization', 'Bearer ' + user2AccessToken)
			.expect(200)
			.end(err => done(err));
	});

	it('should throw an error due to an invalid user token', (done) => {
		request.delete('/api/users/3')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.expect(401)
			.end(err => done(err));
	});

	it('should return 1 user', (done) => {
		request.get('/api/users')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(1);
				done(err);
			});
	});
});

describe('Auth endpoint tests', () => {
	before(async function() {
		this.timeout(0);

		await cm.openConnection();
		await cm.execSql('exec sp_register_user_media \'github\', \'generatedAccessToken:)\', -1, \'user3\'');
		await cm.closeConnection();
	});

	let user1AccessToken;
	it('should login the "newuser1"', (done) => {
		request.post('/api/auth/login')
			.send({
				email: 'newtestmail@gmail.com',
				password: 'newExamplePassword'
			})
			.expect(200)
			.end((err, res) => {
				expect(res.body.id).to.equal(1);
				expect(res.body.username).to.equal('newuser1');
				expect(res.body.profile_picture).to.equal(null);
				user1AccessToken = res.body.access_token;
				done(err);
			});
	});

	it('should not login with email and password and throw an error', (done) => {
		request.post('/api/auth/login')
			.send({
				email: 'newtestmail@gmail.com',
				password: 'randomPassword'
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should login the "user3"', (done) => {
		request.post('/api/auth/login')
			.send({
				provider: 'github',
				access_token: 'generatedAccessToken:)'
			})
			.expect(200)
			.end((err, res) => {
				expect(res.body.id).to.equal(3);
				expect(res.body.username).to.equal('user3');
				expect(res.body.profile_picture).to.equal(null);
				done(err);
			});
	});

	it('should not login with provider and access token and throw an error', (done) => {
		request.post('/api/auth/login')
			.send({
				provider: 'github',
				access_token: 'wrongGeneratedAccessToken:('
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should logoff the user 1', (done) => {
		request.post('/api/auth/logoff')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				id: 1
			})
			.expect(200)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to logoff user 3', (done) => {
		request.post('/api/auth/logoff')
			.set('Authorization', 'Bearer ' + 'randomToken')
			.send({
				id: 3
			})
			.expect(401)
			.end((err, res) => done(err));
	});
});

describe('User notifications tests', () => {
	before(async function() {
		this.timeout(0);

		await cm.openConnection();
		await cm.execSql('INSERT INTO notification VALUES (1, \'Notification 1\', \'08-20-2018 12:15:00\', 0)');
		await cm.execSql('INSERT INTO notification VALUES (1, \'Notification 2\', \'09-20-2018 12:15:00\', 1)');
		await cm.closeConnection();
	});

	let user1AccessToken;
	it('should get the user1 access token', (done) => {
		request.post('/api/auth/login')
			.send({
				email: 'newtestmail@gmail.com',
				password: 'newExamplePassword'
			})
			.expect(200)
			.end((err, res) => {
				user1AccessToken = res.body.access_token;
				done(err);
			});
	});

	it('should return only 1 unreaden notification', (done) => {
		request.get('/api/users/1/notifications/unreaden')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.expect(200)
			.end((err, res) => {
				expect(res.body.amount).to.equal(1);
				expect()
				done(err);
			});
	});

	it('should return the 2 notifications', (done) => {
		request.get('/api/users/1/notifications')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(2);
				expect()
				done(err);
			});
	});

	it('should return no unreaden notifications', (done) => {
		request.get('/api/users/1/notifications/unreaden')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.expect(200)
			.end((err, res) => {
				expect(res.body.amount).to.equal(0);
				expect()
				done(err);
			});
	});
});

describe('User messages tests', () => {
	before(async function() {
		this.timeout(0);

		await cm.openConnection()
		await cm.execSql('INSERT INTO area VALUES (\'Exatas\')');
		await cm.execSql('INSERT INTO post VALUES (2, \'a\', \'b\', \'08-20-2018 12:15:00\', 1)');
		await cm.closeConnection();
	});

	it('should return 0 (this user has no messages)', (done) => {
		request.get('/api/users/1/messages')
			.expect(200)
			.end((err, res) => {
				expect(res.body.count).to.equal(0);
				done(err);
			});
	});

	it('should return 1 (this user has one message)', (done) => {
		request.get('/api/users/2/messages')
			.expect(200)
			.end((err, res) => {
				expect(res.body.count).to.equal(1);
				done(err);
			});
	});
});

describe('Posts endpoint tests', () => {
	before(async function() {
		this.timeout(0);

		await deleteData();
		await cm.openConnection();
		await cm.execSql('DBCC CHECKIDENT(\'user\', RESEED, 0)');
		await cm.execSql('DBCC CHECKIDENT(\'area\', RESEED, 0)');
		await cm.execSql('DBCC CHECKIDENT(\'post\', RESEED, 0)');
		await cm.execSql('exec sp_register_user \'email@gmail.com\', \'' + sha256('password') + '\', \'user1\'');
		await cm.execSql('INSERT INTO area VALUES (\'Valid Area 1\')');
		await cm.execSql('INSERT INTO area VALUES (\'Valid Area 2\')');
		await cm.closeConnection();
	});

	let user1AccessToken;
	it('should get the user1 access token', (done) => {
		request.post('/api/auth/login')
			.send({
				email: 'email@gmail.com',
				password: 'password'
			})
			.expect(200)
			.end((err, res) => {
				user1AccessToken = res.body.access_token;
				done(err);
			});
	});

	it('should return 0 posts', (done) => {
		request.get('/api/posts')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(0);
				done(err);
			});
	});

	it('should create a post with the area "Valid Area 1" and return its id and its area_id', (done) => {
		request.post('/api/posts')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				user_id: 1,
				title: 'post title 1',
				message: 'post message',
				area: 'Valid Area 1'
			})
			.expect(201)
			.end((err, res) => {
				expect(res.body.id).to.equal(1);
				expect(res.body.area_id).to.equal(1);
				done(err);
			});
	});

	it('should create a post with the area "Valid Area 2" and return its id and its area_id', (done) => {
		request.post('/api/posts')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				user_id: 1,
				title: 'post title 2',
				message: 'post message',
				area: 'Valid Area 2'
			})
			.expect(201)
			.end((err, res) => {
				expect(res.body.id).to.equal(2);
				expect(res.body.area_id).to.equal(2);
				done(err);
			});
	});

	it('should throw an error trying to create a post with an invalid area', (done) => {
		request.post('/api/posts')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				user_id: 1,
				title: 'post title',
				message: 'post message',
				area: 'invalid area'
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to create a with an invalid user token', (done) => {
		request.post('/api/posts')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				user_id: 2,
				title: 'post title',
				message: 'post message',
				area: 'Valid Area 1'
			})
			.expect(401)
			.end((err, res) => done(err));
	});

	it('should return 2 posts', (done) => {
		request.get('/api/posts')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(2);
				done(err);
			});
	});

	it('should return the post with id 1, which have title "post title 1"', (done) => {
		request.get('/api/posts/1')
			.expect(200)
			.end((err, res) => {
				expect(res.body.id).to.equal(1);
				expect(res.body.title).to.equal('post title 1');
				done(err);
			});
	});

	it('should update the post title of post with id 1 to "new post title"', (done) => {
		request.put('/api/posts/1')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				title: 'new post title',
				message: 'new post message',
				area: 'Valid Area 1'
			})
			.expect(200)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to update a post to an invalid area', (done) => {
		request.put('/api/posts/1')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				title: 'post title',
				message: 'post message',
				area: 'invalid area'
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to update an invalid post', (done) => {
		request.put('/api/posts/3')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				title: 'new post title',
				message: 'new post message',
				area: 'Valid Area 1'
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to update with an invalid token', (done) => {
		request.put('/api/posts/1')
			.set('Authorization', 'Bearer invalidToken')
			.send({
				title: 'new post title',
				message: 'new post message',
				area: 'Valid Area 1'
			})
			.expect(401)
			.end((err, res) => done(err));
	});

	it('should return the post with id 1, which now have title "new post title"', (done) => {
		request.get('/api/posts/1')
			.expect(200)
			.end((err, res) => {
				expect(res.body.id).to.equal(1);
				expect(res.body.title).to.equal('new post title');
				done(err);
			});
	});

	it('should throw an error trying to get an invalid post', (done) => {
		request.get('/api/posts/3')
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should delete the post with id 1', (done) => {
		request.delete('/api/posts/1')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.expect(200)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to delete an invalid post', (done) => {
		request.delete('/api/posts/1')
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to delete with an invalid token', (done) => {
		request.delete('/api/posts/2')
			.set('Authorization', 'Bearer invalidToken')
			.expect(401)
			.end((err, res) => done(err));
	});

	it('should return 1 post', (done) => {
		request.get('/api/posts')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(1);
				done(err);
			});
	});

	it('should return 0 posts in the second page of posts', (done) => {
		request.get('/api/posts')
			.send({
				page: 1,
			})
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(0);
				done(err);
			});
	});
});

describe('Post views tests', () => {
	before(async function() {
		this.timeout(0);

		await cm.openConnection();
		await cm.execSql('exec sp_post_create 1, \'post title\', \'post message\', \'Valid Area 1\'');
		await cm.execSql('INSERT INTO post_view values (3, 1)');
		await cm.closeConnection();
	});

	it('should throw an error trying to access the views number of an nonexistent post', (done) => {
		request.get('/api/posts/4/views')
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should return 0 views in the post 2', (done) => {
		request.get('/api/posts/2/views')
			.expect(200)
			.end((err, res) => {
				expect(res.body.views).to.equal(0);
				done(err);
			});
	});

	it('should return 1 view in the post 3', (done) => {
		request.get('/api/posts/3/views')
			.expect(200)
			.end((err, res) => {
				expect(res.body.views).to.equal(1);
				done(err);
			});
	});
});

describe('Post tags tests', () => {
	before(async function() {
		this.timeout(0);

		await cm.openConnection();
		await cm.execSql('INSERT INTO tag values (\'Tag 1\')');
		await cm.execSql('INSERT INTO tag values (\'Tag 2\')');
		await cm.execSql('INSERT INTO tag values (\'Tag 3\')');
		await cm.closeConnection();
	});

	let user1AccessToken;
	it('should get the user1 access token', (done) => {
		request.post('/api/auth/login')
			.send({
				email: 'email@gmail.com',
				password: 'password'
			})
			.expect(200)
			.end((err, res) => {
				user1AccessToken = res.body.access_token;
				done(err);
			});
	});

	it('should throw an error trying to access the tags of a nonexistent post', (done) => {
		request.get('/api/posts/4/tags')
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should return 0 tags in the post 2', (done) => {
		request.get('/api/posts/2/tags')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(0);
				done(err);
			});
	});

	it('should throw an error trying to add a tag in a nonexistent post', (done) => {
		request.post('/api/posts/4/tags')
			.send({
				tags: 'Tag 1'
			})
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to add a tag with an invalid token', (done) => {
		request.post('/api/posts/2/tags')
			.send({
				tags: 'Tag 1'
			})
			.set('Authorization', 'Bearer invalidToken')
			.expect(401)
			.end((err, res) => done(err));
	});

	it('should add the tags "Tag 1", "Tag 2" and "Tag 3" in post 2', (done) => {
		request.post('/api/posts/2/tags')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				tags: [
					'Tag 1',
					'Tag 2',
					'Tag 3'
				]
			})
			.expect(201)
			.end((err, res) => done(err));
	});

	it('should add the tag "Tag 3" post 3', (done) => {
		request.post('/api/posts/3/tags')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				tags: 'Tag 3'
			})
			.expect(201)
			.end((err, res) => done(err));
	});

	it('should return 3 tags in the post 2', (done) => {
		request.get('/api/posts/2/tags')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(3);
				done(err);
			});
	});

	it('should return 1 tag in the post 3', (done) => {
		request.get('/api/posts/3/tags')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(1);
				done(err);
			});
	});

	it('should delete the tags "Tag 1" and "Tag 2" in post 2', (done) => {
		request.delete('/api/posts/2/tags')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				tags: [
					'Tag 1',
					'Tag 2'
				]
			})
			.expect(200)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to delete a tag with an invalid token', (done) => {
		request.post('/api/posts/3/tags')
			.send({
				tags: 'Tag 3'
			})
			.set('Authorization', 'Bearer invalidToken')
			.expect(401)
			.end((err, res) => done(err));
	});

	it('should delete the tag "Tag 3" in post 3', (done) => {
		request.delete('/api/posts/3/tags')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				tags: 'Tag 3'
			})
			.expect(200)
			.end((err, res) => done(err));
	});

	it('should return 1 tag in the post 2 and it must be "Tag 3"', (done) => {
		request.get('/api/posts/2/tags')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(1);
				expect(res.body[0]).to.equal('Tag 3');
				done(err);
			});
	});
});

describe('Post messages tests', () => {
	before(async function() {
		this.timeout(0);

		await deleteData();
		await cm.openConnection();
		await cm.execSql('DBCC CHECKIDENT(\'user\', RESEED, 0)');
		await cm.execSql('DBCC CHECKIDENT(\'area\', RESEED, 0)');
		await cm.execSql('DBCC CHECKIDENT(\'post\', RESEED, 0)');
		await cm.execSql('exec sp_register_user \'email@gmail.com\', \'' + sha256('password') + '\', \'user1\'');
		await cm.execSql('INSERT INTO area VALUES (\'Valid Area 1\')');
		await cm.execSql('INSERT INTO post VALUES (1, \'a\', \'b\', \'08-20-2018 12:15:00\', 1)');
		await cm.execSql('INSERT INTO post VALUES (1, \'a\', \'b\', \'08-20-2018 12:15:00\', 1)');
		await cm.execSql('INSERT INTO comment VALUES (2, 1, \'a\', \'08-20-2018 12:15:00\')');
		await cm.closeConnection();
	});

	let user1AccessToken;
	it('should get the user1 access token', (done) => {
		request.post('/api/auth/login')
			.send({
				email: 'email@gmail.com',
				password: 'password'
			})
			.expect(200)
			.end((err, res) => {
				user1AccessToken = res.body.access_token;
				done(err);
			});
	});

	it('should return 0 comments in post 1', (done) => {
		request.get('/api/posts/1/comments')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(0);
				done(err);
			});
	});

	it('should return 1 comments in post 2', (done) => {
		request.get('/api/posts/2/comments')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(1);
				expect(res.body[0].id).to.equal(1);
				done(err);
			});
	});

	it('should throw an error trying to get the comments of a nonexistent post', (done) => {
		request.get('/api/posts/3/comments')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to get the comments with an invalid token', (done) => {
		request.get('/api/posts/2/comments')
			.set('Authorization', 'Bearer invalidToken')
			.expect(401)
			.end((err, res) => done(err));
	});
});

describe('Tags endpoint tests', () => {
	before(async function() {
		this.timeout(0);

		await deleteData();
		await cm.openConnection();
		await cm.execSql('DBCC CHECKIDENT(\'user\', RESEED, 0)');
		await cm.execSql('DBCC CHECKIDENT(\'area\', RESEED, 0)');
		await cm.execSql('DBCC CHECKIDENT(\'post\', RESEED, 0)');
		await cm.execSql('DBCC CHECKIDENT(\'tag\', RESEED, 0)');
		await cm.closeConnection();
	});

	it('should return 0 tags', (done) => {
		request.get('/api/tags/')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(0);
				done(err);
			});
	});

	it('should create a tag with name "Tag 1"', (done) => {
		request.post('/api/tags/')
			.send({
				name: 'Tag 1'
			})
			.expect(201)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to create a tag with an existing name', (done) => {
		request.post('/api/tags/')
			.send({
				name: 'tag 1'
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should return the tag with id 1, which has name "Tag 1"', (done) => {
		request.get('/api/tags/1')
			.expect(200)
			.end((err, res) => {
				expect(res.body.id).to.equal(1);
				expect(res.body.name).to.equal("Tag 1");
				done(err);
			});
	});

	it('should throw an error trying to get an invalid tag', (done) => {
		request.get('/api/tags/2')
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should return 1 tag', (done) => {
		request.get('/api/tags')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(1);
				done(err)
			});
	});
});

describe('Areas endpoint tests', () => {
	before(async function() {
		this.timeout(0);

		await cm.openConnection();
		await cm.execSql('INSERT INTO area VALUES (\'Area 1\')');
		await cm.closeConnection();
	});

	it('should return 1 area', (done) => {
		request.get('/api/areas/')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(1);
				done(err);
			});
	});

	it('should return the area with id 1, which has name "Area 1"', (done) => {
		request.get('/api/areas/1')
			.expect(200)
			.end((err, res) => {
				expect(res.body.id).to.equal(1);
				expect(res.body.name).to.equal("Area 1");
				done(err);
			});
	});

	it('should throw an error trying to get an invalid area', (done) => {
		request.get('/api/areas/2')
			.expect(400)
			.end((err, res) => done(err));
	});
});

describe('Comments endpoint tests', () => {
	before(async function() {
		this.timeout(0);

		await deleteData();
		await cm.openConnection();
		await cm.execSql('DBCC CHECKIDENT(\'area\', RESEED, 0)');
		await cm.execSql('DBCC CHECKIDENT(\'comment\', RESEED, 0)');
		await cm.execSql('exec sp_register_user \'email@gmail.com\', \'' + sha256('password') + '\', \'user1\'');
		await cm.execSql('INSERT INTO area VALUES (\'Area 1\')');
		await cm.execSql('INSERT INTO post VALUES (1, \'a\', \'b\', \'08-20-2018 12:15:00\', 1)');
		await cm.closeConnection();
	});

	let user1AccessToken;
	it('should get the user1 access token', (done) => {
		request.post('/api/auth/login')
			.send({
				email: 'email@gmail.com',
				password: 'password'
			})
			.expect(200)
			.end((err, res) => {
				user1AccessToken = res.body.access_token;
				done(err);
			});
	});

	it('should return 0 comments', (done) => {
		request.get('/api/comments/')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(0);
				done(err);
			});
	});

	it('should create a comment with message "test message"', (done) => {
		request.post('/api/comments/')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				post_id: 1,
				user_id: 1,
				message: 'test message'
			})
			.expect(201)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to add with an invalid token', (done) => {
		request.post('/api/comments/')
			.set('Authorization', 'Bearer invalidToken')
			.send({
				post_id: 1,
				user_id: 1,
				message: 'test message'
			})
			.expect(401)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to add to a nonexistent post', (done) => {
		request.post('/api/comments/')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				post_id: 2,
				user_id: 1,
				message: 'test message'
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to add a comment from a nonexistent user', (done) => {
		request.post('/api/comments/')
			.set('Authorization', 'Bearer invalidToken')
			.send({
				post_id: 1,
				user_id: 2,
				message: 'test message'
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should return 1 comment', (done) => {
		request.get('/api/comments/')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(1);
				done(err);
			});
	});

	it('should change the comment 1 message to "new test message"', (done) => {
		request.put('/api/comments/1')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.send({
				message: 'new test message'
			})
			.expect(200)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to update with invalid token', (done) => {
		request.put('/api/comments/1')
			.set('Authorization', 'Bearer invalidToken')
			.send({
				message: 'new test message'
			})
			.expect(401)
			.end((err, res) => done(err));
	});

	it('should return the comment 1 with "new test message"', (done) => {
		request.get('/api/comments/1')
			.expect(200)
			.end((err, res) => {
				expect(res.body.message).to.equal('new test message');
				done(err);
			});
	});

	it('should throw an error trying to get a nonexistent comment', (done) => {
		request.get('/api/comments/2')
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to delete with an invalid token', (done) => {
		request.delete('/api/comments/1')
			.set('Authorization', 'Bearer invalidToken')
			.expect(401)
			.end((err, res) => done(err));
	});

	it('should delete the comment 1', (done) => {
		request.delete('/api/comments/1')
			.set('Authorization', 'Bearer ' + user1AccessToken)
			.expect(200)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to delete a nonexistent comment', (done) => {
		request.delete('/api/comments/2')
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should return 0 comments again', (done) => {
		request.get('/api/comments/')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(0);
				done(err);
			});
	});
});

describe('Courses endpoint tests', () => {
	it('should return 0 courses', (done) => {
		request.get('/api/courses/')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(0);
				done(err);
			});
	});

	it('should create a course with name "Course 1"', (done) => {
		request.post('/api/courses/')
			.send({
				name: 'Course 1',
				shortname: 'course1',
				description: 'A nice course',
				area: 'Area 1'
			})
			.expect(201)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to create a course of a nonexisting area', (done) => {
		request.post('/api/courses/')
			.send({
				name: 'Course 2',
				shortname: 'course2',
				description: 'A nice course',
				area: 'Area 2'
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should return the course with id 1, which has name "Course 1"', (done) => {
		request.get('/api/courses/1')
			.expect(200)
			.end((err, res) => {
				expect(res.body.id).to.equal(1);
				expect(res.body.name).to.equal("Course 1");
				done(err);
			});
	});

	it('should throw an error trying to get an invalid course', (done) => {
		request.get('/api/courses/2')
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should return 1 course', (done) => {
		request.get('/api/courses')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(1);
				done(err)
			});
	});
});

after(function() {
	this.timeout(0);
	return cm.deleteContainer();
});
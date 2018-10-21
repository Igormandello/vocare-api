const fs = require('fs');
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
				done(err);
			});
	});

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
			.send({
				email: 'newtestmail@gmail.com',
				password: 'newExamplePassword',
				username: 'newuser1',
				profile_picture: null
			})
			.expect(200)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to update the user with id 2 because the email already exists', (done) => {
		request.put('/api/users/2')
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

	it('should login the "newuser1"', (done) => {
		request.get('/api/users/login')
			.send({
				email: 'newtestmail@gmail.com',
				password: 'newExamplePassword'
			})
			.expect(200)
			.end((err, res) => {
				expect(res.body.id).to.equal(1);
				expect(res.body.username).to.equal('newuser1');
				expect(res.body.profile_picture).to.equal(null);
				done(err);
			});
	});

	it('should not login with email and password and throw an error', (done) => {
		request.get('/api/users/login')
			.send({
				email: 'newtestmail@gmail.com',
				password: 'randomPassword'
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should login the "user2"', (done) => {
		request.get('/api/users/login')
			.send({
				provider: 'github',
				access_token: 'generatedAccessToken:)'
			})
			.expect(200)
			.end((err, res) => {
				expect(res.body.id).to.equal(2);
				expect(res.body.username).to.equal('user2');
				expect(res.body.profile_picture).to.equal(null);
				done(err);
			});
	});

	it('should not login with provider and access token and throw an error', (done) => {
		request.get('/api/users/login')
			.send({
				provider: 'github',
				access_token: 'wrongGeneratedAccessToken:('
			})
			.expect(400)
			.end((err, res) => done(err));
	});

	it('should delete the user with id 2', (done) => {
		request.delete('/api/users/2')
			.expect(200)
			.end(err => done(err));
	});

	it('should throw an error due to a invalid user id', (done) => {
		request.delete('/api/users/3')
			.expect(400)
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
		await cm.execSql('exec sp_register_user \'email@gmail.com\', \'password\', \'user1\'');
		await cm.execSql('INSERT INTO area VALUES (\'Valid Area 1\')');
		await cm.execSql('INSERT INTO area VALUES (\'Valid Area 2\')');
		await cm.closeConnection();
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
			.send({
				user_id: 1,
				title: 'post title',
				message: 'post message',
				area: 'invalid area'
			})
			.expect(400)
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
			.send({
				title: 'new post title',
				message: 'new post message',
				area: 'Valid Area 1'
			})
			.expect(400)
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
			.expect(200)
			.end((err, res) => done(err));
	});

	it('should throw an error trying to delete an invalid post', (done) => {
		request.delete('/api/posts/1')
			.expect(400)
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
		await cm.execSql('INSERT INTO post_view values (2, 1)');
		await cm.closeConnection();
	});

	it('should throw an error trying to access the views number of an unexistent post', (done) => {
		request.get('/api/posts/3/views')
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
				expect(res.body.views).to.equal(0);
				done(err);
			});
	});
});

after(function() {
	this.timeout(0);
	return cm.deleteContainer();
});
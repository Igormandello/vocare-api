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

beforeEach(async function() {
	this.timeout(0);

	await cm.openConnection()

	let deleteScript = fs.readFileSync('./sql/delete_tables.sql', 'utf8');
	await cm.execSql(deleteScript);
	
	await cm.closeConnection();
})

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

	it('should throw an error trying to insert a user with a used email', (done) => {
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

	it('should return 2 users', (done) => {
		request.get('/api/users')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(2);
				done(err);
			});
	});

	it('should delete an user', (done) => {
		request.delete('/api/users')
			.send({
				id: 2
			})
			.expect(200)
			.end(err => done(err));
	});

	it('should throw an error due to a invalid user id', (done) => {
		request.delete('/api/users')
			.send({
				id: 3
			})
			.expect(400)
			.end(err => done(err));
	});

	it('should return 1 users', (done) => {
		request.get('/api/users')
			.expect(200)
			.end((err, res) => {
				expect(res.body.length).to.equal(1);
				done(err);
			});
	});
})

after(function() {
	this.timeout(0);
	return cm.deleteContainer();
});
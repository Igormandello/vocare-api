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
	
	run();
});

beforeEach(() => {
	let deleteScript = fs.readFileSync('./sql/delete_tables.sql', 'utf8');
	return cm.execSql(deleteScript);
})

describe('Api health tests', () => {
	it('should return status 200', function (done) {
		request.get('/api/health')
			.expect(200)
			.end((err, res) => {
				expect(res.body.status).to.equal(200);
				done(err);
			});
	});
});

after(function() {
	this.timeout(0);
	return cm.deleteContainer();
});

const fs = require('fs');
const ContainerManager = require('./ContainerManager');

let cm = new ContainerManager();
cm.createContainer().then(async () => {
	console.log('\nCreating tables...');
	let sqlScript = fs.readFileSync('./sql/bd.sql', 'utf8');
	await cm.execSql(sqlScript);
	console.log('Tables created');

	console.log('\nSetting foreign keys...');
	sqlScript = fs.readFileSync('./sql/foreign_keys.sql', 'utf8');
	await cm.execSql(sqlScript);
	console.log('Foreign keys created');

	//console.log('\nInserting default data...');
	//sqlScript = fs.readFileSync('./sql/hard_data.sql', 'utf8');
	//await cm.execSql(sqlScript);

	console.log('\nCreating stored procedures...');
	sqlScript = fs.readFileSync('./sql/stored_procedures.sql', 'utf8');
	sqlScript = sqlScript.split('GO');

	let procedures = [];
	for (let i = 0; i < sqlScript.length; i++)
		procedures.push(cm.execSql(sqlScript[i]));

	await Promise.all(procedures);
	console.log('Foreign keys created');
	
	run();
});

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

after(() => {
	return cm.deleteContainer()
});

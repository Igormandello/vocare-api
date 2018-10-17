const ContainerManager = require('./ContainerManager');

let cm = new ContainerManager();
cm.createContainer().then(() => run());

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

after(async () => {
	await cm.deleteContainer();
});
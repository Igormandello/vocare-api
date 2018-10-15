var assert = require('assert');

describe('Api health tests', () => {
	it('should return status 200', function (done) {
		request.get('/api/health')
			.expect(200)
			.end((err, res) => {
				expect(res.body.status).to.assert(200);
				done(err);
			});
	});
});
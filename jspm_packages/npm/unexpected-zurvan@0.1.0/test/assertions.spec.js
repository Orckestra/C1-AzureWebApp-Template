var zurvan = require('zurvan');
var expect = require('unexpected').use(require('../index.js'));

function timePromise(wait) {
	return new Promise(function (resolve) {
		setTimeout(resolve, wait);
	});
};

function timedTrue(wait) {
	return timePromise(wait).then(function () { return true });
}

function readDirPromise() {
	return new Promise(function(resolve, reject) {
		require('fs').readdir('.', function (err, res) {
			if (err) {
				reject(err);
			} else {
				resolve(res);
			}
		});
	});
}

function asyncSandwich(wait) {
	return readDirPromise()
	.then(function () { return timePromise(wait); })
	.then(function () { return readDirPromise(); });
}

describe('Assertions', function () {
	describe('"when waiting for <num>"', function () {
		it('fails when zurvan is not intercepting', function () {
			return expect(function () {
				return expect(timedTrue,
					'when called with', [10000],
					'while waiting for', 12000,
					'when fulfilled', 'to be true');
			},
			'to be rejected with', 'Cannot advance time if timers are not intercepted by this instance of zurvan');
		});

		describe('when intercepting', function () {
			beforeEach(function () {
				return zurvan.interceptTimers();
			});
			afterEach(function () {
				return zurvan.releaseTimers();
			});

			it('fakes a wait for the given time span', function () {
				return expect(timedTrue,
					'when called with', [10000],
					'while waiting for', 12000,
					'when fulfilled', 'to be true');
			});


			it('handles timeouts between async functions', function () {
				return expect(asyncSandwich,
					'when called with', [10000],
					'while waiting for', 12000,
					'when fulfilled', 'to be an array');
			});

			it('can finish an expect chain', function () {
				return expect(asyncSandwich,
					'when called with', [10000],
					'while waiting for', 12000)
				.then(function (result) {
					return expect(result, 'to be an array');
				});
			});
		});
	});

	describe('"then wait for <num>"', function () {
		it('fails when zurvan is not intercepting', function () {
			return expect(function () {
				return expect(timePromise,
					'when called with', [10000],
					'then wait for', 12000,
					'to be fulfilled');
			},
			'to be rejected with', 'Cannot advance time if timers are not intercepted by this instance of zurvan');
		});

		describe('when intercepting', function () {
			beforeEach(function () {
				return zurvan.interceptTimers();
			});
			afterEach(function () {
				return zurvan.releaseTimers();
			});

			it('fakes a wait for the given time span', function () {
				return expect(timePromise,
					'when called with', [10000],
					'then wait for', 12000,
					'to be fulfilled');
			});

			it('can finish an expect chain', function () {
				return expect(timedTrue,
					'when called with', [10000],
					'then wait for', 12000)
				.then(function (result) {
					return expect(result, 'to be true');
				});
			});
		});
	});
});

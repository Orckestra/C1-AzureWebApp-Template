var zurvan = require('zurvan');

module.exports = {
	name: 'unexpected-zurvan',
	installInto: function (expect) {
		expect.addAssertion('<any> while waiting for <number> <assertion?>', function (expect, subject, wait) {
			var expectArgs = Array.prototype.slice.call(arguments, 3);
			expectArgs.unshift(subject);
			return expect.promise.all([expect.apply(null, expectArgs), zurvan.advanceTime(wait)])
		});

		expect.addAssertion('<any> then wait for <number> <assertion?>', function (expect, subject, wait) {
			var expectArgs = Array.prototype.slice.call(arguments, 3);
			expectArgs.unshift(subject);
			return zurvan.advanceTime(wait).then(function () {
				return expect.apply(null, expectArgs);
			});
		});
	}
}

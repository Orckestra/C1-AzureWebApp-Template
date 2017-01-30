'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var expect = _unexpected2['default'].clone();

expect.addAssertion('<string> withError synchronously returns a promise <assertion>', function (expect, subject, assertion) {
    var result = expect.withError(function () {
        return assertion(subject);
    }, function (e) {});

    expect.errorMode = 'bubble';
    expect(result, 'to be a', 'Promise');
});

describe('withError', function () {

    it('returns a promise', function () {
        expect('hello', 'withError synchronously returns a promise', expect.it('to equal', 'hello'));
    });

    it('has a promise.resolve', function () {
        expect(expect.promise.resolve, 'to be a', 'function');
    });
});
//# sourceMappingURL=withErrorLearning.spec.js.map
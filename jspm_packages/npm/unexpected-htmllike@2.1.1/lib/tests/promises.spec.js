'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var expect = _unexpected2['default'].clone();

describe('promises', function () {

    it('expect.promise.resolve is immediately resolved', function () {

        var promise = expect.promise.resolve(42);
        expect(promise.isFulfilled(), 'to be true');
    });

    it('expect.promise, then resolve() is immediately resolved', function () {

        var promise = expect.promise(function (resolve, reject) {
            resolve(42);
        });
        expect(promise.isFulfilled(), 'to be true');
    });

    it('expect.promise.all with resolved promises is immediately resolved', function () {

        var promise = expect.promise.resolve(42);
        var promise2 = expect.promise.resolve(24);
        var all = expect.promise.all([promise, promise2]);

        expect(all.isFulfilled(), 'to be true');
    });

    it('resolved promise with a then is immediately resolved', function () {
        // This is it. Need to break the promises to be sync
        var promise = expect.promise.resolve(42).then(function (result) {
            return result + 1;
        });

        // expect(promise.isFulfilled(), 'to be true');
    });
});
//# sourceMappingURL=promises.spec.js.map
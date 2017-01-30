'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _arrayChanges = require('array-changes');

var _arrayChanges2 = _interopRequireDefault(_arrayChanges);

var _arrayChangesAsync = require('array-changes-async');

var _arrayChangesAsync2 = _interopRequireDefault(_arrayChangesAsync);

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var expect = _unexpected2['default'].clone();

var ArrayChangesPromise = function ArrayChangesPromise(a, b, equal, similar) {
    return expect.promise(function (resolve, reject) {
        (0, _arrayChangesAsync2['default'])(a, b, equal, similar, function (changes) {
            resolve(changes);
        });
    });
};

describe.skip('array-changes', function () {
    describe('async', function () {

        it('returns an insert and delete for non-similar entries', function () {
            return expect(ArrayChangesPromise([1, 2, 3], [100, 300, 500], function (a, b, aIndex, bIndex, callback) {
                callback(a * 100 === b);
            }, function (a, b, aIndex, bIndex, callback) {
                return callback(false);
            }), 'when fulfilled', 'to satisfy', []);
        });
    });

    describe('sync', function () {

        it('returns an insert and delete for non-similar entries', function () {
            return expect((0, _arrayChanges2['default'])([1, 2, 3], [100, 200, 500], function (a, b, aIndex, bIndex, callback) {
                return a * 100 === b;
            }, function (a, b, aIndex, bIndex, callback) {
                return false;
            }), 'to satisfy', []);
        });
    });
});
//# sourceMappingURL=assumptions.spec.js.map
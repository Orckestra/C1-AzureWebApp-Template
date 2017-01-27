'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var _Weights = require('../Weights');

var _Weights2 = _interopRequireDefault(_Weights);

var expect = _unexpected2['default'].clone();

describe('Weights', function () {

    var weights = undefined;

    beforeEach(function () {
        weights = new _Weights2['default']();
    });

    it('initialises to 0', function () {

        expect(weights, 'to satisfy', {
            real: 0,
            total: 0
        });
    });

    describe('add', function () {
        it('adds a weight to both', function () {

            weights.add(10);
            expect(weights, 'to satisfy', {
                real: 10,
                total: 10
            });
        });
    });

    describe('addReal', function () {

        it('adds a weight to the real weight, not the all weight', function () {

            weights.addReal(10);
            expect(weights, 'to satisfy', {
                real: 10,
                total: 0
            });
        });
    });

    describe('addTotal', function () {

        it('adds a weight to the total weight, not the real weight', function () {

            weights.addTotal(10);
            expect(weights, 'to satisfy', {
                real: 0,
                total: 10
            });
        });
    });

    describe('addWeight', function () {

        it('adds a second weight to the initial weight', function () {
            weights.addReal(4);
            weights.addTotal(8);
            weights.addWeight(new _Weights2['default']().addReal(16).addTotal(32));
            expect(weights, 'to satisfy', {
                real: 20,
                total: 40
            });
        });
    });
});
//# sourceMappingURL=Weights.spec.js.map
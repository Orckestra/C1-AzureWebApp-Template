'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var expectedSymbol = Symbol('expected');
var actualSymbol = Symbol('actual');

var TestExpectedAdapter = {

    _checkValidComponentPassed: function _checkValidComponentPassed(comp) {
        if (comp.$expected !== expectedSymbol) {
            throw new Error('Non-expected type passed to expected adapter:' + JSON.stringify(comp));
        }
    },

    getName: function getName(comp) {
        this._checkValidComponentPassed(comp);
        return comp.name;
    },

    getAttributes: function getAttributes(comp) {
        this._checkValidComponentPassed(comp);
        return comp.attribs;
    },

    _wrapChild: function _wrapChild(child) {
        return createExpected(child);
    },

    getChildren: function getChildren(comp) {
        var _this = this;

        this._checkValidComponentPassed(comp);
        return (comp.children && [].concat([], comp.children) || []).map(function (item) {
            return typeof item === 'object' ? _this._wrapChild(item) : item;
        });
    },

    classAttributeName: 'className'
};

var TestActualAdapter = Object.create(TestExpectedAdapter);

TestActualAdapter._checkValidComponentPassed = function (comp) {
    if (comp.$actual !== actualSymbol) {
        throw new Error('Non-actual type passed to actual adapter:' + JSON.stringify(comp) + ' expectedSymbol was ' + (comp.$expected && comp.$expected.toString()));
    }
};

TestActualAdapter._wrapChild = function (child) {
    return createActual(child);
};

var createActual = function createActual(desc) {
    desc.$actual = actualSymbol;
    return desc;
};

var createExpected = function createExpected(desc) {
    desc.$expected = expectedSymbol;
    return desc;
};

exports.expectedSymbol = expectedSymbol;
exports.actualSymbol = actualSymbol;
exports.TestExpectedAdapter = TestExpectedAdapter;
exports.TestActualAdapter = TestActualAdapter;
exports.createActual = createActual;
exports.createExpected = createExpected;
//# sourceMappingURL=mockEntities.js.map
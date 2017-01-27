'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var _contains = require('../contains');

var _contains2 = _interopRequireDefault(_contains);

var _diff = require('../diff');

var _diff2 = _interopRequireDefault(_diff);

var _mockEntities = require('./mockEntities');

var expect = _unexpected2['default'].clone();

function getContains(actual, expected, options) {
    return (0, _contains2['default'])(_mockEntities.TestActualAdapter, _mockEntities.TestExpectedAdapter, actual, expected, expect, options);
}

expect.addType({

    name: 'TestHtmlElement',
    base: 'object',
    identify: function identify(value) {
        return value && typeof value === 'object' && typeof value.name === 'string' && typeof value.attribs === 'object';
    }
});

function shiftResultOrPromise(resultOrPromise, expect) {
    if (resultOrPromise && typeof resultOrPromise.then === 'function') {
        return resultOrPromise.then(function (result) {
            return expect.shift(result);
        });
    }
    expect.shift(resultOrPromise);
}

expect.addAssertion('<TestHtmlElement> when checked to contain <TestHtmlElement> <assertion>', function (expect, subject, value) {

    var containsResult = (0, _contains2['default'])(_mockEntities.TestActualAdapter, _mockEntities.TestExpectedAdapter, subject, value, expect, {});
    return shiftResultOrPromise(containsResult, expect);
});

expect.addAssertion('<TestHtmlElement> when checked with options to contain <object> <TestHtmlElement> <assertion>', function (expect, subject, options, value) {

    var containsResult = (0, _contains2['default'])(_mockEntities.TestActualAdapter, _mockEntities.TestExpectedAdapter, subject, value, expect, options);
    return shiftResultOrPromise(containsResult, expect);
});

expect.addAssertion('<string> to eventually equal <string>', function (expect, subject, value) {
    return expect.promise(function (resolve, reject) {
        setTimeout(function () {
            if (subject === value) {
                resolve();
            } else {
                expect.withError(function () {
                    expect(subject, 'to equal', value);
                }, function (err) {
                    return reject(err);
                });
            }
        }, 50);
    });
});

describe('contains', function () {

    it('finds an exact match', function () {
        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'when checked to contain', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'to satisfy', { found: true });
    });

    it('reports the inspection of the found item', function () {
        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'when checked to contain', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'to satisfy', {
            found: true,
            bestMatch: {
                diff: {
                    type: 'ELEMENT',
                    name: 'span',
                    attributes: [{ name: 'className', value: 'foo' }]
                }
            }
        });
    });

    it('reports not found when no exact match exists', function () {
        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'when checked to contain', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some other content'] }), 'to satisfy', { found: false });
    });

    it('finds an element nested one deep', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: {}, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }]
        }), 'when checked to contain', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'to satisfy', { found: true });
    });

    it('finds a deep nested element', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: {}, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['blah'] }, { name: 'span', attribs: { className: 'foo' }, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }] }, { name: 'span', attribs: { className: 'foo' }, children: ['blubs'] }]
        }), 'when checked to contain', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'to satisfy', { found: true, bestMatch: {
                diff: {
                    type: 'ELEMENT',
                    name: 'span',
                    attributes: [{ name: 'className', value: 'foo' }]
                }
            } });
    });

    it('finds a best match when the content is different', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: {}, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some different content'] }]
        }), 'when checked to contain', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'to satisfy', { found: false, bestMatchItem: {
                name: 'span', attribs: { className: 'foo' }, children: ['some different content']
            } });
    });

    it('finds a best match in an array of children with an extra attribute', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: {}, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }, { name: 'span', attribs: { className: 'bar' }, children: ['some content'] }, { name: 'span', attribs: { className: 'candidate', id: 'abc' }, children: ['some content'] }]
        }), 'when checked to contain', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'candidate' }, children: ['some content'] }), 'to satisfy', { found: false, bestMatchItem: {
                name: 'span', attribs: { className: 'candidate', id: 'abc' }, children: ['some content']
            } });
    });

    it('returns a diff when the content is different', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: {}, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some different content'] }]
        }), 'when checked to contain', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'to satisfy', {
            found: false,
            bestMatch: {
                diff: {
                    type: 'ELEMENT',
                    name: 'span',
                    attributes: [{ name: 'className', value: 'foo' }],
                    children: [{
                        type: 'CONTENT',
                        value: 'some different content',
                        diff: {
                            type: 'changed',
                            expectedValue: 'some content'
                        }
                    }]
                },
                weight: _diff2['default'].DefaultWeights.STRING_CONTENT_MISMATCH
            }
        });
    });

    it('doesn\'t include wrappers in the bestMatchItem around the item that is found', function () {
        var searchItem = {
            name: 'div', attribs: {}, children: [{
                name: 'wrapper', attribs: { className: 'the-wrapper' },
                children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some different content'] }]

            }]
        };

        return expect((0, _mockEntities.createActual)({
            name: 'body', attribs: {}, children: [searchItem]
        }), 'when checked with options to contain', { diffWrappers: false }, (0, _mockEntities.createExpected)({
            name: 'div', attribs: {}, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }]
        }), 'to satisfy', {
            found: false,
            bestMatchItem: searchItem
        });
    });

    it('doesn\'t include wrappers in the bestMatch around the item that is found', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'body', attribs: {}, children: [{
                name: 'div', attribs: {}, children: [{
                    name: 'wrapper', attribs: { className: 'the-wrapper' },
                    children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some different content'] }]

                }]
            }]
        }), 'when checked with options to contain', { diffWrappers: false }, (0, _mockEntities.createExpected)({
            name: 'div', attribs: {}, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }]
        }), 'to satisfy', {
            found: false,
            bestMatch: {
                diff: {
                    type: 'ELEMENT',
                    name: 'div', // Top level in the diff is the div, not the body
                    children: [{
                        type: 'WRAPPERELEMENT',
                        name: 'wrapper'
                    }]
                }
            }
        });
    });

    it('doesn\'t include wrappers in the bestMatch around an item that is found to match', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'body', attribs: {}, children: [{
                name: 'div', attribs: {}, children: [{
                    name: 'wrapper', attribs: { className: 'the-wrapper' },
                    children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }]

                }]
            }]
        }), 'when checked with options to contain', { diffWrappers: false }, (0, _mockEntities.createExpected)({
            name: 'div', attribs: {}, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }]
        }), 'to satisfy', {
            found: true,
            bestMatch: {
                diff: {
                    type: 'ELEMENT',
                    name: 'div', // Top level in the diff is the div, not the body
                    children: [{
                        type: 'WRAPPERELEMENT',
                        name: 'wrapper'
                    }]
                }
            }
        });
    });

    it('finds a nested component with missing children and extra attribute', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'div', attribs: {}, children: [{
                name: 'span',
                attribs: {},
                children: ['one']
            }, {
                name: 'span',
                attribs: { className: 'dummy' },
                children: ['two']
            }, {
                name: 'span',
                attribs: {},
                children: ['three']
            }]
        }), 'when checked with options to contain', { diffExtraChildren: false, diffExtraAttributes: false }, (0, _mockEntities.createExpected)({
            name: 'div', attribs: {}, children: [{
                name: 'span',
                attribs: {},
                children: ['two']
            }]
        }), 'to satisfy', {
            found: true,
            bestMatch: {
                weight: 0
            }
        });
    });

    it('finds a nested component with missing children and extra attribute (async)', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'div', attribs: {}, children: [{
                name: 'span',
                attribs: {},
                children: ['one']
            }, {
                name: 'span',
                attribs: { className: 'dummy' },
                children: ['two']
            }, {
                name: 'span',
                attribs: {},
                children: ['three']
            }]
        }), 'when checked with options to contain', { diffExtraChildren: false, diffExtraAttributes: false }, (0, _mockEntities.createExpected)({
            name: 'div', attribs: {}, children: [{
                name: 'span',
                attribs: {},
                children: [expect.it('to eventually equal', 'two')]
            }]
        }), 'to satisfy', {
            found: true,
            bestMatch: {
                weight: 0
            }
        });
    });

    describe('findTargetAttrib', function () {

        it('finds a target in a simple element', function () {

            var target = (0, _mockEntities.createActual)({
                name: 'span',
                attribs: { id: '123' },
                children: []
            });
            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: {}, children: [{
                    name: 'span',
                    attribs: { id: 'main' },
                    children: [target]
                }]
            }), 'when checked with options to contain', { findTargetAttrib: 'eventTarget', diffExtraAttributes: false }, (0, _mockEntities.createExpected)({
                name: 'span',
                attribs: {},
                children: [{ name: 'span', attribs: { eventTarget: true }, children: [] }]
            }), 'to satisfy', {
                found: true,
                bestMatch: {
                    diff: {
                        type: 'ELEMENT'
                    },
                    weight: 0,
                    target: target
                }
            });
        });
    });
});
//# sourceMappingURL=contains.spec.js.map
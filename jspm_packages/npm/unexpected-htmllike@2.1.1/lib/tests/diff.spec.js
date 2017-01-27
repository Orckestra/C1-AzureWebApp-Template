'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var _diff = require('../diff');

var _diff2 = _interopRequireDefault(_diff);

var _mockExtensions = require('./mock-extensions');

var _mockExtensions2 = _interopRequireDefault(_mockExtensions);

var _mockEntities = require('./mockEntities');

var expect = _unexpected2['default'].clone().use(_mockExtensions2['default']);

expect.output.preferredWidth = 80;

describe('diff', function () {

    it('returns no differences for an identical element', function () {

        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'span',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [{ type: 'CONTENT', value: 'some text' }]
            },
            weight: 0
        });
    });

    it('diffs a changed attribute', function () {

        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'bar' }, children: ['some text'] }), 'to satisfy', {
            diff: {
                attributes: [{
                    name: 'className',
                    value: 'foo',
                    diff: {
                        type: 'changed',
                        expectedValue: 'bar'
                    }
                }]
            },
            weight: _diff2['default'].DefaultWeights.ATTRIBUTE_MISMATCH
        });
    });

    it('diffs attributes with `to satisfy` semantics', function () {

        return expect((0, _mockEntities.createActual)({ name: 'Custom', attribs: { data: { a: 1, b: 2, c: [{ nested: true, foo: 'bar' }, { foo: 'baz' }] } }, children: [] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'Custom', attribs: { data: { a: 1, c: [{ foo: 'bar' }, { foo: 'different' }] } }, children: [] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'Custom',
                attributes: [{
                    name: 'data',
                    value: { a: 1, b: 2, c: [{ nested: true, foo: 'bar' }, { foo: 'baz' }] },
                    diff: {
                        type: 'changed',
                        expectedValue: { a: 1, c: [{ foo: 'bar' }, { foo: 'different' }] },
                        error: expect.it('to have message', 'expected { a: 1, b: 2, c: [ { nested: true, foo: \'bar\' }, { foo: \'baz\' } ] }\n' + 'to satisfy { a: 1, c: [ { foo: \'bar\' }, { foo: \'different\' } ] }\n' + '\n' + '{\n' + '  a: 1,\n' + '  b: 2,\n' + '  c: [\n' + '    { nested: true, foo: \'bar\' },\n' + '    {\n' + '      foo: \'baz\' // should equal \'different\'\n' + '                 //\n' + '                 // -baz\n' + '                 // +different\n' + '    }\n' + '  ]\n' + '}')
                    }
                }]
            }
        });
    });

    it('diffs an attribute with a `to satisfy` async expect.it ', function () {

        return expect((0, _mockEntities.createActual)({ name: 'Custom', attribs: { data: { a: 'test', b: 'foo' } }, children: [] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'Custom', attribs: { data: { b: expect.it('to eventually have value', 'bar') } }, children: [] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'Custom',
                attributes: [{
                    name: 'data',
                    value: { a: 'test', b: 'foo' },
                    diff: {
                        type: 'changed',
                        expectedValue: { b: expect.it('to be a function') },
                        error: expect.it('to have message', 'expected { a: \'test\', b: \'foo\' }\n' + 'to satisfy { b: expect.it(\'to eventually have value\', \'bar\') }\n' + '\n' + '{\n' + '  a: \'test\',\n' + '  b: \'foo\' // should eventually have value \'bar\'\n' + '}')
                    }
                }]
            }
        });
    });

    it('diffs attributes with `to equal` when attributesEqual is passed as an option', function () {

        return expect((0, _mockEntities.createActual)({ name: 'Custom', attribs: { data: { a: 'test', b: 'foo' } }, children: [] }), 'when diffed with options against', { attributesEqual: true }, (0, _mockEntities.createExpected)({ name: 'Custom', attribs: { data: { b: 'foo' } }, children: [] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'Custom',
                attributes: [{
                    name: 'data',
                    value: { a: 'test', b: 'foo' },
                    diff: {
                        type: 'changed',
                        expectedValue: { b: 'foo' },
                        error: expect.it('to have message', 'expected { a: \'test\', b: \'foo\' } to equal { b: \'foo\' }\n' + '\n' + '{\n' + '  a: \'test\', // should be removed\n' + '  b: \'foo\'\n' + '}')

                    }
                }]
            }
        });
    });

    it('diffs an extra attribute', function () {

        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: {}, children: ['some text'] }), 'to satisfy', {
            diff: {
                attributes: [{
                    name: 'className',
                    value: 'foo',
                    diff: {
                        type: 'extra'
                    }
                }]
            },
            weight: _diff2['default'].DefaultWeights.ATTRIBUTE_EXTRA
        });
    });

    it('diffs an extra attribute and a changed attribute', function () {

        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { id: 'abc', className: 'foo' }, children: ['some text'] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: { id: 'abcd' }, children: ['some text'] }), 'to satisfy', {
            diff: {
                attributes: [{
                    name: 'id',
                    value: 'abc',
                    diff: {
                        type: 'changed',
                        expectedValue: 'abcd'
                    }
                }, {
                    name: 'className',
                    value: 'foo',
                    diff: {
                        type: 'extra'
                    }
                }]
            },
            weight: _diff2['default'].DefaultWeights.ATTRIBUTE_EXTRA + _diff2['default'].DefaultWeights.ATTRIBUTE_MISMATCH
        });
    });

    it('diffs a removed attribute', function () {

        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: {}, children: ['some text'] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }), 'to satisfy', {
            diff: {
                attributes: [{
                    name: 'className',
                    diff: {
                        type: 'missing',
                        expectedValue: 'foo'
                    }
                }]
            },
            weight: _diff2['default'].DefaultWeights.ATTRIBUTE_MISSING
        });
    });

    it('diffs changed content', function () {

        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: {}, children: ['some text'] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: {}, children: ['some changed text'] }), 'to satisfy', {
            diff: {
                children: [{
                    type: 'CONTENT',
                    value: 'some text',
                    diff: {
                        type: 'changed',
                        expectedValue: 'some changed text'
                    }
                }]
            },
            weight: _diff2['default'].DefaultWeights.STRING_CONTENT_MISMATCH
        });
    });

    it('diffs a removed last child', function () {

        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2'] }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2'] }, { name: 'child', attribs: {}, children: ['child3'] }] }), 'to satisfy', {
            diff: {
                children: [{
                    type: 'ELEMENT',
                    name: 'child',
                    children: [{
                        type: 'CONTENT',
                        value: 'child1'
                    }]
                }, {
                    type: 'ELEMENT',
                    name: 'child',
                    children: [{
                        type: 'CONTENT',
                        value: 'child2'
                    }]
                }, {
                    type: 'ELEMENT',
                    name: 'child',
                    diff: {
                        type: 'missing'
                    },
                    children: [{
                        type: 'CONTENT',
                        value: 'child3'
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.CHILD_MISSING
        });
    });

    it('diffs a removed middle child', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child3'] }]
        }), 'when diffed against', (0, _mockEntities.createExpected)({
            name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2'] }, { name: 'child', attribs: {}, children: ['child3'] }]
        }), 'to satisfy', {
            diff: {
                children: [{
                    type: 'ELEMENT',
                    name: 'child',
                    children: [{
                        type: 'CONTENT',
                        value: 'child1'
                    }]
                }, {
                    type: 'ELEMENT',
                    name: 'child',
                    diff: {
                        type: 'missing'
                    },
                    children: [{
                        type: 'CONTENT',
                        value: 'child2'
                    }]
                }, {
                    type: 'ELEMENT',
                    name: 'child',
                    diff: undefined,
                    children: [{
                        type: 'CONTENT',
                        value: 'child3'
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.CHILD_MISSING
        });
    });

    it('diffs an extra last child', function () {
        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2'] }, { name: 'child', attribs: {}, children: ['child3'] }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2'] }] }), 'to satisfy', {
            diff: {
                children: [{
                    type: 'ELEMENT',
                    name: 'child',
                    children: [{
                        type: 'CONTENT',
                        value: 'child1'
                    }]
                }, {
                    type: 'ELEMENT',
                    name: 'child',
                    children: [{
                        type: 'CONTENT',
                        value: 'child2'
                    }]
                }, {
                    type: 'ELEMENT',
                    name: 'child',
                    diff: {
                        type: 'extra'
                    },
                    children: [{
                        type: 'CONTENT',
                        value: 'child3'
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.CHILD_INSERTED
        });
    });

    it('diffs an extra middle child', function () {
        // See comments in 'diffs a removed middle child' as to why this isn't an ideal diff
        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2'] }, { name: 'child', attribs: {}, children: ['child3'] }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child3'] }] }), 'to satisfy', {
            diff: {
                children: [{
                    type: 'ELEMENT',
                    name: 'child',
                    children: [{
                        type: 'CONTENT',
                        value: 'child1'
                    }]
                }, {
                    type: 'ELEMENT',
                    name: 'child',
                    diff: {
                        type: 'extra'
                    },
                    children: [{
                        type: 'CONTENT',
                        value: 'child2'
                    }]
                }, {
                    type: 'ELEMENT',
                    name: 'child',
                    diff: undefined,
                    children: [{
                        type: 'CONTENT',
                        value: 'child3'
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.CHILD_INSERTED
        });
    });

    it('diffs a changed middle child', function () {
        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2 changed'] }, { name: 'child', attribs: {}, children: ['child3'] }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2'] }, { name: 'child', attribs: {}, children: ['child3'] }] }), 'to satisfy', {
            diff: {
                children: [{
                    type: 'ELEMENT',
                    name: 'child',
                    children: [{
                        type: 'CONTENT',
                        value: 'child1'
                    }]
                }, {
                    type: 'ELEMENT',
                    name: 'child',
                    children: [{
                        type: 'CONTENT',
                        value: 'child2 changed',
                        diff: {
                            type: 'changed',
                            expectedValue: 'child2'
                        }
                    }]
                }, {
                    type: 'ELEMENT',
                    name: 'child',
                    diff: undefined,
                    children: [{
                        type: 'CONTENT',
                        value: 'child3'
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.STRING_CONTENT_MISMATCH
        });
    });

    it('diffs an out of order element', function () {

        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: {}, children: [{ name: 'Test', attribs: {}, children: ['one'] }, { name: 'Test', attribs: {}, children: ['two'] }, { name: 'Test', attribs: {}, children: ['three'] }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: {}, children: [{ name: 'Test', attribs: {}, children: ['one'] }, { name: 'Test', attribs: {}, children: ['three'] }, { name: 'Test', attribs: {}, children: ['two'] }] }), 'to satisfy', {
            diff: {
                children: [{
                    type: 'ELEMENT',
                    name: 'Test',
                    children: [{ type: 'CONTENT', value: 'one' }]
                }, {
                    type: 'ELEMENT',
                    name: 'Test',
                    children: [{ type: 'CONTENT', value: 'two', diff: { type: 'changed', expectedValue: 'three' } }]
                }, {
                    type: 'ELEMENT',
                    name: 'Test',
                    children: [{ type: 'CONTENT', value: 'three', diff: { type: 'changed', expectedValue: 'two' } }]
                }]
            }
        });
    });

    it('diffs a missing content entry', function () {
        // See comments in 'diffs a removed middle child' as to why this isn't an ideal diff
        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: {}, children: ['child1', 'child3'] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: {}, children: ['child1', 'child2', 'child3'] }), 'to satisfy', {
            diff: {
                children: [{
                    type: 'CONTENT',
                    value: 'child1'
                }, {
                    type: 'CONTENT',
                    value: 'child2',
                    diff: {
                        type: 'missing'
                    }
                }, {
                    type: 'CONTENT',
                    value: 'child3'
                }]
            },
            weight: _diff2['default'].DefaultWeights.CHILD_INSERTED
        });
    });

    it('diffs an extra content entry', function () {
        // See comments in 'diffs a removed middle child' as to why this isn't an ideal diff
        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: {}, children: ['child1', 'child2', 'child3'] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'span', attribs: {}, children: ['child1', 'child3'] }), 'to satisfy', {
            diff: {
                children: [{
                    type: 'CONTENT',
                    value: 'child1'
                }, {
                    type: 'CONTENT',
                    value: 'child2',
                    diff: {
                        type: 'extra'
                    }
                }, {
                    type: 'CONTENT',
                    value: 'child3'
                }]
            },
            weight: _diff2['default'].DefaultWeights.CHILD_INSERTED
        });
    });

    it('diffs a changed element name', function () {
        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'div', attribs: { className: 'foo' }, children: ['some text'] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'span',
                diff: {
                    type: 'differentElement',
                    expectedName: 'div'
                },
                attributes: [{ name: 'className', value: 'foo' }],
                children: [{ type: 'CONTENT', value: 'some text' }]
            },
            weight: _diff2['default'].DefaultWeights.NAME_MISMATCH
        });
    });

    it('diffs a content-should-be-element', function () {
        return expect('some content', 'when diffed against', (0, _mockEntities.createExpected)({ name: 'div', attribs: { className: 'foo' }, children: ['some text'] }), 'to satisfy', {
            diff: {
                type: 'CONTENT',
                value: 'some content',
                diff: {
                    type: 'contentElementMismatch',
                    expected: {
                        type: 'ELEMENT',
                        name: 'div',
                        attributes: [{ name: 'className', value: 'foo' }],
                        children: [{ type: 'CONTENT', value: 'some text' }]
                    }
                }
            },
            weight: _diff2['default'].DefaultWeights.NATIVE_NONNATIVE_MISMATCH
        });
    });

    it('diffs a element-should-be-content', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: { className: 'foo' }, children: ['some text'] }), 'when diffed with options against', {
            weights: { NATIVE_NONNATIVE_MISMATCH: 1 } // Need to fool the weight to force this, otherwise it's a wrapper
        }, 'some content', 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                diff: {
                    type: 'elementContentMismatch',
                    expected: {
                        type: 'CONTENT',
                        value: 'some content'
                    }
                },
                children: [{ type: 'CONTENT', value: 'some text' }]
            },
            weight: 1 // Overridden NATIVE_NONNATIVE_MATCH weight
        });
    });

    it('diffs a wrapper around a single child', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'wrapper', attribs: { className: 'the-wrapper' }, children: [{ name: 'real', attribs: { className: 'real-element' } }] }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'real', attribs: { className: 'real-element' } }] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [{
                    type: 'ELEMENT',
                    name: 'wrapper',
                    diff: {
                        type: 'wrapper'
                    },
                    children: [{
                        type: 'ELEMENT',
                        name: 'real',
                        attributes: [{ name: 'className', value: 'real-element' }]
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.WRAPPER_REMOVED
        });
    });

    it('diffs a wrapper around a single child', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'wrapper', attribs: { className: 'the-wrapper' }, children: [{ name: 'real', attribs: { className: 'real-element' } }] }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'real', attribs: { className: 'real-element' } }] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [{
                    type: 'ELEMENT',
                    name: 'wrapper',
                    diff: {
                        type: 'wrapper'
                    },
                    children: [{
                        type: 'ELEMENT',
                        name: 'real',
                        attributes: [{ name: 'className', value: 'real-element' }]
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.WRAPPER_REMOVED
        });
    });

    it('diffs a wrapper around multiple children', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'wrapper', attribs: { className: 'the-wrapper' }, children: [{ name: 'real', attribs: { className: 'real-element-1' } }, { name: 'real', attribs: { className: 'real-element-2' } }, { name: 'real', attribs: { className: 'real-element-3' } }] }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'real', attribs: { className: 'real-element-1' } }, { name: 'real', attribs: { className: 'real-element-2' } }, { name: 'real', attribs: { className: 'real-element-3' } }] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [{
                    type: 'ELEMENT',
                    name: 'wrapper',
                    diff: {
                        type: 'wrapper'
                    },
                    children: [{ type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-1' }] }, { type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-2' }] }, { type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-3' }] }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.WRAPPER_REMOVED
        });
    });

    it('diffs a wrapper around each of several children', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'wrapper', attribs: { className: 'the-wrapper-1' }, children: [{ name: 'real', attribs: { className: 'real-element-1' } }]
            }, { name: 'wrapper', attribs: { className: 'the-wrapper-2' }, children: [{ name: 'real', attribs: { className: 'real-element-2' } }]
            }, { name: 'wrapper', attribs: { className: 'the-wrapper-3' }, children: [{ name: 'real', attribs: { className: 'real-element-3' } }]
            }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'real', attribs: { className: 'real-element-1' } }, { name: 'real', attribs: { className: 'real-element-2' } }, { name: 'real', attribs: { className: 'real-element-3' } }] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [{
                    type: 'ELEMENT',
                    name: 'wrapper',
                    diff: {
                        type: 'wrapper'
                    },
                    attributes: [{ name: 'className', value: 'the-wrapper-1' }],
                    children: [{ type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-1' }] }]
                }, {
                    type: 'ELEMENT',
                    name: 'wrapper',
                    diff: {
                        type: 'wrapper'
                    },
                    attributes: [{ name: 'className', value: 'the-wrapper-2' }],
                    children: [{ type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-2' }] }]
                }, {
                    type: 'ELEMENT',
                    name: 'wrapper',
                    diff: {
                        type: 'wrapper'
                    },
                    attributes: [{ name: 'className', value: 'the-wrapper-3' }],
                    children: [{ type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-3' }] }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.WRAPPER_REMOVED * 3
        });
    });

    it('diffs a simple wrapper with diffWrappers:false', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'wrapper', attribs: { className: 'the-wrapper' }, children: [{ name: 'real', attribs: { className: 'real-element' } }] }] }), 'when diffed with options against', {
            diffWrappers: false
        }, (0, _mockEntities.createExpected)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'real', attribs: { className: 'real-element' } }] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [{
                    type: 'WRAPPERELEMENT',
                    name: 'wrapper',
                    children: [{
                        type: 'ELEMENT',
                        name: 'real',
                        attributes: [{ name: 'className', value: 'real-element' }]
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.OK
        });
    });

    it('diffs a wrapper around multiple children with diffWrappers:false', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'wrapper', attribs: { className: 'the-wrapper' }, children: [{ name: 'real', attribs: { className: 'real-element-1' } }, { name: 'real', attribs: { className: 'real-element-2' } }, { name: 'real', attribs: { className: 'real-element-3' } }] }] }), 'when diffed with options against', { diffWrappers: false }, (0, _mockEntities.createExpected)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'real', attribs: { className: 'real-element-1' } }, { name: 'real', attribs: { className: 'real-element-2' } }, { name: 'real', attribs: { className: 'real-element-3' } }] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [{
                    type: 'WRAPPERELEMENT',
                    name: 'wrapper',
                    children: [{
                        type: 'ELEMENT',
                        name: 'real',
                        attributes: [{ name: 'className', value: 'real-element-1' }]
                    }, {
                        type: 'ELEMENT',
                        name: 'real',
                        attributes: [{ name: 'className', value: 'real-element-2' }]
                    }, {
                        type: 'ELEMENT',
                        name: 'real',
                        attributes: [{ name: 'className', value: 'real-element-3' }]
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.OK
        });
    });

    it('diffs a wrapper around each of several children with diffWrappers:false', function () {
        return expect((0, _mockEntities.createActual)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'wrapper', attribs: { className: 'the-wrapper-1' }, children: [{ name: 'real', attribs: { className: 'real-element-1' } }]
            }, { name: 'wrapper', attribs: { className: 'the-wrapper-2' }, children: [{ name: 'real', attribs: { className: 'real-element-2' } }]
            }, { name: 'wrapper', attribs: { className: 'the-wrapper-3' }, children: [{ name: 'real', attribs: { className: 'real-element-3' } }]
            }] }), 'when diffed with options against', { diffWrappers: false }, (0, _mockEntities.createExpected)({ name: 'div', attribs: { className: 'foo' }, children: [{ name: 'real', attribs: { className: 'real-element-1' } }, { name: 'real', attribs: { className: 'real-element-2' } }, { name: 'real', attribs: { className: 'real-element-3' } }] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [{
                    type: 'WRAPPERELEMENT',
                    name: 'wrapper',
                    attributes: [{ name: 'className', value: 'the-wrapper-1' }],
                    children: [{
                        type: 'ELEMENT',
                        name: 'real',
                        attributes: [{ name: 'className', value: 'real-element-1' }]
                    }]
                }, {
                    type: 'WRAPPERELEMENT',
                    name: 'wrapper',
                    attributes: [{ name: 'className', value: 'the-wrapper-2' }],
                    children: [{
                        type: 'ELEMENT',
                        name: 'real',
                        attributes: [{ name: 'className', value: 'real-element-2' }]
                    }]
                }, {
                    type: 'WRAPPERELEMENT',
                    name: 'wrapper',
                    attributes: [{ name: 'className', value: 'the-wrapper-3' }],
                    children: [{
                        type: 'ELEMENT',
                        name: 'real',
                        attributes: [{ name: 'className', value: 'real-element-3' }]
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.OK
        });
    });

    it('ignores a top level wrapper with diffWrappers:false', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'TopLevel', attribs: {}, children: [{ name: 'MidLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }] }]
        }), 'when diffed with options against', { diffWrappers: false }, (0, _mockEntities.createExpected)({
            name: 'MidLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
        }), 'to satisfy', {
            diff: {
                type: 'WRAPPERELEMENT',
                name: 'TopLevel',
                diff: undefined,
                children: [{
                    type: 'ELEMENT',
                    name: 'MidLevel',
                    diff: undefined
                }]
            }
        });
    });

    it('ignores two levels of wrapper with diffWrappers:false', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [{
                name: 'TopLevel', attribs: {}, children: [{ name: 'MidLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }] }]
            }]
        }), 'when diffed with options against', { diffWrappers: false }, (0, _mockEntities.createExpected)({
            name: 'MidLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
        }), 'to satisfy', {
            diff: {
                type: 'WRAPPERELEMENT',
                name: 'HigherOrderTopLevel',
                diff: undefined,
                children: [{
                    type: 'WRAPPERELEMENT',
                    name: 'TopLevel',
                    diff: undefined,
                    children: [{
                        type: 'ELEMENT',
                        name: 'MidLevel',
                        diff: undefined
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.OK
        });
    });

    it('ignores missing children if diffMissingChildren:false', function () {
        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2'] }] }), 'when diffed with options against', { diffMissingChildren: false }, (0, _mockEntities.createExpected)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2'] }, { name: 'child', attribs: {}, children: ['child3'] }] }), 'to satisfy', {
            diff: {
                children: expect.it('to have length', 2)
            },
            weight: _diff2['default'].DefaultWeights.OK
        });
    });

    it('ignores extra children if diffExtraChildren:false', function () {
        return expect((0, _mockEntities.createActual)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2'] }, { name: 'child', attribs: {}, children: ['child3'] }] }), 'when diffed with options against', { diffExtraChildren: false }, (0, _mockEntities.createExpected)({ name: 'span', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['child1'] }, { name: 'child', attribs: {}, children: ['child2'] }] }), 'to satisfy', {
            diff: {
                children: [{}, {}, {
                    type: 'ELEMENT',
                    name: 'child',
                    diff: undefined,
                    children: [{
                        type: 'CONTENT',
                        value: 'child3'
                    }]
                }]
            },
            weight: _diff2['default'].DefaultWeights.OK
        });
    });

    it('ignores missing attributes if diffRemovedAttributes:false', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'span',
            attribs: {
                id: 'bar'
            },
            children: []
        }), 'when diffed with options against', { diffRemovedAttributes: false }, (0, _mockEntities.createExpected)({
            name: 'span',
            attribs: {
                className: 'foo',
                id: 'bar'
            },
            children: []
        }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'span',
                attributes: [{ name: 'id', value: 'bar' }]
            },
            weight: _diff2['default'].DefaultWeights.OK
        });
    });

    it('ignores extra attributes if diffExtraAttributes:false', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'span',
            attribs: {
                className: 'foo',
                id: 'bar'
            },
            children: []
        }), 'when diffed with options against', { diffExtraAttributes: false }, (0, _mockEntities.createExpected)({
            name: 'span',
            attribs: {
                id: 'bar'
            },
            children: []
        }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'span',
                attributes: [{ name: 'className', value: 'foo', diff: undefined }, { name: 'id', value: 'bar' }]
            },
            weight: _diff2['default'].DefaultWeights.OK
        });
    });

    it('treats undefined attributes as not defined', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'span',
            attribs: {
                id: 'bar',
                className: undefined
            },
            children: []
        }), 'when diffed with options against', { diffExtraAttributes: true }, (0, _mockEntities.createExpected)({
            name: 'span',
            attribs: {
                id: 'bar'
            },
            children: []
        }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'span',
                attributes: [{ name: 'id', value: 'bar' }, { name: 'className', value: undefined, diff: undefined }]
            },
            weight: _diff2['default'].DefaultWeights.OK
        });
    });

    it('treats null attributes as defined', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'span',
            attribs: {
                id: 'bar',
                className: null
            },
            children: []
        }), 'when diffed with options against', { diffExtraAttributes: true }, (0, _mockEntities.createExpected)({
            name: 'span',
            attribs: {
                id: 'bar'
            },
            children: []
        }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'span',
                attributes: [{ name: 'id', value: 'bar' }, { name: 'className', value: null, diff: { type: 'extra' } }]
            },
            weight: _diff2['default'].DefaultWeights.ATTRIBUTE_EXTRA
        });
    });

    it("doesn't wrap an element when it means there are missing children", function () {
        return expect((0, _mockEntities.createActual)({
            name: 'SomeElement',
            attribs: {},
            children: [{ name: 'ThisIsNotAWrapper', attribs: {}, children: [] }]
        }), 'when diffed with options against', { diffWrappers: false }, (0, _mockEntities.createExpected)({
            name: 'SomeElement',
            attribs: {},
            children: [{ name: 'ExpectedElement', attribs: {}, children: [] }]
        }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'SomeElement',
                attributes: [],
                children: [{
                    type: 'ELEMENT',
                    name: 'ThisIsNotAWrapper',
                    diff: {
                        type: 'differentElement',
                        expectedName: 'ExpectedElement'
                    }
                }]
            },
            weight: _diff2['default'].DefaultWeights.NAME_MISMATCH
        });
    });

    it('diffs extra children when the expected has no children but wrappers are allowed', function () {
        return expect((0, _mockEntities.createActual)({
            name: 'SomeElement',
            attribs: {},
            children: [{ name: 'div', attribs: {}, children: [] }]
        }), 'when diffed with options against', { diffWrappers: false }, (0, _mockEntities.createExpected)({
            name: 'SomeElement',
            attribs: {},
            children: []
        }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'SomeElement',
                children: [{
                    type: 'ELEMENT',
                    name: 'div',
                    diff: {
                        type: 'extra'
                    }
                }]
            }
        });
    });

    describe('expect.it', function () {

        it('accepts a passing expect.it attribute assertion', function () {
            return expect((0, _mockEntities.createActual)({
                name: 'SomeElement',
                attribs: {
                    className: 'abcde'
                }
            }), 'when diffed against', (0, _mockEntities.createExpected)({
                name: 'SomeElement',
                attribs: {
                    className: expect.it('to match', /[a-e]+$/)
                }
            }), 'to satisfy', {
                diff: {
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attributes: [{
                        name: 'className',
                        value: 'abcde',
                        diff: undefined
                    }]
                }
            });
        });

        it('diffs an expect.it attribute assertion', function () {
            return expect((0, _mockEntities.createActual)({
                name: 'SomeElement',
                attribs: {
                    className: 'abcde'
                }
            }), 'when diffed against', (0, _mockEntities.createExpected)({
                name: 'SomeElement',
                attribs: {
                    className: expect.it('to match', /[a-d]+$/)
                }
            }), 'to satisfy', {
                diff: {
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attributes: [{
                        name: 'className',
                        value: 'abcde',
                        diff: {
                            type: 'changed',
                            expectedValue: expect.it('to be a', 'function'),
                            error: expect.it('to have message', 'expected \'abcde\' to match /[a-d]+$/')
                        }
                    }]
                },
                weight: _diff2['default'].DefaultWeights.ATTRIBUTE_MISMATCH
            });
        });

        it('diffs an expect.it content assertion', function () {
            return expect((0, _mockEntities.createActual)({
                type: 'ELEMENT',
                name: 'SomeElement',
                attribs: {},
                children: ['abcde']
            }), 'when diffed against', (0, _mockEntities.createExpected)({
                name: 'SomeElement',
                attribs: {},
                children: [expect.it('to match', /[a-d]+$/)]
            }), 'to satisfy', {
                diff: {
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    children: [{
                        type: 'CONTENT',
                        value: 'abcde',
                        diff: {
                            type: 'custom',
                            assertion: expect.it('to be a', 'function'),
                            error: expect.it('to be a', 'UnexpectedError').and('to have message', 'expected \'abcde\' to match /[a-d]+$/')
                        }
                    }]
                },
                weight: _diff2['default'].DefaultWeights.STRING_CONTENT_MISMATCH
            });
        });

        it('returns a CONTENT type for a passed content assertion', function () {
            return expect((0, _mockEntities.createActual)({
                type: 'ELEMENT',
                name: 'SomeElement',
                attribs: {},
                children: ['abcd']
            }), 'when diffed against', (0, _mockEntities.createExpected)({
                name: 'SomeElement',
                attribs: {},
                children: [expect.it('to match', /[a-d]+$/)]
            }), 'to satisfy', {
                diff: {
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    children: [{
                        type: 'CONTENT',
                        value: 'abcd',
                        diff: undefined
                    }]
                },
                weight: _diff2['default'].DefaultWeights.OK
            });
        });

        it('works out which children match best, with asynchronous expect.it assertions in the children', function () {
            return expect((0, _mockEntities.createActual)({ name: 'div', attribs: {}, children: [{ name: 'span', attribs: {}, children: ['one'] }, { name: 'span', attribs: {}, children: ['two'] }, { name: 'span', attribs: {}, children: ['four'] }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'div', attribs: {}, children: [{ name: 'span', attribs: {}, children: [expect.it('to eventually have value', 'one')] }, { name: 'span', attribs: {}, children: [expect.it('to eventually have value', 'two')] }, { name: 'span', attribs: {}, children: [expect.it('to eventually have value', 'three')] }, { name: 'span', attribs: {}, children: [expect.it('to eventually have value', 'four')] }] }), 'to satisfy', {
                diff: {
                    type: 'ELEMENT',
                    name: 'div',
                    children: [{ type: 'ELEMENT', children: [{ type: 'CONTENT', value: 'one' }] }, { type: 'ELEMENT', children: [{ type: 'CONTENT', value: 'two' }] }, {
                        type: 'ELEMENT',
                        children: [{
                            type: 'CONTENT',
                            value: expect.it('to be an', 'expect.it') //expect.it('to eventually have value', 'three'))
                            .and('to have string representation', "expect.it('to eventually have value', 'three')")
                        }],
                        diff: { type: 'missing' }
                    }, { type: 'ELEMENT', children: [{ type: 'CONTENT', value: 'four' }] }]
                }
            });
        });

        it('diffs a child array where the children are not identical (async)', function () {

            // This test is to specifically test the `similar` handler for async diffs
            // The aaa is removed, but the bbb is then not identical, causing an "insert"

            return expect((0, _mockEntities.createActual)({ name: 'div', attribs: {}, children: [{ name: 'aaa', attribs: { className: 'one' }, children: ['one'] }, { name: 'bbb', attribs: { className: 'two' }, children: ['two'] }, { name: 'ccc', attribs: { className: 'three' }, children: ['three'] }, { name: 'ddd', attribs: { className: 'four' }, children: ['four'] }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'div', attribs: {}, children: [{ name: 'bbb', attribs: { className: 'two', extraAttrib: 'test' }, children: [expect.it('to eventually have value', 'two')] }, { name: 'ccc', attribs: { className: 'three' }, children: [expect.it('to eventually have value', 'three')] }, { name: 'ddd', attribs: { className: 'four' }, children: [expect.it('to eventually have value', 'four')] }] }), 'to satisfy', {
                diff: {
                    children: [{
                        name: 'aaa',
                        diff: { type: 'extra' }
                    }, {
                        name: 'bbb',
                        attributes: [{ name: 'className' }, { name: 'extraAttrib', diff: { type: 'missing' } }],
                        diff: undefined
                    }, {
                        name: 'ccc',
                        diff: undefined
                    }, {
                        name: 'ddd',
                        diff: undefined
                    }]
                }

            });
        });

        it('diffs a child array where the children are not identical (sync)', function () {

            // This test is to specifically test the `similar` handler for sync diffs
            // The aaa is removed, but the bbb is then not identical, causing an "insert"

            return expect((0, _mockEntities.createActual)({ name: 'div', attribs: {}, children: [{ name: 'aaa', attribs: { className: 'one' }, children: ['one'] }, { name: 'bbb', attribs: { className: 'two' }, children: ['two'] }, { name: 'ccc', attribs: { className: 'three' }, children: ['three'] }, { name: 'ddd', attribs: { className: 'four' }, children: ['four'] }] }), 'when diffed against', (0, _mockEntities.createExpected)({ name: 'div', attribs: {}, children: [{ name: 'bbb', attribs: { className: 'two', extraAttrib: 'test' }, children: ['two'] }, { name: 'ccc', attribs: { className: 'three' }, children: ['three'] }, { name: 'ddd', attribs: { className: 'four' }, children: ['four'] }] }), 'to satisfy', {
                diff: {
                    children: [{
                        name: 'aaa',
                        diff: { type: 'extra' }
                    }, {
                        name: 'bbb',
                        attributes: [{ name: 'className' }, { name: 'extraAttrib', diff: { type: 'missing' } }],
                        diff: undefined
                    }, {
                        name: 'ccc',
                        diff: undefined
                    }, {
                        name: 'ddd',
                        diff: undefined
                    }]
                }

            });
        });
    });

    describe('class comparisons', function () {

        it('matches a className with diffExactClasses:true', function () {

            return expect((0, _mockEntities.createActual)({
                type: 'ELEMENT',
                name: 'SomeElement',
                attribs: { className: 'one three two' },
                children: []
            }), 'when diffed with options against', { diffExactClasses: true }, (0, _mockEntities.createExpected)({
                type: 'ELEMENT',
                name: 'SomeElement',
                attribs: { className: 'one two three' },
                children: []
            }), 'to satisfy', {
                diff: {
                    type: 'ELEMENT',
                    attributes: [{
                        name: 'className',
                        diff: {
                            type: 'changed',
                            expectedValue: 'one two three'
                        }
                    }]
                }
            });
        });

        describe('with diffExactClasses:false', function () {

            it('ignores className order', function () {

                return expect((0, _mockEntities.createActual)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'one three two' },
                    children: []
                }), 'when diffed with options against', { diffExactClasses: false }, (0, _mockEntities.createExpected)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'one two three' },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [{
                            name: 'className',
                            value: 'one three two',
                            diff: undefined
                        }]
                    },
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('identifies an extra class', function () {

                return expect((0, _mockEntities.createActual)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'one three two' },
                    children: []
                }), 'when diffed with options against', { diffExactClasses: false }, (0, _mockEntities.createExpected)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'two one' },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [{
                            name: 'className',
                            value: 'one three two',
                            diff: {
                                type: 'class',
                                extra: 'three'
                            }
                        }]
                    },
                    weight: _diff2['default'].DefaultWeights.ATTRIBUTE_MISMATCH
                });
            });

            it('identifies a missing class', function () {

                return expect((0, _mockEntities.createActual)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'one two' },
                    children: []
                }), 'when diffed with options against', { diffExactClasses: false }, (0, _mockEntities.createExpected)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'three two one' },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [{
                            name: 'className',
                            value: 'one two',
                            diff: {
                                type: 'class',
                                missing: 'three'
                            }
                        }]
                    },
                    weight: _diff2['default'].DefaultWeights.ATTRIBUTE_MISMATCH
                });
            });

            it('ignores extra spaces in the class list', function () {

                return expect((0, _mockEntities.createActual)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: ' one two  ' },
                    children: []
                }), 'when diffed with options against', { diffExactClasses: false }, (0, _mockEntities.createExpected)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'three two one' },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [{
                            name: 'className',
                            value: ' one two  ',
                            diff: {
                                type: 'class',
                                missing: 'three',
                                extra: undefined
                            }
                        }]
                    },
                    weight: _diff2['default'].DefaultWeights.ATTRIBUTE_MISMATCH
                });
            });

            it('identifies a different class name', function () {

                return expect((0, _mockEntities.createActual)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'one cheese two' },
                    children: []
                }), 'when diffed with options against', { diffExactClasses: false }, (0, _mockEntities.createExpected)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'three two one' },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [{
                            name: 'className',
                            value: 'one cheese two',
                            diff: {
                                type: 'class',
                                missing: 'three',
                                extra: 'cheese'
                            }
                        }]
                    },
                    weight: _diff2['default'].DefaultWeights.ATTRIBUTE_MISMATCH
                });
            });

            it('identifies a single different class name', function () {

                return expect((0, _mockEntities.createActual)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'foo' },
                    children: []
                }), 'when diffed with options against', { diffExactClasses: false }, (0, _mockEntities.createExpected)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'foob' },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [{
                            name: 'className',
                            value: 'foo',
                            diff: {
                                type: 'class',
                                missing: 'foob',
                                extra: 'foo'
                            }
                        }]
                    },
                    weight: _diff2['default'].DefaultWeights.ATTRIBUTE_MISMATCH
                });
            });

            it('ignores an extra class when diffExtraClasses is false', function () {

                return expect((0, _mockEntities.createActual)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'one three two' },
                    children: []
                }), 'when diffed with options against', { diffExactClasses: false, diffExtraClasses: false }, (0, _mockEntities.createExpected)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'two one' },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [{
                            name: 'className',
                            value: 'one three two',
                            diff: undefined
                        }]
                    },
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('identifies a missing class when diffExtraClasses is false', function () {

                return expect((0, _mockEntities.createActual)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'two one' },
                    children: []
                }), 'when diffed with options against', { diffExactClasses: false, diffExtraClasses: false }, (0, _mockEntities.createExpected)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'xtra two' },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [{
                            name: 'className',
                            diff: {
                                type: 'class',
                                missing: 'xtra'
                            }
                        }]
                    },
                    weight: _diff2['default'].DefaultWeights.ATTRIBUTE_MISMATCH
                });
            });

            it('ignores a missing class when diffMissingClasses is false', function () {

                return expect((0, _mockEntities.createActual)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'one two' },
                    children: []
                }), 'when diffed with options against', { diffExactClasses: false, diffMissingClasses: false }, (0, _mockEntities.createExpected)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'three two one' },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [{
                            name: 'className',
                            value: 'one two',
                            diff: undefined
                        }]
                    },
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('accepts an expect.it for class diffing', function () {

                return expect((0, _mockEntities.createActual)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: 'one two' },
                    children: []
                }), 'when diffed with options against', { diffExactClasses: false, diffMissingClasses: false }, (0, _mockEntities.createExpected)({
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attribs: { className: expect.it('to match', /one/).and('to match', /two/) },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [{
                            name: 'className',
                            value: 'one two',
                            diff: undefined
                        }]
                    },
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });
        });
    });

    describe('with findTargetAttrib', function () {

        describe('(sync)', function () {

            it('returns the top level element', function () {

                var unique = { id: 'test' };
                var targetElement = (0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: { id: 'foo' },
                    children: []
                });

                return expect(targetElement, 'when diffed with options against', { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: { eventTarget: true },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('returns a simple nested element', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'AnotherElement',
                    attribs: {},
                    children: []
                });

                return expect((0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: {},
                    children: [targetElement]
                }), 'when diffed with options against', { findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: {},
                    children: [{
                        name: 'AnotherElement',
                        attribs: { eventTarget: true },
                        children: []
                    }]
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('ignores the target if eventTarget is not true', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'AnotherElement',
                    attribs: {},
                    children: []
                });

                return expect((0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: {},
                    children: [targetElement]
                }), 'when diffed with options against', { findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: {},
                    children: [{
                        name: 'AnotherElement',
                        attribs: { eventTarget: false },
                        children: []
                    }]
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: undefined,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('returns a target embedded in an array of children', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'ChildElement',
                    attribs: { id: 'abc' },
                    children: ['two']
                });

                return expect((0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: {},
                    children: [{ name: 'ChildElement', attribs: {}, children: ['one'] }, targetElement, { name: 'ChildElement', attribs: {}, children: ['three'] }]
                }), 'when diffed with options against', { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: {},
                    children: [{
                        name: 'ChildElement',
                        attribs: {},
                        children: ['one']
                    }, {
                        name: 'ChildElement',
                        attribs: { eventTarget: true },
                        children: ['two']
                    }, {
                        name: 'ChildElement',
                        attribs: {},
                        children: ['three']
                    }]
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('returns a target embedded in an array of children, when extra children are present', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'ChildElement',
                    attribs: { id: 'abc' },
                    children: ['two']
                });

                return expect((0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: {},
                    children: [{ name: 'ChildElement', attribs: {}, children: ['zero'] }, { name: 'ChildElement', attribs: {}, children: ['one'] }, targetElement, { name: 'ChildElement', attribs: {}, children: ['three'] }]
                }), 'when diffed with options against', { diffExtraChildren: false, diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: {},
                    children: [{
                        name: 'ChildElement',
                        attribs: {},
                        children: ['one']
                    }, {
                        name: 'ChildElement',
                        attribs: { eventTarget: true },
                        children: ['two']
                    }, {
                        name: 'ChildElement',
                        attribs: {},
                        children: ['three']
                    }]
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('returns a target embedded in a nested array of children', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'GrandChild',
                    attribs: { id: 'grandchild2-2' },
                    children: []
                });

                return expect((0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: { id: 'foo' },
                    children: [{ name: 'ChildElement', attribs: { id: 'child1' }, children: [{ name: 'GrandChild', attribs: { id: 'grandchild1-1' }, children: [] }, { name: 'GrandChild', attribs: { id: 'grandchild1-2' }, children: [] }] }, { name: 'ChildElement', attribs: { id: 'child2' }, children: [{ name: 'GrandChild', attribs: { id: 'grandchild2-1' }, children: [] }, targetElement] }, { name: 'ChildElement', attribs: { id: 'child3' }, children: [{ name: 'GrandChild', attribs: { id: 'grandchild3-1' }, children: [] }, { name: 'GrandChild', attribs: { id: 'grandchild3-2' }, children: [] }] }]
                }), 'when diffed with options against', { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({ name: 'SomeElement', attribs: {}, children: [{ name: 'ChildElement', attribs: {}, children: [{ name: 'GrandChild', attribs: {}, children: [] }, { name: 'GrandChild', attribs: {}, children: [] }] }, { name: 'ChildElement', attribs: {}, children: [{ name: 'GrandChild', attribs: {}, children: [] }, { name: 'GrandChild', attribs: { eventTarget: true }, children: [] }] }, { name: 'ChildElement', attribs: {}, children: [{ name: 'GrandChild', attribs: {}, children: [] }, { name: 'GrandChild', attribs: {}, children: [] }] }] }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('finds the target when a wrapper is present', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'AnotherElement',
                    attribs: {},
                    children: []
                });

                return expect((0, _mockEntities.createActual)({ name: 'WrapperElement', attribs: {}, children: [{
                        name: 'SomeElement',
                        attribs: {},
                        children: [targetElement]
                    }]
                }), 'when diffed with options against', { findTargetAttrib: 'eventTarget', diffWrappers: false }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: {},
                    children: [{
                        name: 'AnotherElement',
                        attribs: { eventTarget: true },
                        children: []
                    }]
                }), 'to satisfy', {
                    diff: {
                        type: 'WRAPPERELEMENT'
                    },
                    weight: _diff2['default'].DefaultWeights.OK,
                    target: targetElement
                });
            });
        });

        describe('(async)', function () {

            it('returns the top level element', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: { id: 'foo' },
                    children: []
                });

                return expect(targetElement, 'when diffed with options against', { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: { id: expect.it('to eventually have value', 'foo'), eventTarget: true },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('returns a simple nested element', function () {

                var unique = { id: 'test' };
                var targetElement = (0, _mockEntities.createActual)({
                    name: 'AnotherElement',
                    attribs: {},
                    children: []
                });

                return expect((0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: { id: 'foo' },
                    children: [targetElement]
                }), 'when diffed with options against', { findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: { id: expect.it('to eventually have value', 'foo') },
                    children: [{
                        name: 'AnotherElement',
                        attribs: { eventTarget: true },
                        children: []
                    }]
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('ignores the target if eventTarget is not true', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'AnotherElement',
                    attribs: {},
                    children: []
                });

                return expect((0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: { id: 'foo' },
                    children: [targetElement]
                }), 'when diffed with options against', { findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: { id: expect.it('to eventually have value', 'foo') },
                    children: [{
                        name: 'AnotherElement',
                        attribs: { eventTarget: false },
                        children: []
                    }]
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: undefined,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('returns a target embedded in an array of children', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'ChildElement',
                    attribs: { id: 'abc' },
                    children: ['two']
                });

                return expect((0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: { id: 'foo' },
                    children: [{ name: 'ChildElement', attribs: {}, children: ['one'] }, targetElement, { name: 'ChildElement', attribs: {}, children: ['three'] }]
                }), 'when diffed with options against', { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: { id: expect.it('to eventually have value', 'foo') },
                    children: [{
                        name: 'ChildElement',
                        attribs: {},
                        children: ['one']
                    }, {
                        name: 'ChildElement',
                        attribs: { eventTarget: true },
                        children: ['two']
                    }, {
                        name: 'ChildElement',
                        attribs: {},
                        children: ['three']
                    }]
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('returns a target embedded in an array of children, when extra children are present', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'ChildElement',
                    attribs: { id: 'abc' },
                    children: ['two']
                });

                return expect((0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: { id: 'foo' },
                    children: [{ name: 'ChildElement', attribs: {}, children: ['zero'] }, { name: 'ChildElement', attribs: {}, children: ['one'] }, targetElement, { name: 'ChildElement', attribs: {}, children: ['three'] }]
                }), 'when diffed with options against', { diffExtraChildren: false, diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: { id: expect.it('to eventually have value', 'foo') },
                    children: [{
                        name: 'ChildElement',
                        attribs: {},
                        children: ['one']
                    }, {
                        name: 'ChildElement',
                        attribs: { eventTarget: true },
                        children: ['two']
                    }, {
                        name: 'ChildElement',
                        attribs: {},
                        children: ['three']
                    }]
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('returns a target embedded in a nested array of children', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'GrandChild',
                    attribs: { id: 'grandchild2-2' },
                    children: []
                });

                return expect((0, _mockEntities.createActual)({
                    name: 'SomeElement',
                    attribs: { id: 'foo' },
                    children: [{ name: 'ChildElement', attribs: { id: 'child1' }, children: [{ name: 'GrandChild', attribs: { id: 'grandchild1-1' }, children: [] }, { name: 'GrandChild', attribs: { id: 'grandchild1-2' }, children: [] }] }, { name: 'ChildElement', attribs: { id: 'child2' }, children: [{ name: 'GrandChild', attribs: { id: 'grandchild2-1' }, children: [] }, targetElement] }, { name: 'ChildElement', attribs: { id: 'child3' }, children: [{ name: 'GrandChild', attribs: { id: 'grandchild3-1' }, children: [] }, { name: 'GrandChild', attribs: { id: 'grandchild3-2' }, children: [] }] }]
                }), 'when diffed with options against', { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, (0, _mockEntities.createExpected)({ name: 'SomeElement', attribs: { id: expect.it('to eventually have value', 'foo') }, children: [{ name: 'ChildElement', attribs: {}, children: [{ name: 'GrandChild', attribs: {}, children: [] }, { name: 'GrandChild', attribs: {}, children: [] }] }, { name: 'ChildElement', attribs: {}, children: [{ name: 'GrandChild', attribs: {}, children: [] }, { name: 'GrandChild', attribs: { eventTarget: true }, children: [] }] }, { name: 'ChildElement', attribs: {}, children: [{ name: 'GrandChild', attribs: {}, children: [] }, { name: 'GrandChild', attribs: {}, children: [] }] }] }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: _diff2['default'].DefaultWeights.OK
                });
            });

            it('finds the target when a wrapper is present', function () {

                var targetElement = (0, _mockEntities.createActual)({
                    name: 'AnotherElement',
                    attribs: {},
                    children: []
                });

                return expect((0, _mockEntities.createActual)({ name: 'WrapperElement', attribs: {}, children: [{
                        name: 'SomeElement',
                        attribs: { id: 'foo' },
                        children: [targetElement]
                    }]
                }), 'when diffed with options against', { findTargetAttrib: 'eventTarget', diffWrappers: false }, (0, _mockEntities.createExpected)({
                    name: 'SomeElement',
                    attribs: { id: expect.it('to eventually have value', 'foo') },
                    children: [{
                        name: 'AnotherElement',
                        attribs: { eventTarget: true },
                        children: []
                    }]
                }), 'to satisfy', {
                    diff: {
                        type: 'WRAPPERELEMENT'
                    },
                    weight: _diff2['default'].DefaultWeights.OK,
                    target: targetElement
                });
            });
        });
    });
});
//# sourceMappingURL=diff.spec.js.map
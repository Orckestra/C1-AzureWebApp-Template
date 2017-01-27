import Unexpected from 'unexpected';

import Diff from '../diff';

import MockExtensions from './mock-extensions';

const expect = Unexpected.clone()
    .use(MockExtensions);

import {
    createActual,
    createExpected
} from './mockEntities';


expect.output.preferredWidth = 80;

describe('diff', () => {

    it('returns no differences for an identical element', () => {

        return expect(
            createActual({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }),
            'when diffed against',
            createExpected({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }),
            'to satisfy',
            {
            diff: {
                type: 'ELEMENT',
                name: 'span',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [
                    { type: 'CONTENT', value: 'some text' }
                ]
            },
            weight: 0
        }
        );

    });

    it('diffs a changed attribute', () => {

        return expect(
            createActual({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }),
            'when diffed against',
            createExpected({ name: 'span', attribs: { className: 'bar' }, children: ['some text'] }),
            'to satisfy',
            {
                diff: {
                    attributes: [
                        {
                            name: 'className',
                            value: 'foo',
                            diff: {
                                type: 'changed',
                                expectedValue: 'bar'
                            }
                        }
                    ]
                },
                weight: Diff.DefaultWeights.ATTRIBUTE_MISMATCH
            }
        );
    });

    it('diffs attributes with `to satisfy` semantics', () => {

        return expect(
            createActual({ name: 'Custom', attribs: { data: { a: 1, b: 2, c: [ { nested: true, foo: 'bar' }, { foo: 'baz' } ] } }, children: [] }),
            'when diffed against',
            createExpected({ name: 'Custom', attribs: { data: { a: 1, c: [ { foo: 'bar' }, { foo: 'different' } ] } }, children: [] }),
            'to satisfy',
            {
                diff: {
                    type: 'ELEMENT',
                    name: 'Custom',
                    attributes: [
                        {
                            name: 'data',
                            value: { a: 1, b: 2, c: [ { nested: true, foo: 'bar' }, { foo: 'baz' } ] },
                            diff: {
                                type: 'changed',
                                expectedValue: { a: 1, c: [ { foo: 'bar' }, { foo: 'different' } ] },
                                error: expect.it('to have message', 'expected { a: 1, b: 2, c: [ { nested: true, foo: \'bar\' }, { foo: \'baz\' } ] }\n' +
                                    'to satisfy { a: 1, c: [ { foo: \'bar\' }, { foo: \'different\' } ] }\n' +
                                    '\n' +
                                    '{\n' +
                                    '  a: 1,\n' +
                                    '  b: 2,\n' +
                                    '  c: [\n' +
                                    '    { nested: true, foo: \'bar\' },\n' +
                                    '    {\n' +
                                    '      foo: \'baz\' // should equal \'different\'\n' +
                                    '                 //\n' +
                                    '                 // -baz\n' +
                                    '                 // +different\n' +
                                    '    }\n' +
                                    '  ]\n' +
                                    '}')
                            }
                        }
                    ]
                }
            }
        );
    });
    
    it('diffs an attribute with a `to satisfy` async expect.it ', () => {
        
        return expect(
            createActual({ name: 'Custom', attribs: { data: { a: 'test', b: 'foo' } }, children: [] }),
            'when diffed against',
            createExpected({ name: 'Custom', attribs: { data: { b: expect.it('to eventually have value', 'bar') } }, children: [] }),
            'to satisfy',
            {
                diff: {
                    type: 'ELEMENT',
                    name: 'Custom',
                    attributes: [
                        {
                            name: 'data',
                            value: { a: 'test', b: 'foo' },
                            diff: {
                                type: 'changed',
                                expectedValue: { b: expect.it('to be a function') },
                                error: expect.it('to have message', 'expected { a: \'test\', b: \'foo\' }\n' +
                                    'to satisfy { b: expect.it(\'to eventually have value\', \'bar\') }\n' +
                                    '\n' +
                                    '{\n' +
                                    '  a: \'test\',\n' +
                                    '  b: \'foo\' // should eventually have value \'bar\'\n' +
                                    '}')
                            }
                        }
                    ]
                }
            }
        );
        
    });

    it('diffs attributes with `to equal` when attributesEqual is passed as an option', () => {


        return expect(
            createActual({ name: 'Custom', attribs: { data: { a: 'test', b: 'foo' } }, children: [] }),
            'when diffed with options against',
            { attributesEqual: true },
            createExpected({ name: 'Custom', attribs: { data: { b: 'foo' } }, children: [] }),
            'to satisfy',
            {
                diff: {
                    type: 'ELEMENT',
                    name: 'Custom',
                    attributes: [
                        {
                            name: 'data',
                            value: { a: 'test', b: 'foo' },
                            diff: {
                                type: 'changed',
                                expectedValue: { b: 'foo' },
                                error: expect.it('to have message',
                                    'expected { a: \'test\', b: \'foo\' } to equal { b: \'foo\' }\n' +
                                    '\n' +
                                    '{\n' +
                                    '  a: \'test\', // should be removed\n' +
                                    '  b: \'foo\'\n' +
                                    '}')

                            }
                        }
                    ]
                }
            }
        );


    });

    it('diffs an extra attribute', () => {


        return expect(
            createActual({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }),
            'when diffed against',
            createExpected({ name: 'span', attribs: {}, children: ['some text'] }),
            'to satisfy',
            {
                diff: {
                    attributes: [
                        {
                            name: 'className',
                            value: 'foo',
                            diff: {
                                type: 'extra'
                            }
                        }
                    ]
                },
                weight: Diff.DefaultWeights.ATTRIBUTE_EXTRA
            }
        );
    });

    it('diffs an extra attribute and a changed attribute', () => {

        return expect(createActual(
            { name: 'span', attribs: { id: 'abc', className: 'foo' }, children: ['some text'] }
        ), 'when diffed against', createExpected({ name: 'span', attribs: { id: 'abcd' }, children: ['some text'] }), 'to satisfy', {
            diff: {
                attributes: [
                    {
                        name: 'id',
                        value: 'abc',
                        diff: {
                            type: 'changed',
                            expectedValue: 'abcd'
                        }
                    },
                    {
                        name: 'className',
                        value: 'foo',
                        diff: {
                            type: 'extra'
                        }
                    }
                ]
            },
            weight: Diff.DefaultWeights.ATTRIBUTE_EXTRA + Diff.DefaultWeights.ATTRIBUTE_MISMATCH
        });
    });

    it('diffs a removed attribute', () => {

        return expect(
            createActual({ name: 'span', attribs: {}, children: ['some text'] }),
            'when diffed against',
            createExpected({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }),
            'to satisfy',
            {
                diff: {
                    attributes: [
                        {
                            name: 'className',
                            diff: {
                                type: 'missing',
                                expectedValue: 'foo'
                            }
                        }
                    ]
                },
                weight: Diff.DefaultWeights.ATTRIBUTE_MISSING
            }
        );
    });

    it('diffs changed content', () => {

        return expect(
            createActual({ name: 'span', attribs: {}, children: ['some text'] }),
            'when diffed against',
            createExpected({ name: 'span', attribs: {}, children: ['some changed text'] }),
            'to satisfy',
            {
                diff: {
                    children: [
                        {
                            type: 'CONTENT',
                            value: 'some text',
                            diff: {
                                type: 'changed',
                                expectedValue: 'some changed text'
                            }
                        }
                    ]
                },
                weight: Diff.DefaultWeights.STRING_CONTENT_MISMATCH
            }
        );
    });

    it('diffs a removed last child', () => {

        return expect(createActual({ name: 'span', attribs: {}, children: [
                { name: 'child', attribs: {}, children: ['child1'] },
                { name: 'child', attribs: {}, children: ['child2'] }
            ] }), 'when diffed against', createExpected({ name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child2'] },
            { name: 'child', attribs: {}, children: ['child3'] }
        ] }), 'to satisfy', {
            diff: {
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        children: [{
                            type: 'CONTENT',
                            value: 'child1'
                        }]
                    },
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        children: [{
                            type: 'CONTENT',
                            value: 'child2'
                        }]
                    },
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        diff: {
                            type: 'missing'
                        },
                        children: [{
                            type: 'CONTENT',
                            value: 'child3'
                        }]
                    }
                ]
            },
            weight: Diff.DefaultWeights.CHILD_MISSING
    });
    });

    it('diffs a removed middle child', () => {
        return expect(createActual({
                name: 'span', attribs: {}, children: [
                    { name: 'child', attribs: {}, children: ['child1'] },
                    { name: 'child', attribs: {}, children: ['child3'] }
                ]
            }), 'when diffed against', createExpected({
            name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child2'] },
            { name: 'child', attribs: {}, children: ['child3'] }
        ]
        }), 'to satisfy', {
            diff: {
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        children: [{
                            type: 'CONTENT',
                            value: 'child1'
                        }]
                    },
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        diff: {
                            type: 'missing',
                        },
                        children: [{
                            type: 'CONTENT',
                            value: 'child2'
                        }]
                    },
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        diff: undefined,
                        children: [{
                            type: 'CONTENT',
                            value: 'child3'
                        }]
                    }
                ]
            },
            weight: Diff.DefaultWeights.CHILD_MISSING
        });




    });

    it('diffs an extra last child', () => {
        return expect(createActual({ name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child2'] },
            { name: 'child', attribs: {}, children: ['child3'] }
        ] }), 'when diffed against', createExpected({ name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child2'] }
        ] }), 'to satisfy', {
            diff: {
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        children: [{
                            type: 'CONTENT',
                            value: 'child1'
                        }]
                    },
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        children: [{
                            type: 'CONTENT',
                            value: 'child2'
                        }]
                    },
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        diff: {
                            type: 'extra'
                        },
                        children: [{
                            type: 'CONTENT',
                            value: 'child3'
                        }]
                    }
                ]
            },
            weight: Diff.DefaultWeights.CHILD_INSERTED
        });
    });

    it('diffs an extra middle child', () => {
        // See comments in 'diffs a removed middle child' as to why this isn't an ideal diff
        return expect(createActual({ name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child2'] },
            { name: 'child', attribs: {}, children: ['child3'] }
        ] }), 'when diffed against', createExpected({ name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child3'] }
        ] }), 'to satisfy', {
            diff: {
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        children: [{
                            type: 'CONTENT',
                            value: 'child1'
                        }]
                    },
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        diff: {
                            type: 'extra'
                        },
                        children: [{
                            type: 'CONTENT',
                            value: 'child2'
                        }]
                    },
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        diff: undefined,
                        children: [{
                            type: 'CONTENT',
                            value: 'child3'
                        }]
                    }
                ]
            },
            weight: Diff.DefaultWeights.CHILD_INSERTED
        });
    });

    it('diffs a changed middle child', () => {
        return expect(createActual({ name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child2 changed'] },
            { name: 'child', attribs: {}, children: ['child3'] }
        ] }), 'when diffed against', createExpected({ name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child2'] },
            { name: 'child', attribs: {}, children: ['child3'] }
        ] }), 'to satisfy', {
            diff: {
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        children: [{
                            type: 'CONTENT',
                            value: 'child1'
                        }]
                    },
                    {
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
                    },
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        diff: undefined,
                        children: [{
                            type: 'CONTENT',
                            value: 'child3'
                        }]
                    }
                ]
            },
            weight: Diff.DefaultWeights.STRING_CONTENT_MISMATCH
        });
    });

    it('diffs an out of order element', () => {

        return expect(createActual({ name: 'span', attribs: {}, children: [
            { name: 'Test', attribs: {}, children: ['one'] },
            { name: 'Test', attribs: {}, children: ['two'] },
            { name: 'Test', attribs: {}, children: ['three'] }
        ] }), 'when diffed against', createExpected({ name: 'span', attribs: {}, children: [

            { name: 'Test', attribs: {}, children: ['one'] },
            { name: 'Test', attribs: {}, children: ['three'] },
            { name: 'Test', attribs: {}, children: ['two'] }
        ] }), 'to satisfy', {
            diff: {
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'Test',
                        children: [ { type: 'CONTENT', value: 'one' } ]
                    },
                    {
                        type: 'ELEMENT',
                        name: 'Test',
                        children: [ { type: 'CONTENT', value: 'two', diff: { type: 'changed', expectedValue: 'three' } } ],
                    },
                    {
                        type: 'ELEMENT',
                        name: 'Test',
                        children: [ { type: 'CONTENT', value: 'three', diff: { type: 'changed', expectedValue: 'two' } } ]
                    }

                ]
            }
        });
    });

    it('diffs a missing content entry', () => {
        // See comments in 'diffs a removed middle child' as to why this isn't an ideal diff
        return expect(createActual({ name: 'span', attribs: {}, children: [
            'child1', 'child3'] }), 'when diffed against', createExpected({ name: 'span', attribs: {}, children: [
            'child1', 'child2', 'child3'] }), 'to satisfy', {
            diff: {
                children: [
                    {
                        type: 'CONTENT',
                        value: 'child1'
                    },
                    {
                        type: 'CONTENT',
                        value: 'child2',
                        diff: {
                            type: 'missing'
                        }
                    },
                    {
                        type: 'CONTENT',
                        value: 'child3'
                    }
                ]
            },
            weight: Diff.DefaultWeights.CHILD_INSERTED
        });
    });

    it('diffs an extra content entry', () => {
        // See comments in 'diffs a removed middle child' as to why this isn't an ideal diff
        return expect(createActual({ name: 'span', attribs: {}, children: [
            'child1', 'child2', 'child3'] }), 'when diffed against', createExpected({ name: 'span', attribs: {}, children: [
            'child1', 'child3'] }), 'to satisfy', {
            diff: {
                children: [
                    {
                        type: 'CONTENT',
                        value: 'child1'
                    },
                    {
                        type: 'CONTENT',
                        value: 'child2',
                        diff: {
                            type: 'extra'
                        }
                    },
                    {
                        type: 'CONTENT',
                        value: 'child3'
                    }
                ]
            },
            weight: Diff.DefaultWeights.CHILD_INSERTED
        });
    });

    it('diffs a changed element name', () => {
        return expect(
            createActual({ name: 'span', attribs: { className: 'foo' }, children: ['some text'] }),
            'when diffed against',
            createExpected({ name: 'div', attribs: { className: 'foo' }, children: ['some text'] }),
            'to satisfy',
            {
                diff: {
                    type: 'ELEMENT',
                    name: 'span',
                    diff: {
                        type: 'differentElement',
                        expectedName: 'div'
                    },
                    attributes: [{ name: 'className', value: 'foo' }],
                    children: [
                        { type: 'CONTENT', value: 'some text' }
                    ]
                },
                weight: Diff.DefaultWeights.NAME_MISMATCH
            }
        );
    });

    it('diffs a content-should-be-element', () => {
        return expect(
            'some content',
            'when diffed against',
            createExpected({ name: 'div', attribs: { className: 'foo' }, children: ['some text'] }),
            'to satisfy',
            {
                diff: {
                    type: 'CONTENT',
                    value: 'some content',
                    diff: {
                        type: 'contentElementMismatch',
                        expected: {
                            type: 'ELEMENT',
                            name: 'div',
                            attributes: [{ name: 'className', value: 'foo' }],
                            children: [
                                { type: 'CONTENT', value: 'some text' }
                            ]
                        }
                    }
                },
                weight: Diff.DefaultWeights.NATIVE_NONNATIVE_MISMATCH
            }
        );
    });

    it('diffs a element-should-be-content', () => {
        return expect(
            createActual({ name: 'div', attribs: { className: 'foo' }, children: ['some text'] }),
            'when diffed with options against',
            {
                weights: { NATIVE_NONNATIVE_MISMATCH: 1 }  // Need to fool the weight to force this, otherwise it's a wrapper
            },
            'some content',
            'to satisfy',
            {
                diff: {
                    type: 'ELEMENT',
                    name: 'div',
                    attributes: [
                        { name: 'className', value: 'foo' }
                    ],
                    diff: {
                        type: 'elementContentMismatch',
                        expected: {
                            type: 'CONTENT',
                            value: 'some content'
                        }
                    },
                    children: [
                        { type: 'CONTENT', value: 'some text' }
                    ]
                },
                weight: 1 // Overridden NATIVE_NONNATIVE_MATCH weight
            }
        );
    });

    it('diffs a wrapper around a single child', () => {
        return expect(createActual({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'wrapper', attribs: { className: 'the-wrapper' }, children: [
                { name: 'real', attribs: { className: 'real-element' } }
            ] }
        ] }), 'when diffed against', createExpected({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'real', attribs: { className: 'real-element' } }
        ] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'wrapper',
                        diff: {
                            type: 'wrapper'
                        },
                        children: [
                            {
                                type: 'ELEMENT',
                                name: 'real',
                                attributes: [{ name: 'className', value: 'real-element' }]
                            }
                        ]
                    }
                ]
            },
            weight: Diff.DefaultWeights.WRAPPER_REMOVED
        });
    });

    it('diffs a wrapper around a single child', () => {
        return expect(createActual({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'wrapper', attribs: { className: 'the-wrapper' }, children: [
                { name: 'real', attribs: { className: 'real-element' } }
            ] }
        ] }), 'when diffed against', createExpected({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'real', attribs: { className: 'real-element' } }
        ] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'wrapper',
                        diff: {
                            type: 'wrapper'
                        },
                        children: [
                            {
                                type: 'ELEMENT',
                                name: 'real',
                                attributes: [{ name: 'className', value: 'real-element' }]
                            }
                        ]
                    }
                ]
            },
            weight: Diff.DefaultWeights.WRAPPER_REMOVED
        });
    });

    it('diffs a wrapper around multiple children', () => {
        return expect(createActual({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'wrapper', attribs: { className: 'the-wrapper' }, children: [
                { name: 'real', attribs: { className: 'real-element-1' } },
                { name: 'real', attribs: { className: 'real-element-2' } },
                { name: 'real', attribs: { className: 'real-element-3' } }
            ] }
        ] }), 'when diffed against', createExpected({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'real', attribs: { className: 'real-element-1' } },
            { name: 'real', attribs: { className: 'real-element-2' } },
            { name: 'real', attribs: { className: 'real-element-3' } }
        ] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'wrapper',
                        diff: {
                            type: 'wrapper'
                        },
                        children: [
                            { type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-1' }] },
                            { type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-2' }] },
                            { type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-3' }] }
                        ]
                    }
                ]
            },
            weight: Diff.DefaultWeights.WRAPPER_REMOVED
        });
    });

    it('diffs a wrapper around each of several children', () => {
        return expect(createActual({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'wrapper', attribs: { className: 'the-wrapper-1' }, children: [
                { name: 'real', attribs: { className: 'real-element-1' } }
            ]
            },
            { name: 'wrapper', attribs: { className: 'the-wrapper-2' }, children: [
                { name: 'real', attribs: { className: 'real-element-2' } }
            ]
            },
            { name: 'wrapper', attribs: { className: 'the-wrapper-3' }, children: [
                { name: 'real', attribs: { className: 'real-element-3' } }
            ]
            }
        ] }), 'when diffed against', createExpected({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'real', attribs: { className: 'real-element-1' } },
            { name: 'real', attribs: { className: 'real-element-2' } },
            { name: 'real', attribs: { className: 'real-element-3' } }
        ] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'wrapper',
                        diff: {
                            type: 'wrapper'
                        },
                        attributes: [{ name: 'className', value: 'the-wrapper-1' }],
                        children: [
                            { type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-1' }] }
                        ]
                    },
                    {
                        type: 'ELEMENT',
                        name: 'wrapper',
                        diff: {
                            type: 'wrapper'
                        },
                        attributes: [{ name: 'className', value: 'the-wrapper-2' }],
                        children: [
                            { type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-2' }] }
                        ]
                    },
                    {
                        type: 'ELEMENT',
                        name: 'wrapper',
                        diff: {
                            type: 'wrapper'
                        },
                        attributes: [{ name: 'className', value: 'the-wrapper-3' }],
                        children: [
                            { type: 'ELEMENT', name: 'real', attributes: [{ name: 'className', value: 'real-element-3' }] }
                        ]
                    }
                ]
            },
            weight: Diff.DefaultWeights.WRAPPER_REMOVED * 3
        });
    });

    it('diffs a simple wrapper with diffWrappers:false', () => {
        return expect(createActual({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'wrapper', attribs: { className: 'the-wrapper' }, children: [
                { name: 'real', attribs: { className: 'real-element' } }
            ] }
        ] }), 'when diffed with options against', {
            diffWrappers: false
        }, createExpected({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'real', attribs: { className: 'real-element' } }
        ] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [
                    {
                        type: 'WRAPPERELEMENT',
                        name: 'wrapper',
                        children: [
                            {
                                type: 'ELEMENT',
                                name: 'real',
                                attributes: [{ name: 'className', value: 'real-element' }]
                            }
                        ]
                    }
                ]
            },
            weight: Diff.DefaultWeights.OK
        });
    });


    it('diffs a wrapper around multiple children with diffWrappers:false', () => {
        return expect(createActual({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'wrapper', attribs: { className: 'the-wrapper' }, children: [
                { name: 'real', attribs: { className: 'real-element-1' } },
                { name: 'real', attribs: { className: 'real-element-2' } },
                { name: 'real', attribs: { className: 'real-element-3' } }
            ] }
        ] }), 'when diffed with options against', { diffWrappers: false }, createExpected({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'real', attribs: { className: 'real-element-1' } },
            { name: 'real', attribs: { className: 'real-element-2' } },
            { name: 'real', attribs: { className: 'real-element-3' } }
        ] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [
                    {
                        type: 'WRAPPERELEMENT',
                        name: 'wrapper',
                        children: [
                            {
                                type: 'ELEMENT',
                                name: 'real',
                                attributes: [{ name: 'className', value: 'real-element-1' }]
                            },
                            {
                                type: 'ELEMENT',
                                name: 'real',
                                attributes: [{ name: 'className', value: 'real-element-2' }]
                            },
                            {
                                type: 'ELEMENT',
                                name: 'real',
                                attributes: [{ name: 'className', value: 'real-element-3' }]
                            }
                        ]
                    }
                ]
            },
            weight: Diff.DefaultWeights.OK
        });
    });

    it('diffs a wrapper around each of several children with diffWrappers:false', () => {
        return expect(createActual({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'wrapper', attribs: { className: 'the-wrapper-1' }, children: [
                { name: 'real', attribs: { className: 'real-element-1' } }
            ]
            },
            { name: 'wrapper', attribs: { className: 'the-wrapper-2' }, children: [
                { name: 'real', attribs: { className: 'real-element-2' } }
            ]
            },
            { name: 'wrapper', attribs: { className: 'the-wrapper-3' }, children: [
                { name: 'real', attribs: { className: 'real-element-3' } }
            ]
            }
        ] }), 'when diffed with options against', { diffWrappers: false }, createExpected({ name: 'div', attribs: { className: 'foo' }, children: [
            { name: 'real', attribs: { className: 'real-element-1' } },
            { name: 'real', attribs: { className: 'real-element-2' } },
            { name: 'real', attribs: { className: 'real-element-3' } }
        ] }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'div',
                attributes: [{ name: 'className', value: 'foo' }],
                children: [
                    {
                        type: 'WRAPPERELEMENT',
                        name: 'wrapper',
                        attributes: [{ name: 'className', value: 'the-wrapper-1' }],
                        children: [
                            {
                                type: 'ELEMENT',
                                name: 'real',
                                attributes: [{ name: 'className', value: 'real-element-1' }]
                            }
                        ]
                    },
                    {
                        type: 'WRAPPERELEMENT',
                        name: 'wrapper',
                        attributes: [{ name: 'className', value: 'the-wrapper-2' }],
                        children: [
                            {
                                type: 'ELEMENT',
                                name: 'real',
                                attributes: [{ name: 'className', value: 'real-element-2' }]
                            }
                        ]
                    },
                    {
                        type: 'WRAPPERELEMENT',
                        name: 'wrapper',
                        attributes: [{ name: 'className', value: 'the-wrapper-3' }],
                        children: [
                            {
                                type: 'ELEMENT',
                                name: 'real',
                                attributes: [{ name: 'className', value: 'real-element-3' }]
                            }
                        ]
                    }
                ]
            },
            weight: Diff.DefaultWeights.OK
        });
    });

    it('ignores a top level wrapper with diffWrappers:false', () => {
        return expect(createActual({
            name: 'TopLevel', attribs: {}, children: [
                { name: 'MidLevel', attribs: {}, children: [
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                ] }
            ]
        }), 'when diffed with options against', { diffWrappers: false }, createExpected({
            name: 'MidLevel', attribs: {}, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
            ]
        }), 'to satisfy', {
            diff: {
                type: 'WRAPPERELEMENT',
                name: 'TopLevel',
                diff: undefined,
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'MidLevel',
                        diff: undefined
                    }
                ]
            }
        });
    });

    it('ignores two levels of wrapper with diffWrappers:false', () => {
        return expect(createActual({
            name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [
                {
                    name: 'TopLevel', attribs: {}, children: [
                    { name: 'MidLevel', attribs: {}, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                    ] }
                ]
                }
            ]
        }), 'when diffed with options against', { diffWrappers: false }, createExpected({
            name: 'MidLevel', attribs: {}, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
            ]
        }), 'to satisfy', {
            diff: {
                type: 'WRAPPERELEMENT',
                name: 'HigherOrderTopLevel',
                diff: undefined,
                children: [
                    {
                        type: 'WRAPPERELEMENT',
                        name: 'TopLevel',
                        diff: undefined,
                        children: [
                            {
                                type: 'ELEMENT',
                                name: 'MidLevel',
                                diff: undefined
                            }
                        ]
                    }
                ]
            },
            weight: Diff.DefaultWeights.OK
        });
    });

    it('ignores missing children if diffMissingChildren:false', () => {
        return expect(createActual({ name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child2'] }
        ] }), 'when diffed with options against', { diffMissingChildren: false }, createExpected({ name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child2'] },
            { name: 'child', attribs: {}, children: ['child3'] }
        ] }), 'to satisfy', {
            diff: {
                children: expect.it('to have length', 2)
            },
            weight: Diff.DefaultWeights.OK
        });
    });

    it('ignores extra children if diffExtraChildren:false', () => {
        return expect(createActual({ name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child2'] },
            { name: 'child', attribs: {}, children: ['child3'] }
        ] }), 'when diffed with options against', { diffExtraChildren: false }, createExpected({ name: 'span', attribs: {}, children: [
            { name: 'child', attribs: {}, children: ['child1'] },
            { name: 'child', attribs: {}, children: ['child2'] }
        ] }), 'to satisfy', {
            diff: {
                children: [
                    { },
                    { },
                    {
                        type: 'ELEMENT',
                        name: 'child',
                        diff: undefined,
                        children: [{
                            type: 'CONTENT',
                            value: 'child3'
                        }]
                    }
                ]
            },
            weight: Diff.DefaultWeights.OK
        });
    });

    it('ignores missing attributes if diffRemovedAttributes:false', () => {
        return expect(createActual({
            name: 'span',
            attribs: {
                id: 'bar'
            },
            children: []
        }), 'when diffed with options against', { diffRemovedAttributes: false }, createExpected({
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
            weight: Diff.DefaultWeights.OK
        });
    });

    it('ignores extra attributes if diffExtraAttributes:false', () => {
        return expect(createActual({
            name: 'span',
            attribs: {
                className: 'foo',
                id: 'bar'
            },
            children: []
        }), 'when diffed with options against', { diffExtraAttributes: false }, createExpected({
            name: 'span',
            attribs: {
                id: 'bar'
            },
            children: []
        }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'span',
                attributes: [
                    { name: 'className', value: 'foo', diff: undefined },
                    { name: 'id', value: 'bar' }
                ]
            },
            weight: Diff.DefaultWeights.OK
        });
    });

    it('treats undefined attributes as not defined', () => {
        return expect(createActual({
            name: 'span',
            attribs: {
                id: 'bar',
                className: undefined
            },
            children: []
        }), 'when diffed with options against', { diffExtraAttributes: true }, createExpected({
            name: 'span',
            attribs: {
                id: 'bar'
            },
            children: []
        }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'span',
                attributes: [
                    { name: 'id', value: 'bar' },
                    { name: 'className', value: undefined, diff: undefined }
                ]
            },
            weight: Diff.DefaultWeights.OK
        });

    });

    it('treats null attributes as defined', () => {
        return expect(createActual({
            name: 'span',
            attribs: {
                id: 'bar',
                className: null
            },
            children: []
        }), 'when diffed with options against', { diffExtraAttributes: true }, createExpected({
            name: 'span',
            attribs: {
                id: 'bar'
            },
            children: []
        }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'span',
                attributes: [
                    { name: 'id', value: 'bar' },
                    { name: 'className', value: null, diff: { type: 'extra' } }
                ]
            },
            weight: Diff.DefaultWeights.ATTRIBUTE_EXTRA
        });
    });

    it("doesn't wrap an element when it means there are missing children", () => {
        return expect(createActual({
            name: 'SomeElement',
            attribs: {},
            children: [
                { name: 'ThisIsNotAWrapper', attribs: {}, children: [] }
            ]
        }), 'when diffed with options against', { diffWrappers: false }, createExpected({
            name: 'SomeElement',
            attribs: {},
            children: [
                { name: 'ExpectedElement', attribs: {}, children: [] }
            ]
        }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'SomeElement',
                attributes: [],
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'ThisIsNotAWrapper',
                        diff: {
                            type: 'differentElement',
                            expectedName: 'ExpectedElement'
                        }
                    }

                ]
            },
            weight: Diff.DefaultWeights.NAME_MISMATCH
        });
    });

    it('diffs extra children when the expected has no children but wrappers are allowed', () => {
        return expect(createActual({
            name: 'SomeElement',
            attribs: {},
            children: [
                { name: 'div', attribs: {}, children: [] }
            ]
        }), 'when diffed with options against', { diffWrappers: false }, createExpected({
            name: 'SomeElement',
            attribs: {},
            children: []
        }), 'to satisfy', {
            diff: {
                type: 'ELEMENT',
                name: 'SomeElement',
                children: [
                    {
                        type: 'ELEMENT',
                        name: 'div',
                        diff: {
                            type: 'extra'
                        }
                    }
                ]
            }
        });
    });

    describe('expect.it', () => {

        it('accepts a passing expect.it attribute assertion', () => {
            return expect(createActual({
                name: 'SomeElement',
                attribs: {
                    className: 'abcde'
                }
            }), 'when diffed against', createExpected({
                name: 'SomeElement',
                attribs: {
                    className: expect.it('to match', /[a-e]+$/)
                }
            }), 'to satisfy', {
                diff: {
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attributes: [ {
                        name: 'className',
                        value: 'abcde',
                        diff: undefined
                    }]
                }
            });
        });

        it('diffs an expect.it attribute assertion', () => {
            return expect(createActual({
                name: 'SomeElement',
                attribs: {
                    className: 'abcde'
                }
            }), 'when diffed against', createExpected({
                name: 'SomeElement',
                attribs: {
                    className: expect.it('to match', /[a-d]+$/)
                }
            }), 'to satisfy', {
                diff: {
                    type: 'ELEMENT',
                    name: 'SomeElement',
                    attributes: [ {
                        name: 'className',
                        value: 'abcde',
                        diff: {
                            type: 'changed',
                            expectedValue: expect.it('to be a', 'function'),
                            error: expect.it('to have message', 'expected \'abcde\' to match /[a-d]+$/')
                        }
                    }]
                },
                weight: Diff.DefaultWeights.ATTRIBUTE_MISMATCH
            });
        });

        it('diffs an expect.it content assertion', () => {
            return expect(createActual({
                type: 'ELEMENT',
                name: 'SomeElement',
                attribs: {},
                children: [ 'abcde' ]
            }), 'when diffed against', createExpected({
                name: 'SomeElement',
                attribs: {},
                children: [expect.it('to match', /[a-d]+$/) ]
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
                            error: expect.it('to be a', 'UnexpectedError')
                                .and('to have message', 'expected \'abcde\' to match /[a-d]+$/')
                        }
                    }]
                },
                weight: Diff.DefaultWeights.STRING_CONTENT_MISMATCH
            });
        });

        it('returns a CONTENT type for a passed content assertion', () => {
            return expect(createActual({
                type: 'ELEMENT',
                name: 'SomeElement',
                attribs: {},
                children: [ 'abcd' ]
            }), 'when diffed against', createExpected({
                name: 'SomeElement',
                attribs: {},
                children: [expect.it('to match', /[a-d]+$/) ]
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
                weight: Diff.DefaultWeights.OK
            });
        });

        it('works out which children match best, with asynchronous expect.it assertions in the children', () => {
            return expect(createActual({ name: 'div', attribs: {}, children: [
                { name: 'span', attribs: {}, children: [ 'one' ] },
                { name: 'span', attribs: {}, children: [ 'two' ] },
                { name: 'span', attribs: {}, children: [ 'four' ] }
            ] }), 'when diffed against', createExpected({ name: 'div', attribs: {}, children: [
                { name: 'span', attribs: {}, children: [ expect.it('to eventually have value', 'one') ] },
                { name: 'span', attribs: {}, children: [ expect.it('to eventually have value', 'two') ] },
                { name: 'span', attribs: {}, children: [ expect.it('to eventually have value', 'three') ] },
                { name: 'span', attribs: {}, children: [ expect.it('to eventually have value', 'four') ] }
            ] }), 'to satisfy',  {
                diff: {
                    type: 'ELEMENT',
                    name: 'div',
                    children: [
                        { type: 'ELEMENT', children: [ { type: 'CONTENT', value: 'one' } ] },
                        { type: 'ELEMENT', children: [ { type: 'CONTENT', value: 'two' } ] },
                        {
                            type: 'ELEMENT',
                            children: [
                                {
                                    type: 'CONTENT',
                                    value: expect.it('to be an', 'expect.it') //expect.it('to eventually have value', 'three'))
                                        .and('to have string representation', "expect.it('to eventually have value', 'three')")
                                }
                            ],
                            diff: { type: 'missing' }
                        },
                        { type: 'ELEMENT', children: [ { type: 'CONTENT', value: 'four' } ] }
                    ]
                }
            });
        });

        it('diffs a child array where the children are not identical (async)', () => {

            // This test is to specifically test the `similar` handler for async diffs
            // The aaa is removed, but the bbb is then not identical, causing an "insert"

            return expect(createActual({ name: 'div', attribs: {}, children: [
                { name: 'aaa', attribs: { className: 'one' }, children: [ 'one' ] },
                { name: 'bbb', attribs: { className: 'two' }, children: [ 'two' ] },
                { name: 'ccc', attribs: { className: 'three' }, children: [ 'three' ] },
                { name: 'ddd', attribs: { className: 'four' }, children: [ 'four' ] },
            ] }), 'when diffed against', createExpected({ name: 'div', attribs: {}, children: [
                { name: 'bbb', attribs: { className: 'two', extraAttrib: 'test' }, children: [ expect.it('to eventually have value', 'two') ] },
                { name: 'ccc', attribs: { className: 'three' }, children: [ expect.it('to eventually have value', 'three') ] },
                { name: 'ddd', attribs: { className: 'four' }, children: [ expect.it('to eventually have value', 'four') ] }
            ] }), 'to satisfy', {
                diff: {
                    children: [
                        {
                            name: 'aaa',
                            diff: { type: 'extra' }
                        },
                        {
                            name: 'bbb',
                            attributes: [
                                { name: 'className' },
                                { name: 'extraAttrib', diff: { type: 'missing' } }
                            ],
                            diff: undefined
                        },
                        {
                            name: 'ccc',
                            diff: undefined
                        },
                        {
                            name: 'ddd',
                            diff: undefined
                        }

                    ]
                }

            });

        });

        it('diffs a child array where the children are not identical (sync)', () => {

            // This test is to specifically test the `similar` handler for sync diffs
            // The aaa is removed, but the bbb is then not identical, causing an "insert"

            return expect(createActual({ name: 'div', attribs: {}, children: [
                { name: 'aaa', attribs: { className: 'one' }, children: [ 'one' ] },
                { name: 'bbb', attribs: { className: 'two' }, children: [ 'two' ] },
                { name: 'ccc', attribs: { className: 'three' }, children: [ 'three' ] },
                { name: 'ddd', attribs: { className: 'four' }, children: [ 'four' ] }
            ] }), 'when diffed against', createExpected({ name: 'div', attribs: {}, children: [
                { name: 'bbb', attribs: { className: 'two', extraAttrib: 'test' }, children: [ 'two' ] },
                { name: 'ccc', attribs: { className: 'three' }, children: [ 'three'] },
                { name: 'ddd', attribs: { className: 'four' }, children: [ 'four'] }
            ] }), 'to satisfy', {
                diff: {
                    children: [
                        {
                            name: 'aaa',
                            diff: { type: 'extra' }
                        },
                        {
                            name: 'bbb',
                            attributes: [
                                { name: 'className' },
                                { name: 'extraAttrib', diff: { type: 'missing' } }
                            ],
                            diff: undefined
                        },
                        {
                            name: 'ccc',
                            diff: undefined
                        },
                        {
                            name: 'ddd',
                            diff: undefined
                        }

                    ]
                }

            });

        });
    });

    describe('class comparisons', () => {

        it('matches a className with diffExactClasses:true', () => {

            return expect(createActual({
                type: 'ELEMENT',
                name:'SomeElement',
                attribs: { className: 'one three two' },
                children: []
            }), 'when diffed with options against', { diffExactClasses: true }, createExpected({
            type: 'ELEMENT',
            name:'SomeElement',
            attribs: { className: 'one two three' },
            children: []
        }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [
                            {
                                name: 'className',
                                diff: {
                                    type: 'changed',
                                    expectedValue: 'one two three'
                                }
                            }
                        ]
                    }
                });
        });

        describe('with diffExactClasses:false', () => {

            it('ignores className order', () => {

                return expect(createActual({
                        type: 'ELEMENT',
                        name:'SomeElement',
                        attribs: { className: 'one three two' },
                        children: []
                    }), 'when diffed with options against', { diffExactClasses: false }, createExpected({
                    type: 'ELEMENT',
                    name:'SomeElement',
                    attribs: { className: 'one two three' },
                    children: []
                }), 'to satisfy', {
                        diff: {
                            type: 'ELEMENT',
                            attributes: [
                                {
                                    name: 'className',
                                    value: 'one three two',
                                    diff: undefined
                                }
                            ]
                        },
                        weight: Diff.DefaultWeights.OK
                    });
            });

            it('identifies an extra class', () => {

                return expect(createActual({
                        type: 'ELEMENT',
                        name:'SomeElement',
                        attribs: { className: 'one three two' },
                        children: []
                    }), 'when diffed with options against', { diffExactClasses: false }, createExpected({
                    type: 'ELEMENT',
                    name:'SomeElement',
                    attribs: { className: 'two one' },
                    children: []
                }), 'to satisfy', {
                        diff: {
                            type: 'ELEMENT',
                            attributes: [
                                {
                                    name: 'className',
                                    value: 'one three two',
                                    diff: {
                                        type: 'class',
                                        extra: 'three'
                                    }
                                }
                            ]
                        },
                        weight: Diff.DefaultWeights.ATTRIBUTE_MISMATCH
                    });
            });

            it('identifies a missing class', () => {

                return expect(createActual({
                        type: 'ELEMENT',
                        name:'SomeElement',
                        attribs: { className: 'one two' },
                        children: []
                    }), 'when diffed with options against', { diffExactClasses: false }, createExpected({
                    type: 'ELEMENT',
                    name:'SomeElement',
                    attribs: { className: 'three two one' },
                    children: []
                }), 'to satisfy', {
                        diff: {
                            type: 'ELEMENT',
                            attributes: [
                                {
                                    name: 'className',
                                    value: 'one two',
                                    diff: {
                                        type: 'class',
                                        missing: 'three'
                                    }
                                }
                            ]
                        },
                        weight: Diff.DefaultWeights.ATTRIBUTE_MISMATCH
                    });
            });

            it('ignores extra spaces in the class list', () => {

                return expect(createActual({
                        type: 'ELEMENT',
                        name:'SomeElement',
                        attribs: { className: ' one two  ' },
                        children: []
                    }), 'when diffed with options against', { diffExactClasses: false }, createExpected({
                    type: 'ELEMENT',
                    name:'SomeElement',
                    attribs: { className: 'three two one' },
                    children: []
                }), 'to satisfy', {
                        diff: {
                            type: 'ELEMENT',
                            attributes: [
                                {
                                    name: 'className',
                                    value: ' one two  ',
                                    diff: {
                                        type: 'class',
                                        missing: 'three',
                                        extra: undefined
                                    }
                                }
                            ]
                        },
                        weight: Diff.DefaultWeights.ATTRIBUTE_MISMATCH
                    });
            });

            it('identifies a different class name', () => {

                return expect(createActual({
                        type: 'ELEMENT',
                        name:'SomeElement',
                        attribs: { className: 'one cheese two' },
                        children: []
                    }), 'when diffed with options against', { diffExactClasses: false }, createExpected({
                    type: 'ELEMENT',
                    name:'SomeElement',
                    attribs: { className: 'three two one' },
                    children: []
                }), 'to satisfy', {
                        diff: {
                            type: 'ELEMENT',
                            attributes: [
                                {
                                    name: 'className',
                                    value: 'one cheese two',
                                    diff: {
                                        type: 'class',
                                        missing: 'three',
                                        extra: 'cheese'
                                    }
                                }
                            ]
                        },
                        weight: Diff.DefaultWeights.ATTRIBUTE_MISMATCH
                    });
            });


            it('identifies a single different class name', () => {

                return expect(createActual({
                        type: 'ELEMENT',
                        name:'SomeElement',
                        attribs: { className: 'foo' },
                        children: []
                    }), 'when diffed with options against', { diffExactClasses: false }, createExpected({
                    type: 'ELEMENT',
                    name:'SomeElement',
                    attribs: { className: 'foob' },
                    children: []
                }), 'to satisfy', {
                        diff: {
                            type: 'ELEMENT',
                            attributes: [
                                {
                                    name: 'className',
                                    value: 'foo',
                                    diff: {
                                        type: 'class',
                                        missing: 'foob',
                                        extra: 'foo'
                                    }
                                }
                            ]
                        },
                        weight: Diff.DefaultWeights.ATTRIBUTE_MISMATCH
                    });
            });


            it('ignores an extra class when diffExtraClasses is false', () => {

                return expect(createActual({
                        type: 'ELEMENT',
                        name:'SomeElement',
                        attribs: { className: 'one three two' },
                        children: []
                    }), 'when diffed with options against', { diffExactClasses: false, diffExtraClasses: false }, createExpected({
                    type: 'ELEMENT',
                    name:'SomeElement',
                    attribs: { className: 'two one' },
                    children: []
                }), 'to satisfy', {
                        diff: {
                            type: 'ELEMENT',
                            attributes: [
                                {
                                    name: 'className',
                                    value: 'one three two',
                                    diff: undefined
                                }
                            ]
                        },
                        weight: Diff.DefaultWeights.OK
                    });
            });

            it('identifies a missing class when diffExtraClasses is false', () => {

                return expect(createActual({
                        type: 'ELEMENT',
                        name:'SomeElement',
                        attribs: { className: 'two one' },
                        children: []
                    }), 'when diffed with options against', { diffExactClasses: false, diffExtraClasses: false }, createExpected({
                    type: 'ELEMENT',
                    name:'SomeElement',
                    attribs: { className: 'xtra two' },
                    children: []
                }), 'to satisfy', {
                        diff: {
                            type: 'ELEMENT',
                            attributes: [
                                {
                                    name: 'className',
                                    diff: {
                                        type: 'class',
                                        missing: 'xtra'
                                    }
                                }
                            ]
                        },
                        weight: Diff.DefaultWeights.ATTRIBUTE_MISMATCH
                    });

            });

            it('ignores a missing class when diffMissingClasses is false', () => {

                return expect(createActual({
                        type: 'ELEMENT',
                        name:'SomeElement',
                        attribs: { className: 'one two' },
                        children: []
                    }), 'when diffed with options against', { diffExactClasses: false, diffMissingClasses: false }, createExpected({
                    type: 'ELEMENT',
                    name:'SomeElement',
                    attribs: { className: 'three two one' },
                    children: []
                }), 'to satisfy', {
                        diff: {
                            type: 'ELEMENT',
                            attributes: [
                                {
                                    name: 'className',
                                    value: 'one two',
                                    diff: undefined
                                }
                            ]
                        },
                        weight: Diff.DefaultWeights.OK
                    });
            });

            it('accepts an expect.it for class diffing', () => {

                return expect(createActual({
                    type: 'ELEMENT',
                    name:'SomeElement',
                    attribs: { className: 'one two' },
                    children: []
                }), 'when diffed with options against', { diffExactClasses: false, diffMissingClasses: false }, createExpected({
                    type: 'ELEMENT',
                    name:'SomeElement',
                    attribs: { className: expect.it('to match', /one/).and('to match', /two/) },
                    children: []
                }), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT',
                        attributes: [
                            {
                                name: 'className',
                                value: 'one two',
                                diff: undefined
                            }
                        ]
                    },
                    weight: Diff.DefaultWeights.OK
                });

            })

        });
    });

    describe('with findTargetAttrib', () => {

        describe('(sync)', () => {

            it('returns the top level element', () => {

                const unique = { id: 'test' };
                const targetElement = createActual({
                    name: 'SomeElement',
                    attribs: { id: 'foo' },
                    children: []
                });

                return expect(targetElement, 'when diffed with options against',
                    { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' },
                    createExpected({
                        name: 'SomeElement',
                        attribs: { eventTarget: true },
                        children: []
                    }), 'to satisfy', {
                        diff: {
                            type: 'ELEMENT'
                        },
                        target: targetElement,
                        weight: Diff.DefaultWeights.OK
                    });

            });

            it('returns a simple nested element', () => {

                const targetElement = createActual({
                    name: 'AnotherElement',
                    attribs: { },
                    children: []
                });

                return expect(createActual({
                    name:'SomeElement',
                    attribs: {},
                    children: [ targetElement ]
                }), 'when diffed with options against', { findTargetAttrib: 'eventTarget' }, createExpected({
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
                    weight: Diff.DefaultWeights.OK
                });

            });

            it('ignores the target if eventTarget is not true', () => {

                const targetElement = createActual({
                    name: 'AnotherElement',
                    attribs: { },
                    children: []
                });

                return expect(createActual({
                    name:'SomeElement',
                    attribs: {},
                    children: [ targetElement ]
                }), 'when diffed with options against', { findTargetAttrib: 'eventTarget' }, createExpected({
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
                    weight: Diff.DefaultWeights.OK
                });

            });

            it('returns a target embedded in an array of children', () => {

                const targetElement = createActual({
                    name: 'ChildElement',
                    attribs: { id: 'abc' },
                    children: ['two']
                });

                return expect(createActual({
                    name:'SomeElement',
                    attribs: {},
                    children: [
                        { name: 'ChildElement', attribs: {}, children: ['one'] },
                        targetElement,
                        { name: 'ChildElement', attribs: {}, children: ['three'] }
                    ]
                }), 'when diffed with options against', { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, createExpected({
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
                    weight: Diff.DefaultWeights.OK
                });

            });

            it('returns a target embedded in an array of children, when extra children are present', () => {

                const targetElement = createActual({
                    name: 'ChildElement',
                    attribs: { id: 'abc' },
                    children: ['two']
                });

                return expect(createActual({
                    name:'SomeElement',
                    attribs: {},
                    children: [
                        { name: 'ChildElement', attribs: {}, children: ['zero'] },
                        { name: 'ChildElement', attribs: {}, children: ['one'] },
                        targetElement,
                        { name: 'ChildElement', attribs: {}, children: ['three'] }
                    ]
                }), 'when diffed with options against', { diffExtraChildren: false, diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, createExpected({
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
                    weight: Diff.DefaultWeights.OK
                });

            });

            it('returns a target embedded in a nested array of children', () => {

                const targetElement = createActual({
                    name: 'GrandChild',
                    attribs: { id: 'grandchild2-2' },
                    children: []
                });

                return expect(createActual({
                    name:'SomeElement',
                    attribs: { id: 'foo' },
                    children: [
                        { name: 'ChildElement', attribs: { id: 'child1' }, children: [
                            { name: 'GrandChild', attribs: { id: 'grandchild1-1'}, children: [] },
                            { name: 'GrandChild', attribs: { id: 'grandchild1-2'}, children: [] }
                        ]},
                        { name: 'ChildElement', attribs: { id: 'child2' }, children: [
                            { name: 'GrandChild', attribs: { id: 'grandchild2-1'}, children: [] },
                            targetElement,
                        ]},

                        { name: 'ChildElement', attribs: { id: 'child3' }, children: [
                            { name: 'GrandChild', attribs: { id: 'grandchild3-1'}, children: [] },
                            { name: 'GrandChild', attribs: { id: 'grandchild3-2'}, children: [] }
                        ] }
                    ]
                }), 'when diffed with options against', { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, createExpected(
                    { name: 'SomeElement', attribs: {}, children: [
                        { name: 'ChildElement', attribs: {  }, children: [
                            { name: 'GrandChild', attribs: { }, children: [] },
                            { name: 'GrandChild', attribs: { }, children: [] }
                        ]},
                        { name: 'ChildElement', attribs: { }, children: [
                            { name: 'GrandChild', attribs: { }, children: [] },
                            { name: 'GrandChild', attribs: { eventTarget: true }, children: [] }
                        ]},

                        { name: 'ChildElement', attribs: { }, children: [
                            { name: 'GrandChild', attribs: {}, children: [] },
                            { name: 'GrandChild', attribs: {}, children: [] }
                        ] }
                    ]}), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: Diff.DefaultWeights.OK
                });

            });
            
            it('finds the target when a wrapper is present', () => {
                
                const targetElement = createActual({
                    name: 'AnotherElement',
                    attribs: { },
                    children: []
                });

                return expect(createActual(
                    { name: 'WrapperElement', attribs: {}, children: [
                        {
                            name:'SomeElement',
                            attribs: {},
                            children: [ targetElement ]
                        }
                    ]
                    }
                ), 'when diffed with options against', { findTargetAttrib: 'eventTarget', diffWrappers: false }, createExpected({
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
                    weight: Diff.DefaultWeights.OK,
                    target: targetElement
                });
                
            });
        });

        describe('(async)', () => {

            it('returns the top level element', () => {

                const targetElement = createActual({
                    name: 'SomeElement',
                    attribs: { id: 'foo' },
                    children: []
                });

                return expect(targetElement, 'when diffed with options against',
                    { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' },
                    createExpected({
                        name: 'SomeElement',
                        attribs: { id: expect.it('to eventually have value', 'foo'), eventTarget: true },
                        children: []
                    }), 'to satisfy', {
                        diff: {
                            type: 'ELEMENT'
                        },
                        target: targetElement,
                        weight: Diff.DefaultWeights.OK
                    });

            });

            it('returns a simple nested element', () => {

                const unique = { id: 'test' };
                const targetElement = createActual({
                    name: 'AnotherElement',
                    attribs: { },
                    children: []
                });

                return expect(createActual({
                    name:'SomeElement',
                    attribs: { id: 'foo' },
                    children: [ targetElement ]
                }), 'when diffed with options against', { findTargetAttrib: 'eventTarget' }, createExpected({
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
                    weight: Diff.DefaultWeights.OK
                });

            });

            it('ignores the target if eventTarget is not true', () => {

                const targetElement = createActual({
                    name: 'AnotherElement',
                    attribs: { },
                    children: []
                });

                return expect(createActual({
                    name:'SomeElement',
                    attribs: { id: 'foo' },
                    children: [ targetElement ]
                }), 'when diffed with options against', { findTargetAttrib: 'eventTarget' }, createExpected({
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
                    weight: Diff.DefaultWeights.OK
                });

            });

            it('returns a target embedded in an array of children', () => {

                const targetElement = createActual({
                    name: 'ChildElement',
                    attribs: { id: 'abc' },
                    children: ['two']
                });

                return expect(createActual({
                    name:'SomeElement',
                    attribs: { id: 'foo' },
                    children: [
                        { name: 'ChildElement', attribs: {}, children: ['one'] },
                        targetElement,
                        { name: 'ChildElement', attribs: {}, children: ['three'] }
                    ]
                }), 'when diffed with options against', { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, createExpected({
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
                    weight: Diff.DefaultWeights.OK
                });

            });

            it('returns a target embedded in an array of children, when extra children are present', () => {

                const targetElement = createActual({
                    name: 'ChildElement',
                    attribs: { id: 'abc' },
                    children: ['two']
                });

                return expect(createActual({
                    name:'SomeElement',
                    attribs: { id: 'foo' },
                    children: [
                        { name: 'ChildElement', attribs: {}, children: ['zero'] },
                        { name: 'ChildElement', attribs: {}, children: ['one'] },
                        targetElement,
                        { name: 'ChildElement', attribs: {}, children: ['three'] }
                    ]
                }), 'when diffed with options against', { diffExtraChildren: false, diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, createExpected({
                    name: 'SomeElement',
                    attribs: { id: expect.it('to eventually have value', 'foo')},
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
                    weight: Diff.DefaultWeights.OK
                });

            });

            it('returns a target embedded in a nested array of children', () => {

                const targetElement = createActual({
                    name: 'GrandChild',
                    attribs: { id: 'grandchild2-2' },
                    children: []
                });

                return expect(createActual({
                    name:'SomeElement',
                    attribs: { id: 'foo' },
                    children: [
                        { name: 'ChildElement', attribs: { id: 'child1' }, children: [
                            { name: 'GrandChild', attribs: { id: 'grandchild1-1'}, children: [] },
                            { name: 'GrandChild', attribs: { id: 'grandchild1-2'}, children: [] }
                        ]},
                        { name: 'ChildElement', attribs: { id: 'child2' }, children: [
                            { name: 'GrandChild', attribs: { id: 'grandchild2-1'}, children: [] },
                            targetElement,
                        ]},

                        { name: 'ChildElement', attribs: { id: 'child3' }, children: [
                            { name: 'GrandChild', attribs: { id: 'grandchild3-1'}, children: [] },
                            { name: 'GrandChild', attribs: { id: 'grandchild3-2'}, children: [] }
                        ] }
                    ]
                }), 'when diffed with options against', { diffExtraAttributes: false, findTargetAttrib: 'eventTarget' }, createExpected(
                    { name: 'SomeElement', attribs: { id: expect.it('to eventually have value', 'foo')}, children: [
                        { name: 'ChildElement', attribs: {}, children: [
                            { name: 'GrandChild', attribs: {}, children: [] },
                            { name: 'GrandChild', attribs: {}, children: [] }
                        ]},
                        { name: 'ChildElement', attribs: {}, children: [
                            { name: 'GrandChild', attribs: {}, children: [] },
                            { name: 'GrandChild', attribs: { eventTarget: true }, children: [] }
                        ]},

                        { name: 'ChildElement', attribs: {}, children: [
                            { name: 'GrandChild', attribs: {}, children: [] },
                            { name: 'GrandChild', attribs: {}, children: [] }
                        ] }
                    ]}), 'to satisfy', {
                    diff: {
                        type: 'ELEMENT'
                    },
                    target: targetElement,
                    weight: Diff.DefaultWeights.OK
                });
            });

            it('finds the target when a wrapper is present', () => {

                const targetElement = createActual({
                    name: 'AnotherElement',
                    attribs: { },
                    children: []
                });

                return expect(createActual(
                    { name: 'WrapperElement', attribs: {}, children: [
                        {
                            name:'SomeElement',
                            attribs: { id: 'foo'},
                            children: [ targetElement ]
                        }
                    ]
                    }
                ), 'when diffed with options against', { findTargetAttrib: 'eventTarget', diffWrappers: false }, createExpected({
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
                    weight: Diff.DefaultWeights.OK,
                    target: targetElement
                });

            });
        });
    });
});

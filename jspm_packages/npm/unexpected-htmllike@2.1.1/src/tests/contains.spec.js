import Unexpected from 'unexpected';

import Contains from '../contains';
import Diff from '../diff';

import {
    expectedSymbol,
    actualSymbol,
    TestExpectedAdapter,
    TestActualAdapter,
    createActual,
    createExpected
} from './mockEntities';

const expect = Unexpected.clone();


function getContains(actual, expected, options) {
    return Contains(TestActualAdapter, TestExpectedAdapter, actual, expected, expect, options);
}

expect.addType({

    name: 'TestHtmlElement',
    base: 'object',
    identify: function (value) {
        return value &&
            typeof value === 'object' &&
            typeof value.name === 'string' &&
            typeof value.attribs === 'object';
    }
});

function shiftResultOrPromise(resultOrPromise, expect) {
    if (resultOrPromise && typeof resultOrPromise.then === 'function') {
        return resultOrPromise.then(result => expect.shift(result));
    }
    expect.shift(resultOrPromise);
}

expect.addAssertion('<TestHtmlElement> when checked to contain <TestHtmlElement> <assertion>', function (expect, subject, value) {

    const containsResult = Contains(TestActualAdapter, TestExpectedAdapter, subject, value, expect, {});
    return shiftResultOrPromise(containsResult, expect);
});


expect.addAssertion('<TestHtmlElement> when checked with options to contain <object> <TestHtmlElement> <assertion>', function (expect, subject, options, value) {

    const containsResult = Contains(TestActualAdapter, TestExpectedAdapter, subject, value, expect, options);
    return shiftResultOrPromise(containsResult, expect);
});

expect.addAssertion('<string> to eventually equal <string>', function (expect, subject, value) {
    return expect.promise((resolve, reject) => {
        setTimeout(() => {
            if (subject === value) {
                resolve();
            } else {
                expect.withError(() => {
                    expect(subject, 'to equal', value);
                }, err => reject(err));
            }
        }, 50);
    });
});

describe('contains', () => {

    it('finds an exact match', () => {
        return expect(createActual(
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
        ), 'when checked to contain', createExpected(
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
        ), 'to satisfy', { found: true });

    });

    it('reports the inspection of the found item', () => {
        return expect(createActual(
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
        ), 'when checked to contain', createExpected(
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
        ), 'to satisfy', {
            found: true,
            bestMatch: {
                diff: {
                    type: 'ELEMENT',
                    name: 'span',
                    attributes: [ { name: 'className', value: 'foo' } ]
                }
            }
        });
    });

    it('reports not found when no exact match exists', () => {
        return expect(createActual(
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
        ), 'when checked to contain', createExpected(
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some other content'] }
        ), 'to satisfy', { found: false });
    });

    it('finds an element nested one deep', () => {
        return expect(createActual({ name: 'div', attribs: {}, children: [
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
        ]
        }), 'when checked to contain', createExpected(
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
        ), 'to satisfy', { found: true });
    });

    it('finds a deep nested element', () => {
        return expect(createActual({ name: 'div', attribs: {}, children: [
            { name: 'span', attribs: { className: 'foo' }, children: [ 'blah'] },
            { name: 'span', attribs: { className: 'foo' }, children: [
                { name: 'span', attribs: { className: 'foo' }, children: [ 'some content' ] }
            ] },
            { name: 'span', attribs: { className: 'foo' }, children: [ 'blubs'] }
        ]
        }), 'when checked to contain', createExpected(
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
        ), 'to satisfy', { found: true, bestMatch: {
            diff: {
                type: 'ELEMENT',
                name: 'span',
                attributes: [ { name: 'className', value: 'foo' } ]
            }
        } });
    });

    it('finds a best match when the content is different', () => {
        return expect(createActual({ name: 'div', attribs: {}, children: [
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some different content' ] }
        ]
        }), 'when checked to contain', createExpected(
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
        ), 'to satisfy', { found: false, bestMatchItem: {
            name: 'span', attribs: { className: 'foo' }, children: [ 'some different content' ]
        } });
    });

    it('finds a best match in an array of children with an extra attribute', () => {
        return expect(createActual({ name: 'div', attribs: {}, children: [
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some content' ] },
            { name: 'span', attribs: { className: 'bar' }, children: [ 'some content' ] },
            { name: 'span', attribs: { className: 'candidate', id: 'abc' }, children: [ 'some content' ] }
        ]
        }), 'when checked to contain', createExpected(
            { name: 'span', attribs: { className: 'candidate' }, children: [ 'some content'] }
        ), 'to satisfy', { found: false, bestMatchItem: {
            name: 'span', attribs: { className: 'candidate', id: 'abc' }, children: [ 'some content' ]
        } });
    });

    it('returns a diff when the content is different', () => {
        return expect(createActual({ name: 'div', attribs: {}, children: [
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some different content' ] }
        ]
        }), 'when checked to contain', createExpected(
            { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
        ), 'to satisfy', {
            found: false,
            bestMatch: {
                diff: {
                    type: 'ELEMENT',
                    name: 'span',
                    attributes: [{ name: 'className', value: 'foo' }],
                    children: [ {
                        type: 'CONTENT',
                        value: 'some different content',
                        diff: {
                            type: 'changed',
                            expectedValue: 'some content'
                        }
                    } ]
                },
                weight: Diff.DefaultWeights.STRING_CONTENT_MISMATCH
            }
        });
    });

    it('doesn\'t include wrappers in the bestMatchItem around the item that is found', () => {
        const searchItem = {
            name: 'div', attribs: {}, children: [
                {
                    name: 'wrapper', attribs: { className: 'the-wrapper' },
                    children: [
                        { name: 'span', attribs: { className: 'foo' }, children: ['some different content'] }
                    ]

                }
            ]
        };

        return expect(createActual({
            name: 'body', attribs: {}, children: [ searchItem ]
        }), 'when checked with options to contain', { diffWrappers: false }, createExpected({
            name: 'div', attribs: {}, children: [
                { name: 'span', attribs: { className: 'foo' }, children: ['some content'] }
            ]
        }), 'to satisfy', {
            found: false,
            bestMatchItem: searchItem
        });
    });

    it('doesn\'t include wrappers in the bestMatch around the item that is found', () => {
        return expect(createActual({
            name: 'body', attribs: {}, children: [ {
                name: 'div', attribs: {}, children: [
                    {
                        name: 'wrapper', attribs: { className: 'the-wrapper' },
                        children: [
                            { name: 'span', attribs: { className: 'foo' }, children: ['some different content'] }
                        ]

                    }
                ]
            } ]
        }), 'when checked with options to contain', { diffWrappers: false }, createExpected({
            name: 'div', attribs: {}, children: [
                { name: 'span', attribs: { className: 'foo' }, children: ['some content'] }
            ]
        }), 'to satisfy', {
            found: false,
            bestMatch: {
                diff: {
                    type: 'ELEMENT',
                    name: 'div',      // Top level in the diff is the div, not the body
                    children: [ {
                        type: 'WRAPPERELEMENT',
                        name: 'wrapper'
                    }]
                }
            }
        });
    });

    it('doesn\'t include wrappers in the bestMatch around an item that is found to match', () => {
        return expect(createActual({
            name: 'body', attribs: {}, children: [{
                name: 'div', attribs: {}, children: [
                    {
                        name: 'wrapper', attribs: { className: 'the-wrapper' },
                        children: [
                            { name: 'span', attribs: { className: 'foo' }, children: ['some content'] }
                        ]

                    }
                ]
            }]
        }), 'when checked with options to contain', { diffWrappers: false }, createExpected({
            name: 'div', attribs: {}, children: [
                { name: 'span', attribs: { className: 'foo' }, children: ['some content'] }
            ]
        }), 'to satisfy', {
            found: true,
            bestMatch: {
                diff: {
                    type: 'ELEMENT',
                    name: 'div',      // Top level in the diff is the div, not the body
                    children: [{
                        type: 'WRAPPERELEMENT',
                        name: 'wrapper'
                    }]
                }
            }
        });
    });

    it('finds a nested component with missing children and extra attribute', () => {
        return expect(createActual({
            name: 'div', attribs: {}, children: [
                {
                    name: 'span',
                    attribs: {},
                    children: [ 'one' ]
                },
                {
                    name: 'span',
                    attribs: { className: 'dummy' },
                    children: [ 'two' ]
                },
                {
                    name: 'span',
                    attribs: {},
                    children: [ 'three' ]
                }
            ]
        }), 'when checked with options to contain', { diffExtraChildren: false, diffExtraAttributes: false }, createExpected({
            name: 'div', attribs: {}, children: [
                {
                    name: 'span',
                    attribs: {},
                    children: [ 'two' ]
                }
            ]
        }), 'to satisfy', {
            found: true,
            bestMatch: {
                weight: 0
            }
        });
    });

    it('finds a nested component with missing children and extra attribute (async)', () => {
        return expect(createActual({
            name: 'div', attribs: {}, children: [
                {
                    name: 'span',
                    attribs: {},
                    children: [ 'one' ]
                },
                {
                    name: 'span',
                    attribs: { className: 'dummy' },
                    children: [ 'two' ]
                },
                {
                    name: 'span',
                    attribs: {},
                    children: [ 'three' ]
                }
            ]
        }), 'when checked with options to contain', { diffExtraChildren: false, diffExtraAttributes: false }, createExpected({
            name: 'div', attribs: {}, children: [
                {
                    name: 'span',
                    attribs: {},
                    children: [ expect.it('to eventually equal', 'two') ]
                }
            ]
        }), 'to satisfy', {
            found: true,
            bestMatch: {
                weight: 0
            }
        });
    });
    
    describe('findTargetAttrib', () => {
       
        it('finds a target in a simple element', () => {
            
            const target = createActual({
                            name: 'span',
                            attribs: { id: '123' },
                            children: []
                        });
            return expect(createActual({
                name: 'div', attribs: {}, children: [
                    {
                        name: 'span',
                        attribs: { id: 'main' },
                        children: [ target ]
                    }
                ]
            }), 'when checked with options to contain', { findTargetAttrib: 'eventTarget', diffExtraAttributes: false }, createExpected(
                    {
                        name: 'span',
                        attribs: {},
                        children: [ { name: 'span', attribs: { eventTarget: true }, children: [] } ]
                    }
            ), 'to satisfy', {
                found: true,
                bestMatch: {
                    diff: {
                        type: 'ELEMENT'
                    },
                    weight: 0,
                    target
                }
            });
            
        })
    });
});

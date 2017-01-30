
/* These are the integration tests for unexpected-htmllike
 * They confirm that diff, contains and painter work together correctly
 */

import HtmlLikeUnexpected from '../index';
import MagicPen from 'magicpen';
import MagicPenPrism from 'magicpen-prism';
import Unexpected from 'unexpected';
import ObjectAssign from 'object-assign';
import Diff from '../diff';
import MockExtensions from './mock-extensions';

import {
    expectedSymbol,
    actualSymbol,
    TestExpectedAdapter,
    TestActualAdapter,
    createActual,
    createExpected
} from './mockEntities';

const expect = Unexpected.clone()
    .use(MockExtensions);


expect.output.preferredWidth = 80;


const prismPen = MagicPen();
prismPen.use(MagicPenPrism);

describe('HtmlLikeComponent', () => {


    it('outputs a formatted output with no children', () => {
        expect(
            createActual({ name: 'div', attribs: { id: 'foo', className: 'bar' }, children: [] }),
            'to inspect as',
            '<div id="foo" className="bar" />'
        );

    });

    it('outputs a formatted output with children', () => {

        expect(createActual({
            name: 'div', attribs: { id: 'foo', className: 'bar' }, children: [
                {
                    name: 'span',
                    attribs: { className: 'child1' },
                    children: ['child content 1']
                },
                {
                    name: 'span',
                    attribs: { className: 'child2' },
                    children: ['child content 2']
                }
            ]
        }), 'to inspect as',
            '<div id="foo" className="bar">\n' +
            '  <span className="child1">child content 1</span>\n' +
            '  <span className="child2">child content 2</span>\n' +
            '</div>');
    });

    it('outputs object attributes', () => {
        expect(createActual({
                name: 'div', attribs: { style: { width: 125, height: 100 } }, children: [
                ]
            }), 'to inspect as', '<div style={{ width: 125, height: 100 }} />');

    });

    /* TODO: Reenable this test when inspect uses the painter
    it('outputs large object attributes over multiple lines', () => {
        expect({
                name: 'div',
                attribs: {
                    style: {
                        width: 125,
                        height: 100,
                        background: '#ff6600 url("blah blah blah blah blah")'
                    }
                }, children: []
            }, 'to inspect as',
            '<div style={{ width: 125, height: 100 }} />');

    });
    */

    it('outputs deeply nested children over multiple lines', () => {

        expect(createActual({
                name: 'div', attribs: { id: 'outside-wrapper', className: 'wrap-me' }, children: [
                    {
                        name: 'div', attribs: { id: 'foo', className: 'bar' }, children: [
                        {
                            name: 'span',
                            attribs: { className: 'child1' },
                            children: ['child content 1']
                        },
                        {
                            name: 'span',
                            attribs: { className: 'child2' },
                            children: ['child content 2']
                        }
                    ]
                    }
                ]
    }), 'to inspect as',
            '<div id="outside-wrapper" className="wrap-me">\n' +
            '  <div id="foo" className="bar">\n' +
            '    <span className="child1">child content 1</span>\n' +
            '    <span className="child2">child content 2</span>\n' +
            '  </div>\n' +
            '</div>');

    });

    it('outputs children on a single line if it fits', () => {

        expect(createActual({
            name: 'div', attribs: { id: 'foo', className: 'bar' }, children: [
                {
                    name: 'span',
                    children: ['1']
                },
                {
                    name: 'span',
                    children: ['2']
                }
            ]
        }), 'to inspect as', '<div id="foo" className="bar"><span>1</span><span>2</span></div>');
    });

    it('outputs attributes on split lines if they are too long, with no content', () => {
        expect(createActual({
            name: 'div', attribs: {
                id: 'foo',
                className: 'bar blah mcgar',
                'data-role': 'special-long-button',
                'data-special': 'some other long attrib'
            },
            children: []
        }), 'to inspect as',
            '<div id="foo" className="bar blah mcgar" data-role="special-long-button"\n' +
            '   data-special="some other long attrib"\n' +
            '/>');
    });

    it('outputs attributes on split lines if they are too long, with content', () => {
        expect(createActual({
            name: 'div', attribs: {
                id: 'foo',
                className: 'bar blah mcgar',
                'data-role': 'special-long-button',
                'data-special': 'some other long attrib'
            },
            children: ['some content']
        }), 'to inspect as',
            '<div id="foo" className="bar blah mcgar" data-role="special-long-button"\n' +
            '   data-special="some other long attrib">\n' +
            '  some content\n' +
            '</div>');
    });


    describe('diff', () => {

       it('gets the weight correct for a single component with a different attribute', () => {

           return expect(createActual({
               name: 'div', attribs: { id: 'foo' }, children: []
           }), 'when diffed as html against', createExpected({
               name: 'div', attribs: { id: 'bar' }, children: []
           }), 'to have weight', HtmlLikeUnexpected.DefaultWeights.ATTRIBUTE_MISMATCH);

       });

        it('outputs the diff of a single component with a different attribute', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: []
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 'bar' }, children: []
            }), 'to output',
            "<div id=\"foo\" // expected 'foo' to equal 'bar'\n" +
            '              //\n' +
            '              // -foo\n' +
            '              // +bar\n' +
            '/>');

        });

        it('outputs attributes that are different types but evaluate to the same string', () => {
            return expect(createActual({
                name: 'div', attribs: { id: '42' }, children: []
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 42 }, children: []
            }), 'to output with weight', '<div id="42" // expected \'42\' to equal 42\n' +
            '/>', Diff.DefaultWeights.ATTRIBUTE_MISMATCH);

        });

        it('outputs the diff of a single component with a different attribute and a matching attribute after', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo', className: 'testing' }, children: []
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 'bar', className: 'testing' }, children: []
            }), 'to output', '<div id="foo" // expected \'foo\' to equal \'bar\'\n' +
            '              //\n' +
            '              // -foo\n' +
            '              // +bar\n' +
            '   className="testing"\n' +
            '/>');
        });

        it('outputs the diff of a single component with a different attribute and a matching attribute before', () => {

            return expect(createActual({
                name: 'div', attribs: { className: 'testing', id: 'foo'  }, children: []
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { className: 'testing', id: 'bar' }, children: []
            }), 'to output', '<div className="testing" id="foo" // expected \'foo\' to equal \'bar\'\n' +
            '                                  //\n' +
            '                                  // -foo\n' +
            '                                  // +bar\n' +
            '/>');
        });

        it('breaks the output if there are lots of matching attributes', () => {

            const attribs = {
                'data-attrib1': 'aaa',
                'data-attrib2': 'hello world',
                'data-attrib3': 'testing is fun',
                'data-attrib4': 'hallo welt',
                'data-attrib5': 'jonny number five'
            };

            const afterAttribs = {
                'data-after': 'bbb',
                'data-after2': 'ccc some more words',
                'data-after3': 'here is some more'
            };
            const actualAttribs = ObjectAssign({}, attribs, { 'data-mismatch': 'foo' }, afterAttribs);
            const expectedAttribs = ObjectAssign({}, attribs, { 'data-mismatch': 'bar' }, afterAttribs);

            return expect(createActual({
                name: 'div', attribs: actualAttribs, children: []
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: expectedAttribs, children: []
            }), 'to output', '<div data-attrib1="aaa" data-attrib2="hello world" data-attrib3="testing is fun"\n' +
            '   data-attrib4="hallo welt" data-attrib5="jonny number five"\n' +
            '   data-mismatch="foo" // expected \'foo\' to equal \'bar\'\n' +
            '                       //\n' +
            '                       // -foo\n' +
            '                       // +bar\n' +
            '   data-after="bbb" data-after2="ccc some more words"\n' +
            '   data-after3="here is some more"\n' +
            '/>');
        });

        it('highlights a missing attribute', () => {
            return expect(createActual({
                name: 'div', attribs: { id: 'foo'  }, children: []
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { className: 'testing', id: 'foo' }, children: []
            }), 'to output', '<div id="foo" // missing className="testing"\n' +
            '/>');
        });

        it('highlights two missing attributes', () => {
            return expect(createActual({
                name: 'div', attribs: { id: 'foo'  }, children: []
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { className: 'testing', id: 'foo', extra: '123' }, children: []
            }), 'to output', '<div id="foo" // missing className="testing"\n' +
            '   // missing extra="123"\n' +
            '/>');
        });

        it('diffs a component with a single text child', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: ['abc']
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 'foo' }, children: ['def']
            }), 'to output with weight', '<div id="foo">\n' +
            '  abc // -abc\n' +
            '      // +def\n' +
            '</div>', HtmlLikeUnexpected.DefaultWeights.STRING_CONTENT_MISMATCH);
        });

        it('diffs a component with mismatching content types', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: [ '42' ]
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 'foo' }, children: [ 42 ]
            }), 'to output with weight', '<div id="foo">\n' +
            '  42 // mismatched type -string\n' +
            '     //                 +number\n' +
            '</div>', HtmlLikeUnexpected.DefaultWeights.CONTENT_TYPE_MISMATCH);
        });

        it('diffs a component with child components with different content', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: {}, children: ['one'] },
                { name: 'span', attribs: {}, children: ['two'] }
            ]
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: {}, children: ['one'] },
                { name: 'span', attribs: {}, children: ['updated'] }
            ]
            }), 'to output with weight', '<div id="foo">\n' +
            '  <span>one</span>\n' +
            '  <span>\n' +
            '    two // -two\n' +
            '        // +updated\n' +
            '  </span>\n' +
            '</div>', HtmlLikeUnexpected.DefaultWeights.STRING_CONTENT_MISMATCH);
        });

        it('diffs a component with child components with different tags', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'div', attribs: {}, children: ['one'] },
                { name: 'span', attribs: {}, children: ['two'] }
            ]
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: {}, children: ['one'] },
                { name: 'span', attribs: {}, children: ['two'] }
            ]
            }), 'to output with weight', '<div id="foo">\n' +
            '  <div // should be <span\n' +
            '  >\n' +
            '    one\n' +
            '  </div>\n' +
            '  <span>two</span>\n' +
            '</div>', HtmlLikeUnexpected.DefaultWeights.NAME_MISMATCH);
        });

        it('diffs a component with child components with different attributes', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                { name: 'span', attribs: {}, children: ['two'] }
            ]
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childbar' }, children: ['one'] },
                { name: 'span', attribs: {}, children: ['two'] }
            ]
            }), 'to output with weight', '<div id="foo">\n' +
            '  <span id="childfoo" // expected \'childfoo\' to equal \'childbar\'\n' +
            '                      //\n' +
            '                      // -childfoo\n' +
            '                      // +childbar\n' +
            '  >\n' +
            '    one\n' +
            '  </span>\n' +
            '  <span>two</span>\n' +
            '</div>', HtmlLikeUnexpected.DefaultWeights.ATTRIBUTE_MISMATCH);
        });

        it('diffs a component with a missing child', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }
            ]
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                { name: 'span', attribs: {}, children: ['two'] }
            ]
            }), 'to output with weight', '<div id="foo">\n' +
            '  <span id="childfoo">one</span>\n' +
            '  // missing <span>two</span>\n' +
            '</div>', HtmlLikeUnexpected.DefaultWeights.CHILD_MISSING);
        });

        it('diffs a component with an extra child', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                { name: 'span', attribs: {}, children: ['two'] }
            ]
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }
            ]
            }), 'to output with weight', '<div id="foo">\n' +
            '  <span id="childfoo">one</span>\n' +
            '  <span>two</span> // should be removed\n' +
            '</div>', HtmlLikeUnexpected.DefaultWeights.CHILD_INSERTED);
        });

        it('diffs a component with a child that is an element and should be a string', () => {

            // override the weight for NATIVE_NONNATIVE_MISMATCH, otherwise a wrapper is preferred
            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                { name: 'span', attribs: {}, children: ['two'] }
            ]
            }), 'when diffed as html with options against', { weights: { NATIVE_NONNATIVE_MISMATCH: 1 } }, createExpected({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                'some text'
            ]
            }), 'to output with weight', '<div id="foo">\n' +
            '  <span id="childfoo">one</span>\n' +
            "  <span>two</span> // should be 'some text'\n" +
            '</div>', // Overridden NATIVE_NONNATIVE_MISMATCH
            1);
        });

        it('lays out a diff where element should be wrapped but it all fits on one line', () => {

            return expect(createActual({
                name: 'div', attribs: {}, children: [
                'two'
            ]
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: {}, children: [
                { name: 'child', attribs: {}, children: ['aa' ] }
            ]
            }), 'to output with weight', '<div>\n' +
            '  two // should be <child>aa</child>\n' +
            '</div>', HtmlLikeUnexpected.DefaultWeights.NATIVE_NONNATIVE_MISMATCH);

        });

        it('diffs a component with a child that is an deep element and should be a string', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                { name: 'span', attribs: {}, children: [
                    { name: 'span', attribs: { className: 'deep' }, children: ['nested and broken over many lines because it is very long'] }
                ] }
            ]
            }), 'when diffed as html with options against', { weights: { NATIVE_NONNATIVE_MISMATCH: 1 } }, createExpected({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                'some text'
            ]
            }), 'to output with weight', '<div id="foo">\n' +
            '  <span id="childfoo">one</span>\n' +
            "  <span>                                                        // should be 'some text'\n" +
            '    <span className="deep">                                     //\n' +
            '      nested and broken over many lines because it is very long //\n' +
            '    </span>                                                     //\n' +
            '  </span>                                                       //\n' +
            '</div>', // Overridden weight to force a NATIVE_NONNATIVE_MISMATCH
            1);
        });

        it('diffs a component with a child that is a string and should be an element', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                'some text'
            ]
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                { name: 'span', attribs: {}, children: ['two'] }
            ]
            }), 'to output with weight', '<div id="foo">\n' +
            '  <span id="childfoo">one</span>\n' +
            '  some text // should be <span>two</span>\n' +
            '</div>', HtmlLikeUnexpected.DefaultWeights.NATIVE_NONNATIVE_MISMATCH);
        });

        it('diffs a component with a child that is a string and should be a deep multiline element', () => {

            return expect(createActual({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                'some text'
            ]
            }), 'when diffed as html against', createExpected({
                name: 'div', attribs: { id: 'foo' }, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                { name: 'span', attribs: {}, children: [
                    { name: 'span', attribs: { className: 'deep' }, children: [
                        'nested and broken over many lines because it is very long'
                    ] }
                ] }
            ]
            }), 'to output with weight', '<div id="foo">\n' +
            '  <span id="childfoo">one</span>\n' +
            '  some text // should be <span>\n' +
            '            //             <span className="deep">\n' +
            '            //               nested and broken over many lines because it is very long\n' +
            '            //             </span>\n' +
            '            //           </span>\n' +
            '</div>', HtmlLikeUnexpected.DefaultWeights.NATIVE_NONNATIVE_MISMATCH);
        });

        describe('with options', () => {

            describe('diffExtraAttributes', () => {

                it('accepts extra attributes when flag is false', () => {

                    return expect(createActual({
                        name: 'div', attribs: { id: 'foo' }, children: [
                            { name: 'span', attribs: { id: 'childfoo', extraAttribute: 'does not matter' }, children: ['one'] }
                        ]
                    }), 'when diffed as html with options against', { diffExtraAttributes: false }, createExpected({
                        name: 'div', attribs: { id: 'foo' }, children: [
                            { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }
                        ]
                    }), 'to have weight', HtmlLikeUnexpected.DefaultWeights.OK);

                });

                it('diffs extra attributes when flag is true', () => {

                    return expect(createActual({
                        name: 'div', attribs: { id: 'foo' }, children: [
                            { name: 'span', attribs: { id: 'childfoo', 'data-extraAttribute': 'does matter' }, children: ['one'] }
                        ]
                    }), 'when diffed as html with options against', { diffExtraAttributes: true }, createExpected({
                        name: 'div', attribs: { id: 'foo' }, children: [
                            { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }
                        ]
                    }), 'to output with weight', '<div id="foo">\n' +
                    '  <span id="childfoo"\n' +
                    '     data-extraAttribute="does matter" // data-extraAttribute should be removed\n' +
                    '  >\n' +
                    '    one\n' +
                    '  </span>\n' +
                    '</div>', HtmlLikeUnexpected.DefaultWeights.ATTRIBUTE_EXTRA);

                });
            });

            describe('diffRemovedAttributes', () => {

                it('diffs removed attributes when flag is true', () => {

                    return expect(createActual({
                        name: 'div', attribs: { id: 'foo' }, children: [
                            { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }
                        ]
                    }), 'when diffed as html with options against', { diffRemovedAttributes: true }, createExpected({
                        name: 'div', attribs: { id: 'foo' }, children: [
                            { name: 'span', attribs: { id: 'childfoo', removedAttribute: 'does matter' }, children: ['one'] }
                        ]
                    }), 'to output with weight', '<div id="foo">\n' +
                    '  <span id="childfoo" // missing removedAttribute="does matter"\n' +
                    '  >\n' +
                    '    one\n' +
                    '  </span>\n' +
                    '</div>', HtmlLikeUnexpected.DefaultWeights.ATTRIBUTE_MISSING);
                });

                it('ignores removed attributes when flag is false', () => {

                    return expect(createActual({
                        name: 'div', attribs: { id: 'foo' }, children: [
                            { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }
                        ]
                    }), 'when diffed as html with options against', { diffRemovedAttributes: false }, createExpected({
                        name: 'div', attribs: { id: 'foo' }, children: [
                            { name: 'span', attribs: { id: 'childfoo', 'data-removedAttribute': 'does matter' }, children: ['one'] }
                        ]
                    }), 'to output with weight', '<div id="foo"><span id="childfoo">one</span></div>', HtmlLikeUnexpected.DefaultWeights.OK);
                });
            });

            describe('diffMissingChildren', () => {

                it('diffs missing children when the flag is true', () => {

                    return expect(createActual({
                        name: 'div', attribs: { id: 'foo' }, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }
                    ]
                    }), 'when diffed as html with options against', { diffMissingChildren: true }, createExpected({
                        name: 'div', attribs: { id: 'foo' }, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                        { name: 'span', attribs: { id: 'removed-child' }, children: ['two'] }
                    ]
                    }), 'to output with weight', '<div id="foo">\n' +
                    '  <span id="childfoo">one</span>\n' +
                    '  // missing <span id="removed-child">two</span>\n' +
                    '</div>', HtmlLikeUnexpected.DefaultWeights.CHILD_MISSING);
                });

                it('ignores missing children when the flag is false', () => {

                    return expect(createActual({
                        name: 'div', attribs: { id: 'foo' }, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }
                    ]
                    }), 'when diffed as html with options against', { diffMissingChildren: false }, createExpected({
                        name: 'div', attribs: { id: 'foo' }, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                        { name: 'span', attribs: { id: 'removed-child' }, children: ['two'] }
                    ]
                    }), 'to output with weight', '<div id="foo"><span id="childfoo">one</span></div>', HtmlLikeUnexpected.DefaultWeights.OK);
                });
            });

            describe('diffExtraChildren', () => {

                it('diffs extra children when the flag is true', () => {

                    return expect(createActual({
                        name: 'div', attribs: { id: 'foo' }, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                        { name: 'span', attribs: { id: 'extra-child' }, children: ['two'] }
                    ]
                    }), 'when diffed as html with options against', { diffExtraChildren: true }, createExpected({
                        name: 'div', attribs: { id: 'foo' }, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }
                    ]
                    }), 'to output with weight', '<div id="foo">\n' +
                    '  <span id="childfoo">one</span>\n' +
                    '  <span id="extra-child">two</span> // should be removed\n' +
                    '</div>', HtmlLikeUnexpected.DefaultWeights.CHILD_INSERTED);
                });

                it('ignores extra children when the flag is false', () => {

                    return expect(createActual({
                        name: 'div', attribs: { id: 'foo' }, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                        { name: 'span', attribs: { id: 'extra-child' }, children: ['two'] }
                    ]
                    }), 'when diffed as html with options against', { diffExtraChildren: false }, createExpected({
                        name: 'div', attribs: { id: 'foo' }, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }
                    ]
                    }), 'to output with weight', '<div id="foo"><span id="childfoo">one</span><span id="extra-child">two</span></div>', HtmlLikeUnexpected.DefaultWeights.OK);
                });
            });
        });

        describe('wrappers', () => {

            it('identifies an extra wrapper component around a single child', () => {

                    return expect(createActual({
                        name: 'body', attribs: { id: 'main' }, children: [
                        {
                            name: 'div', attribs: { id: 'wrapper' }, children: [
                            { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }
                        ]
                        }
                    ]
                }), 'when diffed as html against', createExpected({
                        name: 'body', attribs: { id: 'main' }, children: [
                        {
                            name: 'span', attribs: { id: 'childfoo' }, children: ['one']
                        }
                        ]
                    }), 'to output with weight', '<body id="main">\n' +
                    '  <div id="wrapper"> // wrapper should be removed\n' +
                    '    <span id="childfoo">one</span>\n' +
                    '  </div> // wrapper should be removed\n' +
                    '</body>', HtmlLikeUnexpected.DefaultWeights.WRAPPER_REMOVED);
            });

            it('identifies an extra wrapper component around a many children', () => {

                return expect(createActual({
                    name: 'body', attribs: { id: 'main' }, children: [
                    {
                        name: 'div', attribs: { id: 'wrapper' }, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                    ]
                    }
                ]
                }), 'when diffed as html against', createExpected({
                    name: 'body', attribs: { id: 'main' }, children: [
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                ]
                }), 'to output with weight', '<body id="main">\n' +
                '  <div id="wrapper"> // wrapper should be removed\n' +
                '    <span id="childfoo">one</span><span id="childfoo">two</span>\n' +
                '  </div> // wrapper should be removed\n' +
                '</body>', HtmlLikeUnexpected.DefaultWeights.WRAPPER_REMOVED);
            });

            it('identifies an extra wrapper component around a many children with some minor changes', () => {

                return expect(createActual({
                    name: 'body', attribs: { id: 'main' }, children: [
                    {
                        name: 'div', attribs: { id: 'wrapper' }, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                    ]
                    }
                ]
                }), 'when diffed as html against', createExpected({
                    name: 'body', attribs: { id: 'main' }, children: [
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                    { name: 'span', attribs: { id: 'other' }, children: ['changed'] }
                ]
                }), 'to output with weight', '<body id="main">\n' +
                '  <div id="wrapper"> // wrapper should be removed\n' +
                '    <span id="childfoo">one</span>\n' +
                '    <span id="childfoo" // expected \'childfoo\' to equal \'other\'\n' +
                '                        //\n' +
                '                        // -childfoo\n' +
                '                        // +other\n' +
                '    >\n' +
                '      two // -two\n' +
                '          // +changed\n' +
                '    </span>\n' +
                '  </div> // wrapper should be removed\n' +
                '</body>', HtmlLikeUnexpected.DefaultWeights.WRAPPER_REMOVED +
                HtmlLikeUnexpected.DefaultWeights.ATTRIBUTE_MISMATCH +
                HtmlLikeUnexpected.DefaultWeights.STRING_CONTENT_MISMATCH);
            });

            it('identifies an extra wrapper component around each child', () => {

                return expect(createActual({
                    name: 'body', attribs: { id: 'main' }, children: [
                        { name: 'childWrapper', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }] },
                        { name: 'childWrapper', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }] }
                ]
                }), 'when diffed as html against', createExpected({
                    name: 'body', attribs: { id: 'main' }, children: [
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                ]
                }), 'to output with weight', '<body id="main">\n' +
                '  <childWrapper> // wrapper should be removed\n' +
                '    <span id="childfoo">one</span>\n' +
                '  </childWrapper> // wrapper should be removed\n' +
                '  <childWrapper> // wrapper should be removed\n' +
                '    <span id="childfoo">two</span>\n' +
                '  </childWrapper> // wrapper should be removed\n' +
                '</body>', HtmlLikeUnexpected.DefaultWeights.WRAPPER_REMOVED * 2);
            });

            it('identifies an extra wrapper component around each child with attributes', () => {

                return expect(createActual({
                    name: 'body', attribs: { id: 'main' }, children: [
                    { name: 'childWrapper', attribs: { id: 'wrapper1' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }] },
                    { name: 'childWrapper', attribs: { id: 'wrapper2' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }] }
                ]
                }), 'when diffed as html against', createExpected({
                    name: 'body', attribs: { id: 'main' }, children: [
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                ]
                }), 'to output with weight', '<body id="main">\n' +
                '  <childWrapper id="wrapper1"> // wrapper should be removed\n' +
                '    <span id="childfoo">one</span>\n' +
                '  </childWrapper> // wrapper should be removed\n' +
                '  <childWrapper id="wrapper2"> // wrapper should be removed\n' +
                '    <span id="childfoo">two</span>\n' +
                '  </childWrapper> // wrapper should be removed\n' +
                '</body>', HtmlLikeUnexpected.DefaultWeights.WRAPPER_REMOVED * 2);
            });

            it('ignores wrappers when using the diffWrappers=false flag', () => {

                return expect(createActual({
                    name: 'body', attribs: { id: 'main' }, children: [
                    { name: 'childWrapper', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }] },
                    { name: 'childWrapper', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }] }
                ]
                }), 'when diffed as html with options against', { diffWrappers: false }, createExpected({
                    name: 'body', attribs: { id: 'main' }, children: [
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                ]
                }), 'to output with weight', '<body id="main">\n' +
                '  <childWrapper>\n' +
                '    <span id="childfoo">one</span>\n' +
                '  </childWrapper>\n' +
                '  <childWrapper>\n' +
                '    <span id="childfoo">two</span>\n' +
                '  </childWrapper>\n' +
                '</body>', HtmlLikeUnexpected.DefaultWeights.OK);
            });

            // TODO: Skip 2 wrapper    MainComp -> wrapper1 -> wrapper2 -> expectedComp
            // Skip wrapper on main element    MainCompWrapper -> expected

            it('diffs a top level wrapper', () => {

                return expect(createActual({
                    name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [
                    {
                        name: 'TopLevel', attribs: {}, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                    ]
                    }
                ]
                }), 'when diffed as html against', createExpected({
                        name: 'TopLevel', attribs: {}, children: [
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                        { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                ]
                }), 'to output with weight', '<HigherOrderTopLevel id="main"> // wrapper should be removed\n' +
                '  <TopLevel><span id="childfoo">one</span><span id="childfoo">two</span></TopLevel>\n' +
                '</HigherOrderTopLevel> // wrapper should be removed', HtmlLikeUnexpected.DefaultWeights.WRAPPER_REMOVED);
            });

            it('diffs a two levels of top level wrapper', () => {

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
                }), 'when diffed as html against', createExpected({
                    name: 'MidLevel', attribs: {}, children: [
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                ]
                }), 'to output with weight', '<HigherOrderTopLevel id="main"> // wrapper should be removed\n' +
                '  <TopLevel> // wrapper should be removed\n' +
                '    <MidLevel><span id="childfoo">one</span><span id="childfoo">two</span></MidLevel>\n' +
                '  </TopLevel> // wrapper should be removed\n' +
                '</HigherOrderTopLevel> // wrapper should be removed', HtmlLikeUnexpected.DefaultWeights.WRAPPER_REMOVED * 2);
            });

            it('ignores two levels of top level wrapper when diffWrappers is false', () => {

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
                }), 'when diffed as html with options against', { diffWrappers: false }, createExpected({
                    name: 'MidLevel', attribs: {}, children: [
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                ]
                }), 'to output with weight', '<HigherOrderTopLevel id="main">\n' +
                '  <TopLevel>\n' +
                '    <MidLevel><span id="childfoo">one</span><span id="childfoo">two</span></MidLevel>\n' +
                '  </TopLevel>\n' +
                '</HigherOrderTopLevel>', HtmlLikeUnexpected.DefaultWeights.OK);
            });

            it('ignores mixed wrapper->real->wrapper when diffWrappers is false', () => {

                return expect(createActual({
                    name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [
                    {
                        name: 'TopLevel', attribs: { id: 'main' }, children: [
                        { name: 'MidLevel', attribs: {}, children: [
                            { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                            { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                        ] }
                    ]
                    }
                ]
                }), 'when diffed as html with options against', { diffWrappers: false }, createExpected({
                    name: 'TopLevel', attribs: { id: 'main' }, children: [
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['changed'] }
                ]
                }), 'to output with weight', '<HigherOrderTopLevel id="main">\n' +
                '  <TopLevel id="main">\n' +
                '    <MidLevel>\n' +
                '      <span id="childfoo">one</span>\n' +
                '      <span id="childfoo">\n' +
                '        two // -two\n' +
                '            // +changed\n' +
                '      </span>\n' +
                '    </MidLevel>\n' +
                '  </TopLevel>\n' +
                '</HigherOrderTopLevel>', HtmlLikeUnexpected.DefaultWeights.STRING_CONTENT_MISMATCH);
            });

            it('ignores two mid level wrappers when diffWrappers is false', () => {

                return expect(createActual({
                    name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [
                    {
                            name: 'MidLevel', attribs: {}, children: [
                            {
                                name: 'LowLevel', attribs: { id: 'lower' }, children: [
                                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                                { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                            ]
                            }
                    ]
                    }
                ]
                }), 'when diffed as html with options against', { diffWrappers: false }, createExpected({ name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [
                            { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                            { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                ]
                }), 'to output with weight', '<HigherOrderTopLevel id="main">\n' +
                '  <MidLevel>\n' +
                '    <LowLevel id="lower">\n' +
                '      <span id="childfoo">one</span><span id="childfoo">two</span>\n' +
                '    </LowLevel>\n' +
                '  </MidLevel>\n' +
                '</HigherOrderTopLevel>', HtmlLikeUnexpected.DefaultWeights.OK);
            });

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

        it('reports not found when no exact match exists', () => {

            return expect(createActual(
                { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
            ), 'when checked to contain', createExpected(
                { name: 'span', attribs: { className: 'foo' }, children: [ 'some other content'] }
            ), 'to satisfy', { found: false });
        });


        it('outputs a best match when the content is different', () => {

            return expect(createActual({ name: 'div', attribs: {}, children: [
                { name: 'span', attribs: { className: 'foo' }, children: [ 'some different content' ] }
            ]
            }), 'when checked to contain', createExpected(
                { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
            ), 'to output', '<span className="foo">\n' +
            '  some different content // -some different content\n' +
            '                         // +some content\n' +
            '</span>');
        });

        it('ignores wrappers when diffWrappers:false', () => {

            return expect(createActual({ name: 'body', attribs: {}, children: [

                { name: 'div', attribs: {}, children:
                    [
                        {
                            name: 'wrapper', attribs: { className: 'the-wrapper' },
                            children:
                                [
                                    { name: 'span', attribs: { className: 'foo' }, children: ['some content'] }
                                ]

                        }
                    ]
                }
            ] }), 'when checked with options to contain', { diffWrappers: false }, createExpected({ name: 'div', attribs: {}, children: [
                { name: 'span', attribs: { className: 'foo' }, children: [ 'some content'] }
            ] }), 'to satisfy', { found: true });

        });

        it('outputs wrappers when diffWrappers:false', () => {

            return expect(createActual({
                name: 'body', attribs: {}, children: [

                {
                    name: 'div', attribs: {}, children: [
                    {
                        name: 'wrapper', attribs: { className: 'the-wrapper' },
                        children: [
                            { name: 'span', attribs: { className: 'foo' }, children: ['some different content'] }
                        ]

                    }
                ]
                }
            ]
            }), 'when checked with options to contain', { diffWrappers: false }, createExpected({
                name: 'div', attribs: {}, children: [
                { name: 'span', attribs: { className: 'foo' }, children: ['some content'] }
            ]
            }), 'to output', '<div>\n' +
            '  <wrapper className="the-wrapper">\n' +
            '    <span className="foo">\n' +
            '      some different content // -some different content\n' +
            '                             // +some content\n' +
            '    </span>\n' +
            '  </wrapper>\n' +
            '</div>');
        });

    });

    describe('expect.it', () => {

        it('outputs the output from an expect.it attribute assertion', () => {

            // This is nested deliberately, to ensure the deep promise is checked properly
            return expect(createActual({
                    name: 'TopLevel', attribs: {}, children: [
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                    { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
                ]
            }), 'when diffed as html against', createExpected({
                name: 'TopLevel', attribs: {}, children: [
                { name: 'span', attribs: { id: expect.it('to match', /[a-f]+$/) }, children: ['one'] },
                { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
            ]
            }), 'to output with weight', '<TopLevel>\n' +
            '  <span id="childfoo" // expected \'childfoo\' to match /[a-f]+$/\n' +
            '  >\n' +
            '    one\n' +
            '  </span>\n' +
            '  <span id="childfoo">two</span>\n' +
            '</TopLevel>', HtmlLikeUnexpected.DefaultWeights.ATTRIBUTE_MISMATCH);
        });

        it('outputs the output from an expect.it attribute assertion with two clauses', () => {

            return expect(createActual({
                name: 'TopLevel', attribs: {}, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
            ]
            }), 'when diffed as html against', createExpected({
                name: 'TopLevel', attribs: {}, children: [
                { name: 'span', attribs: { id: expect.it('to match', /[a-f]+$/).and('to have length', 8) }, children: ['one'] },
                { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
            ]
            }), 'to output with weight', '<TopLevel>\n' +
            '  <span id="childfoo" // ⨯ expected \'childfoo\' to match /[a-f]+$/ and\n' +
            '                      // ✓ expected \'childfoo\' to have length 8\n' +
            '  >\n' +
            '    one\n' +
            '  </span>\n' +
            '  <span id="childfoo">two</span>\n' +
            '</TopLevel>', HtmlLikeUnexpected.DefaultWeights.ATTRIBUTE_MISMATCH);
        });


        it('outputs the output from an expect.it attribute assertion with two clauses', () => {

            return expect(createActual({
                name: 'TopLevel', attribs: {}, children: [
                { name: 'span', attribs: { id: 'childfoo' }, children: ['one'] },
                { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
            ]
            }), 'when diffed as html against', createExpected({
                name: 'TopLevel', attribs: {}, children: [
                { name: 'span', attribs: { id: expect.it('to match', /[a-f]+$/).and('to have length', 8) }, children: ['one'] },
                { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }
            ]
            }), 'to output with weight', '<TopLevel>\n' +
            '  <span id="childfoo" // ⨯ expected \'childfoo\' to match /[a-f]+$/ and\n' +
            '                      // ✓ expected \'childfoo\' to have length 8\n' +
            '  >\n' +
            '    one\n' +
            '  </span>\n' +
            '  <span id="childfoo">two</span>\n' +
            '</TopLevel>', HtmlLikeUnexpected.DefaultWeights.ATTRIBUTE_MISMATCH);
        });

        it('outputs the output from an asynchronous expect.it attribute assertion that fails', () => {

            return expect(
                createActual({ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }),
                'when diffed as html against',
                createExpected(
                    { name: 'span', attribs: { id: expect.it('to eventually have value', 'not childfoo') }, children: ['one'] }
                ),
                'to output with weight',
                '<span id="childfoo" // expected \'childfoo\' to eventually have value \'not childfoo\'\n' +
                '>\n' +
                '  one\n' +
                '</span>',
                HtmlLikeUnexpected.DefaultWeights.ATTRIBUTE_MISMATCH
            );
        });

        it('outputs the output from an asynchronous expect.it attribute assertion that passes', () => {

            return expect(
                createActual({ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }),
                'when diffed as html against',
                createExpected(
                    { name: 'span', attribs: { id: expect.it('to eventually have value', 'childfoo') }, children: ['one'] }
                ),
                'to output with weight',
                '<span id="childfoo">one</span>',
                HtmlLikeUnexpected.DefaultWeights.OK
            );
        });

        it('outputs the output from an asynchronous expect.it content assertion that fails', () => {

            return expect(
                createActual({ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }),
                'when diffed as html against',
                createExpected(
                    { name: 'span', attribs: { id: 'childfoo' }, children: [ expect.it('to eventually have value', 'not one') ] }
                ),
                'to output with weight',
                '<span id="childfoo">\n' +
                "  one // expected 'one' to eventually have value 'not one'\n" +
                '</span>',
                HtmlLikeUnexpected.DefaultWeights.STRING_CONTENT_MISMATCH
            );
        });

        it('outputs the output from an asynchronous expect.it content assertion that passes', () => {

            return expect(
                createActual({ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }),
                'when diffed as html against',
                createExpected(
                    { name: 'span', attribs: { id: 'childfoo' }, children: [ expect.it('to eventually have value', 'one') ] }
                ),
                'to output with weight',
                '<span id="childfoo">one</span>',
                HtmlLikeUnexpected.DefaultWeights.OK
            );
        });

        it('works out which children match best, with asynchronous expect.it assertions in the children', () => {
            return expect(createActual({ name: 'div', attribs: {}, children: [
                { name: 'span', attribs: {}, children: [ 'one' ] },
                { name: 'span', attribs: {}, children: [ 'two' ] },
                { name: 'span', attribs: {}, children: [ 'four' ] }
            ] }), 'when diffed as html against', createExpected({ name: 'div', attribs: {}, children: [
                { name: 'span', attribs: {}, children: [ expect.it('to eventually have value', 'one') ] },
                { name: 'span', attribs: {}, children: [ expect.it('to eventually have value', 'two') ] },
                { name: 'span', attribs: {}, children: [ expect.it('to eventually have value', 'three') ] },
                { name: 'span', attribs: {}, children: [ expect.it('to eventually have value', 'four') ] }
            ] }), 'to output with weight', '<div>\n' +
            '  <span>one</span>\n' +
            '  <span>two</span>\n' +
            '  // missing <span>{expect.it(\'to eventually have value\', \'three\')}</span>\n' +
            '  <span>four</span>\n' +
            '</div>', HtmlLikeUnexpected.DefaultWeights.CHILD_MISSING);
        });
    });
});


/* These are the integration tests for unexpected-htmllike
 * They confirm that diff, contains and painter work together correctly
 */

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

var _magicpen = require('magicpen');

var _magicpen2 = _interopRequireDefault(_magicpen);

var _magicpenPrism = require('magicpen-prism');

var _magicpenPrism2 = _interopRequireDefault(_magicpenPrism);

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _diff = require('../diff');

var _diff2 = _interopRequireDefault(_diff);

var _mockExtensions = require('./mock-extensions');

var _mockExtensions2 = _interopRequireDefault(_mockExtensions);

var _mockEntities = require('./mockEntities');

var expect = _unexpected2['default'].clone().use(_mockExtensions2['default']);

expect.output.preferredWidth = 80;

var prismPen = (0, _magicpen2['default'])();
prismPen.use(_magicpenPrism2['default']);

describe('HtmlLikeComponent', function () {

    it('outputs a formatted output with no children', function () {
        expect((0, _mockEntities.createActual)({ name: 'div', attribs: { id: 'foo', className: 'bar' }, children: [] }), 'to inspect as', '<div id="foo" className="bar" />');
    });

    it('outputs a formatted output with children', function () {

        expect((0, _mockEntities.createActual)({
            name: 'div', attribs: { id: 'foo', className: 'bar' }, children: [{
                name: 'span',
                attribs: { className: 'child1' },
                children: ['child content 1']
            }, {
                name: 'span',
                attribs: { className: 'child2' },
                children: ['child content 2']
            }]
        }), 'to inspect as', '<div id="foo" className="bar">\n' + '  <span className="child1">child content 1</span>\n' + '  <span className="child2">child content 2</span>\n' + '</div>');
    });

    it('outputs object attributes', function () {
        expect((0, _mockEntities.createActual)({
            name: 'div', attribs: { style: { width: 125, height: 100 } }, children: []
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

    it('outputs deeply nested children over multiple lines', function () {

        expect((0, _mockEntities.createActual)({
            name: 'div', attribs: { id: 'outside-wrapper', className: 'wrap-me' }, children: [{
                name: 'div', attribs: { id: 'foo', className: 'bar' }, children: [{
                    name: 'span',
                    attribs: { className: 'child1' },
                    children: ['child content 1']
                }, {
                    name: 'span',
                    attribs: { className: 'child2' },
                    children: ['child content 2']
                }]
            }]
        }), 'to inspect as', '<div id="outside-wrapper" className="wrap-me">\n' + '  <div id="foo" className="bar">\n' + '    <span className="child1">child content 1</span>\n' + '    <span className="child2">child content 2</span>\n' + '  </div>\n' + '</div>');
    });

    it('outputs children on a single line if it fits', function () {

        expect((0, _mockEntities.createActual)({
            name: 'div', attribs: { id: 'foo', className: 'bar' }, children: [{
                name: 'span',
                children: ['1']
            }, {
                name: 'span',
                children: ['2']
            }]
        }), 'to inspect as', '<div id="foo" className="bar"><span>1</span><span>2</span></div>');
    });

    it('outputs attributes on split lines if they are too long, with no content', function () {
        expect((0, _mockEntities.createActual)({
            name: 'div', attribs: {
                id: 'foo',
                className: 'bar blah mcgar',
                'data-role': 'special-long-button',
                'data-special': 'some other long attrib'
            },
            children: []
        }), 'to inspect as', '<div id="foo" className="bar blah mcgar" data-role="special-long-button"\n' + '   data-special="some other long attrib"\n' + '/>');
    });

    it('outputs attributes on split lines if they are too long, with content', function () {
        expect((0, _mockEntities.createActual)({
            name: 'div', attribs: {
                id: 'foo',
                className: 'bar blah mcgar',
                'data-role': 'special-long-button',
                'data-special': 'some other long attrib'
            },
            children: ['some content']
        }), 'to inspect as', '<div id="foo" className="bar blah mcgar" data-role="special-long-button"\n' + '   data-special="some other long attrib">\n' + '  some content\n' + '</div>');
    });

    describe('diff', function () {

        it('gets the weight correct for a single component with a different attribute', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: []
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'bar' }, children: []
            }), 'to have weight', _index2['default'].DefaultWeights.ATTRIBUTE_MISMATCH);
        });

        it('outputs the diff of a single component with a different attribute', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: []
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'bar' }, children: []
            }), 'to output', "<div id=\"foo\" // expected 'foo' to equal 'bar'\n" + '              //\n' + '              // -foo\n' + '              // +bar\n' + '/>');
        });

        it('outputs attributes that are different types but evaluate to the same string', function () {
            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: '42' }, children: []
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 42 }, children: []
            }), 'to output with weight', '<div id="42" // expected \'42\' to equal 42\n' + '/>', _diff2['default'].DefaultWeights.ATTRIBUTE_MISMATCH);
        });

        it('outputs the diff of a single component with a different attribute and a matching attribute after', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo', className: 'testing' }, children: []
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'bar', className: 'testing' }, children: []
            }), 'to output', '<div id="foo" // expected \'foo\' to equal \'bar\'\n' + '              //\n' + '              // -foo\n' + '              // +bar\n' + '   className="testing"\n' + '/>');
        });

        it('outputs the diff of a single component with a different attribute and a matching attribute before', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { className: 'testing', id: 'foo' }, children: []
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { className: 'testing', id: 'bar' }, children: []
            }), 'to output', '<div className="testing" id="foo" // expected \'foo\' to equal \'bar\'\n' + '                                  //\n' + '                                  // -foo\n' + '                                  // +bar\n' + '/>');
        });

        it('breaks the output if there are lots of matching attributes', function () {

            var attribs = {
                'data-attrib1': 'aaa',
                'data-attrib2': 'hello world',
                'data-attrib3': 'testing is fun',
                'data-attrib4': 'hallo welt',
                'data-attrib5': 'jonny number five'
            };

            var afterAttribs = {
                'data-after': 'bbb',
                'data-after2': 'ccc some more words',
                'data-after3': 'here is some more'
            };
            var actualAttribs = (0, _objectAssign2['default'])({}, attribs, { 'data-mismatch': 'foo' }, afterAttribs);
            var expectedAttribs = (0, _objectAssign2['default'])({}, attribs, { 'data-mismatch': 'bar' }, afterAttribs);

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: actualAttribs, children: []
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: expectedAttribs, children: []
            }), 'to output', '<div data-attrib1="aaa" data-attrib2="hello world" data-attrib3="testing is fun"\n' + '   data-attrib4="hallo welt" data-attrib5="jonny number five"\n' + '   data-mismatch="foo" // expected \'foo\' to equal \'bar\'\n' + '                       //\n' + '                       // -foo\n' + '                       // +bar\n' + '   data-after="bbb" data-after2="ccc some more words"\n' + '   data-after3="here is some more"\n' + '/>');
        });

        it('highlights a missing attribute', function () {
            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: []
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { className: 'testing', id: 'foo' }, children: []
            }), 'to output', '<div id="foo" // missing className="testing"\n' + '/>');
        });

        it('highlights two missing attributes', function () {
            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: []
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { className: 'testing', id: 'foo', extra: '123' }, children: []
            }), 'to output', '<div id="foo" // missing className="testing"\n' + '   // missing extra="123"\n' + '/>');
        });

        it('diffs a component with a single text child', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: ['abc']
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'foo' }, children: ['def']
            }), 'to output with weight', '<div id="foo">\n' + '  abc // -abc\n' + '      // +def\n' + '</div>', _index2['default'].DefaultWeights.STRING_CONTENT_MISMATCH);
        });

        it('diffs a component with mismatching content types', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: ['42']
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'foo' }, children: [42]
            }), 'to output with weight', '<div id="foo">\n' + '  42 // mismatched type -string\n' + '     //                 +number\n' + '</div>', _index2['default'].DefaultWeights.CONTENT_TYPE_MISMATCH);
        });

        it('diffs a component with child components with different content', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: {}, children: ['one'] }, { name: 'span', attribs: {}, children: ['two'] }]
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: {}, children: ['one'] }, { name: 'span', attribs: {}, children: ['updated'] }]
            }), 'to output with weight', '<div id="foo">\n' + '  <span>one</span>\n' + '  <span>\n' + '    two // -two\n' + '        // +updated\n' + '  </span>\n' + '</div>', _index2['default'].DefaultWeights.STRING_CONTENT_MISMATCH);
        });

        it('diffs a component with child components with different tags', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'div', attribs: {}, children: ['one'] }, { name: 'span', attribs: {}, children: ['two'] }]
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: {}, children: ['one'] }, { name: 'span', attribs: {}, children: ['two'] }]
            }), 'to output with weight', '<div id="foo">\n' + '  <div // should be <span\n' + '  >\n' + '    one\n' + '  </div>\n' + '  <span>two</span>\n' + '</div>', _index2['default'].DefaultWeights.NAME_MISMATCH);
        });

        it('diffs a component with child components with different attributes', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: {}, children: ['two'] }]
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childbar' }, children: ['one'] }, { name: 'span', attribs: {}, children: ['two'] }]
            }), 'to output with weight', '<div id="foo">\n' + '  <span id="childfoo" // expected \'childfoo\' to equal \'childbar\'\n' + '                      //\n' + '                      // -childfoo\n' + '                      // +childbar\n' + '  >\n' + '    one\n' + '  </span>\n' + '  <span>two</span>\n' + '</div>', _index2['default'].DefaultWeights.ATTRIBUTE_MISMATCH);
        });

        it('diffs a component with a missing child', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }]
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: {}, children: ['two'] }]
            }), 'to output with weight', '<div id="foo">\n' + '  <span id="childfoo">one</span>\n' + '  // missing <span>two</span>\n' + '</div>', _index2['default'].DefaultWeights.CHILD_MISSING);
        });

        it('diffs a component with an extra child', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: {}, children: ['two'] }]
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }]
            }), 'to output with weight', '<div id="foo">\n' + '  <span id="childfoo">one</span>\n' + '  <span>two</span> // should be removed\n' + '</div>', _index2['default'].DefaultWeights.CHILD_INSERTED);
        });

        it('diffs a component with a child that is an element and should be a string', function () {

            // override the weight for NATIVE_NONNATIVE_MISMATCH, otherwise a wrapper is preferred
            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: {}, children: ['two'] }]
            }), 'when diffed as html with options against', { weights: { NATIVE_NONNATIVE_MISMATCH: 1 } }, (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, 'some text']
            }), 'to output with weight', '<div id="foo">\n' + '  <span id="childfoo">one</span>\n' + "  <span>two</span> // should be 'some text'\n" + '</div>', // Overridden NATIVE_NONNATIVE_MISMATCH
            1);
        });

        it('lays out a diff where element should be wrapped but it all fits on one line', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: {}, children: ['two']
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: {}, children: [{ name: 'child', attribs: {}, children: ['aa'] }]
            }), 'to output with weight', '<div>\n' + '  two // should be <child>aa</child>\n' + '</div>', _index2['default'].DefaultWeights.NATIVE_NONNATIVE_MISMATCH);
        });

        it('diffs a component with a child that is an deep element and should be a string', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: {}, children: [{ name: 'span', attribs: { className: 'deep' }, children: ['nested and broken over many lines because it is very long'] }] }]
            }), 'when diffed as html with options against', { weights: { NATIVE_NONNATIVE_MISMATCH: 1 } }, (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, 'some text']
            }), 'to output with weight', '<div id="foo">\n' + '  <span id="childfoo">one</span>\n' + "  <span>                                                        // should be 'some text'\n" + '    <span className="deep">                                     //\n' + '      nested and broken over many lines because it is very long //\n' + '    </span>                                                     //\n' + '  </span>                                                       //\n' + '</div>', // Overridden weight to force a NATIVE_NONNATIVE_MISMATCH
            1);
        });

        it('diffs a component with a child that is a string and should be an element', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, 'some text']
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: {}, children: ['two'] }]
            }), 'to output with weight', '<div id="foo">\n' + '  <span id="childfoo">one</span>\n' + '  some text // should be <span>two</span>\n' + '</div>', _index2['default'].DefaultWeights.NATIVE_NONNATIVE_MISMATCH);
        });

        it('diffs a component with a child that is a string and should be a deep multiline element', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, 'some text']
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: {}, children: [{ name: 'span', attribs: { className: 'deep' }, children: ['nested and broken over many lines because it is very long'] }] }]
            }), 'to output with weight', '<div id="foo">\n' + '  <span id="childfoo">one</span>\n' + '  some text // should be <span>\n' + '            //             <span className="deep">\n' + '            //               nested and broken over many lines because it is very long\n' + '            //             </span>\n' + '            //           </span>\n' + '</div>', _index2['default'].DefaultWeights.NATIVE_NONNATIVE_MISMATCH);
        });

        describe('with options', function () {

            describe('diffExtraAttributes', function () {

                it('accepts extra attributes when flag is false', function () {

                    return expect((0, _mockEntities.createActual)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo', extraAttribute: 'does not matter' }, children: ['one'] }]
                    }), 'when diffed as html with options against', { diffExtraAttributes: false }, (0, _mockEntities.createExpected)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }]
                    }), 'to have weight', _index2['default'].DefaultWeights.OK);
                });

                it('diffs extra attributes when flag is true', function () {

                    return expect((0, _mockEntities.createActual)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo', 'data-extraAttribute': 'does matter' }, children: ['one'] }]
                    }), 'when diffed as html with options against', { diffExtraAttributes: true }, (0, _mockEntities.createExpected)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }]
                    }), 'to output with weight', '<div id="foo">\n' + '  <span id="childfoo"\n' + '     data-extraAttribute="does matter" // data-extraAttribute should be removed\n' + '  >\n' + '    one\n' + '  </span>\n' + '</div>', _index2['default'].DefaultWeights.ATTRIBUTE_EXTRA);
                });
            });

            describe('diffRemovedAttributes', function () {

                it('diffs removed attributes when flag is true', function () {

                    return expect((0, _mockEntities.createActual)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }]
                    }), 'when diffed as html with options against', { diffRemovedAttributes: true }, (0, _mockEntities.createExpected)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo', removedAttribute: 'does matter' }, children: ['one'] }]
                    }), 'to output with weight', '<div id="foo">\n' + '  <span id="childfoo" // missing removedAttribute="does matter"\n' + '  >\n' + '    one\n' + '  </span>\n' + '</div>', _index2['default'].DefaultWeights.ATTRIBUTE_MISSING);
                });

                it('ignores removed attributes when flag is false', function () {

                    return expect((0, _mockEntities.createActual)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }]
                    }), 'when diffed as html with options against', { diffRemovedAttributes: false }, (0, _mockEntities.createExpected)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo', 'data-removedAttribute': 'does matter' }, children: ['one'] }]
                    }), 'to output with weight', '<div id="foo"><span id="childfoo">one</span></div>', _index2['default'].DefaultWeights.OK);
                });
            });

            describe('diffMissingChildren', function () {

                it('diffs missing children when the flag is true', function () {

                    return expect((0, _mockEntities.createActual)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }]
                    }), 'when diffed as html with options against', { diffMissingChildren: true }, (0, _mockEntities.createExpected)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'removed-child' }, children: ['two'] }]
                    }), 'to output with weight', '<div id="foo">\n' + '  <span id="childfoo">one</span>\n' + '  // missing <span id="removed-child">two</span>\n' + '</div>', _index2['default'].DefaultWeights.CHILD_MISSING);
                });

                it('ignores missing children when the flag is false', function () {

                    return expect((0, _mockEntities.createActual)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }]
                    }), 'when diffed as html with options against', { diffMissingChildren: false }, (0, _mockEntities.createExpected)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'removed-child' }, children: ['two'] }]
                    }), 'to output with weight', '<div id="foo"><span id="childfoo">one</span></div>', _index2['default'].DefaultWeights.OK);
                });
            });

            describe('diffExtraChildren', function () {

                it('diffs extra children when the flag is true', function () {

                    return expect((0, _mockEntities.createActual)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'extra-child' }, children: ['two'] }]
                    }), 'when diffed as html with options against', { diffExtraChildren: true }, (0, _mockEntities.createExpected)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }]
                    }), 'to output with weight', '<div id="foo">\n' + '  <span id="childfoo">one</span>\n' + '  <span id="extra-child">two</span> // should be removed\n' + '</div>', _index2['default'].DefaultWeights.CHILD_INSERTED);
                });

                it('ignores extra children when the flag is false', function () {

                    return expect((0, _mockEntities.createActual)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'extra-child' }, children: ['two'] }]
                    }), 'when diffed as html with options against', { diffExtraChildren: false }, (0, _mockEntities.createExpected)({
                        name: 'div', attribs: { id: 'foo' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }]
                    }), 'to output with weight', '<div id="foo"><span id="childfoo">one</span><span id="extra-child">two</span></div>', _index2['default'].DefaultWeights.OK);
                });
            });
        });

        describe('wrappers', function () {

            it('identifies an extra wrapper component around a single child', function () {

                return expect((0, _mockEntities.createActual)({
                    name: 'body', attribs: { id: 'main' }, children: [{
                        name: 'div', attribs: { id: 'wrapper' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }]
                    }]
                }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                    name: 'body', attribs: { id: 'main' }, children: [{
                        name: 'span', attribs: { id: 'childfoo' }, children: ['one']
                    }]
                }), 'to output with weight', '<body id="main">\n' + '  <div id="wrapper"> // wrapper should be removed\n' + '    <span id="childfoo">one</span>\n' + '  </div> // wrapper should be removed\n' + '</body>', _index2['default'].DefaultWeights.WRAPPER_REMOVED);
            });

            it('identifies an extra wrapper component around a many children', function () {

                return expect((0, _mockEntities.createActual)({
                    name: 'body', attribs: { id: 'main' }, children: [{
                        name: 'div', attribs: { id: 'wrapper' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                    }]
                }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                    name: 'body', attribs: { id: 'main' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                }), 'to output with weight', '<body id="main">\n' + '  <div id="wrapper"> // wrapper should be removed\n' + '    <span id="childfoo">one</span><span id="childfoo">two</span>\n' + '  </div> // wrapper should be removed\n' + '</body>', _index2['default'].DefaultWeights.WRAPPER_REMOVED);
            });

            it('identifies an extra wrapper component around a many children with some minor changes', function () {

                return expect((0, _mockEntities.createActual)({
                    name: 'body', attribs: { id: 'main' }, children: [{
                        name: 'div', attribs: { id: 'wrapper' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                    }]
                }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                    name: 'body', attribs: { id: 'main' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'other' }, children: ['changed'] }]
                }), 'to output with weight', '<body id="main">\n' + '  <div id="wrapper"> // wrapper should be removed\n' + '    <span id="childfoo">one</span>\n' + '    <span id="childfoo" // expected \'childfoo\' to equal \'other\'\n' + '                        //\n' + '                        // -childfoo\n' + '                        // +other\n' + '    >\n' + '      two // -two\n' + '          // +changed\n' + '    </span>\n' + '  </div> // wrapper should be removed\n' + '</body>', _index2['default'].DefaultWeights.WRAPPER_REMOVED + _index2['default'].DefaultWeights.ATTRIBUTE_MISMATCH + _index2['default'].DefaultWeights.STRING_CONTENT_MISMATCH);
            });

            it('identifies an extra wrapper component around each child', function () {

                return expect((0, _mockEntities.createActual)({
                    name: 'body', attribs: { id: 'main' }, children: [{ name: 'childWrapper', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }] }, { name: 'childWrapper', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }] }]
                }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                    name: 'body', attribs: { id: 'main' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                }), 'to output with weight', '<body id="main">\n' + '  <childWrapper> // wrapper should be removed\n' + '    <span id="childfoo">one</span>\n' + '  </childWrapper> // wrapper should be removed\n' + '  <childWrapper> // wrapper should be removed\n' + '    <span id="childfoo">two</span>\n' + '  </childWrapper> // wrapper should be removed\n' + '</body>', _index2['default'].DefaultWeights.WRAPPER_REMOVED * 2);
            });

            it('identifies an extra wrapper component around each child with attributes', function () {

                return expect((0, _mockEntities.createActual)({
                    name: 'body', attribs: { id: 'main' }, children: [{ name: 'childWrapper', attribs: { id: 'wrapper1' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }] }, { name: 'childWrapper', attribs: { id: 'wrapper2' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }] }]
                }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                    name: 'body', attribs: { id: 'main' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                }), 'to output with weight', '<body id="main">\n' + '  <childWrapper id="wrapper1"> // wrapper should be removed\n' + '    <span id="childfoo">one</span>\n' + '  </childWrapper> // wrapper should be removed\n' + '  <childWrapper id="wrapper2"> // wrapper should be removed\n' + '    <span id="childfoo">two</span>\n' + '  </childWrapper> // wrapper should be removed\n' + '</body>', _index2['default'].DefaultWeights.WRAPPER_REMOVED * 2);
            });

            it('ignores wrappers when using the diffWrappers=false flag', function () {

                return expect((0, _mockEntities.createActual)({
                    name: 'body', attribs: { id: 'main' }, children: [{ name: 'childWrapper', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }] }, { name: 'childWrapper', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }] }]
                }), 'when diffed as html with options against', { diffWrappers: false }, (0, _mockEntities.createExpected)({
                    name: 'body', attribs: { id: 'main' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                }), 'to output with weight', '<body id="main">\n' + '  <childWrapper>\n' + '    <span id="childfoo">one</span>\n' + '  </childWrapper>\n' + '  <childWrapper>\n' + '    <span id="childfoo">two</span>\n' + '  </childWrapper>\n' + '</body>', _index2['default'].DefaultWeights.OK);
            });

            // TODO: Skip 2 wrapper    MainComp -> wrapper1 -> wrapper2 -> expectedComp
            // Skip wrapper on main element    MainCompWrapper -> expected

            it('diffs a top level wrapper', function () {

                return expect((0, _mockEntities.createActual)({
                    name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [{
                        name: 'TopLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                    }]
                }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                    name: 'TopLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                }), 'to output with weight', '<HigherOrderTopLevel id="main"> // wrapper should be removed\n' + '  <TopLevel><span id="childfoo">one</span><span id="childfoo">two</span></TopLevel>\n' + '</HigherOrderTopLevel> // wrapper should be removed', _index2['default'].DefaultWeights.WRAPPER_REMOVED);
            });

            it('diffs a two levels of top level wrapper', function () {

                return expect((0, _mockEntities.createActual)({
                    name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [{
                        name: 'TopLevel', attribs: {}, children: [{ name: 'MidLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }] }]
                    }]
                }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                    name: 'MidLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                }), 'to output with weight', '<HigherOrderTopLevel id="main"> // wrapper should be removed\n' + '  <TopLevel> // wrapper should be removed\n' + '    <MidLevel><span id="childfoo">one</span><span id="childfoo">two</span></MidLevel>\n' + '  </TopLevel> // wrapper should be removed\n' + '</HigherOrderTopLevel> // wrapper should be removed', _index2['default'].DefaultWeights.WRAPPER_REMOVED * 2);
            });

            it('ignores two levels of top level wrapper when diffWrappers is false', function () {

                return expect((0, _mockEntities.createActual)({
                    name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [{
                        name: 'TopLevel', attribs: {}, children: [{ name: 'MidLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }] }]
                    }]
                }), 'when diffed as html with options against', { diffWrappers: false }, (0, _mockEntities.createExpected)({
                    name: 'MidLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                }), 'to output with weight', '<HigherOrderTopLevel id="main">\n' + '  <TopLevel>\n' + '    <MidLevel><span id="childfoo">one</span><span id="childfoo">two</span></MidLevel>\n' + '  </TopLevel>\n' + '</HigherOrderTopLevel>', _index2['default'].DefaultWeights.OK);
            });

            it('ignores mixed wrapper->real->wrapper when diffWrappers is false', function () {

                return expect((0, _mockEntities.createActual)({
                    name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [{
                        name: 'TopLevel', attribs: { id: 'main' }, children: [{ name: 'MidLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }] }]
                    }]
                }), 'when diffed as html with options against', { diffWrappers: false }, (0, _mockEntities.createExpected)({
                    name: 'TopLevel', attribs: { id: 'main' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['changed'] }]
                }), 'to output with weight', '<HigherOrderTopLevel id="main">\n' + '  <TopLevel id="main">\n' + '    <MidLevel>\n' + '      <span id="childfoo">one</span>\n' + '      <span id="childfoo">\n' + '        two // -two\n' + '            // +changed\n' + '      </span>\n' + '    </MidLevel>\n' + '  </TopLevel>\n' + '</HigherOrderTopLevel>', _index2['default'].DefaultWeights.STRING_CONTENT_MISMATCH);
            });

            it('ignores two mid level wrappers when diffWrappers is false', function () {

                return expect((0, _mockEntities.createActual)({
                    name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [{
                        name: 'MidLevel', attribs: {}, children: [{
                            name: 'LowLevel', attribs: { id: 'lower' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                        }]
                    }]
                }), 'when diffed as html with options against', { diffWrappers: false }, (0, _mockEntities.createExpected)({ name: 'HigherOrderTopLevel', attribs: { id: 'main' }, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
                }), 'to output with weight', '<HigherOrderTopLevel id="main">\n' + '  <MidLevel>\n' + '    <LowLevel id="lower">\n' + '      <span id="childfoo">one</span><span id="childfoo">two</span>\n' + '    </LowLevel>\n' + '  </MidLevel>\n' + '</HigherOrderTopLevel>', _index2['default'].DefaultWeights.OK);
            });
        });
    });

    describe('contains', function () {

        it('finds an exact match', function () {
            return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'when checked to contain', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'to satisfy', { found: true });
        });

        it('reports not found when no exact match exists', function () {

            return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'when checked to contain', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some other content'] }), 'to satisfy', { found: false });
        });

        it('outputs a best match when the content is different', function () {

            return expect((0, _mockEntities.createActual)({ name: 'div', attribs: {}, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some different content'] }]
            }), 'when checked to contain', (0, _mockEntities.createExpected)({ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }), 'to output', '<span className="foo">\n' + '  some different content // -some different content\n' + '                         // +some content\n' + '</span>');
        });

        it('ignores wrappers when diffWrappers:false', function () {

            return expect((0, _mockEntities.createActual)({ name: 'body', attribs: {}, children: [{ name: 'div', attribs: {}, children: [{
                        name: 'wrapper', attribs: { className: 'the-wrapper' },
                        children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }]

                    }]
                }] }), 'when checked with options to contain', { diffWrappers: false }, (0, _mockEntities.createExpected)({ name: 'div', attribs: {}, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }] }), 'to satisfy', { found: true });
        });

        it('outputs wrappers when diffWrappers:false', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'body', attribs: {}, children: [{
                    name: 'div', attribs: {}, children: [{
                        name: 'wrapper', attribs: { className: 'the-wrapper' },
                        children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some different content'] }]

                    }]
                }]
            }), 'when checked with options to contain', { diffWrappers: false }, (0, _mockEntities.createExpected)({
                name: 'div', attribs: {}, children: [{ name: 'span', attribs: { className: 'foo' }, children: ['some content'] }]
            }), 'to output', '<div>\n' + '  <wrapper className="the-wrapper">\n' + '    <span className="foo">\n' + '      some different content // -some different content\n' + '                             // +some content\n' + '    </span>\n' + '  </wrapper>\n' + '</div>');
        });
    });

    describe('expect.it', function () {

        it('outputs the output from an expect.it attribute assertion', function () {

            // This is nested deliberately, to ensure the deep promise is checked properly
            return expect((0, _mockEntities.createActual)({
                name: 'TopLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'TopLevel', attribs: {}, children: [{ name: 'span', attribs: { id: expect.it('to match', /[a-f]+$/) }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
            }), 'to output with weight', '<TopLevel>\n' + '  <span id="childfoo" // expected \'childfoo\' to match /[a-f]+$/\n' + '  >\n' + '    one\n' + '  </span>\n' + '  <span id="childfoo">two</span>\n' + '</TopLevel>', _index2['default'].DefaultWeights.ATTRIBUTE_MISMATCH);
        });

        it('outputs the output from an expect.it attribute assertion with two clauses', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'TopLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'TopLevel', attribs: {}, children: [{ name: 'span', attribs: { id: expect.it('to match', /[a-f]+$/).and('to have length', 8) }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
            }), 'to output with weight', '<TopLevel>\n' + '  <span id="childfoo" // ⨯ expected \'childfoo\' to match /[a-f]+$/ and\n' + '                      // ✓ expected \'childfoo\' to have length 8\n' + '  >\n' + '    one\n' + '  </span>\n' + '  <span id="childfoo">two</span>\n' + '</TopLevel>', _index2['default'].DefaultWeights.ATTRIBUTE_MISMATCH);
        });

        it('outputs the output from an expect.it attribute assertion with two clauses', function () {

            return expect((0, _mockEntities.createActual)({
                name: 'TopLevel', attribs: {}, children: [{ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
            }), 'when diffed as html against', (0, _mockEntities.createExpected)({
                name: 'TopLevel', attribs: {}, children: [{ name: 'span', attribs: { id: expect.it('to match', /[a-f]+$/).and('to have length', 8) }, children: ['one'] }, { name: 'span', attribs: { id: 'childfoo' }, children: ['two'] }]
            }), 'to output with weight', '<TopLevel>\n' + '  <span id="childfoo" // ⨯ expected \'childfoo\' to match /[a-f]+$/ and\n' + '                      // ✓ expected \'childfoo\' to have length 8\n' + '  >\n' + '    one\n' + '  </span>\n' + '  <span id="childfoo">two</span>\n' + '</TopLevel>', _index2['default'].DefaultWeights.ATTRIBUTE_MISMATCH);
        });

        it('outputs the output from an asynchronous expect.it attribute assertion that fails', function () {

            return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }), 'when diffed as html against', (0, _mockEntities.createExpected)({ name: 'span', attribs: { id: expect.it('to eventually have value', 'not childfoo') }, children: ['one'] }), 'to output with weight', '<span id="childfoo" // expected \'childfoo\' to eventually have value \'not childfoo\'\n' + '>\n' + '  one\n' + '</span>', _index2['default'].DefaultWeights.ATTRIBUTE_MISMATCH);
        });

        it('outputs the output from an asynchronous expect.it attribute assertion that passes', function () {

            return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }), 'when diffed as html against', (0, _mockEntities.createExpected)({ name: 'span', attribs: { id: expect.it('to eventually have value', 'childfoo') }, children: ['one'] }), 'to output with weight', '<span id="childfoo">one</span>', _index2['default'].DefaultWeights.OK);
        });

        it('outputs the output from an asynchronous expect.it content assertion that fails', function () {

            return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }), 'when diffed as html against', (0, _mockEntities.createExpected)({ name: 'span', attribs: { id: 'childfoo' }, children: [expect.it('to eventually have value', 'not one')] }), 'to output with weight', '<span id="childfoo">\n' + "  one // expected 'one' to eventually have value 'not one'\n" + '</span>', _index2['default'].DefaultWeights.STRING_CONTENT_MISMATCH);
        });

        it('outputs the output from an asynchronous expect.it content assertion that passes', function () {

            return expect((0, _mockEntities.createActual)({ name: 'span', attribs: { id: 'childfoo' }, children: ['one'] }), 'when diffed as html against', (0, _mockEntities.createExpected)({ name: 'span', attribs: { id: 'childfoo' }, children: [expect.it('to eventually have value', 'one')] }), 'to output with weight', '<span id="childfoo">one</span>', _index2['default'].DefaultWeights.OK);
        });

        it('works out which children match best, with asynchronous expect.it assertions in the children', function () {
            return expect((0, _mockEntities.createActual)({ name: 'div', attribs: {}, children: [{ name: 'span', attribs: {}, children: ['one'] }, { name: 'span', attribs: {}, children: ['two'] }, { name: 'span', attribs: {}, children: ['four'] }] }), 'when diffed as html against', (0, _mockEntities.createExpected)({ name: 'div', attribs: {}, children: [{ name: 'span', attribs: {}, children: [expect.it('to eventually have value', 'one')] }, { name: 'span', attribs: {}, children: [expect.it('to eventually have value', 'two')] }, { name: 'span', attribs: {}, children: [expect.it('to eventually have value', 'three')] }, { name: 'span', attribs: {}, children: [expect.it('to eventually have value', 'four')] }] }), 'to output with weight', '<div>\n' + '  <span>one</span>\n' + '  <span>two</span>\n' + '  // missing <span>{expect.it(\'to eventually have value\', \'three\')}</span>\n' + '  <span>four</span>\n' + '</div>', _index2['default'].DefaultWeights.CHILD_MISSING);
        });
    });
});
//# sourceMappingURL=HtmlLike.spec.js.map
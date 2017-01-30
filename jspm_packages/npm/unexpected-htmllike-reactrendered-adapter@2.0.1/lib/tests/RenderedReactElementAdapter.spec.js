'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

require('../testHelpers/emulateDom');

var _RenderedReactElementAdapter = require('../RenderedReactElementAdapter');

var _RenderedReactElementAdapter2 = _interopRequireDefault(_RenderedReactElementAdapter);

var _reactRenderHook = require('react-render-hook');

var _reactRenderHook2 = _interopRequireDefault(_reactRenderHook);

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactAddonsTestUtils = require('react-addons-test-utils');

var _reactAddonsTestUtils2 = _interopRequireDefault(_reactAddonsTestUtils);

var expect = _unexpected2['default'].clone();

var Simple = _react2['default'].createClass({
    displayName: 'Simple',

    render: function render() {
        return _react2['default'].createElement(
            'span',
            { id: this.props.id },
            this.props.text
        );
    }
});

var TestComponent = _react2['default'].createClass({
    displayName: 'TestComponent',

    render: function render() {
        return _react2['default'].createElement(
            'div',
            { className: 'test' },
            _react2['default'].createElement(Simple, { id: '1', text: 'one' }),
            _react2['default'].createElement(Simple, { id: '2', text: 'two' })
        );
    }

});

describe('RenderedReactElementadapter', function () {

    var component = undefined;
    var adapter = undefined;
    beforeEach(function () {

        adapter = new _RenderedReactElementAdapter2['default']();
        var renderedComponent = _reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(TestComponent, { className: 'foo' }));

        component = _reactRenderHook2['default'].findComponent(renderedComponent);
    });

    it('finds the name of the rendered component', function () {
        expect(adapter.getName(component), 'to equal', 'TestComponent');
    });

    it('finds the div child of the top level component', function () {
        expect(adapter.getChildren(component), 'to have length', 1);
    });

    it('finds the attributes of the top level component', function () {

        expect(adapter.getAttributes(component), 'to equal', {
            className: 'foo'
        });
    });

    describe("component's children", function () {
        var children = undefined;

        beforeEach(function () {

            children = adapter.getChildren(component);
        });

        it('finds the name of the native child element of the main component', function () {
            expect(adapter.getName(children[0]), 'to equal', 'div');
        });

        it('finds the children of the native child element of the main component', function () {
            expect(adapter.getChildren(children[0]), 'to have length', 2);
        });

        describe("'s children", function () {

            var grandchildren = undefined;
            beforeEach(function () {

                grandchildren = adapter.getChildren(children[0]);
            });

            it('finds the name of the custom component as a grandchild of the main component', function () {
                expect(adapter.getName(grandchildren[0]), 'to equal', 'Simple');
            });

            it('finds the attributes of the custom component as a grandchild of the main component', function () {
                expect(adapter.getAttributes(grandchildren[0]), 'to equal', {
                    id: '1',
                    text: 'one'
                });
                expect(adapter.getAttributes(grandchildren[1]), 'to equal', {
                    id: '2',
                    text: 'two'
                });
            });

            describe('rendered children of rendered custom component', function () {

                var greatgrandchildren = undefined;
                var greatgrandchildren2 = undefined;

                beforeEach(function () {

                    greatgrandchildren = adapter.getChildren(grandchildren[0]);
                    greatgrandchildren2 = adapter.getChildren(grandchildren[1]);
                });

                it('finds the name of the greatgrandchildren', function () {

                    expect(adapter.getName(greatgrandchildren[0]), 'to equal', 'span');
                    expect(adapter.getName(greatgrandchildren2[0]), 'to equal', 'span');
                });

                it('finds the attributes of the greatgrandchildren', function () {

                    expect(adapter.getAttributes(greatgrandchildren[0]), 'to equal', { id: '1' });
                    expect(adapter.getAttributes(greatgrandchildren2[0]), 'to equal', { id: '2' });
                });

                it('returns the text content of the greatgrandchildren', function () {

                    expect(adapter.getChildren(greatgrandchildren[0]), 'to equal', ['one']);
                    expect(adapter.getChildren(greatgrandchildren2[0]), 'to equal', ['two']);
                });
            });
        });
    });

    describe('text content', function () {

        var SingleContentComponent = undefined,
            DualContentComponent = undefined,
            MultiContentComponent = undefined,
            MixedContentComponent = undefined;
        beforeEach(function () {

            MultiContentComponent = _react2['default'].createClass({
                displayName: 'MultiContentComponent',

                render: function render() {

                    return _react2['default'].createElement(
                        'button',
                        null,
                        'Button clicked ',
                        this.props.count,
                        ' times'
                    );
                }
            });

            SingleContentComponent = _react2['default'].createClass({
                displayName: 'SingleContentComponent',

                render: function render() {
                    return _react2['default'].createElement(
                        'div',
                        null,
                        this.props.content
                    );
                }
            });

            DualContentComponent = _react2['default'].createClass({
                displayName: 'DualContentComponent',

                render: function render() {
                    return _react2['default'].createElement(
                        'div',
                        null,
                        this.props.content1,
                        this.props.content2
                    );
                }
            });

            MixedContentComponent = _react2['default'].createClass({
                displayName: 'MixedContentComponent',

                render: function render() {
                    return _react2['default'].createElement(
                        'div',
                        null,
                        this.props.content1,
                        _react2['default'].createElement(
                            'span',
                            null,
                            'centre'
                        ),
                        this.props.content2
                    );
                }
            });

            var renderedComponent = _reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(MultiContentComponent, { count: 10 }));
            component = _reactRenderHook2['default'].findComponent(renderedComponent);
        });

        it('renders the text individually', function () {
            var button = adapter.getChildren(component)[0];
            var children = adapter.getChildren(button);
            expect(children, 'to equal', ['Button clicked ', '10', ' times']);
        });

        it('concatenates the text when concatTextContent option is set', function () {

            adapter.setOptions({ concatTextContent: true });
            var button = adapter.getChildren(component)[0];
            var children = adapter.getChildren(button);
            expect(children, 'to equal', ['Button clicked 10 times']);
        });

        it('ignores content with null ', function () {

            var renderedComponent = _reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(MultiContentComponent, { count: null }));
            component = _reactRenderHook2['default'].findComponent(renderedComponent);
            var button = adapter.getChildren(component)[0];
            var children = adapter.getChildren(button);
            expect(children, 'to equal', ['Button clicked ', ' times']);
        });

        it('concatenates content with null when concatTextContent is true', function () {

            var renderedComponent = _reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(MultiContentComponent, { count: null }));
            component = _reactRenderHook2['default'].findComponent(renderedComponent);
            adapter.setOptions({ concatTextContent: true });
            var button = adapter.getChildren(component)[0];
            var children = adapter.getChildren(button);
            expect(children, 'to equal', ['Button clicked  times']);
        });

        it('returns a single content item as the original type', function () {

            var component = _reactRenderHook2['default'].findComponent(_reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(SingleContentComponent, { content: 42 })));

            var theDiv = adapter.getChildren(component)[0];
            expect(adapter.getChildren(theDiv), 'to satisfy', [42]);
        });

        it('returns a single content item as a string when using `convertToString:true`', function () {

            var component = _reactRenderHook2['default'].findComponent(_reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(SingleContentComponent, { content: 42 })));
            adapter.setOptions({ convertToString: true });
            var theDiv = adapter.getChildren(component)[0];
            expect(adapter.getChildren(theDiv), 'to satisfy', ['42']);
        });

        it('returns the two content items as strings', function () {

            var component = _reactRenderHook2['default'].findComponent(_reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(DualContentComponent, { content1: 42, content2: 43 })));

            var theDiv = adapter.getChildren(component)[0];
            expect(adapter.getChildren(theDiv), 'to satisfy', ['42', '43']);
        });

        it('returns the 2 content items in mixed children as strings', function () {

            var component = _reactRenderHook2['default'].findComponent(_reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(MixedContentComponent, { content1: 42, content2: 43 })));

            var theDiv = adapter.getChildren(component)[0];
            expect(adapter.getChildren(theDiv), 'to satisfy', ['42', expect.it('to be an', 'object'), '43']);
        });

        it('has the correct classAttributeName property', function () {

            expect(adapter.classAttributeName, 'to equal', 'className');
        });

        it('returns numerical content as a string when convertToString is true', function () {

            var TestComponent = _react2['default'].createClass({
                displayName: 'TestComponent',

                render: function render() {
                    return _react2['default'].createElement(
                        'div',
                        null,
                        42
                    );
                }
            });

            var component = _reactRenderHook2['default'].findComponent(_reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(TestComponent, null)));
            var theDiv = adapter.getChildren(component)[0];
            adapter.setOptions({ convertToString: true });
            expect(adapter.getChildren(theDiv), 'to satisfy', ['42']);
        });

        it('returns concatenates numerical content when convertToString and concatTextContent is true', function () {

            var TestComponent = _react2['default'].createClass({
                displayName: 'TestComponent',

                render: function render() {
                    return _react2['default'].createElement(
                        'div',
                        null,
                        4,
                        2
                    );
                }
            });

            var component = _reactRenderHook2['default'].findComponent(_reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(TestComponent, null)));
            var theDiv = adapter.getChildren(component)[0];
            adapter.setOptions({ convertToString: true, concatTextContent: true });
            expect(adapter.getChildren(theDiv), 'to satisfy', ['42']);
        });

        it('ignores null content with numerical children when concatenating', function () {

            var TestComponent = _react2['default'].createClass({
                displayName: 'TestComponent',

                render: function render() {
                    return _react2['default'].createElement(
                        'div',
                        null,
                        4,
                        null
                    );
                }
            });

            var component = _reactRenderHook2['default'].findComponent(_reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(TestComponent, null)));
            var theDiv = adapter.getChildren(component)[0];
            adapter.setOptions({ convertToString: true, concatTextContent: true });
            expect(adapter.getChildren(theDiv), 'to satisfy', ['4']);
        });

        it('ignores null content with numerical children when not concatenating', function () {

            var TestComponent = _react2['default'].createClass({
                displayName: 'TestComponent',

                render: function render() {
                    return _react2['default'].createElement(
                        'div',
                        null,
                        4,
                        null
                    );
                }
            });

            var component = _reactRenderHook2['default'].findComponent(_reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(TestComponent, null)));
            var theDiv = adapter.getChildren(component)[0];
            adapter.setOptions({ convertToString: true });
            expect(adapter.getChildren(theDiv), 'to satisfy', ['4']);
        });

        it('treats a zero as a normal number', function () {

            var TestComponent = _react2['default'].createClass({
                displayName: 'TestComponent',

                render: function render() {
                    return _react2['default'].createElement(
                        'div',
                        null,
                        'Hello ',
                        0
                    );
                }
            });

            var component = _reactRenderHook2['default'].findComponent(_reactAddonsTestUtils2['default'].renderIntoDocument(_react2['default'].createElement(TestComponent, null)));
            var theDiv = adapter.getChildren(component)[0];
            adapter.setOptions({ convertToString: true });
            expect(adapter.getChildren(theDiv), 'to satisfy', ['Hello ', '0']);
        });
    });
});
//# sourceMappingURL=RenderedReactElementAdapter.spec.js.map
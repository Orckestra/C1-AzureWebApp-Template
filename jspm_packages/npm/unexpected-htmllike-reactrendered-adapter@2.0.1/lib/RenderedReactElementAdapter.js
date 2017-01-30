'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _reactRenderHook = require('react-render-hook');

var _reactRenderHook2 = _interopRequireDefault(_reactRenderHook);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var defaultOptions = {};

function isRawType(value) {
    var type = typeof value;
    return type === 'string' || type === 'number' || type === 'boolean' || type === 'undefined' || value === null;
}

function convertValueTypeToString(value) {

    if (typeof value === 'string') {
        // Common case can be fasttracked
        return value;
    }

    if (value === null || value === undefined) {
        return '';
    }

    return '' + value;
}

function concatenateStringChildren(accum, value) {
    if (isRawType(value) && accum.length && isRawType(accum[accum.length - 1])) {
        accum[accum.length - 1] = convertValueTypeToString(accum[accum.length - 1]) + convertValueTypeToString(value);
        return accum;
    }
    accum.push(value);
    return accum;
}

var RenderedReactElementAdapter = (function () {
    function RenderedReactElementAdapter(options) {
        _classCallCheck(this, RenderedReactElementAdapter);

        this._options = (0, _objectAssign2['default'])({}, defaultOptions, options);
    }

    _createClass(RenderedReactElementAdapter, [{
        key: 'getName',
        value: function getName(comp) {
            return comp.data.name;
        }
    }, {
        key: 'getAttributes',
        value: function getAttributes(comp) {
            var props = {};
            if (comp.data.props) {
                Object.keys(comp.data.props).forEach(function (prop) {
                    if (prop !== 'children' && prop !== 'ref' && prop !== 'key') {
                        props[prop] = comp.data.props[prop];
                    }
                });
            }

            return props;
        }
    }, {
        key: 'getChildren',
        value: function getChildren(comp) {
            var _this = this;

            var children = [];
            if (comp.data.children) {
                if (isRawType(comp.data.children)) {
                    return this._options.convertToString ? ['' + comp.data.children] : [comp.data.children];
                }
                children = comp.data.children.map(function (child) {
                    var renderedChild = _reactRenderHook2['default'].findInternalComponent(child);
                    switch (renderedChild.data.nodeType) {
                        case 'NativeWrapper':
                            return _reactRenderHook2['default'].findInternalComponent(renderedChild.data.children[0]);
                        case 'Text':
                            return _this._options.convertToString ? '' + renderedChild.data.text : renderedChild.data.text;
                    }

                    return renderedChild;
                });

                if (this._options.concatTextContent) {
                    children = children.reduce(concatenateStringChildren, []);
                }
            }
            return children;
        }
    }, {
        key: 'setOptions',
        value: function setOptions(newOpts) {
            this._options = (0, _objectAssign2['default'])(this._options, newOpts);
        }
    }]);

    return RenderedReactElementAdapter;
})();

RenderedReactElementAdapter.prototype.classAttributeName = 'className';

exports['default'] = RenderedReactElementAdapter;
module.exports = exports['default'];
//# sourceMappingURL=RenderedReactElementAdapter.js.map
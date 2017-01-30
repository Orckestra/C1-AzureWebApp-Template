'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = convertToDiff;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _isNativeType = require('./isNativeType');

var _isNativeType2 = _interopRequireDefault(_isNativeType);

function convertToDiff(adapter, item, options) {
    options = (0, _objectAssign2['default'])({}, { includeChildren: true }, options);
    if ((0, _isNativeType2['default'])(item)) {
        return {
            type: 'CONTENT',
            value: item
        };
    }

    var diffEntry = {
        type: 'ELEMENT',
        name: adapter.getName(item),
        attributes: []
    };
    var attributes = adapter.getAttributes(item);
    if (attributes) {
        Object.keys(attributes).forEach(function (attribName) {
            diffEntry.attributes.push({
                name: attribName,
                value: attributes[attribName]
            });
        });
    }

    if (options.includeChildren) {
        var children = adapter.getChildren(item);
        if (children) {
            diffEntry.children = children.map(function (child) {
                return convertToDiff(adapter, child);
            });
        }
    }

    return diffEntry;
}

module.exports = exports['default'];
//# sourceMappingURL=convertToDiff.js.map
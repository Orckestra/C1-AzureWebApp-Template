'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = isNativeType;

function isNativeType(value) {
    var type = typeof value;
    return type === 'string' || type === 'number' || type === 'boolean' || type === 'undefined' || value === null || type === 'function' && value._expectIt;
}

module.exports = exports['default'];
//# sourceMappingURL=isNativeType.js.map
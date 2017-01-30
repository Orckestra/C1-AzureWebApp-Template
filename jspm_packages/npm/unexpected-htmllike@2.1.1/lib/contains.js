'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _syncContains = require('./syncContains');

var _syncContains2 = _interopRequireDefault(_syncContains);

var _asyncContains = require('./asyncContains');

var _asyncContains2 = _interopRequireDefault(_asyncContains);

var _requiresAsyncError = require('./requiresAsyncError');

var _requiresAsyncError2 = _interopRequireDefault(_requiresAsyncError);

function contains(actualAdapter, expectedAdapter, actual, expected, equal, options) {
    try {
        return (0, _syncContains2['default'])(actualAdapter, expectedAdapter, actual, expected, equal, options);
    } catch (e) {
        if (e instanceof _requiresAsyncError2['default']) {
            return (0, _asyncContains2['default'])(actualAdapter, expectedAdapter, actual, expected, equal, options);
        }
        throw e;
    }
}

exports['default'] = contains;
module.exports = exports['default'];
//# sourceMappingURL=contains.js.map
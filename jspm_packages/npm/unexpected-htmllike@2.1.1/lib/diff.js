'use strict';
Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _diffCommon = require('./diffCommon');

var _asyncDiff = require('./asyncDiff');

var _asyncDiff2 = _interopRequireDefault(_asyncDiff);

var _syncDiff = require('./syncDiff');

var _syncDiff2 = _interopRequireDefault(_syncDiff);

var _requiresAsyncError = require('./requiresAsyncError');

var _requiresAsyncError2 = _interopRequireDefault(_requiresAsyncError);

function diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    try {
        return _syncDiff2['default'].diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options);
    } catch (e) {
        if (e instanceof _requiresAsyncError2['default']) {
            return _asyncDiff2['default'].diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options);
        }
        throw e;
    }
}

exports['default'] = {
    DefaultWeights: _diffCommon.DefaultWeights,
    diffElements: diffElements
};
module.exports = exports['default'];
//# sourceMappingURL=diff.js.map
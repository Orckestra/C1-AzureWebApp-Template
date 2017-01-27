'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _diff = require('./diff');

var _diff2 = _interopRequireDefault(_diff);

var _isNativeType = require('./isNativeType');

var _isNativeType2 = _interopRequireDefault(_isNativeType);

var _requiresAsyncError = require('./requiresAsyncError');

var _requiresAsyncError2 = _interopRequireDefault(_requiresAsyncError);

function contains(actualAdapter, expectedAdapter, actual, expected, equal, options) {

    var containsResult = containsContent(actualAdapter, expectedAdapter, actual, expected, equal, options);

    // If result has WRAPPERELEMENTs around it, remove them
    stripWrapperElements(actualAdapter, containsResult);
    return containsResult;
}

function stripWrapperElements(_x, _x2) {
    var _again = true;

    _function: while (_again) {
        var actualAdapter = _x,
            containsResult = _x2;
        _again = false;

        if (containsResult.bestMatch && containsResult.bestMatch.diff.type === 'WRAPPERELEMENT') {
            // Unwrap the diff and the item
            containsResult.bestMatch.diff = containsResult.bestMatch.diff.children[0];
            containsResult.bestMatchItem = actualAdapter.getChildren(containsResult.bestMatchItem)[0];
            _x = actualAdapter;
            _x2 = containsResult;
            _again = true;
            continue _function;
        }
        return containsResult;
    }
}

function containsContent(actualAdapter, expectedAdapter, actual, expected, equal, options) {

    var result = {
        found: false,
        bestMatch: null,
        bestMatchItem: null
    };

    var diffResult = _diff2['default'].diffElements(actualAdapter, expectedAdapter, actual, expected, equal, options);

    if (diffResult && typeof diffResult.then === 'function') {
        throw new _requiresAsyncError2['default']();
    }

    if (diffResult.weight === _diff2['default'].DefaultWeights.OK) {
        result.found = true;
        result.bestMatch = diffResult;
        result.bestMatchItem = actual;
        return result;
    }
    result.bestMatch = diffResult;
    result.bestMatchItem = actual;

    if (!(0, _isNativeType2['default'])(actual)) {
        var children = actualAdapter.getChildren(actual);
        if (children) {

            var childrenLength = children.length;

            for (var childIndex = 0; childIndex < childrenLength; ++childIndex) {

                var childResult = containsContent(actualAdapter, expectedAdapter, children[childIndex], expected, equal, options);

                if (childResult.found) {
                    return {
                        found: true,
                        bestMatch: childResult.bestMatch,
                        bestMatchItem: childResult.bestMatchItem
                    };
                }

                if (!result.bestMatch || childResult.bestMatch.weight < result.bestMatch.weight) {
                    result.bestMatch = childResult.bestMatch;
                    result.bestMatchItem = childResult.bestMatchItem;
                }
            }
        }
    }

    return result;
}

exports['default'] = contains;
module.exports = exports['default'];
//# sourceMappingURL=syncContains.js.map
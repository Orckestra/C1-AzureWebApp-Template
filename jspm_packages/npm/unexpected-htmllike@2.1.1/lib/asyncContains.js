'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _asyncDiff = require('./asyncDiff');

var _asyncDiff2 = _interopRequireDefault(_asyncDiff);

var _diffCommon = require('./diffCommon');

var _isNativeType = require('./isNativeType');

var _isNativeType2 = _interopRequireDefault(_isNativeType);

function contains(actualAdapter, expectedAdapter, actual, expected, equal, options) {

    return containsContent(actualAdapter, expectedAdapter, actual, expected, equal, options).then(function (result) {

        // If result has WRAPPERELEMENTs around it, remove them
        stripWrapperElements(actualAdapter, result);
        return result;
    });
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

    return _asyncDiff2['default'].diffElements(actualAdapter, expectedAdapter, actual, expected, equal, options).then(function (diffResult) {

        if (diffResult.weight === _diffCommon.DefaultWeights.OK) {
            result.found = true;
            result.bestMatch = diffResult;
            result.bestMatchItem = actual;
            return result;
        }
        result.bestMatch = diffResult;
        result.bestMatchItem = actual;

        if (!(0, _isNativeType2['default'])(actual)) {
            var _ret = (function () {
                var children = actualAdapter.getChildren(actual);
                if (children) {
                    var _ret2 = (function () {

                        var childrenLength = children.length;

                        var checkChild = function checkChild(childIndex) {

                            return containsContent(actualAdapter, expectedAdapter, children[childIndex], expected, equal, options).then(function (childResult) {

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

                                if (childIndex < childrenLength) {

                                    return checkChild(childIndex + 1);
                                }

                                return result;
                            });
                        };

                        return {
                            v: {
                                v: checkChild(0)
                            }
                        };
                    })();

                    if (typeof _ret2 === 'object') return _ret2.v;
                }
            })();

            if (typeof _ret === 'object') return _ret.v;
        }

        return result;
    });
}

exports['default'] = contains;
module.exports = exports['default'];
//# sourceMappingURL=asyncContains.js.map
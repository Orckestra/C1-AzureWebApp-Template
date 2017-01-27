'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _arrayChangesAsync = require('array-changes-async');

var _arrayChangesAsync2 = _interopRequireDefault(_arrayChangesAsync);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _isNativeType = require('./isNativeType');

var _isNativeType2 = _interopRequireDefault(_isNativeType);

var _convertToDiff = require('./convertToDiff');

var _convertToDiff2 = _interopRequireDefault(_convertToDiff);

var _lineBreaker = require('./lineBreaker');

var _lineBreaker2 = _interopRequireDefault(_lineBreaker);

var _Weights = require('./Weights');

var _Weights2 = _interopRequireDefault(_Weights);

var _diffCommon = require('./diffCommon');

var DiffCommon = _interopRequireWildcard(_diffCommon);

function diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    options = (0, _objectAssign2['default'])({}, DiffCommon.defaultOptions, options);
    options.weights = (0, _objectAssign2['default'])({}, DiffCommon.DefaultWeights, options.weights);
    if (actualAdapter.classAttributeName && actualAdapter.classAttributeName === expectedAdapter.classAttributeName) {
        options.classAttributeName = actualAdapter.classAttributeName;
    }

    return diffElementOrWrapper(actualAdapter, expectedAdapter, actual, expected, expect, options).then(function (diffResult) {
        return {
            diff: diffResult.diff,
            weight: diffResult.weight.real,
            target: diffResult.target
        };
    });
}

function diffElementOrWrapper(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    var elementResult = diffElement(actualAdapter, expectedAdapter, actual, expected, expect, options);

    return elementResult.then(function (diffResult) {

        if (diffResult.weight.real !== DiffCommon.WEIGHT_OK && !(0, _isNativeType2['default'])(actual)) {

            var actualChildren = actualAdapter.getChildren(actual);

            if (actualChildren.length === 1) {
                // Try as wrapper
                return diffElementOrWrapper(actualAdapter, expectedAdapter, actualChildren[0], expected, expect, options).then(function (wrapperResult) {
                    return DiffCommon.checkElementWrapperResult(actualAdapter, actual, diffResult, wrapperResult, options);
                });
            }
        }
        return diffResult;
    });
}

function diffElement(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    var weights = new _Weights2['default']();
    var diffResult = {};

    var actualIsNative = (0, _isNativeType2['default'])(actual);
    var expectedIsNative = (0, _isNativeType2['default'])(expected);

    var promises = [];

    if (expectedIsNative && typeof expected === 'function' && expected._expectIt) {
        var withErrorResult = expect.withError(function () {
            return expected(actual);
        }, function (e) {

            var errorResult = DiffCommon.getExpectItContentErrorResult(actual, expected, e, options);
            diffResult = errorResult.diff;
            weights.addWeight(errorResult.weight);
            return diffResult;
        }).then(function () {

            diffResult.type = 'CONTENT';
            diffResult.value = actual;
            // Assertion passed
            return {
                diff: diffResult,
                weight: weights
            };
        });

        if (withErrorResult) {
            return withErrorResult;
        }

        return expect.promise.resolve({ diffResult: diffResult, weights: weights });
    }

    // TODO: All the following checks can be lumped together, just need to return the lot
    // as a prommise for async, and directly for sync
    if (actualIsNative && expectedIsNative) {

        diffResult = DiffCommon.getNativeContentResult(actual, expected, weights, options);

        return expect.promise.resolve({
            diff: diffResult,
            weight: weights
        });
    }

    if (actualIsNative && !expectedIsNative) {

        diffResult = DiffCommon.getNativeNonNativeResult(actual, expected, weights, expectedAdapter, options);

        return expect.promise.resolve({
            diff: diffResult,
            weight: weights
        });
    }

    if (!actualIsNative && expectedIsNative) {
        diffResult = DiffCommon.getNonNativeNativeResult(actual, expected, weights, actualAdapter, expectedAdapter, options);

        return expect.promise.resolve({
            diff: diffResult,
            weight: weights
        });
    }

    var actualName = actualAdapter.getName(actual);
    var expectedName = expectedAdapter.getName(expected);

    diffResult = DiffCommon.getElementResult(actualName, expectedName, weights, options);

    var target = undefined;
    var attributesResultPromise = diffAttributes(actualAdapter.getAttributes(actual), expectedAdapter.getAttributes(expected), expect, options).then(function (attribResult) {
        diffResult.attributes = attribResult.diff;
        weights.addWeight(attribResult.weight);
        if (attribResult.isTarget) {
            target = actual;
        }
    });

    promises.push(attributesResultPromise);

    var contentResultPromise = diffContent(actualAdapter, expectedAdapter, actualAdapter.getChildren(actual), expectedAdapter.getChildren(expected), expect, options).then(function (contentResult) {

        diffResult.children = contentResult.diff;
        weights.addWeight(contentResult.weight);
        if (contentResult.target) {
            target = contentResult.target;
        }
    });

    promises.push(contentResultPromise);

    return expect.promise.all(promises).then(function () {

        return {
            diff: diffResult,
            weight: weights,
            target: target
        };
    });
}

function diffAttributes(actualAttributes, expectedAttributes, expect, options) {

    var result = DiffCommon.diffAttributes(actualAttributes, expectedAttributes, expect, options);
    if (typeof result.then === 'function') {
        return result;
    }
    return expect.promise.resolve(result);
}

function diffContent(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    var bestWeight = null;
    var bestDiff = null;
    var bestTarget = undefined;

    // Optimize the common case of being exactly one child, ie. an element wrapping something
    // Removed for now, to make this function slightly easier to convert to promises!
    //if (actual.length === 1 && expected.length === 1) {
    //    // It's a single element, then just directly compare the elements
    //    previousStepPromise = diffElement(actualAdapter, expectedAdapter, actual[0], expected[0], expect, options)
    //    .then(singleElementDiff => {
    //        bestDiff = [singleElementDiff.diff];
    //        bestWeight = singleElementDiff.weight;
    //    });
    //}

    return diffChildren(actualAdapter, expectedAdapter, actual, expected, expect, options).then(function (childrenResult) {

        if (!bestWeight || childrenResult.weight.real < bestWeight.real) {
            bestDiff = childrenResult.diff;
            bestWeight = childrenResult.weight;
            bestTarget = childrenResult.target;
        }
    }).then(function () {

        if ((!bestWeight || bestWeight.real !== DiffCommon.WEIGHT_OK) && actual.length === 1 && expected.length !== 0 && !(0, _isNativeType2['default'])(actual[0])) {
            // Try it as a wrapper, and see if it's better
            // Also covered here is a wrapper around several children

            var actualChildren = actualAdapter.getChildren(actual[0]);
            return diffContent(actualAdapter, expectedAdapter, actualChildren, expected, expect, options);
        }

        return null;
    }).then(function (wrapperResult) {

        if (wrapperResult) {
            var wrapperWeight = options.diffWrappers ? options.weights.WRAPPER_REMOVED : DiffCommon.WEIGHT_OK;

            if (!bestWeight || wrapperWeight + wrapperResult.weight.real < bestWeight.real) {
                // It could be a wrapper
                bestWeight = wrapperResult.weight;
                bestWeight.addTotal(options.weights.WRAPPER_REMOVED);
                var actualDiff = (0, _convertToDiff2['default'])(actualAdapter, actual[0], { includeChildren: false });
                actualDiff.children = wrapperResult.diff;
                if (options.diffWrappers) {
                    actualDiff.diff = {
                        type: 'wrapper'
                    };
                    bestWeight.addReal(options.weights.WRAPPER_REMOVED);
                } else {
                    actualDiff.type = 'WRAPPERELEMENT';
                }
                bestDiff = [actualDiff];
            }
        }
    }).then(function () {
        return {
            diff: bestDiff,
            weight: bestWeight,
            target: bestTarget
        };
    });
}

function diffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options) {

    var onlyExact = true;
    var bestDiffResult = null;

    return tryDiffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options, onlyExact).then(function (exactDiffResult) {

        bestDiffResult = exactDiffResult;

        // If it wasn't a perfect match, and there were both inserts and removals, we can try allowing the children that
        // don't match to be "similar".
        if (exactDiffResult.weight.real !== 0 && exactDiffResult.insertCount && exactDiffResult.removeCount) {
            onlyExact = false;
            return tryDiffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options, onlyExact);
        }
        return null;
    }).then(function (changesDiffResult) {

        if (changesDiffResult && changesDiffResult.weight.real < bestDiffResult.weight.real) {
            bestDiffResult = changesDiffResult;
        }
        return bestDiffResult;
    });
}

function tryDiffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options, onlyExactMatches) {

    var diffWeights = new _Weights2['default']();
    var diffResult = [];

    var insertCount = 0;
    var removeCount = 0;
    var changeCount = 0;
    var promises = [];

    return expect.promise(function (resolve, reject) {
        var actualChildrenLength = actualChildren.length;
        var expectedChildrenLength = expectedChildren.length;

        var cachedDiffs = [];
        cachedDiffs.length = actualChildrenLength * expectedChildrenLength;

        (0, _arrayChangesAsync2['default'])(actualChildren, expectedChildren, function (a, b, aIndex, bIndex, callback) {

            var cacheIndex = aIndex * expectedChildrenLength + bIndex;
            if (cachedDiffs[cacheIndex]) {
                return callback(cachedDiffs[cacheIndex].weight.real === DiffCommon.WEIGHT_OK);
            }

            diffElementOrWrapper(actualAdapter, expectedAdapter, a, b, expect, options).then(function (elementDiff) {
                cachedDiffs[cacheIndex] = elementDiff;
                return callback(elementDiff.weight.real === DiffCommon.WEIGHT_OK);
            });
        }, function (a, b, aIndex, bIndex, callback) {

            if (onlyExactMatches) {
                var _ret = (function () {
                    var cacheIndex = aIndex * expectedChildrenLength + bIndex;
                    var diff = cachedDiffs[cacheIndex];
                    if (diff) {
                        return {
                            v: callback(diff.weight.real === DiffCommon.WEIGHT_OK)
                        };
                    }

                    return {
                        v: diffElementOrWrapper(actualAdapter, expectedAdapter, a, b, expect, options).then(function (elementDiff) {
                            cachedDiffs[cacheIndex] = elementDiff;
                            callback(elementDiff.weight.real === DiffCommon.WEIGHT_OK);
                        })
                    };
                })();

                if (typeof _ret === 'object') return _ret.v;
            }
            var aIsNativeType = (0, _isNativeType2['default'])(a);
            var bIsNativeType = (0, _isNativeType2['default'])(b);

            // If they're native types, assume they're similar
            if (aIsNativeType && bIsNativeType) {
                return callback(true);
            }

            // If one is an element, then don't count them as "similar"
            if (aIsNativeType !== bIsNativeType) {
                return callback(false);
            }

            // Here we could diff and get a weight, but the weight as to what is similar is dependant on
            // what the other "similar" elements got, so we'll just take a simplistic view -
            // elements with the same name are similar, otherwise they're not
            return callback(actualAdapter.getName(a) === expectedAdapter.getName(b));
        }, function (changes) {

            var target = undefined;
            changes.forEach(function (diffItem) {

                var itemResult = undefined;
                var testCached = undefined;
                if (typeof diffItem.actualIndex === 'number' && (typeof diffItem.expectedIndex === 'number' || diffItem.type === 'equal')) {
                    var cacheIndex = diffItem.actualIndex * expectedChildrenLength + diffItem.expectedIndex;
                    var cachedDiff = cachedDiffs[cacheIndex];
                    if (cachedDiff && cachedDiff.target) {
                        target = cachedDiff.target;
                    }
                }

                switch (diffItem.type) {
                    case 'insert':
                        insertCount++;
                        var actualIndex = null;
                        if (typeof diffItem.actualIndex === 'number') {
                            itemResult = (0, _convertToDiff2['default'])(actualAdapter, diffItem.value);
                            actualIndex = diffItem.actualIndex;
                        } else {
                            itemResult = (0, _convertToDiff2['default'])(expectedAdapter, diffItem.value);
                        }

                        if (options.diffMissingChildren) {
                            diffWeights.add(options.weights.CHILD_MISSING);
                            itemResult.diff = {
                                type: 'missing'
                            };
                            if (actualIndex !== null) {
                                itemResult.diff.actualIndex = actualIndex;
                            }
                            diffResult.push(itemResult);
                        }
                        break;

                    case 'remove':
                        removeCount++;
                        itemResult = (0, _convertToDiff2['default'])(actualAdapter, diffItem.value);

                        if (options.diffExtraChildren) {
                            itemResult.diff = {
                                type: 'extra'
                            };
                            diffWeights.addReal(options.weights.CHILD_INSERTED);
                        }
                        diffWeights.addTotal(options.weights.CHILD_INSERTED);
                        diffResult.push(itemResult);
                        break;

                    case 'similar':
                        changeCount++;
                    // fallthrough
                    // (equal needs to be diffed, because it may contain wrappers, hence we need to work that out.. again)
                    // It would be good to cache that, from the diff above.

                    case 'equal': //eslint-disable-line no-fallthrough
                    default:
                        var index = diffResult.length;

                        diffResult.push({}); // Push a placeholder, we'll replace when the promise resolves
                        var promise = diffElementOrWrapper(actualAdapter, expectedAdapter, diffItem.value, diffItem.expected, expect, options).then(function (result) {
                            diffResult[index] = result.diff;
                            diffWeights.addWeight(result.weight);
                        });
                        promises.push(promise);
                        break;
                }
            });

            if (promises.length) {
                return expect.promise.all(promises).then(function () {
                    resolve(target);
                });
            }
            return resolve(target);
        });
    }).then(function (target) {

        if (actualChildren.length === 0 && expectedChildren.length !== 0 && options.diffMissingChildren) {
            diffWeights.add(options.weights.ALL_CHILDREN_MISSING);
        }

        return {
            weight: diffWeights,
            diff: diffResult,
            insertCount: insertCount,
            removeCount: removeCount,
            changeCount: changeCount,
            target: target
        };
    });
}

exports['default'] = {
    diffElements: diffElements
};
module.exports = exports['default'];
//# sourceMappingURL=asyncDiff.js.map
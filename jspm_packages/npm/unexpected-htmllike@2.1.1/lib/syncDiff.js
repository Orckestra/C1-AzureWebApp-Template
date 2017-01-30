'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _arrayChanges = require('array-changes');

var _arrayChanges2 = _interopRequireDefault(_arrayChanges);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _isNativeType = require('./isNativeType');

var _isNativeType2 = _interopRequireDefault(_isNativeType);

var _convertToDiff = require('./convertToDiff');

var _convertToDiff2 = _interopRequireDefault(_convertToDiff);

var _Weights = require('./Weights');

var _Weights2 = _interopRequireDefault(_Weights);

var _diffCommon = require('./diffCommon');

var DiffCommon = _interopRequireWildcard(_diffCommon);

var _requiresAsyncError = require('./requiresAsyncError');

var _requiresAsyncError2 = _interopRequireDefault(_requiresAsyncError);

function diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    options = (0, _objectAssign2['default'])({}, DiffCommon.defaultOptions, options);
    options.weights = (0, _objectAssign2['default'])({}, DiffCommon.DefaultWeights, options.weights);
    if (actualAdapter.classAttributeName && actualAdapter.classAttributeName === expectedAdapter.classAttributeName) {
        options.classAttributeName = actualAdapter.classAttributeName;
    }

    var diffResult = diffElementOrWrapper(actualAdapter, expectedAdapter, actual, expected, expect, options);
    return {
        diff: diffResult.diff,
        weight: diffResult.weight.real,
        target: diffResult.target
    };
}

function diffElementOrWrapper(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    var diffResult = diffElement(actualAdapter, expectedAdapter, actual, expected, expect, options);

    if (diffResult.weight.real !== DiffCommon.WEIGHT_OK && !(0, _isNativeType2['default'])(actual)) {

        var actualChildren = actualAdapter.getChildren(actual);

        if (actualChildren.length === 1) {
            // Try as wrapper
            var wrapperResult = diffElementOrWrapper(actualAdapter, expectedAdapter, actualChildren[0], expected, expect, options);
            return DiffCommon.checkElementWrapperResult(actualAdapter, actual, diffResult, wrapperResult, options);
        }
    }
    return diffResult;
}

function diffElement(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    var weights = new _Weights2['default']();
    var diffResult = {};

    var actualIsNative = (0, _isNativeType2['default'])(actual);
    var expectedIsNative = (0, _isNativeType2['default'])(expected);

    if (expectedIsNative && typeof expected === 'function' && expected._expectIt) {
        var expectItResult = undefined;
        try {
            expectItResult = expected(actual);
        } catch (e) {
            diffResult.type = 'CONTENT';
            diffResult.value = actual;
            diffResult.diff = {
                type: 'custom',
                assertion: expected,
                error: e
            };
            weights.add(options.weights.STRING_CONTENT_MISMATCH);
            return {
                diff: diffResult,
                weight: weights
            };
        }

        if (expectItResult && typeof expectItResult.then === 'function') {
            expectItResult.then(function () {}, function () {});
            throw new _requiresAsyncError2['default']();
        }

        diffResult.type = 'CONTENT';
        diffResult.value = actual;

        return {
            diff: diffResult,
            weight: weights
        };
    }

    if (actualIsNative && expectedIsNative) {

        diffResult = DiffCommon.getNativeContentResult(actual, expected, weights, options);

        return {
            diff: diffResult,
            weight: weights
        };
    }

    if (actualIsNative && !expectedIsNative) {
        diffResult = DiffCommon.getNativeNonNativeResult(actual, expected, weights, expectedAdapter, options);

        return {
            diff: diffResult,
            weight: weights
        };
    }

    if (!actualIsNative && expectedIsNative) {
        diffResult = DiffCommon.getNonNativeNativeResult(actual, expected, weights, actualAdapter, expectedAdapter, options);

        return {
            diff: diffResult,
            weight: weights
        };
    }

    var actualName = actualAdapter.getName(actual);
    var expectedName = expectedAdapter.getName(expected);

    diffResult = DiffCommon.getElementResult(actualName, expectedName, weights, options);

    var attributesResult = DiffCommon.diffAttributes(actualAdapter.getAttributes(actual), expectedAdapter.getAttributes(expected), expect, options);
    if (typeof attributesResult.then === 'function') {
        // Promise returned, we need to do this async
        throw new _requiresAsyncError2['default']();
    }

    var target = undefined;

    if (attributesResult.isTarget) {
        target = actual;
    }
    diffResult.attributes = attributesResult.diff;
    weights.addWeight(attributesResult.weight);

    var contentResult = diffContent(actualAdapter, expectedAdapter, actualAdapter.getChildren(actual), expectedAdapter.getChildren(expected), expect, options);

    diffResult.children = contentResult.diff;
    weights.addWeight(contentResult.weight);
    target = target || contentResult.target;

    return {
        diff: diffResult,
        weight: weights,
        target: target
    };
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

    var childrenResult = diffChildren(actualAdapter, expectedAdapter, actual, expected, expect, options);

    if (!bestWeight || childrenResult.weight.real < bestWeight.real) {
        bestDiff = childrenResult.diff;
        bestWeight = childrenResult.weight;
        bestTarget = childrenResult.target;
    }

    var wrapperResult = undefined;
    if ((!bestWeight || bestWeight.real !== DiffCommon.WEIGHT_OK) && actual.length === 1 && expected.length !== 0 && !(0, _isNativeType2['default'])(actual[0])) {
        // Try it as a wrapper, and see if it's better
        // Also covered here is a wrapper around several children

        var actualChildren = actualAdapter.getChildren(actual[0]);
        wrapperResult = diffContent(actualAdapter, expectedAdapter, actualChildren, expected, expect, options);
    }

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
    return {
        diff: bestDiff,
        weight: bestWeight,
        target: bestTarget
    };
}

function diffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options) {

    var onlyExact = true;
    var bestDiffResult = null;

    var exactDiffResult = tryDiffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options, onlyExact);

    bestDiffResult = exactDiffResult;

    // If it wasn't a perfect match, and there were both inserts and removals, we can try allowing the children that
    // don't match to be "similar".
    var changesDiffResult = undefined;
    if (exactDiffResult.weight.real !== 0 && exactDiffResult.insertCount && exactDiffResult.removeCount) {
        onlyExact = false;
        changesDiffResult = tryDiffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options, onlyExact);
    }

    if (changesDiffResult && changesDiffResult.weight.real < bestDiffResult.weight.real) {
        bestDiffResult = changesDiffResult;
    }
    return bestDiffResult;
}

function tryDiffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options, onlyExactMatches) {

    var diffWeights = new _Weights2['default']();
    var diffResult = [];

    var insertCount = 0;
    var removeCount = 0;
    var changeCount = 0;

    var actualChildrenLength = actualChildren.length;
    var expectedChildrenLength = expectedChildren.length;

    var cachedDiffs = [];
    cachedDiffs.length = actualChildrenLength * expectedChildrenLength;

    var changes = (0, _arrayChanges2['default'])(actualChildren, expectedChildren, function (a, b, aIndex, bIndex) {
        var cacheIndex = aIndex * expectedChildrenLength + bIndex;
        var elementDiff = cachedDiffs[cacheIndex];
        if (!elementDiff) {
            elementDiff = diffElementOrWrapper(actualAdapter, expectedAdapter, a, b, expect, options);
            cachedDiffs[cacheIndex] = elementDiff;
        }
        return cachedDiffs[cacheIndex].weight.real === DiffCommon.WEIGHT_OK;
    }, function (a, b, aIndex, bIndex) {

        if (onlyExactMatches) {
            var cacheIndex = aIndex * expectedChildrenLength + bIndex;
            var elementDiff = cachedDiffs[cacheIndex];
            if (!elementDiff) {
                elementDiff = diffElementOrWrapper(actualAdapter, expectedAdapter, a, b, expect, options);
                cachedDiffs[cacheIndex] = elementDiff;
            }
            return elementDiff.weight.real === DiffCommon.WEIGHT_OK;
        }
        var aIsNativeType = (0, _isNativeType2['default'])(a);
        var bIsNativeType = (0, _isNativeType2['default'])(b);

        // If they're native types, assume they're similar
        if (aIsNativeType && bIsNativeType) {
            return true;
        }

        // If one is an element, then don't count them as "similar"
        if (aIsNativeType !== bIsNativeType) {
            return false;
        }

        // Here we could diff and get a weight, but the weight as to what is similar is dependant on
        // what the other "similar" elements got, so we'll just take a simplistic view -
        // elements with the same name are similar, otherwise they're not
        return actualAdapter.getName(a) === expectedAdapter.getName(b);
    });

    var target = undefined;
    changes.forEach(function (diffItem) {

        var itemResult = undefined,
            cachedDiff = undefined;
        if (typeof diffItem.actualIndex === 'number' && typeof diffItem.expectedIndex === 'number') {
            var cacheIndex = diffItem.actualIndex * expectedChildrenLength + diffItem.expectedIndex;
            cachedDiff = cachedDiffs[cacheIndex];
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

            case 'equal': //eslint-disable-line no-fallthrough
            default:
                diffResult.push(cachedDiff.diff);
                diffWeights.addWeight(cachedDiff.weight);
                break;
        }
    });

    if (actualChildren.length === 0 && expectedChildren.length !== 0 && options.diffMissingChildren) {
        diffWeights.add(options.weights.ALL_CHILDREN_MISSING);
    }

    return {
        weight: diffWeights,
        diff: diffResult,
        target: target,
        insertCount: insertCount,
        removeCount: removeCount,
        changeCount: changeCount
    };
}

exports['default'] = {
    diffElements: diffElements
};
module.exports = exports['default'];
//# sourceMappingURL=syncDiff.js.map
import ArrayChanges from 'array-changes';
import ObjectAssign from 'object-assign';
import isNativeType from './isNativeType';
import convertToDiff from './convertToDiff';
import Weights from './Weights';
import * as DiffCommon from './diffCommon';
import RequiresAsyncError from './requiresAsyncError';


function diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    options = ObjectAssign({}, DiffCommon.defaultOptions, options);
    options.weights = ObjectAssign({}, DiffCommon.DefaultWeights, options.weights);
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

    let diffResult = diffElement(actualAdapter, expectedAdapter, actual, expected, expect, options);

    if (diffResult.weight.real !== DiffCommon.WEIGHT_OK && !isNativeType(actual)) {

        const actualChildren = actualAdapter.getChildren(actual);

        if (actualChildren.length === 1) {
            // Try as wrapper
            const wrapperResult = diffElementOrWrapper(actualAdapter, expectedAdapter, actualChildren[0], expected, expect, options);
            return DiffCommon.checkElementWrapperResult(actualAdapter, actual, diffResult, wrapperResult, options);
        }
    }
    return diffResult;
}


function diffElement(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    const weights = new Weights();
    let diffResult = {};

    const actualIsNative = isNativeType(actual);
    const expectedIsNative = isNativeType(expected);

    if (expectedIsNative && typeof expected === 'function' && expected._expectIt) {
        let expectItResult;
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
            expectItResult.then(() => {}, () => {});
            throw new RequiresAsyncError();
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

    const actualName = actualAdapter.getName(actual);
    const expectedName = expectedAdapter.getName(expected);

    diffResult = DiffCommon.getElementResult(actualName, expectedName, weights, options);

    const attributesResult = DiffCommon.diffAttributes(actualAdapter.getAttributes(actual), expectedAdapter.getAttributes(expected), expect, options);
    if (typeof attributesResult.then === 'function') {
        // Promise returned, we need to do this async
        throw new RequiresAsyncError();
    }

    let target;

    if (attributesResult.isTarget) {
        target = actual;
    }
    diffResult.attributes = attributesResult.diff;
    weights.addWeight(attributesResult.weight);

    const contentResult = diffContent(actualAdapter, expectedAdapter, actualAdapter.getChildren(actual), expectedAdapter.getChildren(expected), expect, options);

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

    let bestWeight = null;
    let bestDiff = null;
    let bestTarget;

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

    const childrenResult = diffChildren(actualAdapter, expectedAdapter, actual, expected, expect, options);

    if (!bestWeight || childrenResult.weight.real < bestWeight.real) {
        bestDiff = childrenResult.diff;
        bestWeight = childrenResult.weight;
        bestTarget = childrenResult.target;
    }


    let wrapperResult;
    if ((!bestWeight || bestWeight.real !== DiffCommon.WEIGHT_OK) &&
        actual.length === 1 &&
        expected.length !== 0 && !isNativeType(actual[0])) {
        // Try it as a wrapper, and see if it's better
        // Also covered here is a wrapper around several children

        const actualChildren = actualAdapter.getChildren(actual[0]);
        wrapperResult = diffContent(actualAdapter, expectedAdapter, actualChildren, expected, expect, options);
    }

    if (wrapperResult) {
        const wrapperWeight = options.diffWrappers ? options.weights.WRAPPER_REMOVED : DiffCommon.WEIGHT_OK;

        if (!bestWeight || (wrapperWeight + wrapperResult.weight.real) < bestWeight.real) {
            // It could be a wrapper
            bestWeight = wrapperResult.weight;
            bestWeight.addTotal(options.weights.WRAPPER_REMOVED);
            const actualDiff = convertToDiff(actualAdapter, actual[0], { includeChildren: false });
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


    let onlyExact = true;
    let bestDiffResult = null;


    const exactDiffResult = tryDiffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options, onlyExact);

    bestDiffResult = exactDiffResult;

    // If it wasn't a perfect match, and there were both inserts and removals, we can try allowing the children that
    // don't match to be "similar".
    let changesDiffResult;
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

    let diffWeights = new Weights();
    const diffResult = [];

    let insertCount = 0;
    let removeCount = 0;
    let changeCount = 0;

    const actualChildrenLength = actualChildren.length;
    const expectedChildrenLength = expectedChildren.length;

    const cachedDiffs = [];
    cachedDiffs.length = actualChildrenLength * expectedChildrenLength;


    const changes = ArrayChanges(actualChildren, expectedChildren,
        function (a, b, aIndex, bIndex) {
            const cacheIndex = (aIndex * expectedChildrenLength) + bIndex;
            let elementDiff = cachedDiffs[cacheIndex];
            if (!elementDiff) {
                elementDiff = diffElementOrWrapper(actualAdapter, expectedAdapter, a, b, expect, options);
                cachedDiffs[cacheIndex] = elementDiff;
            }
            return (cachedDiffs[cacheIndex].weight.real === DiffCommon.WEIGHT_OK);
        },

        function (a, b, aIndex, bIndex) {

            if (onlyExactMatches) {
                const cacheIndex = (aIndex * expectedChildrenLength) + bIndex;
                let elementDiff = cachedDiffs[cacheIndex];
                if (!elementDiff) {
                    elementDiff = diffElementOrWrapper(actualAdapter, expectedAdapter, a, b, expect, options);
                    cachedDiffs[cacheIndex] = elementDiff;
                }
                return elementDiff.weight.real === DiffCommon.WEIGHT_OK;
            }
            var aIsNativeType = isNativeType(a);
            var bIsNativeType = isNativeType(b);

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


    let target = undefined;
    changes.forEach(diffItem => {

        let itemResult, cachedDiff;
        if (typeof diffItem.actualIndex === 'number' && typeof diffItem.expectedIndex === 'number') {
            const cacheIndex = (diffItem.actualIndex * expectedChildrenLength) + diffItem.expectedIndex;
            cachedDiff = cachedDiffs[cacheIndex];
            if (cachedDiff && cachedDiff.target) {
                target = cachedDiff.target;
            }
        }

        switch (diffItem.type) {
            case 'insert':
                insertCount++;
                let actualIndex = null;
                if (typeof diffItem.actualIndex === 'number') {
                    itemResult = convertToDiff(actualAdapter, diffItem.value);
                    actualIndex = diffItem.actualIndex;
                } else {
                    itemResult = convertToDiff(expectedAdapter, diffItem.value);
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
                itemResult = convertToDiff(actualAdapter, diffItem.value);

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
        target,
        insertCount,
        removeCount,
        changeCount
    };
}

export default {
    diffElements
};

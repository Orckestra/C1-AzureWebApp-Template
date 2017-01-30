import ArrayChangesAsync from 'array-changes-async';
import ObjectAssign from 'object-assign';
import isNativeType from './isNativeType';
import convertToDiff from './convertToDiff';
import LineBreaker from './lineBreaker';
import Weights from './Weights';
import * as DiffCommon from './diffCommon';


function diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    options = ObjectAssign({}, DiffCommon.defaultOptions, options);
    options.weights = ObjectAssign({}, DiffCommon.DefaultWeights, options.weights);
    if (actualAdapter.classAttributeName && actualAdapter.classAttributeName === expectedAdapter.classAttributeName) {
        options.classAttributeName = actualAdapter.classAttributeName;
    }

    return diffElementOrWrapper(actualAdapter, expectedAdapter, actual, expected, expect, options)
        .then(diffResult => {
            return {
                diff: diffResult.diff,
                weight: diffResult.weight.real,
                target: diffResult.target
            };
        });
}

function diffElementOrWrapper(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    const elementResult = diffElement(actualAdapter, expectedAdapter, actual, expected, expect, options);

    return elementResult
        .then(diffResult => {

            if (diffResult.weight.real !== DiffCommon.WEIGHT_OK && !isNativeType(actual)) {

                const actualChildren = actualAdapter.getChildren(actual);

                if (actualChildren.length === 1) {
                    // Try as wrapper
                    return diffElementOrWrapper(actualAdapter, expectedAdapter, actualChildren[0], expected, expect, options)
                        .then(wrapperResult => {
                            return DiffCommon.checkElementWrapperResult(actualAdapter, actual, diffResult, wrapperResult, options);
                        });
                }
            }
            return diffResult;
        });
}


function diffElement(actualAdapter, expectedAdapter, actual, expected, expect, options) {

    const weights = new Weights();
    let diffResult = {};

    const actualIsNative = isNativeType(actual);
    const expectedIsNative = isNativeType(expected);

    const promises = [];

    if (expectedIsNative && typeof expected === 'function' && expected._expectIt) {
        const withErrorResult = expect.withError(() => expected(actual), e => {

            const errorResult = DiffCommon.getExpectItContentErrorResult(actual, expected, e, options);
            diffResult = errorResult.diff;
            weights.addWeight(errorResult.weight);
            return diffResult;
        }).then(() => {

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

        return expect.promise.resolve({ diffResult, weights });

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

    const actualName = actualAdapter.getName(actual);
    const expectedName = expectedAdapter.getName(expected);


    diffResult = DiffCommon.getElementResult(actualName, expectedName, weights, options);

    let target;
    const attributesResultPromise = diffAttributes(actualAdapter.getAttributes(actual), expectedAdapter.getAttributes(expected), expect, options)
        .then(attribResult => {
            diffResult.attributes = attribResult.diff;
            weights.addWeight(attribResult.weight);
            if (attribResult.isTarget) {
                target = actual;
            }
        });

    promises.push(attributesResultPromise);


    const contentResultPromise = diffContent(actualAdapter, expectedAdapter, actualAdapter.getChildren(actual), expectedAdapter.getChildren(expected), expect, options)
        .then(contentResult => {

            diffResult.children = contentResult.diff;
            weights.addWeight(contentResult.weight);
            if (contentResult.target) {
                target = contentResult.target;
            }
        });

    promises.push(contentResultPromise);


    return expect.promise.all(promises).then(() => {

        return {
            diff: diffResult,
            weight: weights,
            target
        };
    });


}

function diffAttributes(actualAttributes, expectedAttributes, expect, options) {

    const result = DiffCommon.diffAttributes(actualAttributes, expectedAttributes, expect, options);
    if (typeof result.then === 'function') {
        return result;
    }
    return expect.promise.resolve(result);
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

    return diffChildren(actualAdapter, expectedAdapter, actual, expected, expect, options).then(childrenResult => {

        if (!bestWeight || childrenResult.weight.real < bestWeight.real) {
            bestDiff = childrenResult.diff;
            bestWeight = childrenResult.weight;
            bestTarget = childrenResult.target;
        }
    }).then(() => {


        if ((!bestWeight || bestWeight.real !== DiffCommon.WEIGHT_OK) &&
            actual.length === 1 &&
            expected.length !== 0 && !isNativeType(actual[0])) {
            // Try it as a wrapper, and see if it's better
            // Also covered here is a wrapper around several children

            const actualChildren = actualAdapter.getChildren(actual[0]);
            return diffContent(actualAdapter, expectedAdapter, actualChildren, expected, expect, options);
        }

        return null;

    }).then(wrapperResult => {

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
    }).then(() => {
        return {
            diff: bestDiff,
            weight: bestWeight,
            target: bestTarget
        };
    });

}



function diffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options) {


    let onlyExact = true;
    let bestDiffResult = null;


    return tryDiffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options, onlyExact)
        .then(exactDiffResult => {

            bestDiffResult = exactDiffResult;

            // If it wasn't a perfect match, and there were both inserts and removals, we can try allowing the children that
            // don't match to be "similar".
            if (exactDiffResult.weight.real !== 0 && exactDiffResult.insertCount && exactDiffResult.removeCount) {
                onlyExact = false;
                return tryDiffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options, onlyExact);
            }
            return null;

        })
        .then(changesDiffResult => {

            if (changesDiffResult && changesDiffResult.weight.real < bestDiffResult.weight.real) {
                bestDiffResult = changesDiffResult;
            }
            return bestDiffResult;
        });
}

function tryDiffChildren(actualAdapter, expectedAdapter, actualChildren, expectedChildren, expect, options, onlyExactMatches) {

    let diffWeights = new Weights();
    const diffResult = [];

    let insertCount = 0;
    let removeCount = 0;
    let changeCount = 0;
    const promises = [];

    return expect.promise((resolve, reject) => {
        const actualChildrenLength = actualChildren.length;
        const expectedChildrenLength = expectedChildren.length;

        const cachedDiffs = [];
        cachedDiffs.length = actualChildrenLength * expectedChildrenLength;

        ArrayChangesAsync(actualChildren, expectedChildren,
            function (a, b, aIndex, bIndex, callback) {

                const cacheIndex = (aIndex * expectedChildrenLength) + bIndex;
                if (cachedDiffs[cacheIndex]) {
                    return callback(cachedDiffs[cacheIndex].weight.real === DiffCommon.WEIGHT_OK);
                }

                diffElementOrWrapper(actualAdapter, expectedAdapter, a, b, expect, options).then(elementDiff => {
                    cachedDiffs[cacheIndex] = elementDiff;
                    return callback(elementDiff.weight.real === DiffCommon.WEIGHT_OK);
                });
            },

            function (a, b, aIndex, bIndex, callback) {

                if (onlyExactMatches) {
                    const cacheIndex = (aIndex * expectedChildrenLength) + bIndex;
                    const diff = cachedDiffs[cacheIndex];
                    if (diff) {
                        return callback(diff.weight.real === DiffCommon.WEIGHT_OK);
                    }

                    return diffElementOrWrapper(actualAdapter, expectedAdapter, a, b, expect, options).then(elementDiff => {
                        cachedDiffs[cacheIndex] = elementDiff;
                        callback(elementDiff.weight.real === DiffCommon.WEIGHT_OK);
                    });
                }
                var aIsNativeType = isNativeType(a);
                var bIsNativeType = isNativeType(b);

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

                let target;
                changes.forEach(diffItem => {

                    let itemResult;
                    let testCached;
                    if (typeof diffItem.actualIndex === 'number' && (typeof diffItem.expectedIndex === 'number' || diffItem.type === 'equal')) {
                        const cacheIndex = (diffItem.actualIndex * expectedChildrenLength) + diffItem.expectedIndex;
                        const cachedDiff = cachedDiffs[cacheIndex];
                        if (cachedDiff && cachedDiff.target) {
                            target = cachedDiff.target;
                        }
                    }

                    switch(diffItem.type) {
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
                        // (equal needs to be diffed, because it may contain wrappers, hence we need to work that out.. again)
                        // It would be good to cache that, from the diff above.

                        case 'equal': //eslint-disable-line no-fallthrough
                        default:
                            const index = diffResult.length;

                            diffResult.push({}); // Push a placeholder, we'll replace when the promise resolves
                            const promise = diffElementOrWrapper(actualAdapter, expectedAdapter, diffItem.value, diffItem.expected, expect, options)
                                .then(result => {
                                    diffResult[index] = result.diff;
                                    diffWeights.addWeight(result.weight);
                                });
                            promises.push(promise);
                            break;
                    }

                });

                if (promises.length) {
                    return expect.promise.all(promises).then(() => {
                        resolve(target);
                    });
                }
                return resolve(target);
            });

    }).then(target => {

        if (actualChildren.length === 0 && expectedChildren.length !== 0 && options.diffMissingChildren) {
            diffWeights.add(options.weights.ALL_CHILDREN_MISSING);
        }

        return {
            weight: diffWeights,
            diff: diffResult,
            insertCount,
            removeCount,
            changeCount,
            target
        };
    });
}

export default {
    diffElements
};

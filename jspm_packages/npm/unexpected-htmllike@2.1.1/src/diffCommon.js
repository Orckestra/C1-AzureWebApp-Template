
import ObjectAssign from 'object-assign';
import convertToDiff from './convertToDiff';
import Weights from './Weights';

// Weightings for diff heuristics

export const DefaultWeights = {
    OK: 0,                  // Only here as a convenience for tests, WEIGHT_OK is used as the constant
    NATIVE_NONNATIVE_MISMATCH: 15,
    NAME_MISMATCH: 10,
    ATTRIBUTE_MISMATCH: 2,
    ATTRIBUTE_MISSING: 2,
    ATTRIBUTE_EXTRA: 1,     // Actual contains an attribute that is not expected
    STRING_CONTENT_MISMATCH: 3,
    CONTENT_TYPE_MISMATCH: 1,
    CHILD_MISSING: 2,
    CHILD_INSERTED: 2,
    WRAPPER_REMOVED: 3,
    ALL_CHILDREN_MISSING: 8  // When the expected has children, and actual has no children
                             // This + CHILD_MISSING should be equal or greater than NAME_MISMATCH
                             // to avoid a name-changed child causing the actual rendered child to
                             // be identified as a wrapper, and the actual child as a missing child
                             // of the wrapper (see the test
                             // "doesn't wrap an element when it means there are missing children"
                             // for an example)
};

export const defaultOptions = {
    diffExtraAttributes: true,
    diffRemovedAttributes: true,
    diffExtraChildren: true,
    diffMissingChildren: true,
    diffWrappers: true,
    diffExactClasses: true,
    diffExtraClasses: true,
    diffMissingClasses: true
};

export const WEIGHT_OK = 0;

export const getOptions = function (options) {

    options = ObjectAssign({}, DiffCommon.defaultOptions, options);
    options.weights = ObjectAssign({}, DiffCommon.DefaultWeights, options.weights);
    if (actualAdapter.classAttributeName && actualAdapter.classAttributeName === expectedAdapter.classAttributeName) {
        options.classAttributeName = actualAdapter.classAttributeName;
    }
};

export const checkElementWrapperResult = function (actualAdapter, actual, currentDiffResult, wrapperResult, options) {

    let diffResult = currentDiffResult;
    const wrapperWeight = options.diffWrappers ? options.weights.WRAPPER_REMOVED : WEIGHT_OK;
    if ((wrapperWeight + wrapperResult.weight.real) < diffResult.weight.real) {
        // It is (better as) a wrapper.
        diffResult = {
            diff: convertToDiff(actualAdapter, actual, { includeChildren: false }),
            weight: wrapperResult.weight.addTotal(options.weights.WRAPPER_REMOVED),
            target: wrapperResult.target
        };
        if (options.diffWrappers) {
            diffResult.diff.diff = {
                type: 'wrapper'
            };
            diffResult.weight.addReal(options.weights.WRAPPER_REMOVED);
        } else {
            diffResult.diff.type = 'WRAPPERELEMENT';
        }

        diffResult.diff.children = [wrapperResult.diff];
    }

    return diffResult;
};

export const getExpectItContentErrorResult = function (actual, expected, error, options) {

    const diffResult = {
        type: 'CONTENT',
        value: actual,
        diff: {
            type: 'custom',
            assertion: expected,
            error: error
        }
    };

    const weights = new Weights();
    weights.add(options.weights.STRING_CONTENT_MISMATCH);
    return {
        diff: diffResult,
        weight: weights
    };
};

export const getNativeContentResult = function (actual, expected, weights, options) {

    const diffResult = {
        type: 'CONTENT',
        value: actual
    };

    if (actual !== expected) {
        diffResult.diff = {
            type: 'changed',
            expectedValue: expected
        };
        if ('' + actual !== '' + expected) {
            weights.add(options.weights.STRING_CONTENT_MISMATCH);
        } else {
            weights.add(options.weights.CONTENT_TYPE_MISMATCH);
        }
    }

    return diffResult;
};

export const getNativeNonNativeResult = function (actual, expected, weights, expectedAdapter, options) {

    weights.add(options.weights.NATIVE_NONNATIVE_MISMATCH);
    return {
        type: 'CONTENT',
        value: actual,
        diff: {
            type: 'contentElementMismatch',
            expected: convertToDiff(expectedAdapter, expected)
        }
    };
};

export const getNonNativeNativeResult = function (actual, expected, weights, actualAdapter, expectedAdapter, options) {

    weights.add(options.weights.NATIVE_NONNATIVE_MISMATCH);
    const diffResult = convertToDiff(actualAdapter, actual);
    diffResult.diff = {
        type: 'elementContentMismatch',
        expected: convertToDiff(expectedAdapter, expected)
    };
    return diffResult;
};

export const getElementResult = function (actualName, expectedName, weights, options) {
    const diffResult = {
        type: 'ELEMENT',
        name: actualName
    };

    if (actualName !== expectedName) {
        diffResult.diff = {
            type: 'differentElement',
            expectedName: expectedName
        };
        weights.add(options.weights.NAME_MISMATCH);
    }
    return diffResult;
};

export const diffAttributes = function (actualAttributes, expectedAttributes, expect, options) {

    let diffWeights = new Weights();
    const diffResult = [];
    // The promises array collects up promises returned from 'to satisfy' assertions
    // on attributes. The promiseHandler is then called at the end if there are any promises
    // in the array. If not, everything was synchronous.

    const promises = [];

    Object.keys(actualAttributes).forEach(attrib => {

        const attribResult = { name: attrib, value: actualAttributes[attrib] };
        diffResult.push(attribResult);

        if (expectedAttributes.hasOwnProperty(attrib)) {
            const expectedAttrib = expectedAttributes[attrib];

            if (attrib === options.classAttributeName && !options.diffExactClasses && typeof expectedAttrib === 'string') {
                getClassDiff(actualAttributes[attrib], expectedAttributes[attrib], attribResult, diffWeights, options);
                return;
            }

            let expectResult;
            let expectError = null;
            
            /* Handle a single expect.it() as the attribute value specially.
             * This improves the output, as it means we don't get the expected 'some attrib value' to satisfy expect.it(....) 
             * before the real output. 
             * 
             * Basically: if this is a single `expect.it()` function, we just want the output from the expect it, 
             * and not leave it to `to satisfy`
             */
            if (typeof expectedAttributes[attrib] === 'function' && expectedAttributes[attrib]._expectIt) {
                try {
                    expectResult = expectedAttributes[attrib](actualAttributes[attrib]);
                } catch (e) {
                    expectError = e;
                }
                
            } else {
                try {
                    expect.errorMode = 'bubble';
                    const attributesAssertion = options.attributesEqual ? 'to equal' : 'to satisfy';

                    expectResult = expect(actualAttributes[attrib], attributesAssertion, expectedAttributes[attrib]);

                } catch (e) {
                    expectError = e;
                }
            }

            if (expectResult && typeof expectResult.isPending === 'function') {
                if (expectResult.isPending()) {
                    promises.push(expectResult.then(() => {}, e => {
                        diffWeights.add(options.weights.ATTRIBUTE_MISMATCH);
                        attribResult.diff = {
                            type: 'changed',
                            expectedValue: expectedAttributes[attrib],
                            error: e
                        };
                    }));
                } else if (expectResult.isRejected()) {
                    diffWeights.add(options.weights.ATTRIBUTE_MISMATCH);
                    attribResult.diff = {
                        type: 'changed',
                        expectedValue: expectedAttributes[attrib],
                        error: expectResult.reason
                    };
                }
            } else if (expectError) {
                diffWeights.add(options.weights.ATTRIBUTE_MISMATCH);
                attribResult.diff = {
                    type: 'changed',
                    expectedValue: expectedAttributes[attrib],
                    error: expectError
                };

            }


        } else {
            if (options.diffExtraAttributes && actualAttributes[attrib] !== undefined) {
                diffWeights.addReal(options.weights.ATTRIBUTE_EXTRA);
                attribResult.diff = {
                    type: 'extra'
                };
            }

            diffWeights.addTotal(options.weights.ATTRIBUTE_EXTRA);
        }
    });

    let isTarget = false;
    Object.keys(expectedAttributes).forEach(attrib => {

        if (!actualAttributes.hasOwnProperty(attrib)) {
            if (attrib === options.findTargetAttrib) {
                // If it's the findTargetAttrib attribute, but it's not true, we still want to ignore the attribute
                // This will allow dynamic testing:   e.g. <SomeChild eventTarget={index === 3 ? true : false} />
                if (expectedAttributes[attrib] === true) {
                    isTarget = true;
                }
            } else {
                if (options.diffRemovedAttributes) {
                    diffWeights.addReal(options.weights.ATTRIBUTE_MISSING);
                    const attribResult = {
                        name: attrib,
                        diff: {
                            type: 'missing',
                            expectedValue: expectedAttributes[attrib]
                        }
                    };
                    diffResult.push(attribResult);
                } 
                diffWeights.addTotal(options.weights.ATTRIBUTE_MISSING);
            }
        }
    });

    if (promises.length) {
        return expect.promise.all(promises).then(() => ({
            diff: diffResult,
            weight: diffWeights,
            isTarget: isTarget
        }));
    }
    
    return {
        diff: diffResult,
        weight: diffWeights,
        isTarget: isTarget
    };
};


function getClassDiff(actualClasses, expectedClasses, diffResult, weights, options) {

    expectedClasses = (expectedClasses || '')
        .split(' ')
        .filter(c => c)
        .reduce((classes, c) => {
            classes[c] = true;
            return classes;
        }, {});

    actualClasses = (actualClasses || '')
        .split(' ')
        .filter(c => c)
        .reduce((classes, c) => {
            classes[c] = true;
            return classes;
        }, {});


    let attributeDiff;
    if (options.diffMissingClasses) {
        const missingClasses = Object.keys(expectedClasses).filter(c => !actualClasses[c]);
        if (missingClasses.length) {
            attributeDiff = {};
            attributeDiff.missing = missingClasses.join(' ');
        }
    }

    if (options.diffExtraClasses) {
        const extraClasses = Object.keys(actualClasses).filter(c => !expectedClasses[c]);

        if (extraClasses.length) {
            attributeDiff = attributeDiff || {};
            attributeDiff.extra = extraClasses.join(' ');
        }
    }

    if (attributeDiff) {
        attributeDiff.type = 'class';
        diffResult.diff = attributeDiff;
        // Not sure what the best to do with the weights is
        // - we might need to have some different weights for class mismatches
        // Only real-world examples will help show what needs to be done here
        weights.add(options.weights.ATTRIBUTE_MISMATCH);
    }
}


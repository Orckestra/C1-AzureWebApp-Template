'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _convertToDiff = require('./convertToDiff');

var _convertToDiff2 = _interopRequireDefault(_convertToDiff);

var _Weights = require('./Weights');

var _Weights2 = _interopRequireDefault(_Weights);

// Weightings for diff heuristics

var DefaultWeights = {
    OK: 0, // Only here as a convenience for tests, WEIGHT_OK is used as the constant
    NATIVE_NONNATIVE_MISMATCH: 15,
    NAME_MISMATCH: 10,
    ATTRIBUTE_MISMATCH: 2,
    ATTRIBUTE_MISSING: 2,
    ATTRIBUTE_EXTRA: 1, // Actual contains an attribute that is not expected
    STRING_CONTENT_MISMATCH: 3,
    CONTENT_TYPE_MISMATCH: 1,
    CHILD_MISSING: 2,
    CHILD_INSERTED: 2,
    WRAPPER_REMOVED: 3,
    ALL_CHILDREN_MISSING: 8 // When the expected has children, and actual has no children
    // This + CHILD_MISSING should be equal or greater than NAME_MISMATCH
    // to avoid a name-changed child causing the actual rendered child to
    // be identified as a wrapper, and the actual child as a missing child
    // of the wrapper (see the test
    // "doesn't wrap an element when it means there are missing children"
    // for an example)
};

exports.DefaultWeights = DefaultWeights;
var defaultOptions = {
    diffExtraAttributes: true,
    diffRemovedAttributes: true,
    diffExtraChildren: true,
    diffMissingChildren: true,
    diffWrappers: true,
    diffExactClasses: true,
    diffExtraClasses: true,
    diffMissingClasses: true
};

exports.defaultOptions = defaultOptions;
var WEIGHT_OK = 0;

exports.WEIGHT_OK = WEIGHT_OK;
var getOptions = function getOptions(options) {

    options = (0, _objectAssign2['default'])({}, DiffCommon.defaultOptions, options);
    options.weights = (0, _objectAssign2['default'])({}, DiffCommon.DefaultWeights, options.weights);
    if (actualAdapter.classAttributeName && actualAdapter.classAttributeName === expectedAdapter.classAttributeName) {
        options.classAttributeName = actualAdapter.classAttributeName;
    }
};

exports.getOptions = getOptions;
var checkElementWrapperResult = function checkElementWrapperResult(actualAdapter, actual, currentDiffResult, wrapperResult, options) {

    var diffResult = currentDiffResult;
    var wrapperWeight = options.diffWrappers ? options.weights.WRAPPER_REMOVED : WEIGHT_OK;
    if (wrapperWeight + wrapperResult.weight.real < diffResult.weight.real) {
        // It is (better as) a wrapper.
        diffResult = {
            diff: (0, _convertToDiff2['default'])(actualAdapter, actual, { includeChildren: false }),
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

exports.checkElementWrapperResult = checkElementWrapperResult;
var getExpectItContentErrorResult = function getExpectItContentErrorResult(actual, expected, error, options) {

    var diffResult = {
        type: 'CONTENT',
        value: actual,
        diff: {
            type: 'custom',
            assertion: expected,
            error: error
        }
    };

    var weights = new _Weights2['default']();
    weights.add(options.weights.STRING_CONTENT_MISMATCH);
    return {
        diff: diffResult,
        weight: weights
    };
};

exports.getExpectItContentErrorResult = getExpectItContentErrorResult;
var getNativeContentResult = function getNativeContentResult(actual, expected, weights, options) {

    var diffResult = {
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

exports.getNativeContentResult = getNativeContentResult;
var getNativeNonNativeResult = function getNativeNonNativeResult(actual, expected, weights, expectedAdapter, options) {

    weights.add(options.weights.NATIVE_NONNATIVE_MISMATCH);
    return {
        type: 'CONTENT',
        value: actual,
        diff: {
            type: 'contentElementMismatch',
            expected: (0, _convertToDiff2['default'])(expectedAdapter, expected)
        }
    };
};

exports.getNativeNonNativeResult = getNativeNonNativeResult;
var getNonNativeNativeResult = function getNonNativeNativeResult(actual, expected, weights, actualAdapter, expectedAdapter, options) {

    weights.add(options.weights.NATIVE_NONNATIVE_MISMATCH);
    var diffResult = (0, _convertToDiff2['default'])(actualAdapter, actual);
    diffResult.diff = {
        type: 'elementContentMismatch',
        expected: (0, _convertToDiff2['default'])(expectedAdapter, expected)
    };
    return diffResult;
};

exports.getNonNativeNativeResult = getNonNativeNativeResult;
var getElementResult = function getElementResult(actualName, expectedName, weights, options) {
    var diffResult = {
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

exports.getElementResult = getElementResult;
var diffAttributes = function diffAttributes(actualAttributes, expectedAttributes, expect, options) {

    var diffWeights = new _Weights2['default']();
    var diffResult = [];
    // The promises array collects up promises returned from 'to satisfy' assertions
    // on attributes. The promiseHandler is then called at the end if there are any promises
    // in the array. If not, everything was synchronous.

    var promises = [];

    Object.keys(actualAttributes).forEach(function (attrib) {

        var attribResult = { name: attrib, value: actualAttributes[attrib] };
        diffResult.push(attribResult);

        if (expectedAttributes.hasOwnProperty(attrib)) {
            var expectedAttrib = expectedAttributes[attrib];

            if (attrib === options.classAttributeName && !options.diffExactClasses && typeof expectedAttrib === 'string') {
                getClassDiff(actualAttributes[attrib], expectedAttributes[attrib], attribResult, diffWeights, options);
                return;
            }

            var expectResult = undefined;
            var expectError = null;

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
                    var attributesAssertion = options.attributesEqual ? 'to equal' : 'to satisfy';

                    expectResult = expect(actualAttributes[attrib], attributesAssertion, expectedAttributes[attrib]);
                } catch (e) {
                    expectError = e;
                }
            }

            if (expectResult && typeof expectResult.isPending === 'function') {
                if (expectResult.isPending()) {
                    promises.push(expectResult.then(function () {}, function (e) {
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

    var isTarget = false;
    Object.keys(expectedAttributes).forEach(function (attrib) {

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
                    var attribResult = {
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
        return expect.promise.all(promises).then(function () {
            return {
                diff: diffResult,
                weight: diffWeights,
                isTarget: isTarget
            };
        });
    }

    return {
        diff: diffResult,
        weight: diffWeights,
        isTarget: isTarget
    };
};

exports.diffAttributes = diffAttributes;
function getClassDiff(actualClasses, expectedClasses, diffResult, weights, options) {

    expectedClasses = (expectedClasses || '').split(' ').filter(function (c) {
        return c;
    }).reduce(function (classes, c) {
        classes[c] = true;
        return classes;
    }, {});

    actualClasses = (actualClasses || '').split(' ').filter(function (c) {
        return c;
    }).reduce(function (classes, c) {
        classes[c] = true;
        return classes;
    }, {});

    var attributeDiff = undefined;
    if (options.diffMissingClasses) {
        var missingClasses = Object.keys(expectedClasses).filter(function (c) {
            return !actualClasses[c];
        });
        if (missingClasses.length) {
            attributeDiff = {};
            attributeDiff.missing = missingClasses.join(' ');
        }
    }

    if (options.diffExtraClasses) {
        var extraClasses = Object.keys(actualClasses).filter(function (c) {
            return !expectedClasses[c];
        });

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
//# sourceMappingURL=diffCommon.js.map
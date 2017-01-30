
import diff from './diff';
import Painter from './painter';
import Contains from './contains';
import convertToDiff from './convertToDiff';

function inspect(adapter, value, depth, output, externalInspector) {

    const diffDescription = convertToDiff(adapter, value);
    Painter(output, diffDescription, null, externalInspector);
    return output;
}

function getDiff(actualAdapter) {

    return function (expectedAdapter, actual, expected, expect, options) {

        return diff.diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options);
    };
}


function getContains(actualAdapter) {

    return function (expectedAdapter, actual, expected, expect, options) {

        return Contains(actualAdapter, expectedAdapter, actual, expected, expect, options);
    };
}


function render(diffResult, output, diff, inspect) {
    Painter(output, diffResult.diff, diff, inspect);
    return output;
}


function withResult(result, callback) {

    if (result && typeof result.then === 'function') {
        // Result was a promise, must have been async
        // If it's a sync promise, callback immediately with the value
        if (result.isResolved()) {
            return callback(result.value);
        }

        return result.then(resolved => {
            return callback(resolved);
        });
    }

    return callback(result);
}


function HtmlLikeUnexpected(adapter) {

    return {
        inspect: inspect.bind(null, adapter),
        diff: getDiff(adapter),
        contains: getContains(adapter),
        render: render,
        withResult: withResult
    };
}

HtmlLikeUnexpected.DefaultWeights = diff.DefaultWeights;

export default HtmlLikeUnexpected;
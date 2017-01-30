import Diff from './diff';
import isNativeType from './isNativeType';
import RequiresAsyncError from './requiresAsyncError';

function contains(actualAdapter, expectedAdapter, actual, expected, equal, options) {

    const containsResult = containsContent(actualAdapter, expectedAdapter, actual, expected, equal, options);

            // If result has WRAPPERELEMENTs around it, remove them
    stripWrapperElements(actualAdapter, containsResult);
    return containsResult;
}

function stripWrapperElements(actualAdapter, containsResult) {

    if (containsResult.bestMatch && containsResult.bestMatch.diff.type === 'WRAPPERELEMENT') {
        // Unwrap the diff and the item
        containsResult.bestMatch.diff = containsResult.bestMatch.diff.children[0];
        containsResult.bestMatchItem = actualAdapter.getChildren(containsResult.bestMatchItem)[0];
        return stripWrapperElements(actualAdapter, containsResult);
    }
    return containsResult;
}


function containsContent(actualAdapter, expectedAdapter, actual, expected, equal, options) {

    let result = {
        found: false,
        bestMatch: null,
        bestMatchItem: null
    };

    const diffResult = Diff.diffElements(actualAdapter, expectedAdapter, actual, expected, equal, options);


    if (diffResult && typeof diffResult.then === 'function') {
        throw new RequiresAsyncError();
    }


    if (diffResult.weight === Diff.DefaultWeights.OK) {
        result.found = true;
        result.bestMatch = diffResult;
        result.bestMatchItem = actual;
        return result;
    }
    result.bestMatch = diffResult;
    result.bestMatchItem = actual;

    if (!isNativeType(actual)) {
        const children = actualAdapter.getChildren(actual);
        if (children) {

            const childrenLength = children.length;

            for(let childIndex = 0; childIndex < childrenLength; ++childIndex) {

                const childResult = containsContent(actualAdapter, expectedAdapter, children[childIndex], expected, equal, options);

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

export default contains;

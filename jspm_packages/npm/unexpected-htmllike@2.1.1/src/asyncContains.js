
import AsyncDiff from './asyncDiff';
import { DefaultWeights } from './diffCommon';
import isNativeType from './isNativeType';

function contains(actualAdapter, expectedAdapter, actual, expected, equal, options) {

    return containsContent(actualAdapter, expectedAdapter, actual, expected, equal, options)
        .then(result => {

            // If result has WRAPPERELEMENTs around it, remove them
            stripWrapperElements(actualAdapter, result);
            return result;
        });
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

    return AsyncDiff.diffElements(actualAdapter, expectedAdapter, actual, expected, equal, options)
        .then(diffResult => {

        if (diffResult.weight === DefaultWeights.OK) {
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

                const checkChild = function (childIndex) {

                    return containsContent(actualAdapter, expectedAdapter, children[childIndex], expected, equal, options)
                        .then(childResult => {

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


                return checkChild(0);
            }
        }

        return result;
    });

}

export default contains;
'use strict';
import { DefaultWeights } from './diffCommon';
import AsyncDiff from './asyncDiff';
import SyncDiff from './syncDiff';
import RequiresAsyncError from './requiresAsyncError';


function diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options) {
    
    try {
        return SyncDiff.diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options);
    } catch (e) {
        if (e instanceof RequiresAsyncError) {
            return AsyncDiff.diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options);
        }
        throw e;
    }

}

export default {
    DefaultWeights: DefaultWeights,
    diffElements: diffElements
};

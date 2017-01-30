
import SyncContains from './syncContains';
import AsyncContains from './asyncContains';

import RequiresAsyncError from './requiresAsyncError';

function contains(actualAdapter, expectedAdapter, actual, expected, equal, options) {
    try {
        return SyncContains(actualAdapter, expectedAdapter, actual, expected, equal, options);
    } catch (e) {
        if (e instanceof RequiresAsyncError) {
            return AsyncContains(actualAdapter, expectedAdapter, actual, expected, equal, options);
        }
        throw e;
    }
}

export default contains;

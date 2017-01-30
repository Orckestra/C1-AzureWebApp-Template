(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('lru-cache'));
    } else if (typeof define === 'function' && define.amd) {
        define(['LRUCache'], factory);
    } else {
        root.memoizeSync = factory(root.LRUCache);
    }
}(this, function (LRU) {
    var nextCacheKeyPrefix = 1;
    return function memoizeSync(lambda, options) {
        options = options || {};
        var argumentsStringifier = options.argumentsStringifier || function (args) {
                return args.map(String).join('\x1d'); // Group separator
            },
            waitingCallbacksByStringifiedArguments = {},
            cacheKeyPrefix,
            cache;

        if ('cacheKeyPrefix' in options) {
            cacheKeyPrefix = String(options.cacheKeyPrefix);
        } else {
            cacheKeyPrefix = nextCacheKeyPrefix + '\x1d',
            nextCacheKeyPrefix += 1;
        }

        if (options.cache) {
            cache = options.cache;
        } else {
            var lruCacheOptions = {};
            for (var propertyName in options) {
                if (Object.prototype.hasOwnProperty.call(options, propertyName) && propertyName !== 'argumentsStringifier' && propertyName !== 'cacheKeyPrefix' && propertyName !== 'context') {
                    lruCacheOptions[propertyName] = options[propertyName];
                }
            }
            cache = new LRU(lruCacheOptions);
        }

        function returnValueOrThrowException(exceptionAndReturnValue) {
            if (exceptionAndReturnValue[0]) {
                throw exceptionAndReturnValue[0];
            } else {
                return exceptionAndReturnValue[1];
            }
        }

        function memoizer() { // ...
            var that = this, // In case you want to create a memoized method
                args = Array.prototype.slice.call(arguments),
                stringifiedArguments = String(argumentsStringifier(args)), // In case the function returns a non-string
                exceptionAndReturnValue = cache.get(cacheKeyPrefix + stringifiedArguments);
            if (!exceptionAndReturnValue) {
                var returnValue,
                    exception = null;
                try {
                    returnValue = lambda.apply(options.context || that, args);
                } catch (e) {
                    exception = e;
                }
                exceptionAndReturnValue = [exception, returnValue];
                if (exception === null || options.exceptions) {
                    cache.set(cacheKeyPrefix + stringifiedArguments, exceptionAndReturnValue);
                }
            }
            return returnValueOrThrowException(exceptionAndReturnValue);
        }

        memoizer.cache = cache;
        memoizer.cacheKeyPrefix = cacheKeyPrefix;
        memoizer.argumentsStringifier = argumentsStringifier;

        memoizer.peek = function () { // ...
            return returnValueOrThrowException(cache.get(cacheKeyPrefix + argumentsStringifier(Array.prototype.slice.call(arguments))));
        };

        memoizer.purge = function () { // ...
            cache.del(cacheKeyPrefix + argumentsStringifier(Array.prototype.slice.call(arguments)));
        };

        memoizer.purgeAll = function () {
            // Cannot use cache.forEach with cache.del in the callback, that screws up the iteration.
            var keys = cache.keys();
            for (var i = 0 ; i < keys.length ; i += 1) {
                var key = keys[i];
                if (key.indexOf(cacheKeyPrefix) === 0) {
                    cache.del(key);
                }
            }
        };

        return memoizer;
    };
}));

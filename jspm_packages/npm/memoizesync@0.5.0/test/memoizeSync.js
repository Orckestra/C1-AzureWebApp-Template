var memoizeSync = require('../lib/memoizeSync'),
    LRUCache = require('lru-cache'),
    expect = require('unexpected');

describe('memoizeSync', function () {
    it('on a zero-param function should keep returning the same result', function () {
        var nextNumber = 1,
            memoizedGetNextNumber = memoizeSync(function getNextNumber() {
                return nextNumber++;
            });

        expect(memoizedGetNextNumber(), 'to equal', 1);
        expect(memoizedGetNextNumber(), 'to equal', 1);
    });

    it('on a multi-param function should only return the same result when the parameters are the same', function () {
        var nextNumber = 1,
            memoizedSumOfOperandsPlusNextNumber = memoizeSync(function sumOfOperandsPlusNextNumber(op1, op2) {
                return op1 + op2 + nextNumber++;
            });

        expect(memoizedSumOfOperandsPlusNextNumber(10, 10), 'to equal', 21);
        expect(memoizedSumOfOperandsPlusNextNumber(10, 10), 'to equal', 21);
        expect(memoizedSumOfOperandsPlusNextNumber(10, 20), 'to equal', 32);
        memoizedSumOfOperandsPlusNextNumber.purge(10, 20);
        expect(memoizedSumOfOperandsPlusNextNumber(10, 20), 'to equal', 33);
        expect(memoizedSumOfOperandsPlusNextNumber(10, 10), 'to equal', 21);
        memoizedSumOfOperandsPlusNextNumber.purgeAll();
        expect(memoizedSumOfOperandsPlusNextNumber(10, 20), 'to equal', 34);
        expect(memoizedSumOfOperandsPlusNextNumber(10, 10), 'to equal', 25);
    });

    it('should produce a function that works as a method', function () {
        function Counter() {
            this.nextNumber = 1;
        }

        Counter.prototype.getNextNumber = memoizeSync(function () {
            return this.nextNumber++;
        });

        var counter = new Counter();

        expect(counter.getNextNumber(), 'to equal', 1);
        expect(counter.nextNumber, 'to equal', 2);
        expect(counter.getNextNumber(), 'to equal', 1);
        counter.getNextNumber.purge();
        expect(counter.getNextNumber(), 'to equal', 2);
        expect(counter.nextNumber, 'to equal', 3);
    });

    it('should work with a custom argumentsStringifier', function () {
        function toCanonicalJson(obj) {
            return JSON.stringify(function traverseAndSortKeys(obj) {
                if (Array.isArray(obj)) {
                    return obj.map(traverseAndSortKeys);
                } else if (typeof obj === 'object' && obj !== null) {
                    var resultObj = {};
                    Object.keys(obj).sort().forEach(function (key) {
                        resultObj[key] = traverseAndSortKeys(obj[key]);
                    });
                    return resultObj;
                } else {
                    return obj;
                }
            }(obj));
        }

        var nextNumber = 1,
            memoizedGetNextNumber = memoizeSync(function getNextNumber(obj, cb) {
                return nextNumber++;
            }, {
                argumentsStringifier: function (args) {
                    return args.map(toCanonicalJson).join('\x1d');
                }
            });

        expect(memoizedGetNextNumber({foo: 'bar', quux: 'baz'}), 'to equal', 1);
        expect(memoizedGetNextNumber({quux: 'baz', foo: 'bar'}), 'to equal', 1);
        expect(memoizedGetNextNumber({barf: 'baz'}), 'to equal', 2);
    });

    it('with a maxAge should recompute the value after it has become stale', function (done) {
        var nextNumber = 1,
            memoizedGetNextNumber = memoizeSync(function getNextNumber(cb) {
                return nextNumber++;
            }, {maxAge: 10});

        expect(memoizedGetNextNumber(), 'to equal', 1);
        expect(memoizedGetNextNumber(), 'to equal', 1);
        setTimeout(function () {
            expect(memoizedGetNextNumber(), 'to equal', 2);
            done();
        }, 15);
    });

    it('with a max limit should purge the least recently used result', function () {
        var nextNumber = 1,
            memoizedGetNextNumberPlusOtherNumber = memoizeSync(function getNextNumber(otherNumber) {
                return otherNumber + (nextNumber++);
            }, {max: 2});

        expect(memoizedGetNextNumberPlusOtherNumber(1), 'to equal', 2);
        expect(memoizedGetNextNumberPlusOtherNumber.peek(1), 'to equal', 2);
        expect(memoizedGetNextNumberPlusOtherNumber(2), 'to equal', 4);
        expect(memoizedGetNextNumberPlusOtherNumber(1), 'to equal', 2);
        // This will purge memoizedGetNextNumberPlusOtherNumber(2):
        expect(memoizedGetNextNumberPlusOtherNumber(3), 'to equal', 6);
        expect(memoizedGetNextNumberPlusOtherNumber(2), 'to equal', 6);
    });

    it('with a length function should count correctly', function () {
        var returnLongStringNextTime = false,
            functionThatReturnsALongStringEverySecondTime = function (number) {
                var returnValue;
                if (returnLongStringNextTime) {
                    returnValue = 'longString';
                } else {
                    returnValue = 'a';
                }
                returnLongStringNextTime = !returnLongStringNextTime;
                return returnValue;
            },
            memoizedFunctionThatReturnsALongStringEverySecondTime = memoizeSync(functionThatReturnsALongStringEverySecondTime, {
                length: function (exceptionAndReturnValue) {
                    return exceptionAndReturnValue[0] ? 1 : exceptionAndReturnValue[1].length;
                }
            });
        memoizedFunctionThatReturnsALongStringEverySecondTime(1);
        expect(memoizedFunctionThatReturnsALongStringEverySecondTime.cache.length, 'to equal', 1);
        memoizedFunctionThatReturnsALongStringEverySecondTime(2);
        expect(memoizedFunctionThatReturnsALongStringEverySecondTime.cache.length, 'to equal', 11);
        memoizedFunctionThatReturnsALongStringEverySecondTime(1);
        expect(memoizedFunctionThatReturnsALongStringEverySecondTime.cache.length, 'to equal', 11);
        memoizedFunctionThatReturnsALongStringEverySecondTime(3);
        expect(memoizedFunctionThatReturnsALongStringEverySecondTime.cache.length, 'to equal', 12);
    });

    it('should leave unrelated values in the cache when purgeAll is called', function () {
        var memoizedSum = memoizeSync(function sum(a, b) {
                return a + b;
            }),
            cache = memoizedSum.cache,
            sum = memoizedSum(1, 2);

        expect(sum, 'to equal', 3);
        expect(cache.keys().length, 'to equal', 1);
        cache.set('foo', 'bar');
        expect(cache.keys().length, 'to equal', 2);
        memoizedSum.purgeAll();
        expect(cache.keys().length, 'to equal', 1);
        expect(cache.get('foo'), 'to equal', 'bar');
    });

    it('should allow passing an existing lru-cache instance in the options object', function () {
        function sum(a, b) {
            return a + b;
        }
        var cache = new LRUCache(),
            memoizedSum1 = memoizeSync(sum, {cache: cache});
        expect(memoizedSum1.cache, 'to be', cache);

        var memoizedSum2 = memoizeSync(sum, {cache: cache});
        expect(memoizedSum2.cache, 'to be', cache);
        var sum = memoizedSum1(1, 2);
        expect(sum, 'to equal', 3);
        expect(cache.keys().length, 'to equal', 1);
        expect(cache.get(memoizedSum1.cacheKeyPrefix + memoizedSum1.argumentsStringifier([1, 2])), 'to equal', [null, 3]);
        sum = memoizedSum2(1, 2);
        expect(sum, 'to equal', 3);
        expect(cache.keys().length, 'to equal', 2);
    });

    it('should allow specifying a custom cacheKeyPrefix', function () {
        var memoizedSum = memoizeSync(function (a, b) {
            return a + b;
        }, {
            cacheKeyPrefix: 999
        });

        expect(memoizedSum.cacheKeyPrefix, 'to be', '999');

        var sum = memoizedSum(1, 2);
        expect(sum, 'to equal', 3);
        expect(memoizedSum.cache.get('999' + memoizedSum.argumentsStringifier([1, 2])), 'to equal', [null, 3]);
    });

    it('should call the memoized function in options.context if specified', function () {
        var memoizedFunction = memoizeSync(function (a) {
            return this.foo + a;
        }, {context: {foo: 4}});
        expect(memoizedFunction(8), 'to equal', 12);
    });

    it('should not memoize exceptions per default', function () {
        var memoizedFunction = memoizeSync(function () {
            throw new Error('foo');
        });
        expect(memoizedFunction, 'to throw', function (err) {
            expect(err, 'to be an', Error);
            expect(err.message, 'to equal', 'foo');
            expect(memoizedFunction, 'to throw', function (err2) {
                expect(err2, 'to be an', Error);
                expect(err2.message, 'to equal', 'foo');
                expect(err2, 'not to be', err);
            });
        });
    });

    it('should memoize exceptions if the `exceptions` option is set to true', function () {
        var memoizedFunction = memoizeSync(function () {
            throw new Error('foo');
        }, {exceptions: true});
        expect(memoizedFunction, 'to throw', function (err) {
            expect(err, 'to be an', Error);
            expect(err.message, 'to equal', 'foo');
            expect(memoizedFunction, 'to throw', function (err2) {
                expect(err2, 'to be an', Error);
                expect(err2.message, 'to equal', 'foo');
                expect(err2, 'to be', err);
            });
        });
    });
});

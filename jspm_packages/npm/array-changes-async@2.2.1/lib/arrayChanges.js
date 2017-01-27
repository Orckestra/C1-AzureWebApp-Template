/*global setTimeout */
var arrayDiff = require('arraydiff-async');
var MAX_STACK_DEPTH = 1000;

function extend(target) {
    for (var i = 1; i < arguments.length; i += 1) {
        var source = arguments[i];
        Object.keys(source).forEach(function (key) {
            target[key] = source[key];
        });
    }
    return target;
}

module.exports = function arrayChanges(actual, expected, equal, similar, includeNonNumericalProperties, arrayChangesCallback) {
    if (typeof includeNonNumericalProperties === 'function') {
        arrayChangesCallback = includeNonNumericalProperties;
        includeNonNumericalProperties = false;
    }
    var mutatedArray = new Array(actual.length);

    for (var k = 0; k < actual.length; k += 1) {
        mutatedArray[k] = {
            type: 'similar',
            actualIndex: k,
            value: actual[k]
        };
    }

    similar = similar || function (a, b, aIndex, bIndex, callback) {
            return callback(false);
        };

    arrayDiff([].concat(actual), [].concat(expected), function (a, b, aIndex, bIndex, callback) {
        equal(a, b, aIndex, bIndex, function (isEqual) {
            if (isEqual) {
                return callback(true);
            }
            similar(a, b, aIndex, bIndex, function (isSimilar) {
                return callback(isSimilar);
            });
        });
    }, function (itemsDiff) {

        function offsetIndex(index) {
            var offsetIndex = 0;
            var i;
            for (i = 0; i < mutatedArray.length && offsetIndex < index; i += 1) {
                if (mutatedArray[i].type !== 'remove') {
                    offsetIndex++;
                }
            }

            return i;
        }

        var removes = itemsDiff.filter(function (diffItem) {
            return diffItem.type === 'remove';
        });

        var removedItems = 0;
        removes.forEach(function (diffItem) {
            var removeIndex = removedItems + diffItem.index;
            mutatedArray.slice(removeIndex, diffItem.howMany + removeIndex).forEach(function (v) {
                v.type = 'remove';
            });
            removedItems += diffItem.howMany;
        });

        var moves = itemsDiff.filter(function (diffItem) {
            return diffItem.type === 'move';
        });

        moves.forEach(function (diffItem) {
            var moveFromIndex = offsetIndex(diffItem.from + 1) - 1;
            var removed = mutatedArray.slice(moveFromIndex, diffItem.howMany + moveFromIndex);
            var added = removed.map(function (v) {
                return extend({}, v, { last: false, type: 'insert' });
            });
            removed.forEach(function (v) {
                v.type = 'remove';
            });
            var insertIndex = offsetIndex(diffItem.to);
            Array.prototype.splice.apply(mutatedArray, [insertIndex, 0].concat(added));
        });

        var inserts = itemsDiff.filter(function (diffItem) {
            return diffItem.type === 'insert';
        });

        inserts.forEach(function (diffItem) {
            var added = new Array(diffItem.values.length);
            for (var i = 0 ; i < diffItem.values.length ; i += 1) {
                added[i] = {
                    type: 'insert',
                    value: diffItem.values[i]
                };
            }
            Array.prototype.splice.apply(mutatedArray, [offsetIndex(diffItem.index), 0].concat(added));
        });

        var offset = 0;
        mutatedArray.forEach(function (diffItem, index) {
            var type = diffItem.type;
            if (type === 'remove') {
                offset -= 1;
            } else if (type === 'similar') {
                diffItem.expected = expected[offset + index];
                diffItem.expectedIndex = offset + index;
            }
        });

        var conflicts = mutatedArray.reduce(function (conflicts, item) {
            return item.type === 'similar' ? conflicts : conflicts + 1;
        }, 0);

        var end = Math.max(actual.length, expected.length);

        var countConflicts = function (i, c, stackCallsRemaining, callback) {

            if (i >= end || c > conflicts) {
                // Do a setTimeout to let the stack unwind
                return setTimeout(function () {
                    callback(c);
                }, 0);
            }

            similar(actual[i], expected[i], i, i, function (areSimilar) {
                if (!areSimilar) {
                    c += 1;
                    if (stackCallsRemaining === 0) {
                        return setTimeout(function () {
                            countConflicts(i + 1, c, MAX_STACK_DEPTH, callback);
                        });
                    }
                    return countConflicts(i + 1, c, stackCallsRemaining - 1, callback);
                }
                equal(actual[i], expected[i], i, i, function (areEqual) {
                    if (!areEqual) {
                        c += 1;
                    }
                    if (stackCallsRemaining === 0) {
                        return setTimeout(function () {
                            countConflicts(i + 1, c, MAX_STACK_DEPTH, callback);
                        });
                    }
                    return countConflicts(i + 1, c, stackCallsRemaining - 1, callback);
                });
            });
        };

        countConflicts(0, 0, MAX_STACK_DEPTH, function (c) {
            if (c <= conflicts) {
                mutatedArray = [];
                var j;
                for (j = 0; j < Math.min(actual.length, expected.length); j += 1) {
                    mutatedArray.push({
                        type: 'similar',
                        actualIndex: j,
                        expectedIndex: j,
                        value: actual[j],
                        expected: expected[j]
                    });
                }

                if (actual.length < expected.length) {
                    for (; j < Math.max(actual.length, expected.length); j += 1) {
                        mutatedArray.push({
                            type: 'insert',
                            value: expected[j]
                        });
                    }
                } else {
                    for (; j < Math.max(actual.length, expected.length); j += 1) {
                        mutatedArray.push({
                            type: 'remove',
                            value: actual[j]
                        });
                    }
                }
            }

            var setEqual = function (i, stackCallsRemaining, callback) {
                if (i >= mutatedArray.length) {
                    return callback();
                }
                var diffItem = mutatedArray[i];
                if (diffItem.type === 'similar') {
                    return equal(diffItem.value, diffItem.expected, diffItem.actualIndex, diffItem.expectedIndex, function (areEqual) {
                        if (areEqual) {
                            mutatedArray[i].type = 'equal';
                        }
                        if (stackCallsRemaining === 0) {
                            return setTimeout(function () {
                                setEqual(i + 1, MAX_STACK_DEPTH, callback);
                            });
                        }
                        setEqual(i + 1, stackCallsRemaining - 1, callback);
                    });
                }
                if (stackCallsRemaining === 0) {
                    return setTimeout(function () {
                        setEqual(i + 1, MAX_STACK_DEPTH, callback);
                    });
                }
                return setEqual(i + 1, stackCallsRemaining - 1, callback);
            };

            if (includeNonNumericalProperties) {
                var nonNumericalKeys;
                if (Array.isArray(includeNonNumericalProperties)) {
                    nonNumericalKeys = includeNonNumericalProperties;
                } else {
                    var isSeenByNonNumericalKey = {};
                    nonNumericalKeys = [];
                    [actual, expected].forEach(function (obj) {
                        Object.keys(obj).forEach(function (key) {
                            if (!/^(?:0|[1-9][0-9]*)$/.test(key) && !isSeenByNonNumericalKey[key]) {
                                isSeenByNonNumericalKey[key] = true;
                                nonNumericalKeys.push(key);
                            }
                        });
                        if (Object.getOwnPropertySymbols) {
                            Object.getOwnPropertySymbols(obj).forEach(function (symbol) {
                                if (!isSeenByNonNumericalKey[symbol]) {
                                    isSeenByNonNumericalKey[symbol] = true;
                                    nonNumericalKeys.push(symbol);
                                }
                            });
                        }
                    });
                }
                nonNumericalKeys.forEach(function (key) {
                    if (key in actual) {
                        if (key in expected) {
                            mutatedArray.push({
                                type: 'similar',
                                expectedIndex: key,
                                actualIndex: key,
                                value: actual[key],
                                expected: expected[key]
                            });
                        } else {
                            mutatedArray.push({
                                type: 'remove',
                                actualIndex: key,
                                value: actual[key]
                            });
                        }
                    } else {
                        mutatedArray.push({
                            type: 'insert',
                            expectedIndex: key,
                            value: expected[key]
                        });
                    }
                });
            }

            setEqual(0, MAX_STACK_DEPTH, function () {
                if (mutatedArray.length > 0) {
                    mutatedArray[mutatedArray.length - 1].last = true;
                }

                arrayChangesCallback(mutatedArray);
            });
        });
    });
};

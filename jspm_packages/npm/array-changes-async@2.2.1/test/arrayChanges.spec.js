/*global describe, it, setTimeout, Symbol*/
var arrayChanges = require('../lib/arrayChanges');
var expect = require('unexpected').clone()
    .use(require('unexpected-check'));
var generators = require('chance-generators');

function toArguments() {
    return arguments;
}

function promiseArrayChanges(actual, expected, equal, similar, includeNonNumericalProperties) {
    var isCalled = 0;
    return expect.promise(function (resolve, reject) {
       arrayChanges(actual, expected, equal, similar, includeNonNumericalProperties, function (itemDiff) {
           isCalled += 1;
           var stack = '';

           // Grab the stack now, in case the callback is called more than once
           try {
               throw new Error();
           } catch (e) {
               stack = e.stack;
           }

           setTimeout(function () {

               if (isCalled !== 1) {
                   return reject('callback called more than once' + stack);
               }
               resolve(itemDiff);
           });

       });
    });
}

function executeDiff(changes) {
    var result = [];

    changes.forEach(function (item) {
        switch (item.type) {
        case 'moveTarget':
        case 'insert':
            result.push(item.value);
            break;
        case 'equal':
        case 'similar':
            if (typeof item.expected === 'number') {
                result.push(item.expected);
            }

            break;
        }
    });

    return result;
}

expect.addAssertion('<array> when diffed with <array> <assertion>', function (expect, actual, expected) {
    expect.errorMode = 'nested';
    return promiseArrayChanges(actual, expected, function (a, b, aIndex, bIndex, callback) {
        return callback(a === b);
    }).then(function (diff) {
        return expect.shift(diff);
    });
});

expect.addAssertion('<array> when executing the diff <assertion>', function (expect, diff) {
    expect.errorMode = 'nested';
    return expect.shift(executeDiff(diff));
});


describe('array-changes-async', function () {
    it('returns an empty change-list when the two arrays are both empty', function () {
        return expect(promiseArrayChanges([], [], function (a, b, callback) {
            return callback(a === b);
        }), 'when fulfilled', 'to equal', []);
    });

    it('returns a change-list with no changes if the arrays are the same', function () {
        return expect(promiseArrayChanges([0, 1, 2, 3], [0, 1, 2, 3], function (a, b, aIndex, bIndex, callback) {
            return callback(a === b);
        }), 'when fulfilled', 'to satisfy', [
            { type: 'equal', value: 0, expected: 0 },
            { type: 'equal', value: 1, expected: 1 },
            { type: 'equal', value: 2, expected: 2 },
            { type: 'equal', value: 3, expected: 3, last: true }
        ]);
    });

    it('should indicate item removals', function () {
        return expect(promiseArrayChanges([0, 1, 2, 3], [0, 1, 3], function (a, b, aIndex, bIndex, callback) {
            return callback(a === b);
        }), 'when fulfilled', 'to satisfy', [
            { type: 'equal', value: 0, expected: 0 },
            { type: 'equal', value: 1, expected: 1 },
            { type: 'remove', value: 2 },
            { type: 'equal', value: 3, expected: 3, last: true }
        ]);
    });

    it('should indicate item removals at the end', function () {
        return expect(promiseArrayChanges([0], [], function (a, b, aIndex, bIndex, callback) {
            return callback(a === b);
        }), 'when fulfilled', 'to equal', [
            { type: 'remove', value: 0, last: true }
        ]);
    });

    it('should indicate missing items', function () {
        return expect(promiseArrayChanges([0, 1, 3], [0, 1, 2, 3], function (a, b, aIndex, bIndex, callback) {
            return callback(a === b);
        }), 'when fulfilled', 'to satisfy', [
            { type: 'equal', value: 0, expected: 0 },
            { type: 'equal', value: 1, expected: 1 },
            { type: 'insert', value: 2 },
            { type: 'equal', value: 3, last: true, expected: 3 }
        ]);
    });

    it('should indicate a missing item at the end', function () {
        return expect(promiseArrayChanges([], [0], function (a, b, aIndex, bIndex, callback) {
            return callback(a === b);
        }), 'when fulfilled', 'to satisfy', [
            { type: 'insert', value: 0, last: true }
        ]);
    });

    it('should treat moved items as removed and inserted', function () {
        return expect(promiseArrayChanges([1, 2, 3, 0], [0, 1, 2, 3], function (a, b, aIndex, bIndex, callback) {
            return callback(a === b);
        }), 'when fulfilled', 'to satisfy', [
            { type: 'insert', value: 0, last: false },
            { type: 'equal', value: 1, expected: 1 },
            { type: 'equal', value: 2, expected: 2 },
            { type: 'equal', value: 3, expected: 3 },
            { type: 'remove', value: 0, last: true }
        ]);
    });

    it('shows items that are not equal but should be compared against each other as similar', function () {
        return expect(promiseArrayChanges([0, 1, 2, 3], [0, 2, 1, 3], function (a, b, aIndex, bIndex, callback) {
            return callback(a === b);
        }, function (a, b, aIndex, bIndex, callback) {
            callback(true);
        }), 'when fulfilled', 'to satisfy', [
                { type: 'equal', value: 0, expected: 0 },
                { type: 'similar', value: 1, expected: 2 },
                { type: 'similar', value: 2, expected: 1 },
                { type: 'equal', value: 3, expected: 3, last: true }
            ]
        );
    });

    it('allows you to indicate which items should be considered similar', function () {
        return expect(promiseArrayChanges([
            { type: 'dog', name: 'Fido' },
            { type: 'dog', name: 'Teddy' },
            { type: 'person', name: 'Sune' },
            { type: 'dog', name: 'Charlie' },
            { type: 'dog', name: 'Sam' }
        ], [
            { type: 'dog', name: 'Fido' },
            { type: 'dog', name: 'Teddy' },
            { type: 'dog', name: 'Murphy' },
            { type: 'person', name: 'Andreas' },
            { type: 'dog', name: 'Charlie' },
            { type: 'dog', name: 'Sam' }
        ], function (a, b, aIndex, bIndex, callback) {
            return callback(a.type === b.type && a.name === b.name);
        }, function (a, b, aIndex, bIndex, callback) {
            return callback(a.type === b.type);
        }), 'when fulfilled', 'to satisfy', [
            {
                type: 'equal',
                value: { type: 'dog', name: 'Fido' },
                expected: { type: 'dog', name: 'Fido' }
            },
            {
                type: 'equal',
                value: { type: 'dog', name: 'Teddy' },
                expected: { type: 'dog', name: 'Teddy' }
            },
            {
                type: 'insert',
                value: { type: 'dog', name: 'Murphy' }
            },
            {
                type: 'similar',
                value: { type: 'person', name: 'Sune' },
                expected: { type: 'person', name: 'Andreas' }
            },
            {
                type: 'equal',
                value: { type: 'dog', name: 'Charlie' },
                expected: { type: 'dog', name: 'Charlie' }
            },
            {
                type: 'equal',
                value: { type: 'dog', name: 'Sam' },
                last: true,
                expected: { type: 'dog', name: 'Sam' }
            }
        ]);
    });

    it('supports diffing array-like objects', function () {
        return expect(promiseArrayChanges(toArguments(1, 2, 5), toArguments(3, 4), function (a, b, aIndex, bIndex, callback) {
            return callback(a === b);
        }), 'when fulfilled', 'to satisfy', [
            { type: 'insert', value: toArguments( 3, 4 ) },
            { type: 'remove', value: 1 },
            { type: 'similar', value: 2, expected: 4 },
            { type: 'similar', value: 5, last: true, expected: undefined }
        ]);
    });

    it('supports diffing spotting non-similar objects', function () {

        return expect(promiseArrayChanges([ { name: 'steve' }, { name: 'monica' }, { name: 'sam' } ],
            [ { name: 'andreas' }, { name: 'sune' }, { name: 'peter' } ], function (a, b, aIndex, bIndex, callback) {
            return callback(a === b);
        }, function (a, b, aIndex, bIndex, callback) {
            return callback(false); // nothing is similar
        }), 'when fulfilled', 'to satisfy', [
            { type: 'similar', value: { name: 'steve' } },  // This feels wrong
            { type: 'similar', value: { name: 'monica' } },
            { type: 'similar', value: { name: 'sam' } }
        ]);
    });

    it('supports diffing non-matching types', function () {
        // This test is specifically targeted to exercise the "similar, but not object or string"
        // part of the algorithm. I believe the type checks should come out of array-changes, and
        // go back to unexpected (where they came from), as they don't make sense here
        // What is equal, and what is similar should be a pure decision of the functions passed in,
        // and nothing to do with the types of the values.
        // UPDATE: The "similar, but not object or string" checks have been removed, this test still works :)
        return expect(promiseArrayChanges([ true, false, true ],
            [ { name: 'steve' }, { name: 'monica' }, { name: 'sam' } ], function (a, b, aIndex, bIndex, callback) {
                return callback(a === b);
            }, function (a, b, aIndex, bIndex, callback) {
                return callback(true); // everything is similar
            }), 'when fulfilled', 'to satisfy', [
            { type: 'similar', value: true },
            { type: 'similar', value: false },
            { type: 'similar', value: true }
        ]);

    });

    it('matches the example in the readme', function () {

        return expect(promiseArrayChanges([ 1, 2, 4 ], [ 1, 2, 3, 4 ], function (a, b, aIndex, bIndex, callback) {
            callback(a === b);
        }, null), 'when fulfilled', 'to satisfy', [
            { type: 'equal', value: 1 },
            { type: 'equal', value: 2 },
            { type: 'insert', value: 3 },
            { type: 'equal', value: 4 }
        ]);
    });

    it('marks items as similar only when the similar function reports they are similar', function () {

        return expect(promiseArrayChanges(
            [ 1, 2.4, /* missing*/  4 ],
            [ 1, 2,   3,            4.7 ],
            function (a, b, aIndex, bIndex, callback) {
            callback(a === b);
        }, function (a, b, aIndex, bIndex, callback) {
                if (Math.floor(a) === Math.floor(b)) {
                    return callback(true);
                }
                return callback(false);
            }), 'when fulfilled', 'to satisfy', [
            { type: 'equal', value: 1 },
            { type: 'similar', value: 2.4, expected: 2 },
            { type: 'insert', value: 3 },
            { type: 'similar', value: 4, expected: 4.7 }
        ]);
    });

    it('does not provide the value from the expected if the value moves', function () {

        // If the `similar` callback returns false when `equal` returns true, the algorithm
        // gets the wrong answer, and includes the expected value as `value` in the result
        // This isn't a problem with the algorithm, as an equal value must be similar,
        // but this test just checks that for a move operation, we don't get values from the
        // "wrong" side
        return expect(promiseArrayChanges(
            [ 4, 2, 3, 1  ], [ 100, 200, 300, 400 ], function (a, b, aIndex, bIndex, callback){
                return callback(a * 100 === b);
            }, function (a, b, aIndex, bIndex, callback) { return callback(a * 100 === b); }),
            'when fulfilled', 'to satisfy', [
                { type: 'similar', value: 4, expected: 100 },
                { type: 'equal', value: 2, expected: 200 },
                { type: 'equal', value: 3, expected: 300 },
                { type: 'similar', value: 1, expected: 400 }
            ]);
    });

    it('should diff arrays that have non-numerical property names', function () {
        var a = [1, 2, 3];
        a.foo = 123;
        a.bar = 456;
        a.quux = {};

        var b = [1, 2, 3];
        b.bar = 456;
        b.baz = 789;
        b.quux = false;
        return expect(promiseArrayChanges(a, b, function (a, b, aIndex, bIndex, callback) {
            callback(a === b);
        }, function (a, b, aIndex, bIndex, callback) {
            callback(a === b);
        }, true), 'when fulfilled', 'to equal', [
            { type: 'equal', value: 1, expected: 1, actualIndex: 0, expectedIndex: 0 },
            { type: 'equal', value: 2, expected: 2, actualIndex: 1, expectedIndex: 1 },
            { type: 'equal', value: 3, expected: 3, actualIndex: 2, expectedIndex: 2 },
            { type: 'remove', value: 123, actualIndex: 'foo' },
            { type: 'equal', value: 456, expected: 456, actualIndex: 'bar', expectedIndex: 'bar' },
            { type: 'similar', value: {}, expected: false, actualIndex: 'quux', expectedIndex: 'quux' },
            { type: 'insert', value: 789, expectedIndex: 'baz', last: true }
        ]);
    });

    it('should support an array of specific non-numerical keys to diff', function () {
        var a = [1];
        a.foo = 123;
        a.bar = 789;

        var b = [1];
        a.foo = 456;
        a.bar = false;
        return expect(promiseArrayChanges(a, b, function (a, b, aIndex, bIndex, callback) {
            callback(a === b);
        }, function (a, b, aIndex, bIndex, callback) {
            callback(a === b);
        }, [ 'foo' ]), 'when fulfilled', 'to equal', [
            { type: 'equal', actualIndex: 0, expectedIndex: 0, value: 1, expected: 1 },
            { type: 'remove', actualIndex: 'foo', value: 456, last: true }
        ]);
    });

    it('should report the expectedIndex of equal elements when arrays are identical', function () {
        var a = [ 1, 2  ];
        var b = [ 1, 2 ];
        return expect(promiseArrayChanges(a, b, function (a, b, aIndex, bIndex, callback) {
                callback(a === b);
            }, function (a, b, aIndex, bIndex, callback) {
                callback(a === b);
            }), 'when fulfilled', 'to satisfy', [
                { type: 'equal', actualIndex: 0, expectedIndex: 0, value: 1, expected: 1 },
                { type: 'equal', actualIndex: 1, expectedIndex: 1, value: 2, expected: 2 }
            ]
        );
    });
    
    it('should report the expectedIndex of equal elements when items are offset', function () {
        var a = [ 1, 2  ];
        var b = [ 0, 1, 2 ];
        return expect(promiseArrayChanges(a, b, function (a, b, aIndex, bIndex, callback) {
            callback(a === b);
        }, function (a, b, aIndex, bIndex, callback) {
            callback(a === b);
        }), 'when fulfilled', 'to satisfy', [
                { type: 'insert', value: 0 },
                { type: 'equal', actualIndex: 0, expectedIndex: 1, value: 1, expected: 1 },
                { type: 'equal', actualIndex: 1, expectedIndex: 2, value: 2, expected: 2 }
        ]
        );
    });

    if (typeof Symbol !== 'undefined') {
        it('should diff arrays that have Symbol property names', function () {
            var aSymbol = Symbol('a');
            var bSymbol = Symbol('b');
            var a = [1, 2];
            a[aSymbol] = 123;

            var b = [1, 2];
            b[bSymbol] = 456;
            return expect(promiseArrayChanges(a, b, function (a, b, aIndex, bIndex, callback) {
                callback(a === b);
            }, function (a, b, aIndex, bIndex, callback) {
                callback(a === b);
            }, true), 'when fulfilled', 'to equal', [
                { type: 'equal', value: 1, expected: 1, actualIndex: 0, expectedIndex: 0 },
                { type: 'equal', value: 2, expected: 2, actualIndex: 1, expectedIndex: 1 },
                { type: 'remove', value: 123, actualIndex: aSymbol },
                { type: 'insert', value: 456, expectedIndex: bSymbol, last: true }
            ]);
        });
    }

    it('produces a valid plan', function () {
        var g = generators(42);

        var arrays = g.array(g.natural({ max: 10 }), g.natural({ max: 10 }));
        return expect(function (actual, expected) {
            return expect(
                actual,
                'when diffed with',
                expected,
                'when executing the diff',
                'to equal',
                expected
            );
        }, 'to be valid for all', arrays, arrays);
    });
});


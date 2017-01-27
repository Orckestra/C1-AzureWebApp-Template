
module.exports = arrayDiff;

var MAX_STACK_DEPTH = 1000;

// Based on some rough benchmarking, this algorithm is about O(2n) worst case,
// and it can compute diffs on random arrays of length 1024 in about 34ms,
// though just a few changes on an array of length 1024 takes about 0.5ms

arrayDiff.InsertDiff = InsertDiff;
arrayDiff.RemoveDiff = RemoveDiff;
arrayDiff.MoveDiff = MoveDiff;

function InsertDiff(index, values) {
    this.index = index;
    this.values = values;
}
InsertDiff.prototype.type = 'insert';
InsertDiff.prototype.toJSON = function() {
    return {
        type: this.type
        , index: this.index
        , values: this.values
    };
};

function RemoveDiff(index, howMany) {
    this.index = index;
    this.howMany = howMany;
}
RemoveDiff.prototype.type = 'remove';
RemoveDiff.prototype.toJSON = function() {
    return {
        type: this.type
        , index: this.index
        , howMany: this.howMany
    };
};

function MoveDiff(from, to, howMany) {
    this.from = from;
    this.to = to;
    this.howMany = howMany;
}
MoveDiff.prototype.type = 'move';
MoveDiff.prototype.toJSON = function() {
    return {
        type: this.type
        , from: this.from
        , to: this.to
        , howMany: this.howMany
    };
};

function strictEqual(a, b, indexA, indexB, callback) {
    return callback(a === b);
}


function arrayDiff(before, after, equalFn, callback) {
    if (!equalFn) equalFn = strictEqual;

    // Find all items in both the before and after array, and represent them
    // as moves. Many of these "moves" may end up being discarded in the last
    // pass if they are from an index to the same index, but we don't know this
    // up front, since we haven't yet offset the indices.
    //
    // Also keep a map of all the indices accounted for in the before and after
    // arrays. These maps are used next to create insert and remove diffs.
    var beforeLength = before.length;
    var afterLength = after.length;
    var moves = [];
    var beforeMarked = {};
    var afterMarked = {};

    function findMatching(beforeIndex, afterIndex, howMany, callback) {

        beforeMarked[beforeIndex++] = afterMarked[afterIndex++] = true;
        howMany++;

        if (beforeIndex < beforeLength &&
            afterIndex < afterLength &&
            !afterMarked[afterIndex]) {

            equalFn(before[beforeIndex], after[afterIndex], beforeIndex, afterIndex, function (areEqual) {
                if (areEqual) {
                    setTimeout(function () {
                        findMatching(beforeIndex, afterIndex, howMany, callback);
                    }, 0);
                } else {
                    callback(beforeIndex, afterIndex, howMany);
                }
            });
        } else {
            callback(beforeIndex, afterIndex, howMany);
        }


    }

    function compare(beforeIndex, afterIndex, stackDepthRemaining, callback) {
        if (afterIndex >= afterLength) {
            beforeIndex++;
            afterIndex = 0;
        }
        if (beforeIndex >= beforeLength) {
            callback();
            return;
        }

        if (!afterMarked[afterIndex]) {
            equalFn(before[beforeIndex], after[afterIndex], beforeIndex, afterIndex, function (areEqual) {
                if (areEqual) {

                    var from = beforeIndex;
                    var to = afterIndex;
                    findMatching(beforeIndex, afterIndex, 0, function (newBeforeIndex, newAfterIndex, howMany) {

                        moves.push(new MoveDiff(from, to, howMany));
                        if (stackDepthRemaining) {
                            compare(newBeforeIndex, 0, stackDepthRemaining - 1, callback);
                        } else {
                            setTimeout(function () {
                                compare(newBeforeIndex, 0, MAX_STACK_DEPTH, callback);
                            }, 0);
                        }
                    });
                } else {
                    if (stackDepthRemaining) {
                        compare(beforeIndex, afterIndex + 1, stackDepthRemaining - 1, callback);
                    } else {
                        setTimeout(function () {
                            compare(beforeIndex, afterIndex + 1, MAX_STACK_DEPTH, callback);
                        }, 0);
                    }
                }
            });
        } else {
            if (stackDepthRemaining) {
                compare(beforeIndex, afterIndex + 1, stackDepthRemaining - 1, callback);
            } else {
                setTimeout(function () {
                    compare(beforeIndex, afterIndex + 1, MAX_STACK_DEPTH, callback);
                }, 0);
            }
        }
    }

    compare(0, 0, MAX_STACK_DEPTH, function () {

        // Create a remove for all of the items in the before array that were
        // not marked as being matched in the after array as well
        var removes = [];
        for (var beforeIndex = 0; beforeIndex < beforeLength;) {
            if (beforeMarked[beforeIndex]) {
                beforeIndex++;
                continue;
            }
            var index = beforeIndex;
            var howMany = 0;
            while (beforeIndex < beforeLength && !beforeMarked[beforeIndex++]) {
                howMany++;
            }
            removes.push(new RemoveDiff(index, howMany));
        }

        // Create an insert for all of the items in the after array that were
        // not marked as being matched in the before array as well
        var inserts = [];
        for (var afterIndex = 0; afterIndex < afterLength;) {
            if (afterMarked[afterIndex]) {
                afterIndex++;
                continue;
            }
            var index = afterIndex;
            var howMany = 0;
            while (afterIndex < afterLength && !afterMarked[afterIndex++]) {
                howMany++;
            }
            var values = after.slice(index, index + howMany);
            inserts.push(new InsertDiff(index, values));
        }

        var insertsLength = inserts.length;
        var removesLength = removes.length;
        var movesLength = moves.length;
        var i, j;

        // Offset subsequent removes and moves by removes
        var count = 0;
        for (i = 0; i < removesLength; i++) {
            var remove = removes[i];
            remove.index -= count;
            count += remove.howMany;
            for (j = 0; j < movesLength; j++) {
                var move = moves[j];
                if (move.from >= remove.index) move.from -= remove.howMany;
            }
        }

        // Offset moves by inserts
        for (i = insertsLength; i--;) {
            var insert = inserts[i];
            var howMany = insert.values.length;
            for (j = movesLength; j--;) {
                var move = moves[j];
                if (move.to >= insert.index) move.to -= howMany;
            }
        }

        // Offset the to of moves by later moves
        for (i = movesLength; i-- > 1;) {
            var move = moves[i];
            if (move.to === move.from) continue;
            for (j = i; j--;) {
                var earlier = moves[j];
                if (earlier.to >= move.to) earlier.to -= move.howMany;
                if (earlier.to >= move.from) earlier.to += move.howMany;
            }
        }

        // Only output moves that end up having an effect after offsetting
        var outputMoves = [];

        // Offset the from of moves by earlier moves
        for (i = 0; i < movesLength; i++) {
            var move = moves[i];
            if (move.to === move.from) continue;
            outputMoves.push(move);
            for (j = i + 1; j < movesLength; j++) {
                var later = moves[j];
                if (later.from >= move.from) later.from -= move.howMany;
                if (later.from >= move.to) later.from += move.howMany;
            }
        }

        callback(removes.concat(outputMoves, inserts));
    });
}


// Run this directly in node 4 to see the performance numbers
// Alter arrayLength parameter to see the effect of different length of array.
// maxIterations is the number of samples to take

var maxIterations = 100;
var arrayLength = 500;

var now = require('performance-now');
var arrayDiffAsync = require('../index');
var arrayDiff = require('../original-version');

const randomWhole = function(max) {
    return Math.floor(Math.random() * (max + 1));
};

const randomArray = function(maxLength, maxValues) {
    var i;
    if (maxLength == null) {
        maxLength = 20;
    }
    if (maxValues == null) {
        maxValues = maxLength;
    }
    i = randomWhole(maxLength);
    return ((function() {
        var _results;
        _results = [];
        while (i--) {
            _results.push(randomWhole(maxValues));
        }
        return _results;
    })());
};


var results = [];

function runTest(iteration, callback) {
    var before = randomArray(arrayLength);
    var after = before.slice().sort(function () {
        return Math.random() - 0.5;
    });

    var start = now();

    arrayDiffAsync(before, after, null, function () {
        var end = now();
        results.push(end - start);

        if (iteration < maxIterations) {
            setTimeout(() => runTest(iteration + 1, callback))
        } else {
            callback();
        }
    });
}

// We call this with a callback to keep the test interface the same
// It obviously doesn't need to be async
function runSyncTest(iteration, callback) {
    var before = randomArray(arrayLength);
    var after = before.slice().sort(function () {
        return Math.random() - 0.5;
    });

    var start = now();

    arrayDiff(before, after);

    var end = now();
    results.push(end - start);

    if (iteration < maxIterations) {
        setTimeout(() => runSyncTest(iteration + 1, callback))
    } else {
       callback();
    }
}

function getResults(name) {


    var min, max;
    var sum = results.reduce((agg, result) => {

        if (!min || result < min) { min = result; }
        if (!max || result > max) { max = result; }
        return agg + result;
    }, 0);

    return (sum / results.length).toFixed(3) + ', min ' + min.toFixed(3) + ' max ' + max.toFixed(3);
}

results = [];
runTest(0, function () {
    console.log('Results for async: ' + getResults());

    results = [];

    runSyncTest(0,function () {
        console.log('Results for sync: ' + getResults());
    });

});




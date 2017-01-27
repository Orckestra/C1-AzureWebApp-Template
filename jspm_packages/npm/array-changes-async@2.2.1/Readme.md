# array-changes-async

This is an async port of [array-changes](https://github.com/unexpectedjs/array-changes), to allow for an `equal`
and `similar` functions that accept a callback.  This allows your `equal` and `similar` functions to be asynchronous.

## Original readme from `array-changes`

A library for finding differences between two arrays.

The library was extracted from unexpected and is therefore not
documented and tested properly :-S

(Edit: This async version of the library actually has some more tests, not many, but some :)

## Usage

```js

var arrayChangesAsync = require('array-changes-async');

var leftArray = [ 1, 2, 4 ]
var rightArray = [ 1, 2, 3, 4 ]

function equal(a, b, aIndex, bIndex, callback) {
   // a is the value from the leftArray, aIndex is the index of that item
   // b is the value from the rightArray, bIndex is the index of the item
   // Call the callback function with `true` if a and b are considered equal
   callback(a === b);
}


arrayChangesAsync(leftArray, rightArray, equal, null /* see below */, function (result) {
    
    // result == [ 
    //   { 
    //      type: 'equal', value: 1
    //   },
    //   { 
    //      type: 'equal', value: 2
    //   },
    //   { 
    //      type: 'insert', value: 3
    //   },
    //   { 
    //      type: 'equal', value: 4
    //   }
    // ]
});

```

The fourth parameter allows to define 'similar' items, which has the same signature as the `equal` function, and 
allows to define what is considered similar, ie. 'changed', rather than deleted, and the expected value inserted.

The callbacks receive the `aIndex` and `bIndex` parameters, to allow for memoization, as some items will be tested 
for equality more than once.  This is obviously more useful if you have an async `equal` function that could be
expensive.


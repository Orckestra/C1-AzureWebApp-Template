# arraydiff-async

An adaptation of [arraydiff](http://npmjs.org/package/arraydiff), to allow for an asynchronous 
equality comparison. The algorithm is identical, just written in an async format.

It is important to note that this version is considerably slower than the synchronous version,
and for large arrays (> ~ 500), this library can take a long time - ~50ms for a 500 length array,
maximum around 200ms, versus average of around 1.5ms maximum 20ms for the synchronous version.
A `performance.js` is included, which you can run with your expected array length under node if you'd
like to see some figures.


# arraydiff

Diff two arrays, finding inserts, removes, and moves.

[![build status](https://secure.travis-ci.org/codeparty/arraydiff.png)](http://travis-ci.org/codeparty/arraydiff)

## Installation

```
npm install arraydiff-async
```

## Usage

```js
var arrayDiff = require('../index');

var before = [0, 1, 2, 3];
var after = ['1', '2', 4, 5, 0];

// Compares with `===` by default
// There is no point using this library if you are not passing an equality function
// Use `arraydiff` instead, it's synchronous, and much faster
var diff = arrayDiff(before, after, null, function (diff) {

    console.log('\nStandard diff:');
    for (var i = 0; i < diff.length; i++) {
        var item = diff[i];
        console.log(item.type, item);
    }
});

// Using a custom equality method with a callback. Callback with true or false
var diff = arrayDiff(before, after, function(a, b, callback) {
    return callback(a == b);
}, function (diff) {

    console.log('\nFuzzy equality diff:');
    for (var i = 0; i < diff.length; i++) {
        var item = diff[i];
        console.log(item.type, item);
    }
});
```

Output:

```
Standard diff:
remove { index: 1, howMany: 3 }
insert { index: 0, values: [ '1', '2', 4, 5 ] }

Fuzzy equality diff:
remove { index: 3, howMany: 1 }
move { from: 1, to: 0, howMany: 2 }
insert { index: 2, values: [ 4, 5 ] }
```

# Contributions
I'd welcome any contributions to this library - it was written out of necessity for 
[`unexpected-htmllke`](https://github.com/bruderstein/unexpected-htmllike). I'd like to investigate the performance 
a bit more, to see if it can be optimised further.


## MIT License
Copyright (c) 2013 by Nate Smith
Asynchronous adaptation (c) 2015 Dave Brotherstone

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
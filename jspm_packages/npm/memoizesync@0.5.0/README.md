node-memoizesync
================

Yet another memoizer for synchronous functions.

```javascript
var memoizeSync = require('memoizesync');

function myExpensiveComputation(arg1, arg2) {
    // ...
    return result;
}

var memoized = memoizeSync(myExpensiveComputation);
```

Now `memoized` works exactly like `myExpensiveComputation`, except that
the actual computation is only performed once for each unique set of
arguments:

```javascript
var result = memoized(42, 100);
// Got the result!

var result2 = memoized(42, 100);
// Got the same result, and much faster this time!
```

The function returned by `memoizeSync` invokes the wrapped function
in the context it's called in itself, so `memoizeSync` even works for
memoizing a method that has access to instance variables:

```javascript
function Foo(name) {
    this.name = name;

    this.myMethod = memoizeSync(function (arg1, arg2) {
        console.log("Cool, this.name works here!", this.name);
        // ...
        return "That was tough, but I'm done now!";
    });
}
```

(Unfortunately setting `Foo.prototype.myMethod = memoizeSync(...)`
wouldn't work as the memoizer would be shared among all instances of
`Foo`).

To distinguish different invocations (whose results need to be cached
separately) `memoizeSync` relies on a naive stringification of the
arguments, which is looked up in an internally kept hash. If the
function you're memoizing takes non-primitive arguments you might want
to provide a custom `argumentsStringifier` as the second argument to
`memoizeSync`. Otherwise all object arguments will be considered equal
because they stringify to `[object Object]`:

```javascript
var memoized = memoizeSync(function functionToMemoize(obj) {
    // ...
    return Object.keys(obj).join('');
}, {
    argumentsStringifier: function (args) {
        return args.map(function (arg) {return JSON.stringify(arg);}).join(",");
    }
);

memoized({foo: 'bar'}); // 'foo'

memoized({quux: 'baz'}); // 'quux'
```

Had the custom `argumentsStringifier` not been provided, the memoized
function would would have returned `foo` both times.

Check out <a
href="https://github.com/papandreou/node-memoizesync/blob/master/test/memoizeSync.js">the
custom argumentsStringifier test</a> for another example.


### Purging and expiring memoized values ###

You can forcefully clear a specific memoized value using the `purge`
method on the memoizer:

```javascript
var memoized = memoizeSync(function functionToMemoize(foo) {
    // ...
    return theResult;
});
var foo = memoized(123);
memoized.purge(123);
foo = memoized(123); // Will be recomputed
```

`memoizer.purgeAll()` clears all memoized results.

You can also specify a custom ttl (in milliseconds) on the memoized
results:

```javascript
var memoized = memoizeSync(function functionToMemoize() {
    // ...
    return theResult;
}, {maxAge: 1000});
```

In the above example the memoized value will be considered stale one
second after it has been computed, and it will be recomputed next time
`memoizeSync` is invoked with the same arguments.

`memoizeSync` uses <a
href="https://github.com/isaacs/node-lru-cache">node-lru-cache</a> to
store the memoized values, and it accepts the same parameters in the
`options` object.

If you want to use the `length` option for lru-cache, note that the
memoized values are arrays: `[exception, returnValue]`.

```javascript
var memoizedFsReadFileSync = memoizeAsync(require('fs').readFileSync, {
    max: 1000000,
    length: function (exceptionAndReturnValue) {
        if (exceptionAndReturnValue[0]) {
            return 1;
        } else {
            var body = exceptionAndReturnValue[1];
            return Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
        }
    },
    maxAge: 1000
});
```

The LRU instance is exposed in the `cache` property of the memoized
function in case you need to access it.

Error handling
--------------

If a memoized function throws an error, memoizeSync will catch and rethrow it,
so memoizeSync is transparent in that regard. By default, exceptions won't be
saved in the cache, so the original function will be run again on the next
invocation of the memoized function. If you want exceptions to be memoized as
well, set the `exceptions` option to `true`.

Installation
------------

Make sure you have node.js and npm installed, then run:

    npm install memoizesync

Browser compatibility
---------------------

`memoizeSync` uses the UMD wrapper, so it should also work in
browsers. You should also have the <a
href="https://github.com/isaacs/node-lru-cache">node-lru-cache</a>
included:

```html
<script src="lru-cache.js"></script>
<script src="memoizeSync.js"></script>
<script>
    var memoizedFunction = memoizeSync(function () {
        // ...
    });
</script>
```

`lru-cache` uses `Object.defineProperty` and doesn't include an UMD
wrapper, but if you define a `shims` config it should be possible to
get it memoizeSync working with require.js, at least in newer browsers.

License
-------

3-clause BSD license -- see the `LICENSE` file for details.

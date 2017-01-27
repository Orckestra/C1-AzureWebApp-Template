# unexpected-zurvan

This plugin provides some [unexpected](http://unexpected.js.org/) assertions which handle using [zurvan](https://github.com/Lewerow/zurvan) to fake timers. The big advantage of zurvan is that it is promise compliant and works well with promise libraries such as bluebird.

## Assertions

### "then wait for &lt;number>"

Sequentially waits for the specified amount of milliseconds, allowing you to perform time sensitive assertions.

### "while waiting for &lt;number>"

Runs the wait alongside your assertions, useful for testing complex asynchronous code involving timeouts.

## License

unexpected-zurvan is &copy; 2016 Orckestra Inc., licensed under [ISC](https://opensource.org/licenses/ISC).

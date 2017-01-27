# redux-observer

[Redux][redux] [middleware][redux-middleware] for observing state change and
taking action when changes of interest occur.

[![npm Version][npm-badge]][npm]
[![Build Status][build-badge]][build-status]
[![Test Coverage][coverage-badge]][coverage-result]
[![Dependency Status][dep-badge]][dep-status]

## Installation

Install using npm:

    $ npm install redux-observer

## Usage

```js
import { createStore, applyMiddleware } from 'redux';
import observer from 'redux-observer';
import rootReducer from './reducers/index';

const updateHandler = (nextState, prevState) => {
  // do something
}

// Create a store with observer middleware:
const createStoreWithMiddleware = applyMiddleware(
  observer(updateHandler)
)(createStore);
```

__redux-observer__ takes a callback function and runs that function with the
new and previous states any time the last dispatched action changes state in
an interesting way. By default, the comparison function applied just checks
that the two states are not strictly equal, but the comparison can be
overridden by specifying `options.compareWith`.

## Available Options

The following options may be specified when creating a CSRF prefilter:

#### `compareWith(nextState, prevState)`

Comparison function to be used when deciding whether to call the update
callback. By default, a strict `===` comparison is done.

Note: the result of this callback is effectively negated, i.e., if this
callback returns `true`, the update handler will not be called, and vice
versa.

Example:

```js
const createStoreWithMiddleware = applyMiddleware(
  observer(updateHandler, { compareWith: _.isEqual })
)(createStore);
```

## Motivation

This middleware was derived out of an experiment with using Redux in a
[Backbone][backbone] app, where more granular state changes needed to be
tracked in order to keep DOM updates performant, leaving the default Redux
store `subscribe` method mostly useless.

## Changelog

#### 1.0.0
- Initial release

## License

MIT

[build-badge]: https://img.shields.io/travis/jimf/redux-observer/master.svg?style=flat-square
[build-status]: https://travis-ci.org/jimf/redux-observer
[npm-badge]: https://img.shields.io/npm/v/redux-observer.svg?style=flat-square
[npm]: https://www.npmjs.org/package/redux-observer
[coverage-badge]: https://img.shields.io/coveralls/jimf/redux-observer.svg?style=flat-square
[coverage-result]: https://coveralls.io/r/jimf/redux-observer
[dep-badge]: https://img.shields.io/david/jimf/redux-observer.svg?style=flat-square
[dep-status]: https://david-dm.org/jimf/redux-observer
[redux]: http://redux.js.org/
[redux-middleware]: http://rackt.org/redux/docs/advanced/Middleware.html
[backbone]: http://backbonejs.org/

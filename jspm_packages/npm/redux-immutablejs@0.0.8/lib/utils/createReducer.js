'use strict';

exports.__esModule = true;
exports['default'] = createReducer;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

/**
 * Create a handler (action) map reducer for the given list of handlers
 *
 * @param  {object} initialState     The initial state of the reducer, expecting an Immutable.Iterable instance,
 * otherwise given initialState is converted to immutable.
 * @param  {object} handlers         A map of actions where key is action name and value is a reducer function
 * @param  {boolean} enforceImmutable = true if to enforce immutable, in other words a TypeError is thrown in case
 * a handler returned anything that is not an Immutable.Iterable type.
 * @param  {function} constructor    A function to process non-immutable state, defaults to Immutable.fromJS.
 * @return {object}                  The calculated next state
 */

function createReducer(initialState, handlers) {
  var enforceImmutable = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
  var constructor = arguments.length <= 3 || arguments[3] === undefined ? _immutable2['default'].fromJS.bind(_immutable2['default']) : arguments[3];

  return function (state, action) {
    if (state === undefined) state = initialState;

    // convert the initial state to immutable
    // This is useful in isomorphic apps where states were serialized
    if (!_immutable2['default'].Iterable.isIterable(state)) {
      state = constructor(state);
    }

    var handler = action && action.type ? handlers[action.type] : undefined;

    if (!handler) {
      return state;
    }

    state = handler(state, action);

    if (enforceImmutable && !_immutable2['default'].Iterable.isIterable(state)) {
      throw new TypeError('Reducers must return Immutable objects.');
    }

    return state;
  };
}

module.exports = exports['default'];
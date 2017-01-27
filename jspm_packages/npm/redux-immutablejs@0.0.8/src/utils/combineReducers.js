import Immutable from 'immutable';
// TODO need to find a way to reference Redux's init for compatability
const ActionTypes = { INIT: 'INIT' };
const isImmutable = (obj) => {
  return Immutable.Iterable.isIterable(obj);
};

/* eslint-disable no-console */

function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionName = actionType && `"${actionType.toString()}"` || 'an action';

  return (
    `Reducer "${key}" returned undefined handling ${actionName}. ` +
    `To ignore an action, you must explicitly return the previous state.`
  );
}

function getUnexpectedStateKeyWarningMessage(inputState, outputState, action) {
  var reducerKeys = Object.keys(outputState);
  var argumentName = action && action.type === ActionTypes.INIT ?
    'initialState argument passed to createStore' :
    'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return (
      'Store does not have a valid reducer. Make sure the argument passed ' +
      'to combineReducers is an object whose values are reducers.'
    );
  }

  if (!isImmutable(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "` +
      ({}).toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
      `". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    );
  }

  var unexpectedKeys = inputState.keySeq().filter(
    key => reducerKeys.indexOf(key) < 0
  );

  if (unexpectedKeys.size > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    );
  }
}

function assertReducerSanity(reducers) {
  reducers.keySeq().forEach(key => {
    var reducer = reducers.get(key);
    var initialState = reducer(undefined, { type: ActionTypes.INIT });

    if (typeof initialState === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
        `If the state passed to the reducer is undefined, you must ` +
        `explicitly return the initial state. The initial state may ` +
        `not be undefined.`
      );
    }

    var type = '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.');
    if (typeof reducer(undefined, { type }) === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
        `Don't try to handle ${ActionTypes.INIT} or other actions in "redux/*" ` +
        `namespace. They are considered private. Instead, you must return the ` +
        `current state for any unknown actions, unless it is undefined, ` +
        `in which case you must return the initial state, regardless of the ` +
        `action type. The initial state may not be undefined.`
      );
    }
  });
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */

export default function combineReducers(reducers) {
  let finalReducers = isImmutable(reducers) ? reducers : Immutable.fromJS(reducers);
  finalReducers = finalReducers.filter(v => typeof v === 'function');
  var sanityError;

  try {
    assertReducerSanity(finalReducers);
  } catch (e) {
    sanityError = e;
  }

  var defaultState = finalReducers.map(r => undefined);

  return function combination(state = defaultState, action) {
    if (sanityError) {
      throw sanityError;
    }

    var dirty = false;
    var finalState = finalReducers.map((reducer, key) => {
      var oldState = state.get(key);
      var newState = reducer(oldState, action);
      dirty = dirty || (oldState !== newState)
      if (typeof newState === 'undefined') {
        throw new Error(getErrorMessage(key, action));
      }
      return newState;
    });

    if (process.env.NODE_ENV !== 'production') {
      var warningMessage = getUnexpectedStateKeyWarningMessage(state, finalState, action);
      if (warningMessage) {
        console.error(warningMessage);
      }
    }

    return (dirty) ? finalState : state;
  };
}

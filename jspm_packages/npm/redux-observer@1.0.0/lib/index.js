"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = observerMiddleware;
var isStrictlyEqual = function isStrictlyEqual(obj1, obj2) {
  return obj1 === obj2;
};

/**
 * Observer middleware factory.
 *
 * @param {Function} onUpdate Callback to trigger when state is changed.
 * @param {Object} [options] Configuration options
 * @param {Function} [options.compareWith] Predicate function for comparison
 * @returns {Function}
 */

function observerMiddleware(onUpdate) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var pred = options.compareWith || isStrictlyEqual;

  return function (_ref) {
    var getState = _ref.getState;
    return function (next) {
      return function (action) {
        var prevState = getState();
        var returnValue = next(action);
        var nextState = getState();

        if (!pred(nextState, prevState)) {
          onUpdate(nextState, prevState);
        }

        return returnValue;
      };
    };
  };
}

module.exports = exports["default"];
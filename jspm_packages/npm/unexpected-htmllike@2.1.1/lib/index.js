'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _diff = require('./diff');

var _diff2 = _interopRequireDefault(_diff);

var _painter = require('./painter');

var _painter2 = _interopRequireDefault(_painter);

var _contains = require('./contains');

var _contains2 = _interopRequireDefault(_contains);

var _convertToDiff = require('./convertToDiff');

var _convertToDiff2 = _interopRequireDefault(_convertToDiff);

function inspect(adapter, value, depth, output, externalInspector) {

    var diffDescription = (0, _convertToDiff2['default'])(adapter, value);
    (0, _painter2['default'])(output, diffDescription, null, externalInspector);
    return output;
}

function getDiff(actualAdapter) {

    return function (expectedAdapter, actual, expected, expect, options) {

        return _diff2['default'].diffElements(actualAdapter, expectedAdapter, actual, expected, expect, options);
    };
}

function getContains(actualAdapter) {

    return function (expectedAdapter, actual, expected, expect, options) {

        return (0, _contains2['default'])(actualAdapter, expectedAdapter, actual, expected, expect, options);
    };
}

function render(diffResult, output, diff, inspect) {
    (0, _painter2['default'])(output, diffResult.diff, diff, inspect);
    return output;
}

function withResult(result, callback) {

    if (result && typeof result.then === 'function') {
        // Result was a promise, must have been async
        // If it's a sync promise, callback immediately with the value
        if (result.isResolved()) {
            return callback(result.value);
        }

        return result.then(function (resolved) {
            return callback(resolved);
        });
    }

    return callback(result);
}

function HtmlLikeUnexpected(adapter) {

    return {
        inspect: inspect.bind(null, adapter),
        diff: getDiff(adapter),
        contains: getContains(adapter),
        render: render,
        withResult: withResult
    };
}

HtmlLikeUnexpected.DefaultWeights = _diff2['default'].DefaultWeights;

exports['default'] = HtmlLikeUnexpected;
module.exports = exports['default'];
//# sourceMappingURL=index.js.map
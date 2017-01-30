'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var INDENT_SIZE = 2;

var defaultOptions = {
    allowForceLastLineBreak: true
};

function breakAt(pen, maxWidth) {

    var pens = [];
    var breaker = {
        add: function add(callback) {
            var thisPen = pen.clone();
            var entry = {
                pen: thisPen,
                forceLineBreakBefore: false,
                forceLineBreak: false,
                indentOnBreak: false,
                outdentOnBreak: false,
                wrapIfHadBreaks: false,
                newLineIfMultiLine: false
            };

            thisPen.forceLineBreak = function () {
                entry.forceLineBreak = true;
                return this;
            };

            thisPen.indentOnBreak = function () {
                entry.indentOnBreak = true;
                return this;
            };

            thisPen.outdentOnBreak = function () {
                entry.outdentOnBreak = true;
                return this;
            };

            thisPen.wrapIfHadBreaks = function () {
                entry.wrapIfHadBreaks = true;
                return this;
            };

            thisPen.forceLineBreakBefore = function () {
                entry.forceLineBreakBefore = true;
                return this;
            };

            thisPen.newLineIfMultiLine = function () {
                entry.newLineIfMultiLine = true;
                return this;
            };

            callback(thisPen);

            pens.push(entry);
            return this;
        },

        getOutput: function getOutput(options) {

            options = (0, _objectAssign2['default'])({}, defaultOptions, options);
            var resultPen = pen.clone();
            var width = 0;
            var hadLineBreaks = false;
            var indentCount = 0;

            if (options && options.groupContent) {
                (function () {

                    var needIndent = false;
                    var isMultiLine = false;

                    isMultiLine = pens.some(function (entry) {

                        var size = entry.pen.size();
                        width += size.width;
                        return entry.forceLineBreak || entry.forceLineBreakBefore || size.height > 1 || width > maxWidth;
                    });
                    width = 0;

                    pens.forEach(function (entry) {

                        if (entry.outdentOnBreak) {
                            resultPen.outdentLines();
                            indentCount--;
                        }

                        var size = entry.pen.size();

                        if (width + size.width > maxWidth || entry.forceLineBreakBefore) {
                            width = 0;
                            resultPen.nl();
                            needIndent = true;
                            hadLineBreaks = true; // TODO: Need linebreaker test for this line here
                        }
                        width += size.width;

                        if (needIndent) {
                            width += INDENT_SIZE;
                            resultPen.i();
                            needIndent = false;
                        }
                        resultPen.append(entry.pen);

                        if (entry.indentOnBreak) {
                            resultPen.indentLines();
                            indentCount++;
                        }

                        if (entry.wrapIfHadBreaks && hadLineBreaks || entry.forceLineBreak || isMultiLine && entry.newLineIfMultiLine) {
                            resultPen.nl();
                            needIndent = true;
                            hadLineBreaks = true;
                            width = 0;
                        }
                    });
                })();
            } else {

                var isMultiline = pens.some(function (entry) {
                    if (entry.forceLineBreak || entry.forceLineBreakBefore) {
                        hadLineBreaks = true;
                        return true;
                    }
                    var size = entry.pen.size();
                    width += size.width;
                    return width > maxWidth || size.height > 1;
                });

                if (isMultiline) {
                    var previousLineBreak = false;
                    pens.forEach(function (entry, index) {
                        if (entry.outdentOnBreak) {
                            resultPen.outdentLines();
                            indentCount--;
                        }
                        var addBreak = index < pens.length - 1 || options.allowForceLastLineBreak && entry.forceLineBreak;
                        if (addBreak) {
                            hadLineBreaks = true;
                        }

                        resultPen.i().append(entry.pen).nl(addBreak ? 1 : 0);
                        if (entry.indentOnBreak) {
                            resultPen.indentLines();
                            indentCount++;
                        }
                        previousLineBreak = addBreak;
                    });
                } else {
                    pens.forEach(function (entry) {
                        resultPen.append(entry.pen);
                    });
                }
            }

            for (; indentCount > 0; --indentCount) {
                resultPen.outdentLines();
            }

            if (hadLineBreaks && options && options.appendBreakIfHadBreaks) {
                // Don't force a line break if there have been no outputs,
                // or the last line was a forced line break
                if (pens.length && !pens[pens.length - 1].forceLineBreak) {
                    resultPen.nl().i();
                }
            }

            return {
                output: resultPen,
                breakAfter: pens.length && pens[pens.length - 1].forceLineBreak,
                breakBefore: pens.length && pens[0].forceLineBreakBefore
            };
        }

    };
    return breaker;
}

exports['default'] = {
    breakAt: breakAt
};
module.exports = exports['default'];
//# sourceMappingURL=lineBreaker.js.map
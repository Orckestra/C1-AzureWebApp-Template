"use strict";

var shortFunc, longFunc, longFunc2, shortMultiLine, longSingleLine;

// These functions are created with eval, in order to stop babel reformatting them.
// This means they are left exactly as created when .toString() is called
// This is important when testing the length of function bodies, and whether the
// bodies contain newlines

eval('shortFunc = function shortFunc(a, b) { return a + b; }');

eval("longFunc = function longFunc(a, b) {\n    console.log('This ia long func', a + b);\n    console.log('With multiple lines');\n}");

eval("longFunc2 = function longFunc2(a, b) {\n    console.log('This ia long func', a + b);\n    console.log('With multiple lines that are different');\n}");

eval("shortMultiLine = function shortMultiLine(a, b) {\n    return a + b;\n}");

eval("longSingleLine = function longSingleLine(a, b) { console.log('this is a long function that is only on one line'); console.log('All javascript functions should be written like this'); }");

module.exports = { shortFunc: shortFunc, longFunc: longFunc, longFunc2: longFunc2, shortMultiLine: shortMultiLine, longSingleLine: longSingleLine };
//# sourceMappingURL=functions.js.map
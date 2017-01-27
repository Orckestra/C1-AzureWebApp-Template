'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

var _magicpenPrism = require('magicpen-prism');

var _magicpenPrism2 = _interopRequireDefault(_magicpenPrism);

var _diff3 = require('../diff');

var _diff4 = _interopRequireDefault(_diff3);

var _mockEntities = require('./mockEntities');

module.exports = {
    name: 'mock-extensions',

    installInto: function installInto(expect) {

        function shiftResultOrPromise(resultOrPromise, expect) {
            if (resultOrPromise && typeof resultOrPromise.then === 'function') {
                return resultOrPromise.then(function (result) {
                    return expect.shift(result);
                });
            }
            return expect.shift(resultOrPromise);
        }

        function getDiff(actual, expected, options) {
            return _diff4['default'].diffElements(_mockEntities.TestActualAdapter, _mockEntities.TestExpectedAdapter, actual, expected, expect, options);
        }

        expect.use(_magicpenPrism2['default']);

        expect.addType({
            name: 'TestHtmlLikeActual',
            identify: function identify(value) {
                return value && value.name && value.attribs && value.$actual === _mockEntities.actualSymbol;
            },
            inspect: function inspect(value, depth, output, _inspect) {

                var htmlLikeUnexpected = new _index2['default'](_mockEntities.TestActualAdapter);
                return htmlLikeUnexpected.inspect(value, depth, output, _inspect);
            }
        });

        expect.addType({
            name: 'TestHtmlLikeExpected',
            identify: function identify(value) {
                return value && value.name && value.attribs && value.$expected === _mockEntities.expectedSymbol;
            },
            inspect: function inspect(value, depth, output, _inspect2) {

                var htmlLikeUnexpected = new _index2['default'](_mockEntities.TestExpectedAdapter);
                return htmlLikeUnexpected.inspect(value, depth, output, _inspect2);
            }
        });

        expect.addAssertion('<expect.it> to have string representation <string>', function (expect, subject, value) {
            expect.errorMode = 'bubble';
            expect(expect.inspect(subject).toString('text'), 'to equal', value);
        });

        expect.addAssertion('<any> to inspect as <string>', function (expect, subject, value) {
            expect(expect.inspect(subject).toString(), 'to equal', value);
        });

        expect.addAssertion('<TestHtmlLikeActual|string> when diffed against <TestHtmlLikeExpected|string> <assertion>', function (expect, subject, value) {

            return shiftResultOrPromise(getDiff(subject, value, {}), expect);
        });

        expect.addAssertion('<TestHtmlLikeActual|string> when diffed with options against <object> <TestHtmlLikeExpected|string> <assertion>', function (expect, subject, options, value) {

            return shiftResultOrPromise(getDiff(subject, value, options), expect);
        });

        expect.addAssertion('<TestHtmlLikeActual> when diffed as html against <TestHtmlLikeExpected> <assertion>', function (expect, subject, value) {

            var htmlLikeUnexpected = new _index2['default'](_mockEntities.TestActualAdapter);
            //const pen = expect.output.clone();
            var promiseOrResult = htmlLikeUnexpected.diff(_mockEntities.TestExpectedAdapter, subject, value, expect);
            return shiftResultOrPromise(promiseOrResult, expect);
        });

        expect.addAssertion('<TestHtmlLikeActual> when diffed as html with options against <object> <TestHtmlLikeExpected> <assertion>', function (expect, subject, options, value) {

            var htmlLikeUnexpected = new _index2['default'](_mockEntities.TestActualAdapter);
            // const pen = expect.output.clone();

            var promiseOrResult = htmlLikeUnexpected.diff(_mockEntities.TestExpectedAdapter, subject, value, expect, options);
            return shiftResultOrPromise(promiseOrResult, expect);
        });

        expect.addType({
            name: 'HtmlDiffResult',
            base: 'object',
            identify: function identify(value) {
                return value && typeof value.weight === 'number';
            }
        });

        expect.addAssertion('<HtmlDiffResult> to have weight <number>', function (expect, subject, weight) {
            expect.withError(function () {
                return expect(subject.weight, 'to equal', weight);
            }, function () {
                expect.fail({
                    diff: function diff(output) {
                        return {
                            inline: false,
                            diff: output.error('expected').text(' weight ').gray('to be ').text(weight).gray(' but was ').text(subject.weight)
                        };
                    }
                });
            });
        });

        expect.addAssertion('<HtmlDiffResult> to output <magicpen>', function (expect, subject, pen) {
            expect.withError(function () {
                return expect(subject.output, 'to equal', pen);
            }, function () {
                return expect.fail({
                    diff: function diff(output, _diff, inspect) {
                        return {
                            inline: false,
                            diff: output.block(function () {
                                this.append(inspect(subject.output));
                            }).sp().block(function () {
                                this.append(inspect(pen));
                            })
                        };
                    }
                });
            });
        });

        expect.addAssertion('<HtmlDiffResult> to output <string>', function (expect, subject, value) {
            var htmlLikeUnexpected = new _index2['default'](_mockEntities.TestActualAdapter);
            var pen = expect.output.clone('text');
            pen.addStyle('appendInspected', function (arg) {
                this.append(expect.inspect(arg));
            }, true);
            htmlLikeUnexpected.render(subject, pen, expect.diff.bind(expect), expect.inspect.bind(expect));
            expect(pen.toString(), 'to equal', value);
        });

        expect.addAssertion('<HtmlDiffResult> to output with weight <string> <number>', function (expect, subject, value, weight) {

            var htmlLikeUnexpected = new _index2['default'](_mockEntities.TestActualAdapter);
            var pen = expect.output.clone('text');
            pen.addStyle('appendInspected', function (arg) {
                this.append(expect.inspect(arg));
            }, true);
            htmlLikeUnexpected.render(subject, pen, expect.diff.bind(expect), expect.inspect.bind(expect));
            expect.withError(function () {
                return expect(pen.toString(), 'to equal', value);
            }, function (e) {
                return expect.fail({
                    diff: function diff(output, _diff2, inspect) {
                        return {
                            inline: false,
                            diff: output.block(function () {
                                this.block(e.getDiff(output).diff).nl(2).block(inspect(subject.diff));
                            })
                        };
                    }
                });
            });
            expect(subject, 'to have weight', weight);
        });

        expect.addAssertion('<TestHtmlLikeActual> when checked to contain <TestHtmlLikeExpected> <assertion>', function (expect, subject, value) {
            var htmlLikeUnexpected = new _index2['default'](_mockEntities.TestActualAdapter);
            var resultOrPromise = htmlLikeUnexpected.contains(_mockEntities.TestExpectedAdapter, subject, value, expect, null);
            return shiftResultOrPromise(resultOrPromise, expect);
        });

        expect.addAssertion('<TestHtmlLikeActual> when checked with options to contain <object> <TestHtmlLikeExpected> <assertion>', function (expect, subject, options, value) {
            var htmlLikeUnexpected = new _index2['default'](_mockEntities.TestActualAdapter);
            var resultOrPromise = htmlLikeUnexpected.contains(_mockEntities.TestExpectedAdapter, subject, value, expect, options);
            return shiftResultOrPromise(resultOrPromise, expect);
        });

        expect.addType({
            name: 'ContainsResult',
            base: 'object',
            identify: function identify(value) {
                return value && typeof value.found === 'boolean' && value.hasOwnProperty('bestMatch');
            }
        });

        expect.addAssertion('<ContainsResult> to output <string>', function (expect, subject, value) {

            var htmlLikeUnexpected = new _index2['default'](_mockEntities.TestActualAdapter);
            var pen = expect.output.clone();
            pen.addStyle('appendInspected', function (arg) {
                this.append(expect.inspect(arg));
            }, true);
            htmlLikeUnexpected.render(subject.bestMatch, pen, expect.diff.bind(expect), expect.inspect.bind(expect));
            expect.errorMode = 'bubble';
            expect(subject.bestMatch, 'not to be null');
            expect(pen.toString(), 'to equal', value);
        });

        // Dummy assertion for testing async expect.it
        expect.addAssertion('<string> to eventually have value <string>', function (expect, subject, value) {

            return expect.promise(function (resolve, reject) {

                setTimeout(function () {
                    if (subject === value) {
                        resolve();
                    } else {
                        try {
                            expect.fail('Failed');
                        } catch (e) {
                            reject(e); // Return the UnexpectedError object
                        }
                    }
                }, 10);
            });
        });
    }
};
//# sourceMappingURL=mock-extensions.js.map
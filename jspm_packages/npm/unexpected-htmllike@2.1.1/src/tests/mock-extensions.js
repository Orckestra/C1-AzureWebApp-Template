
import HtmlLikeUnexpected from '../index';
import MagicPenPrism from 'magicpen-prism';
import Diff from '../diff';

import {
    expectedSymbol,
    actualSymbol,
    TestExpectedAdapter,
    TestActualAdapter,
    createActual,
    createExpected
} from './mockEntities';

module.exports = {
    name: 'mock-extensions',

    installInto(expect) {

        function shiftResultOrPromise(resultOrPromise, expect) {
            if (resultOrPromise && typeof resultOrPromise.then === 'function') {
                return resultOrPromise.then(result => {
                    return expect.shift(result);
                });
            }
            return expect.shift(resultOrPromise);

        }

        function getDiff(actual, expected, options) {
            return Diff.diffElements(TestActualAdapter, TestExpectedAdapter, actual, expected, expect, options);
        }

        expect.use(MagicPenPrism);

        expect.addType({
            name: 'TestHtmlLikeActual',
            identify: value => value && value.name && value.attribs && value.$actual === actualSymbol,
            inspect: (value, depth, output, inspect) => {

                const htmlLikeUnexpected = new HtmlLikeUnexpected(TestActualAdapter);
                return htmlLikeUnexpected.inspect(value, depth, output, inspect);
            }
        });

        expect.addType({
            name: 'TestHtmlLikeExpected',
            identify: value => value && value.name && value.attribs && value.$expected === expectedSymbol,
            inspect: (value, depth, output, inspect) => {

                const htmlLikeUnexpected = new HtmlLikeUnexpected(TestExpectedAdapter);
                return htmlLikeUnexpected.inspect(value, depth, output, inspect);
            }
        });

        expect.addAssertion('<expect.it> to have string representation <string>', (expect, subject, value) => {
            expect.errorMode = 'bubble';
            expect(expect.inspect(subject).toString('text'), 'to equal', value);
        });

        expect.addAssertion('<any> to inspect as <string>', (expect, subject, value) => {
            expect(expect.inspect(subject).toString(), 'to equal', value);
        });

        expect.addAssertion('<TestHtmlLikeActual|string> when diffed against <TestHtmlLikeExpected|string> <assertion>', function (expect, subject, value) {

            return shiftResultOrPromise(getDiff(subject, value, {}), expect);
        });

        expect.addAssertion('<TestHtmlLikeActual|string> when diffed with options against <object> <TestHtmlLikeExpected|string> <assertion>', function (expect, subject, options, value) {

            return shiftResultOrPromise(getDiff(subject, value, options), expect);
        });

        expect.addAssertion('<TestHtmlLikeActual> when diffed as html against <TestHtmlLikeExpected> <assertion>', (expect, subject, value) => {

            const htmlLikeUnexpected = new HtmlLikeUnexpected(TestActualAdapter);
            //const pen = expect.output.clone();
            const promiseOrResult = htmlLikeUnexpected.diff(TestExpectedAdapter, subject, value, expect);
            return shiftResultOrPromise(promiseOrResult, expect);
        });


        expect.addAssertion('<TestHtmlLikeActual> when diffed as html with options against <object> <TestHtmlLikeExpected> <assertion>', (expect, subject, options, value) => {

            const htmlLikeUnexpected = new HtmlLikeUnexpected(TestActualAdapter);
            // const pen = expect.output.clone();

            const promiseOrResult = htmlLikeUnexpected.diff(TestExpectedAdapter, subject, value, expect, options);
            return shiftResultOrPromise(promiseOrResult, expect);
        });

        expect.addType({
            name: 'HtmlDiffResult',
            base: 'object',
            identify: value => value && typeof value.weight === 'number'
        });

        expect.addAssertion('<HtmlDiffResult> to have weight <number>', (expect, subject, weight) => {
            expect.withError(() => expect(subject.weight, 'to equal', weight), () => {
                expect.fail({
                    diff: function (output) {
                        return {
                            inline: false,
                            diff: output.error('expected').text(' weight ').gray('to be ').text(weight).gray(' but was ').text(subject.weight)
                        };
                    }
                });
            });
        });

        expect.addAssertion('<HtmlDiffResult> to output <magicpen>', (expect, subject, pen) => {
            expect.withError(() => expect(subject.output, 'to equal', pen), () => {
                return expect.fail({
                    diff: function (output, diff, inspect) {
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

        expect.addAssertion('<HtmlDiffResult> to output <string>', (expect, subject, value) => {
            const htmlLikeUnexpected = new HtmlLikeUnexpected(TestActualAdapter);
            const pen = expect.output.clone('text');
            pen.addStyle('appendInspected', function (arg) {
                this.append(expect.inspect(arg));
            }, true);
            htmlLikeUnexpected.render(subject, pen, expect.diff.bind(expect), expect.inspect.bind(expect));
            expect(pen.toString(), 'to equal', value);
        });

        expect.addAssertion('<HtmlDiffResult> to output with weight <string> <number>', (expect, subject, value, weight) => {

            const htmlLikeUnexpected = new HtmlLikeUnexpected(TestActualAdapter);
            const pen = expect.output.clone('text');
            pen.addStyle('appendInspected', function (arg) {
                this.append(expect.inspect(arg));
            }, true);
            htmlLikeUnexpected.render(subject, pen, expect.diff.bind(expect), expect.inspect.bind(expect));
            expect.withError(() => expect(pen.toString(), 'to equal', value), e => {
                return expect.fail({
                    diff: function (output, diff, inspect) {
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

        expect.addAssertion('<TestHtmlLikeActual> when checked to contain <TestHtmlLikeExpected> <assertion>', (expect, subject, value) => {
            const htmlLikeUnexpected = new HtmlLikeUnexpected(TestActualAdapter);
            const resultOrPromise = htmlLikeUnexpected.contains(TestExpectedAdapter, subject, value, expect, null);
            return shiftResultOrPromise(resultOrPromise, expect);
        });

        expect.addAssertion('<TestHtmlLikeActual> when checked with options to contain <object> <TestHtmlLikeExpected> <assertion>', (expect, subject, options, value) => {
            const htmlLikeUnexpected = new HtmlLikeUnexpected(TestActualAdapter);
            const resultOrPromise = htmlLikeUnexpected.contains(TestExpectedAdapter, subject, value, expect, options);
            return shiftResultOrPromise(resultOrPromise, expect);
        });

        expect.addType({
            name: 'ContainsResult',
            base: 'object',
            identify: value => {
                return value &&
                    typeof value.found === 'boolean' &&
                    value.hasOwnProperty('bestMatch');
            }
        });

        expect.addAssertion('<ContainsResult> to output <string>', (expect, subject, value) => {

            const htmlLikeUnexpected = new HtmlLikeUnexpected(TestActualAdapter);
            const pen = expect.output.clone();
            pen.addStyle('appendInspected', function (arg) {
                this.append(expect.inspect(arg));
            }, true);
            htmlLikeUnexpected.render(subject.bestMatch, pen, expect.diff.bind(expect), expect.inspect.bind(expect));
            expect.errorMode = 'bubble';
            expect(subject.bestMatch, 'not to be null');
            expect(pen.toString(), 'to equal', value);
        });

        // Dummy assertion for testing async expect.it
        expect.addAssertion('<string> to eventually have value <string>', (expect, subject, value) => {

            return expect.promise((resolve, reject) => {

                setTimeout(() => {
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

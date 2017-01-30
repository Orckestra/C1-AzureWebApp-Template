'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var _magicpen = require('magicpen');

var _magicpen2 = _interopRequireDefault(_magicpen);

var _lineBreaker = require('../lineBreaker');

var _lineBreaker2 = _interopRequireDefault(_lineBreaker);

var expect = _unexpected2['default'].clone();
expect.output.preferredWidth = 80;

describe('magicpen-linebreaker', function () {

    var pen = undefined;
    beforeEach(function () {
        pen = new _magicpen2['default']({
            indentationWidth: 2
        });
    });

    it('outputs a single string', function () {

        var breaker = _lineBreaker2['default'].breakAt(pen, 50);
        breaker.add(function (thispen) {
            return thispen.text('hello world');
        });

        expect(breaker.getOutput().output.toString(), 'to equal', 'hello world');
    });

    it('outputs a single line when it fits', function () {

        var breaker = _lineBreaker2['default'].breakAt(pen, 50);
        breaker.add(function (thispen) {
            return thispen.text('<div>');
        }).add(function (thispen) {
            return thispen.text('content');
        }).add(function (thispen) {
            return thispen.text('</div>');
        });

        expect(breaker.getOutput().output.toString(), 'to equal', '<div>content</div>');
    });

    it("outputs on multiple lines when it doesn't fit", function () {

        var breaker = _lineBreaker2['default'].breakAt(pen, 20);
        breaker.add(function (thispen) {
            return thispen.text('<div>').indentOnBreak();
        }).add(function (thispen) {
            return thispen.text('content that is longer than the maximum');
        }).add(function (thispen) {
            return thispen.outdentOnBreak().text('</div>');
        });

        expect(breaker.getOutput().output.toString(), 'to equal', '<div>\n' + '  content that is longer than the maximum\n' + '</div>');
    });

    it('apends multiple children', function () {

        var breaker = _lineBreaker2['default'].breakAt(pen, 20);
        breaker.add(function (thispen) {
            return thispen.text('<div>').indentOnBreak();
        }).add(function (thispen) {
            return thispen.text('content that is longer than the maximum');
        }).add(function (thispen) {
            return thispen.text('XX');
        }).add(function (thispen) {
            return thispen.outdentOnBreak().text('</div>');
        });

        expect(breaker.getOutput().output.toString(), 'to equal', '<div>\n' + '  content that is longer than the maximum\n' + '  XX\n' + '</div>');
    });

    it('apends multiple children on a single line', function () {

        var breaker = _lineBreaker2['default'].breakAt(pen, 80);
        breaker.add(function (thispen) {
            return thispen.text('<div>').indentOnBreak();
        }).add(function (thispen) {
            return thispen.text('content that is shorter than the maximum');
        }).add(function (thispen) {
            return thispen.text('XX');
        }).add(function (thispen) {
            return thispen.outdentOnBreak().text('</div>');
        });

        expect(breaker.getOutput().output.toString(), 'to equal', '<div>content that is shorter than the maximumXX</div>');
    });

    it('forces multilines on forceLineBreak', function () {

        var breaker = _lineBreaker2['default'].breakAt(pen, 80);
        breaker.add(function (thispen) {
            return thispen.text('<div>').indentOnBreak();
        }).add(function (thispen) {
            return thispen.text('content');
        }).add(function (thispen) {
            return thispen.text('content2').forceLineBreak();
        }).add(function (thispen) {
            return thispen.text('content3');
        }).add(function (thispen) {
            return thispen.outdentOnBreak().text('</div>');
        });

        expect(breaker.getOutput().output.toString(), 'to equal', '<div>\n' + '  content\n' + '  content2\n' + '  content3\n' + '</div>');
    });

    it('appends a line break when forceLineBreak used on last line', function () {
        var breaker = _lineBreaker2['default'].breakAt(pen, 80);
        breaker.add(function (thispen) {
            return thispen.text('<div').indentOnBreak();
        }).add(function (thispen) {
            return thispen.text(' data-test="cheese"');
        }).add(function (thispen) {
            return thispen.text(' data-attr1="x" // should be attr1="1"').forceLineBreak();
        });

        var output = breaker.getOutput().output;
        pen.append(output);
        pen.append('/>');
        expect(pen.toString(), 'to equal', '<div\n' + '   data-test="cheese"\n' + '   data-attr1="x" // should be attr1="1"\n' + '/>');
    });

    it("doesn't append a line break when forceLineBreak used on last line with allowForceLastLineBreak = false", function () {
        var breaker = _lineBreaker2['default'].breakAt(pen, 80);
        breaker.add(function (thispen) {
            return thispen.text('<div').indentOnBreak();
        }).add(function (thispen) {
            return thispen.text(' data-test="cheese"');
        }).add(function (thispen) {
            return thispen.text(' data-attr1="x" // should be data-attr1="1"').forceLineBreak();
        });

        var output = breaker.getOutput({ allowForceLastLineBreak: false }).output;
        pen.append(output);
        pen.append('/>');
        expect(pen.toString(), 'to equal', '<div\n' + '   data-test="cheese"\n' + '   data-attr1="x" // should be data-attr1="1"/>');
    });

    it('appends a line break when using appendBreakIfHadBreaks', function () {

        var breaker = _lineBreaker2['default'].breakAt(pen, 80);
        breaker.add(function (thispen) {
            return thispen.text('<div').indentOnBreak();
        }).add(function (thispen) {
            return thispen.text(' data-attr1="x" // should be data-attr1="1"').forceLineBreak();
        }).add(function (thispen) {
            return thispen.text(' data-test="cheese"');
        });

        var output = breaker.getOutput({ appendBreakIfHadBreaks: true }).output;
        pen.append(output);
        pen.append('/>');
        expect(pen.toString(), 'to equal', '<div\n' + '   data-attr1="x" // should be data-attr1="1"\n' + '   data-test="cheese"\n' + '/>');
    });

    it("doesn't append a line break when using appendBreakIfHadBreaks when last line is forceLineBreak", function () {

        var breaker = _lineBreaker2['default'].breakAt(pen, 80);
        breaker.add(function (thispen) {
            return thispen.text('<div').indentOnBreak();
        }).add(function (thispen) {
            return thispen.text(' data-test="cheese"');
        }).add(function (thispen) {
            return thispen.text(' data-attr1="x" // should be data-attr1="1"').forceLineBreak();
        });

        var output = breaker.getOutput({ appendBreakIfHadBreaks: true }).output;
        pen.append(output);
        pen.append('/>');
        expect(pen.toString(), 'to equal', '<div\n' + '   data-test="cheese"\n' + '   data-attr1="x" // should be data-attr1="1"\n' + '/>');
    });

    it('returns that break is needed after when forceLineBreak on last line', function () {

        var breaker = _lineBreaker2['default'].breakAt(pen, 80);
        breaker.add(function (thispen) {
            return thispen.text('<div').indentOnBreak();
        }).add(function (thispen) {
            return thispen.text(' data-test="cheese"');
        }).add(function (thispen) {
            return thispen.text(' data-attr1="x" // should be data-attr1="1"').forceLineBreak();
        });

        var output = breaker.getOutput({ appendBreakIfHadBreaks: true });
        expect(output, 'to satisfy', {
            breakAfter: true,
            breakBefore: false
        });
    });

    it('returns that a break is needed where forceLineBreakBefore on first line', function () {

        var breaker = _lineBreaker2['default'].breakAt(pen, 80);
        breaker.add(function (thispen) {
            return thispen.forceLineBreakBefore().text('// missing <span />');
        }).add(function (thispen) {
            return thispen.text('<span />');
        });

        var output = breaker.getOutput({ appendBreakIfHadBreaks: true });
        expect(output, 'to satisfy', {
            breakAfter: false,
            breakBefore: true
        });
    });

    describe('when using groupContent', function () {

        it('groups content onto single line between forces breaks', function () {

            var breaker = _lineBreaker2['default'].breakAt(pen, 100);
            breaker.add(function (thispen) {
                return thispen.text('<div').indentOnBreak();
            }).add(function (thispen) {
                return thispen.text(' data-attr1="1"');
            }).add(function (thispen) {
                return thispen.text(' data-attr2="2"');
            }).add(function (thispen) {
                return thispen.text(' data-attr3="3"');
            }).add(function (thispen) {
                return thispen.text(' data-attr4="x" // should be data-attr4="4"').forceLineBreak();
            }).add(function (thispen) {
                return thispen.text(' data-attr5="5"');
            }).add(function (thispen) {
                return thispen.text(' data-attr6="6"');
            }).add(function (thispen) {
                return thispen.text(' data-attr7="x" // should be data-attr7="7"').forceLineBreak();
            }).add(function (thispen) {
                return thispen.text(' data-attr8="8"');
            }).add(function (thispen) {
                return thispen.outdentOnBreak().wrapIfHadBreaks();
            }).add(function (thispen) {
                return thispen.text('>').wrapIfHadBreaks().indentOnBreak();
            }).add(function (thispen) {
                return thispen.text('pre content');
            }).add(function (thispen) {
                return thispen.text('content').wrapIfHadBreaks();
            }).add(function (thispen) {
                return thispen.outdentOnBreak().text('</div>');
            });

            expect(breaker.getOutput({ groupContent: true }).output.toString(), 'to equal', '<div data-attr1="1" data-attr2="2" data-attr3="3" data-attr4="x" // should be data-attr4="4"\n' + '   data-attr5="5" data-attr6="6" data-attr7="x" // should be data-attr7="7"\n' + '   data-attr8="8"\n' + '>\n' + '  pre contentcontent\n' + '</div>');
        });

        it('breaks lines at maxwidth', function () {

            var breaker = _lineBreaker2['default'].breakAt(pen, 35);
            breaker.add(function (thispen) {
                return thispen.text('<div').indentOnBreak();
            }).add(function (thispen) {
                return thispen.text(' data-attr1="1"');
            }).add(function (thispen) {
                return thispen.text(' data-attr2="2"');
            }).add(function (thispen) {
                return thispen.text(' data-attr3="3"');
            }).add(function (thispen) {
                return thispen.text(' data-attr4="x" // should be data-attr4="4"').forceLineBreak();
            }).add(function (thispen) {
                return thispen.text(' data-attr5="5"');
            }).add(function (thispen) {
                return thispen.text(' data-attr6="6"');
            }).add(function (thispen) {
                return thispen.text(' data-attr7="x" // should be data-attr7="7"').forceLineBreak();
            }).add(function (thispen) {
                return thispen.text(' data-attr8="8"');
            }).add(function (thispen) {
                return thispen.outdentOnBreak().wrapIfHadBreaks();
            }).add(function (thispen) {
                return thispen.text('>').wrapIfHadBreaks().indentOnBreak();
            }).add(function (thispen) {
                return thispen.text('pre content');
            }).add(function (thispen) {
                return thispen.text('content').wrapIfHadBreaks();
            }).add(function (thispen) {
                return thispen.outdentOnBreak().text('</div>');
            });

            expect(breaker.getOutput({ groupContent: true }).output.toString(), 'to equal', '<div data-attr1="1" data-attr2="2"\n' + '   data-attr3="3"\n' + '   data-attr4="x" // should be data-attr4="4"\n' + '   data-attr5="5" data-attr6="6"\n' + '   data-attr7="x" // should be data-attr7="7"\n' + '   data-attr8="8"\n' + '>\n' + '  pre contentcontent\n' + '</div>');
        });

        it('forces a line break before the content when using forceLineBreakBefore()', function () {

            var breaker = _lineBreaker2['default'].breakAt(pen, 80);
            breaker.add(function (thispen) {
                return thispen.text('<div>').indentOnBreak().newLineIfMultiLine();
            }).add(function (thispen) {
                return thispen.text('<span>one</span>');
            }).add(function (thispen) {
                return thispen.text('<span>two</span>');
            }).add(function (thispen) {
                return thispen.text('<span>three</span> // should be xxx').forceLineBreakBefore().forceLineBreak();
            }).add(function (thispen) {
                return thispen.outdentOnBreak().text('</div>');
            });

            expect(breaker.getOutput({ groupContent: true }).output.toString(), 'to equal', '<div>\n' + '  <span>one</span><span>two</span>\n' + '  <span>three</span> // should be xxx\n' + '</div>');
        });
    });
});
//# sourceMappingURL=lineBreaker.spec.js.map
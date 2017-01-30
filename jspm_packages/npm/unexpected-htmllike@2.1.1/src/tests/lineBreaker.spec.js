
import Unexpected from 'unexpected';
import MagicPen from 'magicpen';
import LineBreaker from '../lineBreaker';

const expect = Unexpected.clone();
expect.output.preferredWidth = 80;

describe('magicpen-linebreaker', () => {

    let pen;
    beforeEach(() => {
        pen = new MagicPen({
            indentationWidth: 2
        });
    });

    it('outputs a single string', () => {

        const breaker = LineBreaker.breakAt(pen, 50);
        breaker.add(thispen => thispen.text('hello world'));

        expect(breaker.getOutput().output.toString(), 'to equal', 'hello world');
    });

    it('outputs a single line when it fits', () => {


        const breaker = LineBreaker.breakAt(pen, 50);
        breaker.add(thispen => thispen.text('<div>'))
               .add(thispen => thispen.text('content'))
               .add(thispen => thispen.text('</div>'));

        expect(breaker.getOutput().output.toString(), 'to equal', '<div>content</div>');
    });

    it("outputs on multiple lines when it doesn't fit", () => {

        const breaker = LineBreaker.breakAt(pen, 20);
        breaker.add(thispen => thispen.text('<div>').indentOnBreak())
            .add(thispen => thispen.text('content that is longer than the maximum'))
            .add(thispen => thispen.outdentOnBreak().text('</div>'));

        expect(breaker.getOutput().output.toString(), 'to equal',
            '<div>\n' +
            '  content that is longer than the maximum\n' +
            '</div>');
    });

    it('apends multiple children', () => {

        const breaker = LineBreaker.breakAt(pen, 20);
        breaker.add(thispen => thispen.text('<div>').indentOnBreak())
            .add(thispen => thispen.text('content that is longer than the maximum'))
            .add(thispen => thispen.text('XX'))
            .add(thispen => thispen.outdentOnBreak().text('</div>'));

        expect(breaker.getOutput().output.toString(), 'to equal',
            '<div>\n' +
            '  content that is longer than the maximum\n' +
            '  XX\n' +
            '</div>');
    });

    it('apends multiple children on a single line', () => {

        const breaker = LineBreaker.breakAt(pen, 80);
        breaker.add(thispen => thispen.text('<div>').indentOnBreak())
            .add(thispen => thispen.text('content that is shorter than the maximum'))
            .add(thispen => thispen.text('XX'))
            .add(thispen => thispen.outdentOnBreak().text('</div>'));

        expect(breaker.getOutput().output.toString(), 'to equal',
            '<div>content that is shorter than the maximumXX</div>');
    });

    it('forces multilines on forceLineBreak', () => {

        const breaker = LineBreaker.breakAt(pen, 80);
        breaker.add(thispen => thispen.text('<div>').indentOnBreak())
            .add(thispen => thispen.text('content'))
            .add(thispen => thispen.text('content2').forceLineBreak())
            .add(thispen => thispen.text('content3'))
            .add(thispen => thispen.outdentOnBreak().text('</div>'));

        expect(breaker.getOutput().output.toString(), 'to equal',
            '<div>\n' +
            '  content\n' +
            '  content2\n' +
            '  content3\n' +
            '</div>');
    });

    it('appends a line break when forceLineBreak used on last line', () => {
        const breaker = LineBreaker.breakAt(pen, 80);
        breaker.add(thispen => thispen.text('<div').indentOnBreak())
            .add(thispen => thispen.text(' data-test="cheese"'))
            .add(thispen => thispen.text(' data-attr1="x" // should be attr1="1"').forceLineBreak());

        const output = breaker.getOutput().output;
        pen.append(output);
        pen.append('/>');
        expect(pen.toString(), 'to equal',
            '<div\n' +
            '   data-test="cheese"\n' +
            '   data-attr1="x" // should be attr1="1"\n' +
            '/>');
    });

    it("doesn't append a line break when forceLineBreak used on last line with allowForceLastLineBreak = false", () => {
        const breaker = LineBreaker.breakAt(pen, 80);
        breaker.add(thispen => thispen.text('<div').indentOnBreak())
            .add(thispen => thispen.text(' data-test="cheese"'))
            .add(thispen => thispen.text(' data-attr1="x" // should be data-attr1="1"').forceLineBreak());

        const output = breaker.getOutput({ allowForceLastLineBreak: false }).output;
        pen.append(output);
        pen.append('/>');
        expect(pen.toString(), 'to equal',
            '<div\n' +
            '   data-test="cheese"\n' +
            '   data-attr1="x" // should be data-attr1="1"/>');
    });

    it('appends a line break when using appendBreakIfHadBreaks', () => {

        const breaker = LineBreaker.breakAt(pen, 80);
        breaker.add(thispen => thispen.text('<div').indentOnBreak())
            .add(thispen => thispen.text(' data-attr1="x" // should be data-attr1="1"').forceLineBreak())
            .add(thispen => thispen.text(' data-test="cheese"'));

        const output = breaker.getOutput({ appendBreakIfHadBreaks: true }).output;
        pen.append(output);
        pen.append('/>');
        expect(pen.toString(), 'to equal',
            '<div\n' +
            '   data-attr1="x" // should be data-attr1="1"\n' +
            '   data-test="cheese"\n' +
            '/>');
    });

    it("doesn't append a line break when using appendBreakIfHadBreaks when last line is forceLineBreak", () => {

        const breaker = LineBreaker.breakAt(pen, 80);
        breaker.add(thispen => thispen.text('<div').indentOnBreak())
            .add(thispen => thispen.text(' data-test="cheese"'))
            .add(thispen => thispen.text(' data-attr1="x" // should be data-attr1="1"').forceLineBreak());

        const output = breaker.getOutput({ appendBreakIfHadBreaks: true }).output;
        pen.append(output);
        pen.append('/>');
        expect(pen.toString(), 'to equal',
            '<div\n' +
            '   data-test="cheese"\n' +
            '   data-attr1="x" // should be data-attr1="1"\n' +
            '/>');
    });

    it('returns that break is needed after when forceLineBreak on last line', () => {

        const breaker = LineBreaker.breakAt(pen, 80);
        breaker.add(thispen => thispen.text('<div').indentOnBreak())
            .add(thispen => thispen.text(' data-test="cheese"'))
            .add(thispen => thispen.text(' data-attr1="x" // should be data-attr1="1"').forceLineBreak());

        const output = breaker.getOutput({ appendBreakIfHadBreaks: true });
        expect(output, 'to satisfy', {
            breakAfter: true,
            breakBefore: false
        });
    });

    it('returns that a break is needed where forceLineBreakBefore on first line', () => {

        const breaker = LineBreaker.breakAt(pen, 80);
        breaker.add(thispen => thispen.forceLineBreakBefore().text('// missing <span />'))
            .add(thispen => thispen.text('<span />'));

        const output = breaker.getOutput({ appendBreakIfHadBreaks: true });
        expect(output, 'to satisfy', {
            breakAfter: false,
            breakBefore: true
        });
    });

    describe('when using groupContent', () => {

        it('groups content onto single line between forces breaks', () => {

            const breaker = LineBreaker.breakAt(pen, 100);
            breaker.add(thispen => thispen.text('<div').indentOnBreak())
                .add(thispen => thispen.text(' data-attr1="1"'))
                .add(thispen => thispen.text(' data-attr2="2"'))
                .add(thispen => thispen.text(' data-attr3="3"'))
                .add(thispen => thispen.text(' data-attr4="x" // should be data-attr4="4"').forceLineBreak())
                .add(thispen => thispen.text(' data-attr5="5"'))
                .add(thispen => thispen.text(' data-attr6="6"'))
                .add(thispen => thispen.text(' data-attr7="x" // should be data-attr7="7"').forceLineBreak())
                .add(thispen => thispen.text(' data-attr8="8"'))
                .add(thispen => thispen.outdentOnBreak().wrapIfHadBreaks())
                .add(thispen => thispen.text('>').wrapIfHadBreaks().indentOnBreak())
                .add(thispen => thispen.text('pre content'))
                .add(thispen => thispen.text('content').wrapIfHadBreaks())
                .add(thispen => thispen.outdentOnBreak().text('</div>'));

            expect(breaker.getOutput({ groupContent: true }).output.toString(), 'to equal',
            '<div data-attr1="1" data-attr2="2" data-attr3="3" data-attr4="x" // should be data-attr4="4"\n' +
            '   data-attr5="5" data-attr6="6" data-attr7="x" // should be data-attr7="7"\n' +
            '   data-attr8="8"\n' +
            '>\n' +
            '  pre contentcontent\n' +
            '</div>');
        });

        it('breaks lines at maxwidth', () => {

            const breaker = LineBreaker.breakAt(pen, 35);
            breaker.add(thispen => thispen.text('<div').indentOnBreak())
                .add(thispen => thispen.text(' data-attr1="1"'))
                .add(thispen => thispen.text(' data-attr2="2"'))
                .add(thispen => thispen.text(' data-attr3="3"'))
                .add(thispen => thispen.text(' data-attr4="x" // should be data-attr4="4"').forceLineBreak())
                .add(thispen => thispen.text(' data-attr5="5"'))
                .add(thispen => thispen.text(' data-attr6="6"'))
                .add(thispen => thispen.text(' data-attr7="x" // should be data-attr7="7"').forceLineBreak())
                .add(thispen => thispen.text(' data-attr8="8"'))
                .add(thispen => thispen.outdentOnBreak().wrapIfHadBreaks())
                .add(thispen => thispen.text('>').wrapIfHadBreaks().indentOnBreak())
                .add(thispen => thispen.text('pre content'))
                .add(thispen => thispen.text('content').wrapIfHadBreaks())
                .add(thispen => thispen.outdentOnBreak().text('</div>'));

            expect(breaker.getOutput({ groupContent: true }).output.toString(), 'to equal',
                '<div data-attr1="1" data-attr2="2"\n' +
                '   data-attr3="3"\n' +
                '   data-attr4="x" // should be data-attr4="4"\n' +
                '   data-attr5="5" data-attr6="6"\n' +
                '   data-attr7="x" // should be data-attr7="7"\n' +
                '   data-attr8="8"\n' +
                '>\n' +
                '  pre contentcontent\n' +
                '</div>');
        });

        it('forces a line break before the content when using forceLineBreakBefore()', () => {

            const breaker = LineBreaker.breakAt(pen, 80);
            breaker.add(thispen => thispen.text('<div>').indentOnBreak().newLineIfMultiLine())
                .add(thispen => thispen.text('<span>one</span>'))
                .add(thispen => thispen.text('<span>two</span>'))
                .add(thispen => thispen.text('<span>three</span> // should be xxx').forceLineBreakBefore().forceLineBreak())
                .add(thispen => thispen.outdentOnBreak().text('</div>'));

            expect(breaker.getOutput({ groupContent: true }).output.toString(), 'to equal',
                '<div>\n' +
                '  <span>one</span><span>two</span>\n' +
                '  <span>three</span> // should be xxx\n' +
                '</div>');

        });
    });
});
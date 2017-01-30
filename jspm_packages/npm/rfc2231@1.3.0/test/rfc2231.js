/*global describe, it*/
var unexpected = require('unexpected'),
    rfc2231 = require('../lib/rfc2231');

describe('rfc2231', function () {
    var expect = unexpected.clone().addAssertion('to encode to', function (expect, subject, value) {
        expect(rfc2231.encodeAndFoldParameters(subject), 'to equal', value);
    }).addAssertion('to decode to', function (expect, subject, value) {
        expect(rfc2231.unfoldAndDecodeParameters(subject), 'to equal', value);
    }).addAssertion('to encode back and forth to', function (expect, subject, value) {
        expect(subject, 'to encode to', value);
        expect(value, 'to decode to', subject);
    });

    it('should not crash on invalid input', function () {
        expect({'*': {filename: 'bar'}}, 'to decode to', {});
        expect(null, 'to decode to', {});
    });

    it('should only quote parameter values that contain tspecials (rfc2045)', function () {
        expect({bar: 'baz', foo: '>', quotes: '""'}, 'to encode to', {bar: 'baz', foo: '">"', quotes: '"\\"\\""'});
    });

    it('Single-line us-ascii (from RFC2231)', function () {
        expect({
            'title*': "us-ascii'en-us'This%20is%20%2A%2A%2Afun%2A%2A%2A"
        }, 'to decode to', {title: 'This is ***fun***'});
    });

    it('Multi-line us-ascii (from RFC2231)', function () {
        expect({
            'title*0*': "us-ascii'en'This%20is%20even%20more%20",
            'title*1*': '%2A%2A%2Afun%2A%2A%2A%20',
            'title*2': "is it not?"
        }, 'to decode to', {
            title: "This is even more ***fun*** is it not?"
        });
    });

    it('Multi-line UTF-8 example created using Thunderbird', function () {
        expect({
            'filename*0*': "UTF-8''%72%C3%A6%61%6C%6C%79%20%73%63%72%65%77%65%64%20%75%70",
            'filename*1*': '%20%6C%6F%6E%67%20%61%74%74%61%63%68%6D%65%6E%74%20%66%69%6C',
            'filename*2*': '%65%6E%61%6D%65%20%77%69%74%68%20%73%6D%69%6C%65%79%73%E2%98',
            'filename*3*': '%BA%20%61%6E%64%20%E2%98%BA%61%6E%64%20%C2%A1%48%6F%6C%61%2C',
            'filename*4*': '%20%73%65%C3%B1%6F%72%21%20%61%6E%64%20%66%6F%72%65%69%67%6E',
            'filename*5*': '%20%77%65%69%72%64%6E%65%73%73%D7%9D%D7%95%D7%9C%D7%A9%20%D7',
            'filename*6*': '%9F%D7%91%20%D7%99%D7%9C%D7%98%D7%A4%D7%A0%20%69%6E%20%69%74',
            'filename*7*': '%2E%E2%98%BA'
        }, 'to decode to', {
            filename: 'ræally screwed up long attachment filename with smileys☺ and ☺and ¡Hola, señor! and foreign weirdnessםולש ןב ילטפנ in it.☺'
        });
    });

    it('Out of order multi-line UTF-8 example created using Thunderbird', function () {
        expect({
            'filename*2*': '%65%6E%61%6D%65%20%77%69%74%68%20%73%6D%69%6C%65%79%73%E2%98',
            'filename*0*': "UTF-8''%72%C3%A6%61%6C%6C%79%20%73%63%72%65%77%65%64%20%75%70",
            'filename*4*': '%20%73%65%C3%B1%6F%72%21%20%61%6E%64%20%66%6F%72%65%69%67%6E',
            'filename*5*': '%20%77%65%69%72%64%6E%65%73%73%D7%9D%D7%95%D7%9C%D7%A9%20%D7',
            'filename*1*': '%20%6C%6F%6E%67%20%61%74%74%61%63%68%6D%65%6E%74%20%66%69%6C',
            'filename*6*': '%9F%D7%91%20%D7%99%D7%9C%D7%98%D7%A4%D7%A0%20%69%6E%20%69%74',
            'filename*3*': '%BA%20%61%6E%64%20%E2%98%BA%61%6E%64%20%C2%A1%48%6F%6C%61%2C',
            'filename*7*': '%2E%E2%98%BA'
        }, 'to decode to', {
            filename: 'ræally screwed up long attachment filename with smileys☺ and ☺and ¡Hola, señor! and foreign weirdnessםולש ןב ילטפנ in it.☺'
        });
    });

    it('Unknown character set (iso-8859-1 should be assumed)', function () {
        expect({
            'foo*': "invalidcharset''%F8"
        }, 'to decode to', {
            foo: 'ø'
        });
    });

    it('Invalid UTF-8 byte sequence (uses decodeURIComponent, should leave the encoded representation)', function () {
        expect({
            'foo*': "utf-8''%FF%FF"
        }, 'to decode to', {
            foo: "utf-8''%FF%FF"
        });
    });

    it('Invalid UTF-16 byte sequence (uses Iconv, should leave the encoded representation)', function () {
        expect({
            'foo*': "utf-16le''%FF"
        }, 'to decode to', {
            foo: "utf-16le''%FF"
        });
    });

    it('Parameter that does not need encoding should pass through', function () {
        expect({
            foo: 'aa'
        }, 'to encode back and forth to', {
            foo: 'aa'
        });
    });

    it('Long parameter value should be split up', function () {
        expect({
            foo: '0123456789012345678901234567890123456789012345678901234567890123456789'
        }, 'to encode back and forth to', {
            'foo*0': '012345678901234567890123456789012345678901234567890123456789',
            'foo*1': '0123456789'
        });
    });

    it('Non-ascii parameter value that can be represented as iso-8859-1', function () {
        expect({
            bar: 'Fooæ'
        }, 'to encode back and forth to', {
            'bar*': "iso-8859-1''Foo%E6"
        });
    });

    it('Non-ascii parameter value that cannot be represented as iso-8859-1', function () {
        expect({
            bar: 'Foo☺'
        }, 'to encode back and forth to', {
            'bar*': "utf-8''%46%6F%6F%E2%98%BA"
        });
    });

    it('Long non-ascii parameter value', function () {
        expect({
            quux: 'ææææææææææææææææææææææææææææææææææææææææ'
        }, 'to encode back and forth to', {
            'quux*0*': "iso-8859-1''%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6",
            'quux*1*': '%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6%E6',
            'quux*2*': '%E6%E6%E6%E6'
        });
    });

    it('parameter value containing delete character', function () {
        expect({
            filename: 'abc\x7Fdef.jpg'
        }, 'to encode to', {
            'filename*': 'iso-8859-1\'\'abc%7Fdef.jpg'
        });
    });
});

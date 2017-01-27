rfc2231
=======

Encode and decode [rfc2231](https://www.ietf.org/rfc/rfc2231.txt) (MIME Parameter Value and Encoded Word Extensions: Character Sets, Languages, and Continuations) and [rfc5987](https://www.ietf.org/rfc/rfc5987.txt) (Character Set and Language Encoding for Hypertext Transfer Protocol (HTTP) Header Field Parameters).

```js
var rfc2231 = require('rfc2231');

console.log(rfc2231.unfoldAndDecodeParameters({
    'title*0*': "us-ascii'en'This%20is%20even%20more%20",
    'title*1*': '%2A%2A%2Afun%2A%2A%2A%20',
    'title*2': "is it not?"
});
// {title: "This is even more ***fun*** is it not?"}

console.log(rfc2231.encodeAndFoldParameters({
    foo: '0123456789012345678901234567890123456789012345678901234567890123456789'
});
// {
//   'foo*0': '"012345678901234567890123456789012345678901234567890123456789"',
//   'foo*1': '"0123456789"'
// }

```

`rfc2231.unfoldAndDecodeParameters` takes advantage of the `iconv` module if available, and otherwise falls back to `iconv-lite`.

[![NPM version](https://badge.fury.io/js/rfc2231.png)](http://badge.fury.io/js/rfc2231)
[![Build Status](https://travis-ci.org/One-com/rfc2231.png)](https://travis-ci.org/One-com/rfc2231)
[![Coverage Status](https://coveralls.io/repos/One-com/rfc2231/badge.png)](https://coveralls.io/r/One-com/rfc2231)
[![Dependency Status](https://david-dm.org/One-com/rfc2231.png)](https://david-dm.org/One-com/rfc2231)

/*global unescape*/

var isUtf8RegExp = /^utf-?8$/i,
    isLatin1RegExp = /^(?:iso-8859-1|latin1)$/i,
    canBeLatin1EncodedRegExp = /^[\u0000-\u00ff]*$/,
    iconvLite = require('iconv-lite'),
    rfc2231 = module.exports = {};

var iconv;
try {
    iconv = require('' + 'iconv'); // Prevent browserify from detecting iconv and failing
} catch (e) {}

function decodeUnfoldedParameter(text) {
    return text.replace(/^([^\']+)\'([^\']*)\'(.*)$/, function ($0, charset, localeId, encodedText) {
        if (isUtf8RegExp.test(charset)) {
            try {
                return decodeURIComponent(encodedText);
            } catch (e) {
                // Assume URI malformed (invalid utf-8 byte sequence)
                return $0;
            }
        } else if (isLatin1RegExp.test(charset)) {
            return unescape(encodedText);
        } else {
            var numPercentSigns = 0,
                i;
            for (i = 0 ; i < encodedText.length ; i += 1) {
                if (encodedText[i] === '%') {
                    numPercentSigns += 1;
                }
            }
            var buffer = new Buffer(encodedText.length - numPercentSigns * 2),
                j = 0;
            for (i = 0 ; i < encodedText.length ; i += 1) {
                if (encodedText[i] === '%') {
                    buffer[j] = parseInt(encodedText.substr(i + 1, 2), 16);
                    i += 2;
                } else {
                    buffer[j] = encodedText.charCodeAt(i);
                }
                j += 1;
            }

            var decoded;
            if (iconv) {
                var converter;
                try {
                    converter = new iconv.Iconv(charset, 'utf-8//TRANSLIT//IGNORE');
                } catch (e1) {
                    // Assume EINVAL (unsupported charset) and fall back to assuming iso-8859-1:
                    converter = new iconv.Iconv('iso-8859-1', 'utf-8//TRANSLIT//IGNORE');
                }
                try {
                    return converter.convert(buffer).toString('utf-8');
                } catch (e2) {
                }
            } else if (isUtf8RegExp.test(charset)) {
                decoded = buffer.toString('utf-8');
                if (!/\ufffd/.test(decoded)) {
                    return decoded;
                }
            } else if (/^(?:us-)?ascii$/i.test(charset)) {
                return buffer.toString('ascii');
            } else if (iconvLite.encodingExists(charset)) {
                decoded = iconvLite.decode(buffer, charset);
                if (!/\ufffd/.test(decoded)) {
                    return decoded;
                }
            }
            return $0;
        }
    });
}

rfc2231.unfoldAndDecodeParameters = function (encodedParameters) {
    if (!encodedParameters || typeof encodedParameters !== 'object') {
        return {};
    }
    var decodedObj = {},
        foldedParameters = {};
    Object.keys(encodedParameters).forEach(function (key) {
        var value = encodedParameters[key];
        // Guard against bogus input:
        if (typeof value !== 'string') {
            return;
        }
        value = value.replace(/^"|"$/g, '').replace(/\\(["\\])/g, '$1');
        var matchRfc2231FoldedParameter = key.match(/^([^\*]+)(?:\*(\d+))?(\*?)$/);
        if (matchRfc2231FoldedParameter) {
            var parameterName = matchRfc2231FoldedParameter[1],
                sequenceNumber = matchRfc2231FoldedParameter[2] ? parseInt(matchRfc2231FoldedParameter[2], 10) : 0;
            if (!(parameterName in foldedParameters)) {
                foldedParameters[parameterName] = [];
            }
            foldedParameters[parameterName][sequenceNumber] = value;
        } else {
            decodedObj[key] = value;
        }
    });
    Object.keys(foldedParameters).forEach(function (key) {
        var valueArray = foldedParameters[key];
        decodedObj[key] = decodeUnfoldedParameter(valueArray.join(""));
    });
    return decodedObj;
};

// We want to percent-encode all everything that'd require a fragment to be enclosed in double quotes:
// Allowed in output: <any (US-ASCII) CHAR except SPACE, CTLs (\u0000-\u001f\u007f), "*", "'", "%", or tspecials>
var unsafeParameterValueRegExp = /[\u0000-\u001f \u007f*'%\u0080-\uffff]/;

function quoteParameterIfNecessary(value) {
    // tspecials, see definition in rfc2045
    if (/[()<>@,;:\\"\/[\]?=]/.test(value)) {
        return '"' + value.replace(/[\\"]/g, '\\$&') + '"';
    } else {
        return value;
    }
}

rfc2231.encodeAndFoldParameters = function (decodedParameters, maxFragmentLength, forceUtf8) {
    var encodedParameters = {};
    maxFragmentLength = maxFragmentLength || 60;
    Object.keys(decodedParameters).forEach(function (parameterName) {
        var value = decodedParameters[parameterName],
            isEncoded = false;
        if (unsafeParameterValueRegExp.test(value)) {
            var encodedValue,
                i;
            if (!forceUtf8 && canBeLatin1EncodedRegExp.test(value)) {
                encodedValue = "iso-8859-1''";
                for (i = 0 ; i < value.length ; i += 1) {
                    var charCode = value.charCodeAt(i);
                    if (unsafeParameterValueRegExp.test(value[i])) {
                        encodedValue += '%' + (charCode < 16 ? '0' : '') + charCode.toString(16).toUpperCase();
                    } else {
                        encodedValue += value[i];
                    }
                }
            } else {
                encodedValue = "utf-8''";
                var utf8Buffer = new Buffer(value, 'utf-8');
                for (i = 0 ; i < utf8Buffer.length ; i += 1) {
                    encodedValue += '%' + (utf8Buffer[i] < 16 ? '0' : '') + utf8Buffer[i].toString(16).toUpperCase();
                }
            }
            value = encodedValue;
            isEncoded = true;
        }
        if (value.length > maxFragmentLength) {
            var fragmentNum = 0,
                pos = 0;
            while (pos < value.length) {
                var fragment;
                // Avoid breaking in the middle of an encoded octet (make sure the last and second last chars aren't percent signs):
                if (isEncoded && value.length > pos + maxFragmentLength && value[pos + maxFragmentLength - 1] === '%') {
                    fragment = value.substr(pos, maxFragmentLength - 1);
                } else if (isEncoded && value.length > pos + maxFragmentLength && value[pos + maxFragmentLength - 2] === '%') {
                    fragment = value.substr(pos, maxFragmentLength - 2);
                } else {
                    fragment = value.substr(pos, maxFragmentLength);
                }
                encodedParameters[parameterName + '*' + fragmentNum + (isEncoded ? '*' : '')] = quoteParameterIfNecessary(fragment);

                pos += fragment.length;
                fragmentNum += 1;
            }
        } else {
            encodedParameters[parameterName + (isEncoded ? '*' : '')] = quoteParameterIfNecessary(value);
        }
    });
    return encodedParameters;
};

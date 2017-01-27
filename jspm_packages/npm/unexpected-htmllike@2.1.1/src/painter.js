
import LineBreaker from './lineBreaker';
import isNativeType from './isNativeType';

const WRAP_WIDTH = 80;

export default function painter(pen, description, diffFn, inspect) {

    if (description.diff) {

        switch(description.diff.type) {
            case 'missing':
                pen.forceLineBreakBefore();
                pen.annotationBlock(function () {
                    this.error('missing').sp();
                    if (typeof description.diff.actualIndex === 'number') {
                        this.error('(found at index ' + description.diff.actualIndex + ')').sp();
                    }
                    this.block(function () {
                        painter(this, {
                            type: description.type,
                            name: description.name,
                            value: description.value,
                            attributes: description.attributes,
                            children: description.children
                        }, diffFn, inspect);
                    });
                });
                return;

            case 'extra':
                pen.forceLineBreakBefore();
                const removedElementPen = pen.clone();

                painter(removedElementPen, {
                    type: description.type,
                    name: description.name,
                    value: description.value,
                    attributes: description.attributes,
                    children: description.children
                }, diffFn, inspect);
                pen.block(removedElementPen).sp().annotationBlock(function () {
                    this.error('should be removed');
                    this.nl(removedElementPen.size().height - 1).i();
                });
                return;

            case 'wrapper':
                pen.prismPunctuation('<')
                    .prismTag(description.name);
                if (description.attributes) {
                    outputAttributes(pen, description.attributes, inspect, diffFn);
                }
                pen.prismPunctuation('>')
                    .sp()
                    .annotationBlock(function () {
                        this.error('wrapper should be removed');
                    });

                outputChildren(pen, description, inspect, diffFn, true);
                pen.prismPunctuation('</')
                    .prismTag(description.name)
                    .prismPunctuation('>').sp().annotationBlock(function () {
                    this.error('wrapper should be removed');
                });
                return;

            case 'differentElement':
                pen.prismPunctuation('<')
                    .prismTag(description.name)
                    .sp().annotationBlock(function () {
                    this.error('should be').sp().prismPunctuation('<')
                    .prismTag(description.diff.expectedName);
                });
                if (description.attributes) {
                    pen.nl().indentLines();
                    if (description.attributes && description.attributes.length) {
                        pen.i();
                        outputAttributes(pen, description.attributes, inspect, diffFn);
                    }
                    pen.outdentLines();
                } else {
                    pen.nl().i();
                }

                if (description.children && description.children.length) {
                    pen.prismPunctuation('>');
                    outputChildren(pen, description, inspect, diffFn, true);
                    pen.prismPunctuation('</')
                        .prismTag(description.name)
                        .prismPunctuation('>');
                } else {
                    pen.prismPunctuation('/>');
                }
                return;

            case 'contentElementMismatch':
                if (pen.forceLineBreakBefore) {
                    pen.forceLineBreakBefore();
                }
                pen.text(description.value).sp().annotationBlock(function () {
                    this.error('should be').sp();
                    const expectedPen = pen.clone();
                    painter(expectedPen, description.diff.expected, diffFn, inspect);
                    this.block(expectedPen);
                });
                return;

            case 'elementContentMismatch':
                const elementPen = pen.clone();
                outputElement(elementPen, description, inspect, diffFn);
                if (pen.forceLineBreakBefore) {
                    pen.forceLineBreakBefore();
                }
                pen.block(elementPen).sp().annotationBlock(function () {
                    this.error('should be')
                        .sp()
                        .append(inspect(description.diff.expected.value))
                        .nl(elementPen.size().height - 1);
                });
                return;
        }

    }


    switch(description.type) {

        case 'ELEMENT':
            outputElement(pen, description, inspect, diffFn);
            break;

        case 'WRAPPERELEMENT':
            outputWrapperElement(pen, description, inspect, diffFn);
            break;

        case 'CONTENT':
            if (description.diff) {
                switch(description.diff.type) {
                    case 'changed':
                        const expectedString = '' + description.diff.expectedValue;
                        const actualString = '' + description.value;
                        pen.block(function () {
                            if (expectedString === actualString) {
                                this.block(function () {
                                    this.text(actualString);
                                }).sp().annotationBlock(function () {
                                    this.error('mismatched type').sp().block(diffFn(typeof description.value, typeof description.diff.expectedValue).diff);
                                });
                            } else if (typeof description.value === typeof description.diff.expectedValue) {
                                this.block(actualString).sp().annotationBlock(function () { this.append(diffFn(description.value, description.diff.expectedValue).diff); })
                            } else {
                                this.block(function () {
                                    this.append(diffFn('' + description.value, '' + description.diff.expectedValue).diff);
                                }).sp().annotationBlock(function () {
                                    this.error('and mismatched type').sp().block(diffFn(typeof description.value, typeof description.diff.expectedValue).diff);
                                });
                            }
                        });
                        break;

                    case 'custom':

                        pen.text(description.value).sp().annotationBlock(function () {
                            this.append(description.diff.error.getErrorMessage(pen));
                        });
                        if (pen.forceLineBreak) {
                            pen.forceLineBreakBefore();
                        }
                        break;

                }
            } else if (typeof description.value === 'function' && description.value._expectIt) {
                pen.prismPunctuation('{').append(inspect(description.value)).prismPunctuation('}');
            } else {
                pen.text(description.value);
            }
            break;
    }
}

function outputElement(pen, description, inspect, diffFn) {

    pen.prismPunctuation('<')
        .prismTag(description.name);

    let needSpaceBeforeSelfClose = true;
    let forceChildrenOnNewLine = false;
    let needNewLineBeforeClose = false;
    if (description.attributes) {
        const attributeResult = outputAttributes(pen, description.attributes, inspect, diffFn);

        if (attributeResult.size.height > 1) {
            needSpaceBeforeSelfClose = false;
            forceChildrenOnNewLine = true;
            if (!attributeResult.breakAfter) {
                needNewLineBeforeClose = true;
            }
        }
    }


    if (!description.children || description.children.length === 0) {
        if (needSpaceBeforeSelfClose) {
            pen.sp();
        }

        if (needNewLineBeforeClose) {
            pen.nl().i();
        }
        pen.prismPunctuation('/>');
    } else {

        pen.prismPunctuation('>');
        outputChildren(pen, description, inspect, diffFn, forceChildrenOnNewLine);

        pen.prismPunctuation('</')
            .prismTag(description.name)
            .prismPunctuation('>');

    }
}

function outputWrapperElement(pen, description, inspect, diffFn) {

    pen.gray('<')
        .gray(description.name);

    if (description.attributes) {
        const attribPen = pen.clone();
        outputAttributes(attribPen, description.attributes, inspect, diffFn);
        attribPen.replaceText(function (styles, text) {
            this.text(text, 'gray');
        });
        pen.append(attribPen);
    }


    pen.gray('>');
    outputChildren(pen, description, inspect, diffFn, true);

    pen.gray('</')
        .gray(description.name)
        .gray('>');

}

function outputChildren(pen, description, inspect, diffFn, forcedOnNewLine) {

    const childrenOutput = LineBreaker.breakAt(pen, WRAP_WIDTH);
    for (let childIndex = 0; childIndex < description.children.length; ++childIndex) {
        const child = description.children[childIndex];

        childrenOutput.add(childPen => {
            painter(childPen, child, diffFn, inspect);
        });
    }
    const childrenResultOutput = childrenOutput.getOutput();
    const childrenSize = childrenResultOutput.output.size();

    let childrenOnSeparateLines = false;
    if (forcedOnNewLine ||
        childrenResultOutput.breakAfter ||
        childrenResultOutput.breakBefore ||
        childrenSize.height > 1 ||
        (childrenSize.width + pen.size().width) >= WRAP_WIDTH) {
        pen.indentLines().nl().i();
        childrenOnSeparateLines = true;
    }

    pen.block(childrenResultOutput.output);

    if (childrenOnSeparateLines) {
        pen.outdentLines().nl().i();
    }
}

function outputAttribute(pen, name, value, diff, inspect, diffFn) {


    if (diff) {
        pen.sp();
        switch(diff.type) {
            case 'changed':
                outputRawAttribute(pen, name, value, inspect);
                pen.sp().annotationBlock(pen => {
                    if (diff.error) {
                        pen.append(diff.error.getErrorMessage(pen));
                    } else {
                        pen.error('should be ');
                        outputRawAttribute(pen, name, diff.expectedValue, inspect);
                        if (typeof value === typeof diff.expectedValue && typeof value !== 'boolean') {

                            const valueDiff = diffFn(value, diff.expectedValue);

                            if (valueDiff && valueDiff.inline) {
                                pen.nl().block(valueDiff.diff);
                            } else if (valueDiff) {
                                pen.nl().block(function () {
                                    this.append(valueDiff.diff);
                                });
                            } else {
                                pen.nl().block(function () {
                                    this.append(inspect(diff.expectedValue));
                                });
                            }
                        }
                    }
                }).forceLineBreak();
                break;

            case 'custom':
                outputRawAttribute(pen, name, value, inspect);
                pen.sp().annotationBlock(pen => {
                    pen.addStyle('appendInspected', function (arg) {
                        this.append(inspect(arg));
                    }, true);
                    pen.block(diff.error.getErrorMessage(pen));
                }).forceLineBreak();

                break;
            case 'missing':
                pen.annotationBlock(pen => {
                    pen.error('missing ');
                    outputRawAttribute(pen, name, diff.expectedValue, inspect);
                }).forceLineBreak();
                break;

            case 'extra':
                outputRawAttribute(pen, name, value, inspect, diff);
                pen.sp().annotationBlock(pen => {
                    pen.prismAttrName(name)
                        .sp()
                        .error('should be removed');
                }).forceLineBreak();
                break;

            case 'class':
                outputRawAttribute(pen, name, value, inspect, diff);
                pen.sp().annotationBlock(pen => {
                    if (diff.missing) {
                        pen.error('missing class' + (diff.missing.indexOf(' ') !== -1 ? 'es' : '')).sp().append(inspect(diff.missing));
                    }
                    if (diff.extra) {
                        if (diff.missing) {
                            pen.nl().i();
                        }
                        pen.error('extra class' + (diff.extra.indexOf(' ') !== -1 ? 'es' : '')).sp().append(inspect(diff.extra));
                    }
                }).forceLineBreak();
        }
    } else if (value !== undefined) {
        pen.sp();
        outputRawAttribute(pen, name, value, inspect);
    }
}

function outputRawAttribute(pen, name, value, inspect) {

    pen.prismAttrName(name)
        .prismPunctuation('=');


    switch(typeof value) {
        case 'string':
            pen.prismPunctuation('"')
                .prismAttrValue(value)
                .prismPunctuation('"');
            break;

        case 'function':
            pen.prismPunctuation('{');
            outputFunctionAttribute(pen, value, inspect);
            pen.prismPunctuation('}');
            break;
        default:
            pen.prismPunctuation('{')
                .append(inspect(value))
                .prismPunctuation('}');
            break;
    }
}

function outputFunctionAttribute(pen, value, inspect) {

    if (value._expectIt) {
        pen.append(inspect(value));
        return;
    }
    
    if (value && typeof value.toString === 'function') {
        var source = value.toString();
        var matchSource = source.match(/^\s*function (\w*?)\s*\(([^\)]*)\)\s*\{([\s\S]*?( *)?)\}\s*$/);
        if (matchSource) {
            var name = (typeof value.name === 'string' && value.name) || matchSource[1];
            var args = matchSource[2];
            var body = matchSource[3];
            if (body.indexOf('\n') !== -1 || body.length > 30) {
                pen.prismKeyword('function ')
                    .prismVariable(name)
                    .prismPunctuation('(')
                    .prismVariable(args)
                    .prismPunctuation(') { /* ... */ }');
            } else {
                pen.append(inspect(value));
            }
        } else {
            if (source && source.length < 30) {
                pen.append('function ').append(source);
            } 
        }
    } else {
        pen.append(inspect(value));
    }

}

function outputAttributes(pen, attributes, inspect, diffFn) {
    const attribOutput = LineBreaker.breakAt(pen, WRAP_WIDTH);
    attribOutput.add(pen => pen.indentOnBreak());

    attributes.forEach(attrib => {
        attribOutput.add(pen => {
            outputAttribute(pen, attrib.name, attrib.value, attrib.diff, inspect, diffFn);
        });
    });

    const attribResult = attribOutput.getOutput({ groupContent: true, appendBreakIfHadBreaks: false });
    pen.append(attribResult.output);
    return {
        size: attribResult.output.size(),
        breakAfter: attribResult.breakAfter
    };
}


import ObjectAssign from 'object-assign';

const INDENT_SIZE = 2;

const defaultOptions = {
    allowForceLastLineBreak: true
};

function breakAt(pen, maxWidth) {

    const pens =  [];
    const breaker = {
        add(callback) {
            const thisPen = pen.clone();
            const entry = {
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

        getOutput(options) {

            options = ObjectAssign({}, defaultOptions, options);
            const resultPen = pen.clone();
            let width = 0;
            let hadLineBreaks = false;
            let indentCount = 0;

            if (options && options.groupContent) {

                let needIndent = false;
                let isMultiLine = false;


                isMultiLine = pens.some(entry => {

                    const size = entry.pen.size();
                    width += size.width;
                    return entry.forceLineBreak || entry.forceLineBreakBefore ||
                            size.height > 1 || width > maxWidth;
                });
                width = 0;

                pens.forEach(entry => {

                    if (entry.outdentOnBreak) {
                        resultPen.outdentLines();
                        indentCount--;
                    }

                    const size = entry.pen.size();

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

                    if ((entry.wrapIfHadBreaks && hadLineBreaks) ||
                        entry.forceLineBreak || (isMultiLine && entry.newLineIfMultiLine)) {
                        resultPen.nl();
                        needIndent = true;
                        hadLineBreaks = true;
                        width = 0;
                    }

                });


            } else {

                const isMultiline = pens.some(entry => {
                    if (entry.forceLineBreak || entry.forceLineBreakBefore) {
                        hadLineBreaks = true;
                        return true;
                    }
                    const size = entry.pen.size();
                    width += size.width;
                    return (width > maxWidth || size.height > 1);
                });

                if (isMultiline) {
                    let previousLineBreak = false;
                    pens.forEach((entry, index) => {
                        if (entry.outdentOnBreak) {
                            resultPen.outdentLines();
                            indentCount--;
                        }
                        const addBreak = (index < pens.length - 1) || (options.allowForceLastLineBreak && entry.forceLineBreak);
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
                    pens.forEach(entry => {
                        resultPen.append(entry.pen);
                    });

                }
            }

            for (;indentCount > 0; --indentCount) {
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

export default {
    breakAt
};
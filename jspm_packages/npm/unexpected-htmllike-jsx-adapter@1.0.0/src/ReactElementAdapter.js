import React from 'react';
import ObjectAssign from 'object-assign';
import getIteratorFn from './getIteratorFn';

const REACT_ELEMENT_TYPE =
    (typeof Symbol === 'function' && Symbol.for && Symbol.for('react.element')) ||
    0xeac7;

function isRawType(value) {
    var type = typeof value;
    return type === 'string' ||
        type === 'number' ||
        type === 'boolean' ||
        type === 'undefined' ||
        value === null;
}

const DefaultOptions = {
    concatTextContent: false
};

function convertValueTypeToString(value) {

    if (typeof value === 'string') { // Common case can be fasttracked
        return value;
    }

    if (value === null || value === undefined) {
        return '';
    }

    return '' + value;
}

function concatenateStringChildren(accum, value) {
    if (isRawType(value) && accum.length &&
        isRawType(accum[accum.length - 1]))
    {
        accum[accum.length - 1] = convertValueTypeToString(accum[accum.length - 1]) + convertValueTypeToString(value);
        return accum;
    }
    accum.push(value);
    return accum;
}

function isValidChild(child) {
    const typeofChild = typeof child;
    return (typeofChild === 'string' ||
        typeofChild === 'number' ||
        (typeofChild === 'function' && child._expectIt) ||
        (typeof child === 'object' && child !== null &&
         (child._isReactElement /* React 0.13 */
         || child.$$typeof === REACT_ELEMENT_TYPE /* React 0.14 */))
    );
}

function flatten(value) {
    if (!Array.isArray(value)) {
        return [value];
    }

    return value.reduce((result, item) => result.concat(flatten(item)), [])
}

class ReactElementAdapter {

    constructor(options) {
        this._options = ObjectAssign({}, DefaultOptions, options);
    }

    getName(element) {
        if (typeof element.type === 'string') {
            return element.type;
        }

        return element.type.displayName || element.type.name || 'no-display-name';
    }

    getAttributes(element) {

        var realProps = {};
        if (element.props) {
            for (var key in element.props) {
                if (key !== 'children') {
                    realProps[key] = element.props[key];
                }
            }
        }

        if (this._options.includeKeyProp && element.key) {
            realProps.key = element.key;
        }

        if (this._options.includeRefProp && element.ref) {
            realProps.ref = element.ref;
        }

        return realProps;
    }

    getChildren(element) {

        var children = element.props.children;
        var childrenArray = [];
        var iteratorFn;

        // This is not using React.Children.forEach / map / toArray because it drops invalid children,
        // which would be fine, but we want to explicitly include the `expect.it()` function as a valid child
        // to enable inline assertions
        // This mirrors the React.Children.forEach logic, as seen at
        // https://github.com/facebook/react/blob/35962a00084382b49d1f9e3bd36612925f360e5b/src/shared/utils/traverseAllChildren.js
        // with the exception that we remove the nulls
        // Basically strings & numbers && elements are allowed (elements classed as objects & functions for simplicity)
        if (Array.isArray(children)) {
            childrenArray = flatten(children).filter(child => isValidChild(child));
        } else if (isValidChild(children)) {
            childrenArray = [ children ];
        } else if (iteratorFn = getIteratorFn(children)) {
            const iterator = iteratorFn.call(children);
            let step;

            while (!(step = iterator.next()).done) {
                childrenArray.push(step.value);
            }
        }

        if (this._options.convertToString ||
            (this._options.convertMultipleRawToStrings &&
             childrenArray.length > 1)) {
            childrenArray = childrenArray.reduce((agg, child) => {
                if (child !== null && child !== undefined && isRawType(child)) {
                    child = convertValueTypeToString(child);
                }
                agg.push(child);
                return agg;
            }, []);
        }

        if (this._options.concatTextContent) {
            childrenArray = childrenArray.reduce(concatenateStringChildren, []);
        }

        return childrenArray;
    }

    setOptions(newOptions) {

        this._options = ObjectAssign({}, this._options, newOptions);
    }

    getOptions() {
        return this._options;
    }
}


ReactElementAdapter.prototype.classAttributeName = 'className';

export default ReactElementAdapter;

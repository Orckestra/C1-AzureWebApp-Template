
const expectedSymbol = Symbol('expected');
const actualSymbol = Symbol('actual');

const TestExpectedAdapter = {

    _checkValidComponentPassed(comp) {
        if (comp.$expected !== expectedSymbol) {
            throw new Error('Non-expected type passed to expected adapter:' + JSON.stringify(comp));
        }
    },

    getName(comp) {
        this._checkValidComponentPassed(comp);
        return comp.name;
    },

    getAttributes(comp) {
        this._checkValidComponentPassed(comp);
        return comp.attribs;
    },

    _wrapChild(child) {
        return createExpected(child);
    },

    getChildren(comp) {
        this._checkValidComponentPassed(comp);
        return ((comp.children && [].concat([], comp.children)) || []).map(item => typeof(item) === 'object' ? this._wrapChild(item) : item);
    },

    classAttributeName: 'className'
};

const TestActualAdapter = Object.create(TestExpectedAdapter);

TestActualAdapter._checkValidComponentPassed = comp => {
    if (comp.$actual !== actualSymbol) {
        throw new Error('Non-actual type passed to actual adapter:' + JSON.stringify(comp) + ' expectedSymbol was ' + (comp.$expected && comp.$expected.toString()));
    }
};

TestActualAdapter._wrapChild = function(child) {
    return createActual(child);
};


const createActual = desc => {
    desc.$actual = actualSymbol;
    return desc;
};

const createExpected = desc => {
    desc.$expected = expectedSymbol;
    return desc;
};

export {
    expectedSymbol,
    actualSymbol,
    TestExpectedAdapter,
    TestActualAdapter,
    createActual,
    createExpected
};

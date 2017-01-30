'use strict';

var nodes = new Map();

exports.mount = function (component) {

    var rootNodeID = component.element._rootNodeID;
    var elementsInRoot = nodes.get(rootNodeID);
    if (elementsInRoot === undefined) {
        elementsInRoot = [];
        nodes.set(rootNodeID, elementsInRoot);
    }
    elementsInRoot.push(component);
};

exports.update = function (component) {
    var existing = exports.findInternalComponent(component.element);
    if (existing) {
        existing.data = component.data;
    }
};

exports.findComponent = function (component) {
    if (component && component._reactInternalInstance) {
        var elementsInRoot = nodes.get(component._reactInternalInstance._rootNodeID);
        if (elementsInRoot) {
            for (var index = elementsInRoot.length - 1; index >= 0; --index) {
                if (elementsInRoot[index].data.publicInstance === component) {
                    var renderedComponent = elementsInRoot[index];
                    if (renderedComponent.data.nodeType === 'NativeWrapper') {
                        return exports.findInternalComponent(renderedComponent.data.children[0]);
                    }
                    return renderedComponent;
                }
            }
        }
    }

    return null;
};

exports.findInternalComponent = function (internalComponent) {
    if (internalComponent) {
        var elementsInRoot = nodes.get(internalComponent._rootNodeID);
        if (elementsInRoot) {
            for (var index = elementsInRoot.length - 1; index >= 0; --index) {
                if (elementsInRoot[index].element === internalComponent) {
                    return elementsInRoot[index];
                }
            }
        }
    }
};

exports.clearAll = function () {
    nodes.clear();
};
//# sourceMappingURL=componentMap.js.map
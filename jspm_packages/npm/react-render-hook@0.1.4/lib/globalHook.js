'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var Backend = require('./react-devtools/backend/backend');
var GlobalHook = require('./react-devtools/backend/installGlobalHook');

var ComponentMap = require('./componentMap');

if (typeof global.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
    delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}
if (typeof window !== 'undefined' && typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
    delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
}

// Install the global hook
var tempGlobal = {};

GlobalHook(tempGlobal);
var hook = tempGlobal.__REACT_DEVTOOLS_GLOBAL_HOOK__;

if (typeof global !== 'undefined') {
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
}

if (typeof window !== 'undefined') {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
}

var globalWindowTempDefined = false;
if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // If we've got no DOM emulation, and we're in a node environment
    // we'll emulate window just while we install the GlobalHook, as that expects window to be there
    global.window = {};
    globalWindowTempDefined = true;
}

// Inject the backend
Backend(hook);

if (globalWindowTempDefined) {
    // We can remove our temporary object, now that Backend has done its thing
    delete global.window;
}

var exported = {
    hook: hook,
    cleanup: function cleanup() {
        ComponentMap.clearAll();
    }
};

hook.sub('renderer-attached', function (args) {
    exported.rendererId = args.renderer;
    exported.helpers = args.helpers;
    exported.isAttached = true;
});

hook.sub('mount', function (component) {
    ComponentMap.mount(component);
});

hook.sub('update', function (component) {
    ComponentMap.update(component);
});

exported.findComponent = function (component) {

    return ComponentMap.findComponent(component);
};

exported.findInternalComponent = function (internalComponent) {

    return ComponentMap.findInternalComponent(internalComponent);
};

function isRawType(value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    return type === 'string' || type === 'number' || type === 'boolean' || type === 'undefined' || value === null;
}

exported.findChildren = function (component) {

    var internalComponent = void 0;
    if (component && component.element && component.data) {
        internalComponent = component;
    } else {
        internalComponent = exported.findComponent(component);
    }

    if (internalComponent && internalComponent.data.children) {
        if (isRawType(internalComponent.data.children)) {
            return [internalComponent.data.children];
        }

        return internalComponent.data.children.map(function (child) {
            var renderedChild = exported.findInternalComponent(child);
            if (renderedChild.data.nodeType === 'NativeWrapper') {
                return exported.findInternalComponent(renderedChild.data.children[0]);
            }
            return renderedChild;
        });
    }
};

exported.clearAll = ComponentMap.clearAll;

module.exports = exported;
//# sourceMappingURL=globalHook.js.map
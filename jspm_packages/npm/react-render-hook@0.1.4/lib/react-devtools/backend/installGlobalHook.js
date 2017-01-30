/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */
'use strict';

/**
 * NOTE: This file cannot `require` any other modules. We `.toString()` the
 *       function in some places and inject the source into the page.
 */
function installGlobalHook(window) {
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    return;
  }
  Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
    value: {
      _renderers: {},
      helpers: {},
      inject: function inject(renderer) {
        var id = Math.random().toString(16).slice(2);
        this._renderers[id] = renderer;
        this.emit('renderer', { id: id, renderer: renderer });
      },
      _listeners: {},
      sub: function sub(evt, fn) {
        var _this = this;

        this.on(evt, fn);
        return function () {
          return _this.off(evt, fn);
        };
      },
      on: function on(evt, fn) {
        if (!this._listeners[evt]) {
          this._listeners[evt] = [];
        }
        this._listeners[evt].push(fn);
      },
      off: function off(evt, fn) {
        if (!this._listeners[evt]) {
          return;
        }
        var ix = this._listeners[evt].indexOf(fn);
        if (ix !== -1) {
          this._listeners[evt].splice(ix, 1);
        }
        if (!this._listeners[evt].length) {
          this._listeners[evt] = null;
        }
      },
      emit: function emit(evt, data) {
        if (this._listeners[evt]) {
          this._listeners[evt].map(function (fn) {
            return fn(data);
          });
        }
      }
    }
  });
}

module.exports = installGlobalHook;
//# sourceMappingURL=installGlobalHook.js.map
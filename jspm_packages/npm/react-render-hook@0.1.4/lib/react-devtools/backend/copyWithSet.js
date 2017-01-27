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

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function copyWithSetImpl(obj, path, idx, value) {
  if (idx >= path.length) {
    return value;
  }
  var key = path[idx];
  var updated = Array.isArray(obj) ? obj.slice() : _extends({}, obj);
  // $FlowFixMe number or string is fine here
  updated[key] = copyWithSetImpl(obj[key], path, idx + 1, value);
  return updated;
}

function copyWithSet(obj, path, value) {
  return copyWithSetImpl(obj, path, 0, value);
}

module.exports = copyWithSet;
//# sourceMappingURL=copyWithSet.js.map
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _domino = require('domino');

var _domino2 = _interopRequireDefault(_domino);

if (!global.window) {
    global.window = _domino2['default'].createWindow('');
    global.document = window.document;
    global.navigator = {
        userAgent: 'Domino'
    };
}
//# sourceMappingURL=emulateDom.js.map
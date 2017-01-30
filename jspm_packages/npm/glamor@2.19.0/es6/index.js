var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**** stylesheet  ****/

import { StyleSheet } from './sheet.js';
import { createMarkupForStyles } from './CSSPropertyOperations';
import clean from './clean.js';

export var styleSheet = new StyleSheet();
// an isomorphic StyleSheet shim. hides all the nitty gritty.

// /**************** LIFTOFF IN 3... 2... 1... ****************/
styleSheet.inject(); //eslint-disable-line indent
// /****************      TO THE MOOOOOOON     ****************/

// convenience function to toggle speedy
export function speedy(bool) {
  return styleSheet.speedy(bool);
}

// plugins
import { PluginSet, prefixes, fallbacks, positionSticky } from './plugins'; // we include these by default
export var plugins = styleSheet.plugins = new PluginSet(prefixes, positionSticky, fallbacks);
plugins.media = new PluginSet(); // neat! media, font-face, keyframes
plugins.fontFace = new PluginSet();
plugins.keyframes = new PluginSet(prefixes);

// define some constants
var isBrowser = typeof window !== 'undefined';
var isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
var isTest = process.env.NODE_ENV === 'test';

/**** simulations  ****/

// a flag to enable simulation meta tags on dom nodes
// defaults to true in dev mode. recommend *not* to
// toggle often.
var canSimulate = isDev;

// we use these flags for issuing warnings when simulate is called
// in prod / in incorrect order
var warned1 = false,
    warned2 = false;

// toggles simulation activity. shouldn't be needed in most cases
export function simulations() {
  var bool = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

  canSimulate = !!bool;
}

// use this on dom nodes to 'simulate' pseudoclasses
// <div {...hover({ color: 'red' })} {...simulate('hover', 'visited')}>...</div>
// you can even send in some weird ones, as long as it's in simple format
// and matches an existing rule on the element
// eg simulate('nthChild2', ':hover:active') etc
export function simulate() {
  for (var _len = arguments.length, pseudos = Array(_len), _key = 0; _key < _len; _key++) {
    pseudos[_key] = arguments[_key];
  }

  pseudos = clean(pseudos);
  if (!pseudos) return {};
  if (!canSimulate) {
    if (!warned1) {
      console.warn('can\'t simulate without once calling simulations(true)'); //eslint-disable-line no-console
      warned1 = true;
    }
    if (!isDev && !isTest && !warned2) {
      console.warn('don\'t use simulation outside dev'); //eslint-disable-line no-console
      warned2 = true;
    }
    return {};
  }
  return pseudos.reduce(function (o, p) {
    return o['data-simulate-' + simple(p)] = '', o;
  }, {});
}

/**** labels ****/
// toggle for debug labels.
// *shouldn't* have to mess with this manually
var hasLabels = isDev;

export function cssLabels(bool) {
  hasLabels = !!bool;
}

// takes a string, converts to lowercase, strips out nonalphanumeric.
function simple(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// flatten a nested array
function flatten(inArr) {
  var arr = [];
  for (var i = 0; i < inArr.length; i++) {
    if (Array.isArray(inArr[i])) arr = arr.concat(flatten(inArr[i]));else arr = arr.concat(inArr[i]);
  }
  return arr;
}

// hashes a string to something 'unique'
// we use this to generate ids for styles
import hash from './hash';

function hashify() {
  for (var _len2 = arguments.length, objs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    objs[_key2] = arguments[_key2];
  }

  return hash(objs.map(function (x) {
    return JSON.stringify(x);
  }).join('')).toString(36);
}

// of shape { 'data-css-<id>': ''}
export function isLikeRule(rule) {
  var keys = Object.keys(rule).filter(function (x) {
    return x !== 'toString';
  });
  if (keys.length !== 1) {
    return false;
  }
  return !!/data\-css\-([a-zA-Z0-9]+)/.exec(keys[0]);
}

// extracts id from a { 'data-css-<id>': ''} like object
export function idFor(rule) {
  var keys = Object.keys(rule).filter(function (x) {
    return x !== 'toString';
  });
  if (keys.length !== 1) throw new Error('not a rule');
  var regex = /data\-css\-([a-zA-Z0-9]+)/;
  var match = regex.exec(keys[0]);
  if (!match) throw new Error('not a rule');
  return match[1];
}

// a simple cache to store generated rules
var registered = styleSheet.registered = {};
function register(spec) {
  if (!registered[spec.id]) {
    registered[spec.id] = spec;
  }
}

// semi-deeply merge 2 'mega' style objects
function deepMergeStyles(dest, src) {
  Object.keys(src).forEach(function (expr) {
    dest[expr] = dest[expr] || {};
    Object.keys(src[expr]).forEach(function (type) {
      dest[expr][type] = dest[expr][type] || {};
      Object.assign(dest[expr][type], src[expr][type]);
    });
  });
}

//todo - prevent nested media queries
function deconstruct(obj) {
  var ret = [],
      composesWith = void 0;
  var plain = {},
      hasPlain = false;
  var isSpecial = obj && find(Object.keys(obj), function (x) {
    return x.charAt(0) === ':' || // pseudos
    x.charAt(0) === '@' || // media queries; todo - check @media
    x.indexOf('&') >= 0 || // 'selects'
    x === 'composes';
  } // like css modules!
  );

  if (isSpecial) {
    Object.keys(obj).forEach(function (key) {
      if (key === 'composes') {
        composesWith = obj[key];
      } else if (key.charAt(0) === ':') {
        ret.push({
          type: 'pseudo',
          style: obj[key],
          selector: key
        });
      } else if (key.charAt(0) === '@') {
        ret.push({
          type: 'media',
          rules: deconstruct(obj[key]),
          expr: key.substring(6)
        });
      } else if (key.indexOf('&') >= 0 || _typeof(obj[key]) === 'object') {
        ret.push({
          type: 'select',
          style: Array.isArray(obj[key]) ? Object.assign.apply(Object, [{}].concat(_toConsumableArray(obj[key]))) : obj[key],
          selector: key
        });
      } else {
        hasPlain = true;
        plain[key] = obj[key];
      }
    });
    ret = hasPlain ? [plain].concat(_toConsumableArray(ret)) : ret;
    ret = composesWith ? [composesWith].concat(_toConsumableArray(ret)) : ret;
    return ret;
  }
  return obj;
}

function _getRegistered(rule) {
  if (isLikeRule(rule)) {
    var ret = registered[idFor(rule)];
    if (ret == null) {
      throw new Error('[glamor] an unexpected rule cache miss occurred. This is probably a sign of multiple glamor instances in your app. See https://github.com/threepointone/glamor/issues/79');
    }
    return ret;
  }
  return rule;
}

// extracts and composes styles from a rule into a 'mega' style
// with sub styles keyed by media query + 'path'
function extractStyles() {
  for (var _len3 = arguments.length, rules = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    rules[_key3] = arguments[_key3];
  }

  rules = flatten(rules);
  var exprs = {};
  // converts {[data-css-<id>]} to the backing rule

  rules = rules.map(_getRegistered).map(function (x) {
    return x.type === 'style' || !x.type ? deconstruct(x.style || x) : x;
  });

  rules = flatten(rules).map(_getRegistered); // sigh, this is to handle arrays in `composes`. must make better.

  rules.forEach(function (rule) {
    // avoid possible label. todo - cleaner
    if (typeof rule === 'string') {
      return;
    }
    switch (rule.type) {
      case 'raw':
        throw new Error('not implemented');
      case 'font-face':
        throw new Error('not implemented');
      case 'keyframes':
        throw new Error('not implemented');

      case 'merge':
        return deepMergeStyles(exprs, extractStyles(rule.rules));

      case 'pseudo':
        if (rule.selector === ':hover' && exprs._ && exprs._['%%%:active'] && !exprs._['%%%:hover']) {
          console.warn(':active must come after :hover to work correctly'); //eslint-disable-line no-console
        }
        return deepMergeStyles(exprs, { _: _defineProperty({}, '%%%' + rule.selector, rule.style) });
      case 'select':
        return deepMergeStyles(exprs, { _: _defineProperty({}, '^^^' + rule.selector, rule.style) });
      case 'parent':
        return deepMergeStyles(exprs, { _: _defineProperty({}, '***' + rule.selector, rule.style) });

      case 'style':
        return deepMergeStyles(exprs, { _: { _: rule.style } });

      case 'media':
        return deepMergeStyles(exprs, _defineProperty({}, rule.expr, extractStyles(rule.rules)._));

      default:
        return deepMergeStyles(exprs, { _: { _: rule } });
    }
  });
  return exprs;
}

// extract label from a rule / style
function extractLabel(rule) {
  if (isLikeRule(rule)) {
    rule = registered[idFor(rule)];
  }
  return rule.label || '{:}';
}

// given an id / 'path', generate a css selector
function selector(id, path) {
  if (path === '_') return '.css-' + id + ',[data-css-' + id + ']';

  if (path.indexOf('%%%') === 0) {
    var x = '.css-' + id + path.slice(3) + ',[data-css-' + id + ']' + path.slice(3);
    if (canSimulate) x += ',.css-' + id + '[data-simulate-' + simple(path) + '],[data-css-' + id + '][data-simulate-' + simple(path) + ']';
    return x;
  }

  if (path.indexOf('***') === 0) {
    return path.slice(3).split(',').map(function (x) {
      return x + ' .css-' + id + ',' + x + ' [data-css-' + id + ']';
    }).join(',');
  }
  if (path.indexOf('^^^') === 0) {
    return path.slice(3).split(',').map(function (x) {
      return x.indexOf('&') >= 0 ? [x.replace(/\&/mg, '.css-' + id), x.replace(/\&/mg, '[data-css-' + id + ']')].join(',') // todo - make sure each sub selector has an &
      : '.css-' + id + x + ',[data-css-' + id + ']' + x;
    }).join(',');
  }
}

function toCSS(_ref4) {
  var selector = _ref4.selector,
      style = _ref4.style;

  var result = plugins.transform({ selector: selector, style: style });
  return result.selector + '{' + createMarkupForStyles(result.style) + '}';
}

function ruleToAst(rule) {
  var styles = extractStyles(rule);
  return Object.keys(styles).reduce(function (o, expr) {
    o[expr] = Object.keys(styles[expr]).map(function (s) {
      return { selector: selector(rule.id, s), style: styles[expr][s] };
    });
    return o;
  }, {});
}

function ruleToCSS(spec) {
  var css = [];
  var ast = ruleToAst(spec);
  // plugins here

  var _ = ast._,
      exprs = _objectWithoutProperties(ast, ['_']);

  if (_) {
    _.map(toCSS).forEach(function (str) {
      return css.push(str);
    });
  }
  Object.keys(exprs).forEach(function (expr) {
    css.push('@media ' + expr + '{' + exprs[expr].map(toCSS).join('') + '}');
  });
  return css;
}

// this cache to track which rules have
// been inserted into the stylesheet
var inserted = styleSheet.inserted = {};

// and helpers to insert rules into said styleSheet
function insert(spec) {
  if (!inserted[spec.id]) {
    inserted[spec.id] = true;
    ruleToCSS(spec).map(function (cssRule) {
      return styleSheet.insert(cssRule);
    });
  }
}

export function insertRule(css) {
  var spec = {
    id: hashify(css),
    css: css,
    type: 'raw',
    label: '^'
  };
  register(spec);
  if (!inserted[spec.id]) {
    styleSheet.insert(spec.css);
    inserted[spec.id] = true;
  }
}

export function insertGlobal(selector, style) {
  return insertRule(selector + '{' + createMarkupForStyles(style) + '}');
}

function insertKeyframe(spec) {
  if (!inserted[spec.id]) {
    (function () {
      var inner = Object.keys(spec.keyframes).map(function (kf) {
        var result = plugins.keyframes.transform({ id: spec.id, name: kf, style: spec.keyframes[kf] });
        return result.name + '{' + createMarkupForStyles(result.style) + '}';
      }).join('');

      ['-webkit-', '-moz-', '-o-', ''].forEach(function (prefix) {
        return styleSheet.insert('@' + prefix + 'keyframes ' + (spec.name + '_' + spec.id) + '{' + inner + '}');
      });

      inserted[spec.id] = true;
    })();
  }
}

function insertFontFace(spec) {
  if (!inserted[spec.id]) {
    styleSheet.insert('@font-face{' + createMarkupForStyles(spec.font) + '}');
    inserted[spec.id] = true;
  }
}

// rehydrate the insertion cache with ids sent from
// renderStatic / renderStaticOptimized
export function rehydrate(ids) {
  // load up ids
  Object.assign(inserted, ids.reduce(function (o, i) {
    return o[i] = true, o;
  }, {}));
  // assume css loaded separately
}

// todo - perf
var ruleCache = {};
function toRule(spec) {
  register(spec);
  insert(spec);
  if (ruleCache[spec.id]) {
    return ruleCache[spec.id];
  }

  var ret = _defineProperty({}, 'data-css-' + spec.id, hasLabels ? spec.label || '' : '');
  Object.defineProperty(ret, 'toString', {
    enumerable: false, value: function value() {
      return 'css-' + spec.id;
    }
  });
  ruleCache[spec.id] = ret;
  return ret;
}

// clears out the cache and empties the stylesheet
// best for tests, though there might be some value for SSR.

export function flush() {
  inserted = styleSheet.inserted = {};
  registered = styleSheet.registered = {};
  ruleCache = {};
  styleSheet.flush();
  styleSheet.inject();
}

function find(arr, fn) {
  for (var i = 0; i < arr.length; i++) {
    if (fn(arr[i]) === true) {
      return true;
    }
  }
  return false;
}

export function style(obj) {
  obj = clean(obj);

  return obj ? toRule({
    id: hashify(obj),
    type: 'style',
    style: obj,
    label: obj.label || '*'
  }) : {};
}

// unique feature
// when you need to define 'real' css (whatever that may be)
// https://twitter.com/threepointone/status/756585907877273600
// https://twitter.com/threepointone/status/756986938033254400
export function select(selector, obj) {
  if ((typeof selector === 'undefined' ? 'undefined' : _typeof(selector)) === 'object') {
    return style(selector);
  }
  obj = clean(obj);

  return obj ? toRule({
    id: hashify(selector, obj),
    type: 'select',
    selector: selector,
    style: obj,
    label: obj.label || '*'
  }) : {};
}

export var $ = select; // bringin' jquery back

export function parent(selector, obj) {
  obj = clean(obj);
  return obj ? toRule({
    id: hashify(selector, obj),
    type: 'parent',
    selector: selector,
    style: obj,
    label: obj.label || '*'
  }) : {};
}

// we define a function to 'merge' styles together.
// backstory - because of a browser quirk, multiple styles are applied in the order they're
// defined in the stylesheet, not in the order of application
// in most cases, this won't case an issue UNTIL IT DOES
// instead, use merge() to merge styles,
// with latter styles gaining precedence over former ones

export function merge() {
  for (var _len4 = arguments.length, rules = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    rules[_key4] = arguments[_key4];
  }

  rules = clean(rules);
  return rules ? toRule({
    id: hashify(extractStyles(rules)),
    type: 'merge',
    rules: rules,
    label: '[' + (typeof rules[0] === 'string' ? rules[0] : rules.map(extractLabel).join(' + ')) + ']'
  }) : {};
}

export var compose = merge;

export function media(expr) {
  for (var _len5 = arguments.length, rules = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
    rules[_key5 - 1] = arguments[_key5];
  }

  rules = clean(rules);
  return rules ? toRule({
    id: hashify(expr, extractStyles(rules)),
    type: 'media',
    rules: rules,
    expr: expr,
    label: '*mq(' + rules.map(extractLabel).join(' + ') + ')'
  }) : {};
}

export var presets = {
  mobile: '(min-width: 400px)',
  phablet: '(min-width: 550px)',
  tablet: '(min-width: 750px)',
  desktop: '(min-width: 1000px)',
  hd: '(min-width: 1200px)'
};

/**** live media query labels ****/

// simplest implementation -
// cycle through the cache, and for every media query
// find matching elements and update the label
function updateMediaQueryLabels() {
  Object.keys(registered).forEach(function (id) {
    var expr = registered[id].expr;

    if (expr && hasLabels && window.matchMedia) {
      (function () {
        var els = document.querySelectorAll('[data-css-' + id + ']');
        var match = window.matchMedia(expr).matches ? '✓' : '✕';
        var regex = /^(✓|✕|\*)mq/;
        [].concat(_toConsumableArray(els)).forEach(function (el) {
          return el.setAttribute('data-css-' + id, el.getAttribute('data-css-' + id).replace(regex, match + 'mq'));
        });
      })();
    }
  });
}

// saves a reference to the loop we trigger
var interval = void 0;

export function trackMediaQueryLabels() {
  var bool = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  var period = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2000;

  if (bool) {
    if (interval) {
      console.warn('already tracking labels, call trackMediaQueryLabels(false) to stop'); // eslint-disable-line no-console
      return;
    }
    interval = setInterval(function () {
      return updateMediaQueryLabels();
    }, period);
  } else {
    clearInterval(interval);
    interval = null;
  }
}

// in dev mode, start this up immediately
if (isDev && isBrowser) {
  trackMediaQueryLabels(true);
  // todo - make sure hot loading isn't broken
  // todo - clearInterval on browser close
}

export function pseudo(selector, obj) {
  obj = clean(obj);
  return obj ? toRule({
    id: hashify(selector, obj),
    type: 'pseudo',
    selector: selector,
    style: obj,
    label: obj.label || ':*'
  }) : {};
}

// allllll the pseudoclasses

export function active(x) {
  return pseudo(':active', x);
}

export function any(x) {
  return pseudo(':any', x);
}

export function checked(x) {
  return pseudo(':checked', x);
}

export function disabled(x) {
  return pseudo(':disabled', x);
}

export function empty(x) {
  return pseudo(':empty', x);
}

export function enabled(x) {
  return pseudo(':enabled', x);
}

export function _default(x) {
  return pseudo(':default', x); // note '_default' name
}

export function first(x) {
  return pseudo(':first', x);
}

export function firstChild(x) {
  return pseudo(':first-child', x);
}

export function firstOfType(x) {
  return pseudo(':first-of-type', x);
}

export function fullscreen(x) {
  return pseudo(':fullscreen', x);
}

export function focus(x) {
  return pseudo(':focus', x);
}

export function hover(x) {
  return pseudo(':hover', x);
}

export function indeterminate(x) {
  return pseudo(':indeterminate', x);
}

export function inRange(x) {
  return pseudo(':in-range', x);
}

export function invalid(x) {
  return pseudo(':invalid', x);
}

export function lastChild(x) {
  return pseudo(':last-child', x);
}

export function lastOfType(x) {
  return pseudo(':last-of-type', x);
}

export function left(x) {
  return pseudo(':left', x);
}

export function link(x) {
  return pseudo(':link', x);
}

export function onlyChild(x) {
  return pseudo(':only-child', x);
}

export function onlyOfType(x) {
  return pseudo(':only-of-type', x);
}

export function optional(x) {
  return pseudo(':optional', x);
}

export function outOfRange(x) {
  return pseudo(':out-of-range', x);
}

export function readOnly(x) {
  return pseudo(':read-only', x);
}

export function readWrite(x) {
  return pseudo(':read-write', x);
}

export function required(x) {
  return pseudo(':required', x);
}

export function right(x) {
  return pseudo(':right', x);
}

export function root(x) {
  return pseudo(':root', x);
}

export function scope(x) {
  return pseudo(':scope', x);
}

export function target(x) {
  return pseudo(':target', x);
}

export function valid(x) {
  return pseudo(':valid', x);
}

export function visited(x) {
  return pseudo(':visited', x);
}

// parameterized pseudoclasses
export function dir(p, x) {
  return pseudo(':dir(' + p + ')', x);
}
export function lang(p, x) {
  return pseudo(':lang(' + p + ')', x);
}
export function not(p, x) {
  // should this be a plugin?
  var selector = p.split(',').map(function (x) {
    return x.trim();
  }).map(function (x) {
    return ':not(' + x + ')';
  });
  if (selector.length === 1) {
    return pseudo(':not(' + p + ')', x);
  }
  return select(selector.join(''), x);
}
export function nthChild(p, x) {
  return pseudo(':nth-child(' + p + ')', x);
}
export function nthLastChild(p, x) {
  return pseudo(':nth-last-child(' + p + ')', x);
}
export function nthLastOfType(p, x) {
  return pseudo(':nth-last-of-type(' + p + ')', x);
}
export function nthOfType(p, x) {
  return pseudo(':nth-of-type(' + p + ')', x);
}

// pseudoelements
export function after(x) {
  return pseudo('::after', x);
}
export function before(x) {
  return pseudo('::before', x);
}
export function firstLetter(x) {
  return pseudo('::first-letter', x);
}
export function firstLine(x) {
  return pseudo('::first-line', x);
}
export function selection(x) {
  return pseudo('::selection', x);
}
export function backdrop(x) {
  return pseudo('::backdrop', x);
}
export function placeholder(x) {
  // https://github.com/threepointone/glamor/issues/14
  return merge(pseudo('::placeholder', x), pseudo('::-webkit-input-placeholder', x), pseudo('::-moz-placeholder', x), pseudo('::-ms-input-placeholder', x));
}

// we can add keyframes in a similar manner, but still generating a unique name
// for including in styles. this gives us modularity, but still a natural api
export function keyframes(name, kfs) {
  if (!kfs) {
    kfs = name, name = 'animation';
  }

  // do not ignore empty keyframe definitions for now.
  kfs = clean(kfs) || {};
  var spec = {
    id: hashify(name, kfs),
    type: 'keyframes',
    name: name,
    keyframes: kfs
  };
  register(spec);
  insertKeyframe(spec);
  return name + '_' + spec.id;
}

// we don't go all out for fonts as much, giving a simple font loading strategy
// use a fancier lib if you need moar power
export function fontFace(font) {
  font = clean(font);
  var spec = {
    id: hashify(font),
    type: 'font-face',
    font: font
  };
  register(spec);
  insertFontFace(spec);

  return font.fontFamily;
}

/*** helpers for web components ***/
// https://github.com/threepointone/glamor/issues/16

export function cssFor() {
  for (var _len6 = arguments.length, rules = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
    rules[_key6] = arguments[_key6];
  }

  rules = clean(rules);
  return rules ? flatten(rules.map(function (r) {
    return registered[idFor(r)];
  }).map(ruleToCSS)).join('') : '';
}

export function attribsFor() {
  for (var _len7 = arguments.length, rules = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
    rules[_key7] = arguments[_key7];
  }

  rules = clean(rules);
  var htmlAttributes = rules ? rules.map(function (rule) {
    idFor(rule); // throwaway check for rule
    var key = Object.keys(rule)[0],
        value = rule[key];
    return key + '="' + (value || '') + '"';
  }).join(' ') : '';

  return htmlAttributes;
}

export function css() {
  for (var _len8 = arguments.length, rules = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
    rules[_key8] = arguments[_key8];
  }

  if (rules[0] && rules[0].length && rules[0].raw) {
    throw new Error('you forgot to include glamor/babel in your babel plugins.');
  }
  return merge(rules);
  // helper for transpiled inline literals 
  // and eventually central api (#83)  
}
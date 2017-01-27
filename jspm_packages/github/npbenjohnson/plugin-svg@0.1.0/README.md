# plugin-svg

SVG loader for SystemJS's. Based on [plugin-text](https://github.com/systemjs/plugin-text). Works using the module loader's transform hook so that SVGs can be embedded using [SystemJS builder](https://github.com/systemjs/builder).

Install
---
```
npm install npbenjohnson/plugin-svg
```
or
```
jspm install svg=github:npbenjohnson/plugin-svg
```
Map
---
config.js (if jspm didn't already do this for you)
```javascript
System.config({
  map: {
    svg: 'path/to/plugin-svg.js'
  }
});
```
Usage
---
```javascript
var target = document.getElementById('target-div');
System.import('./test.svg!').then(function(svg) {
  target.appendChild(svg);
});
```

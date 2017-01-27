## v0.1.0

Initial version

## v0.2.0

* Fixed `convertToString` option
* Added `convertMultipleRawToStrings` option to assist in comparing to rendered react components
  For multiple children, all raw content (e.g. strings, numbers) are converted to strings, but a single
  child (e.g. a single number), is left as the original type
  
## v0.3.0
* Add support for `expect.it()` assertions in the content

## v0.4.0
* Add support for iterators - thanks to @jkimbo for the failing test in unexpected-react, and @Lugribossk for reporting

## v0.4.1
* Republish with added changelog and credits

## v0.5.0
* Add classAttributeName, for compatibility with unexpected-htmllike v0.4.0

## v0.5.1
* Fix nested children (thanks @sunesimonsen)
  e.g. For the component

  ```js
  var list = [ <span>one</span>, <span>two</span> ];

  var component = (
    <Test>
      Hi
      {list}
    </Test>
  );

  ```

  The contents of the `Test` component are nested arrays (`[ 'Hi', [ <span>one</span>, <span>two</span> ] ]`).
  These are now supported

## v1.0.0

Update React support to v0.14 and v15, drop support for React 0.13.x (thanks Christian Hoffmeister @choffmeister)



### v0.1.0

Initial version

### v0.2.0
* Fixed issue diffing content with changed type and value
* Improved diffing children that have changed - we now try forcing children never to be similar, and also 
letting children that are the same element be similar, and then we take the result with the best weight.
* Tests improved using preferredWidth for magicpen - they should now run everywhere!

### v0.3.0
* Asynchronous diffing,
* support for expect.it(...), including asynchronous assertions

### v0.3.1
* Minor improvements to display of elements with children with attributes that need more than one line

### v0.3.2
*  Fix bug with children being non-exact whilst ignoring the bits that aren't exact. e.g. you ignore extra attributes,
and have an extra attribute on a child, a `contains` check would not find the element.

### v0.4.0
* Class diffing.  The class (or className in the case of React) attribute can be diffed using class semantics, i.e. 
order is unimportant, and optionally extra and/or missing classes can be ignored.

### v0.4.1
* Fix for undefined attributes in actual being treated as "extra" attributes

### v0.5.0
* Improved output for moved elements in children - provides a hint as to the current index
* Fix for moved elements when actual and expected adapters are different (bruderstein/unexpected-react#9) 
(thanks to @yormi for an excellent bug report!)

### v1.0.0
* Split sync and async - everything is tried synchronously initially (which is much faster), then if an asynchronous 
assertion is detected, revert to the async algorithm.  This results is a big performance boost for the majority of 
cases where the comparisons can all be done synchronously.  The return values of the functions are now possibly-promises.
i.e. Caller need to check if they are a promise (existence of `result.then` is fine), and treat it as a promise.

### v1.1.0
* Remove function body for long functions (more than one line or > 30 chars) (#2)
* Do not output attributes that have an undefined value (#1)

### v2.0.0
* Breaking changes to API
  * diff, contains now take less parameters (see README.md)
* Split between diffing / contains checking and rendering.  New `render()` method
* Helper `withResult()` method to aid handling the possible-promises that are returned from the diffing and contains APIs
* Attributes now diffed with 'to satisfy'


### v2.0.1
* Fix spy functions (and other functions with a custom .toString() method)

### v2.0.2
* Fix outputting inspected attributes (e.g objects). Could previously result in incorrect indenting.

### v2.1.0
* Add `findTargetAttrib` to the options to allow locating a nested element (see the [readme](https://github.com/bruderstein/unexpected-htmllike#findtargetattrib-string)!)

### v2.1.1
* Change text content diff to be an annotated block (a block with `//` before each line), to make the diff more readable

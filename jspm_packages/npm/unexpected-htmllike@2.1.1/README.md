[![Build Status](https://travis-ci.org/bruderstein/unexpected-htmllike.svg?branch=master)](https://travis-ci.org/bruderstein/unexpected-htmllike)
[![Coverage Status](https://coveralls.io/repos/github/bruderstein/unexpected-htmllike/badge.svg?branch=master)](https://coveralls.io/github/bruderstein/unexpected-htmllike?branch=master)
[![npm version](https://badge.fury.io/js/unexpected-htmllike.svg)](https://badge.fury.io/js/unexpected-htmllike)

# unexpected-htmllike

![tattoo](https://cloud.githubusercontent.com/assets/91716/11163196/8215efc2-8ac6-11e5-86da-7285585ab3ef.jpg)
(Image from http://www.idyllramblings.com/2010/03/the-geekiest-tattoos-you-ever-did-see.html)

Beautifully painted [magicpen](https://github.com/sunesimonsen/magicpen) generation and output of diffs and inspections for HTML-like structures.

![fulldemo](https://cloud.githubusercontent.com/assets/91716/10930973/a9ed17ba-82c3-11e5-8afc-393f8bca147d.png)

IMPORTANT: This is not a plugin for [unexpected](http://unexpected.js.org). This is a helper library for
plugins for unexpected, that perform assertions and/or inspections on HTML-like structures, such as the DOM,
React Elements (including JSX), and React shallow renderer.

# Status

This project is now used for production tests in a number of projects.  If you find something that doesn't diff properly,
please report it in the github issues: https://github.com/bruderstein/unexpected-htmllike/issues

 
# Features


`inspect`, `diff` and `contains` methods are provided, allowing diffing of any HTML/XML like structure, including wrapper detection.
e.g.
Assuming a "actual" representation of the following

```xml
<div id="outer">
   <div id="the-wrapper">
      <span>Some text</span>
   </div>
</div>
```
If the expected is

```xml
<div id="outer">
   <span>Some text</span>
</div>
```
This (optionally) matches. This also works even if the content inside the wrapper doesn't match exactly. If that is the case,
the wrapping element is output greyed out, with the changes highlighted (use `diffWrappers: false` in the options). 

![wrapper_grey](https://cloud.githubusercontent.com/assets/91716/10930860/adbddf6a-82c2-11e5-96af-1b827a9d02ea.png)

You can also diff wrappers, and they will be highlighted as wrappers that should be removed (use `diffWrappers: true`, the default, in the options).

![wrapper_error](https://cloud.githubusercontent.com/assets/91716/10930873/c288a7cc-82c2-11e5-8c53-e7231dd22fb9.png)

The items that "count" towards a match can be controlled with `options`.

# Usage

Create an instance of `UnexpectedHtmlLike`, passing an adapter as the only parameter.

Use [`unexpected-htmllike-reactrendered-adapter`](https://github.com/bruderstein/unexpected-htmllike-reactrendered-adapter) for 
DOM rendered React components, and [`unexpected-htmllike-jsx-adapter`](https://github.com/bruderstein/unexpected-htmllike-jsx-adapter)
for JSX (ReactElement) adapter - useful for shallow rendering and asserting on JSX structures.

# Example

```js
expect.addAssertion('<ReactElement> to have rendered <ReactElement>', function (expect, subject, expected) {

    const adapter = new ReactElementAdapter();
    const jsxHtmlLike = new UnexpectedHtmlLike(adapter);

    const diffResult = jsxHtmlLike.diff(adapter, subject, expected, expect, options);

    return jsxHtmlLike.withResult(diffResult, result => {

        if (result.weight !== 0) {
            return expect.fail({
                diff: function (output, diff, inspect) {
                    return {
                        diff: jsxHtmlLike.render(result, output, diff, inspect)
                    };
                }
            });
        }
    });
});
```

# Adapter API

If you want to use one of the exising adapters, you can skip this section - this is only if you want to implement your own adapter.

You need to create an object, with the following methods:
## `getName(element)`
Returns the name of the element as a string.  E.g. for the element `<input type="text" />`, `getName` would return `input`.

## `getChildren(element)`
Returns either an array of elements (or content). The elements should be either further elements that the methods of this object can call,
or native content.  For instance, `<span>the content</span>`, would return `[ 'the content' ]`.  If the element has no children, an empty array
should be returned.

## `getAttributes(element)`
Returns an object with each attribute as a key/value pair. Note that when outputting, `unexpected-htmllike` outputs string attributes in double quotes,
and other content types in curly braces (`{ }`). This matches the React/JSX style of attribute definition.  If you want to force quoted attributes (such
as XML or HTML output), simply ensure the attribute values are strings.

## `classAttributeName`  (since 0.4.0)
Property that holds the string name of the class attribute.  This normally `class`, but could be `className` in the case
of ReactElement (i.e. JSX)  When diffing, if the `classAttributeName` is the same for both actual and expected adapters,
then the classes can be optionally diffed using class semantics.

# API

## constructor (adapter)

Pass the adapter object (ie. an object with `getName`, `getAttributes`, and `getChildren` methods)
e.g.

```js
var JsxAdapter = require('unexpected-htmllike-jsx-adapter');
var UnexpectedHtmlLike = require('unexpected-htmllike');

var jsxDiff = new UnexpectedHtmlLike(new JsxAdapter());
```

## inspect(actual, depth, output, inspect)
Returns a formatted output of the element (`actual`) using [magicpen](https://github.com/sunesimonsen/magicpen)
Parameters are the same as for the unexpected `inspect` method

## diff(expectedAdapter, actual, expected, expect, options)
Diffs actual against expected, returning either a promise or the diff result. Note that a second adapter
is passed for the `expected`, such that it is possible to diff two otherwise incompatible representations. If you want
to diff the same type as the "actual" (e.g. comparing JSX with JSX), simply pass the same adapter as the `expectedAdapter`.

`options` can be null, or an object with the following flags (all are optional, and all boolean flags default to true).
### diffMissingChildren  (boolean)
When true (the default), if a child element is missing in the actual, this is counted as a mismatch, and highlighted in the output

### diffExtraChildren  (boolean)
When true (the default), if a child element appears in the actual, but not in the expected, this is counted as a mismatch,
and highlighted in the output.

### diffMissingAttributes  (boolean)
When true (the default), if an attribute appears in the expected, but not in the actual, this is counted as a mismatch, and
is highlighted in the output.

### diffExtraAttributes  (boolean)
When true (the default), if an attribute appears in the actual, but not in the expected, this is counted as a mismatch, and
is highlighted in the output.  It is anticipated that most usages will set this to false, to allow for a `'to satisfy'` style
of assertion, but the default is true to ensure that the default is always an exact match.

### diffWrappers  (boolean)
When true (the default), if an element is found in the actual to be wrapping what is expected, it is highlighted as a wrapper
that should be removed.  When false, if the content does not match exactly (ie. diff returns a weight of non-zero - see return value),
then the wrapper is outputted in grey (the `prismPunctuation` style), and is always separated onto a separate line.

### diffExactClasses (boolean)
When true (the deafult), the `class` (or `className`, depending on the adapter) attribute will be diffed as all other
string attributes - i.e. a single space difference will be considered different. When false, then HTML `class` semantics
are used, such that order is irrelevant, multiple spaces are ignored, and the following two flags can be used to ignore
either missing or extra classes.
Note that the class attribute for the actual and expected adapters must be the same in order to use these flags.
This means that they will not have any effect if comparing (for example) the DOM (using `class` attribute) with React 
JSX (using `className` attribute). This may change in a future release.

### diffExtraClasses (boolean)
When true, and `diffExactClasses` is false, then any extra classes in the actual are treated as a diff. When false, extra
classes are ignored.  This is the most likely flag to be false when diffing, as it is likely you wish to ignore extra classes 
on the actual over what was expected.  
e.g. actual:  `<div class="big special hero">`
     expected: `<div class="hero big">`
This will match when `diffExtraClasses` is false, as the class `special` is ignored. When true, these two items would
not be treated as being the same. Note that the order is irrelevant.
Note that the class attribute for the actual and expected adapters must be the same in order to use these flags.
This means that they will not have any effect if comparing (for example) the DOM (using `class` attribute) with React 
JSX (using `className` attribute). This may change in a future release.

### diffMissingClasses (boolean)
When true (the default), and `diffExactClasses` is false, then any missing classes in the actual are treated as a diff.
When false, missing classes from the actual (based on the expected classes) are ignored.
Note that the class attribute for the actual and expected adapters must be the same in order to use these flags.
This means that they will not have any effect if comparing (for example) the DOM (using `class` attribute) with React 
JSX (using `className` attribute). This may change in a future release.

### findTargetAttrib (string)
This allows finding an actual child identified by an attribute on the expected. 

For instance, when `findTargetAttrib` is set to `'eventTarget'`, and presented with the following "actual" value (in some XML/HTML representation with an appropriate adapter)

```xml
<SomeComponent>
   <div className="wrapper">
      <ChildComponent id="1">foo</ChildComponent>
      <ChildComponent id="2">bar</ChildComponent>
      <ChildComponent id="3">baz</ChildComponent>
   </div>
</SomeComponent>   
```

The expected value is then (expressed in JSX syntax, the value of the attribute must be  ` === true`):

```xml
<SomeComponent>
   <div className="wrapper">
      <ChildComponent id="2" eventTarget={true} />
   </div>
</SomeComponent>
```

In this case, (assuming `diffExtraElements` is false in the options) the resulting diff will contain a `target` property, which is the `<ChildComponent id="2">bar</ChildComponent>` element from the actual value (in whatever form that object takes).


When set, the result of the diff contains a `target` property, which is the matching "actual" element that matched the "expected" element with the given attribute as true.

It is anticipated to use this to identify a child component on which to trigger an event, or a child component to identify.

e.g. (using unexpected-react as an example)

```js
// With `eventTarget` set as `findTargetAttrib`
expect(todoList, 'with event click', 'on', <TodoItem id={2}><button className="completed" eventTarget /></TodoItem>,
       'to contain', <TodoItem id={2}><span>Completed!</span></TodoItem>);
       
// With `queryTarget` set as `findTargetAttrib`
expect(todoList, 'queried for', <TodoItem id={2}><span className="label" queryTarget /></TodoItem>,
       'to have rendered', <span>Label of item 2</span>);
```

* For `diff()`, the target is a direct property of the result. 
* For `contains()`, the target is under the `bestMatch` property. i.e. 
```js
var containsResult = htmlLikeInstance.contains(adapter, actual, expected, expect, options);

if (containsResult.found) {
    const foundTarget = containsResult.bestMatch.target;
    // ...
}
```


### weights  (object)
This must be an object that represents the different weights for the various differences that can occur.
The weights that can be provided, and the defaults are shown here
```js
{
    NATIVE_NONNATIVE_MISMATCH: 15,
    NAME_MISMATCH: 10,
    ATTRIBUTE_MISMATCH: 1,
    ATTRIBUTE_MISSING: 1,
    ATTRIBUTE_EXTRA: 1,
    STRING_CONTENT_MISMATCH: 3,
    CONTENT_TYPE_MISMATCH: 1,
    CHILD_MISSING: 2,
    CHILD_INSERTED: 2,
    WRAPPER_REMOVED: 3,
    ALL_CHILDREN_MISSING: 8
};
```

The weights are used to detect wrapper elements by identifying that when the wrapping element is removed,
the weight of the diff is less than the diff when it remains there.  
This can be easily demonstrated:

```xml
<div className="wrapper-example">
  <span id="content">here is some text</span>
</div>
```

If we diff against the following

```xml
<span id="different-content">here is some different text</span>
```
This (without wrapper detection), would result in the following points being found:
* `span` should be a `div`  (NAME_MISMATCH == 10)
* `id="different-content"` attribute missing  (ATTRIBUTE_MISSING == 1)
* `className="wrapper-example"` extra attribute  (ATTRIBUTE_EXTRA == 1)
* `<span id="content">here is some text</span>` should be the simple content text `here is some text` (NATIVE_NONNATIVE_MISMATCH == 15)
... which is a total weight of 10 + 1 + 1 + 15 = 27

Removing the wrapper, results in
* `id="content"` should be `id="different-content"` (`ATTRIBUTE_MISSMATCH == 1`)
* `here is some text` should be `here is some different text`  (`STRING_CONTENT_MISMATCH == 3`)
... which is a total weight of 1 + 3 = 4

If `diffWrappers == true`, then `WRAPPER_REMOVED` (== 3) is added to this.

### Return value
`diff` may return a promise, which resolves with an object with the following 2 properties, or it may return the object directly.
Check for the existence of `then`, if it exists, treat it as a promise.

The returned object, or the resolved value contains the following properties:

* `weight` - the resulting weight from the diff. If this is `0`, the actual and expected match according to the `options` provided.
* `diff` - the internal diff representation. Pass to the `render()` method to actually render the output.

Note that the promise is always resolved (unless of a bug or a real issue in a assertion), whether a difference is recorded or not.**
To check that the `actual` and `expected` are equivalent (given the options provided), check that the `weight` is zero.

## contains (expectedAdapter, actual, expected, expect, options)

Checks if the `expected` is contained somewhere within the `actual`. The arguments are the same as the `diff` function,
including the options for flags and weights (`options` can also be null, to accept the defaults). See the description of `diff`
for information on the parameters.

### Return value
`contains` returns either a promise that resolves to an object, or the object directly, with the following properties
* `found` - (boolean) - true if a match was found
* `bestMatch` - (object) - if `found` is false, `bestMatch` contains the best located match, and is the same result as the `diff` function.
That is to say that `bestMatch` has the following properties:
** `weight` - (number) the weight of the diff - larger numbers indicate a bigger difference (see the description of `diff` above)
** `diff` - the internal diff representation that you can pass to `render()` to output the actual output
* `bestMatchItem` - this is the element in whatever form the `actual` value takes that matched the best. This could be useful to identify the actual
node that matched the best, and is provided only for convenience.

**Note that the promise is always resolved (unless of a bug or a real issue in a assertion), whether the content is `found` or not.**

## withResult(value, callback)

Neatly handle the difference between a promise and a value return value.
e.g. 
```js
var diffResult = htmlLike.diff(expectedAdapter, actual, expected, expect, {});
htmlLike.withResult(diffResult, function (result) {

    // Here `result` is the actual result, whether or not the return value of the `diff`
    // function was a promise
    
    htmlLike.render(result, output, diff, inspect);
});
```

## render(diffResult, output, diff, inspect)

Outputs the given internal diff structure to the given output magicpen instance. 
`diff` and `inspect` should be the functions passed in to the `diff` function, but in most cases can
be the `expect.diff` and `expect.inspect` variants (keep in mind this won't always work, and is not recommended)

### Return value

For convenience, it returns the `output` parameter. 

# Contributing

Absolutely! Do it! Raise a pull request, an issue, make a comment.  If you do make an addition or change, please make sure there are
tests to go with the changes. Each module has a `.spec.js` file to go with it. Tests for `diff` usually have a direct test, and an integration
level test in `HtmlLike.spec.js`, that tests that the correct output is given when the output of `diff` is passed to the `painter`. `painter.js` is
responsible for outputting the diff or element description to a magicpen instance. This separates the diffing and output generation, which is helpful
for wrapper detection, as some elements may need to be diffed several times to check for wrappers. Leaving the output generation to the end means this
process is a little more efficient.

# Roadmap / Future plans

We may need to extend the interface of the adapters to allow for "special" elements (such as `<style>` and `<script>` elements in the DOM), or to allow
for special child identification rules (for instance, using React's `key` attribute to identify the same child).

Weights may need to be adjusted when the project has seem some real world use. The current values are the result of a bit of playing with some examples,
and large helping of "gut feel".  Time will tell.

We may decide to add a weighting of what matches. Currently weights are only added according to how much doesn't match, but no weight (pun intended) is
placed on how much does match. It is plausible to think there are examples where something has "more things mismatching" than another element, but it also
has much more matching, and that should cancel each other out.  If you find a practical example where this would help, please raise an issue with it.


# Thanks

This project owes a huge amount to the `unexpected-dom` project from [@Munter](https://github.com/munter) - much of the code has been adapted from
that project.  

The whole project would not be possible without the amazing work of Sune [@sunesimonsen](https://github.com/sunesimonsen) and Andreas [@papandreou](https://github.com/papandreou),
and others in the [unexpected gitter chat room](https://gitter.im/unexpectedjs/unexpected).

Their assistance, answering my questions, discussing ideas and giving encouragement is truly appreciated. Thank you.

# License

MIT

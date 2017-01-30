
Painter accepts a `description` format, describing the element and content, along with the differences.
This format is described below, in the rough format of a grammar - any improvements to this are very welcome!

```

Description :=  Element | Content | WrapperElement;

Content := {
    type: CONTENT,
    value: 'value-of-the-content'          // This the the (usually string) contents -> e.g. 'foo' in <span>foo</span>.
    diff: ContentDiff
};

CONTENT := 'CONTENT';

ContentDiff := ChangedContentDiff | MissingContentDiff | ExtraContentDiff;

ChangedContentDiff := {
    type: CHANGED,
    expectedValue: 'expected-value-of-the-content'
}

MissingContentDiff := {
    type: MISSING,
}

ExtraContentDiff := {
    type: EXTRA,
}

CHANGED := 'changed';
MISSING := 'missing';
EXTRA := 'extra';

Element := {
   type: ELEMENT,
   attributes: Attributes,
   children: 0..n [ Element | Content | WrapperElement ],
   diff: undefined | ElementDiff
}

Attributes := 0..n [ Attribute ]

Attribute := {
    name: 'name-of-the-attribute',
    value: 'value-of-the-attribute'    // Here the value can be any valid type (e.g. in the case of React, this could be an object)
    diff: undefined | AttributeDiff
}

AttributeDiff := MissingAttributeDiff | ExtraAttributeDiff | ChangedAttributeDiff | ClassAttributeDiff;

MissingAttributeDiff := {
    type: 'missing'
}

ExtraAttributeDiff := {
    type: 'extra'
}

ChangedAttributeDiff := {
    type: 'changed'
    expectedValue: 'expected-value-of-the-attribute'   // Also here can be any type
}

ClassAttributeDiff := {
    type: 'class'
    missing: 'missing classes separated by spaces'
    extra: 'extra classes separated by spaces'
}

ElementDiff := MissingElementDiff | ExtraElementDiff | DifferentElementDiff 
               | WrapperElementDiff | ContentElementMismatchDiff | ElementContentMismatchDiff;

MissingElementDiff := {
    type: 'missing'
}

ExtraElementDiff := {
    type: 'extra'
}

DifferentElementDiff := {
    type: 'differentElement'
    expectedName: 'expected-name-of-the-element'
}

WrapperElementDiff := {
    type: 'wrapper'
}

ContentElementMismatchDiff := {      // This `actual` Content should be an Element
    type: 'contentElementMismatch',
    expected: Element | Wrapper 
}

ElementContentMismatchDiff := {      // This `actual` Element should be a Content entry
    type: 'elementContentMismatch',
    expected: Content 
}

WrapperElement := {
    type: 'WRAPPER',
    name: 'name-of-the-wrapper-element',
    attributes: Attributes,
    children: 0..n [ Element | Content | WrapperElement ]
}



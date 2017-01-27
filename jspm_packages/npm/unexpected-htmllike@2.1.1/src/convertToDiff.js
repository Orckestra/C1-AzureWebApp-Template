import ObjectAssign from 'object-assign';
import isNativeType from './isNativeType';

export default function convertToDiff(adapter, item, options) {
    options = ObjectAssign({}, { includeChildren: true }, options);
    if (isNativeType(item)) {
        return {
            type: 'CONTENT',
            value: item
        };
    }

    const diffEntry = {
        type: 'ELEMENT',
        name: adapter.getName(item),
        attributes: []
    };
    const attributes = adapter.getAttributes(item);
    if (attributes) {
        Object.keys(attributes).forEach(attribName => {
            diffEntry.attributes.push({
                name: attribName,
                value: attributes[attribName]
            });
        });
    }

    if (options.includeChildren) {
        const children = adapter.getChildren(item);
        if (children) {
            diffEntry.children = children.map(child => convertToDiff(adapter, child));
        }
    }

    return diffEntry;
}

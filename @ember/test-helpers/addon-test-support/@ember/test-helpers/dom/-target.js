// eslint-disable-next-line require-jsdoc
export function isElement(target) {
    return target.nodeType === Node.ELEMENT_NODE;
}
// eslint-disable-next-line require-jsdoc
export function isWindow(target) {
    return target instanceof Window;
}
// eslint-disable-next-line require-jsdoc
export function isDocument(target) {
    return target.nodeType === Node.DOCUMENT_NODE;
}
// eslint-disable-next-line require-jsdoc
export function isContentEditable(element) {
    return 'isContentEditable' in element && element.isContentEditable;
}

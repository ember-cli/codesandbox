import isFormControl from './-is-form-control';
import { isDocument, isContentEditable, isWindow } from './-target';
const FOCUSABLE_TAGS = ['A'];
// eslint-disable-next-line require-jsdoc
function isFocusableElement(element) {
    return FOCUSABLE_TAGS.indexOf(element.tagName) > -1;
}
/**
  @private
  @param {Element} element the element to check
  @returns {boolean} `true` when the element is focusable, `false` otherwise
*/
export default function isFocusable(element) {
    if (isWindow(element)) {
        return false;
    }
    if (isDocument(element)) {
        return false;
    }
    if (isFormControl(element)) {
        return !element.disabled;
    }
    if (isContentEditable(element) || isFocusableElement(element)) {
        return true;
    }
    return element.hasAttribute('tabindex');
}

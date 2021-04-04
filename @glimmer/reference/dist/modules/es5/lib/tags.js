import { isObject } from '@glimmer/util';
import { dirty, update, createUpdatableTag, CONSTANT_TAG, isConstTag } from './validators';
var TRACKED_TAGS = new WeakMap();
export function dirtyTag(obj, key) {
    if (isObject(obj)) {
        var tag = tagFor(obj, key);
        if (tag === undefined) {
            updateTag(obj, key, createUpdatableTag());
        } else if (isConstTag(tag)) {
            throw new Error('BUG: Can\'t update a constant tag');
        } else {
            dirty(tag);
        }
    } else {
        throw new Error('BUG: Can\'t update a tag for a primitive');
    }
}
export function tagFor(obj, key) {
    if (isObject(obj)) {
        var tags = TRACKED_TAGS.get(obj);
        if (tags === undefined) {
            tags = new Map();
            TRACKED_TAGS.set(obj, tags);
        } else if (tags.has(key)) {
            return tags.get(key);
        }
        var tag = createUpdatableTag();
        tags.set(key, tag);
        return tag;
    } else {
        return CONSTANT_TAG;
    }
}
export function updateTag(obj, key, newTag) {
    if (isObject(obj)) {
        var tag = tagFor(obj, key);
        if (isConstTag(tag)) {
            throw new Error('BUG: Can\'t update a constant tag');
        } else {
            update(tag, newTag);
        }
        return tag;
    } else {
        throw new Error('BUG: Can\'t update a tag for a primitive');
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3JlZmVyZW5jZS9saWIvdGFncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFBLFFBQUEsUUFBQSxlQUFBO0FBQ0EsU0FBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLGtCQUFBLEVBQUEsWUFBQSxFQUFBLFVBQUEsUUFBQSxjQUFBO0FBV0EsSUFBTSxlQUFlLElBQXJCLE9BQXFCLEVBQXJCO0FBRUEsT0FBTSxTQUFBLFFBQUEsQ0FBQSxHQUFBLEVBQUEsR0FBQSxFQUEwQztBQUM5QyxRQUFJLFNBQUosR0FBSSxDQUFKLEVBQW1CO0FBQ2pCLFlBQUksTUFBTSxPQUFBLEdBQUEsRUFBVixHQUFVLENBQVY7QUFFQSxZQUFJLFFBQUosU0FBQSxFQUF1QjtBQUNyQixzQkFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLG9CQUFBO0FBREYsU0FBQSxNQUVPLElBQUksV0FBSixHQUFJLENBQUosRUFBcUI7QUFDMUIsa0JBQU0sSUFBTixLQUFNLHFDQUFOO0FBREssU0FBQSxNQUVBO0FBQ0wsa0JBQUEsR0FBQTtBQUNEO0FBVEgsS0FBQSxNQVVPO0FBQ0wsY0FBTSxJQUFOLEtBQU0sNENBQU47QUFDRDtBQUNGO0FBSUQsT0FBTSxTQUFBLE1BQUEsQ0FBQSxHQUFBLEVBQUEsR0FBQSxFQUF3QztBQUM1QyxRQUFJLFNBQUosR0FBSSxDQUFKLEVBQW1CO0FBQ2pCLFlBQUksT0FBTyxhQUFBLEdBQUEsQ0FBWCxHQUFXLENBQVg7QUFFQSxZQUFJLFNBQUosU0FBQSxFQUF3QjtBQUN0QixtQkFBTyxJQUFQLEdBQU8sRUFBUDtBQUNBLHlCQUFBLEdBQUEsQ0FBQSxHQUFBLEVBQUEsSUFBQTtBQUZGLFNBQUEsTUFHTyxJQUFJLEtBQUEsR0FBQSxDQUFKLEdBQUksQ0FBSixFQUFtQjtBQUN4QixtQkFBTyxLQUFBLEdBQUEsQ0FBUCxHQUFPLENBQVA7QUFDRDtBQUVELFlBQUksTUFBSixvQkFBQTtBQUNBLGFBQUEsR0FBQSxDQUFBLEdBQUEsRUFBQSxHQUFBO0FBQ0EsZUFBQSxHQUFBO0FBWkYsS0FBQSxNQWFPO0FBQ0wsZUFBQSxZQUFBO0FBQ0Q7QUFDRjtBQUVELE9BQU0sU0FBQSxTQUFBLENBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxNQUFBLEVBQWlFO0FBQ3JFLFFBQUksU0FBSixHQUFJLENBQUosRUFBbUI7QUFDakIsWUFBSSxNQUFNLE9BQUEsR0FBQSxFQUFWLEdBQVUsQ0FBVjtBQUVBLFlBQUksV0FBSixHQUFJLENBQUosRUFBcUI7QUFDbkIsa0JBQU0sSUFBTixLQUFNLHFDQUFOO0FBREYsU0FBQSxNQUVPO0FBQ0wsbUJBQUEsR0FBQSxFQUFBLE1BQUE7QUFDRDtBQUVELGVBQUEsR0FBQTtBQVRGLEtBQUEsTUFVTztBQUNMLGNBQU0sSUFBTixLQUFNLDRDQUFOO0FBQ0Q7QUFDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlzT2JqZWN0IH0gZnJvbSAnQGdsaW1tZXIvdXRpbCc7XG5pbXBvcnQge1xuICBkaXJ0eSxcbiAgdXBkYXRlLFxuICBjcmVhdGVVcGRhdGFibGVUYWcsXG4gIFVwZGF0YWJsZVRhZyxcbiAgQ09OU1RBTlRfVEFHLFxuICBpc0NvbnN0VGFnLFxuICBDb25zdGFudFRhZyxcbn0gZnJvbSAnLi92YWxpZGF0b3JzJztcblxudHlwZSBUYWdzID0gTWFwPFByb3BlcnR5S2V5LCBVcGRhdGFibGVUYWc+O1xuY29uc3QgVFJBQ0tFRF9UQUdTID0gbmV3IFdlYWtNYXA8b2JqZWN0LCBUYWdzPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gZGlydHlUYWc8VD4ob2JqOiBULCBrZXk6IGtleW9mIFQpOiB2b2lkIHtcbiAgaWYgKGlzT2JqZWN0KG9iaikpIHtcbiAgICBsZXQgdGFnID0gdGFnRm9yKG9iaiwga2V5KTtcblxuICAgIGlmICh0YWcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdXBkYXRlVGFnKG9iaiwga2V5LCBjcmVhdGVVcGRhdGFibGVUYWcoKSk7XG4gICAgfSBlbHNlIGlmIChpc0NvbnN0VGFnKHRhZykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQlVHOiBDYW4ndCB1cGRhdGUgYSBjb25zdGFudCB0YWdgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGlydHkodGFnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBCVUc6IENhbid0IHVwZGF0ZSBhIHRhZyBmb3IgYSBwcmltaXRpdmVgKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGFnRm9yPFQgZXh0ZW5kcyBvYmplY3Q+KG9iajogVCwga2V5OiBrZXlvZiBUKTogVXBkYXRhYmxlVGFnO1xuZXhwb3J0IGZ1bmN0aW9uIHRhZ0ZvcjxUPihvYmo6IFQsIGtleTogc3RyaW5nKTogQ29uc3RhbnRUYWc7XG5leHBvcnQgZnVuY3Rpb24gdGFnRm9yPFQ+KG9iajogVCwga2V5OiBrZXlvZiBUKTogVXBkYXRhYmxlVGFnIHwgQ29uc3RhbnRUYWcge1xuICBpZiAoaXNPYmplY3Qob2JqKSkge1xuICAgIGxldCB0YWdzID0gVFJBQ0tFRF9UQUdTLmdldChvYmopO1xuXG4gICAgaWYgKHRhZ3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGFncyA9IG5ldyBNYXAoKTtcbiAgICAgIFRSQUNLRURfVEFHUy5zZXQob2JqLCB0YWdzKTtcbiAgICB9IGVsc2UgaWYgKHRhZ3MuaGFzKGtleSkpIHtcbiAgICAgIHJldHVybiB0YWdzLmdldChrZXkpITtcbiAgICB9XG5cbiAgICBsZXQgdGFnID0gY3JlYXRlVXBkYXRhYmxlVGFnKCk7XG4gICAgdGFncy5zZXQoa2V5LCB0YWcpO1xuICAgIHJldHVybiB0YWc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIENPTlNUQU5UX1RBRztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlVGFnPFQ+KG9iajogVCwga2V5OiBrZXlvZiBULCBuZXdUYWc6IFVwZGF0YWJsZVRhZyk6IFVwZGF0YWJsZVRhZyB7XG4gIGlmIChpc09iamVjdChvYmopKSB7XG4gICAgbGV0IHRhZyA9IHRhZ0ZvcihvYmosIGtleSk7XG5cbiAgICBpZiAoaXNDb25zdFRhZyh0YWcpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEJVRzogQ2FuJ3QgdXBkYXRlIGEgY29uc3RhbnQgdGFnYCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZSh0YWcsIG5ld1RhZyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhZztcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEJVRzogQ2FuJ3QgdXBkYXRlIGEgdGFnIGZvciBhIHByaW1pdGl2ZWApO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6IiJ9
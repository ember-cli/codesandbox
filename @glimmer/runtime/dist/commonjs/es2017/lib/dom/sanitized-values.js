'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.requiresSanitization = requiresSanitization;
exports.sanitizeAttributeValue = sanitizeAttributeValue;

var _normalize = require('../dom/normalize');

const badProtocols = ['javascript:', 'vbscript:'];
const badTags = ['A', 'BODY', 'LINK', 'IMG', 'IFRAME', 'BASE', 'FORM'];
const badTagsForDataURI = ['EMBED'];
const badAttributes = ['href', 'src', 'background', 'action'];
const badAttributesForDataURI = ['src'];
function has(array, item) {
    return array.indexOf(item) !== -1;
}
function checkURI(tagName, attribute) {
    return (tagName === null || has(badTags, tagName)) && has(badAttributes, attribute);
}
function checkDataURI(tagName, attribute) {
    if (tagName === null) return false;
    return has(badTagsForDataURI, tagName) && has(badAttributesForDataURI, attribute);
}
function requiresSanitization(tagName, attribute) {
    return checkURI(tagName, attribute) || checkDataURI(tagName, attribute);
}
function sanitizeAttributeValue(env, element, attribute, value) {
    let tagName = null;
    if (value === null || value === undefined) {
        return value;
    }
    if ((0, _normalize.isSafeString)(value)) {
        return value.toHTML();
    }
    if (!element) {
        tagName = null;
    } else {
        tagName = element.tagName.toUpperCase();
    }
    let str = (0, _normalize.normalizeStringValue)(value);
    if (checkURI(tagName, attribute)) {
        let protocol = env.protocolForURL(str);
        if (has(badProtocols, protocol)) {
            return `unsafe:${str}`;
        }
    }
    if (checkDataURI(tagName, attribute)) {
        return `unsafe:${str}`;
    }
    return str;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3J1bnRpbWUvbGliL2RvbS9zYW5pdGl6ZWQtdmFsdWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O1FBNEJNLG9CLEdBQUEsb0I7UUFJQSxzQixHQUFBLHNCOzs7O0FBM0JOLE1BQU0sZUFBZSxDQUFBLGFBQUEsRUFBckIsV0FBcUIsQ0FBckI7QUFFQSxNQUFNLFVBQVUsQ0FBQSxHQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBaEIsTUFBZ0IsQ0FBaEI7QUFFQSxNQUFNLG9CQUFvQixDQUExQixPQUEwQixDQUExQjtBQUVBLE1BQU0sZ0JBQWdCLENBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxZQUFBLEVBQXRCLFFBQXNCLENBQXRCO0FBRUEsTUFBTSwwQkFBMEIsQ0FBaEMsS0FBZ0MsQ0FBaEM7QUFFQSxTQUFBLEdBQUEsQ0FBQSxLQUFBLEVBQUEsSUFBQSxFQUErQztBQUM3QyxXQUFPLE1BQUEsT0FBQSxDQUFBLElBQUEsTUFBd0IsQ0FBL0IsQ0FBQTtBQUNEO0FBRUQsU0FBQSxRQUFBLENBQUEsT0FBQSxFQUFBLFNBQUEsRUFBNEQ7QUFDMUQsV0FBTyxDQUFDLFlBQUEsSUFBQSxJQUFvQixJQUFBLE9BQUEsRUFBckIsT0FBcUIsQ0FBckIsS0FBK0MsSUFBQSxhQUFBLEVBQXRELFNBQXNELENBQXREO0FBQ0Q7QUFFRCxTQUFBLFlBQUEsQ0FBQSxPQUFBLEVBQUEsU0FBQSxFQUFnRTtBQUM5RCxRQUFJLFlBQUosSUFBQSxFQUFzQixPQUFBLEtBQUE7QUFDdEIsV0FBTyxJQUFBLGlCQUFBLEVBQUEsT0FBQSxLQUFtQyxJQUFBLHVCQUFBLEVBQTFDLFNBQTBDLENBQTFDO0FBQ0Q7QUFFSyxTQUFBLG9CQUFBLENBQUEsT0FBQSxFQUFBLFNBQUEsRUFBaUU7QUFDckUsV0FBTyxTQUFBLE9BQUEsRUFBQSxTQUFBLEtBQWdDLGFBQUEsT0FBQSxFQUF2QyxTQUF1QyxDQUF2QztBQUNEO0FBRUssU0FBQSxzQkFBQSxDQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLEtBQUEsRUFJVTtBQUVkLFFBQUksVUFBSixJQUFBO0FBRUEsUUFBSSxVQUFBLElBQUEsSUFBa0IsVUFBdEIsU0FBQSxFQUEyQztBQUN6QyxlQUFBLEtBQUE7QUFDRDtBQUVELFFBQUksNkJBQUosS0FBSSxDQUFKLEVBQXlCO0FBQ3ZCLGVBQU8sTUFBUCxNQUFPLEVBQVA7QUFDRDtBQUVELFFBQUksQ0FBSixPQUFBLEVBQWM7QUFDWixrQkFBQSxJQUFBO0FBREYsS0FBQSxNQUVPO0FBQ0wsa0JBQVUsUUFBQSxPQUFBLENBQVYsV0FBVSxFQUFWO0FBQ0Q7QUFFRCxRQUFJLE1BQU0scUNBQVYsS0FBVSxDQUFWO0FBRUEsUUFBSSxTQUFBLE9BQUEsRUFBSixTQUFJLENBQUosRUFBa0M7QUFDaEMsWUFBSSxXQUFXLElBQUEsY0FBQSxDQUFmLEdBQWUsQ0FBZjtBQUNBLFlBQUksSUFBQSxZQUFBLEVBQUosUUFBSSxDQUFKLEVBQWlDO0FBQy9CLG1CQUFPLFVBQVUsR0FBakIsRUFBQTtBQUNEO0FBQ0Y7QUFFRCxRQUFJLGFBQUEsT0FBQSxFQUFKLFNBQUksQ0FBSixFQUFzQztBQUNwQyxlQUFPLFVBQVUsR0FBakIsRUFBQTtBQUNEO0FBRUQsV0FBQSxHQUFBO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPcHRpb24gfSBmcm9tICdAZ2xpbW1lci91dGlsJztcbmltcG9ydCB7IG5vcm1hbGl6ZVN0cmluZ1ZhbHVlLCBpc1NhZmVTdHJpbmcgfSBmcm9tICcuLi9kb20vbm9ybWFsaXplJztcbmltcG9ydCB7IEVudmlyb25tZW50IH0gZnJvbSAnQGdsaW1tZXIvaW50ZXJmYWNlcyc7XG5pbXBvcnQgeyBTaW1wbGVFbGVtZW50IH0gZnJvbSAnQHNpbXBsZS1kb20vaW50ZXJmYWNlJztcblxuY29uc3QgYmFkUHJvdG9jb2xzID0gWydqYXZhc2NyaXB0OicsICd2YnNjcmlwdDonXTtcblxuY29uc3QgYmFkVGFncyA9IFsnQScsICdCT0RZJywgJ0xJTksnLCAnSU1HJywgJ0lGUkFNRScsICdCQVNFJywgJ0ZPUk0nXTtcblxuY29uc3QgYmFkVGFnc0ZvckRhdGFVUkkgPSBbJ0VNQkVEJ107XG5cbmNvbnN0IGJhZEF0dHJpYnV0ZXMgPSBbJ2hyZWYnLCAnc3JjJywgJ2JhY2tncm91bmQnLCAnYWN0aW9uJ107XG5cbmNvbnN0IGJhZEF0dHJpYnV0ZXNGb3JEYXRhVVJJID0gWydzcmMnXTtcblxuZnVuY3Rpb24gaGFzKGFycmF5OiBBcnJheTxzdHJpbmc+LCBpdGVtOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGFycmF5LmluZGV4T2YoaXRlbSkgIT09IC0xO1xufVxuXG5mdW5jdGlvbiBjaGVja1VSSSh0YWdOYW1lOiBPcHRpb248c3RyaW5nPiwgYXR0cmlidXRlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuICh0YWdOYW1lID09PSBudWxsIHx8IGhhcyhiYWRUYWdzLCB0YWdOYW1lKSkgJiYgaGFzKGJhZEF0dHJpYnV0ZXMsIGF0dHJpYnV0ZSk7XG59XG5cbmZ1bmN0aW9uIGNoZWNrRGF0YVVSSSh0YWdOYW1lOiBPcHRpb248c3RyaW5nPiwgYXR0cmlidXRlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgaWYgKHRhZ05hbWUgPT09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIGhhcyhiYWRUYWdzRm9yRGF0YVVSSSwgdGFnTmFtZSkgJiYgaGFzKGJhZEF0dHJpYnV0ZXNGb3JEYXRhVVJJLCBhdHRyaWJ1dGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZXNTYW5pdGl6YXRpb24odGFnTmFtZTogc3RyaW5nLCBhdHRyaWJ1dGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gY2hlY2tVUkkodGFnTmFtZSwgYXR0cmlidXRlKSB8fCBjaGVja0RhdGFVUkkodGFnTmFtZSwgYXR0cmlidXRlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplQXR0cmlidXRlVmFsdWUoXG4gIGVudjogRW52aXJvbm1lbnQsXG4gIGVsZW1lbnQ6IFNpbXBsZUVsZW1lbnQsXG4gIGF0dHJpYnV0ZTogc3RyaW5nLFxuICB2YWx1ZTogdW5rbm93blxuKTogdW5rbm93biB7XG4gIGxldCB0YWdOYW1lOiBPcHRpb248c3RyaW5nPiA9IG51bGw7XG5cbiAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBpZiAoaXNTYWZlU3RyaW5nKHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS50b0hUTUwoKTtcbiAgfVxuXG4gIGlmICghZWxlbWVudCkge1xuICAgIHRhZ05hbWUgPSBudWxsO1xuICB9IGVsc2Uge1xuICAgIHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgfVxuXG4gIGxldCBzdHIgPSBub3JtYWxpemVTdHJpbmdWYWx1ZSh2YWx1ZSk7XG5cbiAgaWYgKGNoZWNrVVJJKHRhZ05hbWUsIGF0dHJpYnV0ZSkpIHtcbiAgICBsZXQgcHJvdG9jb2wgPSBlbnYucHJvdG9jb2xGb3JVUkwoc3RyKTtcbiAgICBpZiAoaGFzKGJhZFByb3RvY29scywgcHJvdG9jb2wpKSB7XG4gICAgICByZXR1cm4gYHVuc2FmZToke3N0cn1gO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjaGVja0RhdGFVUkkodGFnTmFtZSwgYXR0cmlidXRlKSkge1xuICAgIHJldHVybiBgdW5zYWZlOiR7c3RyfWA7XG4gIH1cblxuICByZXR1cm4gc3RyO1xufVxuIl0sInNvdXJjZVJvb3QiOiIifQ==
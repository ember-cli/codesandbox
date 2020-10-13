'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isDestroyable = isDestroyable;
exports.isStringDestroyable = isStringDestroyable;
const DESTROY = exports.DESTROY = 'DESTROY [fc611582-3742-4845-88e1-971c3775e0b8]';
function isDestroyable(value) {
    return !!(value && DESTROY in value);
}
function isStringDestroyable(value) {
    return !!(value && typeof value === 'object' && typeof value.destroy === 'function');
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3V0aWwvbGliL2Rlc3Ryb3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFJTSxhLEdBQUEsYTtRQU1BLG1CLEdBQUEsbUI7QUFSQyxNQUFNLDRCQUFOLGdEQUFBO0FBRUQsU0FBQSxhQUFBLENBQUEsS0FBQSxFQUNvQztBQUV4QyxXQUFPLENBQUMsRUFBRSxTQUFTLFdBQW5CLEtBQVEsQ0FBUjtBQUNEO0FBRUssU0FBQSxtQkFBQSxDQUFBLEtBQUEsRUFBZ0U7QUFDcEUsV0FBTyxDQUFDLEVBQUUsU0FBUyxPQUFBLEtBQUEsS0FBVCxRQUFBLElBQXNDLE9BQU8sTUFBUCxPQUFBLEtBQWhELFVBQVEsQ0FBUjtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWF5YmUsIFN5bWJvbERlc3Ryb3lhYmxlLCBEZXN0cm95YWJsZSwgRGVzdHJveVN5bWJvbCB9IGZyb20gJ0BnbGltbWVyL2ludGVyZmFjZXMnO1xuXG5leHBvcnQgY29uc3QgREVTVFJPWTogRGVzdHJveVN5bWJvbCA9ICdERVNUUk9ZIFtmYzYxMTU4Mi0zNzQyLTQ4NDUtODhlMS05NzFjMzc3NWUwYjhdJztcblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGVzdHJveWFibGUoXG4gIHZhbHVlOiBNYXliZTxvYmplY3Q+IHwgU3ltYm9sRGVzdHJveWFibGVcbik6IHZhbHVlIGlzIFN5bWJvbERlc3Ryb3lhYmxlIHtcbiAgcmV0dXJuICEhKHZhbHVlICYmIERFU1RST1kgaW4gdmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHJpbmdEZXN0cm95YWJsZSh2YWx1ZTogTWF5YmU8UGFydGlhbDxEZXN0cm95YWJsZT4+KTogdmFsdWUgaXMgRGVzdHJveWFibGUge1xuICByZXR1cm4gISEodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUuZGVzdHJveSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG4iXSwic291cmNlUm9vdCI6IiJ9
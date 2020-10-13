export { EMPTY_ARRAY } from './lib/array-utils';
export { default as assert, deprecate } from './lib/assert';
export { dict, DictSet, isDict, isObject, StackImpl as Stack } from './lib/collections';
export * from './lib/destroy';
export * from './lib/dom';
export { ensureGuid, initializeGuid } from './lib/guid';
export { isSerializationFirstNode, SERIALIZATION_FIRST_NODE_STRING } from './lib/is-serialization-first-node';
export * from './lib/lifetimes';
export { EMPTY_SLICE, LinkedList, ListNode, ListSlice } from './lib/list-utils';
export { assign, fillNulls, values } from './lib/object-utils';
export * from './lib/platform-utils';
export * from './lib/string';
export function assertNever(value, desc = 'unexpected unreachable branch') {
    console.log('unreachable', value);
    console.trace(`${desc} :: ${JSON.stringify(value)} (${value})`);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3V0aWwvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxXQUFULFFBQTRCLG1CQUE1QjtBQUNBLFNBQVMsV0FBVyxNQUFwQixFQUE0QixTQUE1QixRQUE2QyxjQUE3QztBQUNBLFNBQVMsSUFBVCxFQUFlLE9BQWYsRUFBd0IsTUFBeEIsRUFBZ0MsUUFBaEMsRUFBK0MsYUFBYSxLQUE1RCxRQUF5RSxtQkFBekU7QUFDQSxjQUFjLGVBQWQ7QUFDQSxjQUFjLFdBQWQ7QUFDQSxTQUFTLFVBQVQsRUFBOEIsY0FBOUIsUUFBb0QsWUFBcEQ7QUFDQSxTQUNFLHdCQURGLEVBRUUsK0JBRkYsUUFHTyxtQ0FIUDtBQUlBLGNBQWMsaUJBQWQ7QUFDQSxTQUVFLFdBRkYsRUFHRSxVQUhGLEVBS0UsUUFMRixFQU1FLFNBTkYsUUFRTyxrQkFSUDtBQVNBLFNBQVMsTUFBVCxFQUFpQixTQUFqQixFQUE0QixNQUE1QixRQUEwQyxvQkFBMUM7QUFDQSxjQUFjLHNCQUFkO0FBQ0EsY0FBYyxjQUFkO0FBSUEsT0FBTSxTQUFVLFdBQVYsQ0FBc0IsS0FBdEIsRUFBb0MsT0FBTywrQkFBM0MsRUFBMEU7QUFDOUUsWUFBUSxHQUFSLENBQVksYUFBWixFQUEyQixLQUEzQjtBQUNBLFlBQVEsS0FBUixDQUFjLEdBQUcsSUFBSSxPQUFPLEtBQUssU0FBTCxDQUFlLEtBQWYsQ0FBcUIsS0FBSyxLQUFLLEdBQTNEO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgeyBFTVBUWV9BUlJBWSB9IGZyb20gJy4vbGliL2FycmF5LXV0aWxzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgYXNzZXJ0LCBkZXByZWNhdGUgfSBmcm9tICcuL2xpYi9hc3NlcnQnO1xuZXhwb3J0IHsgZGljdCwgRGljdFNldCwgaXNEaWN0LCBpc09iamVjdCwgU2V0LCBTdGFja0ltcGwgYXMgU3RhY2sgfSBmcm9tICcuL2xpYi9jb2xsZWN0aW9ucyc7XG5leHBvcnQgKiBmcm9tICcuL2xpYi9kZXN0cm95JztcbmV4cG9ydCAqIGZyb20gJy4vbGliL2RvbSc7XG5leHBvcnQgeyBlbnN1cmVHdWlkLCBIYXNHdWlkLCBpbml0aWFsaXplR3VpZCB9IGZyb20gJy4vbGliL2d1aWQnO1xuZXhwb3J0IHtcbiAgaXNTZXJpYWxpemF0aW9uRmlyc3ROb2RlLFxuICBTRVJJQUxJWkFUSU9OX0ZJUlNUX05PREVfU1RSSU5HLFxufSBmcm9tICcuL2xpYi9pcy1zZXJpYWxpemF0aW9uLWZpcnN0LW5vZGUnO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvbGlmZXRpbWVzJztcbmV4cG9ydCB7XG4gIENsb25lYWJsZUxpc3ROb2RlLFxuICBFTVBUWV9TTElDRSxcbiAgTGlua2VkTGlzdCxcbiAgTGlua2VkTGlzdE5vZGUsXG4gIExpc3ROb2RlLFxuICBMaXN0U2xpY2UsXG4gIFNsaWNlLFxufSBmcm9tICcuL2xpYi9saXN0LXV0aWxzJztcbmV4cG9ydCB7IGFzc2lnbiwgZmlsbE51bGxzLCB2YWx1ZXMgfSBmcm9tICcuL2xpYi9vYmplY3QtdXRpbHMnO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvcGxhdGZvcm0tdXRpbHMnO1xuZXhwb3J0ICogZnJvbSAnLi9saWIvc3RyaW5nJztcblxuZXhwb3J0IHR5cGUgRklYTUU8VCwgUyBleHRlbmRzIHN0cmluZz4gPSBUICYgUyB8IFQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROZXZlcih2YWx1ZTogbmV2ZXIsIGRlc2MgPSAndW5leHBlY3RlZCB1bnJlYWNoYWJsZSBicmFuY2gnKTogdm9pZCB7XG4gIGNvbnNvbGUubG9nKCd1bnJlYWNoYWJsZScsIHZhbHVlKTtcbiAgY29uc29sZS50cmFjZShgJHtkZXNjfSA6OiAke0pTT04uc3RyaW5naWZ5KHZhbHVlKX0gKCR7dmFsdWV9KWApO1xufVxuIl0sInNvdXJjZVJvb3QiOiIifQ==
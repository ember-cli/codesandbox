const DESTROYING = new WeakMap();
const DESTROYED = new WeakMap();
// TODO: remove once glimmer.js is updated to glimmer-vm 0.54.0+ and can use the destroyables API directly
export function setDestroying(component) {
    DESTROYING.set(component, true);
}
export function setDestroyed(component) {
    DESTROYED.set(component, true);
}
export function isDestroying(component) {
    return DESTROYING.has(component);
}
export function isDestroyed(component) {
    return DESTROYED.has(component);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVzdHJveWFibGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvQGdsaW1tZXIvY29tcG9uZW50L2FkZG9uLy1wcml2YXRlL2Rlc3Ryb3lhYmxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLFVBQVUsR0FBRyxJQUFJLE9BQU8sRUFBbUIsQ0FBQztBQUNsRCxNQUFNLFNBQVMsR0FBRyxJQUFJLE9BQU8sRUFBbUIsQ0FBQztBQUVqRCwwR0FBMEc7QUFDMUcsTUFBTSxVQUFVLGFBQWEsQ0FBQyxTQUFpQjtJQUM3QyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNsQyxDQUFDO0FBQ0QsTUFBTSxVQUFVLFlBQVksQ0FBQyxTQUFpQjtJQUM1QyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsTUFBTSxVQUFVLFlBQVksQ0FBQyxTQUFpQjtJQUM1QyxPQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkMsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUMsU0FBaUI7SUFDM0MsT0FBTyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2xDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBERVNUUk9ZSU5HID0gbmV3IFdlYWtNYXA8b2JqZWN0LCBib29sZWFuPigpO1xuY29uc3QgREVTVFJPWUVEID0gbmV3IFdlYWtNYXA8b2JqZWN0LCBib29sZWFuPigpO1xuXG4vLyBUT0RPOiByZW1vdmUgb25jZSBnbGltbWVyLmpzIGlzIHVwZGF0ZWQgdG8gZ2xpbW1lci12bSAwLjU0LjArIGFuZCBjYW4gdXNlIHRoZSBkZXN0cm95YWJsZXMgQVBJIGRpcmVjdGx5XG5leHBvcnQgZnVuY3Rpb24gc2V0RGVzdHJveWluZyhjb21wb25lbnQ6IG9iamVjdCkge1xuICBERVNUUk9ZSU5HLnNldChjb21wb25lbnQsIHRydWUpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldERlc3Ryb3llZChjb21wb25lbnQ6IG9iamVjdCkge1xuICBERVNUUk9ZRUQuc2V0KGNvbXBvbmVudCwgdHJ1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Rlc3Ryb3lpbmcoY29tcG9uZW50OiBvYmplY3QpIHtcbiAgcmV0dXJuIERFU1RST1lJTkcuaGFzKGNvbXBvbmVudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Rlc3Ryb3llZChjb21wb25lbnQ6IG9iamVjdCkge1xuICByZXR1cm4gREVTVFJPWUVELmhhcyhjb21wb25lbnQpO1xufVxuIl19
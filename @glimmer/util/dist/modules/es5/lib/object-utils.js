var objKeys = Object.keys;

export function assign(obj) {
    for (var i = 1; i < arguments.length; i++) {
        var assignment = arguments[i];
        if (assignment === null || typeof assignment !== 'object') continue;
        var keys = objKeys(assignment);
        for (var j = 0; j < keys.length; j++) {
            var key = keys[j];
            obj[key] = assignment[key];
        }
    }
    return obj;
}
export function fillNulls(count) {
    var arr = new Array(count);
    for (var i = 0; i < count; i++) {
        arr[i] = null;
    }
    return arr;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3V0aWwvbGliL29iamVjdC11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiSUFBTSxPLEdBQU4sTTs7QUF3QkEsT0FBTSxTQUFBLE1BQUEsQ0FBQSxHQUFBLEVBQXlCO0FBQzdCLFNBQUssSUFBSSxJQUFULENBQUEsRUFBZ0IsSUFBSSxVQUFwQixNQUFBLEVBQUEsR0FBQSxFQUEyQztBQUN6QyxZQUFJLGFBQWEsVUFBakIsQ0FBaUIsQ0FBakI7QUFDQSxZQUFJLGVBQUEsSUFBQSxJQUF1QixPQUFBLFVBQUEsS0FBM0IsUUFBQSxFQUEyRDtBQUMzRCxZQUFJLE9BQU8sUUFBWCxVQUFXLENBQVg7QUFDQSxhQUFLLElBQUksSUFBVCxDQUFBLEVBQWdCLElBQUksS0FBcEIsTUFBQSxFQUFBLEdBQUEsRUFBc0M7QUFDcEMsZ0JBQUksTUFBTSxLQUFWLENBQVUsQ0FBVjtBQUNBLGdCQUFBLEdBQUEsSUFBVyxXQUFYLEdBQVcsQ0FBWDtBQUNEO0FBQ0Y7QUFDRCxXQUFBLEdBQUE7QUFDRDtBQUVELE9BQU0sU0FBQSxTQUFBLENBQUEsS0FBQSxFQUFvQztBQUN4QyxRQUFJLE1BQU0sSUFBQSxLQUFBLENBQVYsS0FBVSxDQUFWO0FBRUEsU0FBSyxJQUFJLElBQVQsQ0FBQSxFQUFnQixJQUFoQixLQUFBLEVBQUEsR0FBQSxFQUFnQztBQUM5QixZQUFBLENBQUEsSUFBQSxJQUFBO0FBQ0Q7QUFFRCxXQUFBLEdBQUE7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsga2V5czogb2JqS2V5cyB9ID0gT2JqZWN0O1xuXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduPFQsIFU+KG9iajogVCwgYXNzaWdubWVudHM6IFUpOiBUICYgVTtcbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ248VCwgVSwgVj4ob2JqOiBULCBhOiBVLCBiOiBWKTogVCAmIFUgJiBWO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnbjxULCBVLCBWLCBXPihvYmo6IFQsIGE6IFUsIGI6IFYsIGM6IFcpOiBUICYgVSAmIFYgJiBXO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnbjxULCBVLCBWLCBXLCBYPihvYmo6IFQsIGE6IFUsIGI6IFYsIGM6IFcsIGQ6IFgpOiBUICYgVSAmIFYgJiBXICYgWDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ248VCwgVSwgViwgVywgWCwgWT4oXG4gIG9iajogVCxcbiAgYTogVSxcbiAgYjogVixcbiAgYzogVyxcbiAgZDogWCxcbiAgZTogWVxuKTogVCAmIFUgJiBWICYgVyAmIFggJiBZO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnbjxULCBVLCBWLCBXLCBYLCBZLCBaPihcbiAgb2JqOiBULFxuICBhOiBVLFxuICBiOiBWLFxuICBjOiBXLFxuICBkOiBYLFxuICBlOiBZLFxuICBmOiBaXG4pOiBUICYgVSAmIFYgJiBXICYgWCAmIFkgJiBaO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnbih0YXJnZXQ6IGFueSwgLi4uYXJnczogYW55W10pOiBhbnk7XG5leHBvcnQgZnVuY3Rpb24gYXNzaWduKG9iajogYW55KSB7XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGFzc2lnbm1lbnQgPSBhcmd1bWVudHNbaV07XG4gICAgaWYgKGFzc2lnbm1lbnQgPT09IG51bGwgfHwgdHlwZW9mIGFzc2lnbm1lbnQgIT09ICdvYmplY3QnKSBjb250aW51ZTtcbiAgICBsZXQga2V5cyA9IG9iaktleXMoYXNzaWdubWVudCk7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBrZXlzLmxlbmd0aDsgaisrKSB7XG4gICAgICBsZXQga2V5ID0ga2V5c1tqXTtcbiAgICAgIG9ialtrZXldID0gYXNzaWdubWVudFtrZXldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmlsbE51bGxzPFQ+KGNvdW50OiBudW1iZXIpOiBUW10ge1xuICBsZXQgYXJyID0gbmV3IEFycmF5KGNvdW50KTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICBhcnJbaV0gPSBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGFycjtcbn1cbiJdLCJzb3VyY2VSb290IjoiIn0=
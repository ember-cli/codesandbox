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
export function values(obj) {
    var vals = [];
    for (var key in obj) {
        vals.push(obj[key]);
    }
    return vals;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3V0aWwvbGliL29iamVjdC11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiSUFBTSxPLEdBQU4sTTs7QUF3QkEsT0FBTSxTQUFBLE1BQUEsQ0FBQSxHQUFBLEVBQXlCO0FBQzdCLFNBQUssSUFBSSxJQUFULENBQUEsRUFBZ0IsSUFBSSxVQUFwQixNQUFBLEVBQUEsR0FBQSxFQUEyQztBQUN6QyxZQUFJLGFBQWEsVUFBakIsQ0FBaUIsQ0FBakI7QUFDQSxZQUFJLGVBQUEsSUFBQSxJQUF1QixPQUFBLFVBQUEsS0FBM0IsUUFBQSxFQUEyRDtBQUMzRCxZQUFJLE9BQU8sUUFBWCxVQUFXLENBQVg7QUFDQSxhQUFLLElBQUksSUFBVCxDQUFBLEVBQWdCLElBQUksS0FBcEIsTUFBQSxFQUFBLEdBQUEsRUFBc0M7QUFDcEMsZ0JBQUksTUFBTSxLQUFWLENBQVUsQ0FBVjtBQUNBLGdCQUFBLEdBQUEsSUFBVyxXQUFYLEdBQVcsQ0FBWDtBQUNEO0FBQ0Y7QUFDRCxXQUFBLEdBQUE7QUFDRDtBQUVELE9BQU0sU0FBQSxTQUFBLENBQUEsS0FBQSxFQUFvQztBQUN4QyxRQUFJLE1BQU0sSUFBQSxLQUFBLENBQVYsS0FBVSxDQUFWO0FBRUEsU0FBSyxJQUFJLElBQVQsQ0FBQSxFQUFnQixJQUFoQixLQUFBLEVBQUEsR0FBQSxFQUFnQztBQUM5QixZQUFBLENBQUEsSUFBQSxJQUFBO0FBQ0Q7QUFFRCxXQUFBLEdBQUE7QUFDRDtBQUVELE9BQU0sU0FBQSxNQUFBLENBQUEsR0FBQSxFQUEyQztBQUMvQyxRQUFNLE9BQU4sRUFBQTtBQUNBLFNBQUssSUFBTCxHQUFBLElBQUEsR0FBQSxFQUF1QjtBQUNyQixhQUFBLElBQUEsQ0FBVSxJQUFWLEdBQVUsQ0FBVjtBQUNEO0FBQ0QsV0FBQSxJQUFBO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7IGtleXM6IG9iaktleXMgfSA9IE9iamVjdDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnbjxULCBVPihvYmo6IFQsIGFzc2lnbm1lbnRzOiBVKTogVCAmIFU7XG5leHBvcnQgZnVuY3Rpb24gYXNzaWduPFQsIFUsIFY+KG9iajogVCwgYTogVSwgYjogVik6IFQgJiBVICYgVjtcbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ248VCwgVSwgViwgVz4ob2JqOiBULCBhOiBVLCBiOiBWLCBjOiBXKTogVCAmIFUgJiBWICYgVztcbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ248VCwgVSwgViwgVywgWD4ob2JqOiBULCBhOiBVLCBiOiBWLCBjOiBXLCBkOiBYKTogVCAmIFUgJiBWICYgVyAmIFg7XG5leHBvcnQgZnVuY3Rpb24gYXNzaWduPFQsIFUsIFYsIFcsIFgsIFk+KFxuICBvYmo6IFQsXG4gIGE6IFUsXG4gIGI6IFYsXG4gIGM6IFcsXG4gIGQ6IFgsXG4gIGU6IFlcbik6IFQgJiBVICYgViAmIFcgJiBYICYgWTtcbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ248VCwgVSwgViwgVywgWCwgWSwgWj4oXG4gIG9iajogVCxcbiAgYTogVSxcbiAgYjogVixcbiAgYzogVyxcbiAgZDogWCxcbiAgZTogWSxcbiAgZjogWlxuKTogVCAmIFUgJiBWICYgVyAmIFggJiBZICYgWjtcbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0OiBhbnksIC4uLmFyZ3M6IGFueVtdKTogYW55O1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnbihvYmo6IGFueSkge1xuICBmb3IgKGxldCBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGxldCBhc3NpZ25tZW50ID0gYXJndW1lbnRzW2ldO1xuICAgIGlmIChhc3NpZ25tZW50ID09PSBudWxsIHx8IHR5cGVvZiBhc3NpZ25tZW50ICE9PSAnb2JqZWN0JykgY29udGludWU7XG4gICAgbGV0IGtleXMgPSBvYmpLZXlzKGFzc2lnbm1lbnQpO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwga2V5cy5sZW5ndGg7IGorKykge1xuICAgICAgbGV0IGtleSA9IGtleXNbal07XG4gICAgICBvYmpba2V5XSA9IGFzc2lnbm1lbnRba2V5XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG9iajtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbGxOdWxsczxUPihjb3VudDogbnVtYmVyKTogVFtdIHtcbiAgbGV0IGFyciA9IG5ldyBBcnJheShjb3VudCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgYXJyW2ldID0gbnVsbDtcbiAgfVxuXG4gIHJldHVybiBhcnI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB2YWx1ZXM8VD4ob2JqOiB7IFtzOiBzdHJpbmddOiBUIH0pOiBUW10ge1xuICBjb25zdCB2YWxzID0gW107XG4gIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgIHZhbHMucHVzaChvYmpba2V5XSk7XG4gIH1cbiAgcmV0dXJuIHZhbHM7XG59XG4iXSwic291cmNlUm9vdCI6IiJ9
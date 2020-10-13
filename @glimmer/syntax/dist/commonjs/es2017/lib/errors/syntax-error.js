"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Subclass of `Error` with additional information
 * about location of incorrect markup.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
const SyntaxError = function () {
  SyntaxError.prototype = Object.create(Error.prototype);
  SyntaxError.prototype.constructor = SyntaxError;

  function SyntaxError(message, location) {
    let error = Error.call(this, message);
    this.message = message;
    this.stack = error.stack;
    this.location = location;
  }

  return SyntaxError;
}();

var _default = SyntaxError;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3N5bnRheC9saWIvZXJyb3JzL3N5bnRheC1lcnJvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBWUE7Ozs7QUFJQTtBQUNBLE1BQU0sV0FBVyxHQUE0QixZQUFBO0FBQzNDLEVBQUEsV0FBVyxDQUFYLFNBQUEsR0FBd0IsTUFBTSxDQUFOLE1BQUEsQ0FBYyxLQUFLLENBQTNDLFNBQXdCLENBQXhCO0FBQ0EsRUFBQSxXQUFXLENBQVgsU0FBQSxDQUFBLFdBQUEsR0FBQSxXQUFBOztBQUVBLFdBQUEsV0FBQSxDQUFBLE9BQUEsRUFBQSxRQUFBLEVBQXFGO0FBQ25GLFFBQUksS0FBSyxHQUFHLEtBQUssQ0FBTCxJQUFBLENBQUEsSUFBQSxFQUFaLE9BQVksQ0FBWjtBQUVBLFNBQUEsT0FBQSxHQUFBLE9BQUE7QUFDQSxTQUFBLEtBQUEsR0FBYSxLQUFLLENBQWxCLEtBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxRQUFBO0FBQ0Q7O0FBRUQsU0FBQSxXQUFBO0FBWkYsQ0FBNkMsRUFBN0M7O2VBZUEsVyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIEFTVCBmcm9tICcuLi90eXBlcy9ub2Rlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3ludGF4RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGxvY2F0aW9uOiBBU1QuU291cmNlTG9jYXRpb247XG4gIGNvbnN0cnVjdG9yOiBTeW50YXhFcnJvckNvbnN0cnVjdG9yO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN5bnRheEVycm9yQ29uc3RydWN0b3Ige1xuICBuZXcgKG1lc3NhZ2U6IHN0cmluZywgbG9jYXRpb246IEFTVC5Tb3VyY2VMb2NhdGlvbik6IFN5bnRheEVycm9yO1xuICByZWFkb25seSBwcm90b3R5cGU6IFN5bnRheEVycm9yO1xufVxuXG4vKipcbiAqIFN1YmNsYXNzIG9mIGBFcnJvcmAgd2l0aCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiBhYm91dCBsb2NhdGlvbiBvZiBpbmNvcnJlY3QgbWFya3VwLlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uXG5jb25zdCBTeW50YXhFcnJvcjogU3ludGF4RXJyb3JDb25zdHJ1Y3RvciA9IChmdW5jdGlvbiAoKSB7XG4gIFN5bnRheEVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcbiAgU3ludGF4RXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU3ludGF4RXJyb3I7XG5cbiAgZnVuY3Rpb24gU3ludGF4RXJyb3IodGhpczogU3ludGF4RXJyb3IsIG1lc3NhZ2U6IHN0cmluZywgbG9jYXRpb246IEFTVC5Tb3VyY2VMb2NhdGlvbikge1xuICAgIGxldCBlcnJvciA9IEVycm9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIHRoaXMuc3RhY2sgPSBlcnJvci5zdGFjaztcbiAgICB0aGlzLmxvY2F0aW9uID0gbG9jYXRpb247XG4gIH1cblxuICByZXR1cm4gU3ludGF4RXJyb3IgYXMgYW55O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgU3ludGF4RXJyb3I7XG4iXSwic291cmNlUm9vdCI6IiJ9
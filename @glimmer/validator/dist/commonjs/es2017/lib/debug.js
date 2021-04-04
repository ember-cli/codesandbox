"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logTrackingStack = exports.markTagAsConsumed = exports.assertTagNotConsumed = exports.setTrackingTransactionEnv = exports.resetTrackingTransaction = exports.deprecateMutationsInTrackingTransaction = exports.runInTrackingTransaction = exports.endTrackingTransaction = exports.beginTrackingTransaction = void 0;

var _env = require("@glimmer/env");

let beginTrackingTransaction;
exports.beginTrackingTransaction = beginTrackingTransaction;
let endTrackingTransaction;
exports.endTrackingTransaction = endTrackingTransaction;
let runInTrackingTransaction;
exports.runInTrackingTransaction = runInTrackingTransaction;
let deprecateMutationsInTrackingTransaction;
exports.deprecateMutationsInTrackingTransaction = deprecateMutationsInTrackingTransaction;
let resetTrackingTransaction;
exports.resetTrackingTransaction = resetTrackingTransaction;
let setTrackingTransactionEnv;
exports.setTrackingTransactionEnv = setTrackingTransactionEnv;
let assertTagNotConsumed;
exports.assertTagNotConsumed = assertTagNotConsumed;
let markTagAsConsumed;
exports.markTagAsConsumed = markTagAsConsumed;
let logTrackingStack;
exports.logTrackingStack = logTrackingStack;

if (_env.DEBUG) {
  let CONSUMED_TAGS = null;
  let TRANSACTION_STACK = []; /////////

  let TRANSACTION_ENV = {
    assert(message) {
      throw new Error(message);
    },

    deprecate(message) {
      console.warn(message);
    },

    debugMessage(obj, keyName) {
      let objName;

      if (typeof obj === 'function') {
        objName = obj.name;
      } else if (typeof obj === 'object' && obj !== null) {
        let className = obj.constructor && obj.constructor.name || '(unknown class)';
        objName = `(an instance of ${className})`;
      } else if (obj === undefined) {
        objName = '(an unknown tag)';
      } else {
        objName = String(obj);
      }

      let dirtyString = keyName ? `\`${keyName}\` on \`${objName}\`` : `\`${objName}\``;
      return `You attempted to update ${dirtyString}, but it had already been used previously in the same computation.  Attempting to update a value after using it in a computation can cause logical errors, infinite revalidation bugs, and performance issues, and is not supported.`;
    }

  };

  exports.setTrackingTransactionEnv = setTrackingTransactionEnv = env => Object.assign(TRANSACTION_ENV, env);

  exports.beginTrackingTransaction = beginTrackingTransaction = (_debugLabel, deprecate = false) => {
    CONSUMED_TAGS = CONSUMED_TAGS || new WeakMap();
    let debugLabel = _debugLabel || undefined;
    let parent = TRANSACTION_STACK[TRANSACTION_STACK.length - 1] || null;
    TRANSACTION_STACK.push({
      parent,
      debugLabel,
      deprecate
    });
  };

  exports.endTrackingTransaction = endTrackingTransaction = () => {
    if (TRANSACTION_STACK.length === 0) {
      throw new Error('attempted to close a tracking transaction, but one was not open');
    }

    TRANSACTION_STACK.pop();

    if (TRANSACTION_STACK.length === 0) {
      CONSUMED_TAGS = null;
    }
  };

  exports.resetTrackingTransaction = resetTrackingTransaction = () => {
    let stack = '';

    if (TRANSACTION_STACK.length > 0) {
      stack = logTrackingStack(TRANSACTION_STACK[TRANSACTION_STACK.length - 1]);
    }

    TRANSACTION_STACK = [];
    CONSUMED_TAGS = null;
    return stack;
  };
  /**
   * Creates a global autotracking transaction. This will prevent any backflow
   * in any `track` calls within the transaction, even if they are not
   * externally consumed.
   *
   * `runInAutotrackingTransaction` can be called within itself, and it will add
   * onto the existing transaction if one exists.
   *
   * TODO: Only throw an error if the `track` is consumed.
   */


  exports.runInTrackingTransaction = runInTrackingTransaction = (fn, debugLabel) => {
    beginTrackingTransaction(debugLabel);
    let didError = true;

    try {
      let value = fn();
      didError = false;
      return value;
    } finally {
      if (didError !== true) {
        endTrackingTransaction();
      }
    }
  };
  /**
   * Switches to deprecating within an autotracking transaction, if one exists.
   * If `runInAutotrackingTransaction` is called within the callback of this
   * method, it switches back to throwing an error, allowing zebra-striping of
   * the types of errors that are thrown.
   *
   * Does not start an autotracking transaction.
   *
   * NOTE: For Ember usage only, in general you should assert that these
   * invariants are true.
   */


  exports.deprecateMutationsInTrackingTransaction = deprecateMutationsInTrackingTransaction = (fn, debugLabel) => {
    beginTrackingTransaction(debugLabel, true);

    try {
      fn();
    } finally {
      endTrackingTransaction();
    }
  };

  let nthIndex = (str, pattern, n, startingPos = -1) => {
    let i = startingPos;

    while (n-- > 0 && i++ < str.length) {
      i = str.indexOf(pattern, i);
      if (i < 0) break;
    }

    return i;
  };

  let makeTrackingErrorMessage = (transaction, obj, keyName) => {
    let message = [TRANSACTION_ENV.debugMessage(obj, keyName && String(keyName))];
    message.push(`\`${String(keyName)}\` was first used:`);
    message.push(logTrackingStack(transaction));
    message.push(`Stack trace for the update:`);
    return message.join('\n\n');
  };

  exports.logTrackingStack = logTrackingStack = transaction => {
    let trackingStack = [];
    let current = transaction || TRANSACTION_STACK[TRANSACTION_STACK.length - 1];
    if (current === undefined) return '';

    while (current) {
      if (current.debugLabel) {
        trackingStack.unshift(current.debugLabel);
      }

      current = current.parent;
    } // TODO: Use String.prototype.repeat here once we can drop support for IE11


    return trackingStack.map((label, index) => Array(2 * index + 1).join(' ') + label).join('\n');
  };

  exports.markTagAsConsumed = markTagAsConsumed = _tag => {
    if (!CONSUMED_TAGS || CONSUMED_TAGS.has(_tag)) return;
    CONSUMED_TAGS.set(_tag, TRANSACTION_STACK[TRANSACTION_STACK.length - 1]); // We need to mark the tag and all of its subtags as consumed, so we need to
    // cast it and access its internals. In the future this shouldn't be necessary,
    // this is only for computed properties.

    let tag = _tag;

    if (tag.subtag) {
      markTagAsConsumed(tag.subtag);
    }

    if (tag.subtags) {
      tag.subtags.forEach(tag => markTagAsConsumed(tag));
    }
  };

  exports.assertTagNotConsumed = assertTagNotConsumed = (tag, obj, keyName) => {
    if (CONSUMED_TAGS === null) return;
    let transaction = CONSUMED_TAGS.get(tag);
    if (!transaction) return;
    let currentTransaction = TRANSACTION_STACK[TRANSACTION_STACK.length - 1];

    if (currentTransaction.deprecate) {
      TRANSACTION_ENV.deprecate(makeTrackingErrorMessage(transaction, obj, keyName));
    } else {
      // This hack makes the assertion message nicer, we can cut off the first
      // few lines of the stack trace and let users know where the actual error
      // occurred.
      try {
        TRANSACTION_ENV.assert(makeTrackingErrorMessage(transaction, obj, keyName));
      } catch (e) {
        if (e.stack) {
          let updateStackBegin = e.stack.indexOf('Stack trace for the update:');

          if (updateStackBegin !== -1) {
            let start = nthIndex(e.stack, '\n', 1, updateStackBegin);
            let end = nthIndex(e.stack, '\n', 4, updateStackBegin);
            e.stack = e.stack.substr(0, start) + e.stack.substr(end);
          }
        }

        throw e;
      }
    }
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3ZhbGlkYXRvci9saWIvZGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOztBQUVPLElBQUEsd0JBQUE7O0FBR0EsSUFBQSxzQkFBQTs7QUFDQSxJQUFBLHdCQUFBOztBQUdBLElBQUEsdUNBQUE7O0FBRUEsSUFBQSx3QkFBQTs7QUFDQSxJQUFBLHlCQUFBOztBQVFBLElBQUEsb0JBQUE7O0FBSUEsSUFBQSxpQkFBQTs7QUFFQSxJQUFBLGdCQUFBOzs7QUFRUCxJQUFBLFVBQUEsRUFBVztBQUNULE1BQUksYUFBYSxHQUFqQixJQUFBO0FBRUEsTUFBSSxpQkFBaUIsR0FIWixFQUdULENBSFMsQ0FLVDs7QUFFQSxNQUFJLGVBQWUsR0FBRztBQUNwQixJQUFBLE1BQU0sQ0FBQSxPQUFBLEVBQWdCO0FBQ3BCLFlBQU0sSUFBQSxLQUFBLENBQU4sT0FBTSxDQUFOO0FBRmtCLEtBQUE7O0FBS3BCLElBQUEsU0FBUyxDQUFBLE9BQUEsRUFBZ0I7QUFDdkIsTUFBQSxPQUFPLENBQVAsSUFBQSxDQUFBLE9BQUE7QUFOa0IsS0FBQTs7QUFTcEIsSUFBQSxZQUFZLENBQUEsR0FBQSxFQUFBLE9BQUEsRUFBZ0M7QUFDMUMsVUFBQSxPQUFBOztBQUVBLFVBQUksT0FBQSxHQUFBLEtBQUosVUFBQSxFQUErQjtBQUM3QixRQUFBLE9BQU8sR0FBRyxHQUFHLENBQWIsSUFBQTtBQURGLE9BQUEsTUFFTyxJQUFJLE9BQUEsR0FBQSxLQUFBLFFBQUEsSUFBMkIsR0FBRyxLQUFsQyxJQUFBLEVBQTZDO0FBQ2xELFlBQUksU0FBUyxHQUFJLEdBQUcsQ0FBSCxXQUFBLElBQW1CLEdBQUcsQ0FBSCxXQUFBLENBQXBCLElBQUMsSUFBakIsaUJBQUE7QUFFQSxRQUFBLE9BQU8sR0FBRyxtQkFBbUIsU0FBN0IsR0FBQTtBQUhLLE9BQUEsTUFJQSxJQUFJLEdBQUcsS0FBUCxTQUFBLEVBQXVCO0FBQzVCLFFB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QUFlLENBQWYsTUFBQSxDQUF1Qix3QkFBd0IsQ0FBQSxXQUFBLEVBQUEsR0FBQSxFQUEvQyxPQUErQyxDQUEvQztBQURGLE9BQUEsQ0FFRSxPQUFBLENBQUEsRUFBVTtBQUNWLFlBQUksQ0FBQyxDQUFMLEtBQUEsRUFBYTtBQUNYLGNBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFELEtBQUEsQ0FBQSxPQUFBLENBQXZCLDZCQUF1QixDQUF2Qjs7QUFFQSxjQUFJLGdCQUFnQixLQUFLLENBQXpCLENBQUEsRUFBNkI7QUFDM0IsZ0JBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUYsS0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQXBCLGdCQUFvQixDQUFwQjtBQUNBLGdCQUFJLEdBQUcsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFGLEtBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxFQUFsQixnQkFBa0IsQ0FBbEI7QUFDQSxZQUFBLENBQUMsQ0FBRCxLQUFBLEdBQVUsQ0FBQyxDQUFELEtBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxFQUFBLEtBQUEsSUFBMkIsQ0FBQyxDQUFELEtBQUEsQ0FBQSxNQUFBLENBQXJDLEdBQXFDLENBQXJDO0FBQ0Q7QUFDRjs7QUFFRCxjQUFBLENBQUE7QUFDRDtBQUNGO0FBOUJILEdBQUE7QUFnQ0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUYWcgfSBmcm9tICcuL3ZhbGlkYXRvcnMnO1xuaW1wb3J0IHsgREVCVUcgfSBmcm9tICdAZ2xpbW1lci9lbnYnO1xuXG5leHBvcnQgbGV0IGJlZ2luVHJhY2tpbmdUcmFuc2FjdGlvbjpcbiAgfCB1bmRlZmluZWRcbiAgfCAoKGRlYnVnZ2luZ0NvbnRleHQ/OiBzdHJpbmcgfCBmYWxzZSwgZGVwcmVjYXRlPzogYm9vbGVhbikgPT4gdm9pZCk7XG5leHBvcnQgbGV0IGVuZFRyYWNraW5nVHJhbnNhY3Rpb246IHVuZGVmaW5lZCB8ICgoKSA9PiB2b2lkKTtcbmV4cG9ydCBsZXQgcnVuSW5UcmFja2luZ1RyYW5zYWN0aW9uOlxuICB8IHVuZGVmaW5lZFxuICB8ICg8VD4oZm46ICgpID0+IFQsIGRlYnVnZ2luZ0NvbnRleHQ/OiBzdHJpbmcgfCBmYWxzZSkgPT4gVCk7XG5leHBvcnQgbGV0IGRlcHJlY2F0ZU11dGF0aW9uc0luVHJhY2tpbmdUcmFuc2FjdGlvbjogdW5kZWZpbmVkIHwgKChmbjogKCkgPT4gdm9pZCkgPT4gdm9pZCk7XG5cbmV4cG9ydCBsZXQgcmVzZXRUcmFja2luZ1RyYW5zYWN0aW9uOiB1bmRlZmluZWQgfCAoKCkgPT4gc3RyaW5nKTtcbmV4cG9ydCBsZXQgc2V0VHJhY2tpbmdUcmFuc2FjdGlvbkVudjpcbiAgfCB1bmRlZmluZWRcbiAgfCAoKGVudjoge1xuICAgICAgYXNzZXJ0PyhtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICAgICAgZGVwcmVjYXRlPyhtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICAgICAgZGVidWdNZXNzYWdlPyhvYmo/OiB1bmtub3duLCBrZXlOYW1lPzogc3RyaW5nKTogc3RyaW5nO1xuICAgIH0pID0+IHZvaWQpO1xuXG5leHBvcnQgbGV0IGFzc2VydFRhZ05vdENvbnN1bWVkOlxuICB8IHVuZGVmaW5lZFxuICB8ICg8VD4odGFnOiBUYWcsIG9iaj86IFQsIGtleU5hbWU/OiBrZXlvZiBUIHwgc3RyaW5nIHwgc3ltYm9sKSA9PiB2b2lkKTtcblxuZXhwb3J0IGxldCBtYXJrVGFnQXNDb25zdW1lZDogdW5kZWZpbmVkIHwgKChfdGFnOiBUYWcpID0+IHZvaWQpO1xuXG5leHBvcnQgbGV0IGxvZ1RyYWNraW5nU3RhY2s6IHVuZGVmaW5lZCB8ICgodHJhbnNhY3Rpb24/OiBUcmFuc2FjdGlvbikgPT4gc3RyaW5nKTtcblxuaW50ZXJmYWNlIFRyYW5zYWN0aW9uIHtcbiAgcGFyZW50OiBUcmFuc2FjdGlvbiB8IG51bGw7XG4gIGRlYnVnTGFiZWw/OiBzdHJpbmc7XG4gIGRlcHJlY2F0ZTogYm9vbGVhbjtcbn1cblxuaWYgKERFQlVHKSB7XG4gIGxldCBDT05TVU1FRF9UQUdTOiBXZWFrTWFwPFRhZywgVHJhbnNhY3Rpb24+IHwgbnVsbCA9IG51bGw7XG5cbiAgbGV0IFRSQU5TQUNUSU9OX1NUQUNLOiBUcmFuc2FjdGlvbltdID0gW107XG5cbiAgLy8vLy8vLy8vXG5cbiAgbGV0IFRSQU5TQUNUSU9OX0VOViA9IHtcbiAgICBhc3NlcnQobWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgfSxcblxuICAgIGRlcHJlY2F0ZShtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICB9LFxuXG4gICAgZGVidWdNZXNzYWdlKG9iaj86IHVua25vd24sIGtleU5hbWU/OiBzdHJpbmcpIHtcbiAgICAgIGxldCBvYmpOYW1lO1xuXG4gICAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvYmpOYW1lID0gb2JqLm5hbWU7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmIG9iaiAhPT0gbnVsbCkge1xuICAgICAgICBsZXQgY2xhc3NOYW1lID0gKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSkgfHwgJyh1bmtub3duIGNsYXNzKSc7XG5cbiAgICAgICAgb2JqTmFtZSA9IGAoYW4gaW5zdGFuY2Ugb2YgJHtjbGFzc05hbWV9KWA7XG4gICAgICB9IGVsc2UgaWYgKG9iaiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG9iak5hbWUgPSAnKGFuIHVua25vd24gdGFnKSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvYmpOYW1lID0gU3RyaW5nKG9iaik7XG4gICAgICB9XG5cbiAgICAgIGxldCBkaXJ0eVN0cmluZyA9IGtleU5hbWUgPyBgXFxgJHtrZXlOYW1lfVxcYCBvbiBcXGAke29iak5hbWV9XFxgYCA6IGBcXGAke29iak5hbWV9XFxgYDtcblxuICAgICAgcmV0dXJuIGBZb3UgYXR0ZW1wdGVkIHRvIHVwZGF0ZSAke2RpcnR5U3RyaW5nfSwgYnV0IGl0IGhhZCBhbHJlYWR5IGJlZW4gdXNlZCBwcmV2aW91c2x5IGluIHRoZSBzYW1lIGNvbXB1dGF0aW9uLiAgQXR0ZW1wdGluZyB0byB1cGRhdGUgYSB2YWx1ZSBhZnRlciB1c2luZyBpdCBpbiBhIGNvbXB1dGF0aW9uIGNhbiBjYXVzZSBsb2dpY2FsIGVycm9ycywgaW5maW5pdGUgcmV2YWxpZGF0aW9uIGJ1Z3MsIGFuZCBwZXJmb3JtYW5jZSBpc3N1ZXMsIGFuZCBpcyBub3Qgc3VwcG9ydGVkLmA7XG4gICAgfSxcbiAgfTtcblxuICBzZXRUcmFja2luZ1RyYW5zYWN0aW9uRW52ID0gKGVudikgPT4gT2JqZWN0LmFzc2lnbihUUkFOU0FDVElPTl9FTlYsIGVudik7XG5cbiAgYmVnaW5UcmFja2luZ1RyYW5zYWN0aW9uID0gKF9kZWJ1Z0xhYmVsPzogc3RyaW5nIHwgZmFsc2UsIGRlcHJlY2F0ZSA9IGZhbHNlKSA9PiB7XG4gICAgQ09OU1VNRURfVEFHUyA9IENPTlNVTUVEX1RBR1MgfHwgbmV3IFdlYWtNYXAoKTtcblxuICAgIGxldCBkZWJ1Z0xhYmVsID0gX2RlYnVnTGFiZWwgfHwgdW5kZWZpbmVkO1xuXG4gICAgbGV0IHBhcmVudCA9IFRSQU5TQUNUSU9OX1NUQUNLW1RSQU5TQUNUSU9OX1NUQUNLLmxlbmd0aCAtIDFdIHx8IG51bGw7XG5cbiAgICBUUkFOU0FDVElPTl9TVEFDSy5wdXNoKHtcbiAgICAgIHBhcmVudCxcbiAgICAgIGRlYnVnTGFiZWwsXG4gICAgICBkZXByZWNhdGUsXG4gICAgfSk7XG4gIH07XG5cbiAgZW5kVHJhY2tpbmdUcmFuc2FjdGlvbiA9ICgpID0+IHtcbiAgICBpZiAoVFJBTlNBQ1RJT05fU1RBQ0subGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2F0dGVtcHRlZCB0byBjbG9zZSBhIHRyYWNraW5nIHRyYW5zYWN0aW9uLCBidXQgb25lIHdhcyBub3Qgb3BlbicpO1xuICAgIH1cblxuICAgIFRSQU5TQUNUSU9OX1NUQUNLLnBvcCgpO1xuXG4gICAgaWYgKFRSQU5TQUNUSU9OX1NUQUNLLmxlbmd0aCA9PT0gMCkge1xuICAgICAgQ09OU1VNRURfVEFHUyA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gIHJlc2V0VHJhY2tpbmdUcmFuc2FjdGlvbiA9ICgpID0+IHtcbiAgICBsZXQgc3RhY2sgPSAnJztcblxuICAgIGlmIChUUkFOU0FDVElPTl9TVEFDSy5sZW5ndGggPiAwKSB7XG4gICAgICBzdGFjayA9IGxvZ1RyYWNraW5nU3RhY2shKFRSQU5TQUNUSU9OX1NUQUNLW1RSQU5TQUNUSU9OX1NUQUNLLmxlbmd0aCAtIDFdKTtcbiAgICB9XG5cbiAgICBUUkFOU0FDVElPTl9TVEFDSyA9IFtdO1xuICAgIENPTlNVTUVEX1RBR1MgPSBudWxsO1xuXG4gICAgcmV0dXJuIHN0YWNrO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZ2xvYmFsIGF1dG90cmFja2luZyB0cmFuc2FjdGlvbi4gVGhpcyB3aWxsIHByZXZlbnQgYW55IGJhY2tmbG93XG4gICAqIGluIGFueSBgdHJhY2tgIGNhbGxzIHdpdGhpbiB0aGUgdHJhbnNhY3Rpb24sIGV2ZW4gaWYgdGhleSBhcmUgbm90XG4gICAqIGV4dGVybmFsbHkgY29uc3VtZWQuXG4gICAqXG4gICAqIGBydW5JbkF1dG90cmFja2luZ1RyYW5zYWN0aW9uYCBjYW4gYmUgY2FsbGVkIHdpdGhpbiBpdHNlbGYsIGFuZCBpdCB3aWxsIGFkZFxuICAgKiBvbnRvIHRoZSBleGlzdGluZyB0cmFuc2FjdGlvbiBpZiBvbmUgZXhpc3RzLlxuICAgKlxuICAgKiBUT0RPOiBPbmx5IHRocm93IGFuIGVycm9yIGlmIHRoZSBgdHJhY2tgIGlzIGNvbnN1bWVkLlxuICAgKi9cbiAgcnVuSW5UcmFja2luZ1RyYW5zYWN0aW9uID0gPFQ+KGZuOiAoKSA9PiBULCBkZWJ1Z0xhYmVsPzogc3RyaW5nIHwgZmFsc2UpID0+IHtcbiAgICBiZWdpblRyYWNraW5nVHJhbnNhY3Rpb24hKGRlYnVnTGFiZWwpO1xuICAgIGxldCBkaWRFcnJvciA9IHRydWU7XG5cbiAgICB0cnkge1xuICAgICAgbGV0IHZhbHVlID0gZm4oKTtcbiAgICAgIGRpZEVycm9yID0gZmFsc2U7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChkaWRFcnJvciAhPT0gdHJ1ZSkge1xuICAgICAgICBlbmRUcmFja2luZ1RyYW5zYWN0aW9uISgpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogU3dpdGNoZXMgdG8gZGVwcmVjYXRpbmcgd2l0aGluIGFuIGF1dG90cmFja2luZyB0cmFuc2FjdGlvbiwgaWYgb25lIGV4aXN0cy5cbiAgICogSWYgYHJ1bkluQXV0b3RyYWNraW5nVHJhbnNhY3Rpb25gIGlzIGNhbGxlZCB3aXRoaW4gdGhlIGNhbGxiYWNrIG9mIHRoaXNcbiAgICogbWV0aG9kLCBpdCBzd2l0Y2hlcyBiYWNrIHRvIHRocm93aW5nIGFuIGVycm9yLCBhbGxvd2luZyB6ZWJyYS1zdHJpcGluZyBvZlxuICAgKiB0aGUgdHlwZXMgb2YgZXJyb3JzIHRoYXQgYXJlIHRocm93bi5cbiAgICpcbiAgICogRG9lcyBub3Qgc3RhcnQgYW4gYXV0b3RyYWNraW5nIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBOT1RFOiBGb3IgRW1iZXIgdXNhZ2Ugb25seSwgaW4gZ2VuZXJhbCB5b3Ugc2hvdWxkIGFzc2VydCB0aGF0IHRoZXNlXG4gICAqIGludmFyaWFudHMgYXJlIHRydWUuXG4gICAqL1xuICBkZXByZWNhdGVNdXRhdGlvbnNJblRyYWNraW5nVHJhbnNhY3Rpb24gPSAoZm46ICgpID0+IHZvaWQsIGRlYnVnTGFiZWw/OiBzdHJpbmcgfCBmYWxzZSkgPT4ge1xuICAgIGJlZ2luVHJhY2tpbmdUcmFuc2FjdGlvbiEoZGVidWdMYWJlbCwgdHJ1ZSk7XG5cbiAgICB0cnkge1xuICAgICAgZm4oKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgZW5kVHJhY2tpbmdUcmFuc2FjdGlvbiEoKTtcbiAgICB9XG4gIH07XG5cbiAgbGV0IG50aEluZGV4ID0gKHN0cjogc3RyaW5nLCBwYXR0ZXJuOiBzdHJpbmcsIG46IG51bWJlciwgc3RhcnRpbmdQb3MgPSAtMSkgPT4ge1xuICAgIGxldCBpID0gc3RhcnRpbmdQb3M7XG5cbiAgICB3aGlsZSAobi0tID4gMCAmJiBpKysgPCBzdHIubGVuZ3RoKSB7XG4gICAgICBpID0gc3RyLmluZGV4T2YocGF0dGVybiwgaSk7XG4gICAgICBpZiAoaSA8IDApIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiBpO1xuICB9O1xuXG4gIGxldCBtYWtlVHJhY2tpbmdFcnJvck1lc3NhZ2UgPSA8VD4oXG4gICAgdHJhbnNhY3Rpb246IFRyYW5zYWN0aW9uLFxuICAgIG9iaj86IFQsXG4gICAga2V5TmFtZT86IGtleW9mIFQgfCBzdHJpbmcgfCBzeW1ib2xcbiAgKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2UgPSBbVFJBTlNBQ1RJT05fRU5WLmRlYnVnTWVzc2FnZShvYmosIGtleU5hbWUgJiYgU3RyaW5nKGtleU5hbWUpKV07XG5cbiAgICBtZXNzYWdlLnB1c2goYFxcYCR7U3RyaW5nKGtleU5hbWUpfVxcYCB3YXMgZmlyc3QgdXNlZDpgKTtcblxuICAgIG1lc3NhZ2UucHVzaChsb2dUcmFja2luZ1N0YWNrISh0cmFuc2FjdGlvbikpO1xuXG4gICAgbWVzc2FnZS5wdXNoKGBTdGFjayB0cmFjZSBmb3IgdGhlIHVwZGF0ZTpgKTtcblxuICAgIHJldHVybiBtZXNzYWdlLmpvaW4oJ1xcblxcbicpO1xuICB9O1xuXG4gIGxvZ1RyYWNraW5nU3RhY2sgPSAodHJhbnNhY3Rpb24/OiBUcmFuc2FjdGlvbikgPT4ge1xuICAgIGxldCB0cmFja2luZ1N0YWNrID0gW107XG4gICAgbGV0IGN1cnJlbnQ6IFRyYW5zYWN0aW9uIHwgbnVsbCB8IHVuZGVmaW5lZCA9XG4gICAgICB0cmFuc2FjdGlvbiB8fCBUUkFOU0FDVElPTl9TVEFDS1tUUkFOU0FDVElPTl9TVEFDSy5sZW5ndGggLSAxXTtcblxuICAgIGlmIChjdXJyZW50ID09PSB1bmRlZmluZWQpIHJldHVybiAnJztcblxuICAgIHdoaWxlIChjdXJyZW50KSB7XG4gICAgICBpZiAoY3VycmVudC5kZWJ1Z0xhYmVsKSB7XG4gICAgICAgIHRyYWNraW5nU3RhY2sudW5zaGlmdChjdXJyZW50LmRlYnVnTGFiZWwpO1xuICAgICAgfVxuXG4gICAgICBjdXJyZW50ID0gY3VycmVudC5wYXJlbnQ7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogVXNlIFN0cmluZy5wcm90b3R5cGUucmVwZWF0IGhlcmUgb25jZSB3ZSBjYW4gZHJvcCBzdXBwb3J0IGZvciBJRTExXG4gICAgcmV0dXJuIHRyYWNraW5nU3RhY2subWFwKChsYWJlbCwgaW5kZXgpID0+IEFycmF5KDIgKiBpbmRleCArIDEpLmpvaW4oJyAnKSArIGxhYmVsKS5qb2luKCdcXG4nKTtcbiAgfTtcblxuICBtYXJrVGFnQXNDb25zdW1lZCA9IChfdGFnOiBUYWcpID0+IHtcbiAgICBpZiAoIUNPTlNVTUVEX1RBR1MgfHwgQ09OU1VNRURfVEFHUy5oYXMoX3RhZykpIHJldHVybjtcblxuICAgIENPTlNVTUVEX1RBR1Muc2V0KF90YWcsIFRSQU5TQUNUSU9OX1NUQUNLW1RSQU5TQUNUSU9OX1NUQUNLLmxlbmd0aCAtIDFdKTtcblxuICAgIC8vIFdlIG5lZWQgdG8gbWFyayB0aGUgdGFnIGFuZCBhbGwgb2YgaXRzIHN1YnRhZ3MgYXMgY29uc3VtZWQsIHNvIHdlIG5lZWQgdG9cbiAgICAvLyBjYXN0IGl0IGFuZCBhY2Nlc3MgaXRzIGludGVybmFscy4gSW4gdGhlIGZ1dHVyZSB0aGlzIHNob3VsZG4ndCBiZSBuZWNlc3NhcnksXG4gICAgLy8gdGhpcyBpcyBvbmx5IGZvciBjb21wdXRlZCBwcm9wZXJ0aWVzLlxuICAgIGxldCB0YWcgPSBfdGFnIGFzIGFueTtcblxuICAgIGlmICh0YWcuc3VidGFnKSB7XG4gICAgICBtYXJrVGFnQXNDb25zdW1lZCEodGFnLnN1YnRhZyk7XG4gICAgfVxuXG4gICAgaWYgKHRhZy5zdWJ0YWdzKSB7XG4gICAgICB0YWcuc3VidGFncy5mb3JFYWNoKCh0YWc6IFRhZykgPT4gbWFya1RhZ0FzQ29uc3VtZWQhKHRhZykpO1xuICAgIH1cbiAgfTtcblxuICBhc3NlcnRUYWdOb3RDb25zdW1lZCA9IDxUPih0YWc6IFRhZywgb2JqPzogVCwga2V5TmFtZT86IGtleW9mIFQgfCBzdHJpbmcgfCBzeW1ib2wpID0+IHtcbiAgICBpZiAoQ09OU1VNRURfVEFHUyA9PT0gbnVsbCkgcmV0dXJuO1xuXG4gICAgbGV0IHRyYW5zYWN0aW9uID0gQ09OU1VNRURfVEFHUy5nZXQodGFnKTtcblxuICAgIGlmICghdHJhbnNhY3Rpb24pIHJldHVybjtcblxuICAgIGxldCBjdXJyZW50VHJhbnNhY3Rpb24gPSBUUkFOU0FDVElPTl9TVEFDS1tUUkFOU0FDVElPTl9TVEFDSy5sZW5ndGggLSAxXTtcblxuICAgIGlmIChjdXJyZW50VHJhbnNhY3Rpb24uZGVwcmVjYXRlKSB7XG4gICAgICBUUkFOU0FDVElPTl9FTlYuZGVwcmVjYXRlKG1ha2VUcmFja2luZ0Vycm9yTWVzc2FnZSh0cmFuc2FjdGlvbiwgb2JqLCBrZXlOYW1lKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRoaXMgaGFjayBtYWtlcyB0aGUgYXNzZXJ0aW9uIG1lc3NhZ2UgbmljZXIsIHdlIGNhbiBjdXQgb2ZmIHRoZSBmaXJzdFxuICAgICAgLy8gZmV3IGxpbmVzIG9mIHRoZSBzdGFjayB0cmFjZSBhbmQgbGV0IHVzZXJzIGtub3cgd2hlcmUgdGhlIGFjdHVhbCBlcnJvclxuICAgICAgLy8gb2NjdXJyZWQuXG4gICAgICB0cnkge1xuICAgICAgICBUUkFOU0FDVElPTl9FTlYuYXNzZXJ0KG1ha2VUcmFja2luZ0Vycm9yTWVzc2FnZSh0cmFuc2FjdGlvbiwgb2JqLCBrZXlOYW1lKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmIChlLnN0YWNrKSB7XG4gICAgICAgICAgbGV0IHVwZGF0ZVN0YWNrQmVnaW4gPSBlLnN0YWNrLmluZGV4T2YoJ1N0YWNrIHRyYWNlIGZvciB0aGUgdXBkYXRlOicpO1xuXG4gICAgICAgICAgaWYgKHVwZGF0ZVN0YWNrQmVnaW4gIT09IC0xKSB7XG4gICAgICAgICAgICBsZXQgc3RhcnQgPSBudGhJbmRleChlLnN0YWNrLCAnXFxuJywgMSwgdXBkYXRlU3RhY2tCZWdpbik7XG4gICAgICAgICAgICBsZXQgZW5kID0gbnRoSW5kZXgoZS5zdGFjaywgJ1xcbicsIDQsIHVwZGF0ZVN0YWNrQmVnaW4pO1xuICAgICAgICAgICAgZS5zdGFjayA9IGUuc3RhY2suc3Vic3RyKDAsIHN0YXJ0KSArIGUuc3RhY2suc3Vic3RyKGVuZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG4iXSwic291cmNlUm9vdCI6IiJ9
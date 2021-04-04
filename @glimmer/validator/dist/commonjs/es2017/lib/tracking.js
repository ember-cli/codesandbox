"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.beginTrackFrame = beginTrackFrame;
exports.endTrackFrame = endTrackFrame;
exports.beginUntrackFrame = beginUntrackFrame;
exports.endUntrackFrame = endUntrackFrame;
exports.resetTracking = resetTracking;
exports.isTracking = isTracking;
exports.consumeTag = consumeTag;
exports.createCache = createCache;
exports.getValue = getValue;
exports.isConst = isConst;
exports.track = track;
exports.untrack = untrack;

var _env = require("@glimmer/env");

var _validators = require("./validators");

var _debug = require("./debug");

var _utils = require("./utils");

/**
 * An object that that tracks @tracked properties that were consumed.
 */
class Tracker {
  constructor() {
    this.tags = new Set();
    this.last = null;
  }

  add(tag) {
    if (tag === _validators.CONSTANT_TAG) return;
    this.tags.add(tag);

    if (_env.DEBUG) {
      (0, _utils.unwrap)(_debug.markTagAsConsumed)(tag);
    }

    this.last = tag;
  }

  combine() {
    let {
      tags
    } = this;

    if (tags.size === 0) {
      return _validators.CONSTANT_TAG;
    } else if (tags.size === 1) {
      return this.last;
    } else {
      let tagsArr = [];
      tags.forEach(tag => tagsArr.push(tag));
      return (0, _validators.combine)(tagsArr);
    }
  }

}
/**
 * Whenever a tracked computed property is entered, the current tracker is
 * saved off and a new tracker is replaced.
 *
 * Any tracked properties consumed are added to the current tracker.
 *
 * When a tracked computed property is exited, the tracker's tags are
 * combined and added to the parent tracker.
 *
 * The consequence is that each tracked computed property has a tag
 * that corresponds to the tracked properties consumed inside of
 * itself, including child tracked computed properties.
 */


let CURRENT_TRACKER = null;
const OPEN_TRACK_FRAMES = [];

function beginTrackFrame(debuggingContext) {
  OPEN_TRACK_FRAMES.push(CURRENT_TRACKER);
  CURRENT_TRACKER = new Tracker();

  if (_env.DEBUG) {
    (0, _utils.unwrap)(_debug.beginTrackingTransaction)(debuggingContext);
  }
}

function endTrackFrame() {
  let current = CURRENT_TRACKER;

  if (_env.DEBUG) {
    if (OPEN_TRACK_FRAMES.length === 0) {
      throw new Error('attempted to close a tracking frame, but one was not open');
    }

    (0, _utils.unwrap)(_debug.endTrackingTransaction)();
  }

  CURRENT_TRACKER = OPEN_TRACK_FRAMES.pop() || null;
  return (0, _utils.unwrap)(current).combine();
}

function beginUntrackFrame() {
  OPEN_TRACK_FRAMES.push(CURRENT_TRACKER);
  CURRENT_TRACKER = null;
}

function endUntrackFrame() {
  if (_env.DEBUG && OPEN_TRACK_FRAMES.length === 0) {
    throw new Error('attempted to close a tracking frame, but one was not open');
  }

  CURRENT_TRACKER = OPEN_TRACK_FRAMES.pop() || null;
} // This function is only for handling errors and resetting to a valid state


function resetTracking() {
  while (OPEN_TRACK_FRAMES.length > 0) {
    OPEN_TRACK_FRAMES.pop();
  }

  CURRENT_TRACKER = null;

  if (_env.DEBUG) {
    return (0, _utils.unwrap)(_debug.resetTrackingTransaction)();
  }
}

function isTracking() {
  return CURRENT_TRACKER !== null;
}

function consumeTag(tag) {
  if (CURRENT_TRACKER !== null) {
    CURRENT_TRACKER.add(tag);
  }
} //////////


const CACHE_KEY = (0, _utils.symbol)('CACHE_KEY');
const FN = (0, _utils.symbol)('FN');
const LAST_VALUE = (0, _utils.symbol)('LAST_VALUE');
const TAG = (0, _utils.symbol)('TAG');
const SNAPSHOT = (0, _utils.symbol)('SNAPSHOT');
const DEBUG_LABEL = (0, _utils.symbol)('DEBUG_LABEL');

function createCache(fn, debuggingLabel) {
  if (_env.DEBUG && !(typeof fn === 'function')) {
    throw new Error(`createCache() must be passed a function as its first parameter. Called with: ${String(fn)}`);
  }

  let cache = {
    [FN]: fn,
    [LAST_VALUE]: undefined,
    [TAG]: undefined,
    [SNAPSHOT]: -1
  };

  if (_env.DEBUG) {
    cache[DEBUG_LABEL] = debuggingLabel;
  }

  return cache;
}

function getValue(cache) {
  assertCache(cache, 'getValue');
  let fn = cache[FN];
  let tag = cache[TAG];
  let snapshot = cache[SNAPSHOT];

  if (tag === undefined || !(0, _validators.validateTag)(tag, snapshot)) {
    beginTrackFrame();

    try {
      cache[LAST_VALUE] = fn();
    } finally {
      tag = endTrackFrame();
      cache[TAG] = tag;
      cache[SNAPSHOT] = (0, _validators.valueForTag)(tag);
      consumeTag(tag);
    }
  } else {
    consumeTag(tag);
  }

  return cache[LAST_VALUE];
}

function isConst(cache) {
  assertCache(cache, 'isConst');
  let tag = cache[TAG];
  assertTag(tag, cache);
  return (0, _validators.isConstTag)(tag);
}

function assertCache(value, fnName) {
  if (_env.DEBUG && !(typeof value === 'object' && value !== null && FN in value)) {
    throw new Error(`${fnName}() can only be used on an instance of a cache created with createCache(). Called with: ${String(value)}`);
  }
} // replace this with `expect` when we can


function assertTag(tag, cache) {
  if (_env.DEBUG && tag === undefined) {
    throw new Error(`isConst() can only be used on a cache once getValue() has been called at least once. Called with cache function:\n\n${String(cache[FN])}`);
  }
} //////////
// Legacy tracking APIs
// track() shouldn't be necessary at all in the VM once the autotracking
// refactors are merged, and we should generally be moving away from it. It may
// be necessary in Ember for a while longer, but I think we'll be able to drop
// it in favor of cache sooner rather than later.


function track(callback, debugLabel) {
  beginTrackFrame(debugLabel);
  let tag;

  try {
    callback();
  } finally {
    tag = endTrackFrame();
  }

  return tag;
} // untrack() is currently mainly used to handle places that were previously not
// tracked, and that tracking now would cause backtracking rerender assertions.
// I think once we move everyone forward onto modern APIs, we'll probably be
// able to remove it, but I'm not sure yet.


function untrack(callback) {
  beginUntrackFrame();

  try {
    return callback();
  } finally {
    endUntrackFrame();
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3ZhbGlkYXRvci9saWIvdHJhY2tpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBVUE7O0FBTUE7O0FBSUE7OztBQUdBLE1BQUEsT0FBQSxDQUFhO0FBQWIsRUFBQSxXQUFBLEdBQUE7QUFDVSxTQUFBLElBQUEsR0FBTyxJQUFQLEdBQU8sRUFBUDtBQUNBLFNBQUEsSUFBQSxHQUFBLElBQUE7QUEyQlQ7O0FBekJDLEVBQUEsR0FBRyxDQUFBLEdBQUEsRUFBUztBQUNWLFFBQUksR0FBRyxLQUFQLHdCQUFBLEVBQTBCO0FBRTFCLFNBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBOztBQUVBLFFBQUEsVUFBQSxFQUFXO0FBQ1QseUJBQUEsd0JBQUEsRUFBQSxHQUFBO0FBQ0Q7O0FBRUQsU0FBQSxJQUFBLEdBQUEsR0FBQTtBQUNEOztBQUVELEVBQUEsT0FBTyxHQUFBO0FBQ0wsUUFBSTtBQUFFLE1BQUE7QUFBRixRQUFKLElBQUE7O0FBRUEsUUFBSSxJQUFJLENBQUosSUFBQSxLQUFKLENBQUEsRUFBcUI7QUFDbkIsYUFBQSx3QkFBQTtBQURGLEtBQUEsTUFFTyxJQUFJLElBQUksQ0FBSixJQUFBLEtBQUosQ0FBQSxFQUFxQjtBQUMxQixhQUFPLEtBQVAsSUFBQTtBQURLLEtBQUEsTUFFQTtBQUNMLFVBQUksT0FBTyxHQUFYLEVBQUE7QUFDQSxNQUFBLElBQUksQ0FBSixPQUFBLENBQWMsR0FBRCxJQUFTLE9BQU8sQ0FBUCxJQUFBLENBQXRCLEdBQXNCLENBQXRCO0FBQ0EsYUFBTyx5QkFBUCxPQUFPLENBQVA7QUFDRDtBQUNGOztBQTVCVTtBQStCYjs7Ozs7Ozs7Ozs7Ozs7O0FBYUEsSUFBSSxlQUFlLEdBQW5CLElBQUE7QUFFQSxNQUFNLGlCQUFpQixHQUF2QixFQUFBOztBQUVNLFNBQUEsZUFBQSxDQUFBLGdCQUFBLEVBQTJEO0FBQy9E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LE1BQUksY0FBUyxHQUFHLEtBQWhCLFNBQUEsRUFBZ0M7QUFDOUIsVUFBTSxJQUFBLEtBQUEsQ0FDSix1SEFBdUgsTUFBTSxDQUMzSCxLQUFLLENBRHNILEVBQ3RILENBRHNILENBRC9ILEVBQU0sQ0FBTjtBQUtEO0VBR0g7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUNBOzs7QUFDTSxTQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQSxFQUFpRTtBQUNyRSxFQUFBLGVBQWUsQ0FBZixVQUFlLENBQWY7QUFFQSxNQUFBLEdBQUE7O0FBRUEsTUFBSTtBQUNGLElBQUEsUUFBUTtBQURWLEdBQUEsU0FFVTtBQUNSLElBQUEsR0FBRyxHQUFHLGFBQU4sRUFBQTtBQUNEOztBQUVELFNBQUEsR0FBQTtFQUdGO0FBQ0E7QUFDQTtBQUNBOzs7QUFDTSxTQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQXNDO0FBQzFDLEVBQUEsaUJBQWlCOztBQUVqQixNQUFJO0FBQ0YsV0FBTyxRQUFQLEVBQUE7QUFERixHQUFBLFNBRVU7QUFDUixJQUFBLGVBQWU7QUFDaEI7QUFDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERFQlVHIH0gZnJvbSAnQGdsaW1tZXIvZW52JztcbmltcG9ydCB7XG4gIFRhZyxcbiAgQ09OU1RBTlRfVEFHLFxuICB2YWxpZGF0ZVRhZyxcbiAgUmV2aXNpb24sXG4gIHZhbHVlRm9yVGFnLFxuICBpc0NvbnN0VGFnLFxuICBjb21iaW5lLFxufSBmcm9tICcuL3ZhbGlkYXRvcnMnO1xuXG5pbXBvcnQge1xuICBtYXJrVGFnQXNDb25zdW1lZCxcbiAgYmVnaW5UcmFja2luZ1RyYW5zYWN0aW9uLFxuICBlbmRUcmFja2luZ1RyYW5zYWN0aW9uLFxuICByZXNldFRyYWNraW5nVHJhbnNhY3Rpb24sXG59IGZyb20gJy4vZGVidWcnO1xuaW1wb3J0IHsgc3ltYm9sLCB1bndyYXAgfSBmcm9tICcuL3V0aWxzJztcblxudHlwZSBPcHRpb248VD4gPSBUIHwgbnVsbDtcblxuLyoqXG4gKiBBbiBvYmplY3QgdGhhdCB0aGF0IHRyYWNrcyBAdHJhY2tlZCBwcm9wZXJ0aWVzIHRoYXQgd2VyZSBjb25zdW1lZC5cbiAqL1xuY2xhc3MgVHJhY2tlciB7XG4gIHByaXZhdGUgdGFncyA9IG5ldyBTZXQ8VGFnPigpO1xuICBwcml2YXRlIGxhc3Q6IE9wdGlvbjxUYWc+ID0gbnVsbDtcblxuICBhZGQodGFnOiBUYWcpIHtcbiAgICBpZiAodGFnID09PSBDT05TVEFOVF9UQUcpIHJldHVybjtcblxuICAgIHRoaXMudGFncy5hZGQodGFnKTtcblxuICAgIGlmIChERUJVRykge1xuICAgICAgdW53cmFwKG1hcmtUYWdBc0NvbnN1bWVkKSh0YWcpO1xuICAgIH1cblxuICAgIHRoaXMubGFzdCA9IHRhZztcbiAgfVxuXG4gIGNvbWJpbmUoKTogVGFnIHtcbiAgICBsZXQgeyB0YWdzIH0gPSB0aGlzO1xuXG4gICAgaWYgKHRhZ3Muc2l6ZSA9PT0gMCkge1xuICAgICAgcmV0dXJuIENPTlNUQU5UX1RBRztcbiAgICB9IGVsc2UgaWYgKHRhZ3Muc2l6ZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIHRoaXMubGFzdCBhcyBUYWc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB0YWdzQXJyOiBUYWdbXSA9IFtdO1xuICAgICAgdGFncy5mb3JFYWNoKCh0YWcpID0+IHRhZ3NBcnIucHVzaCh0YWcpKTtcbiAgICAgIHJldHVybiBjb21iaW5lKHRhZ3NBcnIpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFdoZW5ldmVyIGEgdHJhY2tlZCBjb21wdXRlZCBwcm9wZXJ0eSBpcyBlbnRlcmVkLCB0aGUgY3VycmVudCB0cmFja2VyIGlzXG4gKiBzYXZlZCBvZmYgYW5kIGEgbmV3IHRyYWNrZXIgaXMgcmVwbGFjZWQuXG4gKlxuICogQW55IHRyYWNrZWQgcHJvcGVydGllcyBjb25zdW1lZCBhcmUgYWRkZWQgdG8gdGhlIGN1cnJlbnQgdHJhY2tlci5cbiAqXG4gKiBXaGVuIGEgdHJhY2tlZCBjb21wdXRlZCBwcm9wZXJ0eSBpcyBleGl0ZWQsIHRoZSB0cmFja2VyJ3MgdGFncyBhcmVcbiAqIGNvbWJpbmVkIGFuZCBhZGRlZCB0byB0aGUgcGFyZW50IHRyYWNrZXIuXG4gKlxuICogVGhlIGNvbnNlcXVlbmNlIGlzIHRoYXQgZWFjaCB0cmFja2VkIGNvbXB1dGVkIHByb3BlcnR5IGhhcyBhIHRhZ1xuICogdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgdHJhY2tlZCBwcm9wZXJ0aWVzIGNvbnN1bWVkIGluc2lkZSBvZlxuICogaXRzZWxmLCBpbmNsdWRpbmcgY2hpbGQgdHJhY2tlZCBjb21wdXRlZCBwcm9wZXJ0aWVzLlxuICovXG5sZXQgQ1VSUkVOVF9UUkFDS0VSOiBPcHRpb248VHJhY2tlcj4gPSBudWxsO1xuXG5jb25zdCBPUEVOX1RSQUNLX0ZSQU1FUzogT3B0aW9uPFRyYWNrZXI+W10gPSBbXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGJlZ2luVHJhY2tGcmFtZShkZWJ1Z2dpbmdDb250ZXh0Pzogc3RyaW5nIHwgZmFsc2UpOiB2b2lkIHtcbiAgT1BFTl9UUkFDS19GUkFNRVMucHVzaChDVVJSRU5UX1RSQUNLRVIpO1xuXG4gIENVUlJFTlRfVFJBQ0tFUiA9IG5ldyBUcmFja2VyKCk7XG5cbiAgaWYgKERFQlVHKSB7XG4gICAgdW53cmFwKGJlZ2luVHJhY2tpbmdUcmFuc2FjdGlvbikoZGVidWdnaW5nQ29udGV4dCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuZFRyYWNrRnJhbWUoKTogVGFnIHtcbiAgbGV0IGN1cnJlbnQgPSBDVVJSRU5UX1RSQUNLRVI7XG5cbiAgaWYgKERFQlVHKSB7XG4gICAgaWYgKE9QRU5fVFJBQ0tfRlJBTUVTLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdhdHRlbXB0ZWQgdG8gY2xvc2UgYSB0cmFja2luZyBmcmFtZSwgYnV0IG9uZSB3YXMgbm90IG9wZW4nKTtcbiAgICB9XG5cbiAgICB1bndyYXAoZW5kVHJhY2tpbmdUcmFuc2FjdGlvbikoKTtcbiAgfVxuXG4gIENVUlJFTlRfVFJBQ0tFUiA9IE9QRU5fVFJBQ0tfRlJBTUVTLnBvcCgpIHx8IG51bGw7XG5cbiAgcmV0dXJuIHVud3JhcChjdXJyZW50KS5jb21iaW5lKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiZWdpblVudHJhY2tGcmFtZSgpOiB2b2lkIHtcbiAgT1BFTl9UUkFDS19GUkFNRVMucHVzaChDVVJSRU5UX1RSQUNLRVIpO1xuICBDVVJSRU5UX1RSQUNLRVIgPSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5kVW50cmFja0ZyYW1lKCk6IHZvaWQge1xuICBpZiAoREVCVUcgJiYgT1BFTl9UUkFDS19GUkFNRVMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdhdHRlbXB0ZWQgdG8gY2xvc2UgYSB0cmFja2luZyBmcmFtZSwgYnV0IG9uZSB3YXMgbm90IG9wZW4nKTtcbiAgfVxuXG4gIENVUlJFTlRfVFJBQ0tFUiA9IE9QRU5fVFJBQ0tfRlJBTUVTLnBvcCgpIHx8IG51bGw7XG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSBmb3IgaGFuZGxpbmcgZXJyb3JzIGFuZCByZXNldHRpbmcgdG8gYSB2YWxpZCBzdGF0ZVxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0VHJhY2tpbmcoKTogc3RyaW5nIHwgdm9pZCB7XG4gIHdoaWxlIChPUEVOX1RSQUNLX0ZSQU1FUy5sZW5ndGggPiAwKSB7XG4gICAgT1BFTl9UUkFDS19GUkFNRVMucG9wKCk7XG4gIH1cblxuICBDVVJSRU5UX1RSQUNLRVIgPSBudWxsO1xuXG4gIGlmIChERUJVRykge1xuICAgIHJldHVybiB1bndyYXAocmVzZXRUcmFja2luZ1RyYW5zYWN0aW9uKSgpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1RyYWNraW5nKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gQ1VSUkVOVF9UUkFDS0VSICE9PSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZVRhZyh0YWc6IFRhZyk6IHZvaWQge1xuICBpZiAoQ1VSUkVOVF9UUkFDS0VSICE9PSBudWxsKSB7XG4gICAgQ1VSUkVOVF9UUkFDS0VSLmFkZCh0YWcpO1xuICB9XG59XG5cbi8vLy8vLy8vLy9cblxuY29uc3QgQ0FDSEVfS0VZOiB1bmlxdWUgc3ltYm9sID0gc3ltYm9sKCdDQUNIRV9LRVknKTtcblxuLy8gcHVibGljIGludGVyZmFjZVxuZXhwb3J0IGludGVyZmFjZSBDYWNoZTxUID0gdW5rbm93bj4ge1xuICBbQ0FDSEVfS0VZXTogVDtcbn1cblxuY29uc3QgRk46IHVuaXF1ZSBzeW1ib2wgPSBzeW1ib2woJ0ZOJyk7XG5jb25zdCBMQVNUX1ZBTFVFOiB1bmlxdWUgc3ltYm9sID0gc3ltYm9sKCdMQVNUX1ZBTFVFJyk7XG5jb25zdCBUQUc6IHVuaXF1ZSBzeW1ib2wgPSBzeW1ib2woJ1RBRycpO1xuY29uc3QgU05BUFNIT1Q6IHVuaXF1ZSBzeW1ib2wgPSBzeW1ib2woJ1NOQVBTSE9UJyk7XG5jb25zdCBERUJVR19MQUJFTDogdW5pcXVlIHN5bWJvbCA9IHN5bWJvbCgnREVCVUdfTEFCRUwnKTtcblxuaW50ZXJmYWNlIEludGVybmFsQ2FjaGU8VCA9IHVua25vd24+IHtcbiAgW0ZOXTogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gVDtcbiAgW0xBU1RfVkFMVUVdOiBUIHwgdW5kZWZpbmVkO1xuICBbVEFHXTogVGFnIHwgdW5kZWZpbmVkO1xuICBbU05BUFNIT1RdOiBSZXZpc2lvbjtcbiAgW0RFQlVHX0xBQkVMXT86IHN0cmluZyB8IGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ2FjaGU8VD4oZm46ICgpID0+IFQsIGRlYnVnZ2luZ0xhYmVsPzogc3RyaW5nIHwgZmFsc2UpOiBDYWNoZTxUPiB7XG4gIGlmIChERUJVRyAmJiAhKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgY3JlYXRlQ2FjaGUoKSBtdXN0IGJlIHBhc3NlZCBhIGZ1bmN0aW9uIGFzIGl0cyBmaXJzdCBwYXJhbWV0ZXIuIENhbGxlZCB3aXRoOiAke1N0cmluZyhmbil9YFxuICAgICk7XG4gIH1cblxuICBsZXQgY2FjaGU6IEludGVybmFsQ2FjaGU8VD4gPSB7XG4gICAgW0ZOXTogZm4sXG4gICAgW0xBU1RfVkFMVUVdOiB1bmRlZmluZWQsXG4gICAgW1RBR106IHVuZGVmaW5lZCxcbiAgICBbU05BUFNIT1RdOiAtMSxcbiAgfTtcblxuICBpZiAoREVCVUcpIHtcbiAgICBjYWNoZVtERUJVR19MQUJFTF0gPSBkZWJ1Z2dpbmdMYWJlbDtcbiAgfVxuXG4gIHJldHVybiAoY2FjaGUgYXMgdW5rbm93bikgYXMgQ2FjaGU8VD47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZTxUPihjYWNoZTogQ2FjaGU8VD4pOiBUIHwgdW5kZWZpbmVkIHtcbiAgYXNzZXJ0Q2FjaGUoY2FjaGUsICdnZXRWYWx1ZScpO1xuXG4gIGxldCBmbiA9IGNhY2hlW0ZOXTtcbiAgbGV0IHRhZyA9IGNhY2hlW1RBR107XG4gIGxldCBzbmFwc2hvdCA9IGNhY2hlW1NOQVBTSE9UXTtcblxuICBpZiAodGFnID09PSB1bmRlZmluZWQgfHwgIXZhbGlkYXRlVGFnKHRhZywgc25hcHNob3QpKSB7XG4gICAgYmVnaW5UcmFja0ZyYW1lKCk7XG5cbiAgICB0cnkge1xuICAgICAgY2FjaGVbTEFTVF9WQUxVRV0gPSBmbigpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0YWcgPSBlbmRUcmFja0ZyYW1lKCk7XG4gICAgICBjYWNoZVtUQUddID0gdGFnO1xuICAgICAgY2FjaGVbU05BUFNIT1RdID0gdmFsdWVGb3JUYWcodGFnKTtcbiAgICAgIGNvbnN1bWVUYWcodGFnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3VtZVRhZyh0YWcpO1xuICB9XG5cbiAgcmV0dXJuIGNhY2hlW0xBU1RfVkFMVUVdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb25zdChjYWNoZTogQ2FjaGUpOiBib29sZWFuIHtcbiAgYXNzZXJ0Q2FjaGUoY2FjaGUsICdpc0NvbnN0Jyk7XG5cbiAgbGV0IHRhZyA9IGNhY2hlW1RBR107XG5cbiAgYXNzZXJ0VGFnKHRhZywgY2FjaGUpO1xuXG4gIHJldHVybiBpc0NvbnN0VGFnKHRhZyk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydENhY2hlPFQ+KFxuICB2YWx1ZTogQ2FjaGU8VD4gfCBJbnRlcm5hbENhY2hlPFQ+LFxuICBmbk5hbWU6IHN0cmluZ1xuKTogYXNzZXJ0cyB2YWx1ZSBpcyBJbnRlcm5hbENhY2hlPFQ+IHtcbiAgaWYgKERFQlVHICYmICEodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCAmJiBGTiBpbiB2YWx1ZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgJHtmbk5hbWV9KCkgY2FuIG9ubHkgYmUgdXNlZCBvbiBhbiBpbnN0YW5jZSBvZiBhIGNhY2hlIGNyZWF0ZWQgd2l0aCBjcmVhdGVDYWNoZSgpLiBDYWxsZWQgd2l0aDogJHtTdHJpbmcoXG4gICAgICAgIHZhbHVlXG4gICAgICApfWBcbiAgICApO1xuICB9XG59XG5cbi8vIHJlcGxhY2UgdGhpcyB3aXRoIGBleHBlY3RgIHdoZW4gd2UgY2FuXG5mdW5jdGlvbiBhc3NlcnRUYWcodGFnOiBUYWcgfCB1bmRlZmluZWQsIGNhY2hlOiBJbnRlcm5hbENhY2hlKTogYXNzZXJ0cyB0YWcgaXMgVGFnIHtcbiAgaWYgKERFQlVHICYmIHRhZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYGlzQ29uc3QoKSBjYW4gb25seSBiZSB1c2VkIG9uIGEgY2FjaGUgb25jZSBnZXRWYWx1ZSgpIGhhcyBiZWVuIGNhbGxlZCBhdCBsZWFzdCBvbmNlLiBDYWxsZWQgd2l0aCBjYWNoZSBmdW5jdGlvbjpcXG5cXG4ke1N0cmluZyhcbiAgICAgICAgY2FjaGVbRk5dXG4gICAgICApfWBcbiAgICApO1xuICB9XG59XG5cbi8vLy8vLy8vLy9cblxuLy8gTGVnYWN5IHRyYWNraW5nIEFQSXNcblxuLy8gdHJhY2soKSBzaG91bGRuJ3QgYmUgbmVjZXNzYXJ5IGF0IGFsbCBpbiB0aGUgVk0gb25jZSB0aGUgYXV0b3RyYWNraW5nXG4vLyByZWZhY3RvcnMgYXJlIG1lcmdlZCwgYW5kIHdlIHNob3VsZCBnZW5lcmFsbHkgYmUgbW92aW5nIGF3YXkgZnJvbSBpdC4gSXQgbWF5XG4vLyBiZSBuZWNlc3NhcnkgaW4gRW1iZXIgZm9yIGEgd2hpbGUgbG9uZ2VyLCBidXQgSSB0aGluayB3ZSdsbCBiZSBhYmxlIHRvIGRyb3Bcbi8vIGl0IGluIGZhdm9yIG9mIGNhY2hlIHNvb25lciByYXRoZXIgdGhhbiBsYXRlci5cbmV4cG9ydCBmdW5jdGlvbiB0cmFjayhjYWxsYmFjazogKCkgPT4gdm9pZCwgZGVidWdMYWJlbD86IHN0cmluZyB8IGZhbHNlKTogVGFnIHtcbiAgYmVnaW5UcmFja0ZyYW1lKGRlYnVnTGFiZWwpO1xuXG4gIGxldCB0YWc7XG5cbiAgdHJ5IHtcbiAgICBjYWxsYmFjaygpO1xuICB9IGZpbmFsbHkge1xuICAgIHRhZyA9IGVuZFRyYWNrRnJhbWUoKTtcbiAgfVxuXG4gIHJldHVybiB0YWc7XG59XG5cbi8vIHVudHJhY2soKSBpcyBjdXJyZW50bHkgbWFpbmx5IHVzZWQgdG8gaGFuZGxlIHBsYWNlcyB0aGF0IHdlcmUgcHJldmlvdXNseSBub3Rcbi8vIHRyYWNrZWQsIGFuZCB0aGF0IHRyYWNraW5nIG5vdyB3b3VsZCBjYXVzZSBiYWNrdHJhY2tpbmcgcmVyZW5kZXIgYXNzZXJ0aW9ucy5cbi8vIEkgdGhpbmsgb25jZSB3ZSBtb3ZlIGV2ZXJ5b25lIGZvcndhcmQgb250byBtb2Rlcm4gQVBJcywgd2UnbGwgcHJvYmFibHkgYmVcbi8vIGFibGUgdG8gcmVtb3ZlIGl0LCBidXQgSSdtIG5vdCBzdXJlIHlldC5cbmV4cG9ydCBmdW5jdGlvbiB1bnRyYWNrPFQ+KGNhbGxiYWNrOiAoKSA9PiBUKTogVCB7XG4gIGJlZ2luVW50cmFja0ZyYW1lKCk7XG5cbiAgdHJ5IHtcbiAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBlbmRVbnRyYWNrRnJhbWUoKTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ==
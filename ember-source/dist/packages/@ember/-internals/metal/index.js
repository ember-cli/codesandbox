import { meta, peekMeta } from '@ember/-internals/meta';
import { setListeners, isObject, setupMandatorySetter, symbol, toString, enumerableSymbol, setWithMandatorySetter, Cache, HAS_NATIVE_PROXY, isEmberArray, setProxy, lookupDescriptor, inspect, getName, setName, guidFor, makeArray, observerListenerMetaFor, ROOT, setObservers, wrap } from '@ember/-internals/utils';
import { assert, deprecate, warn, debug } from '@ember/debug';
import { ENV, context } from '@ember/-internals/environment';
import { schedule } from '@ember/runloop';
import { registerDestructor, isDestroyed } from '@glimmer/destroyable';
import { CURRENT_TAG, tagMetaFor, validateTag, valueForTag, CONSTANT_TAG, dirtyTagFor, tagFor, combine, createUpdatableTag, updateTag, consumeTag, deprecateMutationsInTrackingTransaction, isTracking, track, ALLOW_CYCLES, untrack, trackedData } from '@glimmer/validator';
export { createCache, getValue, isConst } from '@glimmer/validator';
import { DEBUG } from '@glimmer/env';
import { getCustomTagFor } from '@glimmer/manager';
import { _WeakSet } from '@glimmer/util';
import EmberError from '@ember/error';
import VERSION from 'ember/version';
import { ALIAS_METHOD } from '@ember/deprecated-features';
import { assign } from '@ember/polyfills';
import { getOwner } from '@ember/-internals/owner';

/**
@module @ember/object
*/
/*
  The event system uses a series of nested hashes to store listeners on an
  object. When a listener is registered, or when an event arrives, these
  hashes are consulted to determine which target and action pair to invoke.

  The hashes are stored in the object's meta hash, and look like this:

      // Object's meta hash
      {
        listeners: {       // variable name: `listenerSet`
          "foo:change": [ // variable name: `actions`
            target, method, once
          ]
        }
      }

*/

/**
  Add an event listener

  @method addListener
  @static
  @for @ember/object/events
  @param obj
  @param {String} eventName
  @param {Object|Function} target A target object or a function
  @param {Function|String} method A function or the name of a function to be called on `target`
  @param {Boolean} once A flag whether a function should only be called once
  @public
*/

function addListener(obj, eventName, target, method, once, sync = true) {
  assert('You must pass at least an object and event name to addListener', Boolean(obj) && Boolean(eventName));

  if (!method && 'function' === typeof target) {
    method = target;
    target = null;
  }

  meta(obj).addToListeners(eventName, target, method, once === true, sync);
}
/**
  Remove an event listener

  Arguments should match those passed to `addListener`.

  @method removeListener
  @static
  @for @ember/object/events
  @param obj
  @param {String} eventName
  @param {Object|Function} target A target object or a function
  @param {Function|String} method A function or the name of a function to be called on `target`
  @public
*/

function removeListener(obj, eventName, targetOrFunction, functionOrName) {
  assert('You must pass at least an object, event name, and method or target and method/method name to removeListener', Boolean(obj) && Boolean(eventName) && (typeof targetOrFunction === 'function' || typeof targetOrFunction === 'object' && Boolean(functionOrName)));
  let target, method;

  if (typeof targetOrFunction === 'object') {
    target = targetOrFunction;
    method = functionOrName;
  } else {
    target = null;
    method = targetOrFunction;
  }

  let m = meta(obj);
  m.removeFromListeners(eventName, target, method);
}
/**
  Send an event. The execution of suspended listeners
  is skipped, and once listeners are removed. A listener without
  a target is executed on the passed object. If an array of actions
  is not passed, the actions stored on the passed object are invoked.

  @method sendEvent
  @static
  @for @ember/object/events
  @param obj
  @param {String} eventName
  @param {Array} params Optional parameters for each listener.
  @return {Boolean} if the event was delivered to one or more actions
  @public
*/

function sendEvent(obj, eventName, params, actions, _meta) {
  if (actions === undefined) {
    let meta$$1 = _meta === undefined ? peekMeta(obj) : _meta;
    actions = meta$$1 !== null ? meta$$1.matchingListeners(eventName) : undefined;
  }

  if (actions === undefined || actions.length === 0) {
    return false;
  }

  for (let i = actions.length - 3; i >= 0; i -= 3) {
    // looping in reverse for once listeners
    let target = actions[i];
    let method = actions[i + 1];
    let once = actions[i + 2];

    if (!method) {
      continue;
    }

    if (once) {
      removeListener(obj, eventName, target, method);
    }

    if (!target) {
      target = obj;
    }

    let type = typeof method;

    if (type === 'string' || type === 'symbol') {
      method = target[method];
    }

    method.apply(target, params);
  }

  return true;
}
/**
  @private
  @method hasListeners
  @static
  @for @ember/object/events
  @param obj
  @param {String} eventName
  @return {Boolean} if `obj` has listeners for event `eventName`
*/

function hasListeners(obj, eventName) {
  let meta$$1 = peekMeta(obj);

  if (meta$$1 === null) {
    return false;
  }

  let matched = meta$$1.matchingListeners(eventName);
  return matched !== undefined && matched.length > 0;
}
/**
  Define a property as a function that should be executed when
  a specified event or events are triggered.

  ``` javascript
  import EmberObject from '@ember/object';
  import { on } from '@ember/object/evented';
  import { sendEvent } from '@ember/object/events';

  let Job = EmberObject.extend({
    logCompleted: on('completed', function() {
      console.log('Job completed!');
    })
  });

  let job = Job.create();

  sendEvent(job, 'completed'); // Logs 'Job completed!'
 ```

  @method on
  @static
  @for @ember/object/evented
  @param {String} eventNames*
  @param {Function} func
  @return {Function} the listener function, passed as last argument to on(...)
  @public
*/

function on(...args) {
  let func = args.pop();
  let events = args;
  assert('on expects function as last argument', typeof func === 'function');
  assert('on called without valid event names', events.length > 0 && events.every(p => typeof p === 'string' && p.length > 0));
  setListeners(func, events);
  return func;
}

const AFTER_OBSERVERS = ':change';
function changeEvent(keyName) {
  return keyName + AFTER_OBSERVERS;
}

const SYNC_DEFAULT = !ENV._DEFAULT_ASYNC_OBSERVERS;
const SYNC_OBSERVERS = new Map();
const ASYNC_OBSERVERS = new Map();
/**
@module @ember/object
*/

/**
  @method addObserver
  @static
  @for @ember/object/observers
  @param obj
  @param {String} path
  @param {Object|Function} target
  @param {Function|String} [method]
  @public
*/

function addObserver(obj, path, target, method, sync = SYNC_DEFAULT) {
  let eventName = changeEvent(path);
  addListener(obj, eventName, target, method, false, sync);
  let meta$$1 = peekMeta(obj);

  if (meta$$1 === null || !(meta$$1.isPrototypeMeta(obj) || meta$$1.isInitializing())) {
    activateObserver(obj, eventName, sync);
  }
}
/**
  @method removeObserver
  @static
  @for @ember/object/observers
  @param obj
  @param {String} path
  @param {Object|Function} target
  @param {Function|String} [method]
  @public
*/

function removeObserver(obj, path, target, method, sync = SYNC_DEFAULT) {
  let eventName = changeEvent(path);
  let meta$$1 = peekMeta(obj);

  if (meta$$1 === null || !(meta$$1.isPrototypeMeta(obj) || meta$$1.isInitializing())) {
    deactivateObserver(obj, eventName, sync);
  }

  removeListener(obj, eventName, target, method);
}

function getOrCreateActiveObserversFor(target, sync) {
  let observerMap = sync === true ? SYNC_OBSERVERS : ASYNC_OBSERVERS;

  if (!observerMap.has(target)) {
    observerMap.set(target, new Map());
    registerDestructor(target, () => destroyObservers(target), true);
  }

  return observerMap.get(target);
}

function activateObserver(target, eventName, sync = false) {
  let activeObservers = getOrCreateActiveObserversFor(target, sync);

  if (activeObservers.has(eventName)) {
    activeObservers.get(eventName).count++;
  } else {
    let [path] = eventName.split(':');
    let tag = getChainTagsForKey(target, path, tagMetaFor(target), peekMeta(target));
    activeObservers.set(eventName, {
      count: 1,
      path,
      tag,
      lastRevision: valueForTag(tag),
      suspended: false
    });
  }
}
let DEACTIVATE_SUSPENDED = false;
let SCHEDULED_DEACTIVATE = [];
function deactivateObserver(target, eventName, sync = false) {
  if (DEACTIVATE_SUSPENDED === true) {
    SCHEDULED_DEACTIVATE.push([target, eventName, sync]);
    return;
  }

  let observerMap = sync === true ? SYNC_OBSERVERS : ASYNC_OBSERVERS;
  let activeObservers = observerMap.get(target);

  if (activeObservers !== undefined) {
    let observer = activeObservers.get(eventName);
    observer.count--;

    if (observer.count === 0) {
      activeObservers.delete(eventName);

      if (activeObservers.size === 0) {
        observerMap.delete(target);
      }
    }
  }
}
function suspendedObserverDeactivation() {
  DEACTIVATE_SUSPENDED = true;
}
function resumeObserverDeactivation() {
  DEACTIVATE_SUSPENDED = false;

  for (let [target, eventName, sync] of SCHEDULED_DEACTIVATE) {
    deactivateObserver(target, eventName, sync);
  }

  SCHEDULED_DEACTIVATE = [];
}
/**
 * Primarily used for cases where we are redefining a class, e.g. mixins/reopen
 * being applied later. Revalidates all the observers, resetting their tags.
 *
 * @private
 * @param target
 */

function revalidateObservers(target) {
  if (ASYNC_OBSERVERS.has(target)) {
    ASYNC_OBSERVERS.get(target).forEach(observer => {
      observer.tag = getChainTagsForKey(target, observer.path, tagMetaFor(target), peekMeta(target));
      observer.lastRevision = valueForTag(observer.tag);
    });
  }

  if (SYNC_OBSERVERS.has(target)) {
    SYNC_OBSERVERS.get(target).forEach(observer => {
      observer.tag = getChainTagsForKey(target, observer.path, tagMetaFor(target), peekMeta(target));
      observer.lastRevision = valueForTag(observer.tag);
    });
  }
}
let lastKnownRevision = 0;
function flushAsyncObservers(shouldSchedule = true) {
  let currentRevision = valueForTag(CURRENT_TAG);

  if (lastKnownRevision === currentRevision) {
    return;
  }

  lastKnownRevision = currentRevision;
  ASYNC_OBSERVERS.forEach((activeObservers, target) => {
    let meta$$1 = peekMeta(target);
    activeObservers.forEach((observer, eventName) => {
      if (!validateTag(observer.tag, observer.lastRevision)) {
        let sendObserver = () => {
          try {
            sendEvent(target, eventName, [target, observer.path], undefined, meta$$1);
          } finally {
            observer.tag = getChainTagsForKey(target, observer.path, tagMetaFor(target), peekMeta(target));
            observer.lastRevision = valueForTag(observer.tag);
          }
        };

        if (shouldSchedule) {
          schedule('actions', sendObserver);
        } else {
          sendObserver();
        }
      }
    });
  });
}
function flushSyncObservers() {
  // When flushing synchronous observers, we know that something has changed (we
  // only do this during a notifyPropertyChange), so there's no reason to check
  // a global revision.
  SYNC_OBSERVERS.forEach((activeObservers, target) => {
    let meta$$1 = peekMeta(target);
    activeObservers.forEach((observer, eventName) => {
      if (!observer.suspended && !validateTag(observer.tag, observer.lastRevision)) {
        try {
          observer.suspended = true;
          sendEvent(target, eventName, [target, observer.path], undefined, meta$$1);
        } finally {
          observer.tag = getChainTagsForKey(target, observer.path, tagMetaFor(target), peekMeta(target));
          observer.lastRevision = valueForTag(observer.tag);
          observer.suspended = false;
        }
      }
    });
  });
}
function setObserverSuspended(target, property, suspended) {
  let activeObservers = SYNC_OBSERVERS.get(target);

  if (!activeObservers) {
    return;
  }

  let observer = activeObservers.get(changeEvent(property));

  if (observer) {
    observer.suspended = suspended;
  }
}
function destroyObservers(target) {
  if (SYNC_OBSERVERS.size > 0) SYNC_OBSERVERS.delete(target);
  if (ASYNC_OBSERVERS.size > 0) ASYNC_OBSERVERS.delete(target);
}

const SELF_TAG = symbol('SELF_TAG');
function tagForProperty(obj, propertyKey, addMandatorySetter = false, meta$$1) {
  let customTagFor = getCustomTagFor(obj);

  if (customTagFor !== undefined) {
    return customTagFor(obj, propertyKey, addMandatorySetter);
  }

  let tag = tagFor(obj, propertyKey, meta$$1);

  if (DEBUG && addMandatorySetter) {
    setupMandatorySetter(tag, obj, propertyKey);
  }

  return tag;
}
function tagForObject(obj) {
  if (isObject(obj)) {
    if (DEBUG) {
      assert(isDestroyed(obj) ? `Cannot create a new tag for \`${toString(obj)}\` after it has been destroyed.` : '', !isDestroyed(obj));
    }

    return tagFor(obj, SELF_TAG);
  }

  return CONSTANT_TAG;
}
function markObjectAsDirty(obj, propertyKey) {
  dirtyTagFor(obj, propertyKey);
  dirtyTagFor(obj, SELF_TAG);
}

/**
 @module ember
 @private
 */

const PROPERTY_DID_CHANGE = enumerableSymbol('PROPERTY_DID_CHANGE');
let deferred = 0;
/**
  This function is called just after an object property has changed.
  It will notify any observers and clear caches among other things.

  Normally you will not need to call this method directly but if for some
  reason you can't directly watch a property you can invoke this method
  manually.

  @method notifyPropertyChange
  @for @ember/object
  @param {Object} obj The object with the property that will change
  @param {String} keyName The property key (or path) that will change.
  @param {Meta} [_meta] The objects meta.
  @param {unknown} [value] The new value to set for the property
  @return {void}
  @since 3.1.0
  @public
*/

function notifyPropertyChange(obj, keyName, _meta, value) {
  let meta$$1 = _meta === undefined ? peekMeta(obj) : _meta;

  if (meta$$1 !== null && (meta$$1.isInitializing() || meta$$1.isPrototypeMeta(obj))) {
    return;
  }

  markObjectAsDirty(obj, keyName);

  if (deferred <= 0) {
    flushSyncObservers();
  }

  if (PROPERTY_DID_CHANGE in obj) {
    // we need to check the arguments length here; there's a check in `PROPERTY_DID_CHANGE`
    // that checks its arguments length, so we have to explicitly not call this with `value`
    // if it is not passed to `notifyPropertyChange`
    if (arguments.length === 4) {
      obj[PROPERTY_DID_CHANGE](keyName, value);
    } else {
      obj[PROPERTY_DID_CHANGE](keyName);
    }
  }
}
/**
  @method beginPropertyChanges
  @chainable
  @private
*/


function beginPropertyChanges() {
  deferred++;
  suspendedObserverDeactivation();
}
/**
  @method endPropertyChanges
  @private
*/


function endPropertyChanges() {
  deferred--;

  if (deferred <= 0) {
    flushSyncObservers();
    resumeObserverDeactivation();
  }
}
/**
  Make a series of property changes together in an
  exception-safe way.

  ```javascript
  Ember.changeProperties(function() {
    obj1.set('foo', mayBlowUpWhenSet);
    obj2.set('bar', baz);
  });
  ```

  @method changeProperties
  @param {Function} callback
  @private
*/


function changeProperties(callback) {
  beginPropertyChanges();

  try {
    callback();
  } finally {
    endPropertyChanges();
  }
}

function arrayContentWillChange(array, startIdx, removeAmt, addAmt) {
  // if no args are passed assume everything changes
  if (startIdx === undefined) {
    startIdx = 0;
    removeAmt = addAmt = -1;
  } else {
    if (removeAmt === undefined) {
      removeAmt = -1;
    }

    if (addAmt === undefined) {
      addAmt = -1;
    }
  }

  sendEvent(array, '@array:before', [array, startIdx, removeAmt, addAmt]);
  return array;
}
function arrayContentDidChange(array, startIdx, removeAmt, addAmt, notify = true) {
  // if no args are passed assume everything changes
  if (startIdx === undefined) {
    startIdx = 0;
    removeAmt = addAmt = -1;
  } else {
    if (removeAmt === undefined) {
      removeAmt = -1;
    }

    if (addAmt === undefined) {
      addAmt = -1;
    }
  }

  let meta$$1 = peekMeta(array);

  if (notify) {
    if (addAmt < 0 || removeAmt < 0 || addAmt - removeAmt !== 0) {
      notifyPropertyChange(array, 'length', meta$$1);
    }

    notifyPropertyChange(array, '[]', meta$$1);
  }

  sendEvent(array, '@array:change', [array, startIdx, removeAmt, addAmt]);

  if (meta$$1 !== null) {
    let length = array.length;
    let addedAmount = addAmt === -1 ? 0 : addAmt;
    let removedAmount = removeAmt === -1 ? 0 : removeAmt;
    let delta = addedAmount - removedAmount;
    let previousLength = length - delta;
    let normalStartIdx = startIdx < 0 ? previousLength + startIdx : startIdx;

    if (meta$$1.revisionFor('firstObject') !== undefined && normalStartIdx === 0) {
      notifyPropertyChange(array, 'firstObject', meta$$1);
    }

    if (meta$$1.revisionFor('lastObject') !== undefined) {
      let previousLastIndex = previousLength - 1;
      let lastAffectedIndex = normalStartIdx + removedAmount;

      if (previousLastIndex < lastAffectedIndex) {
        notifyPropertyChange(array, 'lastObject', meta$$1);
      }
    }
  }

  return array;
}

const EMPTY_ARRAY = Object.freeze([]);
function objectAt(array, index) {
  if (Array.isArray(array)) {
    return array[index];
  } else {
    return array.objectAt(index);
  }
}
function replace(array, start, deleteCount, items = EMPTY_ARRAY) {
  if (Array.isArray(array)) {
    replaceInNativeArray(array, start, deleteCount, items);
  } else {
    array.replace(start, deleteCount, items);
  }
}
const CHUNK_SIZE = 60000; // To avoid overflowing the stack, we splice up to CHUNK_SIZE items at a time.
// See https://code.google.com/p/chromium/issues/detail?id=56588 for more details.

function replaceInNativeArray(array, start, deleteCount, items) {
  arrayContentWillChange(array, start, deleteCount, items.length);

  if (items.length <= CHUNK_SIZE) {
    array.splice(start, deleteCount, ...items);
  } else {
    array.splice(start, deleteCount);

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      let chunk = items.slice(i, i + CHUNK_SIZE);
      array.splice(start + i, 0, ...chunk);
    }
  }

  arrayContentDidChange(array, start, deleteCount, items.length);
}

function arrayObserversHelper(obj, target, opts, operation, notify) {
  let willChange = opts && opts.willChange || 'arrayWillChange';
  let didChange = opts && opts.didChange || 'arrayDidChange';
  let hasObservers = obj.hasArrayObservers;
  operation(obj, '@array:before', target, willChange);
  operation(obj, '@array:change', target, didChange);

  if (hasObservers === notify) {
    notifyPropertyChange(obj, 'hasArrayObservers');
  }

  return obj;
}

function addArrayObserver(array, target, opts) {
  return arrayObserversHelper(array, target, opts, addListener, false);
}
function removeArrayObserver(array, target, opts) {
  return arrayObserversHelper(array, target, opts, removeListener, true);
}

const CHAIN_PASS_THROUGH = new _WeakSet();
function finishLazyChains(meta$$1, key, value) {
  let lazyTags = meta$$1.readableLazyChainsFor(key);

  if (lazyTags === undefined) {
    return;
  }

  if (isObject(value)) {
    for (let i = 0; i < lazyTags.length; i++) {
      let [tag, deps] = lazyTags[i];
      updateTag(tag, getChainTagsForKey(value, deps, tagMetaFor(value), peekMeta(value)));
    }
  }

  lazyTags.length = 0;
}
function getChainTagsForKeys(obj, keys, tagMeta, meta$$1) {
  let tags = [];

  for (let i = 0; i < keys.length; i++) {
    getChainTags(tags, obj, keys[i], tagMeta, meta$$1);
  }

  return combine(tags);
}
function getChainTagsForKey(obj, key, tagMeta, meta$$1) {
  return combine(getChainTags([], obj, key, tagMeta, meta$$1));
}

function getChainTags(chainTags, obj, path, tagMeta, meta$$1) {
  let current = obj;
  let currentTagMeta = tagMeta;
  let currentMeta = meta$$1;
  let pathLength = path.length;
  let segmentEnd = -1; // prevent closures

  let segment, descriptor; // eslint-disable-next-line no-constant-condition

  while (true) {
    let lastSegmentEnd = segmentEnd + 1;
    segmentEnd = path.indexOf('.', lastSegmentEnd);

    if (segmentEnd === -1) {
      segmentEnd = pathLength;
    }

    segment = path.slice(lastSegmentEnd, segmentEnd); // If the segment is an @each, we can process it and then break

    if (segment === '@each' && segmentEnd !== pathLength) {
      lastSegmentEnd = segmentEnd + 1;
      segmentEnd = path.indexOf('.', lastSegmentEnd); // There should be exactly one segment after an `@each` (i.e. `@each.foo`, not `@each.foo.bar`)

      deprecate(`When using @each in a dependent-key or an observer, ` + `you can only chain one property level deep after ` + `the @each. That is, \`${path.slice(0, segmentEnd)}\` ` + `is allowed but \`${path}\` (which is what you passed) ` + `is not.\n\n` + `This was never supported. Currently, the extra segments ` + `are silently ignored, i.e. \`${path}\` behaves exactly ` + `the same as \`${path.slice(0, segmentEnd)}\`. ` + `In the future, this will throw an error.\n\n` + `If the current behavior is acceptable for your use case, ` + `please remove the extraneous segments by changing your ` + `key to \`${path.slice(0, segmentEnd)}\`. ` + `Otherwise, please create an intermediary computed property ` + `or switch to using tracked properties.`, segmentEnd === -1, {
        until: '3.17.0',
        id: 'ember-metal.computed-deep-each',
        for: 'ember-source',
        since: {
          enabled: '3.13.0-beta.3'
        }
      });
      let arrLength = current.length;

      if (typeof arrLength !== 'number' || // TODO: should the second test be `isEmberArray` instead?
      !(Array.isArray(current) || 'objectAt' in current)) {
        // If the current object isn't an array, there's nothing else to do,
        // we don't watch individual properties. Break out of the loop.
        break;
      } else if (arrLength === 0) {
        // Fast path for empty arrays
        chainTags.push(tagForProperty(current, '[]'));
        break;
      }

      if (segmentEnd === -1) {
        segment = path.slice(lastSegmentEnd);
      } else {
        // Deprecated, remove once we turn the deprecation into an assertion
        segment = path.slice(lastSegmentEnd, segmentEnd);
      } // Push the tags for each item's property


      for (let i = 0; i < arrLength; i++) {
        let item = objectAt(current, i);

        if (item) {
          assert(`When using @each to observe the array \`${current.toString()}\`, the items in the array must be objects`, typeof item === 'object');
          chainTags.push(tagForProperty(item, segment, true));
          currentMeta = peekMeta(item);
          descriptor = currentMeta !== null ? currentMeta.peekDescriptors(segment) : undefined; // If the key is an alias, we need to bootstrap it

          if (descriptor !== undefined && typeof descriptor.altKey === 'string') {
            // tslint:disable-next-line: no-unused-expression
            item[segment];
          }
        }
      } // Push the tag for the array length itself


      chainTags.push(tagForProperty(current, '[]', true, currentTagMeta));
      break;
    }

    let propertyTag = tagForProperty(current, segment, true, currentTagMeta);
    descriptor = currentMeta !== null ? currentMeta.peekDescriptors(segment) : undefined;
    chainTags.push(propertyTag); // If we're at the end of the path, processing the last segment, and it's
    // not an alias, we should _not_ get the last value, since we already have
    // its tag. There's no reason to access it and do more work.

    if (segmentEnd === pathLength) {
      // If the key was an alias, we should always get the next value in order to
      // bootstrap the alias. This is because aliases, unlike other CPs, should
      // always be in sync with the aliased value.
      if (CHAIN_PASS_THROUGH.has(descriptor)) {
        // tslint:disable-next-line: no-unused-expression
        current[segment];
      }

      break;
    }

    if (descriptor === undefined) {
      // If the descriptor is undefined, then its a normal property, so we should
      // lookup the value to chain off of like normal.
      if (!(segment in current) && typeof current.unknownProperty === 'function') {
        current = current.unknownProperty(segment);
      } else {
        current = current[segment];
      }
    } else if (CHAIN_PASS_THROUGH.has(descriptor)) {
      current = current[segment];
    } else {
      // If the descriptor is defined, then its a normal CP (not an alias, which
      // would have been handled earlier). We get the last revision to check if
      // the CP is still valid, and if so we use the cached value. If not, then
      // we create a lazy chain lookup, and the next time the CP is calculated,
      // it will update that lazy chain.
      let instanceMeta = currentMeta.source === current ? currentMeta : meta(current);
      let lastRevision = instanceMeta.revisionFor(segment);

      if (lastRevision !== undefined && validateTag(propertyTag, lastRevision)) {
        current = instanceMeta.valueFor(segment);
      } else {
        // use metaFor here to ensure we have the meta for the instance
        let lazyChains = instanceMeta.writableLazyChainsFor(segment);
        let rest = path.substr(segmentEnd + 1);
        let placeholderTag = createUpdatableTag();
        lazyChains.push([placeholderTag, rest]);
        chainTags.push(placeholderTag);
        break;
      }
    }

    if (!isObject(current)) {
      // we've hit the end of the chain for now, break out
      break;
    }

    currentTagMeta = tagMetaFor(current);
    currentMeta = peekMeta(current);
  }

  return chainTags;
}

function isElementDescriptor(args) {
  let [maybeTarget, maybeKey, maybeDesc] = args;
  return (// Ensure we have the right number of args
    args.length === 3 && ( // Make sure the target is a class or object (prototype)
    typeof maybeTarget === 'function' || typeof maybeTarget === 'object' && maybeTarget !== null) && // Make sure the key is a string
    typeof maybeKey === 'string' && ( // Make sure the descriptor is the right shape
    typeof maybeDesc === 'object' && maybeDesc !== null || maybeDesc === undefined)
  );
}
function nativeDescDecorator(propertyDesc) {
  let decorator = function () {
    return propertyDesc;
  };

  setClassicDecorator(decorator);
  return decorator;
}
/**
  Objects of this type can implement an interface to respond to requests to
  get and set. The default implementation handles simple properties.

  @class Descriptor
  @private
*/

class ComputedDescriptor {
  constructor() {
    this.enumerable = true;
    this.configurable = true;
    this._dependentKeys = undefined;
    this._meta = undefined;
  }

  setup(_obj, keyName, _propertyDesc, meta$$1) {
    meta$$1.writeDescriptors(keyName, this);
  }

  teardown(_obj, keyName, meta$$1) {
    meta$$1.removeDescriptors(keyName);
  }

}
let COMPUTED_GETTERS;

if (DEBUG) {
  COMPUTED_GETTERS = new _WeakSet();
}

function DESCRIPTOR_GETTER_FUNCTION(name, descriptor) {
  function getter() {
    return descriptor.get(this, name);
  }

  if (DEBUG) {
    COMPUTED_GETTERS.add(getter);
  }

  return getter;
}

function DESCRIPTOR_SETTER_FUNCTION(name, descriptor) {
  let set = function CPSETTER_FUNCTION(value) {
    return descriptor.set(this, name, value);
  };

  COMPUTED_SETTERS.add(set);
  return set;
}

const COMPUTED_SETTERS = new _WeakSet();
function makeComputedDecorator(desc, DecoratorClass) {
  let decorator = function COMPUTED_DECORATOR(target, key, propertyDesc, maybeMeta, isClassicDecorator) {
    assert(`Only one computed property decorator can be applied to a class field or accessor, but '${key}' was decorated twice. You may have added the decorator to both a getter and setter, which is unnecessary.`, isClassicDecorator || !propertyDesc || !propertyDesc.get || !COMPUTED_GETTERS.has(propertyDesc.get));
    let meta$$1 = arguments.length === 3 ? meta(target) : maybeMeta;
    desc.setup(target, key, propertyDesc, meta$$1);
    let computedDesc = {
      enumerable: desc.enumerable,
      configurable: desc.configurable,
      get: DESCRIPTOR_GETTER_FUNCTION(key, desc),
      set: DESCRIPTOR_SETTER_FUNCTION(key, desc)
    };
    return computedDesc;
  };

  setClassicDecorator(decorator, desc);
  Object.setPrototypeOf(decorator, DecoratorClass.prototype);
  return decorator;
} /////////////

const DECORATOR_DESCRIPTOR_MAP = new WeakMap();
/**
  Returns the CP descriptor associated with `obj` and `keyName`, if any.

  @method descriptorForProperty
  @param {Object} obj the object to check
  @param {String} keyName the key to check
  @return {Descriptor}
  @private
*/

function descriptorForProperty(obj, keyName, _meta) {
  assert('Cannot call `descriptorForProperty` on null', obj !== null);
  assert('Cannot call `descriptorForProperty` on undefined', obj !== undefined);
  assert(`Cannot call \`descriptorForProperty\` on ${typeof obj}`, typeof obj === 'object' || typeof obj === 'function');
  let meta$$1 = _meta === undefined ? peekMeta(obj) : _meta;

  if (meta$$1 !== null) {
    return meta$$1.peekDescriptors(keyName);
  }
}
function descriptorForDecorator(dec) {
  return DECORATOR_DESCRIPTOR_MAP.get(dec);
}
/**
  Check whether a value is a decorator

  @method isClassicDecorator
  @param {any} possibleDesc the value to check
  @return {boolean}
  @private
*/

function isClassicDecorator(dec) {
  return typeof dec === 'function' && DECORATOR_DESCRIPTOR_MAP.has(dec);
}
/**
  Set a value as a decorator

  @method setClassicDecorator
  @param {function} decorator the value to mark as a decorator
  @private
*/

function setClassicDecorator(dec, value = true) {
  DECORATOR_DESCRIPTOR_MAP.set(dec, value);
}

/**
@module @ember/object
*/

const END_WITH_EACH_REGEX = /\.@each$/;
/**
  Expands `pattern`, invoking `callback` for each expansion.

  The only pattern supported is brace-expansion, anything else will be passed
  once to `callback` directly.

  Example

  ```js
  import { expandProperties } from '@ember/object/computed';

  function echo(arg){ console.log(arg); }

  expandProperties('foo.bar', echo);              //=> 'foo.bar'
  expandProperties('{foo,bar}', echo);            //=> 'foo', 'bar'
  expandProperties('foo.{bar,baz}', echo);        //=> 'foo.bar', 'foo.baz'
  expandProperties('{foo,bar}.baz', echo);        //=> 'foo.baz', 'bar.baz'
  expandProperties('foo.{bar,baz}.[]', echo)      //=> 'foo.bar.[]', 'foo.baz.[]'
  expandProperties('{foo,bar}.{spam,eggs}', echo) //=> 'foo.spam', 'foo.eggs', 'bar.spam', 'bar.eggs'
  expandProperties('{foo}.bar.{baz}')             //=> 'foo.bar.baz'
  ```

  @method expandProperties
  @static
  @for @ember/object/computed
  @public
  @param {String} pattern The property pattern to expand.
  @param {Function} callback The callback to invoke.  It is invoked once per
  expansion, and is passed the expansion.
*/

function expandProperties(pattern, callback) {
  assert(`A computed property key must be a string, you passed ${typeof pattern} ${pattern}`, typeof pattern === 'string');
  assert('Brace expanded properties cannot contain spaces, e.g. "user.{firstName, lastName}" should be "user.{firstName,lastName}"', pattern.indexOf(' ') === -1); // regex to look for double open, double close, or unclosed braces

  assert(`Brace expanded properties have to be balanced and cannot be nested, pattern: ${pattern}`, pattern.match(/\{[^}{]*\{|\}[^}{]*\}|\{[^}]*$/g) === null);
  let start = pattern.indexOf('{');

  if (start < 0) {
    callback(pattern.replace(END_WITH_EACH_REGEX, '.[]'));
  } else {
    dive('', pattern, start, callback);
  }
}

function dive(prefix, pattern, start, callback) {
  let end = pattern.indexOf('}'),
      i = 0,
      newStart,
      arrayLength;
  let tempArr = pattern.substring(start + 1, end).split(',');
  let after = pattern.substring(end + 1);
  prefix = prefix + pattern.substring(0, start);
  arrayLength = tempArr.length;

  while (i < arrayLength) {
    newStart = after.indexOf('{');

    if (newStart < 0) {
      callback((prefix + tempArr[i++] + after).replace(END_WITH_EACH_REGEX, '.[]'));
    } else {
      dive(prefix + tempArr[i++], after, newStart, callback);
    }
  }
}

/**
@module @ember/object
*/
/**
  NOTE: This is a low-level method used by other parts of the API. You almost
  never want to call this method directly. Instead you should use
  `mixin()` to define new properties.

  Defines a property on an object. This method works much like the ES5
  `Object.defineProperty()` method except that it can also accept computed
  properties and other special descriptors.

  Normally this method takes only three parameters. However if you pass an
  instance of `Descriptor` as the third param then you can pass an
  optional value as the fourth parameter. This is often more efficient than
  creating new descriptor hashes for each property.

  ## Examples

  ```javascript
  import { defineProperty, computed } from '@ember/object';

  // ES5 compatible mode
  defineProperty(contact, 'firstName', {
    writable: true,
    configurable: false,
    enumerable: true,
    value: 'Charles'
  });

  // define a simple property
  defineProperty(contact, 'lastName', undefined, 'Jolley');

  // define a computed property
  defineProperty(contact, 'fullName', computed('firstName', 'lastName', function() {
    return this.firstName+' '+this.lastName;
  }));
  ```

  @public
  @method defineProperty
  @static
  @for @ember/object
  @param {Object} obj the object to define this property on. This may be a prototype.
  @param {String} keyName the name of the property
  @param {Descriptor} [desc] an instance of `Descriptor` (typically a
    computed property) or an ES5 descriptor.
    You must provide this or `data` but not both.
  @param {*} [data] something other than a descriptor, that will
    become the explicit value of this property.
*/

function defineProperty(obj, keyName, desc, data, _meta) {
  let meta$$1 = _meta === undefined ? meta(obj) : _meta;
  let previousDesc = descriptorForProperty(obj, keyName, meta$$1);
  let wasDescriptor = previousDesc !== undefined;

  if (wasDescriptor) {
    previousDesc.teardown(obj, keyName, meta$$1);
  }

  if (isClassicDecorator(desc)) {
    defineDecorator(obj, keyName, desc, meta$$1);
  } else if (desc === null || desc === undefined) {
    defineValue(obj, keyName, data, wasDescriptor, true);
  } else {
    // fallback to ES5
    Object.defineProperty(obj, keyName, desc);
  } // if key is being watched, override chains that
  // were initialized with the prototype


  if (!meta$$1.isPrototypeMeta(obj)) {
    revalidateObservers(obj);
  }
}
function defineDecorator(obj, keyName, desc, meta$$1) {
  let propertyDesc;

  if (DEBUG) {
    propertyDesc = desc(obj, keyName, undefined, meta$$1, true);
  } else {
    propertyDesc = desc(obj, keyName, undefined, meta$$1);
  }

  Object.defineProperty(obj, keyName, propertyDesc); // pass the decorator function forward for backwards compat

  return desc;
}
function defineValue(obj, keyName, value, wasDescriptor, enumerable = true) {
  if (wasDescriptor === true || enumerable === false) {
    Object.defineProperty(obj, keyName, {
      configurable: true,
      enumerable,
      writable: true,
      value
    });
  } else {
    if (DEBUG) {
      setWithMandatorySetter(obj, keyName, value);
    } else {
      obj[keyName] = value;
    }
  }

  return value;
}

const firstDotIndexCache = new Cache(1000, key => key.indexOf('.'));
function isPath(path) {
  return typeof path === 'string' && firstDotIndexCache.get(path) !== -1;
}

/**
@module @ember/object
*/
const PROXY_CONTENT = symbol('PROXY_CONTENT');
let getPossibleMandatoryProxyValue;

if (DEBUG && HAS_NATIVE_PROXY) {
  getPossibleMandatoryProxyValue = function getPossibleMandatoryProxyValue(obj, keyName) {
    let content = obj[PROXY_CONTENT];

    if (content === undefined) {
      return obj[keyName];
    } else {
      /* global Reflect */
      return Reflect.get(content, keyName, obj);
    }
  };
} // ..........................................................
// GET AND SET
//
// If we are on a platform that supports accessors we can use those.
// Otherwise simulate accessors by looking up the property directly on the
// object.

/**
  Gets the value of a property on an object. If the property is computed,
  the function will be invoked. If the property is not defined but the
  object implements the `unknownProperty` method then that will be invoked.

  ```javascript
  import { get } from '@ember/object';
  get(obj, "name");
  ```

  If you plan to run on IE8 and older browsers then you should use this
  method anytime you want to retrieve a property on an object that you don't
  know for sure is private. (Properties beginning with an underscore '_'
  are considered private.)

  On all newer browsers, you only need to use this method to retrieve
  properties if the property might not be defined on the object and you want
  to respect the `unknownProperty` handler. Otherwise you can ignore this
  method.

  Note that if the object itself is `undefined`, this method will throw
  an error.

  @method get
  @for @ember/object
  @static
  @param {Object} obj The object to retrieve from.
  @param {String} keyName The property key to retrieve
  @return {Object} the property value or `null`.
  @public
*/


function get(obj, keyName) {
  assert(`Get must be called with two arguments; an object and a property key`, arguments.length === 2);
  assert(`Cannot call get with '${keyName}' on an undefined object.`, obj !== undefined && obj !== null);
  assert(`The key provided to get must be a string or number, you passed ${keyName}`, typeof keyName === 'string' || typeof keyName === 'number' && !isNaN(keyName));
  assert(`'this' in paths is not supported`, typeof keyName !== 'string' || keyName.lastIndexOf('this.', 0) !== 0);
  return isPath(keyName) ? _getPath(obj, keyName) : _getProp(obj, keyName);
}
function _getProp(obj, keyName) {
  let type = typeof obj;
  let isObject$$1 = type === 'object';
  let isFunction = type === 'function';
  let isObjectLike = isObject$$1 || isFunction;
  let value;

  if (isObjectLike) {
    if (DEBUG && HAS_NATIVE_PROXY) {
      value = getPossibleMandatoryProxyValue(obj, keyName);
    } else {
      value = obj[keyName];
    }

    if (value === undefined && isObject$$1 && !(keyName in obj) && typeof obj.unknownProperty === 'function') {
      if (DEBUG) {
        deprecateMutationsInTrackingTransaction(() => {
          value = obj.unknownProperty(keyName);
        });
      } else {
        value = obj.unknownProperty(keyName);
      }
    }

    if (isTracking()) {
      consumeTag(tagFor(obj, keyName));

      if (Array.isArray(value) || isEmberArray(value)) {
        // Add the tag of the returned value if it is an array, since arrays
        // should always cause updates if they are consumed and then changed
        consumeTag(tagFor(value, '[]'));
      }
    }
  } else {
    value = obj[keyName];
  }

  return value;
}
function _getPath(root, path) {
  let obj = root;
  let parts = typeof path === 'string' ? path.split('.') : path;

  for (let i = 0; i < parts.length; i++) {
    if (obj === undefined || obj === null || obj.isDestroyed) {
      return undefined;
    }

    obj = _getProp(obj, parts[i]);
  }

  return obj;
}
/**
  Retrieves the value of a property from an Object, or a default value in the
  case that the property returns `undefined`.

  ```javascript
  import { getWithDefault } from '@ember/object';
  getWithDefault(person, 'lastName', 'Doe');
  ```

  @method getWithDefault
  @for @ember/object
  @static
  @param {Object} obj The object to retrieve from.
  @param {String} keyName The name of the property to retrieve
  @param {Object} defaultValue The value to return if the property value is undefined
  @return {Object} The property value or the defaultValue.
  @public
  @deprecated
*/

function getWithDefault(root, key, defaultValue) {
  deprecate('Using getWithDefault has been deprecated. Instead, consider using Ember get and explicitly checking for undefined.', false, {
    id: 'ember-metal.get-with-default',
    until: '4.0.0',
    url: 'https://deprecations.emberjs.com/v3.x#toc_ember-metal-get-with-default',
    for: 'ember-source',
    since: {
      enabled: '3.21.0'
    }
  });
  let value = get(root, key);

  if (value === undefined) {
    return defaultValue;
  }

  return value;
}

_getProp('foo', 'a');

_getProp('foo', 1);

_getProp({}, 'a');

_getProp({}, 1);

_getProp({
  unkonwnProperty() {}

}, 'a');

_getProp({
  unkonwnProperty() {}

}, 1);

get({}, 'foo');
get({}, 'foo.bar');
let fakeProxy = {};
setProxy(fakeProxy);
track(() => _getProp({}, 'a'));
track(() => _getProp({}, 1));
track(() => _getProp({
  a: []
}, 'a'));
track(() => _getProp({
  a: fakeProxy
}, 'a'));

/**
 @module @ember/object
*/

/**
  Sets the value of a property on an object, respecting computed properties
  and notifying observers and other listeners of the change.
  If the specified property is not defined on the object and the object
  implements the `setUnknownProperty` method, then instead of setting the
  value of the property on the object, its `setUnknownProperty` handler
  will be invoked with the two parameters `keyName` and `value`.

  ```javascript
  import { set } from '@ember/object';
  set(obj, "name", value);
  ```

  @method set
  @static
  @for @ember/object
  @param {Object} obj The object to modify.
  @param {String} keyName The property key to set
  @param {Object} value The value to set
  @return {Object} the passed value.
  @public
*/

function set(obj, keyName, value, tolerant) {
  assert(`Set must be called with three or four arguments; an object, a property key, a value and tolerant true/false`, arguments.length === 3 || arguments.length === 4);
  assert(`Cannot call set with '${keyName}' on an undefined object.`, obj && typeof obj === 'object' || typeof obj === 'function');
  assert(`The key provided to set must be a string or number, you passed ${keyName}`, typeof keyName === 'string' || typeof keyName === 'number' && !isNaN(keyName));
  assert(`'this' in paths is not supported`, typeof keyName !== 'string' || keyName.lastIndexOf('this.', 0) !== 0);

  if (obj.isDestroyed) {
    assert(`calling set on destroyed object: ${toString(obj)}.${keyName} = ${toString(value)}`, tolerant);
    return value;
  }

  return isPath(keyName) ? _setPath(obj, keyName, value, tolerant) : _setProp(obj, keyName, value);
}
function _setProp(obj, keyName, value) {
  let descriptor = lookupDescriptor(obj, keyName);

  if (descriptor !== null && COMPUTED_SETTERS.has(descriptor.set)) {
    obj[keyName] = value;
    return value;
  }

  let currentValue;

  if (DEBUG && HAS_NATIVE_PROXY) {
    currentValue = getPossibleMandatoryProxyValue(obj, keyName);
  } else {
    currentValue = obj[keyName];
  }

  if (currentValue === undefined && 'object' === typeof obj && !(keyName in obj) && typeof obj.setUnknownProperty === 'function') {
    /* unknown property */
    obj.setUnknownProperty(keyName, value);
  } else {
    if (DEBUG) {
      setWithMandatorySetter(obj, keyName, value);
    } else {
      obj[keyName] = value;
    }

    if (currentValue !== value) {
      notifyPropertyChange(obj, keyName);
    }
  }

  return value;
}

function _setPath(root, path, value, tolerant) {
  let parts = path.split('.');
  let keyName = parts.pop();
  assert('Property set failed: You passed an empty path', keyName.trim().length > 0);
  let newRoot = _getPath(root, parts);

  if (newRoot !== null && newRoot !== undefined) {
    return set(newRoot, keyName, value);
  } else if (!tolerant) {
    throw new EmberError(`Property set failed: object in path "${parts.join('.')}" could not be found.`);
  }
}
/**
  Error-tolerant form of `set`. Will not blow up if any part of the
  chain is `undefined`, `null`, or destroyed.

  This is primarily used when syncing bindings, which may try to update after
  an object has been destroyed.

  ```javascript
  import { trySet } from '@ember/object';

  let obj = { name: "Zoey" };
  trySet(obj, "contacts.twitter", "@emberjs");
  ```

  @method trySet
  @static
  @for @ember/object
  @param {Object} root The object to modify.
  @param {String} path The property path to set
  @param {Object} value The value to set
  @public
*/


function trySet(root, path, value) {
  return set(root, path, value, true);
}

/**
@module @ember/object
*/

const DEEP_EACH_REGEX = /\.@each\.[^.]+\./;

function noop() {}
/**
  `@computed` is a decorator that turns a JavaScript getter and setter into a
  computed property, which is a _cached, trackable value_. By default the getter
  will only be called once and the result will be cached. You can specify
  various properties that your computed property depends on. This will force the
  cached result to be cleared if the dependencies are modified, and lazily recomputed the next time something asks for it.

  In the following example we decorate a getter - `fullName` -  by calling
  `computed` with the property dependencies (`firstName` and `lastName`) as
  arguments. The `fullName` getter will be called once (regardless of how many
  times it is accessed) as long as its dependencies do not change. Once
  `firstName` or `lastName` are updated any future calls to `fullName` will
  incorporate the new values, and any watchers of the value such as templates
  will be updated:

  ```javascript
  import { computed, set } from '@ember/object';

  class Person {
    constructor(firstName, lastName) {
      set(this, 'firstName', firstName);
      set(this, 'lastName', lastName);
    }

    @computed('firstName', 'lastName')
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  });

  let tom = new Person('Tom', 'Dale');

  tom.fullName; // 'Tom Dale'
  ```

  You can also provide a setter, which will be used when updating the computed
  property. Ember's `set` function must be used to update the property
  since it will also notify observers of the property:

  ```javascript
  import { computed, set } from '@ember/object';

  class Person {
    constructor(firstName, lastName) {
      set(this, 'firstName', firstName);
      set(this, 'lastName', lastName);
    }

    @computed('firstName', 'lastName')
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    }

    set fullName(value) {
      let [firstName, lastName] = value.split(' ');

      set(this, 'firstName', firstName);
      set(this, 'lastName', lastName);
    }
  });

  let person = new Person();

  set(person, 'fullName', 'Peter Wagenet');
  person.firstName; // 'Peter'
  person.lastName;  // 'Wagenet'
  ```

  You can also pass a getter function or object with `get` and `set` functions
  as the last argument to the computed decorator. This allows you to define
  computed property _macros_:

  ```js
  import { computed } from '@ember/object';

  function join(...keys) {
    return computed(...keys, function() {
      return keys.map(key => this[key]).join(' ');
    });
  }

  class Person {
    @join('firstName', 'lastName')
    fullName;
  }
  ```

  Note that when defined this way, getters and setters receive the _key_ of the
  property they are decorating as the first argument. Setters receive the value
  they are setting to as the second argument instead. Additionally, setters must
  _return_ the value that should be cached:

  ```javascript
  import { computed, set } from '@ember/object';

  function fullNameMacro(firstNameKey, lastNameKey) {
    return computed(firstNameKey, lastNameKey, {
      get() {
        return `${this[firstNameKey]} ${this[lastNameKey]}`;
      }

      set(key, value) {
        let [firstName, lastName] = value.split(' ');

        set(this, firstNameKey, firstName);
        set(this, lastNameKey, lastName);

        return value;
      }
    });
  }

  class Person {
    constructor(firstName, lastName) {
      set(this, 'firstName', firstName);
      set(this, 'lastName', lastName);
    }

    @fullNameMacro('firstName', 'lastName') fullName;
  });

  let person = new Person();

  set(person, 'fullName', 'Peter Wagenet');
  person.firstName; // 'Peter'
  person.lastName;  // 'Wagenet'
  ```

  Computed properties can also be used in classic classes. To do this, we
  provide the getter and setter as the last argument like we would for a macro,
  and we assign it to a property on the class definition. This is an _anonymous_
  computed macro:

  ```javascript
  import EmberObject, { computed, set } from '@ember/object';

  let Person = EmberObject.extend({
    // these will be supplied by `create`
    firstName: null,
    lastName: null,

    fullName: computed('firstName', 'lastName', {
      get() {
        return `${this.firstName} ${this.lastName}`;
      }

      set(key, value) {
        let [firstName, lastName] = value.split(' ');

        set(this, 'firstName', firstName);
        set(this, 'lastName', lastName);

        return value;
      }
    })
  });

  let tom = Person.create({
    firstName: 'Tom',
    lastName: 'Dale'
  });

  tom.get('fullName') // 'Tom Dale'
  ```

  You can overwrite computed property without setters with a normal property (no
  longer computed) that won't change if dependencies change. You can also mark
  computed property as `.readOnly()` and block all attempts to set it.

  ```javascript
  import { computed, set } from '@ember/object';

  class Person {
    constructor(firstName, lastName) {
      set(this, 'firstName', firstName);
      set(this, 'lastName', lastName);
    }

    @computed('firstName', 'lastName').readOnly()
    get fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  });

  let person = new Person();
  person.set('fullName', 'Peter Wagenet'); // Uncaught Error: Cannot set read-only property "fullName" on object: <(...):emberXXX>
  ```

  Additional resources:
  - [Decorators RFC](https://github.com/emberjs/rfcs/blob/master/text/0408-decorators.md)
  - [New CP syntax RFC](https://github.com/emberjs/rfcs/blob/master/text/0011-improved-cp-syntax.md)
  - [New computed syntax explained in "Ember 1.12 released" ](https://emberjs.com/blog/2015/05/13/ember-1-12-released.html#toc_new-computed-syntax)

  @class ComputedProperty
  @public
*/


class ComputedProperty extends ComputedDescriptor {
  constructor(args) {
    super();
    this._volatile = false;
    this._readOnly = false;
    this._hasConfig = false;
    this._getter = undefined;
    this._setter = undefined;
    let maybeConfig = args[args.length - 1];

    if (typeof maybeConfig === 'function' || maybeConfig !== null && typeof maybeConfig === 'object') {
      this._hasConfig = true;
      let config = args.pop();

      if (typeof config === 'function') {
        assert(`You attempted to pass a computed property instance to computed(). Computed property instances are decorator functions, and cannot be passed to computed() because they cannot be turned into decorators twice`, !isClassicDecorator(config));
        this._getter = config;
      } else {
        const objectConfig = config;
        assert('computed expects a function or an object as last argument.', typeof objectConfig === 'object' && !Array.isArray(objectConfig));
        assert('Config object passed to computed can only contain `get` and `set` keys.', Object.keys(objectConfig).every(key => key === 'get' || key === 'set'));
        assert('Computed properties must receive a getter or a setter, you passed none.', Boolean(objectConfig.get) || Boolean(objectConfig.set));
        this._getter = objectConfig.get || noop;
        this._setter = objectConfig.set;
      }
    }

    if (args.length > 0) {
      this._property(...args);
    }
  }

  setup(obj, keyName, propertyDesc, meta$$1) {
    super.setup(obj, keyName, propertyDesc, meta$$1);
    assert(`@computed can only be used on accessors or fields, attempted to use it with ${keyName} but that was a method. Try converting it to a getter (e.g. \`get ${keyName}() {}\`)`, !(propertyDesc && typeof propertyDesc.value === 'function'));
    assert(`@computed can only be used on empty fields. ${keyName} has an initial value (e.g. \`${keyName} = someValue\`)`, !propertyDesc || !propertyDesc.initializer);
    assert(`Attempted to apply a computed property that already has a getter/setter to a ${keyName}, but it is a method or an accessor. If you passed @computed a function or getter/setter (e.g. \`@computed({ get() { ... } })\`), then it must be applied to a field`, !(this._hasConfig && propertyDesc && (typeof propertyDesc.get === 'function' || typeof propertyDesc.set === 'function')));

    if (this._hasConfig === false) {
      assert(`Attempted to use @computed on ${keyName}, but it did not have a getter or a setter. You must either pass a get a function or getter/setter to @computed directly (e.g. \`@computed({ get() { ... } })\`) or apply @computed directly to a getter/setter`, propertyDesc && (typeof propertyDesc.get === 'function' || typeof propertyDesc.set === 'function'));
      let {
        get,
        set: set$$1
      } = propertyDesc;

      if (get !== undefined) {
        this._getter = get;
      }

      if (set$$1 !== undefined) {
        this._setter = function setterWrapper(_key, value) {
          let ret = set$$1.call(this, value);

          if (get !== undefined) {
            return typeof ret === 'undefined' ? get.call(this) : ret;
          }

          return ret;
        };
      }
    }
  }

  _property(...passedArgs) {
    let args = [];

    function addArg(property) {
      warn(`Dependent keys containing @each only work one level deep. ` + `You used the key "${property}" which is invalid. ` + `Please create an intermediary computed property.`, DEEP_EACH_REGEX.test(property) === false, {
        id: 'ember-metal.computed-deep-each'
      });
      args.push(property);
    }

    for (let i = 0; i < passedArgs.length; i++) {
      expandProperties(passedArgs[i], addArg);
    }

    this._dependentKeys = args;
  }

  get(obj, keyName) {
    if (this._volatile) {
      return this._getter.call(obj, keyName);
    }

    let meta$$1 = meta(obj);
    let tagMeta = tagMetaFor(obj);
    let propertyTag = tagFor(obj, keyName, tagMeta);
    let ret;
    let revision = meta$$1.revisionFor(keyName);

    if (revision !== undefined && validateTag(propertyTag, revision)) {
      ret = meta$$1.valueFor(keyName);
    } else {
      // For backwards compatibility, we only throw if the CP has any dependencies. CPs without dependencies
      // should be allowed, even after the object has been destroyed, which is why we check _dependentKeys.
      assert(`Attempted to access the computed ${obj}.${keyName} on a destroyed object, which is not allowed`, this._dependentKeys === undefined || !isDestroyed(obj));
      let {
        _getter,
        _dependentKeys
      } = this; // Create a tracker that absorbs any trackable actions inside the CP

      untrack(() => {
        ret = _getter.call(obj, keyName);
      });

      if (_dependentKeys !== undefined) {
        updateTag(propertyTag, getChainTagsForKeys(obj, _dependentKeys, tagMeta, meta$$1));

        if (DEBUG) {
          ALLOW_CYCLES.set(propertyTag, true);
        }
      }

      meta$$1.setValueFor(keyName, ret);
      meta$$1.setRevisionFor(keyName, valueForTag(propertyTag));
      finishLazyChains(meta$$1, keyName, ret);
    }

    consumeTag(propertyTag); // Add the tag of the returned value if it is an array, since arrays
    // should always cause updates if they are consumed and then changed

    if (Array.isArray(ret)) {
      consumeTag(tagFor(ret, '[]'));
    }

    return ret;
  }

  set(obj, keyName, value) {
    if (this._readOnly) {
      this._throwReadOnlyError(obj, keyName);
    }

    if (!this._setter) {
      return this.clobberSet(obj, keyName, value);
    }

    if (this._volatile) {
      return this.volatileSet(obj, keyName, value);
    }

    let meta$$1 = meta(obj); // ensure two way binding works when the component has defined a computed
    // property with both a setter and dependent keys, in that scenario without
    // the sync observer added below the caller's value will never be updated
    //
    // See GH#18147 / GH#19028 for details.

    if ( // ensure that we only run this once, while the component is being instantiated
    meta$$1.isInitializing() && this._dependentKeys !== undefined && this._dependentKeys.length > 0 && // These two properties are set on Ember.Component
    typeof obj[PROPERTY_DID_CHANGE] === 'function' && obj.isComponent) {
      addObserver(obj, keyName, () => {
        obj[PROPERTY_DID_CHANGE](keyName);
      }, undefined, true);
    }

    let ret;

    try {
      beginPropertyChanges();
      ret = this._set(obj, keyName, value, meta$$1);
      finishLazyChains(meta$$1, keyName, ret);
      let tagMeta = tagMetaFor(obj);
      let propertyTag = tagFor(obj, keyName, tagMeta);
      let {
        _dependentKeys
      } = this;

      if (_dependentKeys !== undefined) {
        updateTag(propertyTag, getChainTagsForKeys(obj, _dependentKeys, tagMeta, meta$$1));

        if (DEBUG) {
          ALLOW_CYCLES.set(propertyTag, true);
        }
      }

      meta$$1.setRevisionFor(keyName, valueForTag(propertyTag));
    } finally {
      endPropertyChanges();
    }

    return ret;
  }

  _throwReadOnlyError(obj, keyName) {
    throw new EmberError(`Cannot set read-only property "${keyName}" on object: ${inspect(obj)}`);
  }

  clobberSet(obj, keyName, value) {
    deprecate(`The ${toString(obj)}#${keyName} computed property was just overridden. This removes the computed property and replaces it with a plain value, and has been deprecated. If you want this behavior, consider defining a setter which does it manually.`, false, {
      id: 'computed-property.override',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_computed-property-override',
      for: 'ember-source',
      since: {
        enabled: '3.9.0-beta.1'
      }
    });
    let cachedValue = meta(obj).valueFor(keyName);
    defineProperty(obj, keyName, null, cachedValue);
    set(obj, keyName, value);
    return value;
  }

  volatileSet(obj, keyName, value) {
    return this._setter.call(obj, keyName, value);
  }

  _set(obj, keyName, value, meta$$1) {
    let hadCachedValue = meta$$1.revisionFor(keyName) !== undefined;
    let cachedValue = meta$$1.valueFor(keyName);
    let ret;
    let {
      _setter
    } = this;
    setObserverSuspended(obj, keyName, true);

    try {
      ret = _setter.call(obj, keyName, value, cachedValue);
    } finally {
      setObserverSuspended(obj, keyName, false);
    } // allows setter to return the same value that is cached already


    if (hadCachedValue && cachedValue === ret) {
      return ret;
    }

    meta$$1.setValueFor(keyName, ret);
    notifyPropertyChange(obj, keyName, meta$$1, value);
    return ret;
  }
  /* called before property is overridden */


  teardown(obj, keyName, meta$$1) {
    if (!this._volatile) {
      if (meta$$1.revisionFor(keyName) !== undefined) {
        meta$$1.setRevisionFor(keyName, undefined);
        meta$$1.setValueFor(keyName, undefined);
      }
    }

    super.teardown(obj, keyName, meta$$1);
  }

}

class AutoComputedProperty extends ComputedProperty {
  get(obj, keyName) {
    if (this._volatile) {
      return this._getter.call(obj, keyName);
    }

    let meta$$1 = meta(obj);
    let tagMeta = tagMetaFor(obj);
    let propertyTag = tagFor(obj, keyName, tagMeta);
    let ret;
    let revision = meta$$1.revisionFor(keyName);

    if (revision !== undefined && validateTag(propertyTag, revision)) {
      ret = meta$$1.valueFor(keyName);
    } else {
      assert(`Attempted to access the computed ${obj}.${keyName} on a destroyed object, which is not allowed`, !isDestroyed(obj));
      let {
        _getter
      } = this; // Create a tracker that absorbs any trackable actions inside the CP

      let tag = track(() => {
        ret = _getter.call(obj, keyName);
      });
      updateTag(propertyTag, tag);
      meta$$1.setValueFor(keyName, ret);
      meta$$1.setRevisionFor(keyName, valueForTag(propertyTag));
      finishLazyChains(meta$$1, keyName, ret);
    }

    consumeTag(propertyTag); // Add the tag of the returned value if it is an array, since arrays
    // should always cause updates if they are consumed and then changed

    if (Array.isArray(ret)) {
      consumeTag(tagFor(ret, '[]', tagMeta));
    }

    return ret;
  }

} // TODO: This class can be svelted once `meta` has been deprecated


class ComputedDecoratorImpl extends Function {
  /**
    Call on a computed property to set it into read-only mode. When in this
    mode the computed property will throw an error when set.
       Example:
       ```javascript
    import { computed, set } from '@ember/object';
       class Person {
      @computed().readOnly()
      get guid() {
        return 'guid-guid-guid';
      }
    }
       let person = new Person();
    set(person, 'guid', 'new-guid'); // will throw an exception
    ```
       Classic Class Example:
       ```javascript
    import EmberObject, { computed } from '@ember/object';
       let Person = EmberObject.extend({
      guid: computed(function() {
        return 'guid-guid-guid';
      }).readOnly()
    });
       let person = Person.create();
    person.set('guid', 'new-guid'); // will throw an exception
    ```
       @method readOnly
    @return {ComputedProperty} this
    @chainable
    @public
  */
  readOnly() {
    let desc = descriptorForDecorator(this);
    assert('Computed properties that define a setter using the new syntax cannot be read-only', !(desc._setter && desc._setter !== desc._getter));
    desc._readOnly = true;
    return this;
  }
  /**
    Call on a computed property to set it into non-cached mode. When in this
    mode the computed property will not automatically cache the return value.
    It also does not automatically fire any change events. You must manually notify
    any changes if you want to observe this property.
       Dependency keys have no effect on volatile properties as they are for cache
    invalidation and notification when cached value is invalidated.
       Example:
       ```javascript
    import { computed } from '@ember/object';
       class CallCounter {
      _calledCount = 0;
         @computed().volatile()
      get calledCount() {
        return this._calledCount++;
      }
    }
    ```
       Classic Class Example:
       ```javascript
    import EmberObject, { computed } from '@ember/object';
       let CallCounter = EmberObject.extend({
      _calledCount: 0,
         value: computed(function() {
        return this._calledCount++;
      }).volatile()
    });
    ```
    @method volatile
    @deprecated
    @return {ComputedProperty} this
    @chainable
    @public
  */


  volatile() {
    deprecate('Setting a computed property as volatile has been deprecated. Instead, consider using a native getter with native class syntax.', false, {
      id: 'computed-property.volatile',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_computed-property-volatile',
      for: 'ember-source',
      since: {
        enabled: '3.9.0-beta.1'
      }
    });
    descriptorForDecorator(this)._volatile = true;
    return this;
  }
  /**
    Sets the dependent keys on this computed property. Pass any number of
    arguments containing key paths that this computed property depends on.
       Example:
       ```javascript
    import EmberObject, { computed } from '@ember/object';
       class President {
      constructor(firstName, lastName) {
        set(this, 'firstName', firstName);
        set(this, 'lastName', lastName);
      }
         // Tell Ember that this computed property depends on firstName
      // and lastName
      @computed().property('firstName', 'lastName')
      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      }
    }
       let president = new President('Barack', 'Obama');
       president.fullName; // 'Barack Obama'
    ```
       Classic Class Example:
       ```javascript
    import EmberObject, { computed } from '@ember/object';
       let President = EmberObject.extend({
      fullName: computed(function() {
        return this.get('firstName') + ' ' + this.get('lastName');
           // Tell Ember that this computed property depends on firstName
        // and lastName
      }).property('firstName', 'lastName')
    });
       let president = President.create({
      firstName: 'Barack',
      lastName: 'Obama'
    });
       president.get('fullName'); // 'Barack Obama'
    ```
       @method property
    @deprecated
    @param {String} path* zero or more property paths
    @return {ComputedProperty} this
    @chainable
    @public
  */


  property(...keys) {
    deprecate('Setting dependency keys using the `.property()` modifier has been deprecated. Pass the dependency keys directly to computed as arguments instead. If you are using `.property()` on a computed property macro, consider refactoring your macro to receive additional dependent keys in its initial declaration.', false, {
      id: 'computed-property.property',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_computed-property-property',
      for: 'ember-source',
      since: {
        enabled: '3.9.0-beta.1'
      }
    });

    descriptorForDecorator(this)._property(...keys);

    return this;
  }
  /**
    In some cases, you may want to annotate computed properties with additional
    metadata about how they function or what values they operate on. For example,
    computed property functions may close over variables that are then no longer
    available for introspection. You can pass a hash of these values to a
    computed property.
       Example:
       ```javascript
    import { computed } from '@ember/object';
    import Person from 'my-app/utils/person';
       class Store {
      @computed().meta({ type: Person })
      get person() {
        let personId = this.personId;
        return Person.create({ id: personId });
      }
    }
    ```
       Classic Class Example:
       ```javascript
    import { computed } from '@ember/object';
    import Person from 'my-app/utils/person';
       const Store = EmberObject.extend({
      person: computed(function() {
        let personId = this.get('personId');
        return Person.create({ id: personId });
      }).meta({ type: Person })
    });
    ```
       The hash that you pass to the `meta()` function will be saved on the
    computed property descriptor under the `_meta` key. Ember runtime
    exposes a public API for retrieving these values from classes,
    via the `metaForProperty()` function.
       @method meta
    @param {Object} meta
    @chainable
    @public
  */


  meta(meta$$1) {
    let prop = descriptorForDecorator(this);

    if (arguments.length === 0) {
      return prop._meta || {};
    } else {
      prop._meta = meta$$1;
      return this;
    }
  } // TODO: Remove this when we can provide alternatives in the ecosystem to
  // addons such as ember-macro-helpers that use it.


  get _getter() {
    return descriptorForDecorator(this)._getter;
  } // TODO: Refactor this, this is an internal API only


  set enumerable(value) {
    descriptorForDecorator(this).enumerable = value;
  }

}

function computed(...args) {
  assert(`@computed can only be used directly as a native decorator. If you're using tracked in classic classes, add parenthesis to call it like a function: computed()`, !(isElementDescriptor(args.slice(0, 3)) && args.length === 5 && args[4] === true));

  if (isElementDescriptor(args)) {
    let decorator = makeComputedDecorator(new ComputedProperty([]), ComputedDecoratorImpl);
    return decorator(args[0], args[1], args[2]);
  }

  return makeComputedDecorator(new ComputedProperty(args), ComputedDecoratorImpl);
}
function autoComputed(...config) {
  return makeComputedDecorator(new AutoComputedProperty(config), ComputedDecoratorImpl);
}
/**
  Allows checking if a given property on an object is a computed property. For the most part,
  this doesn't matter (you would normally just access the property directly and use its value),
  but for some tooling specific scenarios (e.g. the ember-inspector) it is important to
  differentiate if a property is a computed property or a "normal" property.

  This will work on either a class's prototype or an instance itself.

  @static
  @method isComputed
  @for @ember/debug
  @private
 */

function isComputed(obj, key) {
  return Boolean(descriptorForProperty(obj, key));
}
const _globalsComputed = computed.bind(null);

function getCachedValueFor(obj, key) {
  let meta$$1 = peekMeta(obj);

  if (meta$$1) {
    return meta$$1.valueFor(key);
  }
}

function alias(altKey) {
  assert('You attempted to use @alias as a decorator directly, but it requires a `altKey` parameter', !isElementDescriptor(Array.prototype.slice.call(arguments)));
  return makeComputedDecorator(new AliasedProperty(altKey), AliasDecoratorImpl);
} // TODO: This class can be svelted once `meta` has been deprecated

class AliasDecoratorImpl extends Function {
  readOnly() {
    descriptorForDecorator(this).readOnly();
    return this;
  }

  oneWay() {
    descriptorForDecorator(this).oneWay();
    return this;
  }

  meta(meta$$1) {
    let prop = descriptorForDecorator(this);

    if (arguments.length === 0) {
      return prop._meta || {};
    } else {
      prop._meta = meta$$1;
    }
  }

}

class AliasedProperty extends ComputedDescriptor {
  constructor(altKey) {
    super();
    this.altKey = altKey;
  }

  setup(obj, keyName, propertyDesc, meta$$1) {
    assert(`Setting alias '${keyName}' on self`, this.altKey !== keyName);
    super.setup(obj, keyName, propertyDesc, meta$$1);
    CHAIN_PASS_THROUGH.add(this);
  }

  get(obj, keyName) {
    let ret;
    let meta$$1 = meta(obj);
    let tagMeta = tagMetaFor(obj);
    let propertyTag = tagFor(obj, keyName, tagMeta); // We don't use the tag since CPs are not automatic, we just want to avoid
    // anything tracking while we get the altKey

    untrack(() => {
      ret = get(obj, this.altKey);
    });
    let lastRevision = meta$$1.revisionFor(keyName);

    if (lastRevision === undefined || !validateTag(propertyTag, lastRevision)) {
      updateTag(propertyTag, getChainTagsForKey(obj, this.altKey, tagMeta, meta$$1));
      meta$$1.setRevisionFor(keyName, valueForTag(propertyTag));
      finishLazyChains(meta$$1, keyName, ret);
    }

    consumeTag(propertyTag);
    return ret;
  }

  set(obj, _keyName, value) {
    return set(obj, this.altKey, value);
  }

  readOnly() {
    this.set = AliasedProperty_readOnlySet;
  }

  oneWay() {
    this.set = AliasedProperty_oneWaySet;
  }

}

function AliasedProperty_readOnlySet(obj, keyName) {
  // eslint-disable-line no-unused-vars
  throw new EmberError(`Cannot set read-only property '${keyName}' on object: ${inspect(obj)}`);
}

function AliasedProperty_oneWaySet(obj, keyName, value) {
  defineProperty(obj, keyName, null);
  return set(obj, keyName, value);
}

/**
@module ember
*/
/**
  Used internally to allow changing properties in a backwards compatible way, and print a helpful
  deprecation warning.

  @method deprecateProperty
  @param {Object} object The object to add the deprecated property to.
  @param {String} deprecatedKey The property to add (and print deprecation warnings upon accessing).
  @param {String} newKey The property that will be aliased.
  @private
  @since 1.7.0
*/

function deprecateProperty(object, deprecatedKey, newKey, options) {
  function _deprecate() {
    deprecate(`Usage of \`${deprecatedKey}\` is deprecated, use \`${newKey}\` instead.`, false, options);
  }

  Object.defineProperty(object, deprecatedKey, {
    configurable: true,
    enumerable: false,

    set(value) {
      _deprecate();

      set(this, newKey, value);
    },

    get() {
      _deprecate();

      return get(this, newKey);
    }

  });
}

const EACH_PROXIES = new WeakMap();
function eachProxyArrayWillChange(array, idx, removedCnt, addedCnt) {
  let eachProxy = EACH_PROXIES.get(array);

  if (eachProxy !== undefined) {
    eachProxy.arrayWillChange(array, idx, removedCnt, addedCnt);
  }
}
function eachProxyArrayDidChange(array, idx, removedCnt, addedCnt) {
  let eachProxy = EACH_PROXIES.get(array);

  if (eachProxy !== undefined) {
    eachProxy.arrayDidChange(array, idx, removedCnt, addedCnt);
  }
}

/**
 @module @ember/utils
*/

/**
  Returns true if the passed value is null or undefined. This avoids errors
  from JSLint complaining about use of ==, which can be technically
  confusing.

  ```javascript
  isNone();              // true
  isNone(null);          // true
  isNone(undefined);     // true
  isNone('');            // false
  isNone([]);            // false
  isNone(function() {}); // false
  ```

  @method isNone
  @static
  @for @ember/utils
  @param {Object} obj Value to test
  @return {Boolean}
  @public
*/
function isNone(obj) {
  return obj === null || obj === undefined;
}

/**
 @module @ember/utils
*/

/**
  Verifies that a value is `null` or `undefined`, an empty string, or an empty
  array.

  Constrains the rules on `isNone` by returning true for empty strings and
  empty arrays.

  If the value is an object with a `size` property of type number, it is used
  to check emptiness.

  ```javascript
  isEmpty();                 // true
  isEmpty(null);             // true
  isEmpty(undefined);        // true
  isEmpty('');               // true
  isEmpty([]);               // true
  isEmpty({ size: 0});       // true
  isEmpty({});               // false
  isEmpty('Adam Hawkins');   // false
  isEmpty([0,1,2]);          // false
  isEmpty('\n\t');           // false
  isEmpty('  ');             // false
  isEmpty({ size: 1 })       // false
  isEmpty({ size: () => 0 }) // false
  ```

  @method isEmpty
  @static
  @for @ember/utils
  @param {Object} obj Value to test
  @return {Boolean}
  @public
*/

function isEmpty(obj) {
  let none = obj === null || obj === undefined;

  if (none) {
    return none;
  }

  if (typeof obj.size === 'number') {
    return !obj.size;
  }

  let objectType = typeof obj;

  if (objectType === 'object') {
    let size = get(obj, 'size');

    if (typeof size === 'number') {
      return !size;
    }
  }

  if (typeof obj.length === 'number' && objectType !== 'function') {
    return !obj.length;
  }

  if (objectType === 'object') {
    let length = get(obj, 'length');

    if (typeof length === 'number') {
      return !length;
    }
  }

  return false;
}

/**
 @module @ember/utils
*/

/**
  A value is blank if it is empty or a whitespace string.

  ```javascript
  import { isBlank } from '@ember/utils';

  isBlank();                // true
  isBlank(null);            // true
  isBlank(undefined);       // true
  isBlank('');              // true
  isBlank([]);              // true
  isBlank('\n\t');          // true
  isBlank('  ');            // true
  isBlank({});              // false
  isBlank('\n\t Hello');    // false
  isBlank('Hello world');   // false
  isBlank([1,2,3]);         // false
  ```

  @method isBlank
  @static
  @for @ember/utils
  @param {Object} obj Value to test
  @return {Boolean}
  @since 1.5.0
  @public
*/

function isBlank(obj) {
  return isEmpty(obj) || typeof obj === 'string' && /\S/.test(obj) === false;
}

/**
 @module @ember/utils
*/

/**
  A value is present if it not `isBlank`.

  ```javascript
  isPresent();                // false
  isPresent(null);            // false
  isPresent(undefined);       // false
  isPresent('');              // false
  isPresent('  ');            // false
  isPresent('\n\t');          // false
  isPresent([]);              // false
  isPresent({ length: 0 });   // false
  isPresent(false);           // true
  isPresent(true);            // true
  isPresent('string');        // true
  isPresent(0);               // true
  isPresent(function() {});   // true
  isPresent({});              // true
  isPresent('\n\t Hello');    // true
  isPresent([1, 2, 3]);       // true
  ```

  @method isPresent
  @static
  @for @ember/utils
  @param {Object} obj Value to test
  @return {Boolean}
  @since 1.8.0
  @public
*/

function isPresent(obj) {
  return !isBlank(obj);
}

/**
 @module ember
*/

/**
  Helper class that allows you to register your library with Ember.

  Singleton created at `Ember.libraries`.

  @class Libraries
  @constructor
  @private
*/

class Libraries {
  constructor() {
    this._registry = [];
    this._coreLibIndex = 0;
  }

  _getLibraryByName(name) {
    let libs = this._registry;
    let count = libs.length;

    for (let i = 0; i < count; i++) {
      if (libs[i].name === name) {
        return libs[i];
      }
    }

    return undefined;
  }

  register(name, version, isCoreLibrary) {
    let index = this._registry.length;

    if (!this._getLibraryByName(name)) {
      if (isCoreLibrary) {
        index = this._coreLibIndex++;
      }

      this._registry.splice(index, 0, {
        name,
        version
      });
    } else {
      warn(`Library "${name}" is already registered with Ember.`, false, {
        id: 'ember-metal.libraries-register'
      });
    }
  }

  registerCoreLibrary(name, version) {
    this.register(name, version, true);
  }

  deRegister(name) {
    let lib = this._getLibraryByName(name);

    let index;

    if (lib) {
      index = this._registry.indexOf(lib);

      this._registry.splice(index, 1);
    }
  }

}

if (DEBUG) {
  Libraries.prototype.logVersions = function () {
    let libs = this._registry;
    let nameLengths = libs.map(item => get(item, 'name.length'));
    let maxNameLength = Math.max.apply(null, nameLengths);
    debug('-------------------------------');

    for (let i = 0; i < libs.length; i++) {
      let lib = libs[i];
      let spaces = new Array(maxNameLength - lib.name.length + 1).join(' ');
      debug([lib.name, spaces, ' : ', lib.version].join(''));
    }

    debug('-------------------------------');
  };
}

const LIBRARIES = new Libraries();
LIBRARIES.registerCoreLibrary('Ember', VERSION);

/**
 @module @ember/object
*/

/**
  To get multiple properties at once, call `getProperties`
  with an object followed by a list of strings or an array:

  ```javascript
  import { getProperties } from '@ember/object';

  getProperties(record, 'firstName', 'lastName', 'zipCode');
  // { firstName: 'John', lastName: 'Doe', zipCode: '10011' }
  ```

  is equivalent to:

  ```javascript
  import { getProperties } from '@ember/object';

  getProperties(record, ['firstName', 'lastName', 'zipCode']);
  // { firstName: 'John', lastName: 'Doe', zipCode: '10011' }
  ```

  @method getProperties
  @static
  @for @ember/object
  @param {Object} obj
  @param {String...|Array} list of keys to get
  @return {Object}
  @public
*/

function getProperties(obj, keys) {
  let ret = {};
  let propertyNames = arguments;
  let i = 1;

  if (arguments.length === 2 && Array.isArray(keys)) {
    i = 0;
    propertyNames = arguments[1];
  }

  for (; i < propertyNames.length; i++) {
    ret[propertyNames[i]] = get(obj, propertyNames[i]);
  }

  return ret;
}

/**
 @module @ember/object
*/

/**
  Set a list of properties on an object. These properties are set inside
  a single `beginPropertyChanges` and `endPropertyChanges` batch, so
  observers will be buffered.

  ```javascript
  import EmberObject from '@ember/object';
  let anObject = EmberObject.create();

  anObject.setProperties({
    firstName: 'Stanley',
    lastName: 'Stuart',
    age: 21
  });
  ```

  @method setProperties
  @static
  @for @ember/object
  @param obj
  @param {Object} properties
  @return properties
  @public
*/

function setProperties(obj, properties) {
  if (properties === null || typeof properties !== 'object') {
    return properties;
  }

  changeProperties(() => {
    let props = Object.keys(properties);
    let propertyName;

    for (let i = 0; i < props.length; i++) {
      propertyName = props[i];
      set(obj, propertyName, properties[propertyName]);
    }
  });
  return properties;
}

// move into its own package
// it is needed by Mixin for classToString
// maybe move it into environment

const hasOwnProperty = Object.prototype.hasOwnProperty;
let searchDisabled = false;
const flags = {
  _set: 0,
  _unprocessedNamespaces: false,

  get unprocessedNamespaces() {
    return this._unprocessedNamespaces;
  },

  set unprocessedNamespaces(v) {
    this._set++;
    this._unprocessedNamespaces = v;
  }

};
let unprocessedMixins = false;
const NAMESPACES = [];
const NAMESPACES_BY_ID = Object.create(null);
function addNamespace(namespace) {
  flags.unprocessedNamespaces = true;
  NAMESPACES.push(namespace);
}
function removeNamespace(namespace) {
  let name = getName(namespace);
  delete NAMESPACES_BY_ID[name];
  NAMESPACES.splice(NAMESPACES.indexOf(namespace), 1);

  if (name in context.lookup && namespace === context.lookup[name]) {
    context.lookup[name] = undefined;
  }
}
function findNamespaces() {
  if (!flags.unprocessedNamespaces) {
    return;
  }

  let lookup = context.lookup;
  let keys = Object.keys(lookup);

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i]; // Only process entities that start with uppercase A-Z

    if (!isUppercase(key.charCodeAt(0))) {
      continue;
    }

    let obj = tryIsNamespace(lookup, key);

    if (obj) {
      setName(obj, key);
    }
  }
}
function findNamespace(name) {
  if (!searchDisabled) {
    processAllNamespaces();
  }

  return NAMESPACES_BY_ID[name];
}
function processNamespace(namespace) {
  _processNamespace([namespace.toString()], namespace, new Set());
}
function processAllNamespaces() {
  let unprocessedNamespaces = flags.unprocessedNamespaces;

  if (unprocessedNamespaces) {
    findNamespaces();
    flags.unprocessedNamespaces = false;
  }

  if (unprocessedNamespaces || unprocessedMixins) {
    let namespaces = NAMESPACES;

    for (let i = 0; i < namespaces.length; i++) {
      processNamespace(namespaces[i]);
    }

    unprocessedMixins = false;
  }
}
function classToString() {
  let name = getName(this);

  if (name !== void 0) {
    return name;
  }

  name = calculateToString(this);
  setName(this, name);
  return name;
}
function isSearchDisabled() {
  return searchDisabled;
}
function setSearchDisabled(flag) {
  searchDisabled = Boolean(flag);
}
function setUnprocessedMixins() {
  unprocessedMixins = true;
}

function _processNamespace(paths, root, seen) {
  let idx = paths.length;
  let id = paths.join('.');
  NAMESPACES_BY_ID[id] = root;
  setName(root, id); // Loop over all of the keys in the namespace, looking for classes

  for (let key in root) {
    if (!hasOwnProperty.call(root, key)) {
      continue;
    }

    let obj = root[key]; // If we are processing the `Ember` namespace, for example, the
    // `paths` will start with `["Ember"]`. Every iteration through
    // the loop will update the **second** element of this list with
    // the key, so processing `Ember.View` will make the Array
    // `['Ember', 'View']`.

    paths[idx] = key; // If we have found an unprocessed class

    if (obj && obj.toString === classToString && getName(obj) === void 0) {
      // Replace the class' `toString` with the dot-separated path
      setName(obj, paths.join('.')); // Support nested namespaces
    } else if (obj && obj.isNamespace) {
      // Skip aliased namespaces
      if (seen.has(obj)) {
        continue;
      }

      seen.add(obj); // Process the child namespace

      _processNamespace(paths, obj, seen);
    }
  }

  paths.length = idx; // cut out last item
}

function isUppercase(code) {
  return code >= 65 && code <= 90 // A
  ; // Z
}

function tryIsNamespace(lookup, prop) {
  try {
    let obj = lookup[prop];
    return (obj !== null && typeof obj === 'object' || typeof obj === 'function') && obj.isNamespace && obj;
  } catch (e) {// continue
  }
}

function calculateToString(target) {
  let str;

  if (!searchDisabled) {
    processAllNamespaces();
    str = getName(target);

    if (str !== void 0) {
      return str;
    }

    let superclass = target;

    do {
      superclass = Object.getPrototypeOf(superclass);

      if (superclass === Function.prototype || superclass === Object.prototype) {
        break;
      }

      str = getName(target);

      if (str !== void 0) {
        str = `(subclass of ${str})`;
        break;
      }
    } while (str === void 0);
  }

  return str || '(unknown)';
}

/**
@module @ember/object
*/
const a_concat = Array.prototype.concat;
const {
  isArray
} = Array;

function extractAccessors(properties) {
  if (properties !== undefined) {
    let keys = Object.keys(properties);

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let desc = Object.getOwnPropertyDescriptor(properties, key);

      if (desc.get !== undefined || desc.set !== undefined) {
        Object.defineProperty(properties, key, {
          value: nativeDescDecorator(desc)
        });
      }
    }
  }

  return properties;
}

function concatenatedMixinProperties(concatProp, props, values, base) {
  // reset before adding each new mixin to pickup concats from previous
  let concats = values[concatProp] || base[concatProp];

  if (props[concatProp]) {
    concats = concats ? a_concat.call(concats, props[concatProp]) : props[concatProp];
  }

  return concats;
}

function giveDecoratorSuper(key, decorator, property, descs) {
  if (property === true) {
    return decorator;
  }

  let originalGetter = property._getter;

  if (originalGetter === undefined) {
    return decorator;
  }

  let superDesc = descs[key]; // Check to see if the super property is a decorator first, if so load its descriptor

  let superProperty = typeof superDesc === 'function' ? descriptorForDecorator(superDesc) : superDesc;

  if (superProperty === undefined || superProperty === true) {
    return decorator;
  }

  let superGetter = superProperty._getter;

  if (superGetter === undefined) {
    return decorator;
  }

  let get = wrap(originalGetter, superGetter);
  let set;
  let originalSetter = property._setter;
  let superSetter = superProperty._setter;

  if (superSetter !== undefined) {
    if (originalSetter !== undefined) {
      set = wrap(originalSetter, superSetter);
    } else {
      // If the super property has a setter, we default to using it no matter what.
      // This is clearly very broken and weird, but it's what was here so we have
      // to keep it until the next major at least.
      //
      // TODO: Add a deprecation here.
      set = superSetter;
    }
  } else {
    set = originalSetter;
  } // only create a new CP if we must


  if (get !== originalGetter || set !== originalSetter) {
    // Since multiple mixins may inherit from the same parent, we need
    // to clone the computed property so that other mixins do not receive
    // the wrapped version.
    let dependentKeys = property._dependentKeys || [];
    let newProperty = new ComputedProperty([...dependentKeys, {
      get,
      set
    }]);
    newProperty._readOnly = property._readOnly;
    newProperty._volatile = property._volatile;
    newProperty._meta = property._meta;
    newProperty.enumerable = property.enumerable;
    return makeComputedDecorator(newProperty, ComputedProperty);
  }

  return decorator;
}

function giveMethodSuper(key, method, values, descs) {
  // Methods overwrite computed properties, and do not call super to them.
  if (descs[key] !== undefined) {
    return method;
  } // Find the original method in a parent mixin


  let superMethod = values[key]; // Only wrap the new method if the original method was a function

  if (typeof superMethod === 'function') {
    return wrap(method, superMethod);
  }

  return method;
}

function applyConcatenatedProperties(key, value, values) {
  let baseValue = values[key];
  let ret = makeArray(baseValue).concat(makeArray(value));

  if (DEBUG) {
    // it is possible to use concatenatedProperties with strings (which cannot be frozen)
    // only freeze objects...
    if (typeof ret === 'object' && ret !== null) {
      // prevent mutating `concatenatedProperties` array after it is applied
      Object.freeze(ret);
    }
  }

  return ret;
}

function applyMergedProperties(key, value, values) {
  let baseValue = values[key];
  assert(`You passed in \`${JSON.stringify(value)}\` as the value for \`${key}\` but \`${key}\` cannot be an Array`, !isArray(value));

  if (!baseValue) {
    return value;
  }

  let newBase = assign({}, baseValue);
  let hasFunction = false;
  let props = Object.keys(value);

  for (let i = 0; i < props.length; i++) {
    let prop = props[i];
    let propValue = value[prop];

    if (typeof propValue === 'function') {
      hasFunction = true;
      newBase[prop] = giveMethodSuper(prop, propValue, baseValue, {});
    } else {
      newBase[prop] = propValue;
    }
  }

  if (hasFunction) {
    newBase._super = ROOT;
  }

  return newBase;
}

function mergeMixins(mixins, meta$$1, descs, values, base, keys, keysWithSuper) {
  let currentMixin;

  for (let i = 0; i < mixins.length; i++) {
    currentMixin = mixins[i];
    assert(`Expected hash or Mixin instance, got ${Object.prototype.toString.call(currentMixin)}`, typeof currentMixin === 'object' && currentMixin !== null && Object.prototype.toString.call(currentMixin) !== '[object Array]');

    if (MIXINS.has(currentMixin)) {
      if (meta$$1.hasMixin(currentMixin)) {
        continue;
      }

      meta$$1.addMixin(currentMixin);
      let {
        properties,
        mixins
      } = currentMixin;

      if (properties !== undefined) {
        mergeProps(meta$$1, properties, descs, values, base, keys, keysWithSuper);
      } else if (mixins !== undefined) {
        mergeMixins(mixins, meta$$1, descs, values, base, keys, keysWithSuper);

        if (currentMixin._without !== undefined) {
          currentMixin._without.forEach(keyName => {
            // deleting the key means we won't process the value
            let index = keys.indexOf(keyName);

            if (index !== -1) {
              keys.splice(index, 1);
            }
          });
        }
      }
    } else {
      mergeProps(meta$$1, currentMixin, descs, values, base, keys, keysWithSuper);
    }
  }
}

function mergeProps(meta$$1, props, descs, values, base, keys, keysWithSuper) {
  let concats = concatenatedMixinProperties('concatenatedProperties', props, values, base);
  let mergings = concatenatedMixinProperties('mergedProperties', props, values, base);
  let propKeys = Object.keys(props);

  for (let i = 0; i < propKeys.length; i++) {
    let key = propKeys[i];
    let value = props[key];
    if (value === undefined) continue;

    if (keys.indexOf(key) === -1) {
      keys.push(key);
      let desc = meta$$1.peekDescriptors(key);

      if (desc === undefined) {
        // The superclass did not have a CP, which means it may have
        // observers or listeners on that property.
        let prev = values[key] = base[key];

        if (typeof prev === 'function') {
          updateObserversAndListeners(base, key, prev, false);
        }
      } else {
        descs[key] = desc; // The super desc will be overwritten on descs, so save off the fact that
        // there was a super so we know to Object.defineProperty when writing
        // the value

        keysWithSuper.push(key);
        desc.teardown(base, key, meta$$1);
      }
    }

    let isFunction = typeof value === 'function';

    if (isFunction) {
      let desc = descriptorForDecorator(value);

      if (desc !== undefined) {
        // Wrap descriptor function to implement _super() if needed
        descs[key] = giveDecoratorSuper(key, value, desc, descs);
        values[key] = undefined;
        continue;
      }
    }

    if (concats && concats.indexOf(key) >= 0 || key === 'concatenatedProperties' || key === 'mergedProperties') {
      value = applyConcatenatedProperties(key, value, values);
    } else if (mergings && mergings.indexOf(key) > -1) {
      value = applyMergedProperties(key, value, values);
    } else if (isFunction) {
      value = giveMethodSuper(key, value, values, descs);
    }

    values[key] = value;
    descs[key] = undefined;
  }
}

let followMethodAlias;

if (ALIAS_METHOD) {
  followMethodAlias = function (obj, alias, descs, values) {
    let altKey = alias.methodName;
    let possibleDesc;
    let desc = descs[altKey];
    let value = values[altKey];

    if (desc !== undefined || value !== undefined) {// do nothing
    } else if ((possibleDesc = descriptorForProperty(obj, altKey)) !== undefined) {
      desc = possibleDesc;
      value = undefined;
    } else {
      desc = undefined;
      value = obj[altKey];
    }

    return {
      desc,
      value
    };
  };
}

function updateObserversAndListeners(obj, key, fn, add) {
  let meta$$1 = observerListenerMetaFor(fn);
  if (meta$$1 === undefined) return;
  let {
    observers,
    listeners
  } = meta$$1;

  if (observers !== undefined) {
    let updateObserver = add ? addObserver : removeObserver;

    for (let i = 0; i < observers.paths.length; i++) {
      updateObserver(obj, observers.paths[i], null, key, observers.sync);
    }
  }

  if (listeners !== undefined) {
    let updateListener = add ? addListener : removeListener;

    for (let i = 0; i < listeners.length; i++) {
      updateListener(obj, listeners[i], null, key);
    }
  }
}

function applyMixin(obj, mixins, _hideKeys = false) {
  let descs = Object.create(null);
  let values = Object.create(null);
  let meta$$1 = meta(obj);
  let keys = [];
  let keysWithSuper = [];
  obj._super = ROOT; // Go through all mixins and hashes passed in, and:
  //
  // * Handle concatenated properties
  // * Handle merged properties
  // * Set up _super wrapping if necessary
  // * Set up computed property descriptors
  // * Copying `toString` in broken browsers

  mergeMixins(mixins, meta$$1, descs, values, obj, keys, keysWithSuper);

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let value = values[key];
    let desc = descs[key];

    if (ALIAS_METHOD) {
      while (value !== undefined && isAlias(value)) {
        let followed = followMethodAlias(obj, value, descs, values);
        desc = followed.desc;
        value = followed.value;
      }
    }

    if (value !== undefined) {
      if (typeof value === 'function') {
        updateObserversAndListeners(obj, key, value, true);
      }

      defineValue(obj, key, value, keysWithSuper.indexOf(key) !== -1, !_hideKeys);
    } else if (desc !== undefined) {
      defineDecorator(obj, key, desc, meta$$1);
    }
  }

  if (!meta$$1.isPrototypeMeta(obj)) {
    revalidateObservers(obj);
  }

  return obj;
}
/**
  @method mixin
  @param obj
  @param mixins*
  @return obj
  @private
*/

function mixin(obj, ...args) {
  applyMixin(obj, args);
  return obj;
}
const MIXINS = new _WeakSet();
/**
  The `Mixin` class allows you to create mixins, whose properties can be
  added to other classes. For instance,

  ```javascript
  import Mixin from '@ember/object/mixin';

  const EditableMixin = Mixin.create({
    edit() {
      console.log('starting to edit');
      this.set('isEditing', true);
    },
    isEditing: false
  });
  ```

  ```javascript
  import EmberObject from '@ember/object';
  import EditableMixin from '../mixins/editable';

  // Mix mixins into classes by passing them as the first arguments to
  // `.extend.`
  const Comment = EmberObject.extend(EditableMixin, {
    post: null
  });

  let comment = Comment.create({
    post: somePost
  });

  comment.edit(); // outputs 'starting to edit'
  ```

  Note that Mixins are created with `Mixin.create`, not
  `Mixin.extend`.

  Note that mixins extend a constructor's prototype so arrays and object literals
  defined as properties will be shared amongst objects that implement the mixin.
  If you want to define a property in a mixin that is not shared, you can define
  it either as a computed property or have it be created on initialization of the object.

  ```javascript
  // filters array will be shared amongst any object implementing mixin
  import Mixin from '@ember/object/mixin';
  import { A } from '@ember/array';

  const FilterableMixin = Mixin.create({
    filters: A()
  });
  ```

  ```javascript
  import Mixin from '@ember/object/mixin';
  import { A } from '@ember/array';
  import { computed } from '@ember/object';

  // filters will be a separate array for every object implementing the mixin
  const FilterableMixin = Mixin.create({
    filters: computed(function() {
      return A();
    })
  });
  ```

  ```javascript
  import Mixin from '@ember/object/mixin';
  import { A } from '@ember/array';

  // filters will be created as a separate array during the object's initialization
  const Filterable = Mixin.create({
    filters: null,

    init() {
      this._super(...arguments);
      this.set("filters", A());
    }
  });
  ```

  @class Mixin
  @public
*/

class Mixin {
  constructor(mixins, properties) {
    MIXINS.add(this);
    this.properties = extractAccessors(properties);
    this.mixins = buildMixinsArray(mixins);
    this.ownerConstructor = undefined;
    this._without = undefined;

    if (DEBUG) {
      /*
        In debug builds, we seal mixins to help avoid performance pitfalls.
               In IE11 there is a quirk that prevents sealed objects from being added
        to a WeakMap. Unfortunately, the mixin system currently relies on
        weak maps in `guidFor`, so we need to prime the guid cache weak map.
      */
      guidFor(this);
      Object.seal(this);
    }
  }
  /**
    @method create
    @for @ember/object/mixin
    @static
    @param arguments*
    @public
  */


  static create(...args) {
    setUnprocessedMixins();
    let M = this;
    return new M(args, undefined);
  } // returns the mixins currently applied to the specified object
  // TODO: Make `mixin`


  static mixins(obj) {
    let meta$$1 = peekMeta(obj);
    let ret = [];

    if (meta$$1 === null) {
      return ret;
    }

    meta$$1.forEachMixins(currentMixin => {
      // skip primitive mixins since these are always anonymous
      if (!currentMixin.properties) {
        ret.push(currentMixin);
      }
    });
    return ret;
  }
  /**
    @method reopen
    @param arguments*
    @private
  */


  reopen(...args) {
    if (args.length === 0) {
      return;
    }

    if (this.properties) {
      let currentMixin = new Mixin(undefined, this.properties);
      this.properties = undefined;
      this.mixins = [currentMixin];
    } else if (!this.mixins) {
      this.mixins = [];
    }

    this.mixins = this.mixins.concat(buildMixinsArray(args));
    return this;
  }
  /**
    @method apply
    @param obj
    @return applied object
    @private
  */


  apply(obj, _hideKeys = false) {
    // Ember.NativeArray is a normal Ember.Mixin that we mix into `Array.prototype` when prototype extensions are enabled
    // mutating a native object prototype like this should _not_ result in enumerable properties being added (or we have significant
    // issues with things like deep equality checks from test frameworks, or things like jQuery.extend(true, [], [])).
    //
    // _hideKeys disables enumerablity when applying the mixin. This is a hack, and we should stop mutating the array prototype by default 😫
    return applyMixin(obj, [this], _hideKeys);
  }

  applyPartial(obj) {
    return applyMixin(obj, [this]);
  }
  /**
    @method detect
    @param obj
    @return {Boolean}
    @private
  */


  detect(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    if (MIXINS.has(obj)) {
      return _detect(obj, this);
    }

    let meta$$1 = peekMeta(obj);

    if (meta$$1 === null) {
      return false;
    }

    return meta$$1.hasMixin(this);
  }

  without(...args) {
    let ret = new Mixin([this]);
    ret._without = args;
    return ret;
  }

  keys() {
    return _keys(this);
  }

  toString() {
    return '(unknown mixin)';
  }

}

function buildMixinsArray(mixins) {
  let length = mixins && mixins.length || 0;
  let m = undefined;

  if (length > 0) {
    m = new Array(length);

    for (let i = 0; i < length; i++) {
      let x = mixins[i];
      assert(`Expected hash or Mixin instance, got ${Object.prototype.toString.call(x)}`, typeof x === 'object' && x !== null && Object.prototype.toString.call(x) !== '[object Array]');

      if (MIXINS.has(x)) {
        m[i] = x;
      } else {
        m[i] = new Mixin(undefined, x);
      }
    }
  }

  return m;
}

Mixin.prototype.toString = classToString;

if (DEBUG) {
  Object.seal(Mixin.prototype);
}

function _detect(curMixin, targetMixin, seen = new Set()) {
  if (seen.has(curMixin)) {
    return false;
  }

  seen.add(curMixin);

  if (curMixin === targetMixin) {
    return true;
  }

  let mixins = curMixin.mixins;

  if (mixins) {
    return mixins.some(mixin => _detect(mixin, targetMixin, seen));
  }

  return false;
}

function _keys(mixin, ret = new Set(), seen = new Set()) {
  if (seen.has(mixin)) {
    return;
  }

  seen.add(mixin);

  if (mixin.properties) {
    let props = Object.keys(mixin.properties);

    for (let i = 0; i < props.length; i++) {
      ret.add(props[i]);
    }
  } else if (mixin.mixins) {
    mixin.mixins.forEach(x => _keys(x, ret, seen));
  }

  return ret;
}

let AliasImpl;
let isAlias;

if (ALIAS_METHOD) {
  const ALIASES = new _WeakSet();

  isAlias = alias => {
    return ALIASES.has(alias);
  };

  AliasImpl = class AliasImpl {
    constructor(methodName) {
      this.methodName = methodName;
      ALIASES.add(this);
    }

  };
}
/**
  Makes a method available via an additional name.

  ```app/utils/person.js
  import EmberObject, {
    aliasMethod
  } from '@ember/object';

  export default EmberObject.extend({
    name() {
      return 'Tomhuda Katzdale';
    },
    moniker: aliasMethod('name')
  });
  ```

  ```javascript
  let goodGuy = Person.create();

  goodGuy.name();    // 'Tomhuda Katzdale'
  goodGuy.moniker(); // 'Tomhuda Katzdale'
  ```

  @method aliasMethod
  @static
  @deprecated Use a shared utility method instead
  @for @ember/object
  @param {String} methodName name of the method to alias
  @public
*/


let aliasMethod;

if (ALIAS_METHOD) {
  aliasMethod = function aliasMethod(methodName) {
    deprecate(`You attempted to alias '${methodName}, but aliasMethod has been deprecated. Consider extracting the method into a shared utility function.`, false, {
      id: 'object.alias-method',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_object-alias-method',
      for: 'ember-source',
      since: {
        enabled: '3.9.0'
      }
    });
    return new AliasImpl(methodName);
  };
}

function observer(...args) {
  let funcOrDef = args.pop();
  assert('observer must be provided a function or an observer definition', typeof funcOrDef === 'function' || typeof funcOrDef === 'object' && funcOrDef !== null);
  let func, dependentKeys, sync;

  if (typeof funcOrDef === 'function') {
    func = funcOrDef;
    dependentKeys = args;
    sync = !ENV._DEFAULT_ASYNC_OBSERVERS;
  } else {
    func = funcOrDef.fn;
    dependentKeys = funcOrDef.dependentKeys;
    sync = funcOrDef.sync;
  }

  assert('observer called without a function', typeof func === 'function');
  assert('observer called without valid path', Array.isArray(dependentKeys) && dependentKeys.length > 0 && dependentKeys.every(p => typeof p === 'string' && Boolean(p.length)));
  assert('observer called without sync', typeof sync === 'boolean');
  let paths = [];

  for (let i = 0; i < dependentKeys.length; ++i) {
    expandProperties(dependentKeys[i], path => paths.push(path));
  }

  setObservers(func, {
    paths,
    sync
  });
  return func;
}

let DEBUG_INJECTION_FUNCTIONS;

if (DEBUG) {
  DEBUG_INJECTION_FUNCTIONS = new WeakMap();
}

function inject(type, ...args) {
  assert('a string type must be provided to inject', typeof type === 'string');
  let calledAsDecorator = isElementDescriptor(args);
  let name = calledAsDecorator ? undefined : args[0];

  let getInjection = function (propertyName) {
    let owner = getOwner(this) || this.container; // fallback to `container` for backwards compat

    assert(`Attempting to lookup an injected property on an object without a container, ensure that the object was instantiated via a container.`, Boolean(owner));
    return owner.lookup(`${type}:${name || propertyName}`);
  };

  if (DEBUG) {
    DEBUG_INJECTION_FUNCTIONS.set(getInjection, {
      type,
      name
    });
  }

  let decorator = computed({
    get: getInjection,

    set(keyName, value) {
      defineProperty(this, keyName, null, value);
    }

  });

  if (calledAsDecorator) {
    return decorator(args[0], args[1], args[2]);
  } else {
    return decorator;
  }
}

function tracked(...args) {
  assert(`@tracked can only be used directly as a native decorator. If you're using tracked in classic classes, add parenthesis to call it like a function: tracked()`, !(isElementDescriptor(args.slice(0, 3)) && args.length === 5 && args[4] === true));

  if (!isElementDescriptor(args)) {
    let propertyDesc = args[0];
    assert(`tracked() may only receive an options object containing 'value' or 'initializer', received ${propertyDesc}`, args.length === 0 || typeof propertyDesc === 'object' && propertyDesc !== null);

    if (DEBUG && propertyDesc) {
      let keys = Object.keys(propertyDesc);
      assert(`The options object passed to tracked() may only contain a 'value' or 'initializer' property, not both. Received: [${keys}]`, keys.length <= 1 && (keys[0] === undefined || keys[0] === 'value' || keys[0] === 'initializer'));
      assert(`The initializer passed to tracked must be a function. Received ${propertyDesc.initializer}`, !('initializer' in propertyDesc) || typeof propertyDesc.initializer === 'function');
    }

    let initializer = propertyDesc ? propertyDesc.initializer : undefined;
    let value = propertyDesc ? propertyDesc.value : undefined;

    let decorator = function (target, key, _desc, _meta, isClassicDecorator$$1) {
      assert(`You attempted to set a default value for ${key} with the @tracked({ value: 'default' }) syntax. You can only use this syntax with classic classes. For native classes, you can use class initializers: @tracked field = 'default';`, isClassicDecorator$$1);
      let fieldDesc = {
        initializer: initializer || (() => value)
      };
      return descriptorForField([target, key, fieldDesc]);
    };

    setClassicDecorator(decorator);
    return decorator;
  }

  return descriptorForField(args);
}

if (DEBUG) {
  // Normally this isn't a classic decorator, but we want to throw a helpful
  // error in development so we need it to treat it like one
  setClassicDecorator(tracked);
}

function descriptorForField([target, key, desc]) {
  assert(`You attempted to use @tracked on ${key}, but that element is not a class field. @tracked is only usable on class fields. Native getters and setters will autotrack add any tracked fields they encounter, so there is no need mark getters and setters with @tracked.`, !desc || !desc.value && !desc.get && !desc.set);
  let {
    getter,
    setter
  } = trackedData(key, desc ? desc.initializer : undefined);

  function get() {
    let value = getter(this); // Add the tag of the returned value if it is an array, since arrays
    // should always cause updates if they are consumed and then changed

    if (Array.isArray(value) || isEmberArray(value)) {
      consumeTag(tagFor(value, '[]'));
    }

    return value;
  }

  function set(newValue) {
    setter(this, newValue);
    dirtyTagFor(this, SELF_TAG);
  }

  let newDesc = {
    enumerable: true,
    configurable: true,
    isTracked: true,
    get,
    set
  };
  COMPUTED_SETTERS.add(set);
  meta(target).writeDescriptors(key, new TrackedDescriptor(get, set));
  return newDesc;
}

class TrackedDescriptor {
  constructor(_get, _set) {
    this._get = _get;
    this._set = _set;
    CHAIN_PASS_THROUGH.add(this);
  }

  get(obj) {
    return this._get.call(obj);
  }

  set(obj, _key, value) {
    this._set.call(obj, value);
  }

}

/**
  Ember uses caching based on trackable values to avoid updating large portions
  of the application. This caching is exposed via a cache primitive that can be
  used to cache a specific computation, so that it will not update and will
  return the cached value until a tracked value used in its computation has
  updated.

  @module @glimmer/tracking/primitives/cache
  @public
*/

/**
  Receives a function, and returns a wrapped version of it that memoizes based on
  _autotracking_. The function will only rerun whenever any tracked values used
  within it have changed. Otherwise, it will return the previous value.

  ```js
  import { tracked } from '@glimmer/tracking';
  import { createCache, getValue } from '@glimmer/tracking/primitives/cache';

  class State {
    @tracked value;
  }

  let state = new State();
  let computeCount = 0;

  let counter = createCache(() => {
    // consume the state. Now, `counter` will
    // only rerun if `state.value` changes.
    state.value;

    return ++computeCount;
  });

  getValue(counter); // 1

  // returns the same value because no tracked state has changed
  getValue(counter); // 1

  state.value = 'foo';

  // reruns because a tracked value used in the function has changed,
  // incermenting the counter
  getValue(counter); // 2
  ```

  @method createCache
  @static
  @for @glimmer/tracking/primitives/cache
  @public
*/

/**
  Gets the value of a cache created with `createCache`.

  ```js
  import { tracked } from '@glimmer/tracking';
  import { createCache, getValue } from '@glimmer/tracking/primitives/cache';

  let computeCount = 0;

  let counter = createCache(() => {
    return ++computeCount;
  });

  getValue(counter); // 1
  ```

  @method getValue
  @static
  @for @glimmer/tracking/primitives/cache
  @public
*/

/**
  Can be used to check if a memoized function is _constant_. If no tracked state
  was used while running a memoized function, it will never rerun, because nothing
  can invalidate its result. `isConst` can be used to determine if a memoized
  function is constant or not, in order to optimize code surrounding that
  function.

  ```js
  import { tracked } from '@glimmer/tracking';
  import { createCache, getValue, isConst } from '@glimmer/tracking/primitives/cache';

  class State {
    @tracked value;
  }

  let state = new State();
  let computeCount = 0;

  let counter = createCache(() => {
    // consume the state
    state.value;

    return computeCount++;
  });

  let constCounter = createCache(() => {
    return computeCount++;
  });

  getValue(counter);
  getValue(constCounter);

  isConst(counter); // false
  isConst(constCounter); // true
  ```

  If called on a cache that hasn't been accessed yet, it will throw an
  error. This is because there's no way to know if the function will be constant
  or not yet, and so this helps prevent missing an optimization opportunity on
  accident.

  @method isConst
  @static
  @for @glimmer/tracking/primitives/cache
  @public
*/

export { computed, autoComputed, isComputed, _globalsComputed, ComputedProperty, getCachedValueFor, alias, deprecateProperty, PROXY_CONTENT, _getPath, get, getWithDefault, _getProp, set, _setProp, trySet, objectAt, replace, replaceInNativeArray, addArrayObserver, removeArrayObserver, arrayContentWillChange, arrayContentDidChange, eachProxyArrayWillChange, eachProxyArrayDidChange, addListener, hasListeners, on, removeListener, sendEvent, isNone, isEmpty, isBlank, isPresent, beginPropertyChanges, changeProperties, endPropertyChanges, notifyPropertyChange, PROPERTY_DID_CHANGE, defineProperty, isElementDescriptor, nativeDescDecorator, descriptorForDecorator, descriptorForProperty, isClassicDecorator, setClassicDecorator, LIBRARIES as libraries, Libraries, getProperties, setProperties, expandProperties, ASYNC_OBSERVERS, SYNC_OBSERVERS, addObserver, activateObserver, removeObserver, flushAsyncObservers, Mixin, aliasMethod, mixin, observer, applyMixin, inject, DEBUG_INJECTION_FUNCTIONS, tagForProperty, tagForObject, markObjectAsDirty, tracked, NAMESPACES, NAMESPACES_BY_ID, addNamespace, classToString, findNamespace, findNamespaces, processNamespace, processAllNamespaces, removeNamespace, isSearchDisabled as isNamespaceSearchDisabled, setSearchDisabled as setNamespaceSearchDisabled };

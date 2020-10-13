import { symbol, dict, isDict, debugToString, EMPTY_ARRAY, isObject } from '@glimmer/util';
import { valueForTag, validateTag, CONSTANT_TAG, combine, createUpdatableTag, dirtyTag, updateTag, track, isConstTagged, isConstTag } from '@glimmer/validator';
import { DEBUG } from '@glimmer/env';

class CachedReference {
  constructor() {
    this.lastRevision = null;
    this.lastValue = null;
  }

  value() {
    let {
      tag,
      lastRevision,
      lastValue
    } = this;

    if (lastRevision === null || !validateTag(tag, lastRevision)) {
      lastValue = this.lastValue = this.compute();
      this.lastRevision = valueForTag(tag);
    }

    return lastValue;
  }

  invalidate() {
    this.lastRevision = null;
  }

} //////////


class ReferenceCache {
  constructor(reference) {
    this.lastValue = null;
    this.lastRevision = null;
    this.initialized = false;
    this.tag = reference.tag;
    this.reference = reference;
  }

  peek() {
    if (!this.initialized) {
      return this.initialize();
    }

    return this.lastValue;
  }

  revalidate() {
    if (!this.initialized) {
      return this.initialize();
    }

    let {
      reference,
      lastRevision
    } = this;
    let tag = reference.tag;
    if (validateTag(tag, lastRevision)) return NOT_MODIFIED;
    let {
      lastValue
    } = this;
    let currentValue = reference.value();
    this.lastRevision = valueForTag(tag);
    if (currentValue === lastValue) return NOT_MODIFIED;
    this.lastValue = currentValue;
    return currentValue;
  }

  initialize() {
    let {
      reference
    } = this;
    let currentValue = this.lastValue = reference.value();
    this.lastRevision = valueForTag(reference.tag);
    this.initialized = true;
    return currentValue;
  }

}

const NOT_MODIFIED = symbol('NOT_MODIFIED');

function isModified(value) {
  return value !== NOT_MODIFIED;
}

class PrimitiveReference {
  constructor(inner) {
    this.inner = inner;
    this.tag = CONSTANT_TAG;
  }

  value() {
    return this.inner;
  }

  get(_key) {
    return UNDEFINED_REFERENCE;
  }

}

const UNDEFINED_REFERENCE = new PrimitiveReference(undefined);

class ConstReference {
  constructor(inner) {
    this.inner = inner;
    this.tag = CONSTANT_TAG;
  }

  value() {
    return this.inner;
  }

  get(_key) {
    return UNDEFINED_REFERENCE;
  }

}

const UPDATE_REFERENCED_VALUE = symbol('UPDATE_REFERENCED_VALUE');
/**
 * RootReferences refer to a constant root value within a template. For
 * instance, the `this` in `{{this.some.prop}}`. This is typically a:
 *
 * - Component
 * - Controller
 * - Helper
 *
 * Or another "top level" template construct, if you will. PropertyReferences
 * chain off a root reference in the template, and can then be passed around and
 * used at will.
 */

class RootReference {
  constructor(env) {
    this.env = env;
    this.children = dict();
    this.tag = CONSTANT_TAG;
  }

  get(key) {
    // References should in general be identical to one another, so we can usually
    // deduplicate them in production. However, in DEBUG we need unique references
    // so we can properly key off them for the logging context.
    if (DEBUG) {
      // We register the template debug context now since the reference is
      // created before the component itself. It shouldn't be possible to cause
      // errors when accessing the root, only subproperties of the root, so this
      // should be fine for the time being. The exception is helpers, but they
      // set their context earlier.
      //
      // TODO: This points to a need for more first class support for arguments in
      // the debugRenderTree. The fact that we can't accurately relate an argument
      // reference to its component is problematic for debug tooling.
      if (!this.didSetupDebugContext) {
        this.didSetupDebugContext = true;
        this.env.setTemplatePathDebugContext(this, this.debugLogName || 'this', null);
      }

      return new PropertyReference(this, key, this.env);
    } else {
      let ref = this.children[key];

      if (ref === undefined) {
        ref = this.children[key] = new PropertyReference(this, key, this.env);
      }

      return ref;
    }
  }

}

class ComponentRootReference extends RootReference {
  constructor(inner, env) {
    super(env);
    this.inner = inner;
  }

  value() {
    return this.inner;
  }

}

class HelperRootReference extends RootReference {
  constructor(fn, args, env, debugName) {
    super(env);
    this.fn = fn;
    this.args = args;
    this.computeRevision = null;
    this.computeTag = null;

    if (DEBUG) {
      let name = debugName || fn.name;
      env.setTemplatePathDebugContext(this, `(result of a \`${name}\` helper)`, null);
      this.didSetupDebugContext = true;
    }

    if (isConstTagged(args)) {
      this.compute();
    }

    let {
      tag,
      computeTag
    } = this;

    if (computeTag !== null && isConstTag(computeTag)) {
      // If the args are constant, and the first computation is constant, then
      // the helper itself is constant and will never update.
      tag = this.tag = CONSTANT_TAG;
      this.computeRevision = valueForTag(tag);
    } else {
      let valueTag = this.valueTag = createUpdatableTag();
      tag = this.tag = combine([args.tag, valueTag]);

      if (computeTag !== null) {
        // We computed once, so setup the cache state correctly
        updateTag(valueTag, computeTag);
        this.computeRevision = valueForTag(tag);
      }
    }
  }

  compute() {
    this.computeTag = track(() => {
      this.computeValue = this.fn(this.args);
    }, DEBUG && this.env.getTemplatePathDebugContext(this));
  }

  value() {
    let {
      tag,
      computeRevision
    } = this;

    if (computeRevision === null || !validateTag(tag, computeRevision)) {
      this.compute();
      updateTag(this.valueTag, this.computeTag);
      this.computeRevision = valueForTag(tag);
    }

    return this.computeValue;
  }

}
/**
 * PropertyReferences represent a property that has been accessed on a root, or
 * another property (or iterable, see below). `some` and `prop` in
 * `{{this.some.prop}}` are each property references, `some` being a property of
 * `this`, and `prop` being a property of `some`. They are constructed by
 * recursively calling `get` on the previous reference as a template chain is
 * followed.
 */


class PropertyReference {
  constructor(parentReference, propertyKey, env) {
    this.parentReference = parentReference;
    this.propertyKey = propertyKey;
    this.env = env;
    this.children = dict();
    this.lastRevision = null;

    if (DEBUG) {
      env.setTemplatePathDebugContext(this, propertyKey, parentReference);
    }

    let valueTag = this.valueTag = createUpdatableTag();
    let parentReferenceTag = parentReference.tag;
    this.tag = combine([parentReferenceTag, valueTag]);
  }

  value() {
    let {
      tag,
      lastRevision,
      lastValue,
      parentReference,
      valueTag,
      propertyKey
    } = this;

    if (lastRevision === null || !validateTag(tag, lastRevision)) {
      let parentValue = parentReference.value();

      if (isDict(parentValue)) {
        let combined = track(() => {
          lastValue = this.env.getPath(parentValue, propertyKey);
        }, DEBUG && this.env.getTemplatePathDebugContext(this));
        updateTag(valueTag, combined);
      } else {
        lastValue = undefined;
      }

      this.lastValue = lastValue;
      this.lastRevision = valueForTag(tag);
    }

    return lastValue;
  }

  get(key) {
    // References should in general be identical to one another, so we can usually
    // deduplicate them in production. However, in DEBUG we need unique references
    // so we can properly key off them for the logging context.
    if (DEBUG) {
      return new PropertyReference(this, key, this.env);
    } else {
      let ref = this.children[key];

      if (ref === undefined) {
        ref = this.children[key] = new PropertyReference(this, key, this.env);
      }

      return ref;
    }
  }

  [UPDATE_REFERENCED_VALUE](value) {
    let {
      parentReference,
      propertyKey
    } = this;
    let parentValue = parentReference.value();
    this.env.setPath(parentValue, propertyKey, value);
  }

} //////////

/**
 * IterationItemReferences represent an individual item in an iterable `each`.
 * They are similar to PropertyReferences, but since iteration items need to be
 * updated they have slightly different behavior. Concretely, they are the
 * `item` in:
 *
 * ```hbs
 * {{#each this.items as |item|}}
 *   {{item.foo}}
 * {{/each}}
 * ```
 *
 * Properties can chain off an iteration item, just like with the other template
 * reference types.
 */


class IterationItemReference {
  constructor(parentReference, itemValue, itemKey, env) {
    this.parentReference = parentReference;
    this.itemValue = itemValue;
    this.env = env;
    this.tag = createUpdatableTag();
    this.children = dict();

    if (DEBUG) {
      env.setTemplatePathDebugContext(this, debugToString(itemKey), parentReference);
    }
  }

  value() {
    return this.itemValue;
  }

  update(value) {
    let {
      itemValue
    } = this; // TODO: refactor this https://github.com/glimmerjs/glimmer-vm/issues/1101

    if (value !== itemValue) {
      dirtyTag(this.tag);
      this.itemValue = value;
    }
  }

  get(key) {
    // References should in general be identical to one another, so we can usually
    // deduplicate them in production. However, in DEBUG we need unique references
    // so we can properly key off them for the logging context.
    if (DEBUG) {
      return new PropertyReference(this, key, this.env);
    } else {
      let ref = this.children[key];

      if (ref === undefined) {
        ref = this.children[key] = new PropertyReference(this, key, this.env);
      }

      return ref;
    }
  }

}

const NULL_IDENTITY = {};

const KEY = (_, index) => index;

const INDEX = (_, index) => String(index);

const IDENTITY = item => {
  if (item === null) {
    // Returning null as an identity will cause failures since the iterator
    // can't tell that it's actually supposed to be null
    return NULL_IDENTITY;
  }

  return item;
};

function keyForPath(path, getPath) {
  if (DEBUG && path[0] === '@') {
    throw new Error(`invalid keypath: '${path}', valid keys: @index, @identity, or a path`);
  }

  return uniqueKeyFor(item => getPath(item, path));
}

function makeKeyFor(key, getPath) {
  switch (key) {
    case '@key':
      return uniqueKeyFor(KEY);

    case '@index':
      return uniqueKeyFor(INDEX);

    case '@identity':
      return uniqueKeyFor(IDENTITY);

    default:
      return keyForPath(key, getPath);
  }
}

class WeakMapWithPrimitives {
  get weakMap() {
    if (this._weakMap === undefined) {
      this._weakMap = new WeakMap();
    }

    return this._weakMap;
  }

  get primitiveMap() {
    if (this._primitiveMap === undefined) {
      this._primitiveMap = new Map();
    }

    return this._primitiveMap;
  }

  set(key, value) {
    if (isObject(key) || typeof key === 'function') {
      this.weakMap.set(key, value);
    } else {
      this.primitiveMap.set(key, value);
    }
  }

  get(key) {
    if (isObject(key) || typeof key === 'function') {
      return this.weakMap.get(key);
    } else {
      return this.primitiveMap.get(key);
    }
  }

}

const IDENTITIES = new WeakMapWithPrimitives();

function identityForNthOccurence(value, count) {
  let identities = IDENTITIES.get(value);

  if (identities === undefined) {
    identities = [];
    IDENTITIES.set(value, identities);
  }

  let identity = identities[count];

  if (identity === undefined) {
    identity = {
      value,
      count
    };
    identities[count] = identity;
  }

  return identity;
}
/**
 * When iterating over a list, it's possible that an item with the same unique
 * key could be encountered twice:
 *
 * ```js
 * let arr = ['same', 'different', 'same', 'same'];
 * ```
 *
 * In general, we want to treat these items as _unique within the list_. To do
 * this, we track the occurences of every item as we iterate the list, and when
 * an item occurs more than once, we generate a new unique key just for that
 * item, and that occurence within the list. The next time we iterate the list,
 * and encounter an item for the nth time, we can get the _same_ key, and let
 * Glimmer know that it should reuse the DOM for the previous nth occurence.
 */


function uniqueKeyFor(keyFor) {
  let seen = new WeakMapWithPrimitives();
  return (value, memo) => {
    let key = keyFor(value, memo);
    let count = seen.get(key) || 0;
    seen.set(key, count + 1);

    if (count === 0) {
      return key;
    }

    return identityForNthOccurence(key, count);
  };
}

class IterableReference {
  constructor(parentRef, key, env) {
    this.parentRef = parentRef;
    this.key = key;
    this.env = env;
    this.iterator = null;
    this.tag = parentRef.tag;
  }

  value() {
    return !this.isEmpty();
  }

  isEmpty() {
    let iterator = this.iterator = this.createIterator();
    return iterator.isEmpty();
  }

  next() {
    let iterator = this.iterator;
    let item = iterator.next();

    if (item === null) {
      this.iterator = null;
    }

    return item;
  }

  createIterator() {
    let {
      parentRef,
      key,
      env
    } = this;
    let iterable = parentRef.value();
    let keyFor = makeKeyFor(key, env.getPath);

    if (Array.isArray(iterable)) {
      return new ArrayIterator(iterable, keyFor);
    }

    let maybeIterator = env.toIterator(iterable);

    if (maybeIterator === null) {
      return new ArrayIterator(EMPTY_ARRAY, () => null);
    }

    return new IteratorWrapper(maybeIterator, keyFor);
  }

  childRefFor(key, value) {
    let {
      parentRef,
      env
    } = this;
    return new IterationItemReference(parentRef, value, DEBUG ? `(key: ${debugToString(key)}` : '', env);
  }

}

class IteratorWrapper {
  constructor(inner, keyFor) {
    this.inner = inner;
    this.keyFor = keyFor;
  }

  isEmpty() {
    return this.inner.isEmpty();
  }

  next() {
    let nextValue = this.inner.next();

    if (nextValue !== null) {
      nextValue.key = this.keyFor(nextValue.value, nextValue.memo);
    }

    return nextValue;
  }

}

class ArrayIterator {
  constructor(iterator, keyFor) {
    this.iterator = iterator;
    this.keyFor = keyFor;
    this.pos = 0;

    if (iterator.length === 0) {
      this.current = {
        kind: 'empty'
      };
    } else {
      this.current = {
        kind: 'first',
        value: iterator[this.pos]
      };
    }
  }

  isEmpty() {
    return this.current.kind === 'empty';
  }

  next() {
    let value;
    let current = this.current;

    if (current.kind === 'first') {
      this.current = {
        kind: 'progress'
      };
      value = current.value;
    } else if (this.pos >= this.iterator.length - 1) {
      return null;
    } else {
      value = this.iterator[++this.pos];
    }

    let {
      keyFor
    } = this;
    let key = keyFor(value, this.pos);
    let memo = this.pos;
    return {
      key,
      value,
      memo
    };
  }

}

export { CachedReference, ReferenceCache, isModified, ConstReference, IterableReference, UPDATE_REFERENCED_VALUE, RootReference, ComponentRootReference, HelperRootReference, PropertyReference, IterationItemReference };
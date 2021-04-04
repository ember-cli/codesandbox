import { DEBUG } from '@glimmer/env';

const EMPTY_ARRAY = Object.freeze([]);
function emptyArray() {
  return EMPTY_ARRAY;
}
const EMPTY_STRING_ARRAY = emptyArray();
const EMPTY_NUMBER_ARRAY = emptyArray();
/**
 * This function returns `true` if the input array is the special empty array sentinel,
 * which is sometimes used for optimizations.
 */

function isEmptyArray(input) {
  return input === EMPTY_ARRAY;
}

// import Logger from './logger';

function debugAssert$$1(test, msg) {
  // if (!alreadyWarned) {
  //   alreadyWarned = true;
  //   Logger.warn("Don't leave debug assertions on in public builds");
  // }
  if (!test) {
    throw new Error(msg || 'assertion failure');
  }
}
function deprecate$$1(desc) {
  LOCAL_LOGGER.warn(`DEPRECATION: ${desc}`);
}

let GUID = 0;
function initializeGuid(object) {
  return object._guid = ++GUID;
}
function ensureGuid(object) {
  return object._guid || initializeGuid(object);
}

function dict() {
  return Object.create(null);
}
function isDict(u) {
  return u !== null && u !== undefined;
}
function isObject(u) {
  return typeof u === 'function' || typeof u === 'object' && u !== null;
}
class DictSet {
  constructor() {
    this.dict = dict();
  }

  add(obj) {
    if (typeof obj === 'string') this.dict[obj] = obj;else this.dict[ensureGuid(obj)] = obj;
    return this;
  }

  delete(obj) {
    if (typeof obj === 'string') delete this.dict[obj];else if (obj._guid) delete this.dict[obj._guid];
  }

}
class StackImpl {
  constructor(values = []) {
    this.current = null;
    this.stack = values;
  }

  get size() {
    return this.stack.length;
  }

  push(item) {
    this.current = item;
    this.stack.push(item);
  }

  pop() {
    let item = this.stack.pop();
    let len = this.stack.length;
    this.current = len === 0 ? null : this.stack[len - 1];
    return item === undefined ? null : item;
  }

  nth(from) {
    let len = this.stack.length;
    return len < from ? null : this.stack[len - from];
  }

  isEmpty() {
    return this.stack.length === 0;
  }

  toArray() {
    return this.stack;
  }

}
class NonemptyStackImpl {
  constructor(values) {
    this.stack = values;
    this.current = values[values.length - 1];
  }

  get size() {
    return this.stack.length;
  }

  push(item) {
    this.current = item;
    this.stack.push(item);
  }

  pop() {
    if (this.stack.length === 1) {
      throw new Error(`cannot pop the last element of a NonemptyStack`);
    }

    let item = this.stack.pop();
    let len = this.stack.length;
    this.current = this.stack[len - 1];
    return item;
  }

  nth(from) {
    let len = this.stack.length;
    return from >= len ? null : this.stack[from];
  }

  nthBack(from) {
    let len = this.stack.length;
    return len < from ? null : this.stack[len - from];
  }

  toArray() {
    return this.stack;
  }

}

function clearElement(parent) {
  let current = parent.firstChild;

  while (current) {
    let next = current.nextSibling;
    parent.removeChild(current);
    current = next;
  }
}

const SERIALIZATION_FIRST_NODE_STRING = '%+b:0%';
function isSerializationFirstNode(node) {
  return node.nodeValue === SERIALIZATION_FIRST_NODE_STRING;
}

var _a;

const {
  keys: objKeys
} = Object;

function assignFn(obj) {
  for (let i = 1; i < arguments.length; i++) {
    let assignment = arguments[i];
    if (assignment === null || typeof assignment !== 'object') continue;
    let keys = objKeys(assignment);

    for (let j = 0; j < keys.length; j++) {
      let key = keys[j];
      obj[key] = assignment[key];
    }
  }

  return obj;
}

let assign = (_a = Object.assign) !== null && _a !== void 0 ? _a : assignFn;
function fillNulls(count) {
  let arr = new Array(count);

  for (let i = 0; i < count; i++) {
    arr[i] = null;
  }

  return arr;
}
function values(obj) {
  const vals = [];

  for (const key in obj) {
    vals.push(obj[key]);
  }

  return vals;
}

/**
  Strongly hint runtimes to intern the provided string.

  When do I need to use this function?

  For the most part, never. Pre-mature optimization is bad, and often the
  runtime does exactly what you need it to, and more often the trade-off isn't
  worth it.

  Why?

  Runtimes store strings in at least 2 different representations:
  Ropes and Symbols (interned strings). The Rope provides a memory efficient
  data-structure for strings created from concatenation or some other string
  manipulation like splitting.

  Unfortunately checking equality of different ropes can be quite costly as
  runtimes must resort to clever string comparison algorithms. These
  algorithms typically cost in proportion to the length of the string.
  Luckily, this is where the Symbols (interned strings) shine. As Symbols are
  unique by their string content, equality checks can be done by pointer
  comparison.

  How do I know if my string is a rope or symbol?

  Typically (warning general sweeping statement, but truthy in runtimes at
  present) static strings created as part of the JS source are interned.
  Strings often used for comparisons can be interned at runtime if some
  criteria are met.  One of these criteria can be the size of the entire rope.
  For example, in chrome 38 a rope longer then 12 characters will not
  intern, nor will segments of that rope.

  Some numbers: http://jsperf.com/eval-vs-keys/8

  Known Trick™

  @private
  @return {String} interned version of the provided string
*/
function intern(str) {
  let obj = {};
  obj[str] = 1;

  for (let key in obj) {
    if (key === str) {
      return key;
    }
  }

  return str;
}

const HAS_NATIVE_PROXY = typeof Proxy === 'function';
const HAS_NATIVE_SYMBOL = function () {
  if (typeof Symbol !== 'function') {
    return false;
  } // eslint-disable-next-line symbol-description


  return typeof Symbol() === 'symbol';
}();
function keys(obj) {
  return Object.keys(obj);
}
function unwrap(val) {
  if (val === null || val === undefined) throw new Error(`Expected value to be present`);
  return val;
}
function expect(val, message) {
  if (val === null || val === undefined) throw new Error(message);
  return val;
}
function unreachable(message = 'unreachable') {
  return new Error(message);
}
function exhausted(value) {
  throw new Error(`Exhausted ${value}`);
}
const tuple = (...args) => args;
function enumerableSymbol(key) {
  return intern(`__${key}${Math.floor(Math.random() * Date.now())}__`);
}
const symbol = HAS_NATIVE_SYMBOL ? Symbol : enumerableSymbol;

function strip(strings, ...args) {
  let out = '';

  for (let i = 0; i < strings.length; i++) {
    let string = strings[i];
    let dynamic = args[i] !== undefined ? String(args[i]) : '';
    out += `${string}${dynamic}`;
  }

  let lines = out.split('\n');

  while (lines.length && lines[0].match(/^\s*$/)) {
    lines.shift();
  }

  while (lines.length && lines[lines.length - 1].match(/^\s*$/)) {
    lines.pop();
  }

  let min = Infinity;

  for (let line of lines) {
    let leading = line.match(/^\s*/)[0].length;
    min = Math.min(min, leading);
  }

  let stripped = [];

  for (let line of lines) {
    stripped.push(line.slice(min));
  }

  return stripped.join('\n');
}

function isHandle(value) {
  return value >= 0;
}
function isNonPrimitiveHandle(value) {
  return value > 3
  /* ENCODED_UNDEFINED_HANDLE */
  ;
}
function constants(...values) {
  return [false, true, null, undefined, ...values];
}
function isSmallInt(value) {
  return value % 1 === 0 && value <= 536870911
  /* MAX_INT */
  && value >= -536870912
  /* MIN_INT */
  ;
}
function encodeNegative(num) {

  return num & -536870913
  /* SIGN_BIT */
  ;
}
function decodeNegative(num) {

  return num | ~-536870913
  /* SIGN_BIT */
  ;
}
function encodePositive(num) {

  return ~num;
}
function decodePositive(num) {

  return ~num;
}
function encodeHandle(num) {

  return num;
}
function decodeHandle(num) {

  return num;
}
function encodeImmediate(num) {
  num |= 0;
  return num < 0 ? encodeNegative(num) : encodePositive(num);
}
function decodeImmediate(num) {
  num |= 0;
  return num > -536870913
  /* SIGN_BIT */
  ? decodePositive(num) : decodeNegative(num);
} // Warm
[1, -1].forEach(x => decodeImmediate(encodeImmediate(x)));

function unwrapHandle(handle) {
  if (typeof handle === 'number') {
    return handle;
  } else {
    let error = handle.errors[0];
    throw new Error(`Compile Error: ${error.problem} @ ${error.span.start}..${error.span.end}`);
  }
}
function unwrapTemplate(template) {
  if (template.result === 'error') {
    throw new Error(`Compile Error: ${template.problem} @ ${template.span.start}..${template.span.end}`);
  }

  return template;
}
function extractHandle(handle) {
  if (typeof handle === 'number') {
    return handle;
  } else {
    return handle.handle;
  }
}
function isOkHandle(handle) {
  return typeof handle === 'number';
}
function isErrHandle(handle) {
  return typeof handle === 'number';
}

var weakSet = typeof WeakSet === 'function' ? WeakSet : class WeakSetPolyFill {
  constructor() {
    this._map = new WeakMap();
  }

  add(val) {
    this._map.set(val, true);

    return this;
  }

  delete(val) {
    return this._map.delete(val);
  }

  has(val) {
    return this._map.has(val);
  }

};

function castToSimple(node) {
  if (isDocument(node)) {
    return node;
  } else if (isElement(node)) {
    return node;
  } else {
    return node;
  }
}
function castToBrowser(node, sugaryCheck) {
  if (node === null || node === undefined) {
    return null;
  }

  if (typeof document === undefined) {
    throw new Error('Attempted to cast to a browser node in a non-browser context');
  }

  if (isDocument(node)) {
    return node;
  }

  if (node.ownerDocument !== document) {
    throw new Error('Attempted to cast to a browser node with a node that was not created from this document');
  }

  return checkNode(node, sugaryCheck);
}

function checkError(from, check) {
  return new Error(`cannot cast a ${from} into ${check}`);
}

function isDocument(node) {
  return node.nodeType === 9
  /* DOCUMENT_NODE */
  ;
}

function isElement(node) {
  return node.nodeType === 1
  /* ELEMENT_NODE */
  ;
}

function checkNode(node, check) {
  let isMatch = false;

  if (node !== null) {
    if (typeof check === 'string') {
      isMatch = stringCheckNode(node, check);
    } else if (Array.isArray(check)) {
      isMatch = check.some(c => stringCheckNode(node, c));
    } else {
      throw unreachable();
    }
  }

  if (isMatch) {
    return node;
  } else {
    throw checkError(`SimpleElement(${node})`, check);
  }
}

function stringCheckNode(node, check) {
  switch (check) {
    case 'NODE':
      return true;

    case 'HTML':
      return node instanceof HTMLElement;

    case 'SVG':
      return node instanceof SVGElement;

    case 'ELEMENT':
      return node instanceof Element;

    default:
      if (check.toUpperCase() === check) {
        throw new Error(`BUG: this code is missing handling for a generic node type`);
      }

      return node instanceof Element && node.tagName.toLowerCase() === check;
  }
}

function isPresent(list) {
  return list.length > 0;
}
function ifPresent(list, ifPresent, otherwise) {
  if (isPresent(list)) {
    return ifPresent(list);
  } else {
    return otherwise();
  }
}
function toPresentOption(list) {
  if (isPresent(list)) {
    return list;
  } else {
    return null;
  }
}
function assertPresent(list, message = `unexpected empty list`) {
  if (!isPresent(list)) {
    throw new Error(message);
  }
}
function mapPresent(list, callback) {
  if (list === null) {
    return null;
  }

  let out = [];

  for (let item of list) {
    out.push(callback(item));
  }

  return out;
}

function buildUntouchableThis(source) {
  let context = null;

  if (DEBUG && HAS_NATIVE_PROXY) {
    let assertOnProperty = property => {
      throw new Error(`You accessed \`this.${String(property)}\` from a function passed to the ${source}, but the function itself was not bound to a valid \`this\` context. Consider updating to use a bound function (for instance, use an arrow function, \`() => {}\`).`);
    };

    context = new Proxy({}, {
      get(_target, property) {
        assertOnProperty(property);
      },

      set(_target, property) {
        assertOnProperty(property);
        return false;
      },

      has(_target, property) {
        assertOnProperty(property);
        return false;
      }

    });
  }

  return context;
}

let debugToString;

if (DEBUG) {
  let getFunctionName = fn => {
    let functionName = fn.name;

    if (functionName === undefined) {
      let match = Function.prototype.toString.call(fn).match(/function (\w+)\s*\(/);
      functionName = match && match[1] || '';
    }

    return functionName.replace(/^bound /, '');
  };

  let getObjectName = obj => {
    let name;
    let className;

    if (obj.constructor && typeof obj.constructor === 'function') {
      className = getFunctionName(obj.constructor);
    }

    if ('toString' in obj && obj.toString !== Object.prototype.toString && obj.toString !== Function.prototype.toString) {
      name = obj.toString();
    } // If the class has a decent looking name, and the `toString` is one of the
    // default Ember toStrings, replace the constructor portion of the toString
    // with the class name. We check the length of the class name to prevent doing
    // this when the value is minified.


    if (name && name.match(/<.*:ember\d+>/) && className && className[0] !== '_' && className.length > 2 && className !== 'Class') {
      return name.replace(/<.*:/, `<${className}:`);
    }

    return name || className;
  };

  let getPrimitiveName = value => {
    return String(value);
  };

  debugToString = value => {
    if (typeof value === 'function') {
      return getFunctionName(value) || `(unknown function)`;
    } else if (typeof value === 'object' && value !== null) {
      return getObjectName(value) || `(unknown object)`;
    } else {
      return getPrimitiveName(value);
    }
  };
}

var debugToString$1 = debugToString;

let beginTestSteps;
let endTestSteps;
let verifySteps;
let logStep;

/**
 * This constant exists to make it easier to differentiate normal logs from
 * errant console.logs. LOCAL_LOGGER should only be used inside a
 * LOCAL_SHOULD_LOG check.
 *
 * It does not alleviate the need to check LOCAL_SHOULD_LOG, which is used
 * for stripping.
 */

const LOCAL_LOGGER = console;
/**
 * This constant exists to make it easier to differentiate normal logs from
 * errant console.logs. LOGGER can be used outside of LOCAL_SHOULD_LOG checks,
 * and is meant to be used in the rare situation where a console.* call is
 * actually appropriate.
 */

const LOGGER = console;
function assertNever(value, desc = 'unexpected unreachable branch') {
  LOGGER.log('unreachable', value);
  LOGGER.log(`${desc} :: ${JSON.stringify(value)} (${value})`);
  throw new Error(`code reached unreachable`);
}

export { LOCAL_LOGGER, LOGGER, assertNever, debugAssert$$1 as assert, deprecate$$1 as deprecate, dict, DictSet, isDict, isObject, StackImpl as Stack, NonemptyStackImpl as NonemptyStack, ensureGuid, initializeGuid, isSerializationFirstNode, SERIALIZATION_FIRST_NODE_STRING, assign, fillNulls, values, weakSet as _WeakSet, castToSimple, castToBrowser, checkNode, intern, buildUntouchableThis, debugToString$1 as debugToString, beginTestSteps, endTestSteps, logStep, verifySteps, EMPTY_ARRAY, emptyArray, EMPTY_STRING_ARRAY, EMPTY_NUMBER_ARRAY, isEmptyArray, clearElement, HAS_NATIVE_PROXY, HAS_NATIVE_SYMBOL, keys, unwrap, expect, unreachable, exhausted, tuple, enumerableSymbol, symbol, strip, isHandle, isNonPrimitiveHandle, constants, isSmallInt, encodeNegative, decodeNegative, encodePositive, decodePositive, encodeHandle, decodeHandle, encodeImmediate, decodeImmediate, unwrapHandle, unwrapTemplate, extractHandle, isOkHandle, isErrHandle, isPresent, ifPresent, toPresentOption, assertPresent, mapPresent };

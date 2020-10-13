import { symbol, debugToString, Stack, clearElement, initializeGuid, fillNulls, decodeHandle, isNonPrimitiveHandle, dict, unreachable, unwrapTemplate, EMPTY_ARRAY, isErrHandle, unwrapHandle, assign, isSmallInt, encodeImmediate, encodeHandle, constants, decodeImmediate, isHandle } from '@glimmer/util';
import { DEBUG } from '@glimmer/env';
import { ConstReference, CachedReference, isModified, ReferenceCache, IterableReference } from '@glimmer/reference';
import { track, createUpdatableTag, combine, updateTag, createCombinatorTag, CONSTANT_TAG, valueForTag, validateTag, isConstTagged, INITIAL, isConstTag } from '@glimmer/validator';
import { RuntimeProgramImpl } from '@glimmer/program';
import { $pc, $sp, $ra, $fp, $v0, $t0, $t1, $s0, $s1, isLowLevelRegister } from '@glimmer/vm';
import { Stack as Stack$1 } from '@glimmer/low-level'; // the VM in other classes, but are not intended to be a part of
// Glimmer's API.

const INNER_VM = symbol('INNER_VM');
const DESTROYABLE_STACK = symbol('DESTROYABLE_STACK');
const STACKS = symbol('STACKS');
const REGISTERS = symbol('REGISTERS');
const HEAP = symbol('HEAP');
const CONSTANTS = symbol('CONSTANTS');
const ARGS = symbol('ARGS');
const PC = symbol('PC');

class CursorImpl {
  constructor(element, nextSibling) {
    this.element = element;
    this.nextSibling = nextSibling;
  }

}

class ConcreteBounds {
  constructor(parentNode, first, last) {
    this.parentNode = parentNode;
    this.first = first;
    this.last = last;
  }

  parentElement() {
    return this.parentNode;
  }

  firstNode() {
    return this.first;
  }

  lastNode() {
    return this.last;
  }

}

class SingleNodeBounds {
  constructor(parentNode, node) {
    this.parentNode = parentNode;
    this.node = node;
  }

  parentElement() {
    return this.parentNode;
  }

  firstNode() {
    return this.node;
  }

  lastNode() {
    return this.node;
  }

}

function move(bounds, reference) {
  let parent = bounds.parentElement();
  let first = bounds.firstNode();
  let last = bounds.lastNode();
  let current = first;

  while (true) {
    let next = current.nextSibling;
    parent.insertBefore(current, reference);

    if (current === last) {
      return next;
    }

    current = next;
  }
}

function clear(bounds) {
  let parent = bounds.parentElement();
  let first = bounds.firstNode();
  let last = bounds.lastNode();
  let current = first;

  while (true) {
    let next = current.nextSibling;
    parent.removeChild(current);

    if (current === last) {
      return next;
    }

    current = next;
  }
}

let DESTROYABLE_META = new WeakMap();

function push(collection, newItem) {
  if (collection === null) {
    return newItem;
  } else if (Array.isArray(collection)) {
    collection.push(newItem);
    return collection;
  } else {
    return [collection, newItem];
  }
}

function iterate(collection, fn) {
  if (Array.isArray(collection)) {
    for (let i = 0; i < collection.length; i++) {
      fn(collection[i]);
    }
  } else if (collection !== null) {
    fn(collection);
  }
}

function remove(collection, item, message) {
  if (DEBUG) {
    let collectionIsItem = collection === item;
    let collectionContainsItem = Array.isArray(collection) && collection.indexOf(item) !== -1;

    if (!collectionIsItem && !collectionContainsItem) {
      throw new Error(String(message));
    }
  }

  if (Array.isArray(collection) && collection.length > 1) {
    let index = collection.indexOf(item);
    collection.splice(index, 1);
    return collection;
  } else {
    return null;
  }
}

function getDestroyableMeta(destroyable) {
  let meta = DESTROYABLE_META.get(destroyable);

  if (meta === undefined) {
    meta = {
      parents: null,
      children: null,
      eagerDestructors: null,
      destructors: null,
      state: 0
      /* Live */

    };

    if (DEBUG) {
      meta.source = destroyable;
    }

    DESTROYABLE_META.set(destroyable, meta);
  }

  return meta;
}

function associateDestroyableChild(parent, child) {
  if (DEBUG && isDestroying(parent)) {
    throw new Error('Attempted to associate a destroyable child with an object that is already destroying or destroyed');
  }

  let parentMeta = getDestroyableMeta(parent);
  let childMeta = getDestroyableMeta(child);
  parentMeta.children = push(parentMeta.children, child);
  childMeta.parents = push(childMeta.parents, parent);
  return child;
}

function registerDestructor(destroyable, destructor, eager = false) {
  if (DEBUG && isDestroying(destroyable)) {
    throw new Error('Attempted to register a destructor with an object that is already destroying or destroyed');
  }

  let meta = getDestroyableMeta(destroyable);
  let destructorsKey = eager === true ? 'eagerDestructors' : 'destructors';
  meta[destructorsKey] = push(meta[destructorsKey], destructor);
  return destructor;
}

function unregisterDestructor(destroyable, destructor, eager = false) {
  if (DEBUG && isDestroying(destroyable)) {
    throw new Error('Attempted to unregister a destructor with an object that is already destroying or destroyed');
  }

  let meta = getDestroyableMeta(destroyable);
  let destructorsKey = eager === true ? 'eagerDestructors' : 'destructors';
  meta[destructorsKey] = remove(meta[destructorsKey], destructor, DEBUG && 'attempted to remove a destructor that was not registered with the destroyable');
} ////////////


let scheduleDestroy = DEBUG ? () => {
  throw new Error('Must provide a scheduleDestroy method');
} : () => {};
let scheduleDestroyed = DEBUG ? () => {
  throw new Error('Must provide a scheduleDestroyed method');
} : () => {};

function destroy(destroyable) {
  let meta = getDestroyableMeta(destroyable);
  if (meta.state >= 1
  /* Destroying */
  ) return;
  let {
    parents,
    children,
    eagerDestructors,
    destructors
  } = meta;
  meta.state = 1
  /* Destroying */
  ;
  iterate(children, destroy);
  iterate(eagerDestructors, destructor => destructor(destroyable));
  iterate(destructors, destructor => scheduleDestroy(destroyable, destructor));
  scheduleDestroyed(() => {
    iterate(parents, parent => removeChildFromParent(destroyable, parent));
    meta.state = 2
    /* Destroyed */
    ;
  });
}

function removeChildFromParent(child, parent) {
  let parentMeta = getDestroyableMeta(parent);

  if (parentMeta.state === 0
  /* Live */
  ) {
      parentMeta.children = remove(parentMeta.children, child, DEBUG && "attempted to remove child from parent, but the parent's children did not contain the child. This is likely a bug with destructors.");
    }
}

function destroyChildren(destroyable) {
  let {
    children
  } = getDestroyableMeta(destroyable);
  iterate(children, destroy);
}

function setScheduleDestroy(fn) {
  scheduleDestroy = fn;
}

function setScheduleDestroyed(fn) {
  scheduleDestroyed = fn;
}

function isDestroying(destroyable) {
  let meta = DESTROYABLE_META.get(destroyable);
  return meta === undefined ? false : meta.state >= 1
  /* Destroying */
  ;
}

function isDestroyed(destroyable) {
  let meta = DESTROYABLE_META.get(destroyable);
  return meta === undefined ? false : meta.state >= 2
  /* Destroyed */
  ;
} ////////////


let enableDestroyableTracking;
let assertDestroyablesDestroyed;

if (DEBUG) {
  let isTesting = false;

  enableDestroyableTracking = () => {
    if (isTesting) {
      throw new Error('Attempted to start destroyable testing, but you did not end the previous destroyable test. Did you forget to call `assertDestroyablesDestroyed()`');
    }

    isTesting = true;
    DESTROYABLE_META = new Map();
  };

  assertDestroyablesDestroyed = () => {
    if (!isTesting) {
      throw new Error('Attempted to assert destroyables destroyed, but you did not start a destroyable test. Did you forget to call `enableDestroyableTracking()`');
    }

    isTesting = false;
    let map = DESTROYABLE_META;
    DESTROYABLE_META = new WeakMap();
    let undestroyed = [];
    map.forEach(meta => {
      if (meta.state !== 2
      /* Destroyed */
      ) {
          undestroyed.push(meta.source);
        }
    });

    if (undestroyed.length > 0) {
      let objectsToString = undestroyed.map(debugToString).join('\n    ');
      let error = new Error(`Some destroyables were not destroyed during this test:\n    ${objectsToString}`);
      error.destroyables = undestroyed;
      throw error;
    }
  };
}

var _a;

class First {
  constructor(node) {
    this.node = node;
  }

  firstNode() {
    return this.node;
  }

}

class Last {
  constructor(node) {
    this.node = node;
  }

  lastNode() {
    return this.node;
  }

}

const CURSOR_STACK = symbol('CURSOR_STACK');

class NewElementBuilder {
  constructor(env, parentNode, nextSibling) {
    this.constructing = null;
    this.operations = null;
    this[_a] = new Stack();
    this.modifierStack = new Stack();
    this.blockStack = new Stack();
    this.pushElement(parentNode, nextSibling);
    this.env = env;
    this.dom = env.getAppendOperations();
    this.updateOperations = env.getDOM();
  }

  static forInitialRender(env, cursor) {
    return new this(env, cursor.element, cursor.nextSibling).initialize();
  }

  static resume(env, block) {
    let parentNode = block.parentElement();
    let nextSibling = block.reset(env);
    let stack = new this(env, parentNode, nextSibling).initialize();
    stack.pushLiveBlock(block);
    return stack;
  }

  initialize() {
    this.pushSimpleBlock();
    return this;
  }

  debugBlocks() {
    return this.blockStack.toArray();
  }

  get element() {
    return this[CURSOR_STACK].current.element;
  }

  get nextSibling() {
    return this[CURSOR_STACK].current.nextSibling;
  }

  get hasBlocks() {
    return this.blockStack.size > 0;
  }

  block() {
    return this.blockStack.current;
  }

  popElement() {
    this[CURSOR_STACK].pop();
    this[CURSOR_STACK].current;
  }

  pushSimpleBlock() {
    return this.pushLiveBlock(new SimpleLiveBlock(this.element));
  }

  pushUpdatableBlock() {
    return this.pushLiveBlock(new UpdatableBlockImpl(this.element));
  }

  pushBlockList(list) {
    return this.pushLiveBlock(new LiveBlockList(this.element, list));
  }

  pushLiveBlock(block, isRemote = false) {
    let current = this.blockStack.current;

    if (current !== null) {
      if (!isRemote) {
        current.didAppendBounds(block);
      }
    }

    this.__openBlock();

    this.blockStack.push(block);
    return block;
  }

  popBlock() {
    this.block().finalize(this);

    this.__closeBlock();

    return this.blockStack.pop();
  }

  __openBlock() {}

  __closeBlock() {} // todo return seems unused


  openElement(tag) {
    let element = this.__openElement(tag);

    this.constructing = element;
    return element;
  }

  __openElement(tag) {
    return this.dom.createElement(tag, this.element);
  }

  flushElement(modifiers) {
    let parent = this.element;
    let element = this.constructing;

    this.__flushElement(parent, element);

    this.constructing = null;
    this.operations = null;
    this.pushModifiers(modifiers);
    this.pushElement(element, null);
    this.didOpenElement(element);
  }

  __flushElement(parent, constructing) {
    this.dom.insertBefore(parent, constructing, this.nextSibling);
  }

  closeElement() {
    this.willCloseElement();
    this.popElement();
    return this.popModifiers();
  }

  pushRemoteElement(element, guid, insertBefore) {
    return this.__pushRemoteElement(element, guid, insertBefore);
  }

  __pushRemoteElement(element, _guid, insertBefore) {
    this.pushElement(element, insertBefore);

    if (insertBefore === undefined) {
      while (element.lastChild) {
        element.removeChild(element.lastChild);
      }
    }

    let block = new RemoteLiveBlock(element);
    return this.pushLiveBlock(block, true);
  }

  popRemoteElement() {
    this.popBlock();
    this.popElement();
  }

  pushElement(element, nextSibling = null) {
    this[CURSOR_STACK].push(new CursorImpl(element, nextSibling));
  }

  pushModifiers(modifiers) {
    this.modifierStack.push(modifiers);
  }

  popModifiers() {
    return this.modifierStack.pop();
  }

  didAppendBounds(bounds) {
    this.block().didAppendBounds(bounds);
    return bounds;
  }

  didAppendNode(node) {
    this.block().didAppendNode(node);
    return node;
  }

  didOpenElement(element) {
    this.block().openElement(element);
    return element;
  }

  willCloseElement() {
    this.block().closeElement();
  }

  appendText(string) {
    return this.didAppendNode(this.__appendText(string));
  }

  __appendText(text) {
    let {
      dom,
      element,
      nextSibling
    } = this;
    let node = dom.createTextNode(text);
    dom.insertBefore(element, node, nextSibling);
    return node;
  }

  __appendNode(node) {
    this.dom.insertBefore(this.element, node, this.nextSibling);
    return node;
  }

  __appendFragment(fragment) {
    let first = fragment.firstChild;

    if (first) {
      let ret = new ConcreteBounds(this.element, first, fragment.lastChild);
      this.dom.insertBefore(this.element, fragment, this.nextSibling);
      return ret;
    } else {
      return new SingleNodeBounds(this.element, this.__appendComment(''));
    }
  }

  __appendHTML(html) {
    return this.dom.insertHTMLBefore(this.element, this.nextSibling, html);
  }

  appendDynamicHTML(value) {
    let bounds = this.trustedContent(value);
    this.didAppendBounds(bounds);
  }

  appendDynamicText(value) {
    let node = this.untrustedContent(value);
    this.didAppendNode(node);
    return node;
  }

  appendDynamicFragment(value) {
    let bounds = this.__appendFragment(value);

    this.didAppendBounds(bounds);
  }

  appendDynamicNode(value) {
    let node = this.__appendNode(value);

    let bounds = new SingleNodeBounds(this.element, node);
    this.didAppendBounds(bounds);
  }

  trustedContent(value) {
    return this.__appendHTML(value);
  }

  untrustedContent(value) {
    return this.__appendText(value);
  }

  appendComment(string) {
    return this.didAppendNode(this.__appendComment(string));
  }

  __appendComment(string) {
    let {
      dom,
      element,
      nextSibling
    } = this;
    let node = dom.createComment(string);
    dom.insertBefore(element, node, nextSibling);
    return node;
  }

  __setAttribute(name, value, namespace) {
    this.dom.setAttribute(this.constructing, name, value, namespace);
  }

  __setProperty(name, value) {
    this.constructing[name] = value;
  }

  setStaticAttribute(name, value, namespace) {
    this.__setAttribute(name, value, namespace);
  }

  setDynamicAttribute(name, value, trusting, namespace) {
    let element = this.constructing;
    let attribute = this.env.attributeFor(element, name, trusting, namespace);
    attribute.set(this, value, this.env);
    return attribute;
  }

}

_a = CURSOR_STACK;

class SimpleLiveBlock {
  constructor(parent) {
    this.parent = parent;
    this.first = null;
    this.last = null;
    this.nesting = 0;
  }

  parentElement() {
    return this.parent;
  }

  firstNode() {
    let first = this.first;
    return first.firstNode();
  }

  lastNode() {
    let last = this.last;
    return last.lastNode();
  }

  openElement(element) {
    this.didAppendNode(element);
    this.nesting++;
  }

  closeElement() {
    this.nesting--;
  }

  didAppendNode(node) {
    if (this.nesting !== 0) return;

    if (!this.first) {
      this.first = new First(node);
    }

    this.last = new Last(node);
  }

  didAppendBounds(bounds) {
    if (this.nesting !== 0) return;

    if (!this.first) {
      this.first = bounds;
    }

    this.last = bounds;
  }

  finalize(stack) {
    if (this.first === null) {
      stack.appendComment('');
    }
  }

}

class RemoteLiveBlock extends SimpleLiveBlock {
  constructor(parent) {
    super(parent);
    registerDestructor(this, () => {
      // In general, you only need to clear the root of a hierarchy, and should never
      // need to clear any child nodes. This is an important constraint that gives us
      // a strong guarantee that clearing a subtree is a single DOM operation.
      //
      // Because remote blocks are not normally physically nested inside of the tree
      // that they are logically nested inside, we manually clear remote blocks when
      // a logical parent is cleared.
      //
      // HOWEVER, it is currently possible for a remote block to be physically nested
      // inside of the block it is logically contained inside of. This happens when
      // the remote block is appended to the end of the application's entire element.
      //
      // The problem with that scenario is that Glimmer believes that it owns more of
      // the DOM than it actually does. The code is attempting to write past the end
      // of the Glimmer-managed root, but Glimmer isn't aware of that.
      //
      // The correct solution to that problem is for Glimmer to be aware of the end
      // of the bounds that it owns, and once we make that change, this check could
      // be removed.
      //
      // For now, a more targeted fix is to check whether the node was already removed
      // and avoid clearing the node if it was. In most cases this shouldn't happen,
      // so this might hide bugs where the code clears nested nodes unnecessarily,
      // so we should eventually try to do the correct fix.
      if (this.parentElement() === this.firstNode().parentNode) {
        clear(this);
      }
    });
  }

}

class UpdatableBlockImpl extends SimpleLiveBlock {
  reset() {
    destroy(this);
    let nextSibling = clear(this);
    this.first = null;
    this.last = null;
    this.nesting = 0;
    return nextSibling;
  }

} // FIXME: All the noops in here indicate a modelling problem


class LiveBlockList {
  constructor(parent, boundList) {
    this.parent = parent;
    this.boundList = boundList;
    this.parent = parent;
    this.boundList = boundList;
  }

  parentElement() {
    return this.parent;
  }

  firstNode() {
    let head = this.boundList[0];
    return head.firstNode();
  }

  lastNode() {
    let boundList = this.boundList;
    let tail = boundList[boundList.length - 1];
    return tail.lastNode();
  }

  openElement(_element) {}

  closeElement() {}

  didAppendNode(_node) {}

  didAppendBounds(_bounds) {}

  finalize(_stack) {}

}

function clientBuilder(env, cursor) {
  return NewElementBuilder.forInitialRender(env, cursor);
} // http://www.w3.org/TR/html/syntax.html#html-integration-point


const SVG_INTEGRATION_POINTS = {
  foreignObject: 1,
  desc: 1,
  title: 1
}; // http://www.w3.org/TR/html/syntax.html#adjust-svg-attributes
// TODO: Adjust SVG attributes
// http://www.w3.org/TR/html/syntax.html#parsing-main-inforeign
// TODO: Adjust SVG elements
// http://www.w3.org/TR/html/syntax.html#parsing-main-inforeign

const BLACKLIST_TABLE = Object.create(null);

class DOMOperations {
  constructor(document) {
    this.document = document;
    this.setupUselessElement();
  } // split into seperate method so that NodeDOMTreeConstruction
  // can override it.


  setupUselessElement() {
    this.uselessElement = this.document.createElement('div');
  }

  createElement(tag, context) {
    let isElementInSVGNamespace, isHTMLIntegrationPoint;

    if (context) {
      isElementInSVGNamespace = context.namespaceURI === "http://www.w3.org/2000/svg"
      /* SVG */
      || tag === 'svg';
      isHTMLIntegrationPoint = !!SVG_INTEGRATION_POINTS[context.tagName];
    } else {
      isElementInSVGNamespace = tag === 'svg';
      isHTMLIntegrationPoint = false;
    }

    if (isElementInSVGNamespace && !isHTMLIntegrationPoint) {
      // FIXME: This does not properly handle <font> with color, face, or
      // size attributes, which is also disallowed by the spec. We should fix
      // this.
      if (BLACKLIST_TABLE[tag]) {
        throw new Error(`Cannot create a ${tag} inside an SVG context`);
      }

      return this.document.createElementNS("http://www.w3.org/2000/svg"
      /* SVG */
      , tag);
    } else {
      return this.document.createElement(tag);
    }
  }

  insertBefore(parent, node, reference) {
    parent.insertBefore(node, reference);
  }

  insertHTMLBefore(parent, nextSibling, html) {
    if (html === '') {
      let comment = this.createComment('');
      parent.insertBefore(comment, nextSibling);
      return new ConcreteBounds(parent, comment, comment);
    }

    let prev = nextSibling ? nextSibling.previousSibling : parent.lastChild;
    let last;

    if (nextSibling === null) {
      parent.insertAdjacentHTML("beforeend"
      /* beforeend */
      , html);
      last = parent.lastChild;
    } else if (nextSibling instanceof HTMLElement) {
      nextSibling.insertAdjacentHTML('beforebegin', html);
      last = nextSibling.previousSibling;
    } else {
      // Non-element nodes do not support insertAdjacentHTML, so add an
      // element and call it on that element. Then remove the element.
      //
      // This also protects Edge, IE and Firefox w/o the inspector open
      // from merging adjacent text nodes. See ./compat/text-node-merging-fix.ts
      let {
        uselessElement
      } = this;
      parent.insertBefore(uselessElement, nextSibling);
      uselessElement.insertAdjacentHTML("beforebegin"
      /* beforebegin */
      , html);
      last = uselessElement.previousSibling;
      parent.removeChild(uselessElement);
    }

    let first = prev ? prev.nextSibling : parent.firstChild;
    return new ConcreteBounds(parent, first, last);
  }

  createTextNode(text) {
    return this.document.createTextNode(text);
  }

  createComment(data) {
    return this.document.createComment(data);
  }

}

function moveNodesBefore(source, target, nextSibling) {
  let first = source.firstChild;
  let last = first;
  let current = first;

  while (current) {
    let next = current.nextSibling;
    target.insertBefore(current, nextSibling);
    last = current;
    current = next;
  }

  return new ConcreteBounds(target, first, last);
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"
/* SVG */
; // Patch:    insertAdjacentHTML on SVG Fix
// Browsers: Safari, IE, Edge, Firefox ~33-34
// Reason:   insertAdjacentHTML does not exist on SVG elements in Safari. It is
//           present but throws an exception on IE and Edge. Old versions of
//           Firefox create nodes in the incorrect namespace.
// Fix:      Since IE and Edge silently fail to create SVG nodes using
//           innerHTML, and because Firefox may create nodes in the incorrect
//           namespace using innerHTML on SVG elements, an HTML-string wrapping
//           approach is used. A pre/post SVG tag is added to the string, then
//           that whole string is added to a div. The created nodes are plucked
//           out and applied to the target location on DOM.

function applySVGInnerHTMLFix(document, DOMClass, svgNamespace) {
  if (!document) return DOMClass;

  if (!shouldApplyFix(document, svgNamespace)) {
    return DOMClass;
  }

  let div = document.createElement('div');
  return class DOMChangesWithSVGInnerHTMLFix extends DOMClass {
    insertHTMLBefore(parent, nextSibling, html) {
      if (html === '') {
        return super.insertHTMLBefore(parent, nextSibling, html);
      }

      if (parent.namespaceURI !== svgNamespace) {
        return super.insertHTMLBefore(parent, nextSibling, html);
      }

      return fixSVG(parent, div, html, nextSibling);
    }

  };
}

function fixSVG(parent, div, html, reference) {
  let source; // This is important, because decendants of the <foreignObject> integration
  // point are parsed in the HTML namespace

  if (parent.tagName.toUpperCase() === 'FOREIGNOBJECT') {
    // IE, Edge: also do not correctly support using `innerHTML` on SVG
    // namespaced elements. So here a wrapper is used.
    let wrappedHtml = '<svg><foreignObject>' + html + '</foreignObject></svg>';
    clearElement(div);
    div.insertAdjacentHTML("afterbegin"
    /* afterbegin */
    , wrappedHtml);
    source = div.firstChild.firstChild;
  } else {
    // IE, Edge: also do not correctly support using `innerHTML` on SVG
    // namespaced elements. So here a wrapper is used.
    let wrappedHtml = '<svg>' + html + '</svg>';
    clearElement(div);
    div.insertAdjacentHTML("afterbegin"
    /* afterbegin */
    , wrappedHtml);
    source = div.firstChild;
  }

  return moveNodesBefore(source, parent, reference);
}

function shouldApplyFix(document, svgNamespace) {
  let svg = document.createElementNS(svgNamespace, 'svg');

  try {
    svg.insertAdjacentHTML("beforeend"
    /* beforeend */
    , '<circle></circle>');
  } catch (e) {// IE, Edge: Will throw, insertAdjacentHTML is unsupported on SVG
    // Safari: Will throw, insertAdjacentHTML is not present on SVG
  } finally {
    // FF: Old versions will create a node in the wrong namespace
    if (svg.childNodes.length === 1 && svg.firstChild.namespaceURI === SVG_NAMESPACE) {
      // The test worked as expected, no fix required
      return false;
    }

    return true;
  }
} // Patch:    Adjacent text node merging fix
// Browsers: IE, Edge, Firefox w/o inspector open
// Reason:   These browsers will merge adjacent text nodes. For exmaple given
//           <div>Hello</div> with div.insertAdjacentHTML(' world') browsers
//           with proper behavior will populate div.childNodes with two items.
//           These browsers will populate it with one merged node instead.
// Fix:      Add these nodes to a wrapper element, then iterate the childNodes
//           of that wrapper and move the nodes to their target location. Note
//           that potential SVG bugs will have been handled before this fix.
//           Note that this fix must only apply to the previous text node, as
//           the base implementation of `insertHTMLBefore` already handles
//           following text nodes correctly.


function applyTextNodeMergingFix(document, DOMClass) {
  if (!document) return DOMClass;

  if (!shouldApplyFix$1(document)) {
    return DOMClass;
  }

  return class DOMChangesWithTextNodeMergingFix extends DOMClass {
    constructor(document) {
      super(document);
      this.uselessComment = document.createComment('');
    }

    insertHTMLBefore(parent, nextSibling, html) {
      if (html === '') {
        return super.insertHTMLBefore(parent, nextSibling, html);
      }

      let didSetUselessComment = false;
      let nextPrevious = nextSibling ? nextSibling.previousSibling : parent.lastChild;

      if (nextPrevious && nextPrevious instanceof Text) {
        didSetUselessComment = true;
        parent.insertBefore(this.uselessComment, nextSibling);
      }

      let bounds = super.insertHTMLBefore(parent, nextSibling, html);

      if (didSetUselessComment) {
        parent.removeChild(this.uselessComment);
      }

      return bounds;
    }

  };
}

function shouldApplyFix$1(document) {
  let mergingTextDiv = document.createElement('div');
  mergingTextDiv.appendChild(document.createTextNode('first'));
  mergingTextDiv.insertAdjacentHTML("beforeend"
  /* beforeend */
  , 'second');

  if (mergingTextDiv.childNodes.length === 2) {
    // It worked as expected, no fix required
    return false;
  }

  return true;
}

['b', 'big', 'blockquote', 'body', 'br', 'center', 'code', 'dd', 'div', 'dl', 'dt', 'em', 'embed', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'hr', 'i', 'img', 'li', 'listing', 'main', 'meta', 'nobr', 'ol', 'p', 'pre', 'ruby', 's', 'small', 'span', 'strong', 'strike', 'sub', 'sup', 'table', 'tt', 'u', 'ul', 'var'].forEach(tag => BLACKLIST_TABLE[tag] = 1);
const WHITESPACE = /[\t-\r \xA0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/;
let doc = typeof document === 'undefined' ? null : document;

function isWhitespace(string) {
  return WHITESPACE.test(string);
}

var DOM;

(function (DOM) {
  class TreeConstruction extends DOMOperations {
    createElementNS(namespace, tag) {
      return this.document.createElementNS(namespace, tag);
    }

    setAttribute(element, name, value, namespace = null) {
      if (namespace) {
        element.setAttributeNS(namespace, name, value);
      } else {
        element.setAttribute(name, value);
      }
    }

  }

  DOM.TreeConstruction = TreeConstruction;
  let appliedTreeContruction = TreeConstruction;
  appliedTreeContruction = applyTextNodeMergingFix(doc, appliedTreeContruction);
  appliedTreeContruction = applySVGInnerHTMLFix(doc, appliedTreeContruction, "http://www.w3.org/2000/svg"
  /* SVG */
  );
  DOM.DOMTreeConstruction = appliedTreeContruction;
})(DOM || (DOM = {}));

class DOMChangesImpl extends DOMOperations {
  constructor(document) {
    super(document);
    this.document = document;
    this.namespace = null;
  }

  setAttribute(element, name, value) {
    element.setAttribute(name, value);
  }

  removeAttribute(element, name) {
    element.removeAttribute(name);
  }

  insertAfter(element, node, reference) {
    this.insertBefore(element, node, reference.nextSibling);
  }

}

let helper = DOMChangesImpl;
helper = applyTextNodeMergingFix(doc, helper);
helper = applySVGInnerHTMLFix(doc, helper, "http://www.w3.org/2000/svg"
/* SVG */
);
var helper$1 = helper;
const DOMTreeConstruction = DOM.DOMTreeConstruction;

class PrimitiveReference extends ConstReference {
  static create(value) {
    if (value === undefined) {
      return UNDEFINED_REFERENCE;
    } else if (value === null) {
      return NULL_REFERENCE;
    } else if (value === true) {
      return TRUE_REFERENCE;
    } else if (value === false) {
      return FALSE_REFERENCE;
    } else if (typeof value === 'number') {
      return new ValueReference(value);
    } else {
      return new StringReference(value);
    }
  }

  constructor(value) {
    super(value);
  }

  get(_key) {
    return UNDEFINED_REFERENCE;
  }

}

class StringReference extends PrimitiveReference {
  constructor() {
    super(...arguments);
    this.lengthReference = null;
  }

  get(key) {
    if (key === 'length') {
      let {
        lengthReference
      } = this;

      if (lengthReference === null) {
        lengthReference = this.lengthReference = new ValueReference(this.inner.length);
      }

      return lengthReference;
    } else {
      return super.get(key);
    }
  }

}

class ValueReference extends PrimitiveReference {
  constructor(value) {
    super(value);
  }

}

const UNDEFINED_REFERENCE = new ValueReference(undefined);
const NULL_REFERENCE = new ValueReference(null);
const TRUE_REFERENCE = new ValueReference(true);
const FALSE_REFERENCE = new ValueReference(false);

class ConditionalReference {
  constructor(inner, toBool = defaultToBool) {
    this.inner = inner;
    this.toBool = toBool;
    this._tag = createUpdatableTag();
    this.tag = combine([inner.tag, this._tag]);
  }

  value() {
    let ret;
    let {
      toBool,
      inner
    } = this;
    let tag = track(() => ret = toBool(inner.value()));
    updateTag(this._tag, tag);
    return ret;
  }

}

function defaultToBool(value) {
  return !!value;
}

function normalizeStringValue(value) {
  if (isEmpty(value)) {
    return '';
  }

  return String(value);
}

function shouldCoerce(value) {
  return isString(value) || isEmpty(value) || typeof value === 'boolean' || typeof value === 'number';
}

function isEmpty(value) {
  return value === null || value === undefined || typeof value.toString !== 'function';
}

function isSafeString(value) {
  return typeof value === 'object' && value !== null && typeof value.toHTML === 'function';
}

function isNode(value) {
  return typeof value === 'object' && value !== null && typeof value.nodeType === 'number';
}

function isFragment(value) {
  return isNode(value) && value.nodeType === 11;
}

function isString(value) {
  return typeof value === 'string';
}
/*
 * @method normalizeProperty
 * @param element {HTMLElement}
 * @param slotName {String}
 * @returns {Object} { name, type }
 */


function normalizeProperty(element, slotName) {
  let type, normalized;

  if (slotName in element) {
    normalized = slotName;
    type = 'prop';
  } else {
    let lower = slotName.toLowerCase();

    if (lower in element) {
      type = 'prop';
      normalized = lower;
    } else {
      type = 'attr';
      normalized = slotName;
    }
  }

  if (type === 'prop' && (normalized.toLowerCase() === 'style' || preferAttr(element.tagName, normalized))) {
    type = 'attr';
  }

  return {
    normalized,
    type
  };
} // * browser bug
// * strange spec outlier


const ATTR_OVERRIDES = {
  INPUT: {
    form: true,
    // Chrome 46.0.2464.0: 'autocorrect' in document.createElement('input') === false
    // Safari 8.0.7: 'autocorrect' in document.createElement('input') === false
    // Mobile Safari (iOS 8.4 simulator): 'autocorrect' in document.createElement('input') === true
    autocorrect: true,
    // Chrome 54.0.2840.98: 'list' in document.createElement('input') === true
    // Safari 9.1.3: 'list' in document.createElement('input') === false
    list: true
  },
  // element.form is actually a legitimate readOnly property, that is to be
  // mutated, but must be mutated by setAttribute...
  SELECT: {
    form: true
  },
  OPTION: {
    form: true
  },
  TEXTAREA: {
    form: true
  },
  LABEL: {
    form: true
  },
  FIELDSET: {
    form: true
  },
  LEGEND: {
    form: true
  },
  OBJECT: {
    form: true
  },
  BUTTON: {
    form: true
  }
};

function preferAttr(tagName, propName) {
  let tag = ATTR_OVERRIDES[tagName.toUpperCase()];
  return tag && tag[propName.toLowerCase()] || false;
}

const badProtocols = ['javascript:', 'vbscript:'];
const badTags = ['A', 'BODY', 'LINK', 'IMG', 'IFRAME', 'BASE', 'FORM'];
const badTagsForDataURI = ['EMBED'];
const badAttributes = ['href', 'src', 'background', 'action'];
const badAttributesForDataURI = ['src'];

function has(array, item) {
  return array.indexOf(item) !== -1;
}

function checkURI(tagName, attribute) {
  return (tagName === null || has(badTags, tagName)) && has(badAttributes, attribute);
}

function checkDataURI(tagName, attribute) {
  if (tagName === null) return false;
  return has(badTagsForDataURI, tagName) && has(badAttributesForDataURI, attribute);
}

function requiresSanitization(tagName, attribute) {
  return checkURI(tagName, attribute) || checkDataURI(tagName, attribute);
}

function sanitizeAttributeValue(env, element, attribute, value) {
  let tagName = null;

  if (value === null || value === undefined) {
    return value;
  }

  if (isSafeString(value)) {
    return value.toHTML();
  }

  if (!element) {
    tagName = null;
  } else {
    tagName = element.tagName.toUpperCase();
  }

  let str = normalizeStringValue(value);

  if (checkURI(tagName, attribute)) {
    let protocol = env.protocolForURL(str);

    if (has(badProtocols, protocol)) {
      return `unsafe:${str}`;
    }
  }

  if (checkDataURI(tagName, attribute)) {
    return `unsafe:${str}`;
  }

  return str;
}

function dynamicAttribute(element, attr, namespace) {
  let {
    tagName,
    namespaceURI
  } = element;
  let attribute = {
    element,
    name: attr,
    namespace
  };

  if (namespaceURI === "http://www.w3.org/2000/svg"
  /* SVG */
  ) {
      return buildDynamicAttribute(tagName, attr, attribute);
    }

  let {
    type,
    normalized
  } = normalizeProperty(element, attr);

  if (type === 'attr') {
    return buildDynamicAttribute(tagName, normalized, attribute);
  } else {
    return buildDynamicProperty(tagName, normalized, attribute);
  }
}

function buildDynamicAttribute(tagName, name, attribute) {
  if (requiresSanitization(tagName, name)) {
    return new SafeDynamicAttribute(attribute);
  } else {
    return new SimpleDynamicAttribute(attribute);
  }
}

function buildDynamicProperty(tagName, name, attribute) {
  if (requiresSanitization(tagName, name)) {
    return new SafeDynamicProperty(name, attribute);
  }

  if (isUserInputValue(tagName, name)) {
    return new InputValueDynamicAttribute(name, attribute);
  }

  if (isOptionSelected(tagName, name)) {
    return new OptionSelectedDynamicAttribute(name, attribute);
  }

  return new DefaultDynamicProperty(name, attribute);
}

class DynamicAttribute {
  constructor(attribute) {
    this.attribute = attribute;
  }

}

class SimpleDynamicAttribute extends DynamicAttribute {
  set(dom, value, _env) {
    let normalizedValue = normalizeValue(value);

    if (normalizedValue !== null) {
      let {
        name,
        namespace
      } = this.attribute;

      dom.__setAttribute(name, normalizedValue, namespace);
    }
  }

  update(value, _env) {
    let normalizedValue = normalizeValue(value);
    let {
      element,
      name
    } = this.attribute;

    if (normalizedValue === null) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, normalizedValue);
    }
  }

}

class DefaultDynamicProperty extends DynamicAttribute {
  constructor(normalizedName, attribute) {
    super(attribute);
    this.normalizedName = normalizedName;
  }

  set(dom, value, _env) {
    if (value !== null && value !== undefined) {
      this.value = value;

      dom.__setProperty(this.normalizedName, value);
    }
  }

  update(value, _env) {
    let {
      element
    } = this.attribute;

    if (this.value !== value) {
      element[this.normalizedName] = this.value = value;

      if (value === null || value === undefined) {
        this.removeAttribute();
      }
    }
  }

  removeAttribute() {
    // TODO this sucks but to preserve properties first and to meet current
    // semantics we must do this.
    let {
      element,
      namespace
    } = this.attribute;

    if (namespace) {
      element.removeAttributeNS(namespace, this.normalizedName);
    } else {
      element.removeAttribute(this.normalizedName);
    }
  }

}

class SafeDynamicProperty extends DefaultDynamicProperty {
  set(dom, value, env) {
    let {
      element,
      name
    } = this.attribute;
    let sanitized = sanitizeAttributeValue(env, element, name, value);
    super.set(dom, sanitized, env);
  }

  update(value, env) {
    let {
      element,
      name
    } = this.attribute;
    let sanitized = sanitizeAttributeValue(env, element, name, value);
    super.update(sanitized, env);
  }

}

class SafeDynamicAttribute extends SimpleDynamicAttribute {
  set(dom, value, env) {
    let {
      element,
      name
    } = this.attribute;
    let sanitized = sanitizeAttributeValue(env, element, name, value);
    super.set(dom, sanitized, env);
  }

  update(value, env) {
    let {
      element,
      name
    } = this.attribute;
    let sanitized = sanitizeAttributeValue(env, element, name, value);
    super.update(sanitized, env);
  }

}

class InputValueDynamicAttribute extends DefaultDynamicProperty {
  set(dom, value) {
    dom.__setProperty('value', normalizeStringValue(value));
  }

  update(value) {
    let input = this.attribute.element;
    let currentValue = input.value;
    let normalizedValue = normalizeStringValue(value);

    if (currentValue !== normalizedValue) {
      input.value = normalizedValue;
    }
  }

}

class OptionSelectedDynamicAttribute extends DefaultDynamicProperty {
  set(dom, value) {
    if (value !== null && value !== undefined && value !== false) {
      dom.__setProperty('selected', true);
    }
  }

  update(value) {
    let option = this.attribute.element;

    if (value) {
      option.selected = true;
    } else {
      option.selected = false;
    }
  }

}

function isOptionSelected(tagName, attribute) {
  return tagName === 'OPTION' && attribute === 'selected';
}

function isUserInputValue(tagName, attribute) {
  return (tagName === 'INPUT' || tagName === 'TEXTAREA') && attribute === 'value';
}

function normalizeValue(value) {
  if (value === false || value === undefined || value === null || typeof value.toString === 'undefined') {
    return null;
  }

  if (value === true) {
    return '';
  } // onclick function etc in SSR


  if (typeof value === 'function') {
    return null;
  }

  return String(value);
}

var _a$1;

class ScopeImpl {
  constructor( // the 0th slot is `self`
  slots, callerScope, // named arguments and blocks passed to a layout that uses eval
  evalScope, // locals in scope when the partial was invoked
  partialMap) {
    this.slots = slots;
    this.callerScope = callerScope;
    this.evalScope = evalScope;
    this.partialMap = partialMap;
  }

  static root(self, size = 0) {
    let refs = new Array(size + 1);

    for (let i = 0; i <= size; i++) {
      refs[i] = UNDEFINED_REFERENCE;
    }

    return new ScopeImpl(refs, null, null, null).init({
      self
    });
  }

  static sized(size = 0) {
    let refs = new Array(size + 1);

    for (let i = 0; i <= size; i++) {
      refs[i] = UNDEFINED_REFERENCE;
    }

    return new ScopeImpl(refs, null, null, null);
  }

  init({
    self
  }) {
    this.slots[0] = self;
    return this;
  }

  getSelf() {
    return this.get(0);
  }

  getSymbol(symbol$$1) {
    return this.get(symbol$$1);
  }

  getBlock(symbol$$1) {
    let block = this.get(symbol$$1);
    return block === UNDEFINED_REFERENCE ? null : block;
  }

  getEvalScope() {
    return this.evalScope;
  }

  getPartialMap() {
    return this.partialMap;
  }

  bind(symbol$$1, value) {
    this.set(symbol$$1, value);
  }

  bindSelf(self) {
    this.set(0, self);
  }

  bindSymbol(symbol$$1, value) {
    this.set(symbol$$1, value);
  }

  bindBlock(symbol$$1, value) {
    this.set(symbol$$1, value);
  }

  bindEvalScope(map) {
    this.evalScope = map;
  }

  bindPartialMap(map) {
    this.partialMap = map;
  }

  bindCallerScope(scope) {
    this.callerScope = scope;
  }

  getCallerScope() {
    return this.callerScope;
  }

  child() {
    return new ScopeImpl(this.slots.slice(), this.callerScope, this.evalScope, this.partialMap);
  }

  get(index) {
    if (index >= this.slots.length) {
      throw new RangeError(`BUG: cannot get $${index} from scope; length=${this.slots.length}`);
    }

    return this.slots[index];
  }

  set(index, value) {
    if (index >= this.slots.length) {
      throw new RangeError(`BUG: cannot get $${index} from scope; length=${this.slots.length}`);
    }

    this.slots[index] = value;
  }

}

const TRANSACTION = symbol('TRANSACTION');

class TransactionImpl {
  constructor() {
    this.scheduledInstallManagers = [];
    this.scheduledInstallModifiers = [];
    this.scheduledUpdateModifierManagers = [];
    this.scheduledUpdateModifiers = [];
    this.createdComponents = [];
    this.createdManagers = [];
    this.updatedComponents = [];
    this.updatedManagers = [];
  }

  didCreate(component, manager) {
    this.createdComponents.push(component);
    this.createdManagers.push(manager);
  }

  didUpdate(component, manager) {
    this.updatedComponents.push(component);
    this.updatedManagers.push(manager);
  }

  scheduleInstallModifier(modifier, manager) {
    this.scheduledInstallModifiers.push(modifier);
    this.scheduledInstallManagers.push(manager);
  }

  scheduleUpdateModifier(modifier, manager) {
    this.scheduledUpdateModifiers.push(modifier);
    this.scheduledUpdateModifierManagers.push(manager);
  }

  commit() {
    let {
      createdComponents,
      createdManagers
    } = this;

    for (let i = 0; i < createdComponents.length; i++) {
      let component = createdComponents[i];
      let manager = createdManagers[i];
      manager.didCreate(component);
    }

    let {
      updatedComponents,
      updatedManagers
    } = this;

    for (let i = 0; i < updatedComponents.length; i++) {
      let component = updatedComponents[i];
      let manager = updatedManagers[i];
      manager.didUpdate(component);
    }

    let {
      scheduledInstallManagers,
      scheduledInstallModifiers
    } = this;

    for (let i = 0; i < scheduledInstallManagers.length; i++) {
      let modifier = scheduledInstallModifiers[i];
      let manager = scheduledInstallManagers[i];
      manager.install(modifier);
    }

    let {
      scheduledUpdateModifierManagers,
      scheduledUpdateModifiers
    } = this;

    for (let i = 0; i < scheduledUpdateModifierManagers.length; i++) {
      let modifier = scheduledUpdateModifiers[i];
      let manager = scheduledUpdateModifierManagers[i];
      manager.update(modifier);
    }
  }

}

function defaultDelegateFn(delegateFn, delegateDefault) {
  let defaultFn = delegateFn !== undefined ? delegateFn : delegateDefault;

  if (DEBUG) {
    // Bind to `null` in DEBUG since these methods are assumed to be pure
    // functions, so we can reassign them.
    return defaultFn.bind(null);
  }

  return defaultFn;
}

class EnvironmentImpl {
  constructor(options, delegate) {
    this.delegate = delegate;
    this[_a$1] = null; // Delegate methods and values

    this.extra = this.delegate.extra;
    this.isInteractive = typeof this.delegate.isInteractive === 'boolean' ? this.delegate.isInteractive : true;
    this.protocolForURL = defaultDelegateFn(this.delegate.protocolForURL, defaultGetProtocolForURL);
    this.attributeFor = defaultDelegateFn(this.delegate.attributeFor, defaultAttributeFor);
    this.getProp = defaultDelegateFn(this.delegate.getProp, defaultGetProp);
    this.getPath = defaultDelegateFn(this.delegate.getPath, defaultGetProp);
    this.setPath = defaultDelegateFn(this.delegate.setPath, defaultSetPath);
    this.toBool = defaultDelegateFn(this.delegate.toBool, defaultToBool$1);
    this.toIterator = defaultDelegateFn(this.delegate.toIterator, defaultToIterator);

    if (options.appendOperations) {
      this.appendOperations = options.appendOperations;
      this.updateOperations = options.updateOperations;
    } else if (options.document) {
      this.appendOperations = new DOMTreeConstruction(options.document);
      this.updateOperations = new DOMChangesImpl(options.document);
    } else if (DEBUG) {
      throw new Error('you must pass document or appendOperations to a new runtime');
    }
  }

  getTemplatePathDebugContext(ref) {
    if (this.delegate.getTemplatePathDebugContext !== undefined) {
      return this.delegate.getTemplatePathDebugContext(ref);
    }

    return '';
  }

  setTemplatePathDebugContext(ref, desc, parentRef) {
    if (this.delegate.setTemplatePathDebugContext !== undefined) {
      this.delegate.setTemplatePathDebugContext(ref, desc, parentRef);
    }
  }

  toConditionalReference(input) {
    return new ConditionalReference(input, this.delegate.toBool);
  }

  getAppendOperations() {
    return this.appendOperations;
  }

  getDOM() {
    return this.updateOperations;
  }

  begin() {
    if (this.delegate.onTransactionBegin !== undefined) {
      this.delegate.onTransactionBegin();
    }

    this[TRANSACTION] = new TransactionImpl();
  }

  get transaction() {
    return this[TRANSACTION];
  }

  didCreate(component, manager) {
    this.transaction.didCreate(component, manager);
  }

  didUpdate(component, manager) {
    this.transaction.didUpdate(component, manager);
  }

  scheduleInstallModifier(modifier, manager) {
    if (this.isInteractive) {
      this.transaction.scheduleInstallModifier(modifier, manager);
    }
  }

  scheduleUpdateModifier(modifier, manager) {
    if (this.isInteractive) {
      this.transaction.scheduleUpdateModifier(modifier, manager);
    }
  }

  commit() {
    let transaction = this.transaction;
    this[TRANSACTION] = null;
    transaction.commit();

    if (this.delegate.onTransactionCommit !== undefined) {
      this.delegate.onTransactionCommit();
    }
  }

}

_a$1 = TRANSACTION;

function defaultGetProtocolForURL(url) {
  if (typeof URL === 'object' || typeof URL === 'undefined') {
    return legacyProtocolForURL(url);
  } else if (typeof document !== 'undefined') {
    return new URL(url, document.baseURI).protocol;
  } else {
    return new URL(url, 'https://www.example.com').protocol;
  }
}

function defaultAttributeFor(element, attr, _isTrusting, namespace) {
  return dynamicAttribute(element, attr, namespace);
}

function defaultGetProp(obj, key) {
  return obj[key];
}

function defaultSetPath(obj, key, value) {
  return obj[key] = value;
}

function defaultToBool$1(value) {
  return Boolean(value);
}

function defaultToIterator(value) {
  if (value && value[Symbol.iterator]) {
    return value[Symbol.iterator]();
  }

  return null;
}

function legacyProtocolForURL(url) {
  if (typeof window === 'undefined') {
    let match = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i.exec(url);
    return match && match[1] ? match[1].toLowerCase() : '';
  }

  let anchor = window.document.createElement('a');
  anchor.href = url;
  return anchor.protocol;
}

class DefaultRuntimeResolver {
  constructor(inner) {
    this.inner = inner;
  }

  lookupComponent(name, referrer) {
    if (this.inner.lookupComponent) {
      let component = this.inner.lookupComponent(name, referrer);

      if (component === undefined) {
        throw new Error(`Unexpected component ${name} (from ${referrer}) (lookupComponent returned undefined)`);
      }

      return component;
    } else {
      throw new Error('lookupComponent not implemented on RuntimeResolver.');
    }
  }

  lookupPartial(name, referrer) {
    if (this.inner.lookupPartial) {
      let partial = this.inner.lookupPartial(name, referrer);

      if (partial === undefined) {
        throw new Error(`Unexpected partial ${name} (from ${referrer}) (lookupPartial returned undefined)`);
      }

      return partial;
    } else {
      throw new Error('lookupPartial not implemented on RuntimeResolver.');
    }
  }

  resolve(handle) {
    if (this.inner.resolve) {
      let resolved = this.inner.resolve(handle);

      if (resolved === undefined) {
        throw new Error(`Unexpected handle ${handle} (resolve returned undefined)`);
      }

      return resolved;
    } else {
      throw new Error('resolve not implemented on RuntimeResolver.');
    }
  }

  compilable(locator) {
    if (this.inner.compilable) {
      let resolved = this.inner.compilable(locator);

      if (resolved === undefined) {
        throw new Error(`Unable to compile ${name} (compilable returned undefined)`);
      }

      return resolved;
    } else {
      throw new Error('compilable not implemented on RuntimeResolver.');
    }
  }

  getInvocation(locator) {
    if (this.inner.getInvocation) {
      let invocation = this.inner.getInvocation(locator);

      if (invocation === undefined) {
        throw new Error(`Unable to get invocation for ${JSON.stringify(locator)} (getInvocation returned undefined)`);
      }

      return invocation;
    } else {
      throw new Error('getInvocation not implemented on RuntimeResolver.');
    }
  }

}

function AotRuntime(options, program, resolver = {}, delegate = {}) {
  let env = new EnvironmentImpl(options, delegate);
  return {
    env,
    resolver: new DefaultRuntimeResolver(resolver),
    program: RuntimeProgramImpl.hydrate(program)
  };
}

function JitRuntime(options, delegate = {}, context, resolver = {}) {
  return {
    env: new EnvironmentImpl(options, delegate),
    program: new RuntimeProgramImpl(context.program.constants, context.program.heap),
    resolver: new DefaultRuntimeResolver(resolver)
  };
}

function inTransaction(env, cb) {
  if (!env[TRANSACTION]) {
    env.begin();

    try {
      cb();
    } finally {
      env.commit();
    }
  } else {
    cb();
  }
}

class AppendOpcodes {
  constructor() {
    this.evaluateOpcode = fillNulls(107
    /* Size */
    ).slice();
  }

  add(name, evaluate, kind = 'syscall') {
    this.evaluateOpcode[name] = {
      syscall: kind !== 'machine',
      evaluate
    };
  }

  debugBefore(vm, opcode) {
    let params = undefined;
    let opName = undefined;
    let sp;
    return {
      sp: sp,
      pc: vm.fetchValue($pc),
      name: opName,
      params,
      type: opcode.type,
      isMachine: opcode.isMachine,
      size: opcode.size,
      state: undefined
    };
  }

  debugAfter(vm, pre) {}

  evaluate(vm, opcode, type) {
    let operation = this.evaluateOpcode[type];

    if (operation.syscall) {
      operation.evaluate(vm, opcode);
    } else {
      operation.evaluate(vm[INNER_VM], opcode);
    }
  }

}

const APPEND_OPCODES = new AppendOpcodes();

class AbstractOpcode {
  constructor() {
    initializeGuid(this);
  }

}

class UpdatingOpcode extends AbstractOpcode {}
/**
 * These utility functions are related to @glimmer/validator, but they aren't
 * meant to be consumed publicly. They exist as an optimization, and pull in
 * types that are otherwise unrelated to the validation system. Keeping them
 * here keeps the validation system isolated, and allows it to avoid pulling in
 * extra type information (which can lead to issues in public types).
 */


function combineTagged(tagged) {
  let optimized = [];

  for (let i = 0; i < tagged.length; i++) {
    let tag = tagged[i].tag;
    if (tag === CONSTANT_TAG) continue;
    optimized.push(tag);
  }

  return createCombinatorTag(optimized);
}

function combineFromIndex(tagged, startIndex) {
  let optimized = [];

  for (let i = startIndex; i < tagged.length; i++) {
    let tag = tagged[i].tag;
    if (tag === CONSTANT_TAG) continue;
    optimized.push(tag);
  }

  return createCombinatorTag(optimized);
}

class ConcatReference extends CachedReference {
  constructor(parts) {
    super();
    this.parts = parts;
    this.tag = combineTagged(parts);
  }

  compute() {
    let parts = new Array();

    for (let i = 0; i < this.parts.length; i++) {
      let value = this.parts[i].value();

      if (value !== null && value !== undefined) {
        parts[i] = castToString(value);
      }
    }

    if (parts.length > 0) {
      return parts.join('');
    }

    return null;
  }

}

function castToString(value) {
  if (typeof value.toString !== 'function') {
    return '';
  }

  return String(value);
}

APPEND_OPCODES.add(16
/* Helper */
, (vm, {
  op1: handle
}) => {
  let stack = vm.stack;
  let helper = vm.runtime.resolver.resolve(handle);
  let args = stack.popJs();
  let value = helper(args, vm);
  vm.loadValue($v0, value);
});
APPEND_OPCODES.add(22
/* GetVariable */
, (vm, {
  op1: symbol$$1
}) => {
  let expr = vm.referenceForSymbol(symbol$$1);
  vm.stack.pushJs(expr);
});
APPEND_OPCODES.add(19
/* SetVariable */
, (vm, {
  op1: symbol$$1
}) => {
  let expr = vm.stack.pop();
  vm.scope().bindSymbol(symbol$$1, expr);
});
APPEND_OPCODES.add(21
/* SetJitBlock */
, (vm, {
  op1: symbol$$1
}) => {
  let handle = vm.stack.popJs();
  let scope = vm.stack.popJs();
  let table = vm.stack.popJs();
  let block = table ? [handle, scope, table] : null;
  vm.scope().bindBlock(symbol$$1, block);
}, 'jit');
APPEND_OPCODES.add(20
/* SetAotBlock */
, (vm, {
  op1: symbol$$1
}) => {
  // In DEBUG handles could be ErrHandle objects
  let handle = DEBUG ? vm.stack.pop() : vm.stack.popSmallInt();
  let scope = vm.stack.popJs();
  let table = vm.stack.popJs();
  let block = table ? [handle, scope, table] : null;
  vm.scope().bindBlock(symbol$$1, block);
});
APPEND_OPCODES.add(105
/* ResolveMaybeLocal */
, (vm, {
  op1: _name
}) => {
  let name = vm[CONSTANTS].getValue(_name);
  let locals = vm.scope().getPartialMap();
  let ref = locals[name];

  if (ref === undefined) {
    ref = vm.getSelf().get(name);
  }

  vm.stack.pushJs(ref);
});
APPEND_OPCODES.add(37
/* RootScope */
, (vm, {
  op1: symbols
}) => {
  vm.pushRootScope(symbols);
});
APPEND_OPCODES.add(23
/* GetProperty */
, (vm, {
  op1: _key
}) => {
  let key = vm[CONSTANTS].getValue(_key);
  let expr = vm.stack.popJs();
  vm.stack.pushJs(expr.get(key));
});
APPEND_OPCODES.add(24
/* GetBlock */
, (vm, {
  op1: _block
}) => {
  let {
    stack
  } = vm;
  let block = vm.scope().getBlock(_block);

  if (block === null) {
    stack.pushNull();
  } else {
    stack.pushJs(block);
  }
});
APPEND_OPCODES.add(25
/* JitSpreadBlock */
, vm => {
  let {
    stack
  } = vm;
  let block = stack.popJs();

  if (block && !isUndefinedReference(block)) {
    let [handleOrCompilable, scope, table] = block;
    stack.pushJs(table);
    stack.pushJs(scope);

    if (typeof handleOrCompilable === 'number') {
      stack.pushSmallInt(handleOrCompilable);
    } else {
      stack.pushJs(handleOrCompilable);
    }
  } else {
    stack.pushNull();
    stack.pushNull();
    stack.pushNull();
  }
});

function isUndefinedReference(input) {
  return input === UNDEFINED_REFERENCE;
}

APPEND_OPCODES.add(26
/* HasBlock */
, vm => {
  let {
    stack
  } = vm;
  let block = stack.pop();

  if (block && !isUndefinedReference(block)) {
    stack.pushJs(TRUE_REFERENCE);
  } else {
    stack.pushJs(FALSE_REFERENCE);
  }
});
APPEND_OPCODES.add(27
/* HasBlockParams */
, vm => {
  // FIXME(mmun): should only need to push the symbol table
  let block = vm.stack.pop();
  let scope = vm.stack.popJs();
  let table = vm.stack.popJs();
  let hasBlockParams = table && table.parameters.length;
  vm.stack.pushJs(hasBlockParams ? TRUE_REFERENCE : FALSE_REFERENCE);
});
APPEND_OPCODES.add(28
/* Concat */
, (vm, {
  op1: count
}) => {
  let out = new Array(count);

  for (let i = count; i > 0; i--) {
    let offset = i - 1;
    out[offset] = vm.stack.pop();
  }

  vm.stack.pushJs(new ConcatReference(out));
});
/**
 * Converts a ComponentCapabilities object into a 32-bit integer representation.
 */

function capabilityFlagsFrom(capabilities) {
  return 0 | (capabilities.dynamicLayout ? 1
  /* DynamicLayout */
  : 0) | (capabilities.dynamicTag ? 2
  /* DynamicTag */
  : 0) | (capabilities.prepareArgs ? 4
  /* PrepareArgs */
  : 0) | (capabilities.createArgs ? 8
  /* CreateArgs */
  : 0) | (capabilities.attributeHook ? 16
  /* AttributeHook */
  : 0) | (capabilities.elementHook ? 32
  /* ElementHook */
  : 0) | (capabilities.dynamicScope ? 64
  /* DynamicScope */
  : 0) | (capabilities.createCaller ? 128
  /* CreateCaller */
  : 0) | (capabilities.updateHook ? 256
  /* UpdateHook */
  : 0) | (capabilities.createInstance ? 512
  /* CreateInstance */
  : 0) | (capabilities.wrapped ? 1024
  /* Wrapped */
  : 0) | (capabilities.willDestroy ? 2048
  /* WillDestroy */
  : 0);
}

function managerHasCapability(_manager, capabilities, capability) {
  return !!(capabilities & capability);
}

function hasCapability(capabilities, capability) {
  return !!(capabilities & capability);
}

var _a$2;

const CURRIED_COMPONENT_DEFINITION_BRAND = symbol('CURRIED COMPONENT DEFINITION');

function isCurriedComponentDefinition(definition) {
  return !!(definition && definition[CURRIED_COMPONENT_DEFINITION_BRAND]);
}

function isComponentDefinition(definition) {
  return !!(definition && definition[CURRIED_COMPONENT_DEFINITION_BRAND]);
}

class CurriedComponentDefinition {
  /** @internal */
  constructor(inner, args) {
    this.inner = inner;
    this.args = args;
    this[_a$2] = true;
  }

  unwrap(args) {
    args.realloc(this.offset);
    let definition = this;

    while (true) {
      let {
        args: curriedArgs,
        inner
      } = definition;

      if (curriedArgs) {
        args.positional.prepend(curriedArgs.positional);
        args.named.merge(curriedArgs.named);
      }

      if (!isCurriedComponentDefinition(inner)) {
        return inner;
      }

      definition = inner;
    }
  }
  /** @internal */


  get offset() {
    let {
      inner,
      args
    } = this;
    let length = args ? args.positional.length : 0;
    return isCurriedComponentDefinition(inner) ? length + inner.offset : length;
  }

}

_a$2 = CURRIED_COMPONENT_DEFINITION_BRAND;

function curry(spec, args = null) {
  return new CurriedComponentDefinition(spec, args);
}

function resolveComponent(resolver, name, meta) {
  let definition = resolver.lookupComponent(name, meta);
  return definition;
}

class ClassListReference {
  constructor(list) {
    this.list = list;
    this.tag = combineTagged(list);
    this.list = list;
  }

  value() {
    let ret = [];
    let {
      list
    } = this;

    for (let i = 0; i < list.length; i++) {
      let value = normalizeStringValue(list[i].value());
      if (value) ret.push(value);
    }

    return ret.length === 0 ? null : ret.join(' ');
  }

}

class CurryComponentReference {
  constructor(inner, resolver, meta, args) {
    this.inner = inner;
    this.resolver = resolver;
    this.meta = meta;
    this.args = args;
    this.tag = inner.tag;
    this.lastValue = null;
    this.lastDefinition = null;
  }

  value() {
    let {
      inner,
      lastValue
    } = this;
    let value = inner.value();

    if (value === lastValue) {
      return this.lastDefinition;
    }

    let definition = null;

    if (isCurriedComponentDefinition(value)) {
      definition = value;
    } else if (typeof value === 'string' && value) {
      let {
        resolver,
        meta
      } = this;
      definition = resolveComponent(resolver, value, meta);
    }

    definition = this.curry(definition);
    this.lastValue = value;
    this.lastDefinition = definition;
    return definition;
  }

  get() {
    return UNDEFINED_REFERENCE;
  }

  curry(definition) {
    let {
      args
    } = this;

    if (!args && isCurriedComponentDefinition(definition)) {
      return definition;
    } else if (!definition) {
      return null;
    } else {
      return new CurriedComponentDefinition(definition, args);
    }
  }

}

class DynamicTextContent extends UpdatingOpcode {
  constructor(node, reference, lastValue) {
    super();
    this.node = node;
    this.reference = reference;
    this.lastValue = lastValue;
    this.type = 'dynamic-text';
    this.tag = reference.tag;
    this.lastRevision = valueForTag(this.tag);
  }

  evaluate() {
    let {
      reference,
      tag
    } = this;

    if (!validateTag(tag, this.lastRevision)) {
      this.lastRevision = valueForTag(tag);
      this.update(reference.value());
    }
  }

  update(value) {
    let {
      lastValue
    } = this;
    if (value === lastValue) return;
    let normalized;

    if (isEmpty(value)) {
      normalized = '';
    } else if (isString(value)) {
      normalized = value;
    } else {
      normalized = String(value);
    }

    if (normalized !== lastValue) {
      let textNode = this.node;
      textNode.nodeValue = this.lastValue = normalized;
    }
  }

}

class ContentTypeReference {
  constructor(inner) {
    this.inner = inner;
    this.tag = inner.tag;
  }

  value() {
    let value = this.inner.value();

    if (shouldCoerce(value)) {
      return 1
      /* String */
      ;
    } else if (isComponentDefinition(value)) {
      return 0
      /* Component */
      ;
    } else if (isSafeString(value)) {
      return 3
      /* SafeString */
      ;
    } else if (isFragment(value)) {
      return 4
      /* Fragment */
      ;
    } else if (isNode(value)) {
      return 5
      /* Node */
      ;
    } else {
        return 1
        /* String */
        ;
      }
  }

}

APPEND_OPCODES.add(43
/* AppendHTML */
, vm => {
  let reference = vm.stack.popJs();
  let rawValue = reference.value();
  let value = isEmpty(rawValue) ? '' : String(rawValue);
  vm.elements().appendDynamicHTML(value);
});
APPEND_OPCODES.add(44
/* AppendSafeHTML */
, vm => {
  let reference = vm.stack.popJs();
  let rawValue = reference.value().toHTML();
  let value = isEmpty(rawValue) ? '' : rawValue;
  vm.elements().appendDynamicHTML(value);
});
APPEND_OPCODES.add(47
/* AppendText */
, vm => {
  let reference = vm.stack.popJs();
  let rawValue = reference.value();
  let value = isEmpty(rawValue) ? '' : String(rawValue);
  let node = vm.elements().appendDynamicText(value);

  if (!isConstTagged(reference)) {
    vm.updateWith(new DynamicTextContent(node, reference, value));
  }
});
APPEND_OPCODES.add(45
/* AppendDocumentFragment */
, vm => {
  let reference = vm.stack.popJs();
  let value = reference.value();
  vm.elements().appendDynamicFragment(value);
});
APPEND_OPCODES.add(46
/* AppendNode */
, vm => {
  let reference = vm.stack.popJs();
  let value = reference.value();
  vm.elements().appendDynamicNode(value);
});
APPEND_OPCODES.add(39
/* ChildScope */
, vm => vm.pushChildScope());
APPEND_OPCODES.add(40
/* PopScope */
, vm => vm.popScope());
APPEND_OPCODES.add(59
/* PushDynamicScope */
, vm => vm.pushDynamicScope());
APPEND_OPCODES.add(60
/* PopDynamicScope */
, vm => vm.popDynamicScope());
APPEND_OPCODES.add(29
/* Constant */
, (vm, {
  op1: other
}) => {
  vm.stack.pushJs(vm[CONSTANTS].getValue(decodeHandle(other)));
});
APPEND_OPCODES.add(30
/* Primitive */
, (vm, {
  op1: primitive
}) => {
  let stack = vm.stack;

  if (isNonPrimitiveHandle(primitive)) {
    // it is a handle which does not already exist on the stack
    let value = vm[CONSTANTS].getValue(decodeHandle(primitive));
    stack.pushJs(value);
  } else {
    // is already an encoded immediate or primitive handle
    stack.pushRaw(primitive);
  }
});
APPEND_OPCODES.add(31
/* PrimitiveReference */
, vm => {
  let stack = vm.stack;
  stack.pushJs(PrimitiveReference.create(stack.pop()));
});
APPEND_OPCODES.add(32
/* ReifyU32 */
, vm => {
  let stack = vm.stack;
  stack.pushSmallInt(stack.peekJs().value());
});
APPEND_OPCODES.add(33
/* Dup */
, (vm, {
  op1: register,
  op2: offset
}) => {
  let position = vm.fetchValue(register) - offset;
  vm.stack.dup(position);
});
APPEND_OPCODES.add(34
/* Pop */
, (vm, {
  op1: count
}) => {
  vm.stack.pop(count);
});
APPEND_OPCODES.add(35
/* Load */
, (vm, {
  op1: register
}) => {
  vm.load(register);
});
APPEND_OPCODES.add(36
/* Fetch */
, (vm, {
  op1: register
}) => {
  vm.fetch(register);
});
APPEND_OPCODES.add(58
/* BindDynamicScope */
, (vm, {
  op1: _names
}) => {
  let names = vm[CONSTANTS].getArray(_names);
  vm.bindDynamicScope(names);
});
APPEND_OPCODES.add(69
/* Enter */
, (vm, {
  op1: args
}) => {
  vm.enter(args);
});
APPEND_OPCODES.add(70
/* Exit */
, vm => {
  vm.exit();
});
APPEND_OPCODES.add(63
/* PushSymbolTable */
, (vm, {
  op1: _table
}) => {
  let stack = vm.stack;
  stack.pushJs(vm[CONSTANTS].getSerializable(_table));
});
APPEND_OPCODES.add(62
/* PushBlockScope */
, vm => {
  let stack = vm.stack;
  stack.pushJs(vm.scope());
});
APPEND_OPCODES.add(61
/* CompileBlock */
, vm => {
  let stack = vm.stack;
  let block = stack.pop();

  if (block) {
    stack.pushSmallInt(vm.compile(block));
  } else {
    stack.pushNull();
  }
}, 'jit');
APPEND_OPCODES.add(64
/* InvokeYield */
, vm => {
  let {
    stack
  } = vm;
  let handle = stack.pop();
  let scope = stack.popJs();
  let table = stack.popJs();
  let args = stack.pop();

  if (table === null) {
    // To balance the pop{Frame,Scope}
    vm.pushFrame();
    vm.pushScope(scope); // Could be null but it doesnt matter as it is immediatelly popped.

    return;
  }

  let invokingScope = scope; // If necessary, create a child scope

  {
    let locals = table.parameters;
    let localsCount = locals.length;

    if (localsCount > 0) {
      invokingScope = invokingScope.child();

      for (let i = 0; i < localsCount; i++) {
        invokingScope.bindSymbol(locals[i], args.at(i));
      }
    }
  }
  vm.pushFrame();
  vm.pushScope(invokingScope);
  vm.call(handle);
});
APPEND_OPCODES.add(65
/* JumpIf */
, (vm, {
  op1: target
}) => {
  let reference = vm.stack.popJs();

  if (isConstTagged(reference)) {
    if (reference.value()) {
      vm.goto(target);
    }
  } else {
    let cache = new ReferenceCache(reference);

    if (cache.peek()) {
      vm.goto(target);
    }

    vm.updateWith(new Assert(cache));
  }
});
APPEND_OPCODES.add(66
/* JumpUnless */
, (vm, {
  op1: target
}) => {
  let reference = vm.stack.popJs();

  if (isConstTagged(reference)) {
    if (!reference.value()) {
      vm.goto(target);
    }
  } else {
    let cache = new ReferenceCache(reference);

    if (!cache.peek()) {
      vm.goto(target);
    }

    vm.updateWith(new Assert(cache));
  }
});
APPEND_OPCODES.add(67
/* JumpEq */
, (vm, {
  op1: target,
  op2: comparison
}) => {
  let other = vm.stack.peekSmallInt();

  if (other === comparison) {
    vm.goto(target);
  }
});
APPEND_OPCODES.add(68
/* AssertSame */
, vm => {
  let reference = vm.stack.peekJs();

  if (!isConstTagged(reference)) {
    vm.updateWith(Assert.initialize(new ReferenceCache(reference)));
  }
});
APPEND_OPCODES.add(71
/* ToBoolean */
, vm => {
  let {
    env,
    stack
  } = vm;
  stack.pushJs(env.toConditionalReference(stack.popJs()));
});

class Assert extends UpdatingOpcode {
  constructor(cache) {
    super();
    this.type = 'assert';
    this.tag = cache.tag;
    this.cache = cache;
  }

  static initialize(cache) {
    let assert = new Assert(cache);
    cache.peek();
    return assert;
  }

  evaluate(vm) {
    let {
      cache
    } = this;

    if (isModified(cache.revalidate())) {
      vm.throw();
    }
  }

}

class JumpIfNotModifiedOpcode extends UpdatingOpcode {
  constructor(index) {
    super();
    this.index = index;
    this.type = 'jump-if-not-modified';
    this.tag = CONSTANT_TAG;
    this.lastRevision = INITIAL;
  }

  finalize(tag, target) {
    this.tag = tag;
    this.target = target;
  }

  evaluate(vm) {
    let {
      tag,
      target,
      lastRevision
    } = this;

    if (!vm.alwaysRevalidate && validateTag(tag, lastRevision)) {
      vm.goto(target);
    }
  }

  didModify() {
    this.lastRevision = valueForTag(this.tag);
  }

}

class DidModifyOpcode extends UpdatingOpcode {
  constructor(target) {
    super();
    this.target = target;
    this.type = 'did-modify';
    this.tag = CONSTANT_TAG;
  }

  evaluate() {
    this.target.didModify();
  }

}

APPEND_OPCODES.add(41
/* Text */
, (vm, {
  op1: text
}) => {
  vm.elements().appendText(vm[CONSTANTS].getValue(text));
});
APPEND_OPCODES.add(42
/* Comment */
, (vm, {
  op1: text
}) => {
  vm.elements().appendComment(vm[CONSTANTS].getValue(text));
});
APPEND_OPCODES.add(48
/* OpenElement */
, (vm, {
  op1: tag
}) => {
  vm.elements().openElement(vm[CONSTANTS].getValue(tag));
});
APPEND_OPCODES.add(49
/* OpenDynamicElement */
, vm => {
  let tagName = vm.stack.popJs().value();
  vm.elements().openElement(tagName);
});
APPEND_OPCODES.add(50
/* PushRemoteElement */
, vm => {
  let elementRef = vm.stack.popJs();
  let insertBeforeRef = vm.stack.popJs();
  let guidRef = vm.stack.popJs();
  let element;
  let insertBefore;
  let guid = guidRef.value();

  if (isConstTagged(elementRef)) {
    element = elementRef.value();
  } else {
    let cache = new ReferenceCache(elementRef);
    element = cache.peek();
    vm.updateWith(new Assert(cache));
  }

  if (insertBeforeRef.value() !== undefined) {
    if (isConstTagged(insertBeforeRef)) {
      insertBefore = insertBeforeRef.value();
    } else {
      let cache = new ReferenceCache(insertBeforeRef);
      insertBefore = cache.peek();
      vm.updateWith(new Assert(cache));
    }
  }

  let block = vm.elements().pushRemoteElement(element, guid, insertBefore);
  if (block) vm.associateDestroyable(block);
});
APPEND_OPCODES.add(56
/* PopRemoteElement */
, vm => {
  vm.elements().popRemoteElement();
});
APPEND_OPCODES.add(54
/* FlushElement */
, vm => {
  let operations = vm.fetchValue($t0);
  let modifiers = null;

  if (operations) {
    modifiers = operations.flush(vm);
    vm.loadValue($t0, null);
  }

  vm.elements().flushElement(modifiers);
});
APPEND_OPCODES.add(55
/* CloseElement */
, vm => {
  let modifiers = vm.elements().closeElement();

  if (modifiers) {
    modifiers.forEach(([manager, modifier]) => {
      vm.env.scheduleInstallModifier(modifier, manager);
      let d = manager.getDestroyable(modifier);

      if (d) {
        vm.associateDestroyable(d);
      }
    });
  }
});
APPEND_OPCODES.add(57
/* Modifier */
, (vm, {
  op1: handle
}) => {
  let {
    manager,
    state
  } = vm.runtime.resolver.resolve(handle);
  let stack = vm.stack;
  let args = stack.popJs();
  let {
    constructing,
    updateOperations
  } = vm.elements();
  let dynamicScope = vm.dynamicScope();
  let modifier = manager.create(constructing, state, args, dynamicScope, updateOperations);
  let operations = vm.fetchValue($t0);
  operations.addModifier(manager, modifier);
  let tag = manager.getTag(modifier);

  if (!isConstTag(tag)) {
    vm.updateWith(new UpdateModifierOpcode(tag, manager, modifier));
  }
});

class UpdateModifierOpcode extends UpdatingOpcode {
  constructor(tag, manager, modifier) {
    super();
    this.tag = tag;
    this.manager = manager;
    this.modifier = modifier;
    this.type = 'update-modifier';
    this.lastUpdated = valueForTag(tag);
  }

  evaluate(vm) {
    let {
      manager,
      modifier,
      tag,
      lastUpdated
    } = this;

    if (!validateTag(tag, lastUpdated)) {
      vm.env.scheduleUpdateModifier(modifier, manager);
      this.lastUpdated = valueForTag(tag);
    }
  }

}

APPEND_OPCODES.add(51
/* StaticAttr */
, (vm, {
  op1: _name,
  op2: _value,
  op3: _namespace
}) => {
  let name = vm[CONSTANTS].getValue(_name);
  let value = vm[CONSTANTS].getValue(_value);
  let namespace = _namespace ? vm[CONSTANTS].getValue(_namespace) : null;
  vm.elements().setStaticAttribute(name, value, namespace);
});
APPEND_OPCODES.add(52
/* DynamicAttr */
, (vm, {
  op1: _name,
  op2: trusting,
  op3: _namespace
}) => {
  let name = vm[CONSTANTS].getValue(_name);
  let reference = vm.stack.popJs();
  let value = reference.value();
  let namespace = _namespace ? vm[CONSTANTS].getValue(_namespace) : null;
  let attribute = vm.elements().setDynamicAttribute(name, value, !!trusting, namespace);

  if (!isConstTagged(reference)) {
    vm.updateWith(new UpdateDynamicAttributeOpcode(reference, attribute));
  }
});

class UpdateDynamicAttributeOpcode extends UpdatingOpcode {
  constructor(reference, attribute) {
    super();
    this.reference = reference;
    this.attribute = attribute;
    this.type = 'patch-element';
    let {
      tag
    } = reference;
    this.tag = tag;
    this.lastRevision = valueForTag(tag);
  }

  evaluate(vm) {
    let {
      attribute,
      reference,
      tag
    } = this;

    if (!validateTag(tag, this.lastRevision)) {
      attribute.update(reference.value(), vm.env);
      this.lastRevision = valueForTag(tag);
    }
  }

}
/**
 * The VM creates a new ComponentInstance data structure for every component
 * invocation it encounters.
 *
 * Similar to how a ComponentDefinition contains state about all components of a
 * particular type, a ComponentInstance contains state specific to a particular
 * instance of a component type. It also contains a pointer back to its
 * component type's ComponentDefinition.
 */


const COMPONENT_INSTANCE = symbol('COMPONENT_INSTANCE');
APPEND_OPCODES.add(77
/* IsComponent */
, vm => {
  let stack = vm.stack;
  let ref = stack.popJs();
  stack.pushJs(new ConditionalReference(ref, isCurriedComponentDefinition));
});
APPEND_OPCODES.add(78
/* ContentType */
, vm => {
  let stack = vm.stack;
  let ref = stack.peekJs();
  stack.pushJs(new ContentTypeReference(ref));
});
APPEND_OPCODES.add(79
/* CurryComponent */
, (vm, {
  op1: _meta
}) => {
  let stack = vm.stack;
  let definition = stack.popJs();
  let capturedArgs = stack.popJs();
  let meta = vm[CONSTANTS].getValue(decodeHandle(_meta));
  let resolver = vm.runtime.resolver;
  vm.loadValue($v0, new CurryComponentReference(definition, resolver, meta, capturedArgs)); // expectStackChange(vm.stack, -args.length - 1, 'CurryComponent');
});
APPEND_OPCODES.add(80
/* PushComponentDefinition */
, (vm, {
  op1: handle
}) => {
  let definition = vm.runtime.resolver.resolve(handle);
  let {
    manager
  } = definition;
  let capabilities = capabilityFlagsFrom(manager.getCapabilities(definition.state));
  let instance = {
    [COMPONENT_INSTANCE]: true,
    definition,
    manager,
    capabilities,
    state: null,
    handle: null,
    table: null,
    lookup: null
  };
  vm.stack.pushJs(instance);
});
APPEND_OPCODES.add(83
/* ResolveDynamicComponent */
, (vm, {
  op1: _meta
}) => {
  let stack = vm.stack;
  let component = stack.popJs().value();
  let meta = vm[CONSTANTS].getValue(decodeHandle(_meta));
  vm.loadValue($t1, null); // Clear the temp register

  let definition;

  if (typeof component === 'string') {
    let resolvedDefinition = resolveComponent(vm.runtime.resolver, component, meta);
    definition = resolvedDefinition;
  } else if (isCurriedComponentDefinition(component)) {
    definition = component;
  } else {
    throw unreachable();
  }

  stack.pushJs(definition);
});
APPEND_OPCODES.add(81
/* PushDynamicComponentInstance */
, vm => {
  let {
    stack
  } = vm;
  let definition = stack.pop();
  let capabilities, manager;

  if (isCurriedComponentDefinition(definition)) {
    manager = capabilities = null;
  } else {
    manager = definition.manager;
    capabilities = capabilityFlagsFrom(manager.getCapabilities(definition.state));
  }

  stack.pushJs({
    definition,
    capabilities,
    manager,
    state: null,
    handle: null,
    table: null
  });
});
APPEND_OPCODES.add(82
/* PushCurriedComponent */
, vm => {
  let stack = vm.stack;
  let component = stack.popJs().value();
  let definition;

  if (isCurriedComponentDefinition(component)) {
    definition = component;
  } else {
    throw unreachable();
  }

  stack.pushJs(definition);
});
APPEND_OPCODES.add(84
/* PushArgs */
, (vm, {
  op1: _names,
  op2: _blockNames,
  op3: flags
}) => {
  let stack = vm.stack;
  let names = vm[CONSTANTS].getArray(_names);
  let positionalCount = flags >> 4;
  let atNames = flags & 0b1000;
  let blockNames = flags & 0b0111 ? vm[CONSTANTS].getArray(_blockNames) : EMPTY_ARRAY;
  vm[ARGS].setup(stack, names, blockNames, positionalCount, !!atNames);
  stack.pushJs(vm[ARGS]);
});
APPEND_OPCODES.add(85
/* PushEmptyArgs */
, vm => {
  let {
    stack
  } = vm;
  stack.pushJs(vm[ARGS].empty(stack));
});
APPEND_OPCODES.add(88
/* CaptureArgs */
, vm => {
  let stack = vm.stack;
  let args = stack.popJs();
  let capturedArgs = args.capture();
  stack.pushJs(capturedArgs);
});
APPEND_OPCODES.add(87
/* PrepareArgs */
, (vm, {
  op1: _state
}) => {
  let stack = vm.stack;
  let instance = vm.fetchValue(_state);
  let args = stack.popJs();
  let {
    definition
  } = instance;

  if (isCurriedComponentDefinition(definition)) {
    definition = resolveCurriedComponentDefinition(instance, definition, args);
  }

  let {
    manager,
    state
  } = definition;
  let capabilities = instance.capabilities;

  if (!managerHasCapability(manager, capabilities, 4
  /* PrepareArgs */
  )) {
    stack.pushJs(args);
    return;
  }

  let blocks = args.blocks.values;
  let blockNames = args.blocks.names;
  let preparedArgs = manager.prepareArgs(state, args);

  if (preparedArgs) {
    args.clear();

    for (let i = 0; i < blocks.length; i++) {
      let block = blocks[i];

      if (typeof block === 'number') {
        stack.pushSmallInt(block);
      } else {
        stack.pushJs(block);
      }
    }

    let {
      positional,
      named
    } = preparedArgs;
    let positionalCount = positional.length;

    for (let i = 0; i < positionalCount; i++) {
      stack.pushJs(positional[i]);
    }

    let names = Object.keys(named);

    for (let i = 0; i < names.length; i++) {
      stack.pushJs(named[names[i]]);
    }

    args.setup(stack, names, blockNames, positionalCount, false);
  }

  stack.pushJs(args);
});

function resolveCurriedComponentDefinition(instance, definition, args) {
  let unwrappedDefinition = instance.definition = definition.unwrap(args);
  let {
    manager,
    state
  } = unwrappedDefinition;
  instance.manager = manager;
  instance.capabilities = capabilityFlagsFrom(manager.getCapabilities(state));
  return unwrappedDefinition;
}

APPEND_OPCODES.add(89
/* CreateComponent */
, (vm, {
  op1: flags,
  op2: _state
}) => {
  let instance = vm.fetchValue(_state);
  let {
    definition,
    manager
  } = instance;
  let capabilities = instance.capabilities = capabilityFlagsFrom(manager.getCapabilities(definition.state));

  if (!managerHasCapability(manager, capabilities, 512
  /* CreateInstance */
  )) {
    throw new Error(`BUG`);
  }

  let dynamicScope = null;

  if (managerHasCapability(manager, capabilities, 64
  /* DynamicScope */
  )) {
    dynamicScope = vm.dynamicScope();
  }

  let hasDefaultBlock = flags & 1;
  let args = null;

  if (managerHasCapability(manager, capabilities, 8
  /* CreateArgs */
  )) {
    args = vm.stack.peekJs();
  }

  let self = null;

  if (managerHasCapability(manager, capabilities, 128
  /* CreateCaller */
  )) {
    self = vm.getSelf();
  }

  let state = manager.create(vm.env, definition.state, args, dynamicScope, self, !!hasDefaultBlock); // We want to reuse the `state` POJO here, because we know that the opcodes
  // only transition at exactly one place.

  instance.state = state;
  let tag = manager.getTag(state);

  if (managerHasCapability(manager, capabilities, 256
  /* UpdateHook */
  ) && !isConstTag(tag)) {
    vm.updateWith(new UpdateComponentOpcode(tag, state, manager, dynamicScope));
  }
});
APPEND_OPCODES.add(90
/* RegisterComponentDestructor */
, (vm, {
  op1: _state
}) => {
  let {
    manager,
    state,
    capabilities
  } = vm.fetchValue(_state);
  let d = manager.getDestroyable(state);

  if (DEBUG && !hasCapability(capabilities, 2048
  /* WillDestroy */
  ) && d !== null && typeof 'willDestroy' in d) {
    throw new Error('BUG: Destructor has willDestroy, but the willDestroy capability was not enabled for this component. Pre-destruction hooks must be explicitly opted into');
  }

  if (d) vm.associateDestroyable(d);
});
APPEND_OPCODES.add(100
/* BeginComponentTransaction */
, vm => {
  vm.beginCacheGroup();
  vm.elements().pushSimpleBlock();
});
APPEND_OPCODES.add(91
/* PutComponentOperations */
, vm => {
  vm.loadValue($t0, new ComponentElementOperations());
});
APPEND_OPCODES.add(53
/* ComponentAttr */
, (vm, {
  op1: _name,
  op2: trusting,
  op3: _namespace
}) => {
  let name = vm[CONSTANTS].getValue(_name);
  let reference = vm.stack.popJs();
  let namespace = _namespace ? vm[CONSTANTS].getValue(_namespace) : null;
  vm.fetchValue($t0).setAttribute(name, reference, !!trusting, namespace);
});
APPEND_OPCODES.add(108
/* StaticComponentAttr */
, (vm, {
  op1: _name,
  op2: _value,
  op3: _namespace
}) => {
  let name = vm[CONSTANTS].getValue(_name);
  let value = vm[CONSTANTS].getValue(_value);
  let namespace = _namespace ? vm[CONSTANTS].getValue(_namespace) : null;
  vm.fetchValue($t0).setStaticAttribute(name, value, namespace);
});

class ComponentElementOperations {
  constructor() {
    this.attributes = dict();
    this.classes = [];
    this.modifiers = [];
  }

  setAttribute(name, value, trusting, namespace) {
    let deferred = {
      value,
      namespace,
      trusting
    };

    if (name === 'class') {
      this.classes.push(value);
    }

    this.attributes[name] = deferred;
  }

  setStaticAttribute(name, value, namespace) {
    let deferred = {
      value,
      namespace
    };

    if (name === 'class') {
      this.classes.push(value);
    }

    this.attributes[name] = deferred;
  }

  addModifier(manager, state) {
    this.modifiers.push([manager, state]);
  }

  flush(vm) {
    let type;
    let attributes = this.attributes;

    for (let name in this.attributes) {
      if (name === 'type') {
        type = attributes[name];
        continue;
      }

      let attr = this.attributes[name];

      if (name === 'class') {
        setDeferredAttr(vm, 'class', mergeClasses(this.classes), attr.namespace, attr.trusting);
      } else {
        setDeferredAttr(vm, name, attr.value, attr.namespace, attr.trusting);
      }
    }

    if (type !== undefined) {
      setDeferredAttr(vm, 'type', type.value, type.namespace, type.trusting);
    }

    return this.modifiers;
  }

}

function mergeClasses(classes) {
  if (classes.length === 0) {
    return '';
  }

  if (classes.length === 1) {
    return classes[0];
  }

  if (allStringClasses(classes)) {
    return classes.join(' ');
  }

  return makeClassList(classes);
}

function makeClassList(classes) {
  for (let i = 0; i < classes.length; i++) {
    const value = classes[i];

    if (typeof value === 'string') {
      classes[i] = PrimitiveReference.create(value);
    }
  }

  return new ClassListReference(classes);
}

function allStringClasses(classes) {
  for (let i = 0; i < classes.length; i++) {
    if (typeof classes[i] !== 'string') {
      return false;
    }
  }

  return true;
}

function setDeferredAttr(vm, name, value, namespace, trusting = false) {
  if (typeof value === 'string') {
    vm.elements().setStaticAttribute(name, value, namespace);
  } else {
    let attribute = vm.elements().setDynamicAttribute(name, value.value(), trusting, namespace);

    if (!isConstTagged(value)) {
      vm.updateWith(new UpdateDynamicAttributeOpcode(value, attribute));
    }
  }
}

APPEND_OPCODES.add(102
/* DidCreateElement */
, (vm, {
  op1: _state
}) => {
  let {
    definition,
    state
  } = vm.fetchValue(_state);
  let {
    manager
  } = definition;
  let operations = vm.fetchValue($t0);
  manager.didCreateElement(state, vm.elements().constructing, operations);
});
APPEND_OPCODES.add(92
/* GetComponentSelf */
, (vm, {
  op1: _state
}) => {
  let {
    definition,
    state
  } = vm.fetchValue(_state);
  let {
    manager
  } = definition;
  vm.stack.pushJs(manager.getSelf(state));
});
APPEND_OPCODES.add(93
/* GetComponentTagName */
, (vm, {
  op1: _state
}) => {
  let {
    definition,
    state
  } = vm.fetchValue(_state);
  let {
    manager
  } = definition;
  let tagName = manager.getTagName(state); // User provided value from JS, so we don't bother to encode

  vm.stack.pushJs(tagName);
}); // Dynamic Invocation Only

APPEND_OPCODES.add(95
/* GetJitComponentLayout */
, (vm, {
  op1: _state
}) => {
  let instance = vm.fetchValue(_state);
  let manager = instance.manager;
  let {
    definition
  } = instance;
  let {
    stack
  } = vm;
  let {
    capabilities
  } = instance; // let invoke: { handle: number; symbolTable: ProgramSymbolTable };

  let layout;

  if (hasStaticLayoutCapability(capabilities, manager)) {
    layout = manager.getJitStaticLayout(definition.state, vm.runtime.resolver);
  } else if (hasDynamicLayoutCapability(capabilities, manager)) {
    let template = unwrapTemplate(manager.getJitDynamicLayout(instance.state, vm.runtime.resolver));

    if (hasCapability(capabilities, 1024
    /* Wrapped */
    )) {
      layout = template.asWrappedLayout();
    } else {
      layout = template.asLayout();
    }
  } else {
    throw unreachable();
  }

  let handle = layout.compile(vm.context);
  stack.pushJs(layout.symbolTable);

  if (DEBUG && isErrHandle(handle)) {
    stack.pushJs(handle);
  } else {
    stack.pushSmallInt(handle);
  }
}, 'jit'); // Dynamic Invocation Only

APPEND_OPCODES.add(94
/* GetAotComponentLayout */
, (vm, {
  op1: _state
}) => {
  let instance = vm.fetchValue(_state);
  let {
    manager,
    definition
  } = instance;
  let {
    stack
  } = vm;
  let {
    state: instanceState,
    capabilities
  } = instance;
  let {
    state: definitionState
  } = definition;
  let invoke;

  if (hasStaticLayoutCapability(capabilities, manager)) {
    invoke = manager.getAotStaticLayout(definitionState, vm.runtime.resolver);
  } else if (hasDynamicLayoutCapability(capabilities, manager)) {
    invoke = manager.getAotDynamicLayout(instanceState, vm.runtime.resolver);
  } else {
    throw unreachable();
  }

  stack.pushJs(invoke.symbolTable);

  if (DEBUG && isErrHandle(invoke.handle)) {
    stack.pushJs(invoke.handle);
  } else {
    stack.pushSmallInt(invoke.handle);
  }
}); // These types are absurd here

function hasStaticLayoutCapability(capabilities, _manager) {
  return managerHasCapability(_manager, capabilities, 1
  /* DynamicLayout */
  ) === false;
}

function hasDynamicLayoutCapability(capabilities, _manager) {
  return managerHasCapability(_manager, capabilities, 1
  /* DynamicLayout */
  ) === true;
}

APPEND_OPCODES.add(76
/* Main */
, (vm, {
  op1: register
}) => {
  let definition = vm.stack.popJs();
  let invocation = vm.stack.popJs();
  let {
    manager
  } = definition;
  let capabilities = capabilityFlagsFrom(manager.getCapabilities(definition.state));
  let state = {
    [COMPONENT_INSTANCE]: true,
    definition,
    manager,
    capabilities,
    state: null,
    handle: invocation.handle,
    table: invocation.symbolTable,
    lookup: null
  };
  vm.loadValue(register, state);
});
APPEND_OPCODES.add(98
/* PopulateLayout */
, (vm, {
  op1: _state
}) => {
  let {
    stack
  } = vm; // In DEBUG handles could be ErrHandle objects

  let handle = DEBUG ? stack.pop() : stack.popSmallInt();
  let table = stack.popJs();
  let state = vm.fetchValue(_state);
  state.handle = handle;
  state.table = table;
});
APPEND_OPCODES.add(38
/* VirtualRootScope */
, (vm, {
  op1: _state
}) => {
  let {
    symbols
  } = vm.fetchValue(_state).table;
  vm.pushRootScope(symbols.length + 1);
});
APPEND_OPCODES.add(97
/* SetupForEval */
, (vm, {
  op1: _state
}) => {
  let state = vm.fetchValue(_state);

  if (state.table.hasEval) {
    let lookup = state.lookup = dict();
    vm.scope().bindEvalScope(lookup);
  }
});
APPEND_OPCODES.add(17
/* SetNamedVariables */
, (vm, {
  op1: _state
}) => {
  let state = vm.fetchValue(_state);
  let scope = vm.scope();
  let args = vm.stack.peekJs();
  let callerNames = args.named.atNames;

  for (let i = callerNames.length - 1; i >= 0; i--) {
    let atName = callerNames[i];
    let symbol$$1 = state.table.symbols.indexOf(callerNames[i]);
    let value = args.named.get(atName, true);
    if (symbol$$1 !== -1) scope.bindSymbol(symbol$$1 + 1, value);
    if (state.lookup) state.lookup[atName] = value;
  }
});

function bindBlock(symbolName, blockName, state, blocks, vm) {
  let symbol$$1 = state.table.symbols.indexOf(symbolName);
  let block = blocks.get(blockName);
  if (symbol$$1 !== -1) vm.scope().bindBlock(symbol$$1 + 1, block);
  if (state.lookup) state.lookup[symbolName] = block;
}

APPEND_OPCODES.add(18
/* SetBlocks */
, (vm, {
  op1: _state
}) => {
  let state = vm.fetchValue(_state);
  let {
    blocks
  } = vm.stack.peekJs();

  for (let i = 0; i < blocks.names.length; i++) {
    bindBlock(blocks.symbolNames[i], blocks.names[i], state, blocks, vm);
  }
}); // Dynamic Invocation Only

APPEND_OPCODES.add(99
/* InvokeComponentLayout */
, (vm, {
  op1: _state
}) => {
  let state = vm.fetchValue(_state);
  vm.call(state.handle);
});
APPEND_OPCODES.add(103
/* DidRenderLayout */
, (vm, {
  op1: _state
}) => {
  let {
    manager,
    state,
    capabilities
  } = vm.fetchValue(_state);
  let bounds = vm.elements().popBlock();

  if (!managerHasCapability(manager, capabilities, 512
  /* CreateInstance */
  )) {
    throw new Error(`BUG`);
  }

  let mgr = manager;
  mgr.didRenderLayout(state, bounds);
  vm.env.didCreate(state, manager);
  vm.updateWith(new DidUpdateLayoutOpcode(manager, state, bounds));
});
APPEND_OPCODES.add(101
/* CommitComponentTransaction */
, vm => {
  vm.commitCacheGroup();
});

class UpdateComponentOpcode extends UpdatingOpcode {
  constructor(tag, component, manager, dynamicScope) {
    super();
    this.tag = tag;
    this.component = component;
    this.manager = manager;
    this.dynamicScope = dynamicScope;
    this.type = 'update-component';
  }

  evaluate(_vm) {
    let {
      component,
      manager,
      dynamicScope
    } = this;
    manager.update(component, dynamicScope);
  }

}

class DidUpdateLayoutOpcode extends UpdatingOpcode {
  constructor(manager, component, bounds) {
    super();
    this.manager = manager;
    this.component = component;
    this.bounds = bounds;
    this.type = 'did-update-layout';
    this.tag = CONSTANT_TAG;
  }

  evaluate(vm) {
    let {
      manager,
      component,
      bounds
    } = this;
    manager.didUpdateLayout(component, bounds);
    vm.env.didUpdate(component, manager);
  }

}

function debugCallback(context, get) {
  console.info('Use `context`, and `get(<path>)` to debug this template.'); // for example...
  // eslint-disable-next-line no-unused-expressions

  context === get('this'); // eslint-disable-next-line no-debugger

  debugger;
}

let callback = debugCallback; // For testing purposes

function setDebuggerCallback(cb) {
  callback = cb;
}

function resetDebuggerCallback() {
  callback = debugCallback;
}

class ScopeInspector {
  constructor(scope, symbols, evalInfo) {
    this.scope = scope;
    this.locals = dict();

    for (let i = 0; i < evalInfo.length; i++) {
      let slot = evalInfo[i];
      let name = symbols[slot - 1];
      let ref = scope.getSymbol(slot);
      this.locals[name] = ref;
    }
  }

  get(path) {
    let {
      scope,
      locals
    } = this;
    let parts = path.split('.');
    let [head, ...tail] = path.split('.');
    let evalScope = scope.getEvalScope();
    let ref;

    if (head === 'this') {
      ref = scope.getSelf();
    } else if (locals[head]) {
      ref = locals[head];
    } else if (head.indexOf('@') === 0 && evalScope[head]) {
      ref = evalScope[head];
    } else {
      ref = this.scope.getSelf();
      tail = parts;
    }

    return tail.reduce((r, part) => r.get(part), ref);
  }

}

APPEND_OPCODES.add(106
/* Debugger */
, (vm, {
  op1: _symbols,
  op2: _evalInfo
}) => {
  let symbols = vm[CONSTANTS].getArray(_symbols);
  let evalInfo = vm[CONSTANTS].getValue(decodeHandle(_evalInfo));
  let inspector = new ScopeInspector(vm.scope(), symbols, evalInfo);
  callback(vm.getSelf().value(), path => inspector.get(path).value());
});
APPEND_OPCODES.add(104
/* InvokePartial */
, (vm, {
  op1: _meta,
  op2: _symbols,
  op3: _evalInfo
}) => {
  let {
    [CONSTANTS]: constants$$1,
    stack
  } = vm;
  let name = stack.popJs().value();
  let meta = constants$$1.getValue(decodeHandle(_meta));
  let outerSymbols = constants$$1.getArray(_symbols);
  let evalInfo = constants$$1.getValue(decodeHandle(_evalInfo));
  let handle = vm.runtime.resolver.lookupPartial(name, meta);
  let definition = vm.runtime.resolver.resolve(handle);
  let {
    symbolTable,
    handle: vmHandle
  } = definition.getPartial(vm.context);
  {
    let partialSymbols = symbolTable.symbols;
    let outerScope = vm.scope();
    let partialScope = vm.pushRootScope(partialSymbols.length);
    let evalScope = outerScope.getEvalScope();
    partialScope.bindEvalScope(evalScope);
    partialScope.bindSelf(outerScope.getSelf());
    let locals = Object.create(outerScope.getPartialMap());

    for (let i = 0; i < evalInfo.length; i++) {
      let slot = evalInfo[i];
      let name = outerSymbols[slot - 1];
      let ref = outerScope.getSymbol(slot);
      locals[name] = ref;
    }

    if (evalScope) {
      for (let i = 0; i < partialSymbols.length; i++) {
        let name = partialSymbols[i];
        let symbol$$1 = i + 1;
        let value = evalScope[name];
        if (value !== undefined) partialScope.bind(symbol$$1, value);
      }
    }

    partialScope.bindPartialMap(locals);
    vm.pushFrame(); // sp += 2

    vm.call(unwrapHandle(vmHandle));
  }
}, 'jit');
APPEND_OPCODES.add(74
/* PutIterator */
, vm => {
  let stack = vm.stack;
  let listRef = stack.popJs();
  let keyRef = stack.popJs();
  let keyValue = keyRef.value();
  let key = keyValue === null ? '@identity' : String(keyValue);
  let iterableRef = new IterableReference(listRef, key, vm.env); // Push the first time to push the iterator onto the stack for iteration

  stack.pushJs(iterableRef); // Push the second time to push it as a reference for presence in general
  // (e.g whether or not it is empty). This reference will be used to skip
  // iteration entirely.

  stack.pushJs(iterableRef);
});
APPEND_OPCODES.add(72
/* EnterList */
, (vm, {
  op1: relativeStart
}) => {
  vm.enterList(relativeStart);
});
APPEND_OPCODES.add(73
/* ExitList */
, vm => {
  vm.exitList();
});
APPEND_OPCODES.add(75
/* Iterate */
, (vm, {
  op1: breaks
}) => {
  let stack = vm.stack;
  let iterable = stack.peekJs();
  let item = iterable.next();

  if (item) {
    let opcode = vm.enterItem(iterable, item);
    vm.registerItem(opcode);
  } else {
    vm.goto(breaks);
  }
});
/** @internal */

const DEFAULT_CAPABILITIES = {
  dynamicLayout: true,
  dynamicTag: true,
  prepareArgs: true,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  dynamicScope: true,
  createCaller: false,
  updateHook: true,
  createInstance: true,
  wrapped: false,
  willDestroy: false
};
const MINIMAL_CAPABILITIES = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: false,
  attributeHook: false,
  elementHook: false,
  dynamicScope: false,
  createCaller: false,
  updateHook: false,
  createInstance: false,
  wrapped: false,
  willDestroy: false
};

class SimpleComponentManager {
  getCapabilities(_state) {
    return MINIMAL_CAPABILITIES;
  }

  prepareArgs(_state, _args) {
    throw new Error(`Unimplemented prepareArgs in SimpleComponentManager`);
  }

  create(_env, _state, _args, _dynamicScope, _caller, _hasDefaultBlock) {
    throw new Error(`Unimplemented create in SimpleComponentManager`);
  }

  getSelf(_state) {
    return UNDEFINED_REFERENCE;
  }

  getTag(_state) {
    throw new Error(`Unimplemented getTag in SimpleComponentManager`);
  }

  didRenderLayout(_state, _bounds) {
    throw new Error(`Unimplemented didRenderLayout in SimpleComponentManager`);
  }

  didCreate(_state) {
    throw new Error(`Unimplemented didCreate in SimpleComponentManager`);
  }

  update(_state, _dynamicScope) {
    throw new Error(`Unimplemented update in SimpleComponentManager`);
  }

  didUpdateLayout(_state, _bounds) {
    throw new Error(`Unimplemented didUpdateLayout in SimpleComponentManager`);
  }

  didUpdate(_state) {
    throw new Error(`Unimplemented didUpdate in SimpleComponentManager`);
  }

  getDestroyable(_state) {
    return null;
  }

}

const TEMPLATE_ONLY_COMPONENT = {
  state: null,
  manager: new SimpleComponentManager()
};

class DefaultDynamicScope {
  constructor(bucket) {
    if (bucket) {
      this.bucket = assign({}, bucket);
    } else {
      this.bucket = {};
    }
  }

  get(key) {
    return this.bucket[key];
  }

  set(key, reference) {
    return this.bucket[key] = reference;
  }

  child() {
    return new DefaultDynamicScope(this.bucket);
  }

}

class DynamicVarReference {
  constructor(scope, nameRef) {
    this.scope = scope;
    this.nameRef = nameRef;
    let varTag = this.varTag = createUpdatableTag();
    this.tag = combine([nameRef.tag, varTag]);
  }

  value() {
    return this.getVar().value();
  }

  get(key) {
    return this.getVar().get(key);
  }

  getVar() {
    let name = String(this.nameRef.value());
    let ref = this.scope.get(name);
    updateTag(this.varTag, ref.tag);
    return ref;
  }

}

function getDynamicVar(args, vm) {
  let scope = vm.dynamicScope();
  let nameRef = args.positional.at(0);
  return new DynamicVarReference(scope, nameRef);
}
/*
  The calling convention is:

  * 0-N block arguments at the bottom
  * 0-N positional arguments next (left-to-right)
  * 0-N named arguments next
*/


class VMArgumentsImpl {
  constructor() {
    this.stack = null;
    this.positional = new PositionalArgumentsImpl();
    this.named = new NamedArgumentsImpl();
    this.blocks = new BlockArgumentsImpl();
  }

  empty(stack) {
    let base = stack[REGISTERS][$sp] + 1;
    this.named.empty(stack, base);
    this.positional.empty(stack, base);
    this.blocks.empty(stack, base);
    return this;
  }

  setup(stack, names, blockNames, positionalCount, atNames) {
    this.stack = stack;
    /*
           | ... | blocks      | positional  | named |
           | ... | b0    b1    | p0 p1 p2 p3 | n0 n1 |
     index | ... | 4/5/6 7/8/9 | 10 11 12 13 | 14 15 |
                   ^             ^             ^  ^
                 bbase         pbase       nbase  sp
    */

    let named = this.named;
    let namedCount = names.length;
    let namedBase = stack[REGISTERS][$sp] - namedCount + 1;
    named.setup(stack, namedBase, namedCount, names, atNames);
    let positional = this.positional;
    let positionalBase = namedBase - positionalCount;
    positional.setup(stack, positionalBase, positionalCount);
    let blocks = this.blocks;
    let blocksCount = blockNames.length;
    let blocksBase = positionalBase - blocksCount * 3;
    blocks.setup(stack, blocksBase, blocksCount, blockNames);
  }

  get tag() {
    return combineTagged([this.positional, this.named]);
  }

  get base() {
    return this.blocks.base;
  }

  get length() {
    return this.positional.length + this.named.length + this.blocks.length * 3;
  }

  at(pos) {
    return this.positional.at(pos);
  }

  realloc(offset) {
    let {
      stack
    } = this;

    if (offset > 0 && stack !== null) {
      let {
        positional,
        named
      } = this;
      let newBase = positional.base + offset;
      let length = positional.length + named.length;

      for (let i = length - 1; i >= 0; i--) {
        stack.copy(i + positional.base, i + newBase);
      }

      positional.base += offset;
      named.base += offset;
      stack[REGISTERS][$sp] += offset;
    }
  }

  capture() {
    let positional = this.positional.length === 0 ? EMPTY_POSITIONAL : this.positional.capture();
    let named = this.named.length === 0 ? EMPTY_NAMED : this.named.capture();
    return new CapturedArgumentsImpl(this.tag, positional, named, this.length);
  }

  clear() {
    let {
      stack,
      length
    } = this;
    if (length > 0 && stack !== null) stack.pop(length);
  }

}

class PositionalArgumentsImpl {
  constructor() {
    this.base = 0;
    this.length = 0;
    this.stack = null;
    this._tag = null;
    this._references = null;
  }

  empty(stack, base) {
    this.stack = stack;
    this.base = base;
    this.length = 0;
    this._tag = CONSTANT_TAG;
    this._references = EMPTY_ARRAY;
  }

  setup(stack, base, length) {
    this.stack = stack;
    this.base = base;
    this.length = length;

    if (length === 0) {
      this._tag = CONSTANT_TAG;
      this._references = EMPTY_ARRAY;
    } else {
      this._tag = null;
      this._references = null;
    }
  }

  get tag() {
    let tag = this._tag;

    if (!tag) {
      tag = this._tag = combineTagged(this.references);
    }

    return tag;
  }

  at(position) {
    let {
      base,
      length,
      stack
    } = this;

    if (position < 0 || position >= length) {
      return UNDEFINED_REFERENCE;
    }

    return stack.get(position, base);
  }

  capture() {
    return new CapturedPositionalArgumentsImpl(this.tag, this.references);
  }

  prepend(other) {
    let additions = other.length;

    if (additions > 0) {
      let {
        base,
        length,
        stack
      } = this;
      this.base = base = base - additions;
      this.length = length + additions;

      for (let i = 0; i < additions; i++) {
        stack.set(other.at(i), i, base);
      }

      this._tag = null;
      this._references = null;
    }
  }

  get references() {
    let references = this._references;

    if (!references) {
      let {
        stack,
        base,
        length
      } = this;
      references = this._references = stack.slice(base, base + length);
    }

    return references;
  }

}

class CapturedPositionalArgumentsImpl {
  constructor(tag, references, length = references.length) {
    this.tag = tag;
    this.references = references;
    this.length = length;
  }

  static empty() {
    return new CapturedPositionalArgumentsImpl(CONSTANT_TAG, EMPTY_ARRAY, 0);
  }

  at(position) {
    return this.references[position];
  }

  value() {
    return this.references.map(this.valueOf);
  }

  get(name) {
    let {
      references,
      length
    } = this;

    if (name === 'length') {
      return PrimitiveReference.create(length);
    } else {
      let idx = parseInt(name, 10);

      if (idx < 0 || idx >= length) {
        return UNDEFINED_REFERENCE;
      } else {
        return references[idx];
      }
    }
  }

  valueOf(reference) {
    return reference.value();
  }

}

class NamedArgumentsImpl {
  constructor() {
    this.base = 0;
    this.length = 0;
    this._references = null;
    this._names = EMPTY_ARRAY;
    this._atNames = EMPTY_ARRAY;
  }

  empty(stack, base) {
    this.stack = stack;
    this.base = base;
    this.length = 0;
    this._references = EMPTY_ARRAY;
    this._names = EMPTY_ARRAY;
    this._atNames = EMPTY_ARRAY;
  }

  setup(stack, base, length, names, atNames) {
    this.stack = stack;
    this.base = base;
    this.length = length;

    if (length === 0) {
      this._references = EMPTY_ARRAY;
      this._names = EMPTY_ARRAY;
      this._atNames = EMPTY_ARRAY;
    } else {
      this._references = null;

      if (atNames) {
        this._names = null;
        this._atNames = names;
      } else {
        this._names = names;
        this._atNames = null;
      }
    }
  }

  get tag() {
    return combineTagged(this.references);
  }

  get names() {
    let names = this._names;

    if (!names) {
      names = this._names = this._atNames.map(this.toSyntheticName);
    }

    return names;
  }

  get atNames() {
    let atNames = this._atNames;

    if (!atNames) {
      atNames = this._atNames = this._names.map(this.toAtName);
    }

    return atNames;
  }

  has(name) {
    return this.names.indexOf(name) !== -1;
  }

  get(name, atNames = false) {
    let {
      base,
      stack
    } = this;
    let names = atNames ? this.atNames : this.names;
    let idx = names.indexOf(name);

    if (idx === -1) {
      return UNDEFINED_REFERENCE;
    }

    return stack.get(idx, base);
  }

  capture() {
    return new CapturedNamedArgumentsImpl(this.tag, this.names, this.references);
  }

  merge(other) {
    let {
      length: extras
    } = other;

    if (extras > 0) {
      let {
        names,
        length,
        stack
      } = this;
      let {
        names: extraNames
      } = other;
      let newNames = names.slice();

      for (let i = 0; i < extras; i++) {
        let name = extraNames[i];
        let idx = newNames.indexOf(name);

        if (idx === -1) {
          length = newNames.push(name);
          stack.pushJs(other.references[i]);
        }
      }

      this.length = length;
      this._references = null;
      this._names = newNames;
      this._atNames = null;
    }
  }

  get references() {
    let references = this._references;

    if (!references) {
      let {
        base,
        length,
        stack
      } = this;
      references = this._references = stack.slice(base, base + length);
    }

    return references;
  }

  toSyntheticName(name) {
    return name.slice(1);
  }

  toAtName(name) {
    return `@${name}`;
  }

}

class CapturedNamedArgumentsImpl {
  constructor(tag, names, references) {
    this.tag = tag;
    this.names = names;
    this.references = references;
    this.length = names.length;
    this._map = null;
  }

  get map() {
    let map = this._map;

    if (!map) {
      let {
        names,
        references
      } = this;
      map = this._map = dict();

      for (let i = 0; i < names.length; i++) {
        let name = names[i];
        map[name] = references[i];
      }
    }

    return map;
  }

  has(name) {
    return this.names.indexOf(name) !== -1;
  }

  get(name) {
    let {
      names,
      references
    } = this;
    let idx = names.indexOf(name);

    if (idx === -1) {
      return UNDEFINED_REFERENCE;
    } else {
      return references[idx];
    }
  }

  value() {
    let {
      names,
      references
    } = this;
    let out = dict();

    for (let i = 0; i < names.length; i++) {
      let name = names[i];
      out[name] = references[i].value();
    }

    return out;
  }

}

function toSymbolName(name) {
  return `&${name}`;
}

class BlockArgumentsImpl {
  constructor() {
    this.internalValues = null;
    this._symbolNames = null;
    this.internalTag = null;
    this.names = EMPTY_ARRAY;
    this.length = 0;
    this.base = 0;
  }

  empty(stack, base) {
    this.stack = stack;
    this.names = EMPTY_ARRAY;
    this.base = base;
    this.length = 0;
    this._symbolNames = null;
    this.internalTag = CONSTANT_TAG;
    this.internalValues = EMPTY_ARRAY;
  }

  setup(stack, base, length, names) {
    this.stack = stack;
    this.names = names;
    this.base = base;
    this.length = length;
    this._symbolNames = null;

    if (length === 0) {
      this.internalTag = CONSTANT_TAG;
      this.internalValues = EMPTY_ARRAY;
    } else {
      this.internalTag = null;
      this.internalValues = null;
    }
  }

  get values() {
    let values = this.internalValues;

    if (!values) {
      let {
        base,
        length,
        stack
      } = this;
      values = this.internalValues = stack.slice(base, base + length * 3);
    }

    return values;
  }

  has(name) {
    return this.names.indexOf(name) !== -1;
  }

  get(name) {
    let idx = this.names.indexOf(name);

    if (idx === -1) {
      return null;
    }

    let {
      base,
      stack
    } = this;
    let table = stack.get(idx * 3, base);
    let scope = stack.get(idx * 3 + 1, base);
    let handle = stack.get(idx * 3 + 2, base);
    return handle === null ? null : [handle, scope, table];
  }

  capture() {
    return new CapturedBlockArgumentsImpl(this.names, this.values);
  }

  get symbolNames() {
    let symbolNames = this._symbolNames;

    if (symbolNames === null) {
      symbolNames = this._symbolNames = this.names.map(toSymbolName);
    }

    return symbolNames;
  }

}

class CapturedBlockArgumentsImpl {
  constructor(names, values) {
    this.names = names;
    this.values = values;
    this.length = names.length;
  }

  has(name) {
    return this.names.indexOf(name) !== -1;
  }

  get(name) {
    let idx = this.names.indexOf(name);
    if (idx === -1) return null;
    return [this.values[idx * 3 + 2], this.values[idx * 3 + 1], this.values[idx * 3]];
  }

}

class CapturedArgumentsImpl {
  constructor(tag, positional, named, length) {
    this.tag = tag;
    this.positional = positional;
    this.named = named;
    this.length = length;
  }

  value() {
    return {
      named: this.named.value(),
      positional: this.positional.value()
    };
  }

}

const EMPTY_NAMED = new CapturedNamedArgumentsImpl(CONSTANT_TAG, EMPTY_ARRAY, EMPTY_ARRAY);
const EMPTY_POSITIONAL = new CapturedPositionalArgumentsImpl(CONSTANT_TAG, EMPTY_ARRAY);
const EMPTY_ARGS = new CapturedArgumentsImpl(CONSTANT_TAG, EMPTY_POSITIONAL, EMPTY_NAMED, 0);

function initializeRegistersWithSP(sp) {
  return [0, -1, sp, 0];
}

class LowLevelVM {
  constructor(stack, heap, program, externs, registers) {
    this.stack = stack;
    this.heap = heap;
    this.program = program;
    this.externs = externs;
    this.registers = registers;
    this.currentOpSize = 0;
  }

  fetchRegister(register) {
    return this.registers[register];
  }

  loadRegister(register, value) {
    this.registers[register] = value;
  }

  setPc(pc) {
    this.registers[$pc] = pc;
  } // Start a new frame and save $ra and $fp on the stack


  pushFrame() {
    this.stack.pushSmallInt(this.registers[$ra]);
    this.stack.pushSmallInt(this.registers[$fp]);
    this.registers[$fp] = this.registers[$sp] - 1;
  } // Restore $ra, $sp and $fp


  popFrame() {
    this.registers[$sp] = this.registers[$fp] - 1;
    this.registers[$ra] = this.stack.get(0);
    this.registers[$fp] = this.stack.get(1);
  }

  pushSmallFrame() {
    this.stack.pushSmallInt(this.registers[$ra]);
  }

  popSmallFrame() {
    this.registers[$ra] = this.stack.popSmallInt();
  } // Jump to an address in `program`


  goto(offset) {
    this.setPc(this.target(offset));
  }

  target(offset) {
    return this.registers[$pc] + offset - this.currentOpSize;
  } // Save $pc into $ra, then jump to a new address in `program` (jal in MIPS)


  call(handle) {
    this.registers[$ra] = this.registers[$pc];
    this.setPc(this.heap.getaddr(handle));
  } // Put a specific `program` address in $ra


  returnTo(offset) {
    this.registers[$ra] = this.target(offset);
  } // Return to the `program` address stored in $ra


  return() {
    this.setPc(this.registers[$ra]);
  }

  nextStatement() {
    let {
      registers,
      program
    } = this;
    let pc = registers[$pc];

    if (pc === -1) {
      return null;
    } // We have to save off the current operations size so that
    // when we do a jump we can calculate the correct offset
    // to where we are going. We can't simply ask for the size
    // in a jump because we have have already incremented the
    // program counter to the next instruction prior to executing.


    let opcode = program.opcode(pc);
    let operationSize = this.currentOpSize = opcode.size;
    this.registers[$pc] += operationSize;
    return opcode;
  }

  evaluateOuter(opcode, vm) {
    {
      this.evaluateInner(opcode, vm);
    }
  }

  evaluateInner(opcode, vm) {
    if (opcode.isMachine) {
      this.evaluateMachine(opcode);
    } else {
      this.evaluateSyscall(opcode, vm);
    }
  }

  evaluateMachine(opcode) {
    switch (opcode.type) {
      case 0
      /* PushFrame */
      :
        return this.pushFrame();

      case 1
      /* PopFrame */
      :
        return this.popFrame();

      case 3
      /* InvokeStatic */
      :
        return this.call(opcode.op1);

      case 2
      /* InvokeVirtual */
      :
        return this.call(this.stack.popSmallInt());

      case 4
      /* Jump */
      :
        return this.goto(opcode.op1);

      case 5
      /* Return */
      :
        return this.return();

      case 6
      /* ReturnTo */
      :
        return this.returnTo(opcode.op1);
    }
  }

  evaluateSyscall(opcode, vm) {
    APPEND_OPCODES.evaluate(vm, opcode, opcode.type);
  }

}

class UpdatingVM {
  constructor(env, {
    alwaysRevalidate = false
  }) {
    this.frameStack = new Stack();
    this.env = env;
    this.dom = env.getDOM();
    this.alwaysRevalidate = alwaysRevalidate;
  }

  execute(opcodes, handler) {
    let {
      frameStack
    } = this;
    this.try(opcodes, handler);

    while (true) {
      if (frameStack.isEmpty()) break;
      let opcode = this.frame.nextStatement();

      if (opcode === undefined) {
        frameStack.pop();
        continue;
      }

      opcode.evaluate(this);
    }
  }

  get frame() {
    return this.frameStack.current;
  }

  goto(index) {
    this.frame.goto(index);
  }

  try(ops, handler) {
    this.frameStack.push(new UpdatingVMFrame(ops, handler));
  }

  throw() {
    this.frame.handleException();
    this.frameStack.pop();
  }

}

class ResumableVMStateImpl {
  constructor(state, resumeCallback) {
    this.state = state;
    this.resumeCallback = resumeCallback;
  }

  resume(runtime, builder) {
    return this.resumeCallback(runtime, this.state, builder);
  }

}

class BlockOpcode extends UpdatingOpcode {
  constructor(state, runtime, bounds, children) {
    super();
    this.state = state;
    this.runtime = runtime;
    this.type = 'block';
    this.children = children;
    this.bounds = bounds;
  }

  parentElement() {
    return this.bounds.parentElement();
  }

  firstNode() {
    return this.bounds.firstNode();
  }

  lastNode() {
    return this.bounds.lastNode();
  }

  evaluate(vm) {
    vm.try(this.children, null);
  }

}

class TryOpcode extends BlockOpcode {
  constructor(state, runtime, bounds, children) {
    super(state, runtime, bounds, children);
    this.type = 'try';
    this.tag = this._tag = createUpdatableTag();
  }

  didInitializeChildren() {
    updateTag(this._tag, combineTagged(this.children));
  }

  evaluate(vm) {
    vm.try(this.children, this);
  }

  handleException() {
    let {
      state,
      bounds,
      runtime
    } = this;
    destroyChildren(this);
    let elementStack = NewElementBuilder.resume(runtime.env, bounds);
    let vm = state.resume(runtime, elementStack);
    let updating = [];
    let children = this.children = [];
    let result = vm.execute(vm => {
      vm.pushUpdating(updating);
      vm.updateWith(this);
      vm.pushUpdating(children);
    });
    associateDestroyableChild(this, result.drop);
  }

}

class ListItemOpcode extends TryOpcode {
  constructor(state, runtime, bounds, key, memo, value) {
    super(state, runtime, bounds, []);
    this.key = key;
    this.memo = memo;
    this.value = value;
    this.retained = false;
    this.index = -1;
  }

  updateReferences(item) {
    this.retained = true;
    this.value.update(item.value);
    this.memo.update(item.memo);
  }

  shouldRemove() {
    return !this.retained;
  }

  reset() {
    this.retained = false;
  }

}

class ListBlockOpcode extends BlockOpcode {
  constructor(state, runtime, bounds, children, iterableRef) {
    super(state, runtime, bounds, children);
    this.iterableRef = iterableRef;
    this.type = 'list-block';
    this.lastIterated = INITIAL;
    this.opcodeMap = new Map();
    this.marker = null;

    let _tag = this._tag = createUpdatableTag();

    this.tag = combine([iterableRef.tag, _tag]);
  }

  initializeChild(opcode) {
    opcode.index = this.children.length - 1;
    this.opcodeMap.set(opcode.key, opcode);
  }

  didInitializeChildren() {
    this.lastIterated = valueForTag(this.tag);
    updateTag(this._tag, combineTagged(this.children));
  }

  evaluate(vm) {
    let {
      iterableRef,
      lastIterated
    } = this;

    if (!validateTag(iterableRef.tag, lastIterated)) {
      let {
        bounds
      } = this;
      let {
        dom
      } = vm;
      let marker = this.marker = dom.createComment('');
      dom.insertAfter(bounds.parentElement(), marker, bounds.lastNode());
      let didChange = this.sync();
      this.parentElement().removeChild(marker);
      this.marker = null;

      if (didChange) {
        updateTag(this._tag, combineTagged(this.children));
      }

      this.lastIterated = valueForTag(this.iterableRef.tag);
    } // Run now-updated updating opcodes


    super.evaluate(vm);
  }

  sync() {
    let {
      iterableRef,
      opcodeMap: itemMap,
      children
    } = this;
    let currentOpcodeIndex = 0;
    let seenIndex = 0;
    let didChange = false;
    this.children = this.bounds.boundList = [];

    while (true) {
      let item = iterableRef.next();
      if (item === null) break;
      let opcode = children[currentOpcodeIndex];
      let {
        key
      } = item; // Items that have already been found and moved will already be retained,
      // we can continue until we find the next unretained item

      while (opcode !== undefined && opcode.retained === true) {
        opcode = children[++currentOpcodeIndex];
      }

      if (opcode !== undefined && opcode.key === key) {
        this.retainItem(opcode, item);
        currentOpcodeIndex++;
      } else if (itemMap.has(key)) {
        let itemOpcode = itemMap.get(key); // The item opcode was seen already, so we should move it.

        if (itemOpcode.index < seenIndex) {
          this.moveItem(itemOpcode, item, opcode);
        } else {
          // Update the seen index, we are going to be moving this item around
          // so any other items that come before it will likely need to move as
          // well.
          seenIndex = itemOpcode.index;
          let seenUnretained = false; // iterate through all of the opcodes between the current position and
          // the position of the item's opcode, and determine if they are all
          // retained.

          for (let i = currentOpcodeIndex + 1; i < seenIndex; i++) {
            if (children[i].retained === false) {
              seenUnretained = true;
              break;
            }
          } // If we have seen only retained opcodes between this and the matching
          // opcode, it means that all the opcodes in between have been moved
          // already, and we can safely retain this item's opcode.


          if (seenUnretained === false) {
            this.retainItem(itemOpcode, item);
            currentOpcodeIndex = seenIndex + 1;
          } else {
            this.moveItem(itemOpcode, item, opcode);
            currentOpcodeIndex++;
          }
        }
      } else {
        didChange = true;
        this.insertItem(item, opcode);
      }
    }

    for (let i = 0; i < children.length; i++) {
      let opcode = children[i];

      if (opcode.retained === false) {
        didChange = true;
        this.deleteItem(opcode);
      } else {
        opcode.reset();
      }
    }

    return didChange;
  }

  retainItem(opcode, item) {
    let {
      children
    } = this;
    opcode.memo.update(item.memo);
    opcode.value.update(item.value);
    opcode.retained = true;
    opcode.index = children.length;
    children.push(opcode);
  }

  insertItem(item, before) {
    let {
      opcodeMap,
      bounds,
      state,
      runtime,
      iterableRef,
      children
    } = this;
    let {
      key
    } = item;
    let nextSibling = before === undefined ? this.marker : before.firstNode();
    let elementStack = NewElementBuilder.forInitialRender(runtime.env, {
      element: bounds.parentElement(),
      nextSibling
    });
    let vm = state.resume(runtime, elementStack);
    vm.execute(vm => {
      vm.pushUpdating();
      let opcode = vm.enterItem(iterableRef, item);
      opcode.index = children.length;
      children.push(opcode);
      opcodeMap.set(key, opcode);
      associateDestroyableChild(this, opcode);
    });
  }

  moveItem(opcode, item, before) {
    let {
      children
    } = this;
    opcode.memo.update(item.memo);
    opcode.value.update(item.value);
    opcode.retained = true;
    let currentSibling, nextSibling;

    if (before === undefined) {
      move(opcode, this.marker);
    } else {
      currentSibling = opcode.lastNode().nextSibling;
      nextSibling = before.firstNode(); // Items are moved throughout the algorithm, so there are cases where the
      // the items already happen to be siblings (e.g. an item in between was
      // moved before this move happened). Check to see if they are siblings
      // first before doing the move.

      if (currentSibling !== nextSibling) {
        move(opcode, nextSibling);
      }
    }

    opcode.index = children.length;
    children.push(opcode);
  }

  deleteItem(opcode) {
    destroy(opcode);
    clear(opcode);
    this.opcodeMap.delete(opcode.key);
  }

}

class UpdatingVMFrame {
  constructor(ops, exceptionHandler) {
    this.ops = ops;
    this.exceptionHandler = exceptionHandler;
    this.current = 0;
  }

  goto(index) {
    this.current = index;
  }

  nextStatement() {
    return this.ops[this.current++];
  }

  handleException() {
    if (this.exceptionHandler) {
      this.exceptionHandler.handleException();
    }
  }

}

class RenderResultImpl {
  constructor(env, updating, bounds, drop) {
    this.env = env;
    this.updating = updating;
    this.bounds = bounds;
    this.drop = drop;
    associateDestroyableChild(this, drop);
    registerDestructor(this, () => clear(this.bounds));
  }

  rerender({
    alwaysRevalidate = false
  } = {
    alwaysRevalidate: false
  }) {
    let {
      env,
      updating
    } = this;
    let vm = new UpdatingVM(env, {
      alwaysRevalidate
    });
    vm.execute(updating, this);
  }

  parentElement() {
    return this.bounds.parentElement();
  }

  firstNode() {
    return this.bounds.firstNode();
  }

  lastNode() {
    return this.bounds.lastNode();
  }

  handleException() {
    throw 'this should never happen';
  }

}

class InnerStack {
  constructor(inner = new Stack$1(), js) {
    this.inner = inner;
    this.js = constants();

    if (js !== undefined) {
      this.js = this.js.concat(js);
    }
  }

  slice(start, end) {
    let out = [];

    if (start === -1) {
      return out;
    }

    for (let i = start; i < end; i++) {
      out.push(this.get(i));
    }

    return out;
  }

  copy(from, to) {
    this.inner.copy(from, to);
  }

  writeJs(pos, value) {
    let idx = this.js.length;
    this.js.push(value);
    this.inner.writeRaw(pos, encodeHandle(idx));
  }

  writeSmallInt(pos, value) {
    this.inner.writeRaw(pos, encodeImmediate(value));
  }

  writeTrue(pos) {
    this.inner.writeRaw(pos, 1
    /* ENCODED_TRUE_HANDLE */
    );
  }

  writeFalse(pos) {
    this.inner.writeRaw(pos, 0
    /* ENCODED_FALSE_HANDLE */
    );
  }

  writeNull(pos) {
    this.inner.writeRaw(pos, 2
    /* ENCODED_NULL_HANDLE */
    );
  }

  writeUndefined(pos) {
    this.inner.writeRaw(pos, 3
    /* ENCODED_UNDEFINED_HANDLE */
    );
  }

  writeRaw(pos, value) {
    this.inner.writeRaw(pos, value);
  }

  getJs(pos) {
    let value = this.inner.getRaw(pos);
    return this.js[decodeHandle(value)];
  }

  getSmallInt(pos) {
    let value = this.inner.getRaw(pos);
    return decodeImmediate(value);
  }

  get(pos) {
    let value = this.inner.getRaw(pos) | 0;

    if (isHandle(value)) {
      return this.js[decodeHandle(value)];
    } else {
      return decodeImmediate(value);
    }
  }

  reset() {
    this.inner.reset();
    this.js.length = 0;
  }

  get length() {
    return this.inner.len();
  }

}

class EvaluationStackImpl {
  // fp -> sp
  constructor(stack, registers) {
    this.stack = stack;
    this[REGISTERS] = registers;
  }

  static restore(snapshot) {
    let stack = new InnerStack();

    for (let i = 0; i < snapshot.length; i++) {
      let value = snapshot[i];

      if (typeof value === 'number' && isSmallInt(value)) {
        stack.writeRaw(i, encodeImmediate(value));
      } else if (value === true) {
        stack.writeTrue(i);
      } else if (value === false) {
        stack.writeFalse(i);
      } else if (value === null) {
        stack.writeNull(i);
      } else if (value === undefined) {
        stack.writeUndefined(i);
      } else {
        stack.writeJs(i, value);
      }
    }

    return new this(stack, initializeRegistersWithSP(snapshot.length - 1));
  }

  pushJs(value) {
    this.stack.writeJs(++this[REGISTERS][$sp], value);
  }

  pushSmallInt(value) {
    this.stack.writeSmallInt(++this[REGISTERS][$sp], value);
  }

  pushTrue() {
    this.stack.writeTrue(++this[REGISTERS][$sp]);
  }

  pushFalse() {
    this.stack.writeFalse(++this[REGISTERS][$sp]);
  }

  pushNull() {
    this.stack.writeNull(++this[REGISTERS][$sp]);
  }

  pushUndefined() {
    this.stack.writeUndefined(++this[REGISTERS][$sp]);
  }

  pushRaw(value) {
    this.stack.writeRaw(++this[REGISTERS][$sp], value);
  }

  dup(position = this[REGISTERS][$sp]) {
    this.stack.copy(position, ++this[REGISTERS][$sp]);
  }

  copy(from, to) {
    this.stack.copy(from, to);
  }

  popJs(n = 1) {
    let top = this.stack.getJs(this[REGISTERS][$sp]);
    this[REGISTERS][$sp] -= n;
    return top;
  }

  popSmallInt(n = 1) {
    let top = this.stack.getSmallInt(this[REGISTERS][$sp]);
    this[REGISTERS][$sp] -= n;
    return top;
  }

  pop(n = 1) {
    let top = this.stack.get(this[REGISTERS][$sp]);
    this[REGISTERS][$sp] -= n;
    return top;
  }

  peekJs(offset = 0) {
    return this.stack.getJs(this[REGISTERS][$sp] - offset);
  }

  peekSmallInt(offset = 0) {
    return this.stack.getSmallInt(this[REGISTERS][$sp] - offset);
  }

  peek(offset = 0) {
    return this.stack.get(this[REGISTERS][$sp] - offset);
  }

  get(offset, base = this[REGISTERS][$fp]) {
    return this.stack.get(base + offset);
  }

  set(value, offset, base = this[REGISTERS][$fp]) {
    this.stack.writeJs(base + offset, value);
  }

  slice(start, end) {
    return this.stack.slice(start, end);
  }

  capture(items) {
    let end = this[REGISTERS][$sp] + 1;
    let start = end - items;
    return this.stack.slice(start, end);
  }

  reset() {
    this.stack.reset();
  }

  toArray() {
    console.log(this[REGISTERS]);
    return this.stack.slice(this[REGISTERS][$fp], this[REGISTERS][$sp] + 1);
  }

}

var _a$3, _b;

class Stacks {
  constructor() {
    this.scope = new Stack();
    this.dynamicScope = new Stack();
    this.updating = new Stack();
    this.cache = new Stack();
    this.list = new Stack();
  }

}

class VM {
  /**
   * End of migrated.
   */
  constructor(runtime, {
    pc,
    scope,
    dynamicScope,
    stack
  }, elementStack) {
    this.runtime = runtime;
    this.elementStack = elementStack;
    this[_a$3] = new Stacks();
    this[_b] = new Stack();
    this.s0 = null;
    this.s1 = null;
    this.t0 = null;
    this.t1 = null;
    this.v0 = null;
    let evalStack = EvaluationStackImpl.restore(stack);
    evalStack[REGISTERS][$pc] = pc;
    evalStack[REGISTERS][$sp] = stack.length - 1;
    evalStack[REGISTERS][$fp] = -1;
    this[HEAP] = this.program.heap;
    this[CONSTANTS] = this.program.constants;
    this.elementStack = elementStack;
    this[STACKS].scope.push(scope);
    this[STACKS].dynamicScope.push(dynamicScope);
    this[ARGS] = new VMArgumentsImpl();
    this[INNER_VM] = new LowLevelVM(evalStack, this[HEAP], runtime.program, {
      debugBefore: opcode => {
        return APPEND_OPCODES.debugBefore(this, opcode);
      },
      debugAfter: state => {
        APPEND_OPCODES.debugAfter(this, state);
      }
    }, evalStack[REGISTERS]);
    this.destructor = {};
    this[DESTROYABLE_STACK].push(this.destructor);
  }

  get stack() {
    return this[INNER_VM].stack;
  }
  /* Registers */


  get pc() {
    return this[INNER_VM].fetchRegister($pc);
  } // Fetch a value from a register onto the stack


  fetch(register) {
    let value = this.fetchValue(register);
    this.stack.pushJs(value);
  } // Load a value from the stack into a register


  load(register) {
    let value = this.stack.pop();
    this.loadValue(register, value);
  }

  fetchValue(register) {
    if (isLowLevelRegister(register)) {
      return this[INNER_VM].fetchRegister(register);
    }

    switch (register) {
      case $s0:
        return this.s0;

      case $s1:
        return this.s1;

      case $t0:
        return this.t0;

      case $t1:
        return this.t1;

      case $v0:
        return this.v0;
    }
  } // Load a value into a register


  loadValue(register, value) {
    if (isLowLevelRegister(register)) {
      this[INNER_VM].loadRegister(register, value);
    }

    switch (register) {
      case $s0:
        this.s0 = value;
        break;

      case $s1:
        this.s1 = value;
        break;

      case $t0:
        this.t0 = value;
        break;

      case $t1:
        this.t1 = value;
        break;

      case $v0:
        this.v0 = value;
        break;
    }
  }
  /**
   * Migrated to Inner
   */
  // Start a new frame and save $ra and $fp on the stack


  pushFrame() {
    this[INNER_VM].pushFrame();
  } // Restore $ra, $sp and $fp


  popFrame() {
    this[INNER_VM].popFrame();
  } // Jump to an address in `program`


  goto(offset) {
    this[INNER_VM].goto(offset);
  } // Save $pc into $ra, then jump to a new address in `program` (jal in MIPS)


  call(handle) {
    this[INNER_VM].call(handle);
  } // Put a specific `program` address in $ra


  returnTo(offset) {
    this[INNER_VM].returnTo(offset);
  } // Return to the `program` address stored in $ra


  return() {
    this[INNER_VM].return();
  }

  get program() {
    return this.runtime.program;
  }

  get env() {
    return this.runtime.env;
  }

  captureState(args, pc = this[INNER_VM].fetchRegister($pc)) {
    return {
      pc,
      dynamicScope: this.dynamicScope(),
      scope: this.scope(),
      stack: this.stack.capture(args)
    };
  }

  beginCacheGroup() {
    let opcodes = this.updating();
    let guard = new JumpIfNotModifiedOpcode(opcodes.length);
    opcodes.push(guard);
    this[STACKS].cache.push(guard);
  }

  commitCacheGroup() {
    let opcodes = this.updating();
    let guard = this[STACKS].cache.pop();
    let startIndex = guard.index;
    let tag = combineFromIndex(opcodes, startIndex);
    opcodes.push(new DidModifyOpcode(guard));
    guard.finalize(tag, opcodes.length);
  }

  enter(args) {
    let updating = [];
    let state = this.capture(args);
    let block = this.elements().pushUpdatableBlock();
    let tryOpcode = new TryOpcode(state, this.runtime, block, updating);
    this.didEnter(tryOpcode);
  }

  enterItem(iterableRef, {
    key,
    value,
    memo
  }) {
    let {
      stack
    } = this;
    let valueRef = iterableRef.childRefFor(key, value);
    let memoRef = iterableRef.childRefFor(key, memo);
    stack.pushJs(valueRef);
    stack.pushJs(memoRef);
    let state = this.capture(2);
    let block = this.elements().pushUpdatableBlock();
    let opcode = new ListItemOpcode(state, this.runtime, block, key, memoRef, valueRef);
    this.didEnter(opcode);
    return opcode;
  }

  registerItem(opcode) {
    this.listBlock().initializeChild(opcode);
  }

  enterList(offset) {
    let updating = [];
    let addr = this[INNER_VM].target(offset);
    let state = this.capture(0, addr);
    let list = this.elements().pushBlockList(updating);
    let iterableRef = this.stack.peekJs();
    let opcode = new ListBlockOpcode(state, this.runtime, list, updating, iterableRef);
    this[STACKS].list.push(opcode);
    this.didEnter(opcode);
  }

  didEnter(opcode) {
    this.associateDestroyable(opcode);
    this[DESTROYABLE_STACK].push(opcode);
    this.updateWith(opcode);
    this.pushUpdating(opcode.children);
  }

  exit() {
    this[DESTROYABLE_STACK].pop();
    this.elements().popBlock();
    this.popUpdating();
    let updating = this.updating();
    let parent = updating[updating.length - 1];
    parent.didInitializeChildren();
  }

  exitList() {
    this.exit();
    this[STACKS].list.pop();
  }

  pushUpdating(list = []) {
    this[STACKS].updating.push(list);
  }

  popUpdating() {
    return this[STACKS].updating.pop();
  }

  updateWith(opcode) {
    this.updating().push(opcode);
  }

  listBlock() {
    return this[STACKS].list.current;
  }

  associateDestroyable(child) {
    let parent = this[DESTROYABLE_STACK].current;
    associateDestroyableChild(parent, child);
  }

  tryUpdating() {
    return this[STACKS].updating.current;
  }

  updating() {
    return this[STACKS].updating.current;
  }

  elements() {
    return this.elementStack;
  }

  scope() {
    return this[STACKS].scope.current;
  }

  dynamicScope() {
    return this[STACKS].dynamicScope.current;
  }

  pushChildScope() {
    this[STACKS].scope.push(this.scope().child());
  }

  pushDynamicScope() {
    let child = this.dynamicScope().child();
    this[STACKS].dynamicScope.push(child);
    return child;
  }

  pushRootScope(size) {
    let scope = ScopeImpl.sized(size);
    this[STACKS].scope.push(scope);
    return scope;
  }

  pushScope(scope) {
    this[STACKS].scope.push(scope);
  }

  popScope() {
    this[STACKS].scope.pop();
  }

  popDynamicScope() {
    this[STACKS].dynamicScope.pop();
  } /// SCOPE HELPERS


  getSelf() {
    return this.scope().getSelf();
  }

  referenceForSymbol(symbol$$1) {
    return this.scope().getSymbol(symbol$$1);
  } /// EXECUTION


  execute(initialize) {
    if (initialize) initialize(this);
    let result;

    try {
      while (true) {
        result = this.next();
        if (result.done) break;
      }
    } finally {
      // If any existing blocks are open, due to an error or something like
      // that, we need to close them all and clean things up properly.
      let elements = this.elements();

      while (elements.hasBlocks) {
        elements.popBlock();
      }
    }

    return result.value;
  }

  next() {
    let {
      env,
      elementStack
    } = this;
    let opcode = this[INNER_VM].nextStatement();
    let result;

    if (opcode !== null) {
      this[INNER_VM].evaluateOuter(opcode, this);
      result = {
        done: false,
        value: null
      };
    } else {
      // Unload the stack
      this.stack.reset();
      result = {
        done: true,
        value: new RenderResultImpl(env, this.popUpdating(), elementStack.popBlock(), this.destructor)
      };
    }

    return result;
  }

  bindDynamicScope(names) {
    let scope = this.dynamicScope();

    for (let i = names.length - 1; i >= 0; i--) {
      let name = names[i];
      scope.set(name, this.stack.popJs());
    }
  }

}

_a$3 = STACKS, _b = DESTROYABLE_STACK;

function vmState(pc, scope = ScopeImpl.root(UNDEFINED_REFERENCE, 0), dynamicScope) {
  return {
    pc,
    scope,
    dynamicScope,
    stack: []
  };
}

class AotVM extends VM {
  static empty(runtime, {
    handle,
    treeBuilder,
    dynamicScope
  }) {
    let vm = initAOT(runtime, vmState(runtime.program.heap.getaddr(handle), ScopeImpl.root(UNDEFINED_REFERENCE, 0), dynamicScope), treeBuilder);
    vm.pushUpdating();
    return vm;
  }

  static initial(runtime, {
    handle,
    self,
    treeBuilder,
    dynamicScope
  }) {
    let scopeSize = runtime.program.heap.scopesizeof(handle);
    let scope = ScopeImpl.root(self, scopeSize);
    let pc = runtime.program.heap.getaddr(handle);
    let state = vmState(pc, scope, dynamicScope);
    let vm = initAOT(runtime, state, treeBuilder);
    vm.pushUpdating();
    return vm;
  }

  capture(args, pc = this[INNER_VM].fetchRegister($pc)) {
    return new ResumableVMStateImpl(this.captureState(args, pc), initAOT);
  }

}

function initAOT(runtime, state, builder) {
  return new AotVM(runtime, state, builder);
}

function initJIT(context) {
  return (runtime, state, builder) => new JitVM(runtime, state, builder, context);
}

class JitVM extends VM {
  constructor(runtime, state, elementStack, context) {
    super(runtime, state, elementStack);
    this.context = context;
    this.resume = initJIT(this.context);
  }

  static initial(runtime, context, {
    handle,
    self,
    dynamicScope,
    treeBuilder
  }) {
    let scopeSize = runtime.program.heap.scopesizeof(handle);
    let scope = ScopeImpl.root(self, scopeSize);
    let state = vmState(runtime.program.heap.getaddr(handle), scope, dynamicScope);
    let vm = initJIT(context)(runtime, state, treeBuilder);
    vm.pushUpdating();
    return vm;
  }

  static empty(runtime, {
    handle,
    treeBuilder,
    dynamicScope
  }, context) {
    let vm = initJIT(context)(runtime, vmState(runtime.program.heap.getaddr(handle), ScopeImpl.root(UNDEFINED_REFERENCE, 0), dynamicScope), treeBuilder);
    vm.pushUpdating();
    return vm;
  }

  capture(args, pc = this[INNER_VM].fetchRegister($pc)) {
    return new ResumableVMStateImpl(this.captureState(args, pc), this.resume);
  }

  compile(block) {
    let handle = unwrapHandle(block.compile(this.context));
    return handle;
  }

}

class TemplateIteratorImpl {
  constructor(vm) {
    this.vm = vm;
  }

  next() {
    return this.vm.next();
  }

  sync() {
    return renderSync(this.vm.runtime.env, this);
  }

}

function renderSync(env, iterator) {
  try {
    env.begin();
    let iteratorResult;

    do {
      iteratorResult = iterator.next();
    } while (!iteratorResult.done);

    return iteratorResult.value;
  } finally {
    env.commit();
  }
}

function renderAotMain(runtime, self, treeBuilder, handle, dynamicScope = new DefaultDynamicScope()) {
  let vm = AotVM.initial(runtime, {
    self,
    dynamicScope,
    treeBuilder,
    handle
  });
  return new TemplateIteratorImpl(vm);
}

function renderAot(runtime, handle, cursor, self = UNDEFINED_REFERENCE) {
  let treeBuilder = NewElementBuilder.forInitialRender(runtime.env, cursor);
  let dynamicScope = new DefaultDynamicScope();
  let vm = AotVM.initial(runtime, {
    self,
    dynamicScope,
    treeBuilder,
    handle
  });
  return new TemplateIteratorImpl(vm);
}

function renderJitMain(runtime, context, self, treeBuilder, handle, dynamicScope = new DefaultDynamicScope()) {
  let vm = JitVM.initial(runtime, context, {
    self,
    dynamicScope,
    treeBuilder,
    handle
  });
  return new TemplateIteratorImpl(vm);
}

function renderInvocation(vm, invocation, definition, args) {
  // Get a list of tuples of argument names and references, like
  // [['title', reference], ['name', reference]]
  const argList = Object.keys(args).map(key => [key, args[key]]);
  const blockNames = ['main', 'else', 'attrs']; // Prefix argument names with `@` symbol

  const argNames = argList.map(([name]) => `@${name}`);
  vm.pushFrame(); // Push blocks on to the stack, three stack values per block

  for (let i = 0; i < 3 * blockNames.length; i++) {
    vm.stack.pushNull();
  }

  vm.stack.pushNull(); // For each argument, push its backing reference on to the stack

  argList.forEach(([, reference]) => {
    vm.stack.pushJs(reference);
  }); // Configure VM based on blocks and args just pushed on to the stack.

  vm[ARGS].setup(vm.stack, argNames, blockNames, 0, true); // Needed for the Op.Main opcode: arguments, component invocation object, and
  // component definition.

  vm.stack.pushJs(vm[ARGS]);
  vm.stack.pushJs(invocation);
  vm.stack.pushJs(definition);
  return new TemplateIteratorImpl(vm);
}

function renderAotComponent(runtime, treeBuilder, main, name, args = {}, dynamicScope = new DefaultDynamicScope()) {
  let vm = AotVM.empty(runtime, {
    treeBuilder,
    handle: main,
    dynamicScope
  });
  const definition = resolveComponent(vm.runtime.resolver, name);
  const {
    manager,
    state
  } = definition;
  const capabilities = capabilityFlagsFrom(manager.getCapabilities(state));
  let invocation;

  if (hasStaticLayoutCapability(capabilities, manager)) {
    invocation = manager.getAotStaticLayout(state, vm.runtime.resolver);
  } else {
    throw new Error('Cannot invoke components with dynamic layouts as a root component.');
  }

  return renderInvocation(vm, invocation, definition, args);
}

function renderJitComponent(runtime, treeBuilder, context, main, name, args = {}, dynamicScope = new DefaultDynamicScope()) {
  let vm = JitVM.empty(runtime, {
    treeBuilder,
    handle: main,
    dynamicScope
  }, context);
  const definition = resolveComponent(vm.runtime.resolver, name);
  const {
    manager,
    state
  } = definition;
  const capabilities = capabilityFlagsFrom(manager.getCapabilities(state));
  let invocation;

  if (hasStaticLayoutCapability(capabilities, manager)) {
    let layout = manager.getJitStaticLayout(state, vm.runtime.resolver);
    let handle = unwrapHandle(layout.compile(context));

    if (Array.isArray(handle)) {
      let error = handle[0];
      throw new Error(`Compile Error: ${error.problem} ${error.span.start}..${error.span.end} :: TODO (thread better)`);
    }

    invocation = {
      handle,
      symbolTable: layout.symbolTable
    };
  } else {
    throw new Error('Cannot invoke components with dynamic layouts as a root component.');
  }

  return renderInvocation(vm, invocation, definition, args);
}

const SERIALIZATION_FIRST_NODE_STRING = '%+b:0%';

function isSerializationFirstNode(node) {
  return node.nodeValue === SERIALIZATION_FIRST_NODE_STRING;
}

class RehydratingCursor extends CursorImpl {
  constructor(element, nextSibling, startingBlockDepth) {
    super(element, nextSibling);
    this.startingBlockDepth = startingBlockDepth;
    this.candidate = null;
    this.injectedOmittedNode = false;
    this.openBlockDepth = startingBlockDepth - 1;
  }

}

class RehydrateBuilder extends NewElementBuilder {
  constructor(env, parentNode, nextSibling) {
    super(env, parentNode, nextSibling);
    this.unmatchedAttributes = null;
    this.blockDepth = 0;
    if (nextSibling) throw new Error('Rehydration with nextSibling not supported');
    let node = this.currentCursor.element.firstChild;

    while (node !== null) {
      if (isComment(node) && isSerializationFirstNode(node)) {
        break;
      }

      node = node.nextSibling;
    }

    this.candidate = node;
  }

  get currentCursor() {
    return this[CURSOR_STACK].current;
  }

  get candidate() {
    if (this.currentCursor) {
      return this.currentCursor.candidate;
    }

    return null;
  }

  set candidate(node) {
    let currentCursor = this.currentCursor;
    currentCursor.candidate = node;
  }

  disableRehydration(nextSibling) {
    let currentCursor = this.currentCursor; // rehydration will be disabled until we either:
    // * hit popElement (and return to using the parent elements cursor)
    // * hit closeBlock and the next sibling is a close block comment
    //   matching the expected openBlockDepth

    currentCursor.candidate = null;
    currentCursor.nextSibling = nextSibling;
  }

  enableRehydration(candidate) {
    let currentCursor = this.currentCursor;
    currentCursor.candidate = candidate;
    currentCursor.nextSibling = null;
  }

  pushElement(element, nextSibling = null) {
    let cursor = new RehydratingCursor(element, nextSibling, this.blockDepth || 0);
    /**
     * <div>   <---------------  currentCursor.element
     *   <!--%+b:1%--> <-------  would have been removed during openBlock
     *   <div> <---------------  currentCursor.candidate -> cursor.element
     *     <!--%+b:2%--> <-----  currentCursor.candidate.firstChild -> cursor.candidate
     *     Foo
     *     <!--%-b:2%-->
     *   </div>
     *   <!--%-b:1%-->  <------  becomes currentCursor.candidate
     */

    if (this.candidate !== null) {
      cursor.candidate = element.firstChild;
      this.candidate = element.nextSibling;
    }

    this[CURSOR_STACK].push(cursor);
  } // clears until the end of the current container
  // either the current open block or higher


  clearMismatch(candidate) {
    let current = candidate;
    let currentCursor = this.currentCursor;

    if (currentCursor !== null) {
      let openBlockDepth = currentCursor.openBlockDepth;

      if (openBlockDepth >= currentCursor.startingBlockDepth) {
        while (current) {
          if (isCloseBlock(current)) {
            let closeBlockDepth = getBlockDepth(current);

            if (openBlockDepth >= closeBlockDepth) {
              break;
            }
          }

          current = this.remove(current);
        }
      } else {
        while (current !== null) {
          current = this.remove(current);
        }
      } // current cursor parentNode should be openCandidate if element
      // or openCandidate.parentNode if comment


      this.disableRehydration(current);
    }
  }

  __openBlock() {
    let {
      currentCursor
    } = this;
    if (currentCursor === null) return;
    let blockDepth = this.blockDepth;
    this.blockDepth++;
    let {
      candidate
    } = currentCursor;
    if (candidate === null) return;
    let {
      tagName
    } = currentCursor.element;

    if (isOpenBlock(candidate) && getBlockDepth(candidate) === blockDepth) {
      this.candidate = this.remove(candidate);
      currentCursor.openBlockDepth = blockDepth;
    } else if (tagName !== 'TITLE' && tagName !== 'SCRIPT' && tagName !== 'STYLE') {
      this.clearMismatch(candidate);
    }
  }

  __closeBlock() {
    let {
      currentCursor
    } = this;
    if (currentCursor === null) return; // openBlock is the last rehydrated open block

    let openBlockDepth = currentCursor.openBlockDepth; // this currently is the expected next open block depth

    this.blockDepth--;
    let {
      candidate
    } = currentCursor;
    let isRehydrating = false;

    if (candidate !== null) {
      isRehydrating = true; //assert(
      //  openBlockDepth === this.blockDepth,
      //  'when rehydrating, openBlockDepth should match this.blockDepth here'
      //);

      if (isCloseBlock(candidate) && getBlockDepth(candidate) === openBlockDepth) {
        let nextSibling = this.remove(candidate);
        this.candidate = nextSibling;
        currentCursor.openBlockDepth--;
      } else {
        // close the block and clear mismatch in parent container
        // we will be either at the end of the element
        // or at the end of our containing block
        this.clearMismatch(candidate);
        isRehydrating = false;
      }
    }

    if (isRehydrating === false) {
      // check if nextSibling matches our expected close block
      // if so, we remove the close block comment and
      // restore rehydration after clearMismatch disabled
      let nextSibling = currentCursor.nextSibling;

      if (nextSibling !== null && isCloseBlock(nextSibling) && getBlockDepth(nextSibling) === this.blockDepth) {
        // restore rehydration state
        let candidate = this.remove(nextSibling);
        this.enableRehydration(candidate);
        currentCursor.openBlockDepth--;
      }
    }
  }

  __appendNode(node) {
    let {
      candidate
    } = this; // This code path is only used when inserting precisely one node. It needs more
    // comparison logic, but we can probably lean on the cases where this code path
    // is actually used.

    if (candidate) {
      return candidate;
    } else {
      return super.__appendNode(node);
    }
  }

  __appendHTML(html) {
    let candidateBounds = this.markerBounds();

    if (candidateBounds) {
      let first = candidateBounds.firstNode();
      let last = candidateBounds.lastNode();
      let newBounds = new ConcreteBounds(this.element, first.nextSibling, last.previousSibling);
      let possibleEmptyMarker = this.remove(first);
      this.remove(last);

      if (possibleEmptyMarker !== null && isEmpty$1(possibleEmptyMarker)) {
        this.candidate = this.remove(possibleEmptyMarker);

        if (this.candidate !== null) {
          this.clearMismatch(this.candidate);
        }
      }

      return newBounds;
    } else {
      return super.__appendHTML(html);
    }
  }

  remove(node) {
    let element = node.parentNode;
    let next = node.nextSibling;
    element.removeChild(node);
    return next;
  }

  markerBounds() {
    let _candidate = this.candidate;

    if (_candidate && isMarker(_candidate)) {
      let first = _candidate;
      let last = first.nextSibling;

      while (last && !isMarker(last)) {
        last = last.nextSibling;
      }

      return new ConcreteBounds(this.element, first, last);
    } else {
      return null;
    }
  }

  __appendText(string) {
    let {
      candidate
    } = this;

    if (candidate) {
      if (isTextNode(candidate)) {
        if (candidate.nodeValue !== string) {
          candidate.nodeValue = string;
        }

        this.candidate = candidate.nextSibling;
        return candidate;
      } else if (isSeparator(candidate)) {
        this.candidate = this.remove(candidate);
        return this.__appendText(string);
      } else if (isEmpty$1(candidate) && string === '') {
        this.candidate = this.remove(candidate);
        return this.__appendText(string);
      } else {
        this.clearMismatch(candidate);
        return super.__appendText(string);
      }
    } else {
      return super.__appendText(string);
    }
  }

  __appendComment(string) {
    let _candidate = this.candidate;

    if (_candidate && isComment(_candidate)) {
      if (_candidate.nodeValue !== string) {
        _candidate.nodeValue = string;
      }

      this.candidate = _candidate.nextSibling;
      return _candidate;
    } else if (_candidate) {
      this.clearMismatch(_candidate);
    }

    return super.__appendComment(string);
  }

  __openElement(tag) {
    let _candidate = this.candidate;

    if (_candidate && isElement(_candidate) && isSameNodeType(_candidate, tag)) {
      this.unmatchedAttributes = [].slice.call(_candidate.attributes);
      return _candidate;
    } else if (_candidate) {
      if (isElement(_candidate) && _candidate.tagName === 'TBODY') {
        this.pushElement(_candidate, null);
        this.currentCursor.injectedOmittedNode = true;
        return this.__openElement(tag);
      }

      this.clearMismatch(_candidate);
    }

    return super.__openElement(tag);
  }

  __setAttribute(name, value, namespace) {
    let unmatched = this.unmatchedAttributes;

    if (unmatched) {
      let attr = findByName(unmatched, name);

      if (attr) {
        if (attr.value !== value) {
          attr.value = value;
        }

        unmatched.splice(unmatched.indexOf(attr), 1);
        return;
      }
    }

    return super.__setAttribute(name, value, namespace);
  }

  __setProperty(name, value) {
    let unmatched = this.unmatchedAttributes;

    if (unmatched) {
      let attr = findByName(unmatched, name);

      if (attr) {
        if (attr.value !== value) {
          attr.value = value;
        }

        unmatched.splice(unmatched.indexOf(attr), 1);
        return;
      }
    }

    return super.__setProperty(name, value);
  }

  __flushElement(parent, constructing) {
    let {
      unmatchedAttributes: unmatched
    } = this;

    if (unmatched) {
      for (let i = 0; i < unmatched.length; i++) {
        this.constructing.removeAttribute(unmatched[i].name);
      }

      this.unmatchedAttributes = null;
    } else {
      super.__flushElement(parent, constructing);
    }
  }

  willCloseElement() {
    let {
      candidate,
      currentCursor
    } = this;

    if (candidate !== null) {
      this.clearMismatch(candidate);
    }

    if (currentCursor && currentCursor.injectedOmittedNode) {
      this.popElement();
    }

    super.willCloseElement();
  }

  getMarker(element, guid) {
    let marker = element.querySelector(`script[glmr="${guid}"]`);

    if (marker) {
      return marker;
    }

    return null;
  }

  __pushRemoteElement(element, cursorId, insertBefore) {
    let marker = this.getMarker(element, cursorId);

    if (insertBefore === undefined) {
      while (element.firstChild !== null && element.firstChild !== marker) {
        this.remove(element.firstChild);
      }

      insertBefore = null;
    }

    let cursor = new RehydratingCursor(element, null, this.blockDepth);
    this[CURSOR_STACK].push(cursor);

    if (marker === null) {
      this.disableRehydration(insertBefore);
    } else {
      this.candidate = this.remove(marker);
    }

    let block = new RemoteLiveBlock(element);
    return this.pushLiveBlock(block, true);
  }

  didAppendBounds(bounds) {
    super.didAppendBounds(bounds);

    if (this.candidate) {
      let last = bounds.lastNode();
      this.candidate = last && last.nextSibling;
    }

    return bounds;
  }

}

function isTextNode(node) {
  return node.nodeType === 3;
}

function isComment(node) {
  return node.nodeType === 8;
}

function isOpenBlock(node) {
  return node.nodeType === 8
  /* COMMENT_NODE */
  && node.nodeValue.lastIndexOf('%+b:', 0) === 0;
}

function isCloseBlock(node) {
  return node.nodeType === 8
  /* COMMENT_NODE */
  && node.nodeValue.lastIndexOf('%-b:', 0) === 0;
}

function getBlockDepth(node) {
  return parseInt(node.nodeValue.slice(4), 10);
}

function isElement(node) {
  return node.nodeType === 1;
}

function isMarker(node) {
  return node.nodeType === 8 && node.nodeValue === '%glmr%';
}

function isSeparator(node) {
  return node.nodeType === 8 && node.nodeValue === '%|%';
}

function isEmpty$1(node) {
  return node.nodeType === 8 && node.nodeValue === '% %';
}

function isSameNodeType(candidate, tag) {
  if (candidate.namespaceURI === "http://www.w3.org/2000/svg"
  /* SVG */
  ) {
      return candidate.tagName === tag;
    }

  return candidate.tagName === tag.toUpperCase();
}

function findByName(array, name) {
  for (let i = 0; i < array.length; i++) {
    let attr = array[i];
    if (attr.name === name) return attr;
  }

  return undefined;
}

function rehydrationBuilder(env, cursor) {
  return RehydrateBuilder.forInitialRender(env, cursor);
}

export { clear, ConcreteBounds, CursorImpl, capabilityFlagsFrom, hasCapability, resetDebuggerCallback, setDebuggerCallback, CurriedComponentDefinition, curry, isCurriedComponentDefinition, DEFAULT_CAPABILITIES, MINIMAL_CAPABILITIES, helper$1 as DOMChanges, DOMChangesImpl as IDOMChanges, DOMTreeConstruction, isWhitespace, normalizeProperty, DefaultDynamicScope, AotRuntime, JitRuntime, EnvironmentImpl, ScopeImpl, inTransaction, getDynamicVar, ConditionalReference, NULL_REFERENCE, PrimitiveReference, UNDEFINED_REFERENCE, renderAot, renderAotComponent, renderAotMain, renderJitComponent, renderJitMain, renderSync, UpdatingVM, VM as LowLevelVM, EMPTY_ARGS, CapturedArgumentsImpl, CapturedNamedArgumentsImpl, CapturedPositionalArgumentsImpl, DynamicAttribute, dynamicAttribute, SimpleDynamicAttribute, clientBuilder, NewElementBuilder, UpdatableBlockImpl, RemoteLiveBlock, isSerializationFirstNode, RehydrateBuilder, rehydrationBuilder, SERIALIZATION_FIRST_NODE_STRING, destroy, registerDestructor, unregisterDestructor, associateDestroyableChild, isDestroying, isDestroyed, setScheduleDestroy, setScheduleDestroyed, enableDestroyableTracking, assertDestroyablesDestroyed, destroyChildren as _destroyChildren, scheduleDestroy as _scheduleDestroy, scheduleDestroyed as _scheduleDestroyed, SimpleComponentManager, TEMPLATE_ONLY_COMPONENT };
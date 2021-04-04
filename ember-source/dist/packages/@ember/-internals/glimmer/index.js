import { templateFactory, PartialDefinitionImpl, programCompilationContext } from '@glimmer/opcode-compiler';
export { templateFactory as template, templateCacheCounters } from '@glimmer/opcode-compiler';
import { get, PROPERTY_DID_CHANGE, set, computed, alias, tagForObject, objectAt, tagForProperty, _getProp, _setProp } from '@ember/-internals/metal';
import { assert, deprecate, debugFreeze, warn } from '@ember/debug';
import { EMBER_COMPONENT_IS_VISIBLE, PARTIALS, COMPONENT_MANAGER_STRING_LOOKUP } from '@ember/deprecated-features';
import { dasherize, loc } from '@ember/string';
import { DEBUG } from '@glimmer/env';
import { childRefFor, childRefFromParts, createComputeRef, createPrimitiveRef, UNDEFINED_REFERENCE, valueForRef, createConstRef, createUnboundRef, isInvokableRef, updateRef, isUpdatableRef, isConstRef, createInvokableRef, createReadOnlyRef, createDebugAliasRef } from '@glimmer/reference';
import { logTrackingStack, beginUntrackFrame, endUntrackFrame, valueForTag, beginTrackFrame, consumeTag, endTrackFrame, validateTag, createTag, dirtyTag, deprecateMutationsInTrackingTransaction, CONSTANT_TAG, isTracking, tagFor, setTrackingTransactionEnv, createUpdatableTag, CURRENT_TAG } from '@glimmer/validator';
import { clearElementView, clearViewElement, getViewElement, MUTABLE_CELL, addChildView, setElementView, setViewElement, ActionSupport, ChildViewsSupport, ClassNamesSupport, CoreView, ViewMixin, ViewStateSupport, TextSupport, isSimpleClick, constructStyleDeprecationMessage, ActionManager, getViewId } from '@ember/-internals/views';
import { registerDestructor, associateDestroyableChild, destroy } from '@glimmer/destroyable';
import { setInternalHelperManager, setInternalComponentManager, setComponentTemplate, getInternalHelperManager, helperCapabilities, setHelperManager, capabilityFlagsFrom, setInternalModifierManager, getComponentTemplate, getInternalComponentManager, setComponentManager } from '@glimmer/manager';
import { symbol, enumerableSymbol, guidFor, getDebugName, isProxy, HAS_NATIVE_SYMBOL, isEmberArray, isObject, uuid } from '@ember/-internals/utils';
import { flaggedInstrument, _instrumentStart } from '@ember/instrumentation';
import { join, backburner, schedule, getCurrentRunLoop } from '@ember/runloop';
import { _WeakSet, EMPTY_ARRAY, unwrapTemplate, dict } from '@glimmer/util';
import { getOwner, setOwner } from '@ember/-internals/owner';
import { assign } from '@ember/polyfills';
import { reifyPositional, normalizeProperty, EMPTY_ARGS, reifyNamed, createCapturedArgs, curry, EMPTY_POSITIONAL, array, concat, fn, get as get$1, hash, on, TEMPLATE_ONLY_COMPONENT_MANAGER, templateOnlyComponent, clientBuilder, DOMChanges, DOMTreeConstruction, inTransaction, renderMain, runtimeContext, rehydrationBuilder } from '@glimmer/runtime';
export { DOMChanges, DOMTreeConstruction, isSerializationFirstNode } from '@glimmer/runtime';
import { TargetActionSupport, FrameworkObject, _contentFor, isArray } from '@ember/-internals/runtime';
import { hasDOM } from '@ember/-internals/browser-environment';
import { getEngineParent } from '@ember/engine';
import { inject } from '@ember/service';
import { ENV } from '@ember/-internals/environment';
import { getFactoryFor, privatize } from '@ember/-internals/container';
import { NodeDOMTreeConstruction, serializeBuilder } from '@glimmer/node';
export { NodeDOMTreeConstruction } from '@glimmer/node';
import { isHTMLSafe } from '@ember/-internals/glimmer';
import setGlobalContext from '@glimmer/global-context';
import { QueryParams, generateControllerFactory } from '@ember/-internals/routing';
import EmberError from '@ember/error';
import { artifacts } from '@glimmer/program';
import RSVP from 'rsvp';

var RootTemplate = templateFactory({
  "id": "9BtKrod8",
  "block": "[[[46,[30,0],null,null,null]],[],false,[\"component\"]]",
  "moduleName": "packages/@ember/-internals/glimmer/lib/templates/root.hbs",
  "isStrictMode": false
});

function isTemplateFactory(template) {
  return typeof template === 'function';
}

/**
@module @ember/template
*/
class SafeString {
  constructor(string) {
    this.string = string;
  }

  toString() {
    return `${this.string}`;
  }

  toHTML() {
    return this.toString();
  }

}
const escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
  '=': '&#x3D;'
};
const possible = /[&<>"'`=]/;
const badChars = /[&<>"'`=]/g;

function escapeChar(chr) {
  return escape[chr];
}

function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML();
    } else if (string === null || string === undefined) {
      return '';
    } else if (!string) {
      return String(string);
    } // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.


    string = String(string);
  }

  if (!possible.test(string)) {
    return string;
  }

  return string.replace(badChars, escapeChar);
}
/**
  Mark a string as safe for unescaped output with Ember templates. If you
  return HTML from a helper, use this function to
  ensure Ember's rendering layer does not escape the HTML.

  ```javascript
  import { htmlSafe } from '@ember/template';

  htmlSafe('<div>someString</div>')
  ```

  @method htmlSafe
  @for @ember/template
  @static
  @return {SafeString} A string that will not be HTML escaped by Handlebars.
  @public
*/

function htmlSafe(str) {
  if (str === null || str === undefined) {
    str = '';
  } else if (typeof str !== 'string') {
    str = String(str);
  }

  return new SafeString(str);
}
/**
  Detects if a string was decorated using `htmlSafe`.

  ```javascript
  import { htmlSafe, isHTMLSafe } from '@ember/template';

  var plainString = 'plain string',
      safeString = htmlSafe('<div>someValue</div>');

  isHTMLSafe(plainString); // false
  isHTMLSafe(safeString);  // true
  ```

  @method isHTMLSafe
  @for @ember/template
  @static
  @return {Boolean} `true` if the string was decorated with `htmlSafe`, `false` otherwise.
  @public
*/

function isHTMLSafe$1(str) {
  return str !== null && typeof str === 'object' && typeof str.toHTML === 'function';
}

function referenceForParts(rootRef, parts) {
  let isAttrs = parts[0] === 'attrs'; // TODO deprecate this

  if (isAttrs) {
    parts.shift();

    if (parts.length === 1) {
      return childRefFor(rootRef, parts[0]);
    }
  }

  return childRefFromParts(rootRef, parts);
}

function parseAttributeBinding(microsyntax) {
  let colonIndex = microsyntax.indexOf(':');

  if (colonIndex === -1) {
    assert('You cannot use class as an attributeBinding, use classNameBindings instead.', microsyntax !== 'class');
    return [microsyntax, microsyntax, true];
  } else {
    let prop = microsyntax.substring(0, colonIndex);
    let attribute = microsyntax.substring(colonIndex + 1);
    assert('You cannot use class as an attributeBinding, use classNameBindings instead.', attribute !== 'class');
    return [prop, attribute, false];
  }
}
function installAttributeBinding(component, rootRef, parsed, operations) {
  let [prop, attribute, isSimple] = parsed;

  if (attribute === 'id') {
    let elementId = get(component, prop);

    if (elementId === undefined || elementId === null) {
      elementId = component.elementId;
    }

    elementId = createPrimitiveRef(elementId);
    operations.setAttribute('id', elementId, true, null);
    return;
  }

  let isPath = prop.indexOf('.') > -1;
  let reference = isPath ? referenceForParts(rootRef, prop.split('.')) : childRefFor(rootRef, prop);
  assert(`Illegal attributeBinding: '${prop}' is not a valid attribute name.`, !(isSimple && isPath));

  if (EMBER_COMPONENT_IS_VISIBLE && attribute === 'style' && createStyleBindingRef !== undefined) {
    reference = createStyleBindingRef(reference, childRefFor(rootRef, 'isVisible'));
  }

  operations.setAttribute(attribute, reference, false, null);
}
const DISPLAY_NONE = 'display: none;';
const SAFE_DISPLAY_NONE = htmlSafe(DISPLAY_NONE);
let createStyleBindingRef;
let installIsVisibleBinding;

if (EMBER_COMPONENT_IS_VISIBLE) {
  createStyleBindingRef = (inner, isVisibleRef) => {
    return createComputeRef(() => {
      let value = valueForRef(inner);
      let isVisible = valueForRef(isVisibleRef);

      if (DEBUG && isVisible !== undefined) {
        deprecate(`The \`isVisible\` property on classic component classes is deprecated. Was accessed:\n\n${logTrackingStack()}`, false, {
          id: 'ember-component.is-visible',
          until: '4.0.0',
          url: 'https://deprecations.emberjs.com/v3.x#toc_ember-component-is-visible',
          for: 'ember-source',
          since: {
            enabled: '3.15.0-beta.1'
          }
        });
      }

      if (isVisible !== false) {
        return value;
      } else if (!value) {
        return SAFE_DISPLAY_NONE;
      } else {
        let style = value + ' ' + DISPLAY_NONE;
        return isHTMLSafe$1(value) ? htmlSafe(style) : style;
      }
    });
  };

  installIsVisibleBinding = (rootRef, operations) => {
    operations.setAttribute('style', createStyleBindingRef(UNDEFINED_REFERENCE, childRefFor(rootRef, 'isVisible')), false, null);
  };
}

function createClassNameBindingRef(rootRef, microsyntax, operations) {
  let [prop, truthy, falsy] = microsyntax.split(':');
  let isStatic = prop === '';

  if (isStatic) {
    operations.setAttribute('class', createPrimitiveRef(truthy), true, null);
  } else {
    let isPath = prop.indexOf('.') > -1;
    let parts = isPath ? prop.split('.') : [];
    let value = isPath ? referenceForParts(rootRef, parts) : childRefFor(rootRef, prop);
    let ref;

    if (truthy === undefined) {
      ref = createSimpleClassNameBindingRef(value, isPath ? parts[parts.length - 1] : prop);
    } else {
      ref = createColonClassNameBindingRef(value, truthy, falsy);
    }

    operations.setAttribute('class', ref, false, null);
  }
}
function createSimpleClassNameBindingRef(inner, path) {
  let dasherizedPath;
  return createComputeRef(() => {
    let value = valueForRef(inner);

    if (value === true) {
      assert('You must pass a path when binding a to a class name using classNameBindings', path !== undefined);
      return dasherizedPath || (dasherizedPath = dasherize(path));
    } else if (value || value === 0) {
      return String(value);
    } else {
      return null;
    }
  });
}
function createColonClassNameBindingRef(inner, truthy, falsy) {
  return createComputeRef(() => {
    return valueForRef(inner) ? truthy : falsy;
  });
}

function NOOP() {}
/**
  @module ember
*/

/**
  Represents the internal state of the component.

  @class ComponentStateBucket
  @private
*/


class ComponentStateBucket {
  constructor(component, args, argsTag, finalizer, hasWrappedElement, isInteractive) {
    this.component = component;
    this.args = args;
    this.argsTag = argsTag;
    this.finalizer = finalizer;
    this.hasWrappedElement = hasWrappedElement;
    this.isInteractive = isInteractive;
    this.classRef = null;
    this.classRef = null;
    this.argsRevision = args === null ? 0 : valueForTag(argsTag);
    this.rootRef = createConstRef(component, 'this');
    registerDestructor(this, () => this.willDestroy(), true);
    registerDestructor(this, () => this.component.destroy());
  }

  willDestroy() {
    let {
      component,
      isInteractive
    } = this;

    if (isInteractive) {
      beginUntrackFrame();
      component.trigger('willDestroyElement');
      component.trigger('willClearRender');
      endUntrackFrame();
      let element = getViewElement(component);

      if (element) {
        clearElementView(element);
        clearViewElement(component);
      }
    }

    component.renderer.unregister(component);
  }

  finalize() {
    let {
      finalizer
    } = this;
    finalizer();
    this.finalizer = NOOP;
  }

}

function internalHelper(helper) {
  return setInternalHelperManager(helper, {});
}

/**
@module ember
*/
const ACTIONS = new _WeakSet();
const INVOKE = symbol('INVOKE');
/**
  The `{{action}}` helper provides a way to pass triggers for behavior (usually
  just a function) between components, and into components from controllers.

  ### Passing functions with the action helper

  There are three contexts an action helper can be used in. The first two
  contexts to discuss are attribute context, and Handlebars value context.

  ```handlebars
  {{! An example of attribute context }}
  <div onclick={{action "save"}}></div>
  {{! Examples of Handlebars value context }}
  {{input on-input=(action "save")}}
  {{yield (action "refreshData") andAnotherParam}}
  ```

  In these contexts,
  the helper is called a "closure action" helper. Its behavior is simple:
  If passed a function name, read that function off the `actions` property
  of the current context. Once that function is read, or immediately if a function was
  passed, create a closure over that function and any arguments.
  The resulting value of an action helper used this way is simply a function.

  For example, in the attribute context:

  ```handlebars
  {{! An example of attribute context }}
  <div onclick={{action "save"}}></div>
  ```

  The resulting template render logic would be:

  ```js
  var div = document.createElement('div');
  var actionFunction = (function(context){
    return function() {
      return context.actions.save.apply(context, arguments);
    };
  })(context);
  div.onclick = actionFunction;
  ```

  Thus when the div is clicked, the action on that context is called.
  Because the `actionFunction` is just a function, closure actions can be
  passed between components and still execute in the correct context.

  Here is an example action handler on a component:

  ```app/components/my-component.js
  import Component from '@glimmer/component';
  import { action } from '@ember/object';

  export default class extends Component {
    @action
    save() {
      this.model.save();
    }
  }
  ```

  Actions are always looked up on the `actions` property of the current context.
  This avoids collisions in the naming of common actions, such as `destroy`.
  Two options can be passed to the `action` helper when it is used in this way.

  * `target=someProperty` will look to `someProperty` instead of the current
    context for the `actions` hash. This can be useful when targeting a
    service for actions.
  * `value="target.value"` will read the path `target.value` off the first
    argument to the action when it is called and rewrite the first argument
    to be that value. This is useful when attaching actions to event listeners.

  ### Invoking an action

  Closure actions curry both their scope and any arguments. When invoked, any
  additional arguments are added to the already curried list.
  Actions should be invoked using the [sendAction](/ember/release/classes/Component/methods/sendAction?anchor=sendAction)
  method. The first argument to `sendAction` is the action to be called, and
  additional arguments are passed to the action function. This has interesting
  properties combined with currying of arguments. For example:

  ```app/components/update-name.js
  import Component from '@glimmer/component';
  import { action } from '@ember/object';

  export default class extends Component {
    @action
    setName(model, name) {
      model.set('name', name);
    }
  }
  ```

  ```app/components/update-name.hbs
  {{input on-input=(action (action 'setName' @model) value="target.value")}}
  ```

  The first argument (`@model`) was curried over, and the run-time argument (`event`)
  becomes a second argument. Action calls can be nested this way because each simply
  returns a function. Any function can be passed to the `{{action}}` helper, including
  other actions.

  Actions invoked with `sendAction` have the same currying behavior as demonstrated
  with `on-input` above. For example:

  ```app/components/my-input.js
  import Component from '@glimmer/component';
  import { action } from '@ember/object';

  export default class extends Component {
    @action
    setName(model, name) {
      model.set('name', name);
    }
  }
  ```

  ```handlebars
  <MyInput @submit={{action 'setName' @model}} />
  ```

  or

  ```handlebars
  {{my-input submit=(action 'setName' @model)}}
  ```

  ```app/components/my-component.js
  import Component from '@ember/component';

  export default Component.extend({
    click() {
      // Note that model is not passed, it was curried in the template
      this.sendAction('submit', 'bob');
    }
  });
  ```

  ### Attaching actions to DOM elements

  The third context of the `{{action}}` helper can be called "element space".
  For example:

  ```handlebars
  {{! An example of element space }}
  <div {{action "save"}}></div>
  ```

  Used this way, the `{{action}}` helper provides a useful shortcut for
  registering an HTML element in a template for a single DOM event and
  forwarding that interaction to the template's context (controller or component).
  If the context of a template is a controller, actions used this way will
  bubble to routes when the controller does not implement the specified action.
  Once an action hits a route, it will bubble through the route hierarchy.

  ### Event Propagation

  `{{action}}` helpers called in element space can control event bubbling. Note
  that the closure style actions cannot.

  Events triggered through the action helper will automatically have
  `.preventDefault()` called on them. You do not need to do so in your event
  handlers. If you need to allow event propagation (to handle file inputs for
  example) you can supply the `preventDefault=false` option to the `{{action}}` helper:

  ```handlebars
  <div {{action "sayHello" preventDefault=false}}>
    <input type="file" />
    <input type="checkbox" />
  </div>
  ```

  To disable bubbling, pass `bubbles=false` to the helper:

  ```handlebars
  <button {{action 'edit' post bubbles=false}}>Edit</button>
  ```

  To disable bubbling with closure style actions you must create your own
  wrapper helper that makes use of `event.stopPropagation()`:

  ```handlebars
  <div onclick={{disable-bubbling (action "sayHello")}}>Hello</div>
  ```

  ```app/helpers/disable-bubbling.js
  import { helper } from '@ember/component/helper';

  export function disableBubbling([action]) {
    return function(event) {
      event.stopPropagation();
      return action(event);
    };
  }
  export default helper(disableBubbling);
  ```

  If you need the default handler to trigger you should either register your
  own event handler, or use event methods on your view class. See
  ["Responding to Browser Events"](/ember/release/classes/Component)
  in the documentation for `Component` for more information.

  ### Specifying DOM event type

  `{{action}}` helpers called in element space can specify an event type.
  By default the `{{action}}` helper registers for DOM `click` events. You can
  supply an `on` option to the helper to specify a different DOM event name:

  ```handlebars
  <div {{action "anActionName" on="doubleClick"}}>
    click me
  </div>
  ```

  See ["Event Names"](/ember/release/classes/Component) for a list of
  acceptable DOM event names.

  ### Specifying whitelisted modifier keys

  `{{action}}` helpers called in element space can specify modifier keys.
  By default the `{{action}}` helper will ignore click events with pressed modifier
  keys. You can supply an `allowedKeys` option to specify which keys should not be ignored.

  ```handlebars
  <div {{action "anActionName" allowedKeys="alt"}}>
    click me
  </div>
  ```

  This way the action will fire when clicking with the alt key pressed down.
  Alternatively, supply "any" to the `allowedKeys` option to accept any combination of modifier keys.

  ```handlebars
  <div {{action "anActionName" allowedKeys="any"}}>
    click me with any key pressed
  </div>
  ```

  ### Specifying a Target

  A `target` option can be provided to the helper to change
  which object will receive the method call. This option must be a path
  to an object, accessible in the current context:

  ```app/templates/application.hbs
  <div {{action "anActionName" target=someService}}>
    click me
  </div>
  ```

  ```app/controllers/application.js
  import Controller from '@ember/controller';
  import { inject as service } from '@ember/service';

  export default class extends Controller {
    @service someService;
  }
  ```

  @method action
  @for Ember.Templates.helpers
  @public
*/

var action = internalHelper(args => {
  let {
    named,
    positional
  } = args; // The first two argument slots are reserved.
  // pos[0] is the context (or `this`)
  // pos[1] is the action name or function
  // Anything else is an action argument.

  let [context, action, ...restArgs] = positional;
  let debugKey = action.debugLabel;
  let target = 'target' in named ? named.target : context;
  let processArgs = makeArgsProcessor('value' in named && named.value, restArgs);
  let fn$$1;

  if (isInvokableRef(action)) {
    fn$$1 = makeClosureAction(action, action, invokeRef, processArgs, debugKey);
  } else {
    fn$$1 = makeDynamicClosureAction(valueForRef(context), target, action, processArgs, debugKey);
  }

  ACTIONS.add(fn$$1);
  return createUnboundRef(fn$$1, '(result of an `action` helper)');
});

function NOOP$1(args) {
  return args;
}

function makeArgsProcessor(valuePathRef, actionArgsRef) {
  let mergeArgs;

  if (actionArgsRef.length > 0) {
    mergeArgs = args => {
      return actionArgsRef.map(valueForRef).concat(args);
    };
  }

  let readValue;

  if (valuePathRef) {
    readValue = args => {
      let valuePath = valueForRef(valuePathRef);

      if (valuePath && args.length > 0) {
        args[0] = get(args[0], valuePath);
      }

      return args;
    };
  }

  if (mergeArgs && readValue) {
    return args => {
      return readValue(mergeArgs(args));
    };
  } else {
    return mergeArgs || readValue || NOOP$1;
  }
}

function makeDynamicClosureAction(context, targetRef, actionRef, processArgs, debugKey) {
  // We don't allow undefined/null values, so this creates a throw-away action to trigger the assertions
  if (DEBUG) {
    makeClosureAction(context, valueForRef(targetRef), valueForRef(actionRef), processArgs, debugKey);
  }

  return (...args) => {
    return makeClosureAction(context, valueForRef(targetRef), valueForRef(actionRef), processArgs, debugKey)(...args);
  };
}

function makeClosureAction(context, target, action, processArgs, debugKey) {
  let self;
  let fn$$1;
  assert(`Action passed is null or undefined in (action) from ${target}.`, action !== undefined && action !== null);

  if (typeof action[INVOKE] === 'function') {
    deprecate(`Usage of the private INVOKE API to make an object callable via action or fn is no longer supported. Please update to pass in a callback function instead. Received: ${String(action)}`, false, {
      until: '3.25.0',
      id: 'actions.custom-invoke-invokable',
      for: 'ember-source',
      since: {
        enabled: '3.23.0-beta.1'
      }
    });
    self = action;
    fn$$1 = action[INVOKE];
  } else {
    let typeofAction = typeof action;

    if (typeofAction === 'string') {
      self = target;
      fn$$1 = target.actions && target.actions[action];
      assert(`An action named '${action}' was not found in ${target}`, Boolean(fn$$1));
    } else if (typeofAction === 'function') {
      self = context;
      fn$$1 = action;
    } else {
      // tslint:disable-next-line:max-line-length
      assert(`An action could not be made for \`${debugKey || action}\` in ${target}. Please confirm that you are using either a quoted action name (i.e. \`(action '${debugKey || 'myAction'}')\`) or a function available in ${target}.`, false);
    }
  }

  return (...args) => {
    let payload = {
      target: self,
      args,
      label: '@glimmer/closure-action'
    };
    return flaggedInstrument('interaction.ember-action', payload, () => {
      return join(self, fn$$1, ...processArgs(args));
    });
  };
} // The code above:
// 1. Finds an action function, usually on the `actions` hash
// 2. Calls it with the target as the correct `this` context
// Previously, `UPDATE_REFERENCED_VALUE` was a method on the reference itself,
// so this made a bit more sense. Now, it isn't, and so we need to create a
// function that can have `this` bound to it when called. This allows us to use
// the same codepath to call `updateRef` on the reference.


function invokeRef(value) {
  updateRef(this, value);
}

// inputs needed by CurlyComponents (attrs and props, with mutable
// cells, etc).

function processComponentArgs(namedArgs) {
  let attrs = Object.create(null);
  let props = Object.create(null);
  props[ARGS] = namedArgs;

  for (let name in namedArgs) {
    let ref = namedArgs[name];
    let value = valueForRef(ref);
    let isAction = typeof value === 'function' && ACTIONS.has(value);

    if (isUpdatableRef(ref) && !isAction) {
      attrs[name] = new MutableCell(ref, value);
    } else {
      attrs[name] = value;
    }

    props[name] = value;
  }

  props.attrs = attrs;
  return props;
}
const REF = symbol('REF');

class MutableCell {
  constructor(ref, value) {
    this[MUTABLE_CELL] = true;
    this[REF] = ref;
    this.value = value;
  }

  update(val) {
    updateRef(this[REF], val);
  }

}

var __rest = undefined && undefined.__rest || function (s, e) {
  var t = {};

  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];

  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const ARGS = enumerableSymbol('ARGS');
const HAS_BLOCK = enumerableSymbol('HAS_BLOCK');
const DIRTY_TAG = symbol('DIRTY_TAG');
const IS_DISPATCHING_ATTRS = symbol('IS_DISPATCHING_ATTRS');
const BOUNDS = symbol('BOUNDS');
const EMBER_VIEW_REF = createPrimitiveRef('ember-view');

function aliasIdToElementId(args, props) {
  if (args.named.has('id')) {
    // tslint:disable-next-line:max-line-length
    assert(`You cannot invoke a component with both 'id' and 'elementId' at the same time.`, !args.named.has('elementId'));
    props.elementId = props.id;
  }
} // We must traverse the attributeBindings in reverse keeping track of
// what has already been applied. This is essentially refining the concatenated
// properties applying right to left.


function applyAttributeBindings(attributeBindings, component, rootRef, operations) {
  let seen = [];
  let i = attributeBindings.length - 1;

  while (i !== -1) {
    let binding = attributeBindings[i];
    let parsed = parseAttributeBinding(binding);
    let attribute = parsed[1];

    if (seen.indexOf(attribute) === -1) {
      seen.push(attribute);
      installAttributeBinding(component, rootRef, parsed, operations);
    }

    i--;
  }

  if (seen.indexOf('id') === -1) {
    let id = component.elementId ? component.elementId : guidFor(component);
    operations.setAttribute('id', createPrimitiveRef(id), false, null);
  }

  if (EMBER_COMPONENT_IS_VISIBLE && installIsVisibleBinding !== undefined && seen.indexOf('style') === -1) {
    installIsVisibleBinding(rootRef, operations);
  }
}

const EMPTY_POSITIONAL_ARGS = [];
debugFreeze(EMPTY_POSITIONAL_ARGS);
class CurlyComponentManager {
  templateFor(component) {
    let {
      layout,
      layoutName
    } = component;
    let owner = getOwner(component);
    let factory;

    if (layout === undefined) {
      if (layoutName !== undefined) {
        let _factory = owner.lookup(`template:${layoutName}`);

        assert(`Layout \`${layoutName}\` not found!`, _factory !== undefined);
        factory = _factory;
      } else {
        return null;
      }
    } else if (isTemplateFactory(layout)) {
      factory = layout;
    } else {
      // no layout was found, use the default layout
      return null;
    }

    return unwrapTemplate(factory(owner)).asWrappedLayout();
  }

  getDynamicLayout(bucket) {
    return this.templateFor(bucket.component);
  }

  getTagName(state) {
    let {
      component,
      hasWrappedElement
    } = state;

    if (!hasWrappedElement) {
      return null;
    }

    return component && component.tagName || 'div';
  }

  getCapabilities() {
    return CURLY_CAPABILITIES;
  }

  prepareArgs(ComponentClass, args) {
    var _a;

    if (args.named.has('__ARGS__')) {
      let _b = args.named.capture(),
          {
        __ARGS__
      } = _b,
          rest = __rest(_b, ["__ARGS__"]);

      let prepared = {
        positional: EMPTY_POSITIONAL_ARGS,
        named: Object.assign(Object.assign({}, rest), valueForRef(__ARGS__))
      };
      return prepared;
    }

    const {
      positionalParams
    } = (_a = ComponentClass.class) !== null && _a !== void 0 ? _a : ComponentClass; // early exits

    if (positionalParams === undefined || positionalParams === null || args.positional.length === 0) {
      return null;
    }

    let named;

    if (typeof positionalParams === 'string') {
      assert(`You cannot specify positional parameters and the hash argument \`${positionalParams}\`.`, !args.named.has(positionalParams));
      let captured = args.positional.capture();
      named = {
        [positionalParams]: createComputeRef(() => reifyPositional(captured))
      };
      assign(named, args.named.capture());
    } else if (Array.isArray(positionalParams) && positionalParams.length > 0) {
      const count = Math.min(positionalParams.length, args.positional.length);
      named = {};
      assign(named, args.named.capture());

      for (let i = 0; i < count; i++) {
        // As of TS 3.7, tsc is giving us the following error on this line without the type annotation
        //
        //   TS7022: 'name' implicitly has type 'any' because it does not have a type annotation and is
        //   referenced directly or indirectly in its own initializer.
        //
        // This is almost certainly a TypeScript bug, feel free to try and remove the annotation after
        // upgrading if it is not needed anymore.
        const name = positionalParams[i];
        assert(`You cannot specify both a positional param (at position ${i}) and the hash argument \`${name}\`.`, !args.named.has(name));
        named[name] = args.positional.at(i);
      }
    } else {
      return null;
    }

    return {
      positional: EMPTY_ARRAY,
      named
    };
  }
  /*
   * This hook is responsible for actually instantiating the component instance.
   * It also is where we perform additional bookkeeping to support legacy
   * features like exposed by view mixins like ChildViewSupport, ActionSupport,
   * etc.
   */


  create(owner, ComponentClass, args, {
    isInteractive
  }, dynamicScope, callerSelfRef, hasBlock) {
    // Get the nearest concrete component instance from the scope. "Virtual"
    // components will be skipped.
    let parentView = dynamicScope.view; // Capture the arguments, which tells Glimmer to give us our own, stable
    // copy of the Arguments object that is safe to hold on to between renders.

    let capturedArgs = args.named.capture();
    beginTrackFrame();
    let props = processComponentArgs(capturedArgs);
    let argsTag = endTrackFrame(); // Alias `id` argument to `elementId` property on the component instance.

    aliasIdToElementId(args, props); // Set component instance's parentView property to point to nearest concrete
    // component.

    props.parentView = parentView; // Set whether this component was invoked with a block
    // (`{{#my-component}}{{/my-component}}`) or without one
    // (`{{my-component}}`).

    props[HAS_BLOCK] = hasBlock; // Save the current `this` context of the template as the component's
    // `_target`, so bubbled actions are routed to the right place.

    props._target = valueForRef(callerSelfRef);
    setOwner(props, owner); // caller:
    // <FaIcon @name="bug" />
    //
    // callee:
    // <i class="fa-{{@name}}"></i>
    // Now that we've built up all of the properties to set on the component instance,
    // actually create it.

    beginUntrackFrame();
    let component = ComponentClass.create(props);

    let finalizer = _instrumentStart('render.component', initialRenderInstrumentDetails, component); // We become the new parentView for downstream components, so save our
    // component off on the dynamic scope.


    dynamicScope.view = component; // Unless we're the root component, we need to add ourselves to our parent
    // component's childViews array.

    if (parentView !== null && parentView !== undefined) {
      addChildView(parentView, component);
    }

    component.trigger('didReceiveAttrs');
    let hasWrappedElement = component.tagName !== ''; // We usually do this in the `didCreateElement`, but that hook doesn't fire for tagless components

    if (!hasWrappedElement) {
      if (isInteractive) {
        component.trigger('willRender');
      }

      component._transitionTo('hasElement');

      if (isInteractive) {
        component.trigger('willInsertElement');
      }
    } // Track additional lifecycle metadata about this component in a state bucket.
    // Essentially we're saving off all the state we'll need in the future.


    let bucket = new ComponentStateBucket(component, capturedArgs, argsTag, finalizer, hasWrappedElement, isInteractive);

    if (args.named.has('class')) {
      bucket.classRef = args.named.get('class');
    }

    if (DEBUG) {
      processComponentInitializationAssertions(component, props);
    }

    if (isInteractive && hasWrappedElement) {
      component.trigger('willRender');
    }

    endUntrackFrame(); // consume every argument so we always run again

    consumeTag(bucket.argsTag);
    consumeTag(component[DIRTY_TAG]);
    return bucket;
  }

  getDebugName(definition) {
    var _a;

    return definition.fullName || definition.normalizedName || ((_a = definition.class) === null || _a === void 0 ? void 0 : _a.name) || definition.name;
  }

  getSelf({
    rootRef
  }) {
    return rootRef;
  }

  didCreateElement({
    component,
    classRef,
    isInteractive,
    rootRef
  }, element, operations) {
    setViewElement(component, element);
    setElementView(element, component);
    let {
      attributeBindings,
      classNames,
      classNameBindings
    } = component;

    if (attributeBindings && attributeBindings.length) {
      applyAttributeBindings(attributeBindings, component, rootRef, operations);
    } else {
      let id = component.elementId ? component.elementId : guidFor(component);
      operations.setAttribute('id', createPrimitiveRef(id), false, null);

      if (EMBER_COMPONENT_IS_VISIBLE) {
        installIsVisibleBinding(rootRef, operations);
      }
    }

    if (classRef) {
      const ref = createSimpleClassNameBindingRef(classRef);
      operations.setAttribute('class', ref, false, null);
    }

    if (classNames && classNames.length) {
      classNames.forEach(name => {
        operations.setAttribute('class', createPrimitiveRef(name), false, null);
      });
    }

    if (classNameBindings && classNameBindings.length) {
      classNameBindings.forEach(binding => {
        createClassNameBindingRef(rootRef, binding, operations);
      });
    }

    operations.setAttribute('class', EMBER_VIEW_REF, false, null);

    if ('ariaRole' in component) {
      operations.setAttribute('role', childRefFor(rootRef, 'ariaRole'), false, null);
    }

    component._transitionTo('hasElement');

    if (isInteractive) {
      beginUntrackFrame();
      component.trigger('willInsertElement');
      endUntrackFrame();
    }
  }

  didRenderLayout(bucket, bounds) {
    bucket.component[BOUNDS] = bounds;
    bucket.finalize();
  }

  didCreate({
    component,
    isInteractive
  }) {
    if (isInteractive) {
      component._transitionTo('inDOM');

      component.trigger('didInsertElement');
      component.trigger('didRender');
    }
  }

  update(bucket) {
    let {
      component,
      args,
      argsTag,
      argsRevision,
      isInteractive
    } = bucket;
    bucket.finalizer = _instrumentStart('render.component', rerenderInstrumentDetails, component);
    beginUntrackFrame();

    if (args !== null && !validateTag(argsTag, argsRevision)) {
      beginTrackFrame();
      let props = processComponentArgs(args);
      argsTag = bucket.argsTag = endTrackFrame();
      bucket.argsRevision = valueForTag(argsTag);
      component[IS_DISPATCHING_ATTRS] = true;
      component.setProperties(props);
      component[IS_DISPATCHING_ATTRS] = false;
      component.trigger('didUpdateAttrs');
      component.trigger('didReceiveAttrs');
    }

    if (isInteractive) {
      component.trigger('willUpdate');
      component.trigger('willRender');
    }

    endUntrackFrame();
    consumeTag(argsTag);
    consumeTag(component[DIRTY_TAG]);
  }

  didUpdateLayout(bucket) {
    bucket.finalize();
  }

  didUpdate({
    component,
    isInteractive
  }) {
    if (isInteractive) {
      component.trigger('didUpdate');
      component.trigger('didRender');
    }
  }

  getDestroyable(bucket) {
    return bucket;
  }

}
function processComponentInitializationAssertions(component, props) {
  assert(`classNameBindings must be non-empty strings: ${component}`, (() => {
    let {
      classNameBindings
    } = component;

    for (let i = 0; i < classNameBindings.length; i++) {
      let binding = classNameBindings[i];

      if (typeof binding !== 'string' || binding.length === 0) {
        return false;
      }
    }

    return true;
  })());
  assert(`classNameBindings must not have spaces in them: ${component}`, (() => {
    let {
      classNameBindings
    } = component;

    for (let i = 0; i < classNameBindings.length; i++) {
      let binding = classNameBindings[i];

      if (binding.split(' ').length > 1) {
        return false;
      }
    }

    return true;
  })());
  assert(`You cannot use \`classNameBindings\` on a tag-less component: ${component}`, component.tagName !== '' || !component.classNameBindings || component.classNameBindings.length === 0);
  assert(`You cannot use \`elementId\` on a tag-less component: ${component}`, component.tagName !== '' || props.id === component.elementId || !component.elementId && component.elementId !== '');
  assert(`You cannot use \`attributeBindings\` on a tag-less component: ${component}`, component.tagName !== '' || !component.attributeBindings || component.attributeBindings.length === 0);
}
function initialRenderInstrumentDetails(component) {
  return component.instrumentDetails({
    initialRender: true
  });
}
function rerenderInstrumentDetails(component) {
  return component.instrumentDetails({
    initialRender: false
  });
}
const CURLY_CAPABILITIES = {
  dynamicLayout: true,
  dynamicTag: true,
  prepareArgs: true,
  createArgs: true,
  attributeHook: true,
  elementHook: true,
  createCaller: true,
  dynamicScope: true,
  updateHook: true,
  createInstance: true,
  wrapped: true,
  willDestroy: true,
  hasSubOwner: false
};
const CURLY_COMPONENT_MANAGER = new CurlyComponentManager();
function isCurlyManager(manager) {
  return manager === CURLY_COMPONENT_MANAGER;
}

/**
@module @ember/component
*/

/**
  A component is a reusable UI element that consists of a `.hbs` template and an
  optional JavaScript class that defines its behavior. For example, someone
  might make a `button` in the template and handle the click behavior in the
  JavaScript file that shares the same name as the template.

  Components are broken down into two categories:

  - Components _without_ JavaScript, that are based only on a template. These
    are called Template-only or TO components.
  - Components _with_ JavaScript, which consist of a template and a backing
    class.

  Ember ships with two types of JavaScript classes for components:

  1. Glimmer components, imported from `@glimmer/component`, which are the
     default component's for Ember Octane (3.15) and more recent editions.
  2. Classic components, imported from `@ember/component`, which were the
     default for older editions of Ember (pre 3.15).

  Below is the documentation for Classic components. If you are looking for the
  API documentation for Template-only or Glimmer components, it is
  [available here](/ember/release/modules/@glimmer%2Fcomponent).

  ## Defining a Classic Component

  If you want to customize the component in order to handle events, transform
  arguments or maintain internal state, you implement a subclass of `Component`.

  One example is to add computed properties to your component:

  ```app/components/person-profile.js
  import Component from '@ember/component';

  export default Component.extend({
    displayName: computed('person.title', 'person.firstName', 'person.lastName', function() {
      let { title, firstName, lastName } = this.person;

      if (title) {
        return `${title} ${lastName}`;
      } else {
        return `${firstName} ${lastName}`;
      }
    })
  });
  ```

  And then use it in the component's template:

  ```app/templates/components/person-profile.hbs
  <h1>{{this.displayName}}</h1>
  {{yield}}
  ```

  ## Customizing a Classic Component's HTML Element in JavaScript

  ### HTML Tag

  The default HTML tag name used for a component's HTML representation is `div`.
  This can be customized by setting the `tagName` property.

  Consider the following component class:

  ```app/components/emphasized-paragraph.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'em'
  });
  ```

  When invoked, this component would produce output that looks something like
  this:

  ```html
  <em id="ember1" class="ember-view"></em>
  ```

  ### HTML `class` Attribute

  The HTML `class` attribute of a component's tag can be set by providing a
  `classNames` property that is set to an array of strings:

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    classNames: ['my-class', 'my-other-class']
  });
  ```

  Invoking this component will produce output that looks like this:

  ```html
  <div id="ember1" class="ember-view my-class my-other-class"></div>
  ```

  `class` attribute values can also be set by providing a `classNameBindings`
  property set to an array of properties names for the component. The return
  value of these properties will be added as part of the value for the
  components's `class` attribute. These properties can be computed properties:

  ```app/components/my-widget.js
  import Component from '@ember/component';
  import { computed } from '@ember/object';

  export default Component.extend({
    classNames: ['my-class', 'my-other-class'],
    classNameBindings: ['propertyA', 'propertyB'],

    propertyA: 'from-a',
    propertyB: computed(function() {
      if (someLogic) { return 'from-b'; }
    })
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view my-class my-other-class from-a from-b"></div>
  ```

  Note that `classNames` and `classNameBindings` is in addition to the `class`
  attribute passed with the angle bracket invocation syntax. Therefore, if this
  component was invoked like so:

  ```handlebars
  <MyWidget class="from-invocation" />
  ```

  The resulting HTML will look similar to this:

  ```html
  <div id="ember1" class="from-invocation ember-view my-class my-other-class from-a from-b"></div>
  ```

  If the value of a class name binding returns a boolean the property name
  itself will be used as the class name if the property is true. The class name
  will not be added if the value is `false` or `undefined`.

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    classNameBindings: ['hovered'],

    hovered: true
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view hovered"></div>
  ```

  ### Custom Class Names for Boolean Values

  When using boolean class name bindings you can supply a string value other
  than the property name for use as the `class` HTML attribute by appending the
  preferred value after a ":" character when defining the binding:

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    classNameBindings: ['awesome:so-very-cool'],

    awesome: true
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view so-very-cool"></div>
  ```

  Boolean value class name bindings whose property names are in a
  camelCase-style format will be converted to a dasherized format:

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    classNameBindings: ['isUrgent'],

    isUrgent: true
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view is-urgent"></div>
  ```

  Class name bindings can also refer to object values that are found by
  traversing a path relative to the component itself:

  ```app/components/my-widget.js
  import Component from '@ember/component';
  import EmberObject from '@ember/object';

  export default Component.extend({
    classNameBindings: ['messages.empty'],

    messages: EmberObject.create({
      empty: true
    })
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view empty"></div>
  ```

  If you want to add a class name for a property which evaluates to true and
  and a different class name if it evaluates to false, you can pass a binding
  like this:

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    classNameBindings: ['isEnabled:enabled:disabled'],
    isEnabled: true
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view enabled"></div>
  ```

  When isEnabled is `false`, the resulting HTML representation looks like this:

  ```html
  <div id="ember1" class="ember-view disabled"></div>
  ```

  This syntax offers the convenience to add a class if a property is `false`:

  ```app/components/my-widget.js
  import Component from '@ember/component';

  // Applies no class when isEnabled is true and class 'disabled' when isEnabled is false
  export default Component.extend({
    classNameBindings: ['isEnabled::disabled'],
    isEnabled: true
  });
  ```

  Invoking this component when the `isEnabled` property is true will produce
  HTML that looks like:

  ```html
  <div id="ember1" class="ember-view"></div>
  ```

  Invoking it when the `isEnabled` property on the component is `false` will
  produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view disabled"></div>
  ```

  Updates to the value of a class name binding will result in automatic update
  of the  HTML `class` attribute in the component's rendered HTML
  representation. If the value becomes `false` or `undefined` the class name
  will be removed.

  Both `classNames` and `classNameBindings` are concatenated properties. See
  [EmberObject](/ember/release/classes/EmberObject) documentation for more
  information about concatenated properties.

  ### Other HTML Attributes

  The HTML attribute section of a component's tag can be set by providing an
  `attributeBindings` property set to an array of property names on the component.
  The return value of these properties will be used as the value of the component's
  HTML associated attribute:

  ```app/components/my-anchor.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'a',
    attributeBindings: ['href'],

    href: 'http://google.com'
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <a id="ember1" class="ember-view" href="http://google.com"></a>
  ```

  One property can be mapped on to another by placing a ":" between
  the source property and the destination property:

  ```app/components/my-anchor.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'a',
    attributeBindings: ['url:href'],

    url: 'http://google.com'
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <a id="ember1" class="ember-view" href="http://google.com"></a>
  ```

  HTML attributes passed with angle bracket invocations will take precedence
  over those specified in `attributeBindings`. Therefore, if this component was
  invoked like so:

  ```handlebars
  <MyAnchor href="http://bing.com" @url="http://google.com" />
  ```

  The resulting HTML will looks like this:

  ```html
  <a id="ember1" class="ember-view" href="http://bing.com"></a>
  ```

  Note that the `href` attribute is ultimately set to `http://bing.com`,
  despite it having attribute binidng to the `url` property, which was
  set to `http://google.com`.

  Namespaced attributes (e.g. `xlink:href`) are supported, but have to be
  mapped, since `:` is not a valid character for properties in Javascript:

  ```app/components/my-use.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'use',
    attributeBindings: ['xlinkHref:xlink:href'],

    xlinkHref: '#triangle'
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <use xlink:href="#triangle"></use>
  ```

  If the value of a property monitored by `attributeBindings` is a boolean, the
  attribute will be present or absent depending on the value:

  ```app/components/my-text-input.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'input',
    attributeBindings: ['disabled'],

    disabled: false
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <input id="ember1" class="ember-view" />
  ```

  `attributeBindings` can refer to computed properties:

  ```app/components/my-text-input.js
  import Component from '@ember/component';
  import { computed } from '@ember/object';

  export default Component.extend({
    tagName: 'input',
    attributeBindings: ['disabled'],

    disabled: computed(function() {
      if (someLogic) {
        return true;
      } else {
        return false;
      }
    })
  });
  ```

  To prevent setting an attribute altogether, use `null` or `undefined` as the
  value of the property used in `attributeBindings`:

  ```app/components/my-text-input.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'form',
    attributeBindings: ['novalidate'],
    novalidate: null
  });
  ```

  Updates to the property of an attribute binding will result in automatic
  update of the  HTML attribute in the component's HTML output.

  `attributeBindings` is a concatenated property. See
  [EmberObject](/ember/release/classes/EmberObject) documentation for more
  information about concatenated properties.

  ## Layouts

  The `layout` property can be used to dynamically specify a template associated
  with a component class, instead of relying on Ember to link together a
  component class and a template based on file names.

  In general, applications should not use this feature, but it's commonly used
  in addons for historical reasons.

  The `layout` property should be set to the default export of a template
  module, which is the name of a template file without the `.hbs` extension.

  ```app/templates/components/person-profile.hbs
  <h1>Person's Title</h1>
  <div class='details'>{{yield}}</div>
  ```

  ```app/components/person-profile.js
    import Component from '@ember/component';
    import layout from '../templates/components/person-profile';

    export default Component.extend({
      layout
    });
  ```

  If you invoke the component:

  ```handlebars
  <PersonProfile>
    <h2>Chief Basket Weaver</h2>
    <h3>Fisherman Industries</h3>
  </PersonProfile>
  ```

  or

  ```handlebars
  {{#person-profile}}
    <h2>Chief Basket Weaver</h2>
    <h3>Fisherman Industries</h3>
  {{/person-profile}}
  ```

  It will result in the following HTML output:

  ```html
  <h1>Person's Title</h1>
    <div class="details">
    <h2>Chief Basket Weaver</h2>
    <h3>Fisherman Industries</h3>
  </div>
  ```

  ## Handling Browser Events

  Components can respond to user-initiated events in one of three ways: passing
  actions with angle bracket invocation, adding event handler methods to the
  component's class, or adding actions to the component's template.

  ### Passing Actions With Angle Bracket Invocation

  For one-off events specific to particular instance of a component, it is possible
  to pass actions to the component's element using angle bracket invocation syntax.

  ```handlebars
  <MyWidget {{action 'firstWidgetClicked'}} />

  <MyWidget {{action 'secondWidgetClicked'}} />
  ```

  In this case, when the first component is clicked on, Ember will invoke the
  `firstWidgetClicked` action. When the second component is clicked on, Ember
  will invoke the `secondWidgetClicked` action instead.

  Besides `{{action}}`, it is also possible to pass any arbitrary element modifiers
  using the angle bracket invocation syntax.

  ### Event Handler Methods

  Components can also respond to user-initiated events by implementing a method
  that matches the event name. This approach is appropriate when the same event
  should be handled by all instances of the same component.

  An event object will be passed as the argument to the event handler method.

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    click(event) {
      // `event.target` is either the component's element or one of its children
      let tag = event.target.tagName.toLowerCase();
      console.log('clicked on a `<${tag}>` HTML element!');
    }
  });
  ```

  In this example, whenever the user clicked anywhere inside the component, it
  will log a message to the console.

  It is possible to handle event types other than `click` by implementing the
  following event handler methods. In addition, custom events can be registered
  by using `Application.customEvents`.

  Touch events:

  * `touchStart`
  * `touchMove`
  * `touchEnd`
  * `touchCancel`

  Keyboard events:

  * `keyDown`
  * `keyUp`
  * `keyPress`

  Mouse events:

  * `mouseDown`
  * `mouseUp`
  * `contextMenu`
  * `click`
  * `doubleClick`
  * `focusIn`
  * `focusOut`

  Form events:

  * `submit`
  * `change`
  * `focusIn`
  * `focusOut`
  * `input`

  Drag and drop events:

  * `dragStart`
  * `drag`
  * `dragEnter`
  * `dragLeave`
  * `dragOver`
  * `dragEnd`
  * `drop`

  ### `{{action}}` Helper

  Instead of handling all events of a particular type anywhere inside the
  component's element, you may instead want to limit it to a particular
  element in the component's template. In this case, it would be more
  convenient to implement an action instead.

  For example, you could implement the action `hello` for the `person-profile`
  component:

  ```app/components/person-profile.js
  import Component from '@ember/component';

  export default Component.extend({
    actions: {
      hello(name) {
        console.log("Hello", name);
      }
    }
  });
  ```

  And then use it in the component's template:

  ```app/templates/components/person-profile.hbs
  <h1>{{@person.name}}</h1>

  <button {{action 'hello' @person.name}}>
    Say Hello to {{@person.name}}
  </button>
  ```

  When the user clicks the button, Ember will invoke the `hello` action,
  passing in the current value of `@person.name` as an argument.

  See [Ember.Templates.helpers.action](/ember/release/classes/Ember.Templates.helpers/methods/action?anchor=action).

  @class Component
  @extends Ember.CoreView
  @uses Ember.TargetActionSupport
  @uses Ember.ClassNamesSupport
  @uses Ember.ActionSupport
  @uses Ember.ViewMixin
  @uses Ember.ViewStateSupport
  @public
*/

const Component = CoreView.extend(ChildViewsSupport, ViewStateSupport, ClassNamesSupport, TargetActionSupport, ActionSupport, ViewMixin, {
  isComponent: true,

  init() {
    this._super(...arguments);

    this[IS_DISPATCHING_ATTRS] = false;
    this[DIRTY_TAG] = createTag();
    this[BOUNDS] = null;

    if (DEBUG && this.renderer._isInteractive && this.tagName === '') {
      let eventNames = [];
      let eventDispatcher = getOwner(this).lookup('event_dispatcher:main');
      let events = eventDispatcher && eventDispatcher._finalEvents || {}; // tslint:disable-next-line:forin

      for (let key in events) {
        let methodName = events[key];

        if (typeof this[methodName] === 'function') {
          eventNames.push(methodName);
        }
      } // If in a tagless component, assert that no event handlers are defined


      assert( // tslint:disable-next-line:max-line-length
      `You can not define \`${eventNames}\` function(s) to handle DOM event in the \`${this}\` tagless component since it doesn't have any DOM element.`, !eventNames.length);
    }

    deprecate(`${this}: Using \`mouseEnter\` event handler methods in components has been deprecated.`, this.mouseEnter === undefined, {
      id: 'ember-views.event-dispatcher.mouseenter-leave-move',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_component-mouseenter-leave-move',
      for: 'ember-source',
      since: {
        enabled: '3.13.0-beta.1'
      }
    });
    deprecate(`${this}: Using \`mouseLeave\` event handler methods in components has been deprecated.`, this.mouseLeave === undefined, {
      id: 'ember-views.event-dispatcher.mouseenter-leave-move',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_component-mouseenter-leave-move',
      for: 'ember-source',
      since: {
        enabled: '3.13.0-beta.1'
      }
    });
    deprecate(`${this}: Using \`mouseMove\` event handler methods in components has been deprecated.`, this.mouseMove === undefined, {
      id: 'ember-views.event-dispatcher.mouseenter-leave-move',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_component-mouseenter-leave-move',
      for: 'ember-source',
      since: {
        enabled: '3.13.0-beta.1'
      }
    });
  },

  rerender() {
    dirtyTag(this[DIRTY_TAG]);

    this._super();
  },

  [PROPERTY_DID_CHANGE](key, value) {
    if (this[IS_DISPATCHING_ATTRS]) {
      return;
    }

    let args = this[ARGS];
    let reference = args !== undefined ? args[key] : undefined;

    if (reference !== undefined && isUpdatableRef(reference)) {
      updateRef(reference, arguments.length === 2 ? value : get(this, key));
    }
  },

  getAttr(key) {
    // TODO Intimate API should be deprecated
    return this.get(key);
  },

  /**
    Normally, Ember's component model is "write-only". The component takes a
    bunch of attributes that it got passed in, and uses them to render its
    template.
     One nice thing about this model is that if you try to set a value to the
    same thing as last time, Ember (through HTMLBars) will avoid doing any
    work on the DOM.
     This is not just a performance optimization. If an attribute has not
    changed, it is important not to clobber the element's "hidden state".
    For example, if you set an input's `value` to the same value as before,
    it will clobber selection state and cursor position. In other words,
    setting an attribute is not **always** idempotent.
     This method provides a way to read an element's attribute and also
    update the last value Ember knows about at the same time. This makes
    setting an attribute idempotent.
     In particular, what this means is that if you get an `<input>` element's
    `value` attribute and then re-render the template with the same value,
    it will avoid clobbering the cursor and selection position.
    Since most attribute sets are idempotent in the browser, you typically
    can get away with reading attributes using jQuery, but the most reliable
    way to do so is through this method.
    @method readDOMAttr
     @param {String} name the name of the attribute
    @return String
    @public
   */
  readDOMAttr(name) {
    // TODO revisit this
    let _element = getViewElement(this);

    assert(`Cannot call \`readDOMAttr\` on ${this} which does not have an element`, _element !== null);
    let element = _element;
    let isSVG = element.namespaceURI === "http://www.w3.org/2000/svg"
    /* SVG */
    ;
    let {
      type,
      normalized
    } = normalizeProperty(element, name);

    if (isSVG || type === 'attr') {
      return element.getAttribute(normalized);
    }

    return element[normalized];
  },

  /**
   The WAI-ARIA role of the control represented by this view. For example, a
   button may have a role of type 'button', or a pane may have a role of
   type 'alertdialog'. This property is used by assistive software to help
   visually challenged users navigate rich web applications.
    The full list of valid WAI-ARIA roles is available at:
   [https://www.w3.org/TR/wai-aria/#roles_categorization](https://www.w3.org/TR/wai-aria/#roles_categorization)
    @property ariaRole
   @type String
   @default null
   @public
   */

  /**
   Enables components to take a list of parameters as arguments.
   For example, a component that takes two parameters with the names
   `name` and `age`:
    ```app/components/my-component.js
   import Component from '@ember/component';
    let MyComponent = Component.extend();
    MyComponent.reopenClass({
     positionalParams: ['name', 'age']
   });
    export default MyComponent;
   ```
    It can then be invoked like this:
    ```hbs
   {{my-component "John" 38}}
   ```
    The parameters can be referred to just like named parameters:
    ```hbs
   Name: {{name}}, Age: {{age}}.
   ```
    Using a string instead of an array allows for an arbitrary number of
   parameters:
    ```app/components/my-component.js
   import Component from '@ember/component';
    let MyComponent = Component.extend();
    MyComponent.reopenClass({
     positionalParams: 'names'
   });
    export default MyComponent;
   ```
    It can then be invoked like this:
    ```hbs
   {{my-component "John" "Michael" "Scott"}}
   ```
   The parameters can then be referred to by enumerating over the list:
    ```hbs
   {{#each names as |name|}}{{name}}{{/each}}
   ```
    @static
   @public
   @property positionalParams
   @since 1.13.0
   */

  /**
   Called when the attributes passed into the component have been updated.
   Called both during the initial render of a container and during a rerender.
   Can be used in place of an observer; code placed here will be executed
   every time any attribute updates.
   @method didReceiveAttrs
   @public
   @since 1.13.0
   */
  didReceiveAttrs() {},

  /**
   Called when the attributes passed into the component have been updated.
   Called both during the initial render of a container and during a rerender.
   Can be used in place of an observer; code placed here will be executed
   every time any attribute updates.
   @event didReceiveAttrs
   @public
   @since 1.13.0
   */

  /**
   Called after a component has been rendered, both on initial render and
   in subsequent rerenders.
   @method didRender
   @public
   @since 1.13.0
   */
  didRender() {},

  /**
   Called after a component has been rendered, both on initial render and
   in subsequent rerenders.
   @event didRender
   @public
   @since 1.13.0
   */

  /**
   Called before a component has been rendered, both on initial render and
   in subsequent rerenders.
   @method willRender
   @public
   @since 1.13.0
   */
  willRender() {},

  /**
   Called before a component has been rendered, both on initial render and
   in subsequent rerenders.
   @event willRender
   @public
   @since 1.13.0
   */

  /**
   Called when the attributes passed into the component have been changed.
   Called only during a rerender, not during an initial render.
   @method didUpdateAttrs
   @public
   @since 1.13.0
   */
  didUpdateAttrs() {},

  /**
   Called when the attributes passed into the component have been changed.
   Called only during a rerender, not during an initial render.
   @event didUpdateAttrs
   @public
   @since 1.13.0
   */

  /**
   Called when the component is about to update and rerender itself.
   Called only during a rerender, not during an initial render.
   @method willUpdate
   @public
   @since 1.13.0
   */
  willUpdate() {},

  /**
   Called when the component is about to update and rerender itself.
   Called only during a rerender, not during an initial render.
   @event willUpdate
   @public
   @since 1.13.0
   */

  /**
   Called when the component has updated and rerendered itself.
   Called only during a rerender, not during an initial render.
   @method didUpdate
   @public
   @since 1.13.0
   */
  didUpdate() {}

});

Component.toString = () => '@ember/component';

Component.reopenClass({
  isComponentFactory: true,
  positionalParams: []
});
setInternalComponentManager(CURLY_COMPONENT_MANAGER, Component);

var layout = templateFactory({
  "id": "14evwHqT",
  "block": "[[],[],false,[]]",
  "moduleName": "packages/@ember/-internals/glimmer/lib/templates/empty.hbs",
  "isStrictMode": false
});

/**
@module @ember/component
*/

/**
  The internal class used to create text inputs when the `{{input}}`
  helper is used with `type` of `checkbox`.

  See [Ember.Templates.helpers.input](/ember/release/classes/Ember.Templates.helpers/methods/input?anchor=input)  for usage details.

  ## Direct manipulation of `checked`

  The `checked` attribute of an `Checkbox` object should always be set
  through the Ember object or by interacting with its rendered element
  representation via the mouse, keyboard, or touch. Updating the value of the
  checkbox via jQuery will result in the checked value of the object and its
  element losing synchronization.

  ## Layout and LayoutName properties

  Because HTML `input` elements are self closing `layout` and `layoutName`
  properties will not be applied.

  @class Checkbox
  @extends Component
  @public
*/

const Checkbox = Component.extend({
  layout,

  /**
    By default, this component will add the `ember-checkbox` class to the component's element.
       @property classNames
    @type Array | String
    @default ['ember-checkbox']
    @public
   */
  classNames: ['ember-checkbox'],
  tagName: 'input',

  /**
    By default this component will forward a number of arguments to attributes on the the
    component's element:
       * indeterminate
    * disabled
    * tabindex
    * name
    * autofocus
    * required
    * form
       When invoked with curly braces, this is the exhaustive list of HTML attributes you can
    customize (i.e. `{{input type="checkbox" disabled=true}}`).
       When invoked with angle bracket invocation, this list is irrelevant, because you can use HTML
    attribute syntax to customize the element (i.e.
    `<Input @type="checkbox" disabled data-custom="custom value" />`). However, `@type` and
    `@checked` must be passed as named arguments, not attributes.
       @property attributeBindings
    @type Array | String
    @default ['type', 'checked', 'indeterminate', 'disabled', 'tabindex', 'name', 'autofocus', 'required', 'form']
    @public
  */
  attributeBindings: ['type', 'checked', 'indeterminate', 'disabled', 'tabindex', 'name', 'autofocus', 'required', 'form'],

  /**
    Sets the `type` attribute of the `Checkbox`'s element
       @property disabled
    @default false
    @private
   */
  type: 'checkbox',

  /**
    Sets the `disabled` attribute of the `Checkbox`'s element
       @property disabled
    @default false
    @public
   */
  disabled: false,

  /**
    Corresponds to the `indeterminate` property of the `Checkbox`'s element
       @property disabled
    @default false
    @public
   */
  indeterminate: false,

  /**
    Whenever the checkbox is inserted into the DOM, perform initialization steps, which include
    setting the indeterminate property if needed.
       If this method is overridden, `super` must be called.
       @method
    @public
   */
  didInsertElement() {
    this._super(...arguments);

    this.element.indeterminate = Boolean(this.indeterminate);
  },

  /**
    Whenever the `change` event is fired on the checkbox, update its `checked` property to reflect
    whether the checkbox is checked.
       If this method is overridden, `super` must be called.
       @method
    @public
   */
  change() {
    set(this, 'checked', this.element.checked);
  }

});

if (DEBUG) {
  const UNSET = {};
  Checkbox.reopen({
    value: UNSET,

    didReceiveAttrs() {
      this._super();

      assert("`<Input @type='checkbox' @value={{...}} />` is not supported; " + "please use `<Input @type='checkbox' @checked={{...}} />` instead.", !(this.type === 'checkbox' && this.value !== UNSET));
    }

  });
}

Checkbox.toString = () => '@ember/component/checkbox';

/**
@module @ember/component
*/
const inputTypes = hasDOM ? Object.create(null) : null;

function canSetTypeOfInput(type) {
  // if running in outside of a browser always return
  // the original type
  if (!hasDOM) {
    return Boolean(type);
  }

  if (type in inputTypes) {
    return inputTypes[type];
  }

  let inputTypeTestElement = document.createElement('input');

  try {
    inputTypeTestElement.type = type;
  } catch (e) {// ignored
  }

  return inputTypes[type] = inputTypeTestElement.type === type;
}
/**
  The internal class used to create text inputs when the `Input` component is used with `type` of `text`.

  See [Ember.Templates.components.Input](/ember/release/classes/Ember.Templates.components/methods/Input?anchor=Input) for usage details.

  ## Layout and LayoutName properties

  Because HTML `input` elements are self closing `layout` and `layoutName`
  properties will not be applied.

  @class TextField
  @extends Component
  @uses Ember.TextSupport
  @public
*/


const TextField = Component.extend(TextSupport, {
  layout,

  /**
    By default, this component will add the `ember-text-field` class to the component's element.
       @property classNames
    @type Array | String
    @default ['ember-text-field']
    @public
   */
  classNames: ['ember-text-field'],
  tagName: 'input',

  /**
    By default this component will forward a number of arguments to attributes on the the
    component's element:
       * accept
    * autocomplete
    * autosave
    * dir
    * formaction
    * formenctype
    * formmethod
    * formnovalidate
    * formtarget
    * height
    * inputmode
    * lang
    * list
    * type
    * max
    * min
    * multiple
    * name
    * pattern
    * size
    * step
    * value
    * width
       When invoked with `{{input type="text"}}`, you can only customize these attributes. When invoked
    with `<Input @type="text" />`, you can just use HTML attributes directly.
       @property attributeBindings
    @type Array | String
    @default ['accept', 'autocomplete', 'autosave', 'dir', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget', 'height', 'inputmode', 'lang', 'list', 'type', 'max', 'min', 'multiple', 'name', 'pattern', 'size', 'step', 'value', 'width']
    @public
  */
  attributeBindings: ['accept', 'autocomplete', 'autosave', 'dir', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget', 'height', 'inputmode', 'lang', 'list', 'type', 'max', 'min', 'multiple', 'name', 'pattern', 'size', 'step', 'value', 'width'],

  /**
    As the user inputs text, this property is updated to reflect the `value` property of the HTML
    element.
       @property value
    @type String
    @default ""
    @public
  */
  value: '',

  /**
    The `type` attribute of the input element.
       @property type
    @type String
    @default "text"
    @public
  */
  type: computed({
    get() {
      return 'text';
    },

    set(_key, value) {
      let type = 'text';

      if (canSetTypeOfInput(value)) {
        type = value;
      }

      return type;
    }

  }),

  /**
    The `size` of the text field in characters.
       @property size
    @type String
    @default null
    @public
  */
  size: null,

  /**
    The `pattern` attribute of input element.
       @property pattern
    @type String
    @default null
    @public
  */
  pattern: null,

  /**
    The `min` attribute of input element used with `type="number"` or `type="range"`.
       @property min
    @type String
    @default null
    @since 1.4.0
    @public
  */
  min: null,

  /**
    The `max` attribute of input element used with `type="number"` or `type="range"`.
       @property max
    @type String
    @default null
    @since 1.4.0
    @public
  */
  max: null
});

TextField.toString = () => '@ember/component/text-field';

/**
@module @ember/component
*/
/**
  The `Textarea` component inserts a new instance of `<textarea>` tag into the template.

  The `@value` argument provides the content of the `<textarea>`.

  This template:

  ```handlebars
  <Textarea @value="A bunch of text" />
  ```

  Would result in the following HTML:

  ```html
  <textarea class="ember-text-area">
    A bunch of text
  </textarea>
  ```

  The `@value` argument is two-way bound. If the user types text into the textarea, the `@value`
  argument is updated. If the `@value` argument is updated, the text in the textarea is updated.

  In the following example, the `writtenWords` property on the component will be updated as the user
  types 'Lots of text' into the text area of their browser's window.

  ```app/components/word-editor.js
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  export default class WordEditorComponent extends Component {
    @tracked writtenWords = "Lots of text that IS bound";
  }
  ```

  ```handlebars
  <Textarea @value={{writtenWords}} />
  ```

  Would result in the following HTML:

  ```html
  <textarea class="ember-text-area">
    Lots of text that IS bound
  </textarea>
  ```

  If you wanted a one way binding, you could use the `<textarea>` element directly, and use the
  `value` DOM property and the `input` event.

  ### Actions

  The `Textarea` component takes a number of arguments with callbacks that are invoked in
  response to user events.

  * `enter`
  * `insert-newline`
  * `escape-press`
  * `focus-in`
  * `focus-out`
  * `key-press`

  These callbacks are passed to `Textarea` like this:

  ```handlebars
  <Textarea @value={{this.searchWord}} @enter={{this.query}} />
  ```

  ## Classic Invocation Syntax

  The `Textarea` component can also be invoked using curly braces, just like any other Ember
  component.

  For example, this is an invocation using angle-bracket notation:

  ```handlebars
  <Textarea @value={{this.searchWord}} @enter={{this.query}} />
  ```

  You could accomplish the same thing using classic invocation:

  ```handlebars
  {{textarea value=this.searchWord enter=this.query}}
  ```

  The main difference is that angle-bracket invocation supports any HTML attribute using HTML
  attribute syntax, because attributes and arguments have different syntax when using angle-bracket
  invocation. Curly brace invocation, on the other hand, only has a single syntax for arguments,
  and components must manually map attributes onto component arguments.

  When using classic invocation with `{{textarea}}`, only the following attributes are mapped onto
  arguments:

  * rows
  * cols
  * name
  * selectionEnd
  * selectionStart
  * autocomplete
  * wrap
  * lang
  * dir
  * value

  ## Classic `layout` and `layoutName` properties

  Because HTML `textarea` elements do not contain inner HTML the `layout` and
  `layoutName` properties will not be applied.

  @method Textarea
  @for Ember.Templates.components
  @see {TextArea}
  @public
*/

/**
  See Ember.Templates.components.Textarea.

  @method textarea
  @for Ember.Templates.helpers
  @see {Ember.Templates.components.textarea}
  @public
*/

/**
  The internal representation used for `Textarea` invocations.

  @class TextArea
  @extends Component
  @see {Ember.Templates.components.Textarea}
  @uses Ember.TextSupport
  @public
*/

const TextArea = Component.extend(TextSupport, {
  classNames: ['ember-text-area'],
  layout,
  tagName: 'textarea',
  attributeBindings: ['rows', 'cols', 'name', 'selectionEnd', 'selectionStart', 'autocomplete', 'wrap', 'lang', 'dir', 'value'],
  rows: null,
  cols: null
});

TextArea.toString = () => '@ember/component/text-area';

var layout$1 = templateFactory({
  "id": "Hma8ydcX",
  "block": "[[[41,[48,[30,1]],[[[18,1,null]],[]],[[[1,[30,0,[\"linkTitle\"]]]],[]]]],[\"&default\"],false,[\"if\",\"has-block\",\"yield\"]]",
  "moduleName": "packages/@ember/-internals/glimmer/lib/templates/link-to.hbs",
  "isStrictMode": false
});

/**
@module ember
*/
/**
  The `LinkTo` component renders a link to the supplied `routeName` passing an optionally
  supplied model to the route as its `model` context of the route. The block for `LinkTo`
  becomes the contents of the rendered element:

  ```handlebars
  <LinkTo @route='photoGallery'>
    Great Hamster Photos
  </LinkTo>
  ```

  This will result in:

  ```html
  <a href="/hamster-photos">
    Great Hamster Photos
  </a>
  ```

  ### Disabling the `LinkTo` component

  The `LinkTo` component can be disabled by using the `disabled` argument. A disabled link
  doesn't result in a transition when activated, and adds the `disabled` class to the `<a>`
  element.

  (The class name to apply to the element can be overridden by using the `disabledClass`
  argument)

  ```handlebars
  <LinkTo @route='photoGallery' @disabled={{true}}>
    Great Hamster Photos
  </LinkTo>
  ```

  ### Handling `href`

  `<LinkTo>` will use your application's Router to fill the element's `href` property with a URL
  that matches the path to the supplied `routeName`.

  ### Handling current route

  The `LinkTo` component will apply a CSS class name of 'active' when the application's current
  route matches the supplied routeName. For example, if the application's current route is
  'photoGallery.recent', then the following invocation of `LinkTo`:

  ```handlebars
  <LinkTo @route='photoGallery.recent'>
    Great Hamster Photos
  </LinkTo>
  ```

  will result in

  ```html
  <a href="/hamster-photos/this-week" class="active">
    Great Hamster Photos
  </a>
  ```

  The CSS class used for active classes can be customized by passing an `activeClass` argument:

  ```handlebars
  <LinkTo @route='photoGallery.recent' @activeClass="current-url">
    Great Hamster Photos
  </LinkTo>
  ```

  ```html
  <a href="/hamster-photos/this-week" class="current-url">
    Great Hamster Photos
  </a>
  ```

  ### Keeping a link active for other routes

  If you need a link to be 'active' even when it doesn't match the current route, you can use the
  `current-when` argument.

  ```handlebars
  <LinkTo @route='photoGallery' @current-when='photos'>
    Photo Gallery
  </LinkTo>
  ```

  This may be helpful for keeping links active for:

  * non-nested routes that are logically related
  * some secondary menu approaches
  * 'top navigation' with 'sub navigation' scenarios

  A link will be active if `current-when` is `true` or the current
  route is the route this link would transition to.

  To match multiple routes 'space-separate' the routes:

  ```handlebars
  <LinkTo @route='gallery' @current-when='photos drawings paintings'>
    Art Gallery
  </LinkTo>
  ```

  ### Supplying a model

  An optional `model` argument can be used for routes whose
  paths contain dynamic segments. This argument will become
  the model context of the linked route:

  ```javascript
  Router.map(function() {
    this.route("photoGallery", {path: "hamster-photos/:photo_id"});
  });
  ```

  ```handlebars
  <LinkTo @route='photoGallery' @model={{this.aPhoto}}>
    {{aPhoto.title}}
  </LinkTo>
  ```

  ```html
  <a href="/hamster-photos/42">
    Tomster
  </a>
  ```

  ### Supplying multiple models

  For deep-linking to route paths that contain multiple
  dynamic segments, the `models` argument can be used.

  As the router transitions through the route path, each
  supplied model argument will become the context for the
  route with the dynamic segments:

  ```javascript
  Router.map(function() {
    this.route("photoGallery", { path: "hamster-photos/:photo_id" }, function() {
      this.route("comment", {path: "comments/:comment_id"});
    });
  });
  ```

  This argument will become the model context of the linked route:

  ```handlebars
  <LinkTo @route='photoGallery.comment' @models={{array this.aPhoto this.comment}}>
    {{comment.body}}
  </LinkTo>
  ```

  ```html
  <a href="/hamster-photos/42/comments/718">
    A+++ would snuggle again.
  </a>
  ```

  ### Supplying an explicit dynamic segment value

  If you don't have a model object available to pass to `LinkTo`,
  an optional string or integer argument can be passed for routes whose
  paths contain dynamic segments. This argument will become the value
  of the dynamic segment:

  ```javascript
  Router.map(function() {
    this.route("photoGallery", { path: "hamster-photos/:photo_id" });
  });
  ```

  ```handlebars
  <LinkTo @route='photoGallery' @model={{aPhotoId}}>
    {{this.aPhoto.title}}
  </LinkTo>
  ```

  ```html
  <a href="/hamster-photos/42">
    Tomster
  </a>
  ```

  When transitioning into the linked route, the `model` hook will
  be triggered with parameters including this passed identifier.

  ### Allowing Default Action

  By default the `<LinkTo>` component prevents the default browser action by calling
  `preventDefault()` to avoid reloading the browser page.

  If you need to trigger a full browser reload pass `@preventDefault={{false}}`:

  ```handlebars
  <LinkTo @route='photoGallery' @model={{this.aPhotoId}} @preventDefault={{false}}>
    {{this.aPhotoId.title}}
  </LinkTo>
  ```

  ### Supplying a `tagName`

  By default `<LinkTo>` renders an `<a>` element. This can be overridden for a single use of
  `<LinkTo>` by supplying a `tagName` argument:

  ```handlebars
  <LinkTo @route='photoGallery' @tagName='li'>
    Great Hamster Photos
  </LinkTo>
  ```

  This produces:

  ```html
  <li>
    Great Hamster Photos
  </li>
  ```

  In general, this is not recommended.

  ### Supplying query parameters

  If you need to add optional key-value pairs that appear to the right of the ? in a URL,
  you can use the `query` argument.

  ```handlebars
  <LinkTo @route='photoGallery' @query={{hash page=1 per_page=20}}>
    Great Hamster Photos
  </LinkTo>
  ```

  This will result in:

  ```html
  <a href="/hamster-photos?page=1&per_page=20">
    Great Hamster Photos
  </a>
  ```

  @for Ember.Templates.components
  @method LinkTo
  @see {LinkComponent}
  @public
*/

/**
  @module @ember/routing
*/

/**
  See [Ember.Templates.components.LinkTo](/ember/release/classes/Ember.Templates.components/methods/input?anchor=LinkTo).

  @for Ember.Templates.helpers
  @method link-to
  @see {Ember.Templates.components.LinkTo}
  @public
**/

/**
  `LinkComponent` is the internal component invoked with `<LinkTo>` or `{{link-to}}`.

  @class LinkComponent
  @extends Component
  @see {Ember.Templates.components.LinkTo}
  @public
**/

const UNDEFINED = Object.freeze({
  toString() {
    return 'UNDEFINED';
  }

});
const EMPTY_QUERY_PARAMS = Object.freeze({});
const LinkComponent = Component.extend({
  layout: layout$1,
  tagName: 'a',

  /**
    @property route
    @public
  */
  route: UNDEFINED,

  /**
    @property model
    @public
  */
  model: UNDEFINED,

  /**
    @property models
    @public
  */
  models: UNDEFINED,

  /**
    @property query
    @public
  */
  query: UNDEFINED,

  /**
    Used to determine when this `LinkComponent` is active.
       @property current-when
    @public
  */
  'current-when': null,

  /**
    Sets the `title` attribute of the `LinkComponent`'s HTML element.
       @property title
    @default null
    @public
  **/
  title: null,

  /**
    Sets the `rel` attribute of the `LinkComponent`'s HTML element.
       @property rel
    @default null
    @public
  **/
  rel: null,

  /**
    Sets the `tabindex` attribute of the `LinkComponent`'s HTML element.
       @property tabindex
    @default null
    @public
  **/
  tabindex: null,

  /**
    Sets the `target` attribute of the `LinkComponent`'s HTML element.
       @since 1.8.0
    @property target
    @default null
    @public
  **/
  target: null,

  /**
    The CSS class to apply to `LinkComponent`'s element when its `active`
    property is `true`.
       @property activeClass
    @type String
    @default active
    @public
  **/
  activeClass: 'active',

  /**
    The CSS class to apply to `LinkComponent`'s element when its `loading`
    property is `true`.
       @property loadingClass
    @type String
    @default loading
    @private
  **/
  loadingClass: 'loading',

  /**
    The CSS class to apply to a `LinkComponent`'s element when its `disabled`
    property is `true`.
       @property disabledClass
    @type String
    @default disabled
    @private
  **/
  disabledClass: 'disabled',

  /**
    Determines whether the `LinkComponent` will trigger routing via
    the `replaceWith` routing strategy.
       @property replace
    @type Boolean
    @default false
    @public
  **/
  replace: false,

  /**
    By default this component will forward `href`, `title`, `rel`, `tabindex`, and `target`
    arguments to attributes on the component's element. When invoked with `{{link-to}}`, you can
    only customize these attributes. When invoked with `<LinkTo>`, you can just use HTML
    attributes directly.
       @property attributeBindings
    @type Array | String
    @default ['title', 'rel', 'tabindex', 'target']
    @public
  */
  attributeBindings: ['href', 'title', 'rel', 'tabindex', 'target'],

  /**
    By default this component will set classes on its element when any of the following arguments
    are truthy:
       * active
    * loading
    * disabled
       When these arguments are truthy, a class with the same name will be set on the element. When
    falsy, the associated class will not be on the element.
       @property classNameBindings
    @type Array
    @default ['active', 'loading', 'disabled', 'ember-transitioning-in', 'ember-transitioning-out']
    @public
  */
  classNameBindings: ['active', 'loading', 'disabled', 'transitioningIn', 'transitioningOut'],

  /**
    By default this component responds to the `click` event. When the component element is an
    `<a>` element, activating the link in another way, such as using the keyboard, triggers the
    click event.
       @property eventName
    @type String
    @default click
    @private
  */
  eventName: 'click',

  // this is doc'ed here so it shows up in the events
  // section of the API documentation, which is where
  // people will likely go looking for it.

  /**
    Triggers the `LinkComponent`'s routing behavior. If
    `eventName` is changed to a value other than `click`
    the routing behavior will trigger on that custom event
    instead.
       @event click
    @private
  */

  /**
    An overridable method called when `LinkComponent` objects are instantiated.
       Example:
       ```app/components/my-link.js
    import LinkComponent from '@ember/routing/link-component';
       export default LinkComponent.extend({
      init() {
        this._super(...arguments);
        console.log('Event is ' + this.get('eventName'));
      }
    });
    ```
       NOTE: If you do override `init` for a framework class like `Component`,
    be sure to call `this._super(...arguments)` in your
    `init` declaration! If you don't, Ember may not have an opportunity to
    do important setup work, and you'll see strange behavior in your
    application.
       @method init
    @private
  */
  init() {
    this._super(...arguments);

    assert('You attempted to use the <LinkTo> component within a routeless engine, this is not supported. ' + 'If you are using the ember-engines addon, use the <LinkToExternal> component instead. ' + 'See https://ember-engines.com/docs/links for more info.', !this._isEngine || this._engineMountPoint !== undefined); // Map desired event name to invoke function

    let {
      eventName
    } = this;
    this.on(eventName, this, this._invoke);
  },

  _routing: inject('-routing'),
  _currentRoute: alias('_routing.currentRouteName'),
  _currentRouterState: alias('_routing.currentState'),
  _targetRouterState: alias('_routing.targetState'),
  _isEngine: computed(function () {
    return getEngineParent(getOwner(this)) !== undefined;
  }),
  _engineMountPoint: computed(function () {
    return getOwner(this).mountPoint;
  }),
  _route: computed('route', '_currentRouterState', function computeLinkToComponentRoute() {
    let {
      route
    } = this;
    return route === UNDEFINED ? this._currentRoute : this._namespaceRoute(route);
  }),
  _models: computed('model', 'models', function computeLinkToComponentModels() {
    let {
      model,
      models
    } = this;
    assert('You cannot provide both the `@model` and `@models` arguments to the <LinkTo> component.', model === UNDEFINED || models === UNDEFINED);

    if (model !== UNDEFINED) {
      return [model];
    } else if (models !== UNDEFINED) {
      assert('The `@models` argument must be an array.', Array.isArray(models));
      return models;
    } else {
      return [];
    }
  }),
  _query: computed('query', function computeLinkToComponentQuery() {
    let {
      query
    } = this;

    if (query === UNDEFINED) {
      return EMPTY_QUERY_PARAMS;
    } else {
      return Object.assign({}, query);
    }
  }),

  /**
    Accessed as a classname binding to apply the component's `disabledClass`
    CSS `class` to the element when the link is disabled.
       When `true`, interactions with the element will not trigger route changes.
    @property disabled
    @private
  */
  disabled: computed({
    get(_key) {
      // always returns false for `get` because (due to the `set` just below)
      // the cached return value from the set will prevent this getter from _ever_
      // being called after a set has occurred
      return false;
    },

    set(_key, value) {
      this._isDisabled = value;
      return value ? this.disabledClass : false;
    }

  }),

  /**
    Accessed as a classname binding to apply the component's `activeClass`
    CSS `class` to the element when the link is active.
       This component is considered active when its `currentWhen` property is `true`
    or the application's current route is the route this component would trigger
    transitions into.
       The `currentWhen` property can match against multiple routes by separating
    route names using the ` ` (space) character.
       @property active
    @private
  */
  active: computed('activeClass', '_active', function computeLinkToComponentActiveClass() {
    return this._active ? this.activeClass : false;
  }),
  _active: computed('_currentRouterState', '_route', '_models', '_query', 'loading', 'current-when', function computeLinkToComponentActive() {
    let {
      _currentRouterState: state
    } = this;

    if (state) {
      return this._isActive(state);
    } else {
      return false;
    }
  }),
  willBeActive: computed('_currentRouterState', '_targetRouterState', '_route', '_models', '_query', 'loading', 'current-when', function computeLinkToComponentWillBeActive() {
    let {
      _currentRouterState: current,
      _targetRouterState: target
    } = this;

    if (current === target) {
      return;
    }

    return this._isActive(target);
  }),

  _isActive(routerState) {
    if (this.loading) {
      return false;
    }

    let currentWhen = this['current-when'];

    if (typeof currentWhen === 'boolean') {
      return currentWhen;
    }

    let {
      _models: models,
      _routing: routing
    } = this;

    if (typeof currentWhen === 'string') {
      return currentWhen.split(' ').some(route => routing.isActiveForRoute(models, undefined, this._namespaceRoute(route), routerState));
    } else {
      return routing.isActiveForRoute(models, this._query, this._route, routerState);
    }
  },

  transitioningIn: computed('_active', 'willBeActive', function computeLinkToComponentTransitioningIn() {
    if (this.willBeActive === true && !this._active) {
      return 'ember-transitioning-in';
    } else {
      return false;
    }
  }),
  transitioningOut: computed('_active', 'willBeActive', function computeLinkToComponentTransitioningOut() {
    if (this.willBeActive === false && this._active) {
      return 'ember-transitioning-out';
    } else {
      return false;
    }
  }),

  _namespaceRoute(route) {
    let {
      _engineMountPoint: mountPoint
    } = this;

    if (mountPoint === undefined) {
      return route;
    } else if (route === 'application') {
      return mountPoint;
    } else {
      return `${mountPoint}.${route}`;
    }
  },

  /**
    Event handler that invokes the link, activating the associated route.
       @method _invoke
    @param {Event} event
    @private
  */
  _invoke(event) {
    if (!isSimpleClick(event)) {
      return true;
    }

    let {
      bubbles,
      preventDefault
    } = this;
    let target = this.element.target;
    let isSelf = !target || target === '_self';

    if (preventDefault !== false && isSelf) {
      event.preventDefault();
    }

    if (bubbles === false) {
      event.stopPropagation();
    }

    if (this._isDisabled) {
      return false;
    }

    if (this.loading) {
      // tslint:disable-next-line:max-line-length
      warn('This link is in an inactive loading state because at least one of its models ' + 'currently has a null/undefined value, or the provided route name is invalid.', false, {
        id: 'ember-glimmer.link-to.inactive-loading-state'
      });
      return false;
    }

    if (!isSelf) {
      return false;
    }

    let {
      _route: routeName,
      _models: models,
      _query: queryParams,
      replace: shouldReplace
    } = this;
    let payload = {
      queryParams,
      routeName
    };
    flaggedInstrument('interaction.link-to', payload, this._generateTransition(payload, routeName, models, queryParams, shouldReplace));
    return false;
  },

  _generateTransition(payload, qualifiedRouteName, models, queryParams, shouldReplace) {
    let {
      _routing: routing
    } = this;
    return () => {
      payload.transition = routing.transitionTo(qualifiedRouteName, models, queryParams, shouldReplace);
    };
  },

  /**
    Sets the element's `href` attribute to the url for
    the `LinkComponent`'s targeted route.
       If the `LinkComponent`'s `tagName` is changed to a value other
    than `a`, this property will be ignored.
       @property href
    @private
  */
  href: computed('_currentRouterState', '_route', '_models', '_query', 'tagName', 'loading', 'loadingHref', function computeLinkToComponentHref() {
    if (this.tagName !== 'a') {
      return;
    }

    if (this.loading) {
      return this.loadingHref;
    }

    let {
      _route: route,
      _models: models,
      _query: query,
      _routing: routing
    } = this;

    if (DEBUG) {
      /*
       * Unfortunately, to get decent error messages, we need to do this.
       * In some future state we should be able to use a "feature flag"
       * which allows us to strip this without needing to call it twice.
       *
       * if (isDebugBuild()) {
       *   // Do the useful debug thing, probably including try/catch.
       * } else {
       *   // Do the performant thing.
       * }
       */
      try {
        return routing.generateURL(route, models, query);
      } catch (e) {
        // tslint:disable-next-line:max-line-length
        e.message = `While generating link to route "${this.route}": ${e.message}`;
        throw e;
      }
    } else {
      return routing.generateURL(route, models, query);
    }
  }),
  loading: computed('_route', '_modelsAreLoaded', 'loadingClass', function computeLinkToComponentLoading() {
    let {
      _route: route,
      _modelsAreLoaded: loaded
    } = this;

    if (!loaded || route === null || route === undefined) {
      return this.loadingClass;
    }
  }),
  _modelsAreLoaded: computed('_models', function computeLinkToComponentModelsAreLoaded() {
    let {
      _models: models
    } = this;

    for (let i = 0; i < models.length; i++) {
      let model = models[i];

      if (model === null || model === undefined) {
        return false;
      }
    }

    return true;
  }),

  /**
    The default href value to use while a link-to is loading.
    Only applies when tagName is 'a'
       @property loadingHref
    @type String
    @default #
    @private
  */
  loadingHref: '#',

  didReceiveAttrs() {
    let {
      disabledWhen
    } = this;

    if (disabledWhen !== undefined) {
      this.set('disabled', disabledWhen);
    }

    let {
      params
    } = this;

    if (!params || params.length === 0) {
      assert('You must provide at least one of the `@route`, `@model`, `@models` or `@query` argument to `<LinkTo>`.', !(this.route === UNDEFINED && this.model === UNDEFINED && this.models === UNDEFINED && this.query === UNDEFINED));
      let {
        _models: models
      } = this;

      if (models.length > 0) {
        let lastModel = models[models.length - 1];

        if (typeof lastModel === 'object' && lastModel !== null && lastModel.isQueryParams) {
          this.query = lastModel.values;
          models.pop();
        }
      }

      return;
    }

    params = params.slice(); // Process the positional arguments, in order.
    // 1. Inline link title comes first, if present.

    if (!this[HAS_BLOCK]) {
      this.set('linkTitle', params.shift());
    } // 2. The last argument is possibly the `query` object.


    let queryParams = params[params.length - 1];

    if (queryParams && queryParams.isQueryParams) {
      this.set('query', params.pop().values);
    } else {
      this.set('query', UNDEFINED);
    } // 3. If there is a `route`, it is now at index 0.


    if (params.length === 0) {
      this.set('route', UNDEFINED);
    } else {
      this.set('route', params.shift());
    } // 4. Any remaining indices (if any) are `models`.


    this.set('model', UNDEFINED);
    this.set('models', params);
  }

});

LinkComponent.toString = () => '@ember/routing/link-component';

LinkComponent.reopenClass({
  positionalParams: 'params'
});

const CAPABILITIES = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  createCaller: true,
  dynamicScope: false,
  updateHook: false,
  createInstance: true,
  wrapped: false,
  willDestroy: false,
  hasSubOwner: false
};
class InternalManager {
  constructor(ComponentClass, name) {
    this.ComponentClass = ComponentClass;
    this.name = name;
  }

  getCapabilities() {
    return CAPABILITIES;
  }

  create(owner, _definition, args, env, _dynamicScope, caller) {
    assert('caller must be const', isConstRef(caller));
    assert(`The ${this.name} component does not take any positional arguments`, args.positional.length === 0);
    let {
      ComponentClass
    } = this;
    let instance = new ComponentClass(owner, args.named.capture(), valueForRef(caller));
    let state = {
      env,
      instance
    };
    return state;
  }

  didCreate() {}

  didUpdate() {}

  didRenderLayout() {}

  didUpdateLayout() {}

  getDebugName() {
    return this.name;
  }

  getSelf({
    instance
  }) {
    return createConstRef(instance, 'this');
  }

  getDestroyable(state) {
    return state.instance;
  }

}

var InputTemplate = templateFactory({
  "id": "sAKl8rD7",
  "block": "[[[44,[[50,\"-checkbox\",0,null,null],[50,\"-text-field\",0,null,null]],[[[41,[30,0,[\"isCheckbox\"]],[[[8,[30,1],[[17,3]],[[\"@target\",\"@__ARGS__\"],[[30,0,[\"caller\"]],[30,0,[\"args\"]]]],null]],[]],[[[8,[30,2],[[17,3]],[[\"@target\",\"@__ARGS__\"],[[30,0,[\"caller\"]],[30,0,[\"args\"]]]],null]],[]]]],[1,2]]]],[\"Checkbox\",\"TextField\",\"&attrs\"],false,[\"let\",\"component\",\"if\"]]",
  "moduleName": "packages/@ember/-internals/glimmer/lib/templates/input.hbs",
  "isStrictMode": false
});

class InternalComponent {
  constructor(owner, args, caller) {
    this.owner = owner;
    this.args = args;
    this.caller = caller;
    setOwner(this, owner);
  }

  static get class() {
    return this;
  }

  static get fullName() {
    return this.name;
  }

  static get normalizedName() {
    return this.name;
  }

  arg(key) {
    let ref = this.args[key];
    return ref ? valueForRef(ref) : undefined;
  }

  toString() {
    return `<${this.constructor.toString()}:${guidFor(this)}>`;
  }

}

/**
@module @ember/component
*/
/**
  See [Ember.Templates.components.Input](/ember/release/classes/Ember.Templates.components/methods/Input?anchor=Input).

  @method input
  @for Ember.Templates.helpers
  @param {Hash} options
  @public
  */

/**
  The `Input` component lets you create an HTML `<input>` element.

  ```handlebars
  <Input @value="987" />
  ```

  creates an `<input>` element with `type="text"` and value set to 987.

  ### Text field

  If no `type` argument is specified, a default of type 'text' is used.

  ```handlebars
  Search:
  <Input @value={{this.searchWord}} />
  ```

  In this example, the initial value in the `<input>` will be set to the value of
  `this.searchWord`. If the user changes the text, the value of `this.searchWord` will also be
  updated.

  ### Actions

  The `Input` component takes a number of arguments with callbacks that are invoked in response to
  user events.

  * `enter`
  * `insert-newline`
  * `escape-press`
  * `focus-in`
  * `focus-out`
  * `key-down`
  * `key-press`
  * `key-up`

  These callbacks are passed to `Input` like this:

  ```handlebars
  <Input @value={{this.searchWord}} @enter={{this.query}} />
  ```

  ### `<input>` HTML Attributes to Avoid

  In most cases, if you want to pass an attribute to the underlying HTML `<input>` element, you
  can pass the attribute directly, just like any other Ember component.

  ```handlebars
  <Input @type="text" size="10" />
  ```

  In this example, the `size` attribute will be applied to the underlying `<input>` element in the
  outputted HTML.

  However, there are a few attributes where you **must** use the `@` version.

  * `@type`: This argument is used to control which Ember component is used under the hood
  * `@value`: The `@value` argument installs a two-way binding onto the element. If you wanted a
    one-way binding, use `<input>` with the `value` property and the `input` event instead.
  * `@checked` (for checkboxes): like `@value`, the `@checked` argument installs a two-way binding
    onto the element. If you wanted a one-way binding, use `<input type="checkbox">` with
    `checked` and the `input` event instead.

  ### Extending `TextField`

  Internally, `<Input @type="text" />` creates an instance of `TextField`, passing arguments from
  the helper to `TextField`'s `create` method. Subclassing `TextField` is supported but not
  recommended.

  See [TextField](/ember/release/classes/TextField)

  ### Checkbox

  To create an `<input type="checkbox">`:

  ```handlebars
  Emberize Everything:
  <Input @type="checkbox" @checked={{this.isEmberized}} name="isEmberized" />
  ```

  This will bind the checked state of this checkbox to the value of `isEmberized` -- if either one
  changes, it will be reflected in the other.

  ### Extending `Checkbox`

  Internally, `<Input @type="checkbox" />` creates an instance of `Checkbox`. Subclassing
  `TextField` is supported but not recommended.

  See [Checkbox](/ember/release/classes/Checkbox)

  @method Input
  @for Ember.Templates.components
  @see {TextField}
  @see {Checkbox}
  @param {Hash} options
  @public
*/

class Input extends InternalComponent {
  get isCheckbox() {
    return this.arg('type') === 'checkbox';
  }

} // Use an opaque handle so implementation details are

const InputComponent = {
  // Factory interface
  create() {
    throw assert('Use constructor instead of create');
  }

};
setInternalComponentManager(new InternalManager(Input, 'input'), InputComponent);
setComponentTemplate(InputTemplate, InputComponent);

Input.toString = () => '@ember/component/input';

/**
@module @ember/component
*/
const RECOMPUTE_TAG = symbol('RECOMPUTE_TAG');
/**
  Ember Helpers are functions that can compute values, and are used in templates.
  For example, this code calls a helper named `format-currency`:

  ```app/templates/application.hbs
  <Cost @cents={{230}} />
  ```

  ```app/components/cost.hbs
  <div>{{format-currency @cents currency="$"}}</div>
  ```

  Additionally a helper can be called as a nested helper.
  In this example, we show the formatted currency value if the `showMoney`
  named argument is truthy.

  ```handlebars
  {{if @showMoney (format-currency @cents currency="$")}}
  ```

  Helpers defined using a class must provide a `compute` function. For example:

  ```app/helpers/format-currency.js
  import Helper from '@ember/component/helper';

  export default class extends Helper {
    compute([cents], { currency }) {
      return `${currency}${cents * 0.01}`;
    }
  }
  ```

  Each time the input to a helper changes, the `compute` function will be
  called again.

  As instances, these helpers also have access to the container and will accept
  injected dependencies.

  Additionally, class helpers can call `recompute` to force a new computation.

  @class Helper
  @public
  @since 1.13.0
*/

let Helper = FrameworkObject.extend({
  init() {
    this._super(...arguments);

    this[RECOMPUTE_TAG] = createTag();
  },

  /**
    On a class-based helper, it may be useful to force a recomputation of that
    helpers value. This is akin to `rerender` on a component.
       For example, this component will rerender when the `currentUser` on a
    session service changes:
       ```app/helpers/current-user-email.js
    import Helper from '@ember/component/helper'
    import { inject as service } from '@ember/service'
    import { observer } from '@ember/object'
       export default Helper.extend({
      session: service(),
         onNewUser: observer('session.currentUser', function() {
        this.recompute();
      }),
         compute() {
        return this.get('session.currentUser.email');
      }
    });
    ```
       @method recompute
    @public
    @since 1.13.0
  */
  recompute() {
    join(() => dirtyTag(this[RECOMPUTE_TAG]));
  }

});
const IS_CLASSIC_HELPER = symbol('IS_CLASSIC_HELPER');
Helper.isHelperFactory = true;
Helper[IS_CLASSIC_HELPER] = true;
function isClassicHelper(obj) {
  return obj[IS_CLASSIC_HELPER] === true;
}

class ClassicHelperManager {
  constructor(owner) {
    this.capabilities = helperCapabilities('3.23', {
      hasValue: true,
      hasDestroyable: true
    });
    let ownerInjection = {};
    setOwner(ownerInjection, owner);
    this.ownerInjection = ownerInjection;
  }

  createHelper(definition, args) {
    let instance = definition.class === undefined ? definition.create(this.ownerInjection) : definition.create();
    return {
      instance,
      args
    };
  }

  getDestroyable({
    instance
  }) {
    return instance;
  }

  getValue({
    instance,
    args
  }) {
    let ret;
    let {
      positional,
      named
    } = args;

    if (DEBUG) {
      deprecateMutationsInTrackingTransaction(() => {
        ret = instance.compute(positional, named);
      });
    } else {
      ret = instance.compute(positional, named);
    }

    consumeTag(instance[RECOMPUTE_TAG]);
    return ret;
  }

  getDebugName(definition) {
    return getDebugName(definition.class['prototype']);
  }

}

setHelperManager(owner => {
  return new ClassicHelperManager(owner);
}, Helper);
const CLASSIC_HELPER_MANAGER = getInternalHelperManager(Helper); ///////////

class Wrapper {
  constructor(compute) {
    this.compute = compute;
    this.isHelperFactory = true;
  }

  create() {
    // needs new instance or will leak containers
    return {
      compute: this.compute
    };
  }

}

class SimpleClassicHelperManager {
  constructor() {
    this.capabilities = helperCapabilities('3.23', {
      hasValue: true
    });
  }

  createHelper(definition, args) {
    let {
      compute
    } = definition;

    if (DEBUG) {
      return () => {
        let ret;
        deprecateMutationsInTrackingTransaction(() => {
          ret = compute.call(null, args.positional, args.named);
        });
        return ret;
      };
    }

    return () => compute.call(null, args.positional, args.named);
  }

  getValue(fn$$1) {
    return fn$$1();
  }

  getDebugName(definition) {
    return getDebugName(definition.compute);
  }

}

const SIMPLE_CLASSIC_HELPER_MANAGER = new SimpleClassicHelperManager();
setHelperManager(() => SIMPLE_CLASSIC_HELPER_MANAGER, Wrapper.prototype);
/**
  In many cases it is not necessary to use the full `Helper` class.
  The `helper` method create pure-function helpers without instances.
  For example:

  ```app/helpers/format-currency.js
  import { helper } from '@ember/component/helper';

  export default helper(function([cents], {currency}) {
    return `${currency}${cents * 0.01}`;
  });
  ```

  @static
  @param {Function} helper The helper function
  @method helper
  @for @ember/component/helper
  @public
  @since 1.13.0
*/

function helper(helperFn) {
  return new Wrapper(helperFn);
}

function instrumentationPayload(def) {
  return {
    object: `${def.name}:${def.outlet}`
  };
}

const CAPABILITIES$1 = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: false,
  attributeHook: false,
  elementHook: false,
  createCaller: false,
  dynamicScope: true,
  updateHook: false,
  createInstance: true,
  wrapped: false,
  willDestroy: false,
  hasSubOwner: false
};

class OutletComponentManager {
  create(_owner, definition, _args, env, dynamicScope) {
    let parentStateRef = dynamicScope.get('outletState');
    let currentStateRef = definition.ref;
    dynamicScope.set('outletState', currentStateRef);
    let state = {
      self: createConstRef(definition.controller, 'this'),
      finalize: _instrumentStart('render.outlet', instrumentationPayload, definition)
    };

    if (env.debugRenderTree !== undefined) {
      state.outlet = {
        name: definition.outlet
      };
      let parentState = valueForRef(parentStateRef);
      let parentOwner = parentState && parentState.render && parentState.render.owner;
      let currentOwner = valueForRef(currentStateRef).render.owner;

      if (parentOwner && parentOwner !== currentOwner) {
        let engine = currentOwner;
        assert('invalid engine: missing mountPoint', typeof currentOwner.mountPoint === 'string');
        assert('invalid engine: missing routable', currentOwner.routable === true);
        let mountPoint = engine.mountPoint;
        state.engine = engine;
        state.engineBucket = {
          mountPoint
        };
      }
    }

    return state;
  }

  getDebugName({
    name
  }) {
    return name;
  }

  getDebugCustomRenderTree(definition, state, args) {
    let nodes = [];

    if (state.outlet) {
      nodes.push({
        bucket: state.outlet,
        type: 'outlet',
        name: state.outlet.name,
        args: EMPTY_ARGS,
        instance: undefined,
        template: undefined
      });
    }

    if (state.engineBucket) {
      nodes.push({
        bucket: state.engineBucket,
        type: 'engine',
        name: state.engineBucket.mountPoint,
        args: EMPTY_ARGS,
        instance: state.engine,
        template: undefined
      });
    }

    nodes.push({
      bucket: state,
      type: 'route-template',
      name: definition.name,
      args: args,
      instance: definition.controller,
      template: unwrapTemplate(definition.template).moduleName
    });
    return nodes;
  }

  getCapabilities() {
    return CAPABILITIES$1;
  }

  getSelf({
    self
  }) {
    return self;
  }

  didCreate() {}

  didUpdate() {}

  didRenderLayout(state) {
    state.finalize();
  }

  didUpdateLayout() {}

  getDestroyable() {
    return null;
  }

}

const OUTLET_MANAGER = new OutletComponentManager();
class OutletComponentDefinition {
  constructor(state, manager = OUTLET_MANAGER) {
    this.state = state;
    this.manager = manager; // handle is not used by this custom definition

    this.handle = -1;
    let capabilities = manager.getCapabilities();
    this.capabilities = capabilityFlagsFrom(capabilities);
    this.compilable = capabilities.wrapped ? unwrapTemplate(state.template).asWrappedLayout() : unwrapTemplate(state.template).asLayout();
    this.resolvedName = state.name;
  }

}
function createRootOutlet(outletView) {
  if (ENV._APPLICATION_TEMPLATE_WRAPPER) {
    const WRAPPED_CAPABILITIES = assign({}, CAPABILITIES$1, {
      dynamicTag: true,
      elementHook: true,
      wrapped: true
    });
    const WrappedOutletComponentManager = class extends OutletComponentManager {
      getTagName() {
        return 'div';
      }

      getCapabilities() {
        return WRAPPED_CAPABILITIES;
      }

      didCreateElement(component, element) {
        // to add GUID id and class
        element.setAttribute('class', 'ember-view');
        element.setAttribute('id', guidFor(component));
      }

    };
    const WRAPPED_OUTLET_MANAGER = new WrappedOutletComponentManager();
    return new OutletComponentDefinition(outletView.state, WRAPPED_OUTLET_MANAGER);
  } else {
    return new OutletComponentDefinition(outletView.state);
  }
}

class RootComponentManager extends CurlyComponentManager {
  constructor(component) {
    super();
    this.component = component;
  }

  create(_owner, _state, _args, {
    isInteractive
  }, dynamicScope) {
    let component = this.component;

    let finalizer = _instrumentStart('render.component', initialRenderInstrumentDetails, component);

    dynamicScope.view = component;
    let hasWrappedElement = component.tagName !== ''; // We usually do this in the `didCreateElement`, but that hook doesn't fire for tagless components

    if (!hasWrappedElement) {
      if (isInteractive) {
        component.trigger('willRender');
      }

      component._transitionTo('hasElement');

      if (isInteractive) {
        component.trigger('willInsertElement');
      }
    }

    if (DEBUG) {
      processComponentInitializationAssertions(component, {});
    }

    let bucket = new ComponentStateBucket(component, null, CONSTANT_TAG, finalizer, hasWrappedElement, isInteractive);
    consumeTag(component[DIRTY_TAG]);
    return bucket;
  }

} // ROOT is the top-level template it has nothing but one yield.
// it is supposed to have a dummy element


const ROOT_CAPABILITIES = {
  dynamicLayout: true,
  dynamicTag: true,
  prepareArgs: false,
  createArgs: false,
  attributeHook: true,
  elementHook: true,
  createCaller: true,
  dynamicScope: true,
  updateHook: true,
  createInstance: true,
  wrapped: true,
  willDestroy: false,
  hasSubOwner: false
};
class RootComponentDefinition {
  constructor(component) {
    // handle is not used by this custom definition
    this.handle = -1;
    this.resolvedName = '-top-level';
    this.capabilities = capabilityFlagsFrom(ROOT_CAPABILITIES);
    this.compilable = null;
    this.manager = new RootComponentManager(component);
    this.state = getFactoryFor(component);
  }

}

/**
@module ember
*/
/**
  The `{{#each}}` helper loops over elements in a collection. It is an extension
  of the base Handlebars `{{#each}}` helper.

  The default behavior of `{{#each}}` is to yield its inner block once for every
  item in an array passing the item as the first block parameter.

  Assuming the `@developers` argument contains this array:

  ```javascript
  [{ name: 'Yehuda' },{ name: 'Tom' }, { name: 'Paul' }];
  ```

  ```handlebars
  <ul>
    {{#each @developers as |person|}}
      <li>Hello, {{person.name}}!</li>
    {{/each}}
  </ul>
  ```

  The same rules apply to arrays of primitives.

  ```javascript
  ['Yehuda', 'Tom', 'Paul']
  ```

  ```handlebars
  <ul>
    {{#each @developerNames as |name|}}
      <li>Hello, {{name}}!</li>
    {{/each}}
  </ul>
  ```

  During iteration, the index of each item in the array is provided as a second block
  parameter.

  ```handlebars
  <ul>
    {{#each @developers as |person index|}}
      <li>Hello, {{person.name}}! You're number {{index}} in line</li>
    {{/each}}
  </ul>
  ```

  ### Specifying Keys

  In order to improve rendering speed, Ember will try to reuse the DOM elements
  where possible. Specifically, if the same item is present in the array both
  before and after the change, its DOM output will be reused.

  The `key` option is used to tell Ember how to determine if the items in the
  array being iterated over with `{{#each}}` has changed between renders. By
  default the item's object identity is used.

  This is usually sufficient, so in most cases, the `key` option is simply not
  needed. However, in some rare cases, the objects' identities may change even
  though they represent the same underlying data.

  For example:

  ```javascript
  people.map(person => {
    return { ...person, type: 'developer' };
  });
  ```

  In this case, each time the `people` array is `map`-ed over, it will produce
  an new array with completely different objects between renders. In these cases,
  you can help Ember determine how these objects related to each other with the
  `key` option:

  ```handlebars
  <ul>
    {{#each @developers key="name" as |person|}}
      <li>Hello, {{person.name}}!</li>
    {{/each}}
  </ul>
  ```

  By doing so, Ember will use the value of the property specified (`person.name`
  in the example) to find a "match" from the previous render. That is, if Ember
  has previously seen an object from the `@developers` array with a matching
  name, its DOM elements will be re-used.

  There are two special values for `key`:

    * `@index` - The index of the item in the array.
    * `@identity` - The item in the array itself.

  ### {{else}} condition

  `{{#each}}` can have a matching `{{else}}`. The contents of this block will render
  if the collection is empty.

  ```handlebars
  <ul>
    {{#each @developers as |person|}}
      <li>{{person.name}} is available!</li>
    {{else}}
      <li>Sorry, nobody is available for this task.</li>
    {{/each}}
  </ul>
  ```

  @method each
  @for Ember.Templates.helpers
  @public
 */

/**
  The `{{each-in}}` helper loops over properties on an object.

  For example, given this component definition:

  ```app/components/developer-details.js
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  export default class extends Component {
    @tracked developer = {
      "name": "Shelly Sails",
      "age": 42
    };
  }
  ```

  This template would display all properties on the `developer`
  object in a list:

  ```app/components/developer-details.hbs
  <ul>
    {{#each-in this.developer as |key value|}}
      <li>{{key}}: {{value}}</li>
    {{/each-in}}
  </ul>
  ```

  Outputting their name and age.

  @method each-in
  @for Ember.Templates.helpers
  @public
  @since 2.1.0
*/

class EachInWrapper {
  constructor(inner) {
    this.inner = inner;
  }

}
var eachIn = internalHelper(({
  positional
}) => {
  let inner = positional[0];
  return createComputeRef(() => {
    let iterable = valueForRef(inner);
    consumeTag(tagForObject(iterable));

    if (isProxy(iterable)) {
      // this is because the each-in doesn't actually get(proxy, 'key') but bypasses it
      // and the proxy's tag is lazy updated on access
      iterable = _contentFor(iterable);
    }

    return new EachInWrapper(iterable);
  });
});

function toIterator(iterable) {
  if (iterable instanceof EachInWrapper) {
    return toEachInIterator(iterable.inner);
  } else {
    return toEachIterator(iterable);
  }
}

function toEachInIterator(iterable) {
  if (!isIndexable(iterable)) {
    return null;
  }

  if (Array.isArray(iterable) || isEmberArray(iterable)) {
    return ObjectIterator.fromIndexable(iterable);
  } else if (HAS_NATIVE_SYMBOL && isNativeIterable(iterable)) {
    return MapLikeNativeIterator.from(iterable);
  } else if (hasForEach(iterable)) {
    return ObjectIterator.fromForEachable(iterable);
  } else {
    return ObjectIterator.fromIndexable(iterable);
  }
}

function toEachIterator(iterable) {
  if (!isObject(iterable)) {
    return null;
  }

  if (Array.isArray(iterable)) {
    return ArrayIterator.from(iterable);
  } else if (isEmberArray(iterable)) {
    return EmberArrayIterator.from(iterable);
  } else if (HAS_NATIVE_SYMBOL && isNativeIterable(iterable)) {
    return ArrayLikeNativeIterator.from(iterable);
  } else if (hasForEach(iterable)) {
    return ArrayIterator.fromForEachable(iterable);
  } else {
    return null;
  }
}

class BoundedIterator {
  constructor(length) {
    this.length = length;
    this.position = 0;
  }

  isEmpty() {
    return false;
  }

  memoFor(position) {
    return position;
  }

  next() {
    let {
      length,
      position
    } = this;

    if (position >= length) {
      return null;
    }

    let value = this.valueFor(position);
    let memo = this.memoFor(position);
    this.position++;
    return {
      value,
      memo
    };
  }

}

class ArrayIterator extends BoundedIterator {
  constructor(array$$1) {
    super(array$$1.length);
    this.array = array$$1;
  }

  static from(iterable) {
    return iterable.length > 0 ? new this(iterable) : null;
  }

  static fromForEachable(object) {
    let array$$1 = [];
    object.forEach(item => array$$1.push(item));
    return this.from(array$$1);
  }

  valueFor(position) {
    return this.array[position];
  }

}

class EmberArrayIterator extends BoundedIterator {
  constructor(array$$1) {
    super(array$$1.length);
    this.array = array$$1;
  }

  static from(iterable) {
    return iterable.length > 0 ? new this(iterable) : null;
  }

  valueFor(position) {
    return objectAt(this.array, position);
  }

}

class ObjectIterator extends BoundedIterator {
  constructor(keys, values) {
    super(values.length);
    this.keys = keys;
    this.values = values;
  }

  static fromIndexable(obj) {
    let keys = Object.keys(obj);
    let {
      length
    } = keys;

    if (length === 0) {
      return null;
    } else {
      let values = [];

      for (let i = 0; i < length; i++) {
        let value;
        let key = keys[i];
        value = obj[key]; // Add the tag of the returned value if it is an array, since arrays
        // should always cause updates if they are consumed and then changed

        if (isTracking()) {
          consumeTag(tagFor(obj, key));

          if (Array.isArray(value)) {
            consumeTag(tagFor(value, '[]'));
          }
        }

        values.push(value);
      }

      return new this(keys, values);
    }
  }

  static fromForEachable(obj) {
    let keys = [];
    let values = [];
    let length = 0;
    let isMapLike = false; // Not using an arrow function here so we can get an accurate `arguments`

    obj.forEach(function (value, key) {
      isMapLike = isMapLike || arguments.length >= 2;

      if (isMapLike) {
        keys.push(key);
      }

      values.push(value);
      length++;
    });

    if (length === 0) {
      return null;
    } else if (isMapLike) {
      return new this(keys, values);
    } else {
      return new ArrayIterator(values);
    }
  }

  valueFor(position) {
    return this.values[position];
  }

  memoFor(position) {
    return this.keys[position];
  }

}

class NativeIterator {
  constructor(iterable, result) {
    this.iterable = iterable;
    this.result = result;
    this.position = 0;
  }

  static from(iterable) {
    let iterator = iterable[Symbol.iterator]();
    let result = iterator.next();
    let {
      done
    } = result;

    if (done) {
      return null;
    } else {
      return new this(iterator, result);
    }
  }

  isEmpty() {
    return false;
  }

  next() {
    let {
      iterable,
      result,
      position
    } = this;

    if (result.done) {
      return null;
    }

    let value = this.valueFor(result, position);
    let memo = this.memoFor(result, position);
    this.position++;
    this.result = iterable.next();
    return {
      value,
      memo
    };
  }

}

class ArrayLikeNativeIterator extends NativeIterator {
  valueFor(result) {
    return result.value;
  }

  memoFor(_result, position) {
    return position;
  }

}

class MapLikeNativeIterator extends NativeIterator {
  valueFor(result) {
    return result.value[1];
  }

  memoFor(result) {
    return result.value[0];
  }

}

function hasForEach(value) {
  return typeof value['forEach'] === 'function';
}

function isNativeIterable(value) {
  return typeof value[Symbol.iterator] === 'function';
}

function isIndexable(value) {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function toBool(predicate) {
  if (isProxy(predicate)) {
    consumeTag(tagForProperty(predicate, 'content'));
    return Boolean(get(predicate, 'isTruthy'));
  } else if (isArray(predicate)) {
    consumeTag(tagForProperty(predicate, '[]'));
    return predicate.length !== 0;
  } else if (isHTMLSafe(predicate)) {
    return Boolean(predicate.toString());
  } else {
    return Boolean(predicate);
  }
}

// Setup global context

setGlobalContext({
  scheduleRevalidate() {
    backburner.ensureInstance();
  },

  toBool,
  toIterator,
  getProp: _getProp,
  setProp: _setProp,
  getPath: get,
  setPath: set,

  scheduleDestroy(destroyable, destructor) {
    schedule('actions', null, destructor, destroyable);
  },

  scheduleDestroyed(finalizeDestructor) {
    schedule('destroy', null, finalizeDestructor);
  },

  warnIfStyleNotTrusted(value) {
    warn(constructStyleDeprecationMessage(value), (() => {
      if (value === null || value === undefined || isHTMLSafe$1(value)) {
        return true;
      }

      return false;
    })(), {
      id: 'ember-htmlbars.style-xss-warning'
    });
  },

  assert(test, msg, options) {
    var _a;

    if (DEBUG) {
      let id = options === null || options === void 0 ? void 0 : options.id;
      let override = VM_ASSERTION_OVERRIDES.filter(o => o.id === id)[0];
      assert((_a = override === null || override === void 0 ? void 0 : override.message) !== null && _a !== void 0 ? _a : msg, test);
    }
  },

  deprecate(msg, test, options) {
    var _a;

    if (DEBUG) {
      let {
        id
      } = options;
      let override = VM_DEPRECATION_OVERRIDES.filter(o => o.id === id)[0];
      if (!override) throw new Error(`deprecation override for ${id} not found`); // allow deprecations to be disabled in the VM_DEPRECATION_OVERRIDES array below

      if (!override.disabled) {
        deprecate((_a = override.message) !== null && _a !== void 0 ? _a : msg, Boolean(test), override);
      }
    }
  }

});

if (DEBUG) {
  setTrackingTransactionEnv === null || setTrackingTransactionEnv === void 0 ? void 0 : setTrackingTransactionEnv({
    debugMessage(obj, keyName) {
      let dirtyString = keyName ? `\`${keyName}\` on \`${getDebugName === null || getDebugName === void 0 ? void 0 : getDebugName(obj)}\`` : `\`${getDebugName === null || getDebugName === void 0 ? void 0 : getDebugName(obj)}\``;
      return `You attempted to update ${dirtyString}, but it had already been used previously in the same computation.  Attempting to update a value after using it in a computation can cause logical errors, infinite revalidation bugs, and performance issues, and is not supported.`;
    }

  });
} ///////////
// VM Assertion/Deprecation overrides


const VM_DEPRECATION_OVERRIDES = [{
  id: 'autotracking.mutation-after-consumption',
  until: '4.0.0',
  for: 'ember-source',
  since: {
    enabled: '3.21.0'
  }
}, {
  id: 'this-property-fallback',
  disabled: true,
  url: 'https://deprecations.emberjs.com/v3.x#toc_this-property-fallback',
  until: '4.0.0',
  for: 'ember-source',
  since: {
    enabled: '3.26.0'
  }
}];
const VM_ASSERTION_OVERRIDES = []; ///////////
// Define environment delegate

class EmberEnvironmentDelegate {
  constructor(owner, isInteractive) {
    this.owner = owner;
    this.isInteractive = isInteractive;
    this.enableDebugTooling = ENV._DEBUG_RENDER_TREE;
  }

  onTransactionCommit() {}

}

let helper$1;

if (DEBUG) {
  helper$1 = args => {
    let inner = args.positional[0];
    return createComputeRef(() => {
      let value = valueForRef(inner);
      assert('You cannot pass a null or undefined destination element to in-element', value !== null && value !== undefined);
      return value;
    });
  };
} else {
  helper$1 = args => args.positional[0];
}

var inElementNullCheckHelper = internalHelper(helper$1);

var normalizeClassHelper = internalHelper(({
  positional
}) => {
  return createComputeRef(() => {
    let classNameParts = valueForRef(positional[0]).split('.');
    let className = classNameParts[classNameParts.length - 1];
    let value = valueForRef(positional[1]);

    if (value === true) {
      return dasherize(className);
    } else if (!value && value !== 0) {
      return '';
    } else {
      return String(value);
    }
  });
});

/**
@module ember
*/
/**
  This reference is used to get the `[]` tag of iterables, so we can trigger
  updates to `{{each}}` when it changes. It is put into place by a template
  transform at build time, similar to the (-each-in) helper
*/

var trackArray = internalHelper(({
  positional
}) => {
  let inner = positional[0];
  return createComputeRef(() => {
    let iterable = valueForRef(inner);

    if (isObject(iterable)) {
      consumeTag(tagForProperty(iterable, '[]'));
    }

    return iterable;
  });
});

/**
@module ember
*/
/**
  The `mut` helper lets you __clearly specify__ that a child `Component` can update the
  (mutable) value passed to it, which will __change the value of the parent component__.

  To specify that a parameter is mutable, when invoking the child `Component`:

  ```handlebars
  <MyChild @childClickCount={{fn (mut totalClicks)}} />
  ```

   or

  ```handlebars
  {{my-child childClickCount=(mut totalClicks)}}
  ```

  The child `Component` can then modify the parent's value just by modifying its own
  property:

  ```javascript
  // my-child.js
  export default Component.extend({
    click() {
      this.incrementProperty('childClickCount');
    }
  });
  ```

  Note that for curly components (`{{my-component}}`) the bindings are already mutable,
  making the `mut` unnecessary.

  Additionally, the `mut` helper can be combined with the `fn` helper to
  mutate a value. For example:

  ```handlebars
  <MyChild @childClickCount={{this.totalClicks}} @click-count-change={{fn (mut totalClicks))}} />
  ```

  or

  ```handlebars
  {{my-child childClickCount=totalClicks click-count-change=(fn (mut totalClicks))}}
  ```

  The child `Component` would invoke the function with the new click value:

  ```javascript
  // my-child.js
  export default Component.extend({
    click() {
      this.get('click-count-change')(this.get('childClickCount') + 1);
    }
  });
  ```

  The `mut` helper changes the `totalClicks` value to what was provided as the `fn` argument.

  The `mut` helper, when used with `fn`, will return a function that
  sets the value passed to `mut` to its first argument. As an example, we can create a
  button that increments a value passing the value directly to the `fn`:

  ```handlebars
  {{! inc helper is not provided by Ember }}
  <button onclick={{fn (mut count) (inc count)}}>
    Increment count
  </button>
  ```

  @method mut
  @param {Object} [attr] the "two-way" attribute that can be modified.
  @for Ember.Templates.helpers
  @public
*/

var mut = internalHelper(({
  positional
}) => {
  let ref = positional[0]; // TODO: Improve this error message. This covers at least two distinct
  // cases:
  //
  // 1. (mut "not a path") – passing a literal, result from a helper
  //    invocation, etc
  //
  // 2. (mut receivedValue) – passing a value received from the caller
  //    that was originally derived from a literal, result from a helper
  //    invocation, etc
  //
  // This message is alright for the first case, but could be quite
  // confusing for the second case.

  assert('You can only pass a path to mut', isUpdatableRef(ref));
  return createInvokableRef(ref);
});

/**
@module ember
*/
/**
  This is a helper to be used in conjunction with the link-to helper.
  It will supply url query parameters to the target route.

  @example In this example we are setting the `direction` query param to the value `"asc"`

  ```app/templates/application.hbs
  <LinkTo
    @route="posts"
    {{query-params direction="asc"}}
  >
    Sort
  </LinkTo>
  ```

  @method query-params
  @for Ember.Templates.helpers
  @param {Object} hash takes a hash of query parameters
  @return {Object} A `QueryParams` object for `{{link-to}}`
  @public
*/

var queryParams = internalHelper(({
  positional,
  named
}) => {
  return createComputeRef(() => {
    assert("The `query-params` helper only accepts hash parameters, e.g. (query-params queryParamPropertyName='foo') as opposed to just (query-params 'foo')", positional.length === 0);
    return new QueryParams(assign({}, reifyNamed(named)));
  });
});

/**
  The `readonly` helper let's you specify that a binding is one-way only,
  instead of two-way.
  When you pass a `readonly` binding from an outer context (e.g. parent component),
  to to an inner context (e.g. child component), you are saying that changing that
  property in the inner context does not change the value in the outer context.

  To specify that a binding is read-only, when invoking the child `Component`:

  ```app/components/my-parent.js
  export default Component.extend({
    totalClicks: 3
  });
  ```

  ```app/templates/components/my-parent.hbs
  {{log totalClicks}} // -> 3
  <MyChild @childClickCount={{readonly totalClicks}} />
  ```
  ```
  {{my-child childClickCount=(readonly totalClicks)}}
  ```

  Now, when you update `childClickCount`:

  ```app/components/my-child.js
  export default Component.extend({
    click() {
      this.incrementProperty('childClickCount');
    }
  });
  ```

  The value updates in the child component, but not the parent component:

  ```app/templates/components/my-child.hbs
  {{log childClickCount}} //-> 4
  ```

  ```app/templates/components/my-parent.hbs
  {{log totalClicks}} //-> 3
  <MyChild @childClickCount={{readonly totalClicks}} />
  ```
  or
  ```app/templates/components/my-parent.hbs
  {{log totalClicks}} //-> 3
  {{my-child childClickCount=(readonly totalClicks)}}
  ```

  ### Objects and Arrays

  When passing a property that is a complex object (e.g. object, array) instead of a primitive object (e.g. number, string),
  only the reference to the object is protected using the readonly helper.
  This means that you can change properties of the object both on the parent component, as well as the child component.
  The `readonly` binding behaves similar to the `const` keyword in JavaScript.

  Let's look at an example:

  First let's set up the parent component:

  ```app/components/my-parent.js
  import Component from '@ember/component';

  export default Component.extend({
    clicks: null,

    init() {
      this._super(...arguments);
      this.set('clicks', { total: 3 });
    }
  });
  ```

  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 3
  <MyChild @childClicks={{readonly clicks}} />
  ```
  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 3
  {{my-child childClicks=(readonly clicks)}}
  ```

  Now, if you update the `total` property of `childClicks`:

  ```app/components/my-child.js
  import Component from '@ember/component';

  export default Component.extend({
    click() {
      this.get('clicks').incrementProperty('total');
    }
  });
  ```

  You will see the following happen:

  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 4
  <MyChild @childClicks={{readonly clicks}} />
  ```
  or
  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 4
  {{my-child childClicks=(readonly clicks)}}
  ```

  ```app/templates/components/my-child.hbs
  {{log childClicks.total}} //-> 4
  ```

  @method readonly
  @param {Object} [attr] the read-only attribute.
  @for Ember.Templates.helpers
  @private
*/

var readonly = internalHelper(({
  positional
}) => {
  return createReadOnlyRef(positional[0]);
});

/**
@module ember
*/
/**
  The `{{unbound}}` helper disconnects the one-way binding of a property,
  essentially freezing its value at the moment of rendering. For example,
  in this example the display of the variable `name` will not change even
  if it is set with a new value:

  ```handlebars
  {{unbound this.name}}
  ```

  Like any helper, the `unbound` helper can accept a nested helper expression.
  This allows for custom helpers to be rendered unbound:

  ```handlebars
  {{unbound (some-custom-helper)}}
  {{unbound (capitalize this.name)}}
  {{! You can use any helper, including unbound, in a nested expression }}
  {{capitalize (unbound this.name)}}
  ```

  The `unbound` helper only accepts a single argument, and it return an
  unbound value.

  @method unbound
  @for Ember.Templates.helpers
  @public
*/

var unbound = internalHelper(({
  positional,
  named
}) => {
  assert('unbound helper cannot be called with multiple params or hash params', positional.length === 1 && Object.keys(named).length === 0);
  return createUnboundRef(valueForRef(positional[0]), '(resurt of an `unbound` helper)');
});

const MODIFIERS = ['alt', 'shift', 'meta', 'ctrl'];
const POINTER_EVENT_TYPE_REGEX = /^click|mouse|touch/;

function isAllowedEvent(event, allowedKeys) {
  if (allowedKeys === null || allowedKeys === undefined) {
    if (POINTER_EVENT_TYPE_REGEX.test(event.type)) {
      return isSimpleClick(event);
    } else {
      allowedKeys = '';
    }
  }

  if (allowedKeys.indexOf('any') >= 0) {
    return true;
  }

  for (let i = 0; i < MODIFIERS.length; i++) {
    if (event[MODIFIERS[i] + 'Key'] && allowedKeys.indexOf(MODIFIERS[i]) === -1) {
      return false;
    }
  }

  return true;
}

let ActionHelper = {
  // registeredActions is re-exported for compatibility with older plugins
  // that were using this undocumented API.
  registeredActions: ActionManager.registeredActions,

  registerAction(actionState) {
    let {
      actionId
    } = actionState;
    ActionManager.registeredActions[actionId] = actionState;
    return actionId;
  },

  unregisterAction(actionState) {
    let {
      actionId
    } = actionState;
    delete ActionManager.registeredActions[actionId];
  }

};
class ActionState {
  constructor(element, actionId, actionArgs, namedArgs, positionalArgs) {
    this.tag = createUpdatableTag();
    this.element = element;
    this.actionId = actionId;
    this.actionArgs = actionArgs;
    this.namedArgs = namedArgs;
    this.positional = positionalArgs;
    this.eventName = this.getEventName();
    registerDestructor(this, () => ActionHelper.unregisterAction(this));
  }

  getEventName() {
    let {
      on: on$$1
    } = this.namedArgs;
    return on$$1 !== undefined ? valueForRef(on$$1) : 'click';
  }

  getActionArgs() {
    let result = new Array(this.actionArgs.length);

    for (let i = 0; i < this.actionArgs.length; i++) {
      result[i] = valueForRef(this.actionArgs[i]);
    }

    return result;
  }

  getTarget() {
    let {
      implicitTarget,
      namedArgs
    } = this;
    let {
      target
    } = namedArgs;
    return target !== undefined ? valueForRef(target) : valueForRef(implicitTarget);
  }

  handler(event) {
    let {
      actionName,
      namedArgs
    } = this;
    let {
      bubbles,
      preventDefault,
      allowedKeys
    } = namedArgs;
    let bubblesVal = bubbles !== undefined ? valueForRef(bubbles) : undefined;
    let preventDefaultVal = preventDefault !== undefined ? valueForRef(preventDefault) : undefined;
    let allowedKeysVal = allowedKeys !== undefined ? valueForRef(allowedKeys) : undefined;
    let target = this.getTarget();
    let shouldBubble = bubblesVal !== false;

    if (!isAllowedEvent(event, allowedKeysVal)) {
      return true;
    }

    if (preventDefaultVal !== false) {
      event.preventDefault();
    }

    if (!shouldBubble) {
      event.stopPropagation();
    }

    join(() => {
      let args = this.getActionArgs();
      let payload = {
        args,
        target,
        name: null
      };

      if (typeof actionName[INVOKE] === 'function') {
        deprecate(`Usage of the private INVOKE API to make an object callable via action or fn is no longer supported. Please update to pass in a callback function instead. Received: ${String(actionName)}`, false, {
          until: '3.25.0',
          id: 'actions.custom-invoke-invokable',
          for: 'ember-source',
          since: {
            enabled: '3.23.0-beta.1'
          }
        });
        flaggedInstrument('interaction.ember-action', payload, () => {
          actionName[INVOKE].apply(actionName, args);
        });
        return;
      }

      if (isInvokableRef(actionName)) {
        flaggedInstrument('interaction.ember-action', payload, () => {
          updateRef(actionName, args[0]);
        });
        return;
      }

      if (typeof actionName === 'function') {
        flaggedInstrument('interaction.ember-action', payload, () => {
          actionName.apply(target, args);
        });
        return;
      }

      payload.name = actionName;

      if (target.send) {
        flaggedInstrument('interaction.ember-action', payload, () => {
          target.send.apply(target, [actionName, ...args]);
        });
      } else {
        assert(`The action '${actionName}' did not exist on ${target}`, typeof target[actionName] === 'function');
        flaggedInstrument('interaction.ember-action', payload, () => {
          target[actionName].apply(target, args);
        });
      }
    });
    return shouldBubble;
  }

}

class ActionModifierManager {
  create(_owner, element, _state, {
    named,
    positional
  }) {
    let actionArgs = []; // The first two arguments are (1) `this` and (2) the action name.
    // Everything else is a param.

    for (let i = 2; i < positional.length; i++) {
      actionArgs.push(positional[i]);
    }

    let actionId = uuid();
    let actionState = new ActionState(element, actionId, actionArgs, named, positional);
    deprecate(`Using the \`{{action}}\` modifier with \`${actionState.eventName}\` events has been deprecated.`, actionState.eventName !== 'mouseEnter' && actionState.eventName !== 'mouseLeave' && actionState.eventName !== 'mouseMove', {
      id: 'ember-views.event-dispatcher.mouseenter-leave-move',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_action-mouseenter-leave-move',
      for: 'ember-source',
      since: {
        enabled: '3.13.0-beta.1'
      }
    });
    return actionState;
  }

  getDebugName() {
    return 'action';
  }

  install(actionState) {
    let {
      element,
      actionId,
      positional
    } = actionState;
    let actionName;
    let actionNameRef;
    let implicitTarget;

    if (positional.length > 1) {
      implicitTarget = positional[0];
      actionNameRef = positional[1];

      if (isInvokableRef(actionNameRef)) {
        actionName = actionNameRef;
      } else {
        actionName = valueForRef(actionNameRef);

        if (DEBUG) {
          let actionPath = actionNameRef.debugLabel;
          let actionPathParts = actionPath.split('.');
          let actionLabel = actionPathParts[actionPathParts.length - 1];
          assert('You specified a quoteless path, `' + actionPath + '`, to the ' + '{{action}} helper which did not resolve to an action name (a ' + 'string). Perhaps you meant to use a quoted actionName? (e.g. ' + '{{action "' + actionLabel + '"}}).', typeof actionName === 'string' || typeof actionName === 'function');
        }
      }
    }

    actionState.actionName = actionName;
    actionState.implicitTarget = implicitTarget;
    ActionHelper.registerAction(actionState);
    element.setAttribute('data-ember-action', '');
    element.setAttribute(`data-ember-action-${actionId}`, String(actionId));
  }

  update(actionState) {
    let {
      positional
    } = actionState;
    let actionNameRef = positional[1];

    if (!isInvokableRef(actionNameRef)) {
      actionState.actionName = valueForRef(actionNameRef);
    }

    actionState.eventName = actionState.getEventName();
  }

  getTag(actionState) {
    return actionState.tag;
  }

  getDestroyable(actionState) {
    return actionState;
  }

}

const ACTION_MODIFIER_MANAGER = new ActionModifierManager();
var actionModifier = setInternalModifierManager(ACTION_MODIFIER_MANAGER, {});

const CAPABILITIES$2 = {
  dynamicLayout: true,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  createCaller: true,
  dynamicScope: true,
  updateHook: true,
  createInstance: true,
  wrapped: false,
  willDestroy: false,
  hasSubOwner: true
};

class MountManager {
  getDynamicLayout(state) {
    let templateFactory$$1 = state.engine.lookup('template:application');
    return unwrapTemplate(templateFactory$$1(state.engine)).asLayout();
  }

  getCapabilities() {
    return CAPABILITIES$2;
  }

  getOwner(state) {
    return state.engine;
  }

  create(owner, {
    name
  }, args, env) {
    // TODO
    // mount is a runtime helper, this shouldn't use dynamic layout
    // we should resolve the engine app template in the helper
    // it also should use the owner that looked up the mount helper.
    let engine = owner.buildChildEngineInstance(name);
    engine.boot();
    let applicationFactory = engine.factoryFor(`controller:application`);
    let controllerFactory = applicationFactory || generateControllerFactory(engine, 'application');
    let controller;
    let self;
    let bucket;
    let modelRef;

    if (args.named.has('model')) {
      modelRef = args.named.get('model');
    }

    if (modelRef === undefined) {
      controller = controllerFactory.create();
      self = createConstRef(controller, 'this');
      bucket = {
        engine,
        controller,
        self,
        modelRef
      };
    } else {
      let model = valueForRef(modelRef);
      controller = controllerFactory.create({
        model
      });
      self = createConstRef(controller, 'this');
      bucket = {
        engine,
        controller,
        self,
        modelRef
      };
    }

    if (env.debugRenderTree) {
      associateDestroyableChild(engine, controller);
    }

    return bucket;
  }

  getDebugName({
    name
  }) {
    return name;
  }

  getDebugCustomRenderTree(definition, state, args, templateModuleName) {
    return [{
      bucket: state.engine,
      instance: state.engine,
      type: 'engine',
      name: definition.name,
      args
    }, {
      bucket: state.controller,
      instance: state.controller,
      type: 'route-template',
      name: 'application',
      args,
      template: templateModuleName
    }];
  }

  getSelf({
    self
  }) {
    return self;
  }

  getDestroyable(bucket) {
    return bucket.engine;
  }

  didCreate() {}

  didUpdate() {}

  didRenderLayout() {}

  didUpdateLayout() {}

  update(bucket) {
    let {
      controller,
      modelRef
    } = bucket;

    if (modelRef !== undefined) {
      controller.set('model', valueForRef(modelRef));
    }
  }

}

const MOUNT_MANAGER = new MountManager();
class MountDefinition {
  constructor(resolvedName) {
    this.resolvedName = resolvedName; // handle is not used by this custom definition

    this.handle = -1;
    this.manager = MOUNT_MANAGER;
    this.compilable = null;
    this.capabilities = capabilityFlagsFrom(CAPABILITIES$2);
    this.state = {
      name: resolvedName
    };
  }

}

/**
  The `{{mount}}` helper lets you embed a routeless engine in a template.
  Mounting an engine will cause an instance to be booted and its `application`
  template to be rendered.

  For example, the following template mounts the `ember-chat` engine:

  ```handlebars
  {{! application.hbs }}
  {{mount "ember-chat"}}
  ```

  Additionally, you can also pass in a `model` argument that will be
  set as the engines model. This can be an existing object:

  ```
  <div>
    {{mount 'admin' model=userSettings}}
  </div>
  ```

  Or an inline `hash`, and you can even pass components:

  ```
  <div>
    <h1>Application template!</h1>
    {{mount 'admin' model=(hash
        title='Secret Admin'
        signInButton=(component 'sign-in-button')
    )}}
  </div>
  ```

  @method mount
  @param {String} name Name of the engine to mount.
  @param {Object} [model] Object that will be set as
                          the model of the engine.
  @for Ember.Templates.helpers
  @public
*/

const mountHelper = internalHelper((args, owner) => {
  assert('{{mount}} must be used within a component that has an owner', owner);
  let nameRef = args.positional[0];
  let captured;
  assert('You can only pass a single positional argument to the {{mount}} helper, e.g. {{mount "chat-engine"}}.', args.positional.length === 1);

  if (DEBUG && args.named) {
    let keys = Object.keys(args.named);
    let extra = keys.filter(k => k !== 'model');
    assert('You can only pass a `model` argument to the {{mount}} helper, ' + 'e.g. {{mount "profile-engine" model=this.profile}}. ' + `You passed ${extra.join(',')}.`, extra.length === 0);
  }

  captured = createCapturedArgs(args.named, EMPTY_POSITIONAL);
  let lastName, lastDef;
  return createComputeRef(() => {
    let name = valueForRef(nameRef);

    if (typeof name === 'string') {
      if (lastName === name) {
        return lastDef;
      }

      assert(`You used \`{{mount '${name}'}}\`, but the engine '${name}' can not be found.`, owner.hasRegistration(`engine:${name}`));
      lastName = name;
      lastDef = curry(0
      /* Component */
      , new MountDefinition(name), owner, captured, true);
      return lastDef;
    } else {
      assert(`Invalid engine name '${name}' specified, engine name must be either a string, null or undefined.`, name === null || name === undefined);
      lastDef = null;
      lastName = null;
      return null;
    }
  });
});

/**
  The `{{outlet}}` helper lets you specify where a child route will render in
  your template. An important use of the `{{outlet}}` helper is in your
  application's `application.hbs` file:

  ```app/templates/application.hbs
  <MyHeader />

  <div class="my-dynamic-content">
    <!-- this content will change based on the current route, which depends on the current URL -->
    {{outlet}}
  </div>

  <MyFooter />
  ```

  You may also specify a name for the `{{outlet}}`, which is useful when using more than one
  `{{outlet}}` in a template:

  ```app/templates/application.hbs
  {{outlet "menu"}}
  {{outlet "sidebar"}}
  {{outlet "main"}}
  ```

  Your routes can then render into a specific one of these `outlet`s by specifying the `outlet`
  attribute in your `renderTemplate` function:

  ```app/routes/menu.js
  import Route from '@ember/routing/route';

  export default class MenuRoute extends Route {
    renderTemplate() {
      this.render({ outlet: 'menu' });
    }
  }
  ```

  See the [routing guide](https://guides.emberjs.com/release/routing/rendering-a-template/) for more
  information on how your `route` interacts with the `{{outlet}}` helper.
  Note: Your content __will not render__ if there isn't an `{{outlet}}` for it.

  @method outlet
  @param {String} [name]
  @for Ember.Templates.helpers
  @public
*/

const outletHelper = internalHelper((args, owner, scope) => {
  assert('Expected owner to be present, {{outlet}} requires an owner', owner);
  assert('Expected dynamic scope to be present. You may have attempted to use the {{outlet}} keyword dynamically. This keyword cannot be used dynamically.', scope);
  let nameRef;

  if (args.positional.length === 0) {
    nameRef = createPrimitiveRef('main');
  } else {
    nameRef = args.positional[0];
  }

  let outletRef = createComputeRef(() => {
    let state = valueForRef(scope.get('outletState'));
    let outlets = state !== undefined ? state.outlets : undefined;
    return outlets !== undefined ? outlets[valueForRef(nameRef)] : undefined;
  });
  let lastState = null;
  let definition = null;
  return createComputeRef(() => {
    var _a, _b;

    let outletState = valueForRef(outletRef);
    let state = stateFor(outletRef, outletState);

    if (!validate(state, lastState)) {
      lastState = state;

      if (state !== null) {
        let named = dict();
        named.model = childRefFromParts(outletRef, ['render', 'model']);

        if (DEBUG) {
          named.model = createDebugAliasRef('@model', named.model);
        }

        let args = createCapturedArgs(named, EMPTY_POSITIONAL);
        definition = curry(0
        /* Component */
        , new OutletComponentDefinition(state), (_b = (_a = outletState === null || outletState === void 0 ? void 0 : outletState.render) === null || _a === void 0 ? void 0 : _a.owner) !== null && _b !== void 0 ? _b : owner, args, true);
      } else {
        definition = null;
      }
    }

    return definition;
  });
});

function stateFor(ref, outlet) {
  if (outlet === undefined) return null;
  let render = outlet.render;
  if (render === undefined) return null;
  let template = render.template;
  if (template === undefined) return null; // this guard can be removed once @ember/test-helpers@1.6.0 has "aged out"
  // and is no longer considered supported

  if (isTemplateFactory(template)) {
    template = template(render.owner);
  }

  return {
    ref,
    name: render.name,
    outlet: render.outlet,
    template,
    controller: render.controller,
    model: render.model
  };
}

function validate(state, lastState) {
  if (state === null) {
    return lastState === null;
  }

  if (lastState === null) {
    return false;
  }

  return state.template === lastState.template && state.controller === lastState.controller;
}

function instrumentationPayload$1(name) {
  return {
    object: `component:${name}`
  };
}

function componentFor(name, owner, options) {
  let fullName = `component:${name}`;
  return owner.factoryFor(fullName, options) || null;
}

function layoutFor(name, owner, options) {
  let templateFullName = `template:components/${name}`;
  return owner.lookup(templateFullName, options) || null;
}

function lookupComponentPair(owner, name, options) {
  let component = componentFor(name, owner, options);

  if (component !== null && component.class !== undefined) {
    let layout = getComponentTemplate(component.class);

    if (layout !== undefined) {
      return {
        component,
        layout
      };
    }
  }

  let layout = layoutFor(name, owner, options);

  if (component === null && layout === null) {
    return null;
  } else {
    return {
      component,
      layout
    };
  }
}

let lookupPartial;
let templateFor;
let parseUnderscoredName;

if (PARTIALS) {
  lookupPartial = function (templateName, owner) {
    deprecate(`The use of \`{{partial}}\` is deprecated, please refactor the "${templateName}" partial to a component`, false, {
      id: 'ember-views.partial',
      until: '4.0.0',
      url: 'https://deprecations.emberjs.com/v3.x#toc_ember-views-partial',
      for: 'ember-source',
      since: {
        enabled: '3.15.0-beta.1'
      }
    });

    if (templateName === null) {
      return;
    }

    let template = templateFor(owner, parseUnderscoredName(templateName), templateName);
    assert(`Unable to find partial with name "${templateName}"`, Boolean(template));
    return template;
  };

  templateFor = function (owner, underscored, name) {
    if (PARTIALS) {
      if (!name) {
        return;
      }

      assert(`templateNames are not allowed to contain periods: ${name}`, name.indexOf('.') === -1);

      if (!owner) {
        throw new EmberError('Container was not found when looking up a views template. ' + 'This is most likely due to manually instantiating an Ember.View. ' + 'See: http://git.io/EKPpnA');
      }

      return owner.lookup(`template:${underscored}`) || owner.lookup(`template:${name}`);
    }
  };

  parseUnderscoredName = function (templateName) {
    let nameParts = templateName.split('/');
    let lastPart = nameParts[nameParts.length - 1];
    nameParts[nameParts.length - 1] = `_${lastPart}`;
    return nameParts.join('/');
  };
}

const BUILTIN_KEYWORD_HELPERS = {
  action,
  mut,
  readonly,
  unbound,
  'query-params': queryParams,
  '-hash': hash,
  '-each-in': eachIn,
  '-normalize-class': normalizeClassHelper,
  '-track-array': trackArray,
  '-mount': mountHelper,
  '-outlet': outletHelper,
  '-in-el-null': inElementNullCheckHelper
};
const BUILTIN_HELPERS = Object.assign(Object.assign({}, BUILTIN_KEYWORD_HELPERS), {
  array,
  concat,
  fn,
  get: get$1,
  hash
});
const BUILTIN_KEYWORD_MODIFIERS = {
  action: actionModifier
};
const BUILTIN_MODIFIERS = Object.assign(Object.assign({}, BUILTIN_KEYWORD_MODIFIERS), {
  on
});
const CLASSIC_HELPER_MANAGER_ASSOCIATED = new _WeakSet();
class ResolverImpl {
  constructor() {
    this.componentDefinitionCache = new Map();
  }

  lookupPartial(name, owner) {
    if (PARTIALS) {
      let templateFactory$$1 = lookupPartial(name, owner);
      let template = templateFactory$$1(owner);
      return new PartialDefinitionImpl(name, template);
    } else {
      return null;
    }
  }

  lookupHelper(name, owner) {
    assert(`You attempted to overwrite the built-in helper "${name}" which is not allowed. Please rename the helper.`, !(BUILTIN_HELPERS[name] && owner.hasRegistration(`helper:${name}`)));
    const helper$$1 = BUILTIN_HELPERS[name];

    if (helper$$1 !== undefined) {
      return helper$$1;
    }

    const factory = owner.factoryFor(`helper:${name}`);

    if (factory === undefined) {
      return null;
    }

    let definition = factory.class;

    if (definition === undefined) {
      return null;
    }

    if (typeof definition === 'function' && isClassicHelper(definition)) {
      // For classic class based helpers, we need to pass the factoryFor result itself rather
      // than the raw value (`factoryFor(...).class`). This is because injections are already
      // bound in the factoryFor result, including type-based injections
      if (DEBUG) {
        // In DEBUG we need to only set the associated value once, otherwise
        // we'll trigger an assertion
        if (!CLASSIC_HELPER_MANAGER_ASSOCIATED.has(factory)) {
          CLASSIC_HELPER_MANAGER_ASSOCIATED.add(factory);
          setInternalHelperManager(CLASSIC_HELPER_MANAGER, factory);
        }
      } else {
        setInternalHelperManager(CLASSIC_HELPER_MANAGER, factory);
      }

      return factory;
    }

    return definition;
  }

  lookupBuiltInHelper(name) {
    var _a;

    return (_a = BUILTIN_KEYWORD_HELPERS[name]) !== null && _a !== void 0 ? _a : null;
  }

  lookupModifier(name, owner) {
    let builtin = BUILTIN_MODIFIERS[name];

    if (builtin !== undefined) {
      return builtin;
    }

    let modifier = owner.factoryFor(`modifier:${name}`);

    if (modifier === undefined) {
      return null;
    }

    return modifier.class || null;
  }

  lookupBuiltInModifier(name) {
    var _a;

    return (_a = BUILTIN_KEYWORD_MODIFIERS[name]) !== null && _a !== void 0 ? _a : null;
  }

  lookupComponent(name, owner) {
    let pair = lookupComponentPair(owner, name);

    if (pair === null) {
      assert('Could not find component `<TextArea />` (did you mean `<Textarea />`?)', name !== 'text-area');
      return null;
    }

    let template = null;
    let key;

    if (pair.component === null) {
      key = template = pair.layout(owner);
    } else {
      key = pair.component;
    }

    let cachedComponentDefinition = this.componentDefinitionCache.get(key);

    if (cachedComponentDefinition !== undefined) {
      return cachedComponentDefinition;
    }

    if (template === null && pair.layout !== null) {
      template = pair.layout(owner);
    }

    let finalizer = _instrumentStart('render.getComponentDefinition', instrumentationPayload$1, name);

    let definition = null;

    if (pair.component === null) {
      if (ENV._TEMPLATE_ONLY_GLIMMER_COMPONENTS) {
        definition = {
          state: templateOnlyComponent(undefined, name),
          manager: TEMPLATE_ONLY_COMPONENT_MANAGER,
          template
        };
      } else {
        let factory = owner.factoryFor(privatize`component:-default`);
        let manager = getInternalComponentManager(factory.class);
        definition = {
          state: factory,
          manager,
          template
        };
      }
    } else {
      assert(`missing component class ${name}`, pair.component.class !== undefined);
      let factory = pair.component;
      let ComponentClass = factory.class;
      let manager = getInternalComponentManager(ComponentClass);
      definition = {
        state: isCurlyManager(manager) ? factory : ComponentClass,
        manager,
        template
      };
    }

    finalizer();
    this.componentDefinitionCache.set(key, definition);
    assert('Could not find component `<TextArea />` (did you mean `<Textarea />`?)', !(definition === null && name === 'text-area'));
    return definition;
  }

}

class DynamicScope {
  constructor(view, outletState) {
    this.view = view;
    this.outletState = outletState;
  }

  child() {
    return new DynamicScope(this.view, this.outletState);
  }

  get(key) {
    // tslint:disable-next-line:max-line-length
    assert(`Using \`-get-dynamic-scope\` is only supported for \`outletState\` (you used \`${key}\`).`, key === 'outletState');
    return this.outletState;
  }

  set(key, value) {
    // tslint:disable-next-line:max-line-length
    assert(`Using \`-with-dynamic-scope\` is only supported for \`outletState\` (you used \`${key}\`).`, key === 'outletState');
    this.outletState = value;
    return value;
  }

} // This wrapper logic prevents us from rerendering in case of a hard failure
// during render. This prevents infinite revalidation type loops from occuring,
// and ensures that errors are not swallowed by subsequent follow on failures.

function errorLoopTransaction(fn$$1) {
  if (DEBUG) {
    return () => {
      let didError = true;

      try {
        fn$$1();
        didError = false;
      } finally {
        if (didError) {
          // Noop the function so that we won't keep calling it and causing
          // infinite looping failures;
          fn$$1 = () => {
            console.warn('Attempted to rerender, but the Ember application has had an unrecoverable error occur during render. You should reload the application after fixing the cause of the error.');
          };
        }
      }
    };
  } else {
    return fn$$1;
  }
}

class RootState {
  constructor(root, runtime, context, owner, template, self, parentElement, dynamicScope, builder) {
    this.root = root;
    this.runtime = runtime;
    assert(`You cannot render \`${valueForRef(self)}\` without a template.`, template !== undefined);
    this.id = getViewId(root);
    this.result = undefined;
    this.destroyed = false;
    this.render = errorLoopTransaction(() => {
      let layout = unwrapTemplate(template).asLayout();
      let iterator = renderMain(runtime, context, owner, self, builder(runtime.env, {
        element: parentElement,
        nextSibling: null
      }), layout, dynamicScope);
      let result = this.result = iterator.sync(); // override .render function after initial render

      this.render = errorLoopTransaction(() => result.rerender({
        alwaysRevalidate: false
      }));
    });
  }

  isFor(possibleRoot) {
    return this.root === possibleRoot;
  }

  destroy() {
    let {
      result,
      runtime: {
        env
      }
    } = this;
    this.destroyed = true;
    this.runtime = undefined;
    this.root = null;
    this.result = undefined;
    this.render = undefined;

    if (result !== undefined) {
      /*
       Handles these scenarios:
              * When roots are removed during standard rendering process, a transaction exists already
         `.begin()` / `.commit()` are not needed.
       * When roots are being destroyed manually (`component.append(); component.destroy() case), no
         transaction exists already.
       * When roots are being destroyed during `Renderer#destroy`, no transaction exists
              */
      inTransaction(env, () => destroy(result));
    }
  }

}

const renderers = [];
function _resetRenderers() {
  renderers.length = 0;
}

function register(renderer) {
  assert('Cannot register the same renderer twice', renderers.indexOf(renderer) === -1);
  renderers.push(renderer);
}

function deregister(renderer) {
  let index = renderers.indexOf(renderer);
  assert('Cannot deregister unknown unregistered renderer', index !== -1);
  renderers.splice(index, 1);
}

function loopBegin() {
  for (let i = 0; i < renderers.length; i++) {
    renderers[i]._scheduleRevalidate();
  }
}

function K() {
  /* noop */
}

let renderSettledDeferred = null;
/*
  Returns a promise which will resolve when rendering has settled. Settled in
  this context is defined as when all of the tags in use are "current" (e.g.
  `renderers.every(r => r._isValid())`). When this is checked at the _end_ of
  the run loop, this essentially guarantees that all rendering is completed.

  @method renderSettled
  @returns {Promise<void>} a promise which fulfills when rendering has settled
*/

function renderSettled() {
  if (renderSettledDeferred === null) {
    renderSettledDeferred = RSVP.defer(); // if there is no current runloop, the promise created above will not have
    // a chance to resolve (because its resolved in backburner's "end" event)

    if (!getCurrentRunLoop()) {
      // ensure a runloop has been kicked off
      backburner.schedule('actions', null, K);
    }
  }

  return renderSettledDeferred.promise;
}

function resolveRenderPromise() {
  if (renderSettledDeferred !== null) {
    let resolve = renderSettledDeferred.resolve;
    renderSettledDeferred = null;
    backburner.join(null, resolve);
  }
}

let loops = 0;

function loopEnd() {
  for (let i = 0; i < renderers.length; i++) {
    if (!renderers[i]._isValid()) {
      if (loops > ENV._RERENDER_LOOP_LIMIT) {
        loops = 0; // TODO: do something better

        renderers[i].destroy();
        throw new Error('infinite rendering invalidation detected');
      }

      loops++;
      return backburner.join(null, K);
    }
  }

  loops = 0;
  resolveRenderPromise();
}

backburner.on('begin', loopBegin);
backburner.on('end', loopEnd);
class Renderer {
  constructor(owner, document, env, rootTemplate, viewRegistry, builder = clientBuilder) {
    this._inRenderTransaction = false;
    this._lastRevision = -1;
    this._destroyed = false;
    this._owner = owner;
    this._rootTemplate = rootTemplate(owner);
    this._viewRegistry = viewRegistry;
    this._roots = [];
    this._removedRoots = [];
    this._builder = builder;
    this._isInteractive = env.isInteractive; // resolver is exposed for tests

    let resolver = this._runtimeResolver = new ResolverImpl();
    let sharedArtifacts = artifacts();
    this._context = programCompilationContext(sharedArtifacts, resolver);
    let runtimeEnvironmentDelegate = new EmberEnvironmentDelegate(owner, env.isInteractive);
    this._runtime = runtimeContext({
      appendOperations: env.hasDOM ? new DOMTreeConstruction(document) : new NodeDOMTreeConstruction(document),
      updateOperations: new DOMChanges(document)
    }, runtimeEnvironmentDelegate, sharedArtifacts, resolver);
  }

  static create(props) {
    let {
      document,
      env,
      rootTemplate,
      _viewRegistry,
      builder
    } = props;
    return new this(getOwner(props), document, env, rootTemplate, _viewRegistry, builder);
  }

  get debugRenderTree() {
    let {
      debugRenderTree
    } = this._runtime.env;
    assert('Attempted to access the DebugRenderTree, but it did not exist. Is the Ember Inspector open?', debugRenderTree);
    return debugRenderTree;
  } // renderer HOOKS


  appendOutletView(view, target) {
    let definition = createRootOutlet(view);

    this._appendDefinition(view, curry(0
    /* Component */
    , definition, view.owner, null, true), target);
  }

  appendTo(view, target) {
    let definition = new RootComponentDefinition(view);

    this._appendDefinition(view, curry(0
    /* Component */
    , definition, this._owner, null, true), target);
  }

  _appendDefinition(root, definition, target) {
    let self = createConstRef(definition, 'this');
    let dynamicScope = new DynamicScope(null, UNDEFINED_REFERENCE);
    let rootState = new RootState(root, this._runtime, this._context, this._owner, this._rootTemplate, self, target, dynamicScope, this._builder);

    this._renderRoot(rootState);
  }

  rerender() {
    this._scheduleRevalidate();
  }

  register(view) {
    let id = getViewId(view);
    assert('Attempted to register a view with an id already in use: ' + id, !this._viewRegistry[id]);
    this._viewRegistry[id] = view;
  }

  unregister(view) {
    delete this._viewRegistry[getViewId(view)];
  }

  remove(view) {
    view._transitionTo('destroying');

    this.cleanupRootFor(view);

    if (this._isInteractive) {
      view.trigger('didDestroyElement');
    }
  }

  cleanupRootFor(view) {
    // no need to cleanup roots if we have already been destroyed
    if (this._destroyed) {
      return;
    }

    let roots = this._roots; // traverse in reverse so we can remove items
    // without mucking up the index

    let i = this._roots.length;

    while (i--) {
      let root = roots[i];

      if (root.isFor(view)) {
        root.destroy();
        roots.splice(i, 1);
      }
    }
  }

  destroy() {
    if (this._destroyed) {
      return;
    }

    this._destroyed = true;

    this._clearAllRoots();
  }

  getElement(view) {
    if (this._isInteractive) {
      return getViewElement(view);
    } else {
      throw new Error('Accessing `this.element` is not allowed in non-interactive environments (such as FastBoot).');
    }
  }

  getBounds(view) {
    let bounds = view[BOUNDS];
    assert('object passed to getBounds must have the BOUNDS symbol as a property', Boolean(bounds));
    let parentElement = bounds.parentElement();
    let firstNode = bounds.firstNode();
    let lastNode = bounds.lastNode();
    return {
      parentElement,
      firstNode,
      lastNode
    };
  }

  createElement(tagName) {
    return this._runtime.env.getAppendOperations().createElement(tagName);
  }

  _renderRoot(root) {
    let {
      _roots: roots
    } = this;
    roots.push(root);

    if (roots.length === 1) {
      register(this);
    }

    this._renderRootsTransaction();
  }

  _renderRoots() {
    let {
      _roots: roots,
      _runtime: runtime,
      _removedRoots: removedRoots
    } = this;
    let initialRootsLength;

    do {
      initialRootsLength = roots.length;
      inTransaction(runtime.env, () => {
        // ensure that for the first iteration of the loop
        // each root is processed
        for (let i = 0; i < roots.length; i++) {
          let root = roots[i];

          if (root.destroyed) {
            // add to the list of roots to be removed
            // they will be removed from `this._roots` later
            removedRoots.push(root); // skip over roots that have been marked as destroyed

            continue;
          } // when processing non-initial reflush loops,
          // do not process more roots than needed


          if (i >= initialRootsLength) {
            continue;
          }

          root.render();
        }

        this._lastRevision = valueForTag(CURRENT_TAG);
      });
    } while (roots.length > initialRootsLength); // remove any roots that were destroyed during this transaction


    while (removedRoots.length) {
      let root = removedRoots.pop();
      let rootIndex = roots.indexOf(root);
      roots.splice(rootIndex, 1);
    }

    if (this._roots.length === 0) {
      deregister(this);
    }
  }

  _renderRootsTransaction() {
    if (this._inRenderTransaction) {
      // currently rendering roots, a new root was added and will
      // be processed by the existing _renderRoots invocation
      return;
    } // used to prevent calling _renderRoots again (see above)
    // while we are actively rendering roots


    this._inRenderTransaction = true;
    let completedWithoutError = false;

    try {
      this._renderRoots();

      completedWithoutError = true;
    } finally {
      if (!completedWithoutError) {
        this._lastRevision = valueForTag(CURRENT_TAG);
      }

      this._inRenderTransaction = false;
    }
  }

  _clearAllRoots() {
    let roots = this._roots;

    for (let i = 0; i < roots.length; i++) {
      let root = roots[i];
      root.destroy();
    }

    this._removedRoots.length = 0;
    this._roots = []; // if roots were present before destroying
    // deregister this renderer instance

    if (roots.length) {
      deregister(this);
    }
  }

  _scheduleRevalidate() {
    backburner.scheduleOnce('render', this, this._revalidate);
  }

  _isValid() {
    return this._destroyed || this._roots.length === 0 || validateTag(CURRENT_TAG, this._lastRevision);
  }

  _revalidate() {
    if (this._isValid()) {
      return;
    }

    this._renderRootsTransaction();
  }

}

let TEMPLATES = {};
function setTemplates(templates) {
  TEMPLATES = templates;
}
function getTemplates() {
  return TEMPLATES;
}
function getTemplate(name) {
  if (Object.prototype.hasOwnProperty.call(TEMPLATES, name)) {
    return TEMPLATES[name];
  }
}
function hasTemplate(name) {
  return Object.prototype.hasOwnProperty.call(TEMPLATES, name);
}
function setTemplate(name, template) {
  return TEMPLATES[name] = template;
}

/**
@module ember
*/
/**
  Calls [String.loc](/ember/release/classes/String/methods/loc?anchor=loc) with the
  provided string. This is a convenient way to localize text within a template.
  For example:

  ```javascript
  Ember.STRINGS = {
    '_welcome_': 'Bonjour'
  };
  ```

  ```handlebars
  <div class='message'>
    {{loc '_welcome_'}}
  </div>
  ```

  ```html
  <div class='message'>
    Bonjour
  </div>
  ```

  See [String.loc](/ember/release/classes/String/methods/loc?anchor=loc) for how to
  set up localized string references.

  @method loc
  @for Ember.Templates.helpers
  @param {String} str The string to format.
  @see {String#loc}
  @public
  @deprecated
*/

var loc$1 = helper(function (params) {
  return loc.apply(null, params
  /* let the other side handle errors */
  );
});

var OutletTemplate = templateFactory({
  "id": "3jT+eJpe",
  "block": "[[[46,[28,[37,1],null,null],null,null,null]],[],false,[\"component\",\"-outlet\"]]",
  "moduleName": "packages/@ember/-internals/glimmer/lib/templates/outlet.hbs",
  "isStrictMode": false
});

const TOP_LEVEL_NAME = '-top-level';
const TOP_LEVEL_OUTLET = 'main';
class OutletView {
  constructor(_environment, owner, template) {
    this._environment = _environment;
    this.owner = owner;
    this.template = template;
    let outletStateTag = createTag();
    let outletState = {
      outlets: {
        main: undefined
      },
      render: {
        owner: owner,
        into: undefined,
        outlet: TOP_LEVEL_OUTLET,
        name: TOP_LEVEL_NAME,
        controller: undefined,
        model: undefined,
        template
      }
    };
    let ref = this.ref = createComputeRef(() => {
      consumeTag(outletStateTag);
      return outletState;
    }, state => {
      dirtyTag(outletStateTag);
      outletState.outlets.main = state;
    });
    this.state = {
      ref,
      name: TOP_LEVEL_NAME,
      outlet: TOP_LEVEL_OUTLET,
      template,
      controller: undefined,
      model: undefined
    };
  }

  static extend(injections) {
    return class extends OutletView {
      static create(options) {
        if (options) {
          return super.create(assign({}, injections, options));
        } else {
          return super.create(injections);
        }
      }

    };
  }

  static reopenClass(injections) {
    assign(this, injections);
  }

  static create(options) {
    let {
      _environment,
      template: templateFactory$$1
    } = options;
    let owner = getOwner(options);
    let template = templateFactory$$1(owner);
    return new OutletView(_environment, owner, template);
  }

  appendTo(selector) {
    let target;

    if (this._environment.hasDOM) {
      target = typeof selector === 'string' ? document.querySelector(selector) : selector;
    } else {
      target = selector;
    }

    let renderer = this.owner.lookup('renderer:-dom');
    schedule('render', renderer, 'appendOutletView', this, target);
  }

  rerender() {
    /**/
  }

  setOutletState(state) {
    updateRef(this.ref, state);
  }

  destroy() {
    /**/
  }

}

function setupApplicationRegistry(registry) {
  registry.injection('renderer', 'env', '-environment:main'); // because we are using injections we can't use instantiate false
  // we need to use bind() to copy the function so factory for
  // association won't leak

  registry.register('service:-dom-builder', {
    create({
      bootOptions
    }) {
      let {
        _renderMode
      } = bootOptions;

      switch (_renderMode) {
        case 'serialize':
          return serializeBuilder.bind(null);

        case 'rehydrate':
          return rehydrationBuilder.bind(null);

        default:
          return clientBuilder.bind(null);
      }
    }

  });
  registry.injection('service:-dom-builder', 'bootOptions', '-environment:main');
  registry.injection('renderer', 'builder', 'service:-dom-builder');
  registry.register(privatize`template:-root`, RootTemplate);
  registry.injection('renderer', 'rootTemplate', privatize`template:-root`);
  registry.register('renderer:-dom', Renderer);
  registry.injection('renderer', 'document', 'service:-document');
}
function setupEngineRegistry(registry) {
  registry.optionsForType('template', {
    instantiate: false
  });
  registry.register('view:-outlet', OutletView);
  registry.register('template:-outlet', OutletTemplate);
  registry.injection('view:-outlet', 'template', 'template:-outlet');
  registry.optionsForType('helper', {
    instantiate: false
  });
  registry.register('helper:loc', loc$1);
  registry.register('component:-text-field', TextField);
  registry.register('component:-checkbox', Checkbox);
  registry.register('component:link-to', LinkComponent);
  registry.register('component:input', InputComponent);
  registry.register('component:textarea', TextArea);

  if (!ENV._TEMPLATE_ONLY_GLIMMER_COMPONENTS) {
    registry.register(privatize`component:-default`, Component);
  }
}

function setComponentManager$1(stringOrFunction, obj) {
  let factory;

  if (COMPONENT_MANAGER_STRING_LOOKUP && typeof stringOrFunction === 'string') {
    deprecate('Passing the name of the component manager to "setupComponentManager" is deprecated. Please pass a function that produces an instance of the manager.', false, {
      id: 'deprecate-string-based-component-manager',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x/#toc_component-manager-string-lookup',
      for: 'ember-source',
      since: {
        enabled: '3.8.0'
      }
    });

    factory = function (owner) {
      return owner.lookup(`component-manager:${stringOrFunction}`);
    };
  } else {
    factory = stringOrFunction;
  }

  return setComponentManager(factory, obj);
}

/**
  [Glimmer](https://github.com/tildeio/glimmer) is a templating engine used by Ember.js that is compatible with a subset of the [Handlebars](http://handlebarsjs.com/) syntax.

  ### Showing a property

  Templates manage the flow of an application's UI, and display state (through
  the DOM) to a user. For example, given a component with the property "name",
  that component's template can use the name in several ways:

  ```app/components/person-profile.js
  import Component from '@ember/component';

  export default Component.extend({
    name: 'Jill'
  });
  ```

  ```app/components/person-profile.hbs
  {{this.name}}
  <div>{{this.name}}</div>
  <span data-name={{this.name}}></span>
  ```

  Any time the "name" property on the component changes, the DOM will be
  updated.

  Properties can be chained as well:

  ```handlebars
  {{@aUserModel.name}}
  <div>{{@listOfUsers.firstObject.name}}</div>
  ```

  ### Using Ember helpers

  When content is passed in mustaches `{{}}`, Ember will first try to find a helper
  or component with that name. For example, the `if` helper:

  ```app/components/person-profile.hbs
  {{if this.name "I have a name" "I have no name"}}
  <span data-has-name={{if this.name true}}></span>
  ```

  The returned value is placed where the `{{}}` is called. The above style is
  called "inline". A second style of helper usage is called "block". For example:

  ```handlebars
  {{#if this.name}}
    I have a name
  {{else}}
    I have no name
  {{/if}}
  ```

  The block form of helpers allows you to control how the UI is created based
  on the values of properties.
  A third form of helper is called "nested". For example here the concat
  helper will add " Doe" to a displayed name if the person has no last name:

  ```handlebars
  <span data-name={{concat this.firstName (
    if this.lastName (concat " " this.lastName) "Doe"
  )}}></span>
  ```

  Ember's built-in helpers are described under the [Ember.Templates.helpers](/ember/release/classes/Ember.Templates.helpers)
  namespace. Documentation on creating custom helpers can be found under
  [helper](/ember/release/functions/@ember%2Fcomponent%2Fhelper/helper) (or
  under [Helper](/ember/release/classes/Helper) if a helper requires access to
  dependency injection).

  ### Invoking a Component

  Ember components represent state to the UI of an application. Further
  reading on components can be found under [Component](/ember/release/classes/Component).

  @module @ember/component
  @main @ember/component
  @public
 */

export { RootTemplate, Checkbox, TextField, TextArea, LinkComponent, InputComponent as Input, Component, Helper, helper, SafeString, escapeExpression, htmlSafe, isHTMLSafe$1 as isHTMLSafe, Renderer, _resetRenderers, renderSettled, getTemplate, setTemplate, hasTemplate, getTemplates, setTemplates, setupEngineRegistry, setupApplicationRegistry, INVOKE, OutletView, setComponentManager$1 as setComponentManager };

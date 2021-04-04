import { dict, assign, isSmallInt, debugToString, EMPTY_ARRAY, EMPTY_STRING_ARRAY, encodeImmediate, Stack, encodeHandle, unwrapTemplate } from '@glimmer/util';
import { DEBUG } from '@glimmer/env';
import { $v0, $fp, $s0, $s1, $sp, isMachineOp } from '@glimmer/vm';
import { deprecate } from '@glimmer/global-context';
import { hasCapability } from '@glimmer/manager';
import { InstructionEncoderImpl } from '@glimmer/encoder';

class NamedBlocksImpl {
  constructor(blocks) {
    this.blocks = blocks;
    this.names = blocks ? Object.keys(blocks) : [];
  }

  get(name) {
    if (!this.blocks) return null;
    return this.blocks[name] || null;
  }

  has(name) {
    let {
      blocks
    } = this;
    return blocks !== null && name in blocks;
  }

  with(name, block) {
    let {
      blocks
    } = this;

    if (blocks) {
      return new NamedBlocksImpl(assign({}, blocks, {
        [name]: block
      }));
    } else {
      return new NamedBlocksImpl({
        [name]: block
      });
    }
  }

  get hasAny() {
    return this.blocks !== null;
  }

}
const EMPTY_BLOCKS = new NamedBlocksImpl(null);
function namedBlocks(blocks) {
  if (blocks === null) {
    return EMPTY_BLOCKS;
  }

  let out = dict();
  let [keys, values] = blocks;

  for (let i = 0; i < keys.length; i++) {
    out[keys[i]] = values[i];
  }

  return new NamedBlocksImpl(out);
}

function labelOperand(value) {
  return {
    type: 1
    /* Label */
    ,
    value
  };
}
function evalSymbolsOperand() {
  return {
    type: 3
    /* EvalSymbols */
    ,
    value: undefined
  };
}
function isStrictMode() {
  return {
    type: 2
    /* IsStrictMode */
    ,
    value: undefined
  };
}
function blockOperand(value) {
  return {
    type: 4
    /* Block */
    ,
    value
  };
}
function stdlibOperand(value) {
  return {
    type: 5
    /* StdLib */
    ,
    value
  };
}
function nonSmallIntOperand(value) {
  return {
    type: 6
    /* NonSmallInt */
    ,
    value
  };
}
function symbolTableOperand(value) {
  return {
    type: 7
    /* SymbolTable */
    ,
    value
  };
}
function layoutOperand(value) {
  return {
    type: 8
    /* Layout */
    ,
    value
  };
}

function isGetLikeTuple(opcode) {
  return Array.isArray(opcode) && opcode.length === 2;
}

function makeResolutionTypeVerifier(typeToVerify) {
  return opcode => {
    if (!isGetLikeTuple(opcode)) return false;
    let type = opcode[0];
    return type === 31
    /* GetStrictFree */
    || type === 32
    /* GetTemplateSymbol */
    || type === typeToVerify;
  };
}

const isGetFreeComponent = makeResolutionTypeVerifier(39
/* GetFreeAsComponentHead */
);
const isGetFreeModifier = makeResolutionTypeVerifier(38
/* GetFreeAsModifierHead */
);
const isGetFreeHelper = makeResolutionTypeVerifier(37
/* GetFreeAsHelperHead */
);
const isGetFreeComponentOrHelper = makeResolutionTypeVerifier(35
/* GetFreeAsComponentOrHelperHead */
);
const isGetFreeOptionalComponentOrHelper = makeResolutionTypeVerifier(34
/* GetFreeAsComponentOrHelperHeadOrThisFallback */
);

function assertResolverInvariants(meta) {
  if (DEBUG) {
    if (!meta.upvars) {
      throw new Error('Attempted to resolve a component, helper, or modifier, but no free vars were found');
    }

    if (!meta.owner) {
      throw new Error('Attempted to resolve a component, helper, or modifier, but no owner was associated with the template it was being resolved from');
    }
  }

  return meta;
}
/**
 * <Foo/>
 * <Foo></Foo>
 * <Foo @arg={{true}} />
 */


function resolveComponent(resolver, constants, meta, [, expr, then]) {
  let type = expr[0];

  if (DEBUG && expr[0] === 31
  /* GetStrictFree */
  ) {
      throw new Error(`Attempted to resolve a component in a strict mode template, but that value was not in scope: ${meta.upvars[expr[1]]}`);
    }

  if (type === 32
  /* GetTemplateSymbol */
  ) {
      let {
        scopeValues,
        owner
      } = meta;
      let definition = scopeValues[expr[1]];
      then(constants.component(definition, owner));
    } else {
    let {
      upvars,
      owner
    } = assertResolverInvariants(meta);
    let name = upvars[expr[1]];
    let definition = resolver.lookupComponent(name, owner);

    if (DEBUG && (typeof definition !== 'object' || definition === null)) {
      throw new Error(`Attempted to resolve \`${name}\`, which was expected to be a component, but nothing was found.`);
    }

    then(constants.resolvedComponent(definition, name));
  }
}
/**
 * (helper)
 * (helper arg)
 */

function resolveHelper(resolver, constants, meta, [, expr, then]) {
  let type = expr[0];

  if (type === 32
  /* GetTemplateSymbol */
  ) {
      let {
        scopeValues
      } = meta;
      let definition = scopeValues[expr[1]];
      then(constants.helper(definition));
    } else if (type === 31
  /* GetStrictFree */
  ) {
      then(lookupBuiltInHelper(expr, resolver, meta, constants, 'helper'));
    } else {
    let {
      upvars,
      owner
    } = assertResolverInvariants(meta);
    let name = upvars[expr[1]];
    let helper = resolver.lookupHelper(name, owner);

    if (DEBUG && helper === null) {
      throw new Error(`Attempted to resolve \`${name}\`, which was expected to be a helper, but nothing was found.`);
    }

    then(constants.helper(helper, name));
  }
}
/**
 * <div {{modifier}}/>
 * <div {{modifier arg}}/>
 * <Foo {{modifier}}/>
 */

function resolveModifier(resolver, constants, meta, [, expr, then]) {
  let type = expr[0];

  if (type === 32
  /* GetTemplateSymbol */
  ) {
      let {
        scopeValues
      } = meta;
      let definition = scopeValues[expr[1]];
      then(constants.modifier(definition));
    } else if (type === 31
  /* GetStrictFree */
  ) {
      let {
        upvars
      } = assertResolverInvariants(meta);
      let name = upvars[expr[1]];
      let modifier = resolver.lookupBuiltInModifier(name);

      if (DEBUG && modifier === null) {
        throw new Error(`Attempted to resolve a modifier in a strict mode template, but it was not in scope: ${name}`);
      }

      then(constants.modifier(modifier, name));
    } else {
    let {
      upvars,
      owner
    } = assertResolverInvariants(meta);
    let name = upvars[expr[1]];
    let modifier = resolver.lookupModifier(name, owner);

    if (DEBUG && modifier === null) {
      throw new Error(`Attempted to resolve \`${name}\`, which was expected to be a modifier, but nothing was found.`);
    }

    then(constants.modifier(modifier, name));
  }
}
/**
 * {{component-or-helper arg}}
 */

function resolveComponentOrHelper(resolver, constants, meta, [, expr, {
  ifComponent,
  ifHelper
}]) {
  let type = expr[0];

  if (type === 32
  /* GetTemplateSymbol */
  ) {
      let {
        scopeValues,
        owner
      } = meta;
      let definition = scopeValues[expr[1]];
      let component = constants.component(definition, owner, true);

      if (component !== null) {
        ifComponent(component);
        return;
      }

      let helper = constants.helper(definition, null, true);

      if (DEBUG && helper === null) {
        throw new Error(`Attempted to use a value as either a component or helper, but it did not have a component manager or helper manager associated with it. The value was: ${debugToString(definition)}`);
      }

      ifHelper(helper);
    } else if (type === 31
  /* GetStrictFree */
  ) {
      ifHelper(lookupBuiltInHelper(expr, resolver, meta, constants, 'component or helper'));
    } else {
    let {
      upvars,
      owner
    } = assertResolverInvariants(meta);
    let name = upvars[expr[1]];
    let definition = resolver.lookupComponent(name, owner);

    if (definition !== null) {
      ifComponent(constants.resolvedComponent(definition, name));
    } else {
      let helper = resolver.lookupHelper(name, owner);

      if (DEBUG && helper === null) {
        throw new Error(`Attempted to resolve \`${name}\`, which was expected to be a component or helper, but nothing was found.`);
      }

      ifHelper(constants.helper(helper, name));
    }
  }
}
/**
 * <Foo @arg={{helper}}>
 */

function resolveOptionalHelper(resolver, constants, meta, [, expr, {
  ifHelper,
  ifFallback
}]) {
  let {
    upvars,
    owner
  } = assertResolverInvariants(meta);
  let name = upvars[expr[1]];
  let helper = resolver.lookupHelper(name, owner);

  if (helper === null) {
    ifFallback(name, meta.moduleName);
  } else {
    ifHelper(constants.helper(helper, name));
  }
}
/**
 * {{maybeHelperOrComponent}}
 */

function resolveOptionalComponentOrHelper(resolver, constants, meta, [, expr, {
  ifComponent,
  ifHelper,
  ifValue,
  ifFallback
}]) {
  let type = expr[0];

  if (type === 32
  /* GetTemplateSymbol */
  ) {
      let {
        scopeValues,
        owner
      } = meta;
      let definition = scopeValues[expr[1]];

      if (typeof definition !== 'function' && (typeof definition !== 'object' || definition === null)) {
        // The value is not an object, so it can't be a component or helper.
        ifValue(constants.value(definition));
        return;
      }

      let component = constants.component(definition, owner, true);

      if (component !== null) {
        ifComponent(component);
        return;
      }

      let helper = constants.helper(definition, null, true);

      if (helper !== null) {
        ifHelper(helper);
        return;
      }

      ifValue(constants.value(definition));
    } else if (type === 31
  /* GetStrictFree */
  ) {
      ifHelper(lookupBuiltInHelper(expr, resolver, meta, constants, 'value'));
    } else {
    let {
      upvars,
      owner
    } = assertResolverInvariants(meta);
    let name = upvars[expr[1]];
    let definition = resolver.lookupComponent(name, owner);

    if (definition !== null) {
      ifComponent(constants.resolvedComponent(definition, name));
      return;
    }

    let helper = resolver.lookupHelper(name, owner);

    if (helper !== null) {
      ifHelper(constants.helper(helper, name));
      return;
    }

    ifFallback(name);
  }
}

function lookupBuiltInHelper(expr, resolver, meta, constants, type) {
  let {
    upvars
  } = assertResolverInvariants(meta);
  let name = upvars[expr[1]];
  let helper = resolver.lookupBuiltInHelper(name);

  if (DEBUG && helper === null) {
    // Keyword helper did not exist, which means that we're attempting to use a
    // value of some kind that is not in scope
    throw new Error(`Attempted to resolve a ${type} in a strict mode template, but that value was not in scope: ${meta.upvars[expr[1]]}`);
  }

  return constants.helper(helper, name);
}

class Compilers {
  constructor() {
    this.names = {};
    this.funcs = [];
  }

  add(name, func) {
    this.names[name] = this.funcs.push(func) - 1;
  }

  compile(op, sexp) {
    let name = sexp[0];
    let index = this.names[name];
    let func = this.funcs[index];
    func(op, sexp);
  }

}

const EXPRESSIONS = new Compilers();
EXPRESSIONS.add(29
/* Concat */
, (op, [, parts]) => {
  for (let part of parts) {
    expr(op, part);
  }

  op(27
  /* Concat */
  , parts.length);
});
EXPRESSIONS.add(28
/* Call */
, (op, [, expression, positional, named]) => {
  if (isGetFreeHelper(expression)) {
    op(1005
    /* ResolveHelper */
    , expression, handle => {
      Call(op, handle, positional, named);
    });
  } else {
    expr(op, expression);
    CallDynamic(op, positional, named);
  }
});
EXPRESSIONS.add(50
/* Curry */
, (op, [, expr$$1, type, positional, named]) => {
  Curry(op, type, expr$$1, positional, named);
});
EXPRESSIONS.add(30
/* GetSymbol */
, (op, [, sym, path]) => {
  op(21
  /* GetVariable */
  , sym);
  withPath(op, path);
});
EXPRESSIONS.add(32
/* GetTemplateSymbol */
, (op, [, sym, path]) => {
  op(1011
  /* ResolveTemplateLocal */
  , sym, handle => {
    op(29
    /* ConstantReference */
    , handle);
    withPath(op, path);
  });
});
EXPRESSIONS.add(31
/* GetStrictFree */
, (op, [, sym, _path]) => {
  op(1009
  /* ResolveFree */
  , sym, _handle => {// TODO: Implement in strict mode
  });
});
EXPRESSIONS.add(33
/* GetFreeAsFallback */
, (op, [, freeVar, path]) => {
  op(1010
  /* ResolveLocal */
  , freeVar, (name, moduleName) => {
    if (DEBUG) {
      let propertyPath = path ? [name, ...path].join('.') : name;
      deprecate(`The \`${propertyPath}\` property path was used in a template for the \`${moduleName}\` component without using \`this\`. This fallback behavior has been deprecated, all properties must be looked up on \`this\` when used in the template: {{this.${propertyPath}}}`, false, {
        id: 'this-property-fallback'
      });
    }

    op(21
    /* GetVariable */
    , 0);
    op(22
    /* GetProperty */
    , name);
  });
  withPath(op, path);
});
EXPRESSIONS.add(34
/* GetFreeAsComponentOrHelperHeadOrThisFallback */
, () => {
  // TODO: The logic for this opcode currently exists in STATEMENTS.Append, since
  // we want different wrapping logic depending on if we are invoking a component,
  // helper, or {{this}} fallback. Eventually we fix the opcodes so that we can
  // traverse the subexpression tree like normal in this location.
  throw new Error('unimplemented opcode');
});
EXPRESSIONS.add(36
/* GetFreeAsHelperHeadOrThisFallback */
, (op, expr$$1) => {
  // <Foo @arg={{baz}}>
  op(1010
  /* ResolveLocal */
  , expr$$1[1], _name => {
    op(1006
    /* ResolveOptionalHelper */
    , expr$$1, {
      ifHelper: handle => {
        Call(op, handle, null, null);
      },
      ifFallback: (name, moduleName) => {
        deprecate(`The \`${name}\` property was used in the template for the \`${moduleName}\` component without using \`this\`. This fallback behavior has been deprecated, all properties must be looked up on \`this\` when used in the template: {{this.${name}}}`, false, {
          id: 'this-property-fallback'
        });
        op(21
        /* GetVariable */
        , 0);
        op(22
        /* GetProperty */
        , name);
      }
    });
  });
});

function withPath(op, path) {
  if (path === undefined || path.length === 0) return;

  for (let i = 0; i < path.length; i++) {
    op(22
    /* GetProperty */
    , path[i]);
  }
}

EXPRESSIONS.add(27
/* Undefined */
, op => PushPrimitiveReference(op, undefined));
EXPRESSIONS.add(48
/* HasBlock */
, (op, [, block]) => {
  expr(op, block);
  op(25
  /* HasBlock */
  );
});
EXPRESSIONS.add(49
/* HasBlockParams */
, (op, [, block]) => {
  expr(op, block);
  op(24
  /* SpreadBlock */
  );
  op(61
  /* CompileBlock */
  );
  op(26
  /* HasBlockParams */
  );
});
EXPRESSIONS.add(52
/* IfInline */
, (op, [, condition, truthy, falsy]) => {
  // Push in reverse order
  expr(op, falsy);
  expr(op, truthy);
  expr(op, condition);
  op(109
  /* IfInline */
  );
});
EXPRESSIONS.add(51
/* Not */
, (op, [, value]) => {
  expr(op, value);
  op(110
  /* Not */
  );
});
EXPRESSIONS.add(53
/* GetDynamicVar */
, (op, [, expression]) => {
  expr(op, expression);
  op(111
  /* GetDynamicVar */
  );
});
EXPRESSIONS.add(54
/* Log */
, (op, [, positional]) => {
  op(0
  /* PushFrame */
  );
  SimpleArgs(op, positional, null, false);
  op(112
  /* Log */
  );
  op(1
  /* PopFrame */
  );
  op(36
  /* Fetch */
  , $v0);
});

function expr(op, expression) {
  if (Array.isArray(expression)) {
    EXPRESSIONS.compile(op, expression);
  } else {
    PushPrimitive(op, expression);
    op(31
    /* PrimitiveReference */
    );
  }
}

/**
 * Compile arguments, pushing an Arguments object onto the stack.
 *
 * @param args.params
 * @param args.hash
 * @param args.blocks
 * @param args.atNames
 */

function CompileArgs(op, positional, named, blocks, atNames) {
  let blockNames = blocks.names;

  for (let i = 0; i < blockNames.length; i++) {
    PushYieldableBlock(op, blocks.get(blockNames[i]));
  }

  let count = CompilePositional(op, positional);
  let flags = count << 4;
  if (atNames) flags |= 0b1000;

  if (blocks) {
    flags |= 0b111;
  }

  let names = EMPTY_ARRAY;

  if (named) {
    names = named[0];
    let val = named[1];

    for (let i = 0; i < val.length; i++) {
      expr(op, val[i]);
    }
  }

  op(82
  /* PushArgs */
  , names, blockNames, flags);
}
function SimpleArgs(op, positional, named, atNames) {
  if (positional === null && named === null) {
    op(83
    /* PushEmptyArgs */
    );
    return;
  }

  let count = CompilePositional(op, positional);
  let flags = count << 4;
  if (atNames) flags |= 0b1000;
  let names = EMPTY_STRING_ARRAY;

  if (named) {
    names = named[0];
    let val = named[1];

    for (let i = 0; i < val.length; i++) {
      expr(op, val[i]);
    }
  }

  op(82
  /* PushArgs */
  , names, EMPTY_STRING_ARRAY, flags);
}
/**
 * Compile an optional list of positional arguments, which pushes each argument
 * onto the stack and returns the number of parameters compiled
 *
 * @param positional an optional list of positional arguments
 */

function CompilePositional(op, positional) {
  if (positional === null) return 0;

  for (let i = 0; i < positional.length; i++) {
    expr(op, positional[i]);
  }

  return positional.length;
}
function meta(layout) {
  var _a, _b;

  let [, symbols,, upvars] = layout.block;
  return {
    asPartial: layout.asPartial || false,
    evalSymbols: evalSymbols(layout),
    upvars: upvars,
    scopeValues: (_b = (_a = layout.scope) === null || _a === void 0 ? void 0 : _a.call(layout)) !== null && _b !== void 0 ? _b : null,
    isStrictMode: layout.isStrictMode,
    moduleName: layout.moduleName,
    owner: layout.owner,
    size: symbols.length
  };
}
function evalSymbols(layout) {
  let {
    block
  } = layout;
  let [, symbols, hasEval] = block;
  return hasEval ? symbols : null;
}

/**
 * Push a reference onto the stack corresponding to a statically known primitive
 * @param value A JavaScript primitive (undefined, null, boolean, number or string)
 */

function PushPrimitiveReference(op, value) {
  PushPrimitive(op, value);
  op(31
  /* PrimitiveReference */
  );
}
/**
 * Push an encoded representation of a JavaScript primitive on the stack
 *
 * @param value A JavaScript primitive (undefined, null, boolean, number or string)
 */

function PushPrimitive(op, primitive) {
  let p = primitive;

  if (typeof p === 'number') {
    p = isSmallInt(p) ? encodeImmediate(p) : nonSmallIntOperand(p);
  }

  op(30
  /* Primitive */
  , p);
}
/**
 * Invoke a foreign function (a "helper") based on a statically known handle
 *
 * @param op The op creation function
 * @param handle A handle
 * @param positional An optional list of expressions to compile
 * @param named An optional list of named arguments (name + expression) to compile
 */

function Call(op, handle, positional, named) {
  op(0
  /* PushFrame */
  );
  SimpleArgs(op, positional, named, false);
  op(16
  /* Helper */
  , handle);
  op(1
  /* PopFrame */
  );
  op(36
  /* Fetch */
  , $v0);
}
/**
 * Invoke a foreign function (a "helper") based on a dynamically loaded definition
 *
 * @param op The op creation function
 * @param positional An optional list of expressions to compile
 * @param named An optional list of named arguments (name + expression) to compile
 */

function CallDynamic(op, positional, named, append) {
  op(35
  /* Load */
  , $v0);
  op(0
  /* PushFrame */
  );
  SimpleArgs(op, positional, named, false);
  op(107
  /* DynamicHelper */
  , $v0);

  if (append) {
    op(36
    /* Fetch */
    , $v0);
    append === null || append === void 0 ? void 0 : append();
    op(1
    /* PopFrame */
    );
  } else {
    op(1
    /* PopFrame */
    );
    op(36
    /* Fetch */
    , $v0);
  }
}
/**
 * Evaluate statements in the context of new dynamic scope entries. Move entries from the
 * stack into named entries in the dynamic scope, then evaluate the statements, then pop
 * the dynamic scope
 *
 * @param names a list of dynamic scope names
 * @param block a function that returns a list of statements to evaluate
 */

function DynamicScope(op, names, block) {
  op(59
  /* PushDynamicScope */
  );
  op(58
  /* BindDynamicScope */
  , names);
  block();
  op(60
  /* PopDynamicScope */
  );
}
function Curry(op, type, definition, positional, named) {
  op(0
  /* PushFrame */
  );
  SimpleArgs(op, positional, named, false);
  op(86
  /* CaptureArgs */
  );
  expr(op, definition);
  op(77
  /* Curry */
  , type, isStrictMode());
  op(1
  /* PopFrame */
  );
  op(36
  /* Fetch */
  , $v0);
}

/**
 * Yield to a block located at a particular symbol location.
 *
 * @param to the symbol containing the block to yield to
 * @param params optional block parameters to yield to the block
 */

function YieldBlock(op, to, positional) {
  SimpleArgs(op, positional, null, true);
  op(23
  /* GetBlock */
  , to);
  op(24
  /* SpreadBlock */
  );
  op(61
  /* CompileBlock */
  );
  op(64
  /* InvokeYield */
  );
  op(40
  /* PopScope */
  );
  op(1
  /* PopFrame */
  );
}
/**
 * Push an (optional) yieldable block onto the stack. The yieldable block must be known
 * statically at compile time.
 *
 * @param block An optional Compilable block
 */

function PushYieldableBlock(op, block) {
  PushSymbolTable(op, block && block[1]);
  op(62
  /* PushBlockScope */
  );
  PushCompilable(op, block);
}
/**
 * Invoke a block that is known statically at compile time.
 *
 * @param block a Compilable block
 */

function InvokeStaticBlock(op, block) {
  op(0
  /* PushFrame */
  );
  PushCompilable(op, block);
  op(61
  /* CompileBlock */
  );
  op(2
  /* InvokeVirtual */
  );
  op(1
  /* PopFrame */
  );
}
/**
 * Invoke a static block, preserving some number of stack entries for use in
 * updating.
 *
 * @param block A compilable block
 * @param callerCount A number of stack entries to preserve
 */

function InvokeStaticBlockWithStack(op, block, callerCount) {
  let parameters = block[1];
  let calleeCount = parameters.length;
  let count = Math.min(callerCount, calleeCount);

  if (count === 0) {
    InvokeStaticBlock(op, block);
    return;
  }

  op(0
  /* PushFrame */
  );

  if (count) {
    op(39
    /* ChildScope */
    );

    for (let i = 0; i < count; i++) {
      op(33
      /* Dup */
      , $fp, callerCount - i);
      op(19
      /* SetVariable */
      , parameters[i]);
    }
  }

  PushCompilable(op, block);
  op(61
  /* CompileBlock */
  );
  op(2
  /* InvokeVirtual */
  );

  if (count) {
    op(40
    /* PopScope */
    );
  }

  op(1
  /* PopFrame */
  );
}
function PushSymbolTable(op, parameters) {
  if (parameters !== null) {
    op(63
    /* PushSymbolTable */
    , symbolTableOperand({
      parameters
    }));
  } else {
    PushPrimitive(op, null);
  }
}
function PushCompilable(op, _block) {
  if (_block === null) {
    PushPrimitive(op, null);
  } else {
    op(28
    /* Constant */
    , blockOperand(_block));
  }
}

function SwitchCases(op, bootstrap, callback) {
  // Setup the switch DSL
  let clauses = [];
  let count = 0;

  function when(match, callback) {
    clauses.push({
      match,
      callback,
      label: `CLAUSE${count++}`
    });
  } // Call the callback


  callback(when); // Emit the opcodes for the switch

  op(69
  /* Enter */
  , 1);
  bootstrap();
  op(1001
  /* StartLabels */
  ); // First, emit the jump opcodes. We don't need a jump for the last
  // opcode, since it bleeds directly into its clause.

  for (let clause of clauses.slice(0, -1)) {
    op(67
    /* JumpEq */
    , labelOperand(clause.label), clause.match);
  } // Enumerate the clauses in reverse order. Earlier matches will
  // require fewer checks.


  for (let i = clauses.length - 1; i >= 0; i--) {
    let clause = clauses[i];
    op(1000
    /* Label */
    , clause.label);
    op(34
    /* Pop */
    , 1);
    clause.callback(); // The first match is special: it is placed directly before the END
    // label, so no additional jump is needed at the end of it.

    if (i !== 0) {
      op(4
      /* Jump */
      , labelOperand('END'));
    }
  }

  op(1000
  /* Label */
  , 'END');
  op(1002
  /* StopLabels */
  );
  op(70
  /* Exit */
  );
}
/**
 * A convenience for pushing some arguments on the stack and
 * running some code if the code needs to be re-executed during
 * updating execution if some of the arguments have changed.
 *
 * # Initial Execution
 *
 * The `args` function should push zero or more arguments onto
 * the stack and return the number of arguments pushed.
 *
 * The `body` function provides the instructions to execute both
 * during initial execution and during updating execution.
 *
 * Internally, this function starts by pushing a new frame, so
 * that the body can return and sets the return point ($ra) to
 * the ENDINITIAL label.
 *
 * It then executes the `args` function, which adds instructions
 * responsible for pushing the arguments for the block to the
 * stack. These arguments will be restored to the stack before
 * updating execution.
 *
 * Next, it adds the Enter opcode, which marks the current position
 * in the DOM, and remembers the current $pc (the next instruction)
 * as the first instruction to execute during updating execution.
 *
 * Next, it runs `body`, which adds the opcodes that should
 * execute both during initial execution and during updating execution.
 * If the `body` wishes to finish early, it should Jump to the
 * `FINALLY` label.
 *
 * Next, it adds the FINALLY label, followed by:
 *
 * - the Exit opcode, which finalizes the marked DOM started by the
 *   Enter opcode.
 * - the Return opcode, which returns to the current return point
 *   ($ra).
 *
 * Finally, it adds the ENDINITIAL label followed by the PopFrame
 * instruction, which restores $fp, $sp and $ra.
 *
 * # Updating Execution
 *
 * Updating execution for this `replayable` occurs if the `body` added an
 * assertion, via one of the `JumpIf`, `JumpUnless` or `AssertSame` opcodes.
 *
 * If, during updating executon, the assertion fails, the initial VM is
 * restored, and the stored arguments are pushed onto the stack. The DOM
 * between the starting and ending markers is cleared, and the VM's cursor
 * is set to the area just cleared.
 *
 * The return point ($ra) is set to -1, the exit instruction.
 *
 * Finally, the $pc is set to to the instruction saved off by the
 * Enter opcode during initial execution, and execution proceeds as
 * usual.
 *
 * The only difference is that when a `Return` instruction is
 * encountered, the program jumps to -1 rather than the END label,
 * and the PopFrame opcode is not needed.
 */

function Replayable(op, args, body) {
  // Start a new label frame, to give END and RETURN
  // a unique meaning.
  op(1001
  /* StartLabels */
  );
  op(0
  /* PushFrame */
  ); // If the body invokes a block, its return will return to
  // END. Otherwise, the return in RETURN will return to END.

  op(6
  /* ReturnTo */
  , labelOperand('ENDINITIAL')); // Push the arguments onto the stack. The args() function
  // tells us how many stack elements to retain for re-execution
  // when updating.

  let count = args(); // Start a new updating closure, remembering `count` elements
  // from the stack. Everything after this point, and before END,
  // will execute both initially and to update the block.
  //
  // The enter and exit opcodes also track the area of the DOM
  // associated with this block. If an assertion inside the block
  // fails (for example, the test value changes from true to false
  // in an #if), the DOM is cleared and the program is re-executed,
  // restoring `count` elements to the stack and executing the
  // instructions between the enter and exit.

  op(69
  /* Enter */
  , count); // Evaluate the body of the block. The body of the block may
  // return, which will jump execution to END during initial
  // execution, and exit the updating routine.

  body(); // All execution paths in the body should run the FINALLY once
  // they are done. It is executed both during initial execution
  // and during updating execution.

  op(1000
  /* Label */
  , 'FINALLY'); // Finalize the DOM.

  op(70
  /* Exit */
  ); // In initial execution, this is a noop: it returns to the
  // immediately following opcode. In updating execution, this
  // exits the updating routine.

  op(5
  /* Return */
  ); // Cleanup code for the block. Runs on initial execution
  // but not on updating.

  op(1000
  /* Label */
  , 'ENDINITIAL');
  op(1
  /* PopFrame */
  );
  op(1002
  /* StopLabels */
  );
}
/**
 * A specialized version of the `replayable` convenience that allows the
 * caller to provide different code based upon whether the item at
 * the top of the stack is true or false.
 *
 * As in `replayable`, the `ifTrue` and `ifFalse` code can invoke `return`.
 *
 * During the initial execution, a `return` will continue execution
 * in the cleanup code, which finalizes the current DOM block and pops
 * the current frame.
 *
 * During the updating execution, a `return` will exit the updating
 * routine, as it can reuse the DOM block and is always only a single
 * frame deep.
 */

function ReplayableIf(op, args, ifTrue, ifFalse) {
  return Replayable(op, args, () => {
    // If the conditional is false, jump to the ELSE label.
    op(66
    /* JumpUnless */
    , labelOperand('ELSE')); // Otherwise, execute the code associated with the true branch.

    ifTrue(); // We're done, so return. In the initial execution, this runs
    // the cleanup code. In the updating VM, it exits the updating
    // routine.

    op(4
    /* Jump */
    , labelOperand('FINALLY'));
    op(1000
    /* Label */
    , 'ELSE'); // If the conditional is false, and code associatied ith the
    // false branch was provided, execute it. If there was no code
    // associated with the false branch, jumping to the else statement
    // has no other behavior.

    if (ifFalse !== undefined) {
      ifFalse();
    }
  });
}

const ATTRS_BLOCK = '&attrs';
function InvokeComponent(op, component, _elementBlock, positional, named, _blocks) {
  let {
    compilable,
    capabilities,
    handle
  } = component;
  let elementBlock = _elementBlock ? [_elementBlock, []] : null;
  let blocks = Array.isArray(_blocks) || _blocks === null ? namedBlocks(_blocks) : _blocks;

  if (compilable) {
    op(78
    /* PushComponentDefinition */
    , handle);
    InvokeStaticComponent(op, {
      capabilities: capabilities,
      layout: compilable,
      elementBlock,
      positional,
      named,
      blocks
    });
  } else {
    op(78
    /* PushComponentDefinition */
    , handle);
    InvokeNonStaticComponent(op, {
      capabilities: capabilities,
      elementBlock,
      positional,
      named,
      atNames: true,
      blocks
    });
  }
}
function InvokeDynamicComponent(op, definition, _elementBlock, positional, named, _blocks, atNames, curried) {
  let elementBlock = _elementBlock ? [_elementBlock, []] : null;
  let blocks = Array.isArray(_blocks) || _blocks === null ? namedBlocks(_blocks) : _blocks;
  Replayable(op, () => {
    expr(op, definition);
    op(33
    /* Dup */
    , $sp, 0);
    return 2;
  }, () => {
    op(66
    /* JumpUnless */
    , labelOperand('ELSE'));

    if (curried) {
      op(81
      /* ResolveCurriedComponent */
      );
    } else {
      op(80
      /* ResolveDynamicComponent */
      , isStrictMode());
    }

    op(79
    /* PushDynamicComponentInstance */
    );
    InvokeNonStaticComponent(op, {
      capabilities: true,
      elementBlock,
      positional,
      named,
      atNames,
      blocks
    });
    op(1000
    /* Label */
    , 'ELSE');
  });
}

function InvokeStaticComponent(op, {
  capabilities,
  layout,
  elementBlock,
  positional,
  named,
  blocks
}) {
  let {
    symbolTable
  } = layout;
  let bailOut = symbolTable.hasEval || hasCapability(capabilities, 4
  /* PrepareArgs */
  );

  if (bailOut) {
    InvokeNonStaticComponent(op, {
      capabilities,
      elementBlock,
      positional,
      named,
      atNames: true,
      blocks,
      layout
    });
    return;
  }

  op(36
  /* Fetch */
  , $s0);
  op(33
  /* Dup */
  , $sp, 1);
  op(35
  /* Load */
  , $s0);
  op(0
  /* PushFrame */
  ); // Setup arguments

  let {
    symbols
  } = symbolTable; // As we push values onto the stack, we store the symbols associated  with them
  // so that we can set them on the scope later on with SetVariable and SetBlock

  let blockSymbols = [];
  let argSymbols = [];
  let argNames = []; // First we push the blocks onto the stack

  let blockNames = blocks.names; // Starting with the attrs block, if it exists and is referenced in the component

  if (elementBlock !== null) {
    let symbol = symbols.indexOf(ATTRS_BLOCK);

    if (symbol !== -1) {
      PushYieldableBlock(op, elementBlock);
      blockSymbols.push(symbol);
    }
  } // Followed by the other blocks, if they exist and are referenced in the component.
  // Also store the index of the associated symbol.


  for (let i = 0; i < blockNames.length; i++) {
    let name = blockNames[i];
    let symbol = symbols.indexOf(`&${name}`);

    if (symbol !== -1) {
      PushYieldableBlock(op, blocks.get(name));
      blockSymbols.push(symbol);
    }
  } // Next up we have arguments. If the component has the `createArgs` capability,
  // then it wants access to the arguments in JavaScript. We can't know whether
  // or not an argument is used, so we have to give access to all of them.


  if (hasCapability(capabilities, 8
  /* CreateArgs */
  )) {
    // First we push positional arguments
    let count = CompilePositional(op, positional); // setup the flags with the count of positionals, and to indicate that atNames
    // are used

    let flags = count << 4;
    flags |= 0b1000;
    let names = EMPTY_STRING_ARRAY; // Next, if named args exist, push them all. If they have an associated symbol
    // in the invoked component (e.g. they are used within its template), we push
    // that symbol. If not, we still push the expression as it may be used, and
    // we store the symbol as -1 (this is used later).

    if (named !== null) {
      names = named[0];
      let val = named[1];

      for (let i = 0; i < val.length; i++) {
        let symbol = symbols.indexOf(names[i]);
        expr(op, val[i]);
        argSymbols.push(symbol);
      }
    } // Finally, push the VM arguments themselves. These args won't need access
    // to blocks (they aren't accessible from userland anyways), so we push an
    // empty array instead of the actual block names.


    op(82
    /* PushArgs */
    , names, EMPTY_STRING_ARRAY, flags); // And push an extra pop operation to remove the args before we begin setting
    // variables on the local context

    argSymbols.push(-1);
  } else if (named !== null) {
    // If the component does not have the `createArgs` capability, then the only
    // expressions we need to push onto the stack are those that are actually
    // referenced in the template of the invoked component (e.g. have symbols).
    let names = named[0];
    let val = named[1];

    for (let i = 0; i < val.length; i++) {
      let name = names[i];
      let symbol = symbols.indexOf(name);

      if (symbol !== -1) {
        expr(op, val[i]);
        argSymbols.push(symbol);
        argNames.push(name);
      }
    }
  }

  op(97
  /* BeginComponentTransaction */
  , $s0);

  if (hasCapability(capabilities, 64
  /* DynamicScope */
  )) {
    op(59
    /* PushDynamicScope */
    );
  }

  if (hasCapability(capabilities, 512
  /* CreateInstance */
  )) {
    op(87
    /* CreateComponent */
    , blocks.has('default') | 0, $s0);
  }

  op(88
  /* RegisterComponentDestructor */
  , $s0);

  if (hasCapability(capabilities, 8
  /* CreateArgs */
  )) {
    op(90
    /* GetComponentSelf */
    , $s0);
  } else {
    op(90
    /* GetComponentSelf */
    , $s0, argNames);
  } // Setup the new root scope for the component


  op(37
  /* RootScope */
  , symbols.length + 1, Object.keys(blocks).length > 0 ? 1 : 0); // Pop the self reference off the stack and set it to the symbol for `this`
  // in the new scope. This is why all subsequent symbols are increased by one.

  op(19
  /* SetVariable */
  , 0); // Going in reverse, now we pop the args/blocks off the stack, starting with
  // arguments, and assign them to their symbols in the new scope.

  for (let i = argSymbols.length - 1; i >= 0; i--) {
    let symbol = argSymbols[i];

    if (symbol === -1) {
      // The expression was not bound to a local symbol, it was only pushed to be
      // used with VM args in the javascript side
      op(34
      /* Pop */
      , 1);
    } else {
      op(19
      /* SetVariable */
      , symbol + 1);
    }
  } // if any positional params exist, pop them off the stack as well


  if (positional !== null) {
    op(34
    /* Pop */
    , positional.length);
  } // Finish up by popping off and assigning blocks


  for (let i = blockSymbols.length - 1; i >= 0; i--) {
    let symbol = blockSymbols[i];
    op(20
    /* SetBlock */
    , symbol + 1);
  }

  op(28
  /* Constant */
  , layoutOperand(layout));
  op(61
  /* CompileBlock */
  );
  op(2
  /* InvokeVirtual */
  );
  op(100
  /* DidRenderLayout */
  , $s0);
  op(1
  /* PopFrame */
  );
  op(40
  /* PopScope */
  );

  if (hasCapability(capabilities, 64
  /* DynamicScope */
  )) {
    op(60
    /* PopDynamicScope */
    );
  }

  op(98
  /* CommitComponentTransaction */
  );
  op(35
  /* Load */
  , $s0);
}

function InvokeNonStaticComponent(op, {
  capabilities,
  elementBlock,
  positional,
  named,
  atNames,
  blocks: namedBlocks$$1,
  layout
}) {
  let bindableBlocks = !!namedBlocks$$1;
  let bindableAtNames = capabilities === true || hasCapability(capabilities, 4
  /* PrepareArgs */
  ) || !!(named && named[0].length !== 0);
  let blocks = namedBlocks$$1.with('attrs', elementBlock);
  op(36
  /* Fetch */
  , $s0);
  op(33
  /* Dup */
  , $sp, 1);
  op(35
  /* Load */
  , $s0);
  op(0
  /* PushFrame */
  );
  CompileArgs(op, positional, named, blocks, atNames);
  op(85
  /* PrepareArgs */
  , $s0);
  invokePreparedComponent(op, blocks.has('default'), bindableBlocks, bindableAtNames, () => {
    if (layout) {
      op(63
      /* PushSymbolTable */
      , symbolTableOperand(layout.symbolTable));
      op(28
      /* Constant */
      , layoutOperand(layout));
      op(61
      /* CompileBlock */
      );
    } else {
      op(92
      /* GetComponentLayout */
      , $s0);
    }

    op(95
    /* PopulateLayout */
    , $s0);
  });
  op(35
  /* Load */
  , $s0);
}
function WrappedComponent(op, layout, attrsBlockNumber) {
  op(1001
  /* StartLabels */
  );
  WithSavedRegister(op, $s1, () => {
    op(91
    /* GetComponentTagName */
    , $s0);
    op(31
    /* PrimitiveReference */
    );
    op(33
    /* Dup */
    , $sp, 0);
  });
  op(66
  /* JumpUnless */
  , labelOperand('BODY'));
  op(36
  /* Fetch */
  , $s1);
  op(89
  /* PutComponentOperations */
  );
  op(49
  /* OpenDynamicElement */
  );
  op(99
  /* DidCreateElement */
  , $s0);
  YieldBlock(op, attrsBlockNumber, null);
  op(54
  /* FlushElement */
  );
  op(1000
  /* Label */
  , 'BODY');
  InvokeStaticBlock(op, [layout.block[0], []]);
  op(36
  /* Fetch */
  , $s1);
  op(66
  /* JumpUnless */
  , labelOperand('END'));
  op(55
  /* CloseElement */
  );
  op(1000
  /* Label */
  , 'END');
  op(35
  /* Load */
  , $s1);
  op(1002
  /* StopLabels */
  );
}
function invokePreparedComponent(op, hasBlock, bindableBlocks, bindableAtNames, populateLayout = null) {
  op(97
  /* BeginComponentTransaction */
  , $s0);
  op(59
  /* PushDynamicScope */
  );
  op(87
  /* CreateComponent */
  , hasBlock | 0, $s0); // this has to run after createComponent to allow
  // for late-bound layouts, but a caller is free
  // to populate the layout earlier if it wants to
  // and do nothing here.

  if (populateLayout) {
    populateLayout();
  }

  op(88
  /* RegisterComponentDestructor */
  , $s0);
  op(90
  /* GetComponentSelf */
  , $s0);
  op(38
  /* VirtualRootScope */
  , $s0);
  op(19
  /* SetVariable */
  , 0);
  op(94
  /* SetupForEval */
  , $s0);
  if (bindableAtNames) op(17
  /* SetNamedVariables */
  , $s0);
  if (bindableBlocks) op(18
  /* SetBlocks */
  , $s0);
  op(34
  /* Pop */
  , 1);
  op(96
  /* InvokeComponentLayout */
  , $s0);
  op(100
  /* DidRenderLayout */
  , $s0);
  op(1
  /* PopFrame */
  );
  op(40
  /* PopScope */
  );
  op(60
  /* PopDynamicScope */
  );
  op(98
  /* CommitComponentTransaction */
  );
}
function InvokeBareComponent(op) {
  op(36
  /* Fetch */
  , $s0);
  op(33
  /* Dup */
  , $sp, 1);
  op(35
  /* Load */
  , $s0);
  op(0
  /* PushFrame */
  );
  op(83
  /* PushEmptyArgs */
  );
  op(85
  /* PrepareArgs */
  , $s0);
  invokePreparedComponent(op, false, false, true, () => {
    op(92
    /* GetComponentLayout */
    , $s0);
    op(95
    /* PopulateLayout */
    , $s0);
  });
  op(35
  /* Load */
  , $s0);
}
function WithSavedRegister(op, register, block) {
  op(36
  /* Fetch */
  , register);
  block();
  op(35
  /* Load */
  , register);
}

class StdLib {
  constructor(main, trustingGuardedAppend, cautiousGuardedAppend, trustingNonDynamicAppend, cautiousNonDynamicAppend) {
    this.main = main;
    this.trustingGuardedAppend = trustingGuardedAppend;
    this.cautiousGuardedAppend = cautiousGuardedAppend;
    this.trustingNonDynamicAppend = trustingNonDynamicAppend;
    this.cautiousNonDynamicAppend = cautiousNonDynamicAppend;
  }

  get 'trusting-append'() {
    return this.trustingGuardedAppend;
  }

  get 'cautious-append'() {
    return this.cautiousGuardedAppend;
  }

  get 'trusting-non-dynamic-append'() {
    return this.trustingNonDynamicAppend;
  }

  get 'cautious-non-dynamic-append'() {
    return this.cautiousNonDynamicAppend;
  }

  getAppend(trusting) {
    return trusting ? this.trustingGuardedAppend : this.cautiousGuardedAppend;
  }

}

function programCompilationContext(artifacts, resolver) {
  return new CompileTimeCompilationContextImpl(artifacts, resolver);
}
function templateCompilationContext(program, meta) {
  let encoder = new EncoderImpl(program.heap, meta, program.stdlib);
  return {
    program,
    encoder,
    meta
  };
}

let debugCompiler;

const STATEMENTS = new Compilers();
const INFLATE_ATTR_TABLE = ['class', 'id', 'value', 'name', 'type', 'style', 'href'];
const INFLATE_TAG_TABLE = ['div', 'span', 'p', 'a'];
function inflateTagName(tagName) {
  return typeof tagName === 'string' ? tagName : INFLATE_TAG_TABLE[tagName];
}
function inflateAttrName(attrName) {
  return typeof attrName === 'string' ? attrName : INFLATE_ATTR_TABLE[attrName];
}
STATEMENTS.add(3
/* Comment */
, (op, sexp) => op(42
/* Comment */
, sexp[1]));
STATEMENTS.add(13
/* CloseElement */
, op => op(55
/* CloseElement */
));
STATEMENTS.add(12
/* FlushElement */
, op => op(54
/* FlushElement */
));
STATEMENTS.add(4
/* Modifier */
, (op, [, expression, positional, named]) => {
  if (isGetFreeModifier(expression)) {
    op(1003
    /* ResolveModifier */
    , expression, handle => {
      op(0
      /* PushFrame */
      );
      SimpleArgs(op, positional, named, false);
      op(57
      /* Modifier */
      , handle);
      op(1
      /* PopFrame */
      );
    });
  } else {
    expr(op, expression);
    op(0
    /* PushFrame */
    );
    SimpleArgs(op, positional, named, false);
    op(33
    /* Dup */
    , $fp, 1);
    op(108
    /* DynamicModifier */
    );
    op(1
    /* PopFrame */
    );
  }
});
STATEMENTS.add(14
/* StaticAttr */
, (op, [, name, value, namespace]) => {
  op(51
  /* StaticAttr */
  , inflateAttrName(name), value, namespace !== null && namespace !== void 0 ? namespace : null);
});
STATEMENTS.add(24
/* StaticComponentAttr */
, (op, [, name, value, namespace]) => {
  op(105
  /* StaticComponentAttr */
  , inflateAttrName(name), value, namespace !== null && namespace !== void 0 ? namespace : null);
});
STATEMENTS.add(15
/* DynamicAttr */
, (op, [, name, value, namespace]) => {
  expr(op, value);
  op(52
  /* DynamicAttr */
  , inflateAttrName(name), false, namespace !== null && namespace !== void 0 ? namespace : null);
});
STATEMENTS.add(22
/* TrustingDynamicAttr */
, (op, [, name, value, namespace]) => {
  expr(op, value);
  op(52
  /* DynamicAttr */
  , inflateAttrName(name), true, namespace !== null && namespace !== void 0 ? namespace : null);
});
STATEMENTS.add(16
/* ComponentAttr */
, (op, [, name, value, namespace]) => {
  expr(op, value);
  op(53
  /* ComponentAttr */
  , inflateAttrName(name), false, namespace !== null && namespace !== void 0 ? namespace : null);
});
STATEMENTS.add(23
/* TrustingComponentAttr */
, (op, [, name, value, namespace]) => {
  expr(op, value);
  op(53
  /* ComponentAttr */
  , inflateAttrName(name), true, namespace !== null && namespace !== void 0 ? namespace : null);
});
STATEMENTS.add(10
/* OpenElement */
, (op, [, tag]) => {
  op(48
  /* OpenElement */
  , inflateTagName(tag));
});
STATEMENTS.add(11
/* OpenElementWithSplat */
, (op, [, tag]) => {
  op(89
  /* PutComponentOperations */
  );
  op(48
  /* OpenElement */
  , inflateTagName(tag));
});
STATEMENTS.add(8
/* Component */
, (op, [, expr$$1, elementBlock, named, blocks]) => {
  if (isGetFreeComponent(expr$$1)) {
    op(1004
    /* ResolveComponent */
    , expr$$1, component => {
      InvokeComponent(op, component, elementBlock, null, named, blocks);
    });
  } else {
    // otherwise, the component name was an expression, so resolve the expression
    // and invoke it as a dynamic component
    InvokeDynamicComponent(op, expr$$1, elementBlock, null, named, blocks, true, true);
  }
});
STATEMENTS.add(19
/* Partial */
, (op, [, name, evalInfo]) => {
  ReplayableIf(op, () => {
    expr(op, name);
    op(33
    /* Dup */
    , $sp, 0);
    return 2;
  }, () => {
    op(101
    /* InvokePartial */
    , evalSymbolsOperand(), evalInfo);
    op(40
    /* PopScope */
    );
    op(1
    /* PopFrame */
    );
  });
});
STATEMENTS.add(18
/* Yield */
, (op, [, to, params]) => YieldBlock(op, to, params));
STATEMENTS.add(17
/* AttrSplat */
, (op, [, to]) => YieldBlock(op, to, null));
STATEMENTS.add(26
/* Debugger */
, (op, [, evalInfo]) => op(103
/* Debugger */
, evalSymbolsOperand(), evalInfo));
STATEMENTS.add(1
/* Append */
, (op, [, value]) => {
  // Special case for static values
  if (!Array.isArray(value)) {
    op(41
    /* Text */
    , value === null || value === undefined ? '' : String(value));
  } else if (isGetFreeOptionalComponentOrHelper(value)) {
    op(1008
    /* ResolveOptionalComponentOrHelper */
    , value, {
      ifComponent(component) {
        InvokeComponent(op, component, null, null, null, null);
      },

      ifHelper(handle) {
        op(0
        /* PushFrame */
        );
        Call(op, handle, null, null);
        op(3
        /* InvokeStatic */
        , stdlibOperand('cautious-non-dynamic-append'));
        op(1
        /* PopFrame */
        );
      },

      ifValue(handle) {
        op(0
        /* PushFrame */
        );
        op(29
        /* ConstantReference */
        , handle);
        op(3
        /* InvokeStatic */
        , stdlibOperand('cautious-non-dynamic-append'));
        op(1
        /* PopFrame */
        );
      },

      ifFallback(_name) {
        op(0
        /* PushFrame */
        );
        op(1010
        /* ResolveLocal */
        , value[1], (name, moduleName) => {
          deprecate(`The \`${name}\` property was used in a template for the \`${moduleName}\` component without using \`this\`. This fallback behavior has been deprecated, all properties must be looked up on \`this\` when used in the template: {{this.${name}}}`, false, {
            id: 'this-property-fallback'
          });
          op(21
          /* GetVariable */
          , 0);
          op(22
          /* GetProperty */
          , name);
        });
        op(3
        /* InvokeStatic */
        , stdlibOperand('cautious-append'));
        op(1
        /* PopFrame */
        );
      }

    });
  } else if (value[0] === 28
  /* Call */
  ) {
      let [, expression, positional, named] = value;

      if (isGetFreeComponentOrHelper(expression)) {
        op(1007
        /* ResolveComponentOrHelper */
        , expression, {
          ifComponent(component) {
            InvokeComponent(op, component, null, positional, hashToArgs(named), null);
          },

          ifHelper(handle) {
            op(0
            /* PushFrame */
            );
            Call(op, handle, positional, named);
            op(3
            /* InvokeStatic */
            , stdlibOperand('cautious-non-dynamic-append'));
            op(1
            /* PopFrame */
            );
          }

        });
      } else {
        SwitchCases(op, () => {
          expr(op, expression);
          op(106
          /* DynamicContentType */
          );
        }, when => {
          when(0
          /* Component */
          , () => {
            op(81
            /* ResolveCurriedComponent */
            );
            op(79
            /* PushDynamicComponentInstance */
            );
            InvokeNonStaticComponent(op, {
              capabilities: true,
              elementBlock: null,
              positional,
              named,
              atNames: false,
              blocks: namedBlocks(null)
            });
          });
          when(1
          /* Helper */
          , () => {
            CallDynamic(op, positional, named, () => {
              op(3
              /* InvokeStatic */
              , stdlibOperand('cautious-non-dynamic-append'));
            });
          });
        });
      }
    } else {
    op(0
    /* PushFrame */
    );
    expr(op, value);
    op(3
    /* InvokeStatic */
    , stdlibOperand('cautious-append'));
    op(1
    /* PopFrame */
    );
  }
});
STATEMENTS.add(2
/* TrustingAppend */
, (op, [, value]) => {
  if (!Array.isArray(value)) {
    op(41
    /* Text */
    , value === null || value === undefined ? '' : String(value));
  } else {
    op(0
    /* PushFrame */
    );
    expr(op, value);
    op(3
    /* InvokeStatic */
    , stdlibOperand('trusting-append'));
    op(1
    /* PopFrame */
    );
  }
});
STATEMENTS.add(6
/* Block */
, (op, [, expr$$1, positional, named, blocks]) => {
  if (isGetFreeComponent(expr$$1)) {
    op(1004
    /* ResolveComponent */
    , expr$$1, component => {
      InvokeComponent(op, component, null, positional, hashToArgs(named), blocks);
    });
  } else {
    InvokeDynamicComponent(op, expr$$1, null, positional, named, blocks, false, false);
  }
});
STATEMENTS.add(40
/* InElement */
, (op, [, block, guid, destination, insertBefore]) => {
  ReplayableIf(op, () => {
    expr(op, guid);

    if (insertBefore === undefined) {
      PushPrimitiveReference(op, undefined);
    } else {
      expr(op, insertBefore);
    }

    expr(op, destination);
    op(33
    /* Dup */
    , $sp, 0);
    return 4;
  }, () => {
    op(50
    /* PushRemoteElement */
    );
    InvokeStaticBlock(op, block);
    op(56
    /* PopRemoteElement */
    );
  });
});
STATEMENTS.add(41
/* If */
, (op, [, condition, block, inverse]) => ReplayableIf(op, () => {
  expr(op, condition);
  op(71
  /* ToBoolean */
  );
  return 1;
}, () => {
  InvokeStaticBlock(op, block);
}, inverse ? () => {
  InvokeStaticBlock(op, inverse);
} : undefined));
STATEMENTS.add(42
/* Each */
, (op, [, value, key, block, inverse]) => Replayable(op, () => {
  if (key) {
    expr(op, key);
  } else {
    PushPrimitiveReference(op, null);
  }

  expr(op, value);
  return 2;
}, () => {
  op(72
  /* EnterList */
  , labelOperand('BODY'), labelOperand('ELSE'));
  op(0
  /* PushFrame */
  );
  op(33
  /* Dup */
  , $fp, 1);
  op(6
  /* ReturnTo */
  , labelOperand('ITER'));
  op(1000
  /* Label */
  , 'ITER');
  op(74
  /* Iterate */
  , labelOperand('BREAK'));
  op(1000
  /* Label */
  , 'BODY');
  InvokeStaticBlockWithStack(op, block, 2);
  op(34
  /* Pop */
  , 2);
  op(4
  /* Jump */
  , labelOperand('FINALLY'));
  op(1000
  /* Label */
  , 'BREAK');
  op(1
  /* PopFrame */
  );
  op(73
  /* ExitList */
  );
  op(4
  /* Jump */
  , labelOperand('FINALLY'));
  op(1000
  /* Label */
  , 'ELSE');

  if (inverse) {
    InvokeStaticBlock(op, inverse);
  }
}));
STATEMENTS.add(43
/* With */
, (op, [, value, block, inverse]) => {
  ReplayableIf(op, () => {
    expr(op, value);
    op(33
    /* Dup */
    , $sp, 0);
    op(71
    /* ToBoolean */
    );
    return 2;
  }, () => {
    InvokeStaticBlockWithStack(op, block, 1);
  }, () => {
    if (inverse) {
      InvokeStaticBlock(op, inverse);
    }
  });
});
STATEMENTS.add(44
/* Let */
, (op, [, positional, block]) => {
  let count = CompilePositional(op, positional);
  InvokeStaticBlockWithStack(op, block, count);
});
STATEMENTS.add(45
/* WithDynamicVars */
, (op, [, named, block]) => {
  if (named) {
    let [names, expressions] = named;
    CompilePositional(op, expressions);
    DynamicScope(op, names, () => {
      InvokeStaticBlock(op, block);
    });
  } else {
    InvokeStaticBlock(op, block);
  }
});
STATEMENTS.add(46
/* InvokeComponent */
, (op, [, expr$$1, positional, named, blocks]) => {
  if (isGetFreeComponent(expr$$1)) {
    op(1004
    /* ResolveComponent */
    , expr$$1, component => {
      InvokeComponent(op, component, null, positional, hashToArgs(named), blocks);
    });
  } else {
    InvokeDynamicComponent(op, expr$$1, null, positional, named, blocks, false, false);
  }
});

function hashToArgs(hash) {
  if (hash === null) return null;
  let names = hash[0].map(key => `@${key}`);
  return [names, hash[1]];
}

const PLACEHOLDER_HANDLE = -1;

class CompilableTemplateImpl {
  constructor(statements, meta$$1, // Part of CompilableTemplate
  symbolTable, // Used for debugging
  moduleName = 'plain block') {
    this.statements = statements;
    this.meta = meta$$1;
    this.symbolTable = symbolTable;
    this.moduleName = moduleName;
    this.compiled = null;
  } // Part of CompilableTemplate


  compile(context) {
    return maybeCompile(this, context);
  }

}

function compilable(layout, moduleName) {
  let [statements, symbols, hasEval] = layout.block;
  return new CompilableTemplateImpl(statements, meta(layout), {
    symbols,
    hasEval
  }, moduleName);
}

function maybeCompile(compilable, context) {
  if (compilable.compiled !== null) return compilable.compiled;
  compilable.compiled = PLACEHOLDER_HANDLE;
  let {
    statements,
    meta: meta$$1
  } = compilable;
  let result = compileStatements(statements, meta$$1, context);
  compilable.compiled = result;
  return result;
}

function compileStatements(statements, meta$$1, syntaxContext) {
  let sCompiler = STATEMENTS;
  let context = templateCompilationContext(syntaxContext, meta$$1);
  let {
    encoder,
    program: {
      constants,
      resolver
    }
  } = context;

  function pushOp(...op) {
    encodeOp(encoder, constants, resolver, meta$$1, op);
  }

  for (let i = 0; i < statements.length; i++) {
    sCompiler.compile(pushOp, statements[i]);
  }

  let handle = context.encoder.commit(meta$$1.size);

  return handle;
}
function compilableBlock(block, containing) {
  return new CompilableTemplateImpl(block[0], containing, {
    parameters: block[1] || EMPTY_ARRAY
  });
}

class Labels {
  constructor() {
    this.labels = dict();
    this.targets = [];
  }

  label(name, index) {
    this.labels[name] = index;
  }

  target(at, target) {
    this.targets.push({
      at,
      target
    });
  }

  patch(heap) {
    let {
      targets,
      labels
    } = this;

    for (let i = 0; i < targets.length; i++) {
      let {
        at,
        target
      } = targets[i];
      let address = labels[target] - at;
      heap.setbyaddr(at, address);
    }
  }

}
function encodeOp(encoder, constants, resolver, meta, op) {
  if (isBuilderOpcode(op[0])) {
    let [type, ...operands] = op;
    encoder.push(constants, type, ...operands);
  } else {
    switch (op[0]) {
      case 1000
      /* Label */
      :
        return encoder.label(op[1]);

      case 1001
      /* StartLabels */
      :
        return encoder.startLabels();

      case 1002
      /* StopLabels */
      :
        return encoder.stopLabels();

      case 1004
      /* ResolveComponent */
      :
        return resolveComponent(resolver, constants, meta, op);

      case 1003
      /* ResolveModifier */
      :
        return resolveModifier(resolver, constants, meta, op);

      case 1005
      /* ResolveHelper */
      :
        return resolveHelper(resolver, constants, meta, op);

      case 1007
      /* ResolveComponentOrHelper */
      :
        return resolveComponentOrHelper(resolver, constants, meta, op);

      case 1006
      /* ResolveOptionalHelper */
      :
        return resolveOptionalHelper(resolver, constants, meta, op);

      case 1008
      /* ResolveOptionalComponentOrHelper */
      :
        return resolveOptionalComponentOrHelper(resolver, constants, meta, op);

      case 1010
      /* ResolveLocal */
      :
        let freeVar = op[1];
        let name = meta.upvars[freeVar];

        if (meta.asPartial === true) {
          encoder.push(constants, 102
          /* ResolveMaybeLocal */
          , name);
        } else {
          let then = op[2];
          then(name, meta.moduleName);
        }

        break;

      case 1011
      /* ResolveTemplateLocal */
      :
        let [, valueIndex, then] = op;
        let value = meta.scopeValues[valueIndex];
        then(constants.value(value));
        break;

      case 1009
      /* ResolveFree */
      :
        if (DEBUG) {
          let [, upvarIndex] = op;
          let freeName = meta.upvars[upvarIndex];
          throw new Error(`Attempted to resolve a value in a strict mode template, but that value was not in scope: ${freeName}`);
        }

        break;

      default:
        throw new Error(`Unexpected high level opcode ${op[0]}`);
    }
  }
}
class EncoderImpl {
  constructor(heap, meta, stdlib) {
    this.heap = heap;
    this.meta = meta;
    this.stdlib = stdlib;
    this.labelsStack = new Stack();
    this.encoder = new InstructionEncoderImpl([]);
    this.errors = [];
    this.handle = heap.malloc();
  }

  error(error) {
    this.encoder.encode(30
    /* Primitive */
    , 0);
    this.errors.push(error);
  }

  commit(size) {
    let handle = this.handle;
    this.heap.push(5
    /* Return */
    | 1024
    /* MACHINE_MASK */
    );
    this.heap.finishMalloc(handle, size);

    if (this.errors.length) {
      return {
        errors: this.errors,
        handle
      };
    } else {
      return handle;
    }
  }

  push(constants, type, ...args) {
    let {
      heap
    } = this;

    if (DEBUG && type > 255
    /* TYPE_SIZE */
    ) {
        throw new Error(`Opcode type over 8-bits. Got ${type}.`);
      }

    let machine = isMachineOp(type) ? 1024
    /* MACHINE_MASK */
    : 0;
    let first = type | machine | args.length << 8
    /* ARG_SHIFT */
    ;
    heap.push(first);

    for (let i = 0; i < args.length; i++) {
      let op = args[i];
      heap.push(this.operand(constants, op));
    }
  }

  operand(constants, operand) {
    if (typeof operand === 'number') {
      return operand;
    }

    if (typeof operand === 'object' && operand !== null) {
      if (Array.isArray(operand)) {
        return encodeHandle(constants.array(operand));
      } else {
        switch (operand.type) {
          case 1
          /* Label */
          :
            this.currentLabels.target(this.heap.offset, operand.value);
            return -1;

          case 2
          /* IsStrictMode */
          :
            return encodeHandle(constants.value(this.meta.isStrictMode));

          case 3
          /* EvalSymbols */
          :
            return encodeHandle(constants.array(this.meta.evalSymbols || EMPTY_STRING_ARRAY));

          case 4
          /* Block */
          :
            return encodeHandle(constants.value(compilableBlock(operand.value, this.meta)));

          case 5
          /* StdLib */
          :
            return this.stdlib[operand.value];

          case 6
          /* NonSmallInt */
          :
          case 7
          /* SymbolTable */
          :
          case 8
          /* Layout */
          :
            return constants.value(operand.value);
        }
      }
    }

    return encodeHandle(constants.value(operand));
  }

  get currentLabels() {
    return this.labelsStack.current;
  }

  label(name) {
    this.currentLabels.label(name, this.heap.offset + 1);
  }

  startLabels() {
    this.labelsStack.push(new Labels());
  }

  stopLabels() {
    let label = this.labelsStack.pop();
    label.patch(this.heap);
  }

}

function isBuilderOpcode(op) {
  return op < 1000
  /* Start */
  ;
}

function main(op) {
  op(75
  /* Main */
  , $s0);
  invokePreparedComponent(op, false, false, true);
}
/**
 * Append content to the DOM. This standard function triages content and does the
 * right thing based upon whether it's a string, safe string, component, fragment
 * or node.
 *
 * @param trusting whether to interpolate a string as raw HTML (corresponds to
 * triple curlies)
 */

function StdAppend(op, trusting, nonDynamicAppend) {
  SwitchCases(op, () => op(76
  /* ContentType */
  ), when => {
    when(2
    /* String */
    , () => {
      if (trusting) {
        op(68
        /* AssertSame */
        );
        op(43
        /* AppendHTML */
        );
      } else {
        op(47
        /* AppendText */
        );
      }
    });

    if (typeof nonDynamicAppend === 'number') {
      when(0
      /* Component */
      , () => {
        op(81
        /* ResolveCurriedComponent */
        );
        op(79
        /* PushDynamicComponentInstance */
        );
        InvokeBareComponent(op);
      });
      when(1
      /* Helper */
      , () => {
        CallDynamic(op, null, null, () => {
          op(3
          /* InvokeStatic */
          , nonDynamicAppend);
        });
      });
    } else {
      // when non-dynamic, we can no longer call the value (potentially because we've already called it)
      // this prevents infinite loops. We instead coerce the value, whatever it is, into the DOM.
      when(0
      /* Component */
      , () => {
        op(47
        /* AppendText */
        );
      });
      when(1
      /* Helper */
      , () => {
        op(47
        /* AppendText */
        );
      });
    }

    when(4
    /* SafeString */
    , () => {
      op(68
      /* AssertSame */
      );
      op(44
      /* AppendSafeHTML */
      );
    });
    when(5
    /* Fragment */
    , () => {
      op(68
      /* AssertSame */
      );
      op(45
      /* AppendDocumentFragment */
      );
    });
    when(6
    /* Node */
    , () => {
      op(68
      /* AssertSame */
      );
      op(46
      /* AppendNode */
      );
    });
  });
}
function compileStd(context) {
  let mainHandle = build(context, op => main(op));
  let trustingGuardedNonDynamicAppend = build(context, op => StdAppend(op, true, null));
  let cautiousGuardedNonDynamicAppend = build(context, op => StdAppend(op, false, null));
  let trustingGuardedDynamicAppend = build(context, op => StdAppend(op, true, trustingGuardedNonDynamicAppend));
  let cautiousGuardedDynamicAppend = build(context, op => StdAppend(op, false, cautiousGuardedNonDynamicAppend));
  return new StdLib(mainHandle, trustingGuardedDynamicAppend, cautiousGuardedDynamicAppend, trustingGuardedNonDynamicAppend, cautiousGuardedNonDynamicAppend);
}
const STDLIB_META = {
  asPartial: false,
  evalSymbols: null,
  upvars: null,
  moduleName: 'stdlib',
  // TODO: ??
  scopeValues: null,
  isStrictMode: true,
  owner: null,
  size: 0
};

function build(program, callback) {
  let {
    constants,
    heap,
    resolver
  } = program;
  let encoder = new EncoderImpl(heap, STDLIB_META);

  function pushOp(...op) {
    encodeOp(encoder, constants, resolver, STDLIB_META, op);
  }

  callback(pushOp);
  let result = encoder.commit(0);

  if (typeof result !== 'number') {
    // This shouldn't be possible
    throw new Error(`Unexpected errors compiling std`);
  } else {
    return result;
  }
}

class CompileTimeCompilationContextImpl {
  constructor({
    constants,
    heap
  }, resolver) {
    this.resolver = resolver;
    this.constants = constants;
    this.heap = heap;
    this.stdlib = compileStd(this);
  }

}

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
  willDestroy: false,
  hasSubOwner: false
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
  willDestroy: false,
  hasSubOwner: false
};

class PartialDefinitionImpl {
  constructor(name, // for debugging
  template) {
    this.name = name;
    this.template = template;
  }

  getPartial(context) {
    let partial = unwrapTemplate(this.template).asPartial();
    let handle = partial.compile(context);
    return {
      symbolTable: partial.symbolTable,
      handle
    };
  }

}

class WrappedBuilder {
  constructor(layout, moduleName) {
    this.layout = layout;
    this.moduleName = moduleName;
    this.compiled = null;
    let {
      block
    } = layout;
    let [, symbols, hasEval] = block;
    symbols = symbols.slice(); // ensure ATTRS_BLOCK is always included (only once) in the list of symbols

    let attrsBlockIndex = symbols.indexOf(ATTRS_BLOCK);

    if (attrsBlockIndex === -1) {
      this.attrsBlockNumber = symbols.push(ATTRS_BLOCK);
    } else {
      this.attrsBlockNumber = attrsBlockIndex + 1;
    }

    this.symbolTable = {
      hasEval,
      symbols
    };
  }

  compile(syntax) {
    if (this.compiled !== null) return this.compiled;
    let m = meta(this.layout);
    let context = templateCompilationContext(syntax, m);
    let {
      encoder,
      program: {
        constants,
        resolver
      }
    } = context;

    function pushOp(...op) {
      encodeOp(encoder, constants, resolver, m, op);
    }

    WrappedComponent(pushOp, this.layout, this.attrsBlockNumber);
    let handle = context.encoder.commit(m.size);

    if (typeof handle !== 'number') {
      return handle;
    }

    this.compiled = handle;

    return handle;
  }

}

let clientId = 0;
let templateCacheCounters = {
  cacheHit: 0,
  cacheMiss: 0
};
/**
 * Wraps a template js in a template module to change it into a factory
 * that handles lazy parsing the template and to create per env singletons
 * of the template.
 */

function templateFactory({
  id: templateId,
  moduleName,
  block,
  scope,
  isStrictMode
}) {
  // TODO(template-refactors): This should be removed in the near future, as it
  // appears that id is unused. It is currently kept for backwards compat reasons.
  let id = templateId || `client-${clientId++}`; // TODO: This caches JSON serialized output once in case a template is
  // compiled by multiple owners, but we haven't verified if this is actually
  // helpful. We should benchmark this in the future.

  let parsedBlock;
  let ownerlessTemplate = null;
  let templateCache = new WeakMap();

  let factory = owner => {
    if (parsedBlock === undefined) {
      parsedBlock = JSON.parse(block);
    }

    if (owner === undefined) {
      if (ownerlessTemplate === null) {
        templateCacheCounters.cacheMiss++;
        ownerlessTemplate = new TemplateImpl({
          id,
          block: parsedBlock,
          moduleName,
          owner: null,
          scope,
          isStrictMode
        });
      } else {
        templateCacheCounters.cacheHit++;
      }

      return ownerlessTemplate;
    }

    let result = templateCache.get(owner);

    if (result === undefined) {
      templateCacheCounters.cacheMiss++;
      result = new TemplateImpl({
        id,
        block: parsedBlock,
        moduleName,
        owner,
        scope,
        isStrictMode
      });
      templateCache.set(owner, result);
    } else {
      templateCacheCounters.cacheHit++;
    }

    return result;
  };

  factory.__id = id;
  factory.__meta = {
    moduleName
  };
  return factory;
}

class TemplateImpl {
  constructor(parsedLayout) {
    this.parsedLayout = parsedLayout;
    this.result = 'ok';
    this.layout = null;
    this.partial = null;
    this.wrappedLayout = null;
  }

  get moduleName() {
    return this.parsedLayout.moduleName;
  }

  get id() {
    return this.parsedLayout.id;
  } // TODO(template-refactors): This should be removed in the near future, it is
  // only being exposed for backwards compatibility


  get referrer() {
    return {
      moduleName: this.parsedLayout.moduleName,
      owner: this.parsedLayout.owner
    };
  }

  asLayout() {
    if (this.layout) return this.layout;
    return this.layout = compilable(assign({}, this.parsedLayout, {
      asPartial: false
    }), this.moduleName);
  }

  asPartial() {
    if (this.partial) return this.partial;
    return this.partial = compilable(assign({}, this.parsedLayout, {
      asPartial: true
    }), this.moduleName);
  }

  asWrappedLayout() {
    if (this.wrappedLayout) return this.wrappedLayout;
    return this.wrappedLayout = new WrappedBuilder(assign({}, this.parsedLayout, {
      asPartial: false
    }), this.moduleName);
  }

}

export { debugCompiler, compileStatements, compilable, InvokeStaticBlockWithStack as invokeStaticBlockWithStack, InvokeStaticBlock as invokeStaticBlock, compileStd, meta, StdLib, PartialDefinitionImpl, templateFactory, templateCacheCounters, WrappedBuilder, EMPTY_BLOCKS, CompileTimeCompilationContextImpl, programCompilationContext, templateCompilationContext, DEFAULT_CAPABILITIES, MINIMAL_CAPABILITIES };

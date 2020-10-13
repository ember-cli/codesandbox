define('@glimmer/syntax', ['exports', '@glimmer/util', 'simple-html-tokenizer', '@handlebars/parser'], function (exports, util, simpleHtmlTokenizer, parser) { 'use strict';

  function buildMustache(path, params, hash, raw, loc, strip) {
    if (typeof path === 'string') {
      path = buildHead(path);
    }

    return {
      type: 'MustacheStatement',
      path: path,
      params: params || [],
      hash: hash || buildHash([]),
      escaped: !raw,
      loc: buildLoc(loc || null),
      strip: strip || {
        open: false,
        close: false
      }
    };
  }

  function buildBlock(path, params, hash, _defaultBlock, _elseBlock, loc, openStrip, inverseStrip, closeStrip) {
    var defaultBlock;
    var elseBlock;

    if (_defaultBlock.type === 'Template') {

      defaultBlock = util.assign({}, _defaultBlock, {
        type: 'Block'
      });
    } else {
      defaultBlock = _defaultBlock;
    }

    if (_elseBlock !== undefined && _elseBlock !== null && _elseBlock.type === 'Template') {

      elseBlock = util.assign({}, _elseBlock, {
        type: 'Block'
      });
    } else {
      elseBlock = _elseBlock;
    }

    return {
      type: 'BlockStatement',
      path: buildHead(path),
      params: params || [],
      hash: hash || buildHash([]),
      program: defaultBlock || null,
      inverse: elseBlock || null,
      loc: buildLoc(loc || null),
      openStrip: openStrip || {
        open: false,
        close: false
      },
      inverseStrip: inverseStrip || {
        open: false,
        close: false
      },
      closeStrip: closeStrip || {
        open: false,
        close: false
      }
    };
  }

  function buildElementModifier(path, params, hash, loc) {
    return {
      type: 'ElementModifierStatement',
      path: buildHead(path),
      params: params || [],
      hash: hash || buildHash([]),
      loc: buildLoc(loc || null)
    };
  }

  function buildPartial(name, params, hash, indent, loc) {
    return {
      type: 'PartialStatement',
      name: name,
      params: params || [],
      hash: hash || buildHash([]),
      indent: indent || '',
      strip: {
        open: false,
        close: false
      },
      loc: buildLoc(loc || null)
    };
  }

  function buildComment(value, loc) {
    return {
      type: 'CommentStatement',
      value: value,
      loc: buildLoc(loc || null)
    };
  }

  function buildMustacheComment(value, loc) {
    return {
      type: 'MustacheCommentStatement',
      value: value,
      loc: buildLoc(loc || null)
    };
  }

  function buildConcat(parts, loc) {
    return {
      type: 'ConcatStatement',
      parts: parts || [],
      loc: buildLoc(loc || null)
    };
  }

  function isLocSexp(value) {
    return Array.isArray(value) && value.length === 2 && value[0] === 'loc';
  }
  function isParamsSexp(value) {
    return Array.isArray(value) && !isLocSexp(value);
  }
  function isHashSexp(value) {
    if (typeof value === 'object' && value && !Array.isArray(value)) {
      return true;
    } else {
      return false;
    }
  }

  function normalizeModifier(sexp) {
    if (typeof sexp === 'string') {
      return buildElementModifier(sexp);
    }

    var path = normalizeHead(sexp[0]);
    var params;
    var hash;
    var loc = null;
    var parts = sexp.slice(1);
    var next = parts.shift();

    _process: {
      if (isParamsSexp(next)) {
        params = next;
      } else {
        break _process;
      }

      next = parts.shift();

      if (isHashSexp(next)) {
        hash = normalizeHash(next);
      } else {
        break _process;
      }
    }

    if (isLocSexp(next)) {
      loc = next[1];
    }

    return {
      type: 'ElementModifierStatement',
      path: path,
      params: params || [],
      hash: hash || buildHash([]),
      loc: buildLoc(loc || null)
    };
  }
  function normalizeAttr(sexp) {
    var name = sexp[0];
    var value;

    if (typeof sexp[1] === 'string') {
      value = buildText(sexp[1]);
    } else {
      value = sexp[1];
    }

    var loc = sexp[2] ? sexp[2][1] : undefined;
    return buildAttr(name, value, loc);
  }
  function normalizeHash(hash, loc) {
    var pairs = [];
    Object.keys(hash).forEach(function (key) {
      pairs.push(buildPair(key, hash[key]));
    });
    return buildHash(pairs, loc);
  }
  function normalizeHead(path) {
    if (typeof path === 'string') {
      return buildHead(path);
    } else {
      return buildHead(path[1], path[2] && path[2][1]);
    }
  }
  function normalizeElementOptions() {
    var out = {};

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    for (var _i = 0, _args = args; _i < _args.length; _i++) {
      var arg = _args[_i];

      switch (arg[0]) {
        case 'attrs':
          {
            var rest = arg.slice(1);
            out.attrs = rest.map(normalizeAttr);
            break;
          }

        case 'modifiers':
          {
            var _rest = arg.slice(1);

            out.modifiers = _rest.map(normalizeModifier);
            break;
          }

        case 'body':
          {
            var _rest2 = arg.slice(1);

            out.children = _rest2;
            break;
          }

        case 'comments':
          {
            var _rest3 = arg.slice(1);

            out.comments = _rest3;
            break;
          }

        case 'as':
          {
            var _rest4 = arg.slice(1);

            out.blockParams = _rest4;
            break;
          }

        case 'loc':
          {
            var _rest5 = arg[1];
            out.loc = _rest5;
            break;
          }
      }
    }

    return out;
  }

  function buildElement(tag, options) {
    var normalized;

    if (Array.isArray(options)) {
      for (var _len2 = arguments.length, rest = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        rest[_key2 - 2] = arguments[_key2];
      }

      normalized = normalizeElementOptions.apply(void 0, [options].concat(rest));
    } else {
      normalized = options || {};
    }

    var _normalized = normalized,
        attrs = _normalized.attrs,
        blockParams = _normalized.blockParams,
        modifiers = _normalized.modifiers,
        comments = _normalized.comments,
        children = _normalized.children,
        loc = _normalized.loc; // this is used for backwards compat, prior to `selfClosing` being part of the ElementNode AST

    var selfClosing = false;

    if (typeof tag === 'object') {
      selfClosing = tag.selfClosing;
      tag = tag.name;
    } else {
      if (tag.slice(-1) === '/') {
        tag = tag.slice(0, -1);
        selfClosing = true;
      }
    }

    return {
      type: 'ElementNode',
      tag: tag || '',
      selfClosing: selfClosing,
      attributes: attrs || [],
      blockParams: blockParams || [],
      modifiers: modifiers || [],
      comments: comments || [],
      children: children || [],
      loc: buildLoc(loc || null)
    };
  }

  function buildAttr(name, value, loc) {
    return {
      type: 'AttrNode',
      name: name,
      value: value,
      loc: buildLoc(loc || null)
    };
  }

  function buildText(chars, loc) {
    return {
      type: 'TextNode',
      chars: chars || '',
      loc: buildLoc(loc || null)
    };
  } // Expressions


  function buildSexpr(path, params, hash, loc) {
    return {
      type: 'SubExpression',
      path: buildHead(path),
      params: params || [],
      hash: hash || buildHash([]),
      loc: buildLoc(loc || null)
    };
  }

  function buildHead(original, loc) {
    if (typeof original !== 'string') return original;
    var parts = original.split('.');
    var thisHead = false;

    if (parts[0] === 'this') {
      thisHead = true;
      parts = parts.slice(1);
    }

    return {
      type: 'PathExpression',
      original: original,
      "this": thisHead,
      parts: parts,
      data: false,
      loc: buildLoc(loc || null)
    };
  }

  function buildLiteral(type, value, loc) {
    return {
      type: type,
      value: value,
      original: value,
      loc: buildLoc(loc || null)
    };
  } // Miscellaneous


  function buildHash(pairs, loc) {
    return {
      type: 'Hash',
      pairs: pairs || [],
      loc: buildLoc(loc || null)
    };
  }

  function buildPair(key, value, loc) {
    return {
      type: 'HashPair',
      key: key,
      value: value,
      loc: buildLoc(loc || null)
    };
  }

  function buildProgram(body, blockParams, loc) {
    return {
      type: 'Template',
      body: body || [],
      blockParams: blockParams || [],
      loc: buildLoc(loc || null)
    };
  }

  function buildBlockItself(body, blockParams, chained, loc) {
    if (chained === void 0) {
      chained = false;
    }

    return {
      type: 'Block',
      body: body || [],
      blockParams: blockParams || [],
      chained: chained,
      loc: buildLoc(loc || null)
    };
  }

  function buildTemplate(body, blockParams, loc) {
    return {
      type: 'Template',
      body: body || [],
      blockParams: blockParams || [],
      loc: buildLoc(loc || null)
    };
  }

  function buildSource(source) {
    return source || null;
  }

  function buildPosition(line, column) {
    return {
      line: line,
      column: column
    };
  }

  var SYNTHETIC = {
    source: '(synthetic)',
    start: {
      line: 1,
      column: 0
    },
    end: {
      line: 1,
      column: 0
    }
  };

  function buildLoc() {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    if (args.length === 1) {
      var loc = args[0];

      if (loc && typeof loc === 'object') {
        return {
          source: buildSource(loc.source),
          start: buildPosition(loc.start.line, loc.start.column),
          end: buildPosition(loc.end.line, loc.end.column)
        };
      } else {
        return SYNTHETIC;
      }
    } else {
      var startLine = args[0],
          startColumn = args[1],
          endLine = args[2],
          endColumn = args[3],
          source = args[4];
      return {
        source: buildSource(source),
        start: buildPosition(startLine, startColumn),
        end: buildPosition(endLine, endColumn)
      };
    }
  }

  var builders = {
    mustache: buildMustache,
    block: buildBlock,
    partial: buildPartial,
    comment: buildComment,
    mustacheComment: buildMustacheComment,
    element: buildElement,
    elementModifier: buildElementModifier,
    attr: buildAttr,
    text: buildText,
    sexpr: buildSexpr,
    path: buildHead,
    concat: buildConcat,
    hash: buildHash,
    pair: buildPair,
    literal: buildLiteral,
    program: buildProgram,
    blockItself: buildBlockItself,
    template: buildTemplate,
    loc: buildLoc,
    pos: buildPosition,
    string: literal('StringLiteral'),
    "boolean": literal('BooleanLiteral'),
    number: literal('NumberLiteral'),
    undefined: function (_undefined) {
      function undefined$1() {
        return _undefined.apply(this, arguments);
      }

      undefined$1.toString = function () {
        return _undefined.toString();
      };

      return undefined$1;
    }(function () {
      return buildLiteral('UndefinedLiteral', undefined);
    }),
    "null": function _null() {
      return buildLiteral('NullLiteral', null);
    }
  };

  function literal(type) {
    return function (value) {
      return buildLiteral(type, value);
    };
  }

  /**
   * Subclass of `Error` with additional information
   * about location of incorrect markup.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  var SyntaxError = function () {
    SyntaxError.prototype = Object.create(Error.prototype);
    SyntaxError.prototype.constructor = SyntaxError;

    function SyntaxError(message, location) {
      var error = Error.call(this, message);
      this.message = message;
      this.stack = error.stack;
      this.location = location;
    }

    return SyntaxError;
  }();

  // Based on the ID validation regex in Handlebars.

  var ID_INVERSE_PATTERN = /[!"#%-,\.\/;->@\[-\^`\{-~]/; // Checks the element's attributes to see if it uses block params.
  // If it does, registers the block params with the program and
  // removes the corresponding attributes from the element.

  function parseElementBlockParams(element) {
    var params = parseBlockParams(element);
    if (params) element.blockParams = params;
  }

  function parseBlockParams(element) {
    var l = element.attributes.length;
    var attrNames = [];

    for (var i = 0; i < l; i++) {
      attrNames.push(element.attributes[i].name);
    }

    var asIndex = attrNames.indexOf('as');

    if (asIndex !== -1 && l > asIndex && attrNames[asIndex + 1].charAt(0) === '|') {
      // Some basic validation, since we're doing the parsing ourselves
      var paramsString = attrNames.slice(asIndex).join(' ');

      if (paramsString.charAt(paramsString.length - 1) !== '|' || paramsString.match(/\|/g).length !== 2) {
        throw new SyntaxError("Invalid block parameters syntax: '" + paramsString + "'", element.loc);
      }

      var params = [];

      for (var _i = asIndex + 1; _i < l; _i++) {
        var param = attrNames[_i].replace(/\|/g, '');

        if (param !== '') {
          if (ID_INVERSE_PATTERN.test(param)) {
            throw new SyntaxError("Invalid identifier for block parameters: '" + param + "' in '" + paramsString + "'", element.loc);
          }

          params.push(param);
        }
      }

      if (params.length === 0) {
        throw new SyntaxError("Cannot use zero block parameters: '" + paramsString + "'", element.loc);
      }

      element.attributes = element.attributes.slice(0, asIndex);
      return params;
    }

    return null;
  }

  function childrenFor(node) {
    switch (node.type) {
      case 'Block':
      case 'Template':
        return node.body;

      case 'ElementNode':
        return node.children;
    }
  }
  function appendChild(parent, node) {
    childrenFor(parent).push(node);
  }
  function isLiteral(path) {
    return path.type === 'StringLiteral' || path.type === 'BooleanLiteral' || path.type === 'NumberLiteral' || path.type === 'NullLiteral' || path.type === 'UndefinedLiteral';
  }
  function printLiteral(literal) {
    if (literal.type === 'UndefinedLiteral') {
      return 'undefined';
    } else {
      return JSON.stringify(literal.value);
    }
  }

  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }
  var Parser = /*#__PURE__*/function () {
    function Parser(source, entityParser) {
      if (entityParser === void 0) {
        entityParser = new simpleHtmlTokenizer.EntityParser(simpleHtmlTokenizer.HTML5NamedCharRefs);
      }

      this.elementStack = [];
      this.currentAttribute = null;
      this.currentNode = null;
      this.source = source.split(/(?:\r\n?|\n)/g);
      this.tokenizer = new simpleHtmlTokenizer.EventedTokenizer(this, entityParser);
    }

    var _proto = Parser.prototype;

    _proto.acceptTemplate = function acceptTemplate(node) {
      return this[node.type](node);
    };

    _proto.acceptNode = function acceptNode(node) {
      return this[node.type](node);
    };

    _proto.currentElement = function currentElement() {
      return this.elementStack[this.elementStack.length - 1];
    };

    _proto.sourceForNode = function sourceForNode(node, endNode) {
      var firstLine = node.loc.start.line - 1;
      var currentLine = firstLine - 1;
      var firstColumn = node.loc.start.column;
      var string = [];
      var line;
      var lastLine;
      var lastColumn;

      if (endNode) {
        lastLine = endNode.loc.end.line - 1;
        lastColumn = endNode.loc.end.column;
      } else {
        lastLine = node.loc.end.line - 1;
        lastColumn = node.loc.end.column;
      }

      while (currentLine < lastLine) {
        currentLine++;
        line = this.source[currentLine];

        if (currentLine === firstLine) {
          if (firstLine === lastLine) {
            string.push(line.slice(firstColumn, lastColumn));
          } else {
            string.push(line.slice(firstColumn));
          }
        } else if (currentLine === lastLine) {
          string.push(line.slice(0, lastColumn));
        } else {
          string.push(line);
        }
      }

      return string.join('\n');
    };

    _createClass(Parser, [{
      key: "currentAttr",
      get: function get() {
        return this.currentAttribute;
      }
    }, {
      key: "currentTag",
      get: function get() {
        var node = this.currentNode;
        return node;
      }
    }, {
      key: "currentStartTag",
      get: function get() {
        var node = this.currentNode;
        return node;
      }
    }, {
      key: "currentEndTag",
      get: function get() {
        var node = this.currentNode;
        return node;
      }
    }, {
      key: "currentComment",
      get: function get() {
        var node = this.currentNode;
        return node;
      }
    }, {
      key: "currentData",
      get: function get() {
        var node = this.currentNode;
        return node;
      }
    }]);

    return Parser;
  }();

  function _defineProperties$1(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass$1(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$1(Constructor.prototype, protoProps); if (staticProps) _defineProperties$1(Constructor, staticProps); return Constructor; }

  function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }
  var HandlebarsNodeVisitors = /*#__PURE__*/function (_Parser) {
    _inheritsLoose(HandlebarsNodeVisitors, _Parser);

    function HandlebarsNodeVisitors() {
      return _Parser.apply(this, arguments) || this;
    }

    var _proto = HandlebarsNodeVisitors.prototype;

    _proto.Program = function Program(program) {
      var body = [];
      var node;

      if (this.isTopLevel) {
        node = builders.template(body, program.blockParams, program.loc);
      } else {
        node = builders.blockItself(body, program.blockParams, program.chained, program.loc);
      }

      var i,
          l = program.body.length;
      this.elementStack.push(node);

      if (l === 0) {
        return this.elementStack.pop();
      }

      for (i = 0; i < l; i++) {
        this.acceptNode(program.body[i]);
      } // Ensure that that the element stack is balanced properly.


      var poppedNode = this.elementStack.pop();

      if (poppedNode !== node) {
        var elementNode = poppedNode;
        throw new SyntaxError('Unclosed element `' + elementNode.tag + '` (on line ' + elementNode.loc.start.line + ').', elementNode.loc);
      }

      return node;
    };

    _proto.BlockStatement = function BlockStatement(block) {
      if (this.tokenizer.state === "comment"
      /* comment */
      ) {
          this.appendToCommentData(this.sourceForNode(block));
          return;
        }

      if (this.tokenizer.state !== "data"
      /* data */
      && this.tokenizer['state'] !== "beforeData"
      /* beforeData */
      ) {
          throw new SyntaxError('A block may only be used inside an HTML element or another block.', block.loc);
        }

      var _acceptCallNodes = acceptCallNodes(this, block),
          path = _acceptCallNodes.path,
          params = _acceptCallNodes.params,
          hash = _acceptCallNodes.hash;

      var program = this.Program(block.program);
      var inverse = block.inverse ? this.Program(block.inverse) : null;
      var node = builders.block(path, params, hash, program, inverse, block.loc, block.openStrip, block.inverseStrip, block.closeStrip);
      var parentProgram = this.currentElement();
      appendChild(parentProgram, node);
    };

    _proto.MustacheStatement = function MustacheStatement(rawMustache) {
      var tokenizer = this.tokenizer;

      if (tokenizer.state === 'comment') {
        this.appendToCommentData(this.sourceForNode(rawMustache));
        return;
      }

      var mustache;
      var escaped = rawMustache.escaped,
          loc = rawMustache.loc,
          strip = rawMustache.strip;

      if (isLiteral(rawMustache.path)) {
        mustache = {
          type: 'MustacheStatement',
          path: this.acceptNode(rawMustache.path),
          params: [],
          hash: builders.hash(),
          escaped: escaped,
          loc: loc,
          strip: strip
        };
      } else {
        var _acceptCallNodes2 = acceptCallNodes(this, rawMustache),
            path = _acceptCallNodes2.path,
            params = _acceptCallNodes2.params,
            hash = _acceptCallNodes2.hash;

        mustache = builders.mustache(path, params, hash, !escaped, loc, strip);
      }

      switch (tokenizer.state) {
        // Tag helpers
        case "tagOpen"
        /* tagOpen */
        :
        case "tagName"
        /* tagName */
        :
          throw new SyntaxError("Cannot use mustaches in an elements tagname: `" + this.sourceForNode(rawMustache, rawMustache.path) + "` at L" + loc.start.line + ":C" + loc.start.column, mustache.loc);

        case "beforeAttributeName"
        /* beforeAttributeName */
        :
          addElementModifier(this.currentStartTag, mustache);
          break;

        case "attributeName"
        /* attributeName */
        :
        case "afterAttributeName"
        /* afterAttributeName */
        :
          this.beginAttributeValue(false);
          this.finishAttributeValue();
          addElementModifier(this.currentStartTag, mustache);
          tokenizer.transitionTo("beforeAttributeName"
          /* beforeAttributeName */
          );
          break;

        case "afterAttributeValueQuoted"
        /* afterAttributeValueQuoted */
        :
          addElementModifier(this.currentStartTag, mustache);
          tokenizer.transitionTo("beforeAttributeName"
          /* beforeAttributeName */
          );
          break;
        // Attribute values

        case "beforeAttributeValue"
        /* beforeAttributeValue */
        :
          this.beginAttributeValue(false);
          appendDynamicAttributeValuePart(this.currentAttribute, mustache);
          tokenizer.transitionTo("attributeValueUnquoted"
          /* attributeValueUnquoted */
          );
          break;

        case "attributeValueDoubleQuoted"
        /* attributeValueDoubleQuoted */
        :
        case "attributeValueSingleQuoted"
        /* attributeValueSingleQuoted */
        :
        case "attributeValueUnquoted"
        /* attributeValueUnquoted */
        :
          appendDynamicAttributeValuePart(this.currentAttribute, mustache);
          break;
        // TODO: Only append child when the tokenizer state makes
        // sense to do so, otherwise throw an error.

        default:
          appendChild(this.currentElement(), mustache);
      }

      return mustache;
    };

    _proto.ContentStatement = function ContentStatement(content) {
      updateTokenizerLocation(this.tokenizer, content);
      this.tokenizer.tokenizePart(content.value);
      this.tokenizer.flushData();
    };

    _proto.CommentStatement = function CommentStatement(rawComment) {
      var tokenizer = this.tokenizer;

      if (tokenizer.state === "comment"
      /* comment */
      ) {
          this.appendToCommentData(this.sourceForNode(rawComment));
          return null;
        }

      var value = rawComment.value,
          loc = rawComment.loc;
      var comment = builders.mustacheComment(value, loc);

      switch (tokenizer.state) {
        case "beforeAttributeName"
        /* beforeAttributeName */
        :
          this.currentStartTag.comments.push(comment);
          break;

        case "beforeData"
        /* beforeData */
        :
        case "data"
        /* data */
        :
          appendChild(this.currentElement(), comment);
          break;

        default:
          throw new SyntaxError("Using a Handlebars comment when in the `" + tokenizer['state'] + "` state is not supported: \"" + comment.value + "\" on line " + loc.start.line + ":" + loc.start.column, rawComment.loc);
      }

      return comment;
    };

    _proto.PartialStatement = function PartialStatement(partial) {
      var loc = partial.loc;
      throw new SyntaxError("Handlebars partials are not supported: \"" + this.sourceForNode(partial, partial.name) + "\" at L" + loc.start.line + ":C" + loc.start.column, partial.loc);
    };

    _proto.PartialBlockStatement = function PartialBlockStatement(partialBlock) {
      var loc = partialBlock.loc;
      throw new SyntaxError("Handlebars partial blocks are not supported: \"" + this.sourceForNode(partialBlock, partialBlock.name) + "\" at L" + loc.start.line + ":C" + loc.start.column, partialBlock.loc);
    };

    _proto.Decorator = function Decorator(decorator) {
      var loc = decorator.loc;
      throw new SyntaxError("Handlebars decorators are not supported: \"" + this.sourceForNode(decorator, decorator.path) + "\" at L" + loc.start.line + ":C" + loc.start.column, decorator.loc);
    };

    _proto.DecoratorBlock = function DecoratorBlock(decoratorBlock) {
      var loc = decoratorBlock.loc;
      throw new SyntaxError("Handlebars decorator blocks are not supported: \"" + this.sourceForNode(decoratorBlock, decoratorBlock.path) + "\" at L" + loc.start.line + ":C" + loc.start.column, decoratorBlock.loc);
    };

    _proto.SubExpression = function SubExpression(sexpr) {
      var _acceptCallNodes3 = acceptCallNodes(this, sexpr),
          path = _acceptCallNodes3.path,
          params = _acceptCallNodes3.params,
          hash = _acceptCallNodes3.hash;

      return builders.sexpr(path, params, hash, sexpr.loc);
    };

    _proto.PathExpression = function PathExpression(path) {
      var original = path.original,
          loc = path.loc;
      var parts;

      if (original.indexOf('/') !== -1) {
        if (original.slice(0, 2) === './') {
          throw new SyntaxError("Using \"./\" is not supported in Glimmer and unnecessary: \"" + path.original + "\" on line " + loc.start.line + ".", path.loc);
        }

        if (original.slice(0, 3) === '../') {
          throw new SyntaxError("Changing context using \"../\" is not supported in Glimmer: \"" + path.original + "\" on line " + loc.start.line + ".", path.loc);
        }

        if (original.indexOf('.') !== -1) {
          throw new SyntaxError("Mixing '.' and '/' in paths is not supported in Glimmer; use only '.' to separate property paths: \"" + path.original + "\" on line " + loc.start.line + ".", path.loc);
        }

        parts = [path.parts.join('/')];
      } else if (original === '.') {
        var locationInfo = "L" + loc.start.line + ":C" + loc.start.column;
        throw new SyntaxError("'.' is not a supported path in Glimmer; check for a path with a trailing '.' at " + locationInfo + ".", path.loc);
      } else {
        parts = path.parts;
      }

      var thisHead = false; // This is to fix a bug in the Handlebars AST where the path expressions in
      // `{{this.foo}}` (and similarly `{{foo-bar this.foo named=this.foo}}` etc)
      // are simply turned into `{{foo}}`. The fix is to push it back onto the
      // parts array and let the runtime see the difference. However, we cannot
      // simply use the string `this` as it means literally the property called
      // "this" in the current context (it can be expressed in the syntax as
      // `{{[this]}}`, where the square bracket are generally for this kind of
      // escaping – such as `{{foo.["bar.baz"]}}` would mean lookup a property
      // named literally "bar.baz" on `this.foo`). By convention, we use `null`
      // for this purpose.

      if (original.match(/^this(\..+)?$/)) {
        thisHead = true;
      }

      return {
        type: 'PathExpression',
        original: path.original,
        "this": thisHead,
        parts: parts,
        data: path.data,
        loc: path.loc
      };
    };

    _proto.Hash = function Hash(hash) {
      var pairs = [];

      for (var i = 0; i < hash.pairs.length; i++) {
        var pair = hash.pairs[i];
        pairs.push(builders.pair(pair.key, this.acceptNode(pair.value), pair.loc));
      }

      return builders.hash(pairs, hash.loc);
    };

    _proto.StringLiteral = function StringLiteral(string) {
      return builders.literal('StringLiteral', string.value, string.loc);
    };

    _proto.BooleanLiteral = function BooleanLiteral(_boolean) {
      return builders.literal('BooleanLiteral', _boolean.value, _boolean.loc);
    };

    _proto.NumberLiteral = function NumberLiteral(number) {
      return builders.literal('NumberLiteral', number.value, number.loc);
    };

    _proto.UndefinedLiteral = function UndefinedLiteral(undef) {
      return builders.literal('UndefinedLiteral', undefined, undef.loc);
    };

    _proto.NullLiteral = function NullLiteral(nul) {
      return builders.literal('NullLiteral', null, nul.loc);
    };

    _createClass$1(HandlebarsNodeVisitors, [{
      key: "isTopLevel",
      get: function get() {
        return this.elementStack.length === 0;
      }
    }]);

    return HandlebarsNodeVisitors;
  }(Parser);

  function calculateRightStrippedOffsets(original, value) {
    if (value === '') {
      // if it is empty, just return the count of newlines
      // in original
      return {
        lines: original.split('\n').length - 1,
        columns: 0
      };
    } // otherwise, return the number of newlines prior to
    // `value`


    var difference = original.split(value)[0];
    var lines = difference.split(/\n/);
    var lineCount = lines.length - 1;
    return {
      lines: lineCount,
      columns: lines[lineCount].length
    };
  }

  function updateTokenizerLocation(tokenizer, content) {
    var line = content.loc.start.line;
    var column = content.loc.start.column;
    var offsets = calculateRightStrippedOffsets(content.original, content.value);
    line = line + offsets.lines;

    if (offsets.lines) {
      column = offsets.columns;
    } else {
      column = column + offsets.columns;
    }

    tokenizer.line = line;
    tokenizer.column = column;
  }

  function acceptCallNodes(compiler, node) {
    var path = compiler.PathExpression(node.path);
    var params = node.params ? node.params.map(function (e) {
      return compiler.acceptNode(e);
    }) : [];
    var hash = node.hash ? compiler.Hash(node.hash) : builders.hash();
    return {
      path: path,
      params: params,
      hash: hash
    };
  }

  function addElementModifier(element, mustache) {
    var path = mustache.path,
        params = mustache.params,
        hash = mustache.hash,
        loc = mustache.loc;

    if (isLiteral(path)) {
      var _modifier = "{{" + printLiteral(path) + "}}";

      var tag = "<" + element.name + " ... " + _modifier + " ...";
      throw new SyntaxError("In " + tag + ", " + _modifier + " is not a valid modifier: \"" + path.original + "\" on line " + (loc && loc.start.line) + ".", mustache.loc);
    }

    var modifier = builders.elementModifier(path, params, hash, loc);
    element.modifiers.push(modifier);
  }

  function appendDynamicAttributeValuePart(attribute, part) {
    attribute.isDynamic = true;
    attribute.parts.push(part);
  }

  // ParentNode and ChildKey types are derived from VisitorKeysMap

  var visitorKeys = {
    Program: util.tuple('body'),
    Template: util.tuple('body'),
    Block: util.tuple('body'),
    MustacheStatement: util.tuple('path', 'params', 'hash'),
    BlockStatement: util.tuple('path', 'params', 'hash', 'program', 'inverse'),
    ElementModifierStatement: util.tuple('path', 'params', 'hash'),
    PartialStatement: util.tuple('name', 'params', 'hash'),
    CommentStatement: util.tuple(),
    MustacheCommentStatement: util.tuple(),
    ElementNode: util.tuple('attributes', 'modifiers', 'children', 'comments'),
    AttrNode: util.tuple('value'),
    TextNode: util.tuple(),
    ConcatStatement: util.tuple('parts'),
    SubExpression: util.tuple('path', 'params', 'hash'),
    PathExpression: util.tuple(),
    StringLiteral: util.tuple(),
    BooleanLiteral: util.tuple(),
    NumberLiteral: util.tuple(),
    NullLiteral: util.tuple(),
    UndefinedLiteral: util.tuple(),
    Hash: util.tuple('pairs'),
    HashPair: util.tuple('value')
  };

  var TraversalError = function () {
    TraversalError.prototype = Object.create(Error.prototype);
    TraversalError.prototype.constructor = TraversalError;

    function TraversalError(message, node, parent, key) {
      var error = Error.call(this, message);
      this.key = key;
      this.message = message;
      this.node = node;
      this.parent = parent;
      this.stack = error.stack;
    }

    return TraversalError;
  }();
  function cannotRemoveNode(node, parent, key) {
    return new TraversalError('Cannot remove a node unless it is part of an array', node, parent, key);
  }
  function cannotReplaceNode(node, parent, key) {
    return new TraversalError('Cannot replace a node with multiple nodes unless it is part of an array', node, parent, key);
  }
  function cannotReplaceOrRemoveInKeyHandlerYet(node, key) {
    return new TraversalError('Replacing and removing in key handlers is not yet supported.', node, null, key);
  }

  function _defineProperties$2(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

  function _createClass$2(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$2(Constructor.prototype, protoProps); if (staticProps) _defineProperties$2(Constructor, staticProps); return Constructor; }

  var Path = /*#__PURE__*/function () {
    function Path(node, parent, parentKey) {
      if (parent === void 0) {
        parent = null;
      }

      if (parentKey === void 0) {
        parentKey = null;
      }

      this.node = node;
      this.parent = parent;
      this.parentKey = parentKey;
    }

    var _proto = Path.prototype;

    _proto.parents = function parents() {
      var _this = this,
          _ref;

      return _ref = {}, _ref[Symbol.iterator] = function () {
        return new PathParentsIterator(_this);
      }, _ref;
    };

    _createClass$2(Path, [{
      key: "parentNode",
      get: function get() {
        return this.parent ? this.parent.node : null;
      }
    }]);

    return Path;
  }();

  var PathParentsIterator = /*#__PURE__*/function () {
    function PathParentsIterator(path) {
      this.path = path;
    }

    var _proto2 = PathParentsIterator.prototype;

    _proto2.next = function next() {
      if (this.path.parent) {
        this.path = this.path.parent;
        return {
          done: false,
          value: this.path
        };
      } else {
        return {
          done: true,
          value: null
        };
      }
    };

    return PathParentsIterator;
  }();

  function getEnterFunction(handler) {
    if (typeof handler === 'function') {
      return handler;
    } else {
      return handler.enter;
    }
  }

  function getExitFunction(handler) {
    if (typeof handler === 'function') {
      return undefined;
    } else {
      return handler.exit;
    }
  }

  function getKeyHandler(handler, key) {
    var keyVisitor = typeof handler !== 'function' ? handler.keys : undefined;
    if (keyVisitor === undefined) return;
    var keyHandler = keyVisitor[key];

    if (keyHandler !== undefined) {
      return keyHandler;
    }

    return keyVisitor.All;
  }

  function getNodeHandler(visitor, nodeType) {
    if (nodeType === 'Template' || nodeType === 'Block') {
      if (visitor.Program) {

        return visitor.Program;
      }
    }

    var handler = visitor[nodeType];

    if (handler !== undefined) {
      return handler;
    }

    return visitor.All;
  }

  function visitNode(visitor, path) {
    var node = path.node,
        parent = path.parent,
        parentKey = path.parentKey;
    var handler = getNodeHandler(visitor, node.type);
    var enter;
    var exit;

    if (handler !== undefined) {
      enter = getEnterFunction(handler);
      exit = getExitFunction(handler);
    }

    var result;

    if (enter !== undefined) {
      result = enter(node, path);
    }

    if (result !== undefined && result !== null) {
      if (JSON.stringify(node) === JSON.stringify(result)) {
        result = undefined;
      } else if (Array.isArray(result)) {
        visitArray(visitor, result, parent, parentKey);
        return result;
      } else {
        var _path = new Path(result, parent, parentKey);

        return visitNode(visitor, _path) || result;
      }
    }

    if (result === undefined) {
      var keys = visitorKeys[node.type];

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i]; // we know if it has child keys we can widen to a ParentNode

        visitKey(visitor, handler, path, key);
      }

      if (exit !== undefined) {
        result = exit(node, path);
      }
    }

    return result;
  }

  function get(node, key) {
    return node[key];
  }

  function set(node, key, value) {
    node[key] = value;
  }

  function visitKey(visitor, handler, path, key) {
    var node = path.node;
    var value = get(node, key);

    if (!value) {
      return;
    }

    var keyEnter;
    var keyExit;

    if (handler !== undefined) {
      var keyHandler = getKeyHandler(handler, key);

      if (keyHandler !== undefined) {
        keyEnter = getEnterFunction(keyHandler);
        keyExit = getExitFunction(keyHandler);
      }
    }

    if (keyEnter !== undefined) {
      if (keyEnter(node, key) !== undefined) {
        throw cannotReplaceOrRemoveInKeyHandlerYet(node, key);
      }
    }

    if (Array.isArray(value)) {
      visitArray(visitor, value, path, key);
    } else {
      var keyPath = new Path(value, path, key);
      var result = visitNode(visitor, keyPath);

      if (result !== undefined) {
        // TODO: dynamically check the results by having a table of
        // expected node types in value space, not just type space
        assignKey(node, key, value, result);
      }
    }

    if (keyExit !== undefined) {
      if (keyExit(node, key) !== undefined) {
        throw cannotReplaceOrRemoveInKeyHandlerYet(node, key);
      }
    }
  }

  function visitArray(visitor, array, parent, parentKey) {
    for (var i = 0; i < array.length; i++) {
      var node = array[i];
      var path = new Path(node, parent, parentKey);
      var result = visitNode(visitor, path);

      if (result !== undefined) {
        i += spliceArray(array, i, result) - 1;
      }
    }
  }

  function assignKey(node, key, value, result) {
    if (result === null) {
      throw cannotRemoveNode(value, node, key);
    } else if (Array.isArray(result)) {
      if (result.length === 1) {
        set(node, key, result[0]);
      } else {
        if (result.length === 0) {
          throw cannotRemoveNode(value, node, key);
        } else {
          throw cannotReplaceNode(value, node, key);
        }
      }
    } else {
      set(node, key, result);
    }
  }

  function spliceArray(array, index, result) {
    if (result === null) {
      array.splice(index, 1);
      return 0;
    } else if (Array.isArray(result)) {
      array.splice.apply(array, [index, 1].concat(result));
      return result.length;
    } else {
      array.splice(index, 1, result);
      return 1;
    }
  }

  function traverse(node, visitor) {
    var path = new Path(node);
    visitNode(visitor, path);
  }

  var ATTR_VALUE_REGEX_TEST = /[\xA0"&]/;
  var ATTR_VALUE_REGEX_REPLACE = new RegExp(ATTR_VALUE_REGEX_TEST.source, 'g');
  var TEXT_REGEX_TEST = /[\xA0&<>]/;
  var TEXT_REGEX_REPLACE = new RegExp(TEXT_REGEX_TEST.source, 'g');

  function attrValueReplacer(_char) {
    switch (_char.charCodeAt(0)) {
      case 160
      /* NBSP */
      :
        return '&nbsp;';

      case 34
      /* QUOT */
      :
        return '&quot;';

      case 38
      /* AMP */
      :
        return '&amp;';

      default:
        return _char;
    }
  }

  function textReplacer(_char2) {
    switch (_char2.charCodeAt(0)) {
      case 160
      /* NBSP */
      :
        return '&nbsp;';

      case 38
      /* AMP */
      :
        return '&amp;';

      case 60
      /* LT */
      :
        return '&lt;';

      case 62
      /* GT */
      :
        return '&gt;';

      default:
        return _char2;
    }
  }

  function escapeAttrValue(attrValue) {
    if (ATTR_VALUE_REGEX_TEST.test(attrValue)) {
      return attrValue.replace(ATTR_VALUE_REGEX_REPLACE, attrValueReplacer);
    }

    return attrValue;
  }
  function escapeText(text) {
    if (TEXT_REGEX_TEST.test(text)) {
      return text.replace(TEXT_REGEX_REPLACE, textReplacer);
    }

    return text;
  }

  var NON_WHITESPACE = /\S/;

  var Printer = /*#__PURE__*/function () {
    function Printer(options) {
      this.buffer = '';
      this.options = options;
    }
    /*
      This is used by _all_ methods on this Printer class that add to `this.buffer`,
      it allows consumers of the printer to use alternate string representations for
      a given node.
         The primary use case for this are things like source -> source codemod utilities.
      For example, ember-template-recast attempts to always preserve the original string
      formatting in each AST node if no modifications are made to it.
    */


    var _proto = Printer.prototype;

    _proto.handledByOverride = function handledByOverride(node, ensureLeadingWhitespace) {
      if (ensureLeadingWhitespace === void 0) {
        ensureLeadingWhitespace = false;
      }

      if (this.options.override !== undefined) {
        var result = this.options.override(node, this.options);

        if (typeof result === 'string') {
          if (ensureLeadingWhitespace && result !== '' && NON_WHITESPACE.test(result[0])) {
            result = " " + result;
          }

          this.buffer += result;
          return true;
        }
      }

      return false;
    };

    _proto.Node = function Node(node) {
      switch (node.type) {
        case 'MustacheStatement':
        case 'BlockStatement':
        case 'PartialStatement':
        case 'MustacheCommentStatement':
        case 'CommentStatement':
        case 'TextNode':
        case 'ElementNode':
        case 'AttrNode':
        case 'Block':
        case 'Template':
          return this.TopLevelStatement(node);

        case 'StringLiteral':
        case 'BooleanLiteral':
        case 'NumberLiteral':
        case 'UndefinedLiteral':
        case 'NullLiteral':
        case 'PathExpression':
        case 'SubExpression':
          return this.Expression(node);

        case 'Program':
          return this.Block(node);

        case 'ConcatStatement':
          // should have an AttrNode parent
          return this.ConcatStatement(node);

        case 'Hash':
          return this.Hash(node);

        case 'HashPair':
          return this.HashPair(node);

        case 'ElementModifierStatement':
          return this.ElementModifierStatement(node);
      }

      return unreachable(node, 'Node');
    };

    _proto.Expression = function Expression(expression) {
      switch (expression.type) {
        case 'StringLiteral':
        case 'BooleanLiteral':
        case 'NumberLiteral':
        case 'UndefinedLiteral':
        case 'NullLiteral':
          return this.Literal(expression);

        case 'PathExpression':
          return this.PathExpression(expression);

        case 'SubExpression':
          return this.SubExpression(expression);
      }

      return unreachable(expression, 'Expression');
    };

    _proto.Literal = function Literal(literal) {
      switch (literal.type) {
        case 'StringLiteral':
          return this.StringLiteral(literal);

        case 'BooleanLiteral':
          return this.BooleanLiteral(literal);

        case 'NumberLiteral':
          return this.NumberLiteral(literal);

        case 'UndefinedLiteral':
          return this.UndefinedLiteral(literal);

        case 'NullLiteral':
          return this.NullLiteral(literal);
      }

      return unreachable(literal, 'Literal');
    };

    _proto.TopLevelStatement = function TopLevelStatement(statement) {
      switch (statement.type) {
        case 'MustacheStatement':
          return this.MustacheStatement(statement);

        case 'BlockStatement':
          return this.BlockStatement(statement);

        case 'PartialStatement':
          return this.PartialStatement(statement);

        case 'MustacheCommentStatement':
          return this.MustacheCommentStatement(statement);

        case 'CommentStatement':
          return this.CommentStatement(statement);

        case 'TextNode':
          return this.TextNode(statement);

        case 'ElementNode':
          return this.ElementNode(statement);

        case 'Block':
        case 'Template':
          return this.Block(statement);

        case 'AttrNode':
          // should have element
          return this.AttrNode(statement);
      }

      unreachable(statement, 'TopLevelStatement');
    };

    _proto.Block = function Block(block) {
      /*
        When processing a template like:
             ```hbs
        {{#if whatever}}
          whatever
        {{else if somethingElse}}
          something else
        {{else}}
          fallback
        {{/if}}
        ```
             The AST still _effectively_ looks like:
             ```hbs
        {{#if whatever}}
          whatever
        {{else}}{{#if somethingElse}}
          something else
        {{else}}
          fallback
        {{/if}}{{/if}}
        ```
             The only way we can tell if that is the case is by checking for
        `block.chained`, but unfortunately when the actual statements are
        processed the `block.body[0]` node (which will always be a
        `BlockStatement`) has no clue that its anscestor `Block` node was
        chained.
             This "forwards" the `chained` setting so that we can check
        it later when processing the `BlockStatement`.
      */
      if (block.chained) {
        var firstChild = block.body[0];
        firstChild.chained = true;
      }

      if (this.handledByOverride(block)) {
        return;
      }

      this.TopLevelStatements(block.body);
    };

    _proto.TopLevelStatements = function TopLevelStatements(statements) {
      var _this = this;

      statements.forEach(function (statement) {
        return _this.TopLevelStatement(statement);
      });
    };

    _proto.ElementNode = function ElementNode(el) {
      if (this.handledByOverride(el)) {
        return;
      }

      this.OpenElementNode(el);
      this.TopLevelStatements(el.children);
      this.CloseElementNode(el);
    };

    _proto.OpenElementNode = function OpenElementNode(el) {
      var _this2 = this;

      this.buffer += "<" + el.tag;

      if (el.attributes.length) {
        el.attributes.forEach(function (attr) {
          _this2.buffer += ' ';

          _this2.AttrNode(attr);
        });
      }

      if (el.modifiers.length) {
        el.modifiers.forEach(function (mod) {
          _this2.buffer += ' ';

          _this2.ElementModifierStatement(mod);
        });
      }

      if (el.comments.length) {
        el.comments.forEach(function (comment) {
          _this2.buffer += ' ';

          _this2.MustacheCommentStatement(comment);
        });
      }

      if (el.blockParams.length) {
        this.BlockParams(el.blockParams);
      }

      if (el.selfClosing) {
        this.buffer += ' /';
      }

      this.buffer += '>';
    };

    _proto.CloseElementNode = function CloseElementNode(el) {
      if (el.selfClosing || voidMap[el.tag.toLowerCase()]) {
        return;
      }

      this.buffer += "</" + el.tag + ">";
    };

    _proto.AttrNode = function AttrNode(attr) {
      if (this.handledByOverride(attr)) {
        return;
      }

      var name = attr.name,
          value = attr.value;
      this.buffer += name;

      if (value.type !== 'TextNode' || value.chars.length > 0) {
        this.buffer += '=';
        this.AttrNodeValue(value);
      }
    };

    _proto.AttrNodeValue = function AttrNodeValue(value) {
      if (value.type === 'TextNode') {
        this.buffer += '"';
        this.TextNode(value, true);
        this.buffer += '"';
      } else {
        this.Node(value);
      }
    };

    _proto.TextNode = function TextNode(text, isAttr) {
      if (this.handledByOverride(text)) {
        return;
      }

      if (this.options.entityEncoding === 'raw') {
        this.buffer += text.chars;
      } else if (isAttr) {
        this.buffer += escapeAttrValue(text.chars);
      } else {
        this.buffer += escapeText(text.chars);
      }
    };

    _proto.MustacheStatement = function MustacheStatement(mustache) {
      if (this.handledByOverride(mustache)) {
        return;
      }

      this.buffer += mustache.escaped ? '{{' : '{{{';

      if (mustache.strip.open) {
        this.buffer += '~';
      }

      this.Expression(mustache.path);
      this.Params(mustache.params);
      this.Hash(mustache.hash);

      if (mustache.strip.close) {
        this.buffer += '~';
      }

      this.buffer += mustache.escaped ? '}}' : '}}}';
    };

    _proto.BlockStatement = function BlockStatement(block) {
      if (this.handledByOverride(block)) {
        return;
      }

      if (block.chained) {
        this.buffer += block.inverseStrip.open ? '{{~' : '{{';
        this.buffer += 'else ';
      } else {
        this.buffer += block.openStrip.open ? '{{~#' : '{{#';
      }

      this.Expression(block.path);
      this.Params(block.params);
      this.Hash(block.hash);

      if (block.program.blockParams.length) {
        this.BlockParams(block.program.blockParams);
      }

      if (block.chained) {
        this.buffer += block.inverseStrip.close ? '~}}' : '}}';
      } else {
        this.buffer += block.openStrip.close ? '~}}' : '}}';
      }

      this.Block(block.program);

      if (block.inverse) {
        if (!block.inverse.chained) {
          this.buffer += block.inverseStrip.open ? '{{~' : '{{';
          this.buffer += 'else';
          this.buffer += block.inverseStrip.close ? '~}}' : '}}';
        }

        this.Block(block.inverse);
      }

      if (!block.chained) {
        this.buffer += block.closeStrip.open ? '{{~/' : '{{/';
        this.Expression(block.path);
        this.buffer += block.closeStrip.close ? '~}}' : '}}';
      }
    };

    _proto.BlockParams = function BlockParams(blockParams) {
      this.buffer += " as |" + blockParams.join(' ') + "|";
    };

    _proto.PartialStatement = function PartialStatement(partial) {
      if (this.handledByOverride(partial)) {
        return;
      }

      this.buffer += '{{>';
      this.Expression(partial.name);
      this.Params(partial.params);
      this.Hash(partial.hash);
      this.buffer += '}}';
    };

    _proto.ConcatStatement = function ConcatStatement(concat) {
      var _this3 = this;

      if (this.handledByOverride(concat)) {
        return;
      }

      this.buffer += '"';
      concat.parts.forEach(function (part) {
        if (part.type === 'TextNode') {
          _this3.TextNode(part, true);
        } else {
          _this3.Node(part);
        }
      });
      this.buffer += '"';
    };

    _proto.MustacheCommentStatement = function MustacheCommentStatement(comment) {
      if (this.handledByOverride(comment)) {
        return;
      }

      this.buffer += "{{!--" + comment.value + "--}}";
    };

    _proto.ElementModifierStatement = function ElementModifierStatement(mod) {
      if (this.handledByOverride(mod)) {
        return;
      }

      this.buffer += '{{';
      this.Expression(mod.path);
      this.Params(mod.params);
      this.Hash(mod.hash);
      this.buffer += '}}';
    };

    _proto.CommentStatement = function CommentStatement(comment) {
      if (this.handledByOverride(comment)) {
        return;
      }

      this.buffer += "<!--" + comment.value + "-->";
    };

    _proto.PathExpression = function PathExpression(path) {
      if (this.handledByOverride(path)) {
        return;
      }

      this.buffer += path.original;
    };

    _proto.SubExpression = function SubExpression(sexp) {
      if (this.handledByOverride(sexp)) {
        return;
      }

      this.buffer += '(';
      this.Expression(sexp.path);
      this.Params(sexp.params);
      this.Hash(sexp.hash);
      this.buffer += ')';
    };

    _proto.Params = function Params(params) {
      var _this4 = this;

      // TODO: implement a top level Params AST node (just like the Hash object)
      // so that this can also be overridden
      if (params.length) {
        params.forEach(function (param) {
          _this4.buffer += ' ';

          _this4.Expression(param);
        });
      }
    };

    _proto.Hash = function Hash(hash) {
      var _this5 = this;

      if (this.handledByOverride(hash, true)) {
        return;
      }

      hash.pairs.forEach(function (pair) {
        _this5.buffer += ' ';

        _this5.HashPair(pair);
      });
    };

    _proto.HashPair = function HashPair(pair) {
      if (this.handledByOverride(pair)) {
        return;
      }

      this.buffer += pair.key;
      this.buffer += '=';
      this.Node(pair.value);
    };

    _proto.StringLiteral = function StringLiteral(str) {
      if (this.handledByOverride(str)) {
        return;
      }

      this.buffer += JSON.stringify(str.value);
    };

    _proto.BooleanLiteral = function BooleanLiteral(bool) {
      if (this.handledByOverride(bool)) {
        return;
      }

      this.buffer += bool.value;
    };

    _proto.NumberLiteral = function NumberLiteral(number) {
      if (this.handledByOverride(number)) {
        return;
      }

      this.buffer += number.value;
    };

    _proto.UndefinedLiteral = function UndefinedLiteral(node) {
      if (this.handledByOverride(node)) {
        return;
      }

      this.buffer += 'undefined';
    };

    _proto.NullLiteral = function NullLiteral(node) {
      if (this.handledByOverride(node)) {
        return;
      }

      this.buffer += 'null';
    };

    _proto.print = function print(node) {
      var options = this.options;

      if (options.override) {
        var result = options.override(node, options);

        if (result !== undefined) {
          return result;
        }
      }

      this.buffer = '';
      this.Node(node);
      return this.buffer;
    };

    return Printer;
  }();

  function unreachable(node, parentNodeType) {
    var loc = node.loc,
        type = node.type;
    throw new Error("Non-exhaustive node narrowing " + type + " @ location: " + JSON.stringify(loc) + " for parent " + parentNodeType);
  }

  function build(ast, options) {
    if (options === void 0) {
      options = {
        entityEncoding: 'transformed'
      };
    }

    if (!ast) {
      return '';
    }

    var printer = new Printer(options);
    return printer.print(ast);
  }

  var Walker = /*#__PURE__*/function () {
    function Walker(order) {
      this.order = order;
      this.stack = [];
    }

    var _proto = Walker.prototype;

    _proto.visit = function visit(node, callback) {
      if (!node) {
        return;
      }

      this.stack.push(node);

      if (this.order === 'post') {
        this.children(node, callback);
        callback(node, this);
      } else {
        callback(node, this);
        this.children(node, callback);
      }

      this.stack.pop();
    };

    _proto.children = function children(node, callback) {
      var type;

      if (node.type === 'Block' || node.type === 'Template' && visitors.Program) {
        type = 'Program';
      } else {
        type = node.type;
      }

      var visitor = visitors[type];

      if (visitor) {
        visitor(this, node, callback);
      }
    };

    return Walker;
  }();
  var visitors = {
    Program: function Program(walker, node, callback) {
      for (var i = 0; i < node.body.length; i++) {
        walker.visit(node.body[i], callback);
      }
    },
    Template: function Template(walker, node, callback) {
      for (var i = 0; i < node.body.length; i++) {
        walker.visit(node.body[i], callback);
      }
    },
    Block: function Block(walker, node, callback) {
      for (var i = 0; i < node.body.length; i++) {
        walker.visit(node.body[i], callback);
      }
    },
    ElementNode: function ElementNode(walker, node, callback) {
      for (var i = 0; i < node.children.length; i++) {
        walker.visit(node.children[i], callback);
      }
    },
    BlockStatement: function BlockStatement(walker, node, callback) {
      walker.visit(node.program, callback);
      walker.visit(node.inverse || null, callback);
    }
  };

  function _inheritsLoose$1(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }
  var voidMap = Object.create(null);
  var voidTagNames = 'area base br col command embed hr img input keygen link meta param source track wbr';
  voidTagNames.split(' ').forEach(function (tagName) {
    voidMap[tagName] = true;
  });
  var TokenizerEventHandlers = /*#__PURE__*/function (_HandlebarsNodeVisito) {
    _inheritsLoose$1(TokenizerEventHandlers, _HandlebarsNodeVisito);

    function TokenizerEventHandlers() {
      var _this;

      _this = _HandlebarsNodeVisito.apply(this, arguments) || this;
      _this.tagOpenLine = 0;
      _this.tagOpenColumn = 0;
      return _this;
    }

    var _proto = TokenizerEventHandlers.prototype;

    _proto.reset = function reset() {
      this.currentNode = null;
    } // Comment
    ;

    _proto.beginComment = function beginComment() {
      this.currentNode = builders.comment('');
      this.currentNode.loc = {
        source: null,
        start: builders.pos(this.tagOpenLine, this.tagOpenColumn),
        end: null
      };
    };

    _proto.appendToCommentData = function appendToCommentData(_char) {
      this.currentComment.value += _char;
    };

    _proto.finishComment = function finishComment() {
      this.currentComment.loc.end = builders.pos(this.tokenizer.line, this.tokenizer.column);
      appendChild(this.currentElement(), this.currentComment);
    } // Data
    ;

    _proto.beginData = function beginData() {
      this.currentNode = builders.text();
      this.currentNode.loc = {
        source: null,
        start: builders.pos(this.tokenizer.line, this.tokenizer.column),
        end: null
      };
    };

    _proto.appendToData = function appendToData(_char2) {
      this.currentData.chars += _char2;
    };

    _proto.finishData = function finishData() {
      this.currentData.loc.end = builders.pos(this.tokenizer.line, this.tokenizer.column);
      appendChild(this.currentElement(), this.currentData);
    } // Tags - basic
    ;

    _proto.tagOpen = function tagOpen() {
      this.tagOpenLine = this.tokenizer.line;
      this.tagOpenColumn = this.tokenizer.column;
    };

    _proto.beginStartTag = function beginStartTag() {
      this.currentNode = {
        type: 'StartTag',
        name: '',
        attributes: [],
        modifiers: [],
        comments: [],
        selfClosing: false,
        loc: SYNTHETIC
      };
    };

    _proto.beginEndTag = function beginEndTag() {
      this.currentNode = {
        type: 'EndTag',
        name: '',
        attributes: [],
        modifiers: [],
        comments: [],
        selfClosing: false,
        loc: SYNTHETIC
      };
    };

    _proto.finishTag = function finishTag() {
      var _this$tokenizer = this.tokenizer,
          line = _this$tokenizer.line,
          column = _this$tokenizer.column;
      var tag = this.currentTag;
      tag.loc = builders.loc(this.tagOpenLine, this.tagOpenColumn, line, column);

      if (tag.type === 'StartTag') {
        this.finishStartTag();

        if (voidMap[tag.name] || tag.selfClosing) {
          this.finishEndTag(true);
        }
      } else if (tag.type === 'EndTag') {
        this.finishEndTag(false);
      }
    };

    _proto.finishStartTag = function finishStartTag() {
      var _this$currentStartTag = this.currentStartTag,
          name = _this$currentStartTag.name,
          attrs = _this$currentStartTag.attributes,
          modifiers = _this$currentStartTag.modifiers,
          comments = _this$currentStartTag.comments,
          selfClosing = _this$currentStartTag.selfClosing;
      var loc = builders.loc(this.tagOpenLine, this.tagOpenColumn);
      var element = builders.element({
        name: name,
        selfClosing: selfClosing
      }, {
        attrs: attrs,
        modifiers: modifiers,
        comments: comments,
        loc: loc
      });
      this.elementStack.push(element);
    };

    _proto.finishEndTag = function finishEndTag(isVoid) {
      var tag = this.currentTag;
      var element = this.elementStack.pop();
      var parent = this.currentElement();
      validateEndTag(tag, element, isVoid);
      element.loc.end.line = this.tokenizer.line;
      element.loc.end.column = this.tokenizer.column;
      parseElementBlockParams(element);
      appendChild(parent, element);
    };

    _proto.markTagAsSelfClosing = function markTagAsSelfClosing() {
      this.currentTag.selfClosing = true;
    } // Tags - name
    ;

    _proto.appendToTagName = function appendToTagName(_char3) {
      this.currentTag.name += _char3;
    } // Tags - attributes
    ;

    _proto.beginAttribute = function beginAttribute() {
      var tag = this.currentTag;

      if (tag.type === 'EndTag') {
        throw new SyntaxError("Invalid end tag: closing tag must not have attributes, " + ("in `" + tag.name + "` (on line " + this.tokenizer.line + ")."), tag.loc);
      }

      this.currentAttribute = {
        name: '',
        parts: [],
        isQuoted: false,
        isDynamic: false,
        start: builders.pos(this.tokenizer.line, this.tokenizer.column),
        valueStartLine: 0,
        valueStartColumn: 0
      };
    };

    _proto.appendToAttributeName = function appendToAttributeName(_char4) {
      this.currentAttr.name += _char4;
    };

    _proto.beginAttributeValue = function beginAttributeValue(isQuoted) {
      this.currentAttr.isQuoted = isQuoted;
      this.currentAttr.valueStartLine = this.tokenizer.line;
      this.currentAttr.valueStartColumn = this.tokenizer.column;
    };

    _proto.appendToAttributeValue = function appendToAttributeValue(_char5) {
      var parts = this.currentAttr.parts;
      var lastPart = parts[parts.length - 1];

      if (lastPart && lastPart.type === 'TextNode') {
        lastPart.chars += _char5; // update end location for each added char

        lastPart.loc.end.line = this.tokenizer.line;
        lastPart.loc.end.column = this.tokenizer.column;
      } else {
        // initially assume the text node is a single char
        var loc = builders.loc(this.tokenizer.line, this.tokenizer.column, this.tokenizer.line, this.tokenizer.column); // the tokenizer line/column have already been advanced, correct location info

        if (_char5 === '\n') {
          loc.start.line -= 1;
          loc.start.column = lastPart ? lastPart.loc.end.column : this.currentAttr.valueStartColumn;
        } else {
          loc.start.column -= 1;
        }

        var text = builders.text(_char5, loc);
        parts.push(text);
      }
    };

    _proto.finishAttributeValue = function finishAttributeValue() {
      var _this$currentAttr = this.currentAttr,
          name = _this$currentAttr.name,
          parts = _this$currentAttr.parts,
          isQuoted = _this$currentAttr.isQuoted,
          isDynamic = _this$currentAttr.isDynamic,
          valueStartLine = _this$currentAttr.valueStartLine,
          valueStartColumn = _this$currentAttr.valueStartColumn;
      var value = assembleAttributeValue(parts, isQuoted, isDynamic, this.tokenizer.line);
      value.loc = builders.loc(valueStartLine, valueStartColumn, this.tokenizer.line, this.tokenizer.column);
      var loc = builders.loc(this.currentAttr.start.line, this.currentAttr.start.column, this.tokenizer.line, this.tokenizer.column);
      var attribute = builders.attr(name, value, loc);
      this.currentStartTag.attributes.push(attribute);
    };

    _proto.reportSyntaxError = function reportSyntaxError(message) {
      throw new SyntaxError("Syntax error at line " + this.tokenizer.line + " col " + this.tokenizer.column + ": " + message, builders.loc(this.tokenizer.line, this.tokenizer.column));
    };

    return TokenizerEventHandlers;
  }(HandlebarsNodeVisitors);

  function assembleAttributeValue(parts, isQuoted, isDynamic, line) {
    if (isDynamic) {
      if (isQuoted) {
        return assembleConcatenatedValue(parts);
      } else {
        if (parts.length === 1 || parts.length === 2 && parts[1].type === 'TextNode' && parts[1].chars === '/') {
          return parts[0];
        } else {
          throw new SyntaxError("An unquoted attribute value must be a string or a mustache, " + "preceeded by whitespace or a '=' character, and " + ("followed by whitespace, a '>' character, or '/>' (on line " + line + ")"), builders.loc(line, 0));
        }
      }
    } else {
      return parts.length > 0 ? parts[0] : builders.text('');
    }
  }

  function assembleConcatenatedValue(parts) {
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];

      if (part.type !== 'MustacheStatement' && part.type !== 'TextNode') {
        throw new SyntaxError('Unsupported node in quoted attribute value: ' + part['type'], part.loc);
      }
    }

    return builders.concat(parts);
  }

  function validateEndTag(tag, element, selfClosing) {
    var error;

    if (voidMap[tag.name] && !selfClosing) {
      // EngTag is also called by StartTag for void and self-closing tags (i.e.
      // <input> or <br />, so we need to check for that here. Otherwise, we would
      // throw an error for those cases.
      error = 'Invalid end tag ' + formatEndTagInfo(tag) + ' (void elements cannot have end tags).';
    } else if (element.tag === undefined) {
      error = 'Closing tag ' + formatEndTagInfo(tag) + ' without an open tag.';
    } else if (element.tag !== tag.name) {
      error = 'Closing tag ' + formatEndTagInfo(tag) + ' did not match last open tag `' + element.tag + '` (on line ' + element.loc.start.line + ').';
    }

    if (error) {
      throw new SyntaxError(error, element.loc);
    }
  }

  function formatEndTagInfo(tag) {
    return '`' + tag.name + '` (on line ' + tag.loc.end.line + ')';
  }

  var syntax = {
    parse: preprocess,
    builders: builders,
    print: build,
    traverse: traverse,
    Walker: Walker
  };
  function preprocess(html, options) {
    if (options === void 0) {
      options = {};
    }

    var mode = options.mode || 'precompile';
    var ast;

    if (typeof html === 'object') {
      ast = html;
    } else if (mode === 'codemod') {
      ast = parser.parseWithoutProcessing(html, options.parseOptions);
    } else {
      ast = parser.parse(html, options.parseOptions);
    }

    var entityParser = undefined;

    if (mode === 'codemod') {
      entityParser = new simpleHtmlTokenizer.EntityParser({});
    }

    var program = new TokenizerEventHandlers(html, entityParser).acceptTemplate(ast);

    if (options && options.plugins && options.plugins.ast) {
      for (var i = 0, l = options.plugins.ast.length; i < l; i++) {
        var transform = options.plugins.ast[i];
        var env = util.assign({}, options, {
          syntax: syntax
        }, {
          plugins: undefined
        });
        var pluginResult = transform(env);
        traverse(program, pluginResult.visitor);
      }
    }

    return program;
  }



  var nodes = /*#__PURE__*/Object.freeze({
    __proto__: null
  });

  exports.AST = nodes;
  exports.Path = Path;
  exports.SyntaxError = SyntaxError;
  exports.TraversalError = TraversalError;
  exports.Walker = Walker;
  exports.builders = builders;
  exports.cannotRemoveNode = cannotRemoveNode;
  exports.cannotReplaceNode = cannotReplaceNode;
  exports.cannotReplaceOrRemoveInKeyHandlerYet = cannotReplaceOrRemoveInKeyHandlerYet;
  exports.isLiteral = isLiteral;
  exports.preprocess = preprocess;
  exports.print = build;
  exports.printLiteral = printLiteral;
  exports.traverse = traverse;

  Object.defineProperty(exports, '__esModule', { value: true });

});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xpbW1lci1zeW50YXguanMiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3N5bnRheC9saWIvYnVpbGRlcnMudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9AZ2xpbW1lci9zeW50YXgvbGliL2Vycm9ycy9zeW50YXgtZXJyb3IudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9AZ2xpbW1lci9zeW50YXgvbGliL3V0aWxzLnRzIiwiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvQGdsaW1tZXIvc3ludGF4L2xpYi9wYXJzZXIudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9AZ2xpbW1lci9zeW50YXgvbGliL3BhcnNlci9oYW5kbGViYXJzLW5vZGUtdmlzaXRvcnMudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9AZ2xpbW1lci9zeW50YXgvbGliL3R5cGVzL3Zpc2l0b3Ita2V5cy50cyIsIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3N5bnRheC9saWIvdHJhdmVyc2FsL2Vycm9ycy50cyIsIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3N5bnRheC9saWIvdHJhdmVyc2FsL3BhdGgudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9AZ2xpbW1lci9zeW50YXgvbGliL3RyYXZlcnNhbC90cmF2ZXJzZS50cyIsIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3N5bnRheC9saWIvZ2VuZXJhdGlvbi91dGlsLnRzIiwiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvQGdsaW1tZXIvc3ludGF4L2xpYi9nZW5lcmF0aW9uL3ByaW50ZXIudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9AZ2xpbW1lci9zeW50YXgvbGliL2dlbmVyYXRpb24vcHJpbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9AZ2xpbW1lci9zeW50YXgvbGliL3RyYXZlcnNhbC93YWxrZXIudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9AZ2xpbW1lci9zeW50YXgvbGliL3BhcnNlci90b2tlbml6ZXItZXZlbnQtaGFuZGxlcnMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgQVNUIGZyb20gJy4vdHlwZXMvbm9kZXMnO1xuaW1wb3J0IHsgT3B0aW9uLCBEaWN0IH0gZnJvbSAnQGdsaW1tZXIvaW50ZXJmYWNlcyc7XG5pbXBvcnQgeyBkZXByZWNhdGUsIGFzc2lnbiB9IGZyb20gJ0BnbGltbWVyL3V0aWwnO1xuaW1wb3J0IHsgTE9DQUxfREVCVUcgfSBmcm9tICdAZ2xpbW1lci9sb2NhbC1kZWJ1Zy1mbGFncyc7XG5pbXBvcnQgeyBTdHJpbmdMaXRlcmFsLCBCb29sZWFuTGl0ZXJhbCwgTnVtYmVyTGl0ZXJhbCB9IGZyb20gJy4vdHlwZXMvaGFuZGxlYmFycy1hc3QnO1xuXG4vLyBTdGF0ZW1lbnRzXG5cbmV4cG9ydCB0eXBlIEJ1aWxkZXJIZWFkID0gc3RyaW5nIHwgQVNULkV4cHJlc3Npb247XG5leHBvcnQgdHlwZSBUYWdEZXNjcmlwdG9yID0gc3RyaW5nIHwgeyBuYW1lOiBzdHJpbmc7IHNlbGZDbG9zaW5nOiBib29sZWFuIH07XG5cbmZ1bmN0aW9uIGJ1aWxkTXVzdGFjaGUoXG4gIHBhdGg6IEJ1aWxkZXJIZWFkIHwgQVNULkxpdGVyYWwsXG4gIHBhcmFtcz86IEFTVC5FeHByZXNzaW9uW10sXG4gIGhhc2g/OiBBU1QuSGFzaCxcbiAgcmF3PzogYm9vbGVhbixcbiAgbG9jPzogQVNULlNvdXJjZUxvY2F0aW9uLFxuICBzdHJpcD86IEFTVC5TdHJpcEZsYWdzXG4pOiBBU1QuTXVzdGFjaGVTdGF0ZW1lbnQge1xuICBpZiAodHlwZW9mIHBhdGggPT09ICdzdHJpbmcnKSB7XG4gICAgcGF0aCA9IGJ1aWxkSGVhZChwYXRoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdHlwZTogJ011c3RhY2hlU3RhdGVtZW50JyxcbiAgICBwYXRoLFxuICAgIHBhcmFtczogcGFyYW1zIHx8IFtdLFxuICAgIGhhc2g6IGhhc2ggfHwgYnVpbGRIYXNoKFtdKSxcbiAgICBlc2NhcGVkOiAhcmF3LFxuICAgIGxvYzogYnVpbGRMb2MobG9jIHx8IG51bGwpLFxuICAgIHN0cmlwOiBzdHJpcCB8fCB7IG9wZW46IGZhbHNlLCBjbG9zZTogZmFsc2UgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gYnVpbGRCbG9jayhcbiAgcGF0aDogQnVpbGRlckhlYWQsXG4gIHBhcmFtczogT3B0aW9uPEFTVC5FeHByZXNzaW9uW10+LFxuICBoYXNoOiBPcHRpb248QVNULkhhc2g+LFxuICBfZGVmYXVsdEJsb2NrOiBBU1QuUG9zc2libHlEZXByZWNhdGVkQmxvY2ssXG4gIF9lbHNlQmxvY2s/OiBPcHRpb248QVNULlBvc3NpYmx5RGVwcmVjYXRlZEJsb2NrPixcbiAgbG9jPzogQVNULlNvdXJjZUxvY2F0aW9uLFxuICBvcGVuU3RyaXA/OiBBU1QuU3RyaXBGbGFncyxcbiAgaW52ZXJzZVN0cmlwPzogQVNULlN0cmlwRmxhZ3MsXG4gIGNsb3NlU3RyaXA/OiBBU1QuU3RyaXBGbGFnc1xuKTogQVNULkJsb2NrU3RhdGVtZW50IHtcbiAgbGV0IGRlZmF1bHRCbG9jazogQVNULkJsb2NrO1xuICBsZXQgZWxzZUJsb2NrOiBPcHRpb248QVNULkJsb2NrPiB8IHVuZGVmaW5lZDtcblxuICBpZiAoX2RlZmF1bHRCbG9jay50eXBlID09PSAnVGVtcGxhdGUnKSB7XG4gICAgaWYgKExPQ0FMX0RFQlVHKSB7XG4gICAgICBkZXByZWNhdGUoYGIucHJvZ3JhbSBpcyBkZXByZWNhdGVkLiBVc2UgYi5ibG9ja0l0c2VsZiBpbnN0ZWFkLmApO1xuICAgIH1cblxuICAgIGRlZmF1bHRCbG9jayA9IChhc3NpZ24oe30sIF9kZWZhdWx0QmxvY2ssIHsgdHlwZTogJ0Jsb2NrJyB9KSBhcyB1bmtub3duKSBhcyBBU1QuQmxvY2s7XG4gIH0gZWxzZSB7XG4gICAgZGVmYXVsdEJsb2NrID0gX2RlZmF1bHRCbG9jaztcbiAgfVxuXG4gIGlmIChfZWxzZUJsb2NrICE9PSB1bmRlZmluZWQgJiYgX2Vsc2VCbG9jayAhPT0gbnVsbCAmJiBfZWxzZUJsb2NrLnR5cGUgPT09ICdUZW1wbGF0ZScpIHtcbiAgICBpZiAoTE9DQUxfREVCVUcpIHtcbiAgICAgIGRlcHJlY2F0ZShgYi5wcm9ncmFtIGlzIGRlcHJlY2F0ZWQuIFVzZSBiLmJsb2NrSXRzZWxmIGluc3RlYWQuYCk7XG4gICAgfVxuXG4gICAgZWxzZUJsb2NrID0gKGFzc2lnbih7fSwgX2Vsc2VCbG9jaywgeyB0eXBlOiAnQmxvY2snIH0pIGFzIHVua25vd24pIGFzIEFTVC5CbG9jaztcbiAgfSBlbHNlIHtcbiAgICBlbHNlQmxvY2sgPSBfZWxzZUJsb2NrO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQmxvY2tTdGF0ZW1lbnQnLFxuICAgIHBhdGg6IGJ1aWxkSGVhZChwYXRoKSxcbiAgICBwYXJhbXM6IHBhcmFtcyB8fCBbXSxcbiAgICBoYXNoOiBoYXNoIHx8IGJ1aWxkSGFzaChbXSksXG4gICAgcHJvZ3JhbTogZGVmYXVsdEJsb2NrIHx8IG51bGwsXG4gICAgaW52ZXJzZTogZWxzZUJsb2NrIHx8IG51bGwsXG4gICAgbG9jOiBidWlsZExvYyhsb2MgfHwgbnVsbCksXG4gICAgb3BlblN0cmlwOiBvcGVuU3RyaXAgfHwgeyBvcGVuOiBmYWxzZSwgY2xvc2U6IGZhbHNlIH0sXG4gICAgaW52ZXJzZVN0cmlwOiBpbnZlcnNlU3RyaXAgfHwgeyBvcGVuOiBmYWxzZSwgY2xvc2U6IGZhbHNlIH0sXG4gICAgY2xvc2VTdHJpcDogY2xvc2VTdHJpcCB8fCB7IG9wZW46IGZhbHNlLCBjbG9zZTogZmFsc2UgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gYnVpbGRFbGVtZW50TW9kaWZpZXIoXG4gIHBhdGg6IEJ1aWxkZXJIZWFkLFxuICBwYXJhbXM/OiBBU1QuRXhwcmVzc2lvbltdLFxuICBoYXNoPzogQVNULkhhc2gsXG4gIGxvYz86IE9wdGlvbjxBU1QuU291cmNlTG9jYXRpb24+XG4pOiBBU1QuRWxlbWVudE1vZGlmaWVyU3RhdGVtZW50IHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnRWxlbWVudE1vZGlmaWVyU3RhdGVtZW50JyxcbiAgICBwYXRoOiBidWlsZEhlYWQocGF0aCksXG4gICAgcGFyYW1zOiBwYXJhbXMgfHwgW10sXG4gICAgaGFzaDogaGFzaCB8fCBidWlsZEhhc2goW10pLFxuICAgIGxvYzogYnVpbGRMb2MobG9jIHx8IG51bGwpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBidWlsZFBhcnRpYWwoXG4gIG5hbWU6IEFTVC5QYXRoRXhwcmVzc2lvbixcbiAgcGFyYW1zPzogQVNULkV4cHJlc3Npb25bXSxcbiAgaGFzaD86IEFTVC5IYXNoLFxuICBpbmRlbnQ/OiBzdHJpbmcsXG4gIGxvYz86IEFTVC5Tb3VyY2VMb2NhdGlvblxuKTogQVNULlBhcnRpYWxTdGF0ZW1lbnQge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQYXJ0aWFsU3RhdGVtZW50JyxcbiAgICBuYW1lOiBuYW1lLFxuICAgIHBhcmFtczogcGFyYW1zIHx8IFtdLFxuICAgIGhhc2g6IGhhc2ggfHwgYnVpbGRIYXNoKFtdKSxcbiAgICBpbmRlbnQ6IGluZGVudCB8fCAnJyxcbiAgICBzdHJpcDogeyBvcGVuOiBmYWxzZSwgY2xvc2U6IGZhbHNlIH0sXG4gICAgbG9jOiBidWlsZExvYyhsb2MgfHwgbnVsbCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQ29tbWVudCh2YWx1ZTogc3RyaW5nLCBsb2M/OiBBU1QuU291cmNlTG9jYXRpb24pOiBBU1QuQ29tbWVudFN0YXRlbWVudCB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0NvbW1lbnRTdGF0ZW1lbnQnLFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBsb2M6IGJ1aWxkTG9jKGxvYyB8fCBudWxsKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gYnVpbGRNdXN0YWNoZUNvbW1lbnQoXG4gIHZhbHVlOiBzdHJpbmcsXG4gIGxvYz86IEFTVC5Tb3VyY2VMb2NhdGlvblxuKTogQVNULk11c3RhY2hlQ29tbWVudFN0YXRlbWVudCB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ011c3RhY2hlQ29tbWVudFN0YXRlbWVudCcsXG4gICAgdmFsdWU6IHZhbHVlLFxuICAgIGxvYzogYnVpbGRMb2MobG9jIHx8IG51bGwpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBidWlsZENvbmNhdChcbiAgcGFydHM6IChBU1QuVGV4dE5vZGUgfCBBU1QuTXVzdGFjaGVTdGF0ZW1lbnQpW10sXG4gIGxvYz86IEFTVC5Tb3VyY2VMb2NhdGlvblxuKTogQVNULkNvbmNhdFN0YXRlbWVudCB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0NvbmNhdFN0YXRlbWVudCcsXG4gICAgcGFydHM6IHBhcnRzIHx8IFtdLFxuICAgIGxvYzogYnVpbGRMb2MobG9jIHx8IG51bGwpLFxuICB9O1xufVxuXG4vLyBOb2Rlc1xuXG5leHBvcnQgdHlwZSBFbGVtZW50QXJncyA9XG4gIHwgWydhdHRycycsIC4uLkF0dHJTZXhwW11dXG4gIHwgWydtb2RpZmllcnMnLCAuLi5Nb2RpZmllclNleHBbXV1cbiAgfCBbJ2JvZHknLCAuLi5BU1QuU3RhdGVtZW50W11dXG4gIHwgWydjb21tZW50cycsIC4uLkVsZW1lbnRDb21tZW50W11dXG4gIHwgWydhcycsIC4uLnN0cmluZ1tdXVxuICB8IFsnbG9jJywgQVNULlNvdXJjZUxvY2F0aW9uXTtcblxuZXhwb3J0IHR5cGUgUGF0aFNleHAgPSBzdHJpbmcgfCBbJ3BhdGgnLCBzdHJpbmcsIExvY1NleHA/XTtcblxuZXhwb3J0IHR5cGUgTW9kaWZpZXJTZXhwID1cbiAgfCBzdHJpbmdcbiAgfCBbUGF0aFNleHAsIExvY1NleHA/XVxuICB8IFtQYXRoU2V4cCwgQVNULkV4cHJlc3Npb25bXSwgTG9jU2V4cD9dXG4gIHwgW1BhdGhTZXhwLCBBU1QuRXhwcmVzc2lvbltdLCBEaWN0PEFTVC5FeHByZXNzaW9uPiwgTG9jU2V4cD9dO1xuXG5leHBvcnQgdHlwZSBBdHRyU2V4cCA9IFtzdHJpbmcsIEFTVC5BdHRyTm9kZVsndmFsdWUnXSB8IHN0cmluZywgTG9jU2V4cD9dO1xuXG5leHBvcnQgdHlwZSBMb2NTZXhwID0gWydsb2MnLCBBU1QuU291cmNlTG9jYXRpb25dO1xuXG5leHBvcnQgdHlwZSBFbGVtZW50Q29tbWVudCA9IEFTVC5NdXN0YWNoZUNvbW1lbnRTdGF0ZW1lbnQgfCBBU1QuU291cmNlTG9jYXRpb24gfCBzdHJpbmc7XG5cbmV4cG9ydCB0eXBlIFNleHBWYWx1ZSA9XG4gIHwgc3RyaW5nXG4gIHwgQVNULkV4cHJlc3Npb25bXVxuICB8IERpY3Q8QVNULkV4cHJlc3Npb24+XG4gIHwgTG9jU2V4cFxuICB8IFBhdGhTZXhwXG4gIHwgdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNMb2NTZXhwKHZhbHVlOiBTZXhwVmFsdWUpOiB2YWx1ZSBpcyBMb2NTZXhwIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMiAmJiB2YWx1ZVswXSA9PT0gJ2xvYyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1BhcmFtc1NleHAodmFsdWU6IFNleHBWYWx1ZSk6IHZhbHVlIGlzIEFTVC5FeHByZXNzaW9uW10ge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgIWlzTG9jU2V4cCh2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0hhc2hTZXhwKHZhbHVlOiBTZXhwVmFsdWUpOiB2YWx1ZSBpcyBEaWN0PEFTVC5FeHByZXNzaW9uPiB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIGV4cGVjdFR5cGU8RGljdDxBU1QuRXhwcmVzc2lvbj4+KHZhbHVlKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhwZWN0VHlwZTxUPihfaW5wdXQ6IFQpOiB2b2lkIHtcbiAgcmV0dXJuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplTW9kaWZpZXIoc2V4cDogTW9kaWZpZXJTZXhwKTogQVNULkVsZW1lbnRNb2RpZmllclN0YXRlbWVudCB7XG4gIGlmICh0eXBlb2Ygc2V4cCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gYnVpbGRFbGVtZW50TW9kaWZpZXIoc2V4cCk7XG4gIH1cblxuICBsZXQgcGF0aDogQVNULkV4cHJlc3Npb24gPSBub3JtYWxpemVIZWFkKHNleHBbMF0pO1xuICBsZXQgcGFyYW1zOiBBU1QuRXhwcmVzc2lvbltdIHwgdW5kZWZpbmVkO1xuICBsZXQgaGFzaDogQVNULkhhc2ggfCB1bmRlZmluZWQ7XG4gIGxldCBsb2M6IEFTVC5Tb3VyY2VMb2NhdGlvbiB8IG51bGwgPSBudWxsO1xuXG4gIGxldCBwYXJ0cyA9IHNleHAuc2xpY2UoMSk7XG4gIGxldCBuZXh0ID0gcGFydHMuc2hpZnQoKTtcblxuICBfcHJvY2Vzczoge1xuICAgIGlmIChpc1BhcmFtc1NleHAobmV4dCkpIHtcbiAgICAgIHBhcmFtcyA9IG5leHQgYXMgQVNULkV4cHJlc3Npb25bXTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWsgX3Byb2Nlc3M7XG4gICAgfVxuXG4gICAgbmV4dCA9IHBhcnRzLnNoaWZ0KCk7XG5cbiAgICBpZiAoaXNIYXNoU2V4cChuZXh0KSkge1xuICAgICAgaGFzaCA9IG5vcm1hbGl6ZUhhc2gobmV4dCBhcyBEaWN0PEFTVC5FeHByZXNzaW9uPik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrIF9wcm9jZXNzO1xuICAgIH1cbiAgfVxuXG4gIGlmIChpc0xvY1NleHAobmV4dCkpIHtcbiAgICBsb2MgPSBuZXh0WzFdO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnRWxlbWVudE1vZGlmaWVyU3RhdGVtZW50JyxcbiAgICBwYXRoLFxuICAgIHBhcmFtczogcGFyYW1zIHx8IFtdLFxuICAgIGhhc2g6IGhhc2ggfHwgYnVpbGRIYXNoKFtdKSxcbiAgICBsb2M6IGJ1aWxkTG9jKGxvYyB8fCBudWxsKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUF0dHIoc2V4cDogQXR0clNleHApOiBBU1QuQXR0ck5vZGUge1xuICBsZXQgbmFtZSA9IHNleHBbMF07XG4gIGxldCB2YWx1ZTtcblxuICBpZiAodHlwZW9mIHNleHBbMV0gPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsdWUgPSBidWlsZFRleHQoc2V4cFsxXSk7XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBzZXhwWzFdO1xuICB9XG5cbiAgbGV0IGxvYyA9IHNleHBbMl0gPyBzZXhwWzJdWzFdIDogdW5kZWZpbmVkO1xuXG4gIHJldHVybiBidWlsZEF0dHIobmFtZSwgdmFsdWUsIGxvYyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVIYXNoKGhhc2g6IERpY3Q8QVNULkV4cHJlc3Npb24+LCBsb2M/OiBBU1QuU291cmNlTG9jYXRpb24pOiBBU1QuSGFzaCB7XG4gIGxldCBwYWlyczogQVNULkhhc2hQYWlyW10gPSBbXTtcblxuICBPYmplY3Qua2V5cyhoYXNoKS5mb3JFYWNoKChrZXkpID0+IHtcbiAgICBwYWlycy5wdXNoKGJ1aWxkUGFpcihrZXksIGhhc2hba2V5XSkpO1xuICB9KTtcblxuICByZXR1cm4gYnVpbGRIYXNoKHBhaXJzLCBsb2MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplSGVhZChwYXRoOiBQYXRoU2V4cCk6IEFTVC5FeHByZXNzaW9uIHtcbiAgaWYgKHR5cGVvZiBwYXRoID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBidWlsZEhlYWQocGF0aCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJ1aWxkSGVhZChwYXRoWzFdLCBwYXRoWzJdICYmIHBhdGhbMl1bMV0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVFbGVtZW50T3B0aW9ucyguLi5hcmdzOiBFbGVtZW50QXJnc1tdKTogQnVpbGRFbGVtZW50T3B0aW9ucyB7XG4gIGxldCBvdXQ6IEJ1aWxkRWxlbWVudE9wdGlvbnMgPSB7fTtcblxuICBmb3IgKGxldCBhcmcgb2YgYXJncykge1xuICAgIHN3aXRjaCAoYXJnWzBdKSB7XG4gICAgICBjYXNlICdhdHRycyc6IHtcbiAgICAgICAgbGV0IFssIC4uLnJlc3RdID0gYXJnO1xuICAgICAgICBvdXQuYXR0cnMgPSByZXN0Lm1hcChub3JtYWxpemVBdHRyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdtb2RpZmllcnMnOiB7XG4gICAgICAgIGxldCBbLCAuLi5yZXN0XSA9IGFyZztcbiAgICAgICAgb3V0Lm1vZGlmaWVycyA9IHJlc3QubWFwKG5vcm1hbGl6ZU1vZGlmaWVyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlICdib2R5Jzoge1xuICAgICAgICBsZXQgWywgLi4ucmVzdF0gPSBhcmc7XG4gICAgICAgIG91dC5jaGlsZHJlbiA9IHJlc3Q7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnY29tbWVudHMnOiB7XG4gICAgICAgIGxldCBbLCAuLi5yZXN0XSA9IGFyZztcblxuICAgICAgICBvdXQuY29tbWVudHMgPSByZXN0O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgJ2FzJzoge1xuICAgICAgICBsZXQgWywgLi4ucmVzdF0gPSBhcmc7XG4gICAgICAgIG91dC5ibG9ja1BhcmFtcyA9IHJlc3Q7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSAnbG9jJzoge1xuICAgICAgICBsZXQgWywgcmVzdF0gPSBhcmc7XG4gICAgICAgIG91dC5sb2MgPSByZXN0O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3V0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJ1aWxkRWxlbWVudE9wdGlvbnMge1xuICBhdHRycz86IEFTVC5BdHRyTm9kZVtdO1xuICBtb2RpZmllcnM/OiBBU1QuRWxlbWVudE1vZGlmaWVyU3RhdGVtZW50W107XG4gIGNoaWxkcmVuPzogQVNULlN0YXRlbWVudFtdO1xuICBjb21tZW50cz86IEVsZW1lbnRDb21tZW50W107XG4gIGJsb2NrUGFyYW1zPzogc3RyaW5nW107XG4gIGxvYz86IEFTVC5Tb3VyY2VMb2NhdGlvbjtcbn1cblxuZnVuY3Rpb24gYnVpbGRFbGVtZW50KHRhZzogVGFnRGVzY3JpcHRvciwgb3B0aW9ucz86IEJ1aWxkRWxlbWVudE9wdGlvbnMpOiBBU1QuRWxlbWVudE5vZGU7XG5mdW5jdGlvbiBidWlsZEVsZW1lbnQodGFnOiBUYWdEZXNjcmlwdG9yLCAuLi5vcHRpb25zOiBFbGVtZW50QXJnc1tdKTogQVNULkVsZW1lbnROb2RlO1xuZnVuY3Rpb24gYnVpbGRFbGVtZW50KFxuICB0YWc6IFRhZ0Rlc2NyaXB0b3IsXG4gIG9wdGlvbnM/OiBCdWlsZEVsZW1lbnRPcHRpb25zIHwgRWxlbWVudEFyZ3MsXG4gIC4uLnJlc3Q6IEVsZW1lbnRBcmdzW11cbik6IEFTVC5FbGVtZW50Tm9kZSB7XG4gIGxldCBub3JtYWxpemVkOiBCdWlsZEVsZW1lbnRPcHRpb25zO1xuICBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zKSkge1xuICAgIG5vcm1hbGl6ZWQgPSBub3JtYWxpemVFbGVtZW50T3B0aW9ucyhvcHRpb25zLCAuLi5yZXN0KTtcbiAgfSBlbHNlIHtcbiAgICBub3JtYWxpemVkID0gb3B0aW9ucyB8fCB7fTtcbiAgfVxuXG4gIGxldCB7IGF0dHJzLCBibG9ja1BhcmFtcywgbW9kaWZpZXJzLCBjb21tZW50cywgY2hpbGRyZW4sIGxvYyB9ID0gbm9ybWFsaXplZDtcblxuICAvLyB0aGlzIGlzIHVzZWQgZm9yIGJhY2t3YXJkcyBjb21wYXQsIHByaW9yIHRvIGBzZWxmQ2xvc2luZ2AgYmVpbmcgcGFydCBvZiB0aGUgRWxlbWVudE5vZGUgQVNUXG4gIGxldCBzZWxmQ2xvc2luZyA9IGZhbHNlO1xuICBpZiAodHlwZW9mIHRhZyA9PT0gJ29iamVjdCcpIHtcbiAgICBzZWxmQ2xvc2luZyA9IHRhZy5zZWxmQ2xvc2luZztcbiAgICB0YWcgPSB0YWcubmFtZTtcbiAgfSBlbHNlIHtcbiAgICBpZiAodGFnLnNsaWNlKC0xKSA9PT0gJy8nKSB7XG4gICAgICB0YWcgPSB0YWcuc2xpY2UoMCwgLTEpO1xuICAgICAgc2VsZkNsb3NpbmcgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0VsZW1lbnROb2RlJyxcbiAgICB0YWc6IHRhZyB8fCAnJyxcbiAgICBzZWxmQ2xvc2luZzogc2VsZkNsb3NpbmcsXG4gICAgYXR0cmlidXRlczogYXR0cnMgfHwgW10sXG4gICAgYmxvY2tQYXJhbXM6IGJsb2NrUGFyYW1zIHx8IFtdLFxuICAgIG1vZGlmaWVyczogbW9kaWZpZXJzIHx8IFtdLFxuICAgIGNvbW1lbnRzOiAoY29tbWVudHMgYXMgQVNULk11c3RhY2hlQ29tbWVudFN0YXRlbWVudFtdKSB8fCBbXSxcbiAgICBjaGlsZHJlbjogY2hpbGRyZW4gfHwgW10sXG4gICAgbG9jOiBidWlsZExvYyhsb2MgfHwgbnVsbCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkQXR0cihcbiAgbmFtZTogc3RyaW5nLFxuICB2YWx1ZTogQVNULkF0dHJOb2RlWyd2YWx1ZSddLFxuICBsb2M/OiBBU1QuU291cmNlTG9jYXRpb25cbik6IEFTVC5BdHRyTm9kZSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0F0dHJOb2RlJyxcbiAgICBuYW1lOiBuYW1lLFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBsb2M6IGJ1aWxkTG9jKGxvYyB8fCBudWxsKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gYnVpbGRUZXh0KGNoYXJzPzogc3RyaW5nLCBsb2M/OiBBU1QuU291cmNlTG9jYXRpb24pOiBBU1QuVGV4dE5vZGUge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdUZXh0Tm9kZScsXG4gICAgY2hhcnM6IGNoYXJzIHx8ICcnLFxuICAgIGxvYzogYnVpbGRMb2MobG9jIHx8IG51bGwpLFxuICB9O1xufVxuXG4vLyBFeHByZXNzaW9uc1xuXG5mdW5jdGlvbiBidWlsZFNleHByKFxuICBwYXRoOiBCdWlsZGVySGVhZCxcbiAgcGFyYW1zPzogQVNULkV4cHJlc3Npb25bXSxcbiAgaGFzaD86IEFTVC5IYXNoLFxuICBsb2M/OiBBU1QuU291cmNlTG9jYXRpb25cbik6IEFTVC5TdWJFeHByZXNzaW9uIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnU3ViRXhwcmVzc2lvbicsXG4gICAgcGF0aDogYnVpbGRIZWFkKHBhdGgpLFxuICAgIHBhcmFtczogcGFyYW1zIHx8IFtdLFxuICAgIGhhc2g6IGhhc2ggfHwgYnVpbGRIYXNoKFtdKSxcbiAgICBsb2M6IGJ1aWxkTG9jKGxvYyB8fCBudWxsKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gYnVpbGRIZWFkKG9yaWdpbmFsOiBCdWlsZGVySGVhZCwgbG9jPzogQVNULlNvdXJjZUxvY2F0aW9uKTogQVNULkV4cHJlc3Npb24ge1xuICBpZiAodHlwZW9mIG9yaWdpbmFsICE9PSAnc3RyaW5nJykgcmV0dXJuIG9yaWdpbmFsO1xuXG4gIGxldCBwYXJ0cyA9IG9yaWdpbmFsLnNwbGl0KCcuJyk7XG4gIGxldCB0aGlzSGVhZCA9IGZhbHNlO1xuXG4gIGlmIChwYXJ0c1swXSA9PT0gJ3RoaXMnKSB7XG4gICAgdGhpc0hlYWQgPSB0cnVlO1xuICAgIHBhcnRzID0gcGFydHMuc2xpY2UoMSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdQYXRoRXhwcmVzc2lvbicsXG4gICAgb3JpZ2luYWwsXG4gICAgdGhpczogdGhpc0hlYWQsXG4gICAgcGFydHMsXG4gICAgZGF0YTogZmFsc2UsXG4gICAgbG9jOiBidWlsZExvYyhsb2MgfHwgbnVsbCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkTGl0ZXJhbDxUIGV4dGVuZHMgQVNULkxpdGVyYWw+KFxuICB0eXBlOiBUWyd0eXBlJ10sXG4gIHZhbHVlOiBUWyd2YWx1ZSddLFxuICBsb2M/OiBBU1QuU291cmNlTG9jYXRpb25cbik6IFQge1xuICByZXR1cm4ge1xuICAgIHR5cGUsXG4gICAgdmFsdWUsXG4gICAgb3JpZ2luYWw6IHZhbHVlLFxuICAgIGxvYzogYnVpbGRMb2MobG9jIHx8IG51bGwpLFxuICB9IGFzIFQ7XG59XG5cbi8vIE1pc2NlbGxhbmVvdXNcblxuZnVuY3Rpb24gYnVpbGRIYXNoKHBhaXJzPzogQVNULkhhc2hQYWlyW10sIGxvYz86IEFTVC5Tb3VyY2VMb2NhdGlvbik6IEFTVC5IYXNoIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnSGFzaCcsXG4gICAgcGFpcnM6IHBhaXJzIHx8IFtdLFxuICAgIGxvYzogYnVpbGRMb2MobG9jIHx8IG51bGwpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBidWlsZFBhaXIoa2V5OiBzdHJpbmcsIHZhbHVlOiBBU1QuRXhwcmVzc2lvbiwgbG9jPzogQVNULlNvdXJjZUxvY2F0aW9uKTogQVNULkhhc2hQYWlyIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnSGFzaFBhaXInLFxuICAgIGtleToga2V5LFxuICAgIHZhbHVlLFxuICAgIGxvYzogYnVpbGRMb2MobG9jIHx8IG51bGwpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBidWlsZFByb2dyYW0oXG4gIGJvZHk/OiBBU1QuU3RhdGVtZW50W10sXG4gIGJsb2NrUGFyYW1zPzogc3RyaW5nW10sXG4gIGxvYz86IEFTVC5Tb3VyY2VMb2NhdGlvblxuKTogQVNULlRlbXBsYXRlIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnVGVtcGxhdGUnLFxuICAgIGJvZHk6IGJvZHkgfHwgW10sXG4gICAgYmxvY2tQYXJhbXM6IGJsb2NrUGFyYW1zIHx8IFtdLFxuICAgIGxvYzogYnVpbGRMb2MobG9jIHx8IG51bGwpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBidWlsZEJsb2NrSXRzZWxmKFxuICBib2R5PzogQVNULlN0YXRlbWVudFtdLFxuICBibG9ja1BhcmFtcz86IHN0cmluZ1tdLFxuICBjaGFpbmVkID0gZmFsc2UsXG4gIGxvYz86IEFTVC5Tb3VyY2VMb2NhdGlvblxuKTogQVNULkJsb2NrIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQmxvY2snLFxuICAgIGJvZHk6IGJvZHkgfHwgW10sXG4gICAgYmxvY2tQYXJhbXM6IGJsb2NrUGFyYW1zIHx8IFtdLFxuICAgIGNoYWluZWQsXG4gICAgbG9jOiBidWlsZExvYyhsb2MgfHwgbnVsbCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkVGVtcGxhdGUoXG4gIGJvZHk/OiBBU1QuU3RhdGVtZW50W10sXG4gIGJsb2NrUGFyYW1zPzogc3RyaW5nW10sXG4gIGxvYz86IEFTVC5Tb3VyY2VMb2NhdGlvblxuKTogQVNULlRlbXBsYXRlIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnVGVtcGxhdGUnLFxuICAgIGJvZHk6IGJvZHkgfHwgW10sXG4gICAgYmxvY2tQYXJhbXM6IGJsb2NrUGFyYW1zIHx8IFtdLFxuICAgIGxvYzogYnVpbGRMb2MobG9jIHx8IG51bGwpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBidWlsZFNvdXJjZShzb3VyY2U/OiBzdHJpbmcpIHtcbiAgcmV0dXJuIHNvdXJjZSB8fCBudWxsO1xufVxuXG5mdW5jdGlvbiBidWlsZFBvc2l0aW9uKGxpbmU6IG51bWJlciwgY29sdW1uOiBudW1iZXIpIHtcbiAgcmV0dXJuIHtcbiAgICBsaW5lLFxuICAgIGNvbHVtbixcbiAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IFNZTlRIRVRJQzogQVNULlNvdXJjZUxvY2F0aW9uID0ge1xuICBzb3VyY2U6ICcoc3ludGhldGljKScsXG4gIHN0YXJ0OiB7IGxpbmU6IDEsIGNvbHVtbjogMCB9LFxuICBlbmQ6IHsgbGluZTogMSwgY29sdW1uOiAwIH0sXG59O1xuXG5mdW5jdGlvbiBidWlsZExvYyhsb2M6IE9wdGlvbjxBU1QuU291cmNlTG9jYXRpb24+KTogQVNULlNvdXJjZUxvY2F0aW9uO1xuZnVuY3Rpb24gYnVpbGRMb2MoXG4gIHN0YXJ0TGluZTogbnVtYmVyLFxuICBzdGFydENvbHVtbjogbnVtYmVyLFxuICBlbmRMaW5lPzogbnVtYmVyLFxuICBlbmRDb2x1bW4/OiBudW1iZXIsXG4gIHNvdXJjZT86IHN0cmluZ1xuKTogQVNULlNvdXJjZUxvY2F0aW9uO1xuXG5mdW5jdGlvbiBidWlsZExvYyguLi5hcmdzOiBhbnlbXSk6IEFTVC5Tb3VyY2VMb2NhdGlvbiB7XG4gIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgIGxldCBsb2MgPSBhcmdzWzBdO1xuXG4gICAgaWYgKGxvYyAmJiB0eXBlb2YgbG9jID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc291cmNlOiBidWlsZFNvdXJjZShsb2Muc291cmNlKSxcbiAgICAgICAgc3RhcnQ6IGJ1aWxkUG9zaXRpb24obG9jLnN0YXJ0LmxpbmUsIGxvYy5zdGFydC5jb2x1bW4pLFxuICAgICAgICBlbmQ6IGJ1aWxkUG9zaXRpb24obG9jLmVuZC5saW5lLCBsb2MuZW5kLmNvbHVtbiksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gU1lOVEhFVElDO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsZXQgW3N0YXJ0TGluZSwgc3RhcnRDb2x1bW4sIGVuZExpbmUsIGVuZENvbHVtbiwgc291cmNlXSA9IGFyZ3M7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNvdXJjZTogYnVpbGRTb3VyY2Uoc291cmNlKSxcbiAgICAgIHN0YXJ0OiBidWlsZFBvc2l0aW9uKHN0YXJ0TGluZSwgc3RhcnRDb2x1bW4pLFxuICAgICAgZW5kOiBidWlsZFBvc2l0aW9uKGVuZExpbmUsIGVuZENvbHVtbiksXG4gICAgfTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIG11c3RhY2hlOiBidWlsZE11c3RhY2hlLFxuICBibG9jazogYnVpbGRCbG9jayxcbiAgcGFydGlhbDogYnVpbGRQYXJ0aWFsLFxuICBjb21tZW50OiBidWlsZENvbW1lbnQsXG4gIG11c3RhY2hlQ29tbWVudDogYnVpbGRNdXN0YWNoZUNvbW1lbnQsXG4gIGVsZW1lbnQ6IGJ1aWxkRWxlbWVudCxcbiAgZWxlbWVudE1vZGlmaWVyOiBidWlsZEVsZW1lbnRNb2RpZmllcixcbiAgYXR0cjogYnVpbGRBdHRyLFxuICB0ZXh0OiBidWlsZFRleHQsXG4gIHNleHByOiBidWlsZFNleHByLFxuICBwYXRoOiBidWlsZEhlYWQsXG4gIGNvbmNhdDogYnVpbGRDb25jYXQsXG4gIGhhc2g6IGJ1aWxkSGFzaCxcbiAgcGFpcjogYnVpbGRQYWlyLFxuICBsaXRlcmFsOiBidWlsZExpdGVyYWwsXG4gIHByb2dyYW06IGJ1aWxkUHJvZ3JhbSxcbiAgYmxvY2tJdHNlbGY6IGJ1aWxkQmxvY2tJdHNlbGYsXG4gIHRlbXBsYXRlOiBidWlsZFRlbXBsYXRlLFxuICBsb2M6IGJ1aWxkTG9jLFxuICBwb3M6IGJ1aWxkUG9zaXRpb24sXG5cbiAgc3RyaW5nOiBsaXRlcmFsKCdTdHJpbmdMaXRlcmFsJykgYXMgKHZhbHVlOiBzdHJpbmcpID0+IFN0cmluZ0xpdGVyYWwsXG4gIGJvb2xlYW46IGxpdGVyYWwoJ0Jvb2xlYW5MaXRlcmFsJykgYXMgKHZhbHVlOiBib29sZWFuKSA9PiBCb29sZWFuTGl0ZXJhbCxcbiAgbnVtYmVyOiBsaXRlcmFsKCdOdW1iZXJMaXRlcmFsJykgYXMgKHZhbHVlOiBudW1iZXIpID0+IE51bWJlckxpdGVyYWwsXG4gIHVuZGVmaW5lZCgpIHtcbiAgICByZXR1cm4gYnVpbGRMaXRlcmFsKCdVbmRlZmluZWRMaXRlcmFsJywgdW5kZWZpbmVkKTtcbiAgfSxcbiAgbnVsbCgpIHtcbiAgICByZXR1cm4gYnVpbGRMaXRlcmFsKCdOdWxsTGl0ZXJhbCcsIG51bGwpO1xuICB9LFxufTtcblxudHlwZSBCdWlsZExpdGVyYWw8VCBleHRlbmRzIEFTVC5MaXRlcmFsPiA9ICh2YWx1ZTogVFsndmFsdWUnXSkgPT4gVDtcblxuZnVuY3Rpb24gbGl0ZXJhbDxUIGV4dGVuZHMgQVNULkxpdGVyYWw+KHR5cGU6IFRbJ3R5cGUnXSk6IEJ1aWxkTGl0ZXJhbDxUPiB7XG4gIHJldHVybiBmdW5jdGlvbiAodmFsdWU6IFRbJ3ZhbHVlJ10pOiBUIHtcbiAgICByZXR1cm4gYnVpbGRMaXRlcmFsKHR5cGUsIHZhbHVlKTtcbiAgfTtcbn1cbiIsImltcG9ydCAqIGFzIEFTVCBmcm9tICcuLi90eXBlcy9ub2Rlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3ludGF4RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGxvY2F0aW9uOiBBU1QuU291cmNlTG9jYXRpb247XG4gIGNvbnN0cnVjdG9yOiBTeW50YXhFcnJvckNvbnN0cnVjdG9yO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN5bnRheEVycm9yQ29uc3RydWN0b3Ige1xuICBuZXcgKG1lc3NhZ2U6IHN0cmluZywgbG9jYXRpb246IEFTVC5Tb3VyY2VMb2NhdGlvbik6IFN5bnRheEVycm9yO1xuICByZWFkb25seSBwcm90b3R5cGU6IFN5bnRheEVycm9yO1xufVxuXG4vKipcbiAqIFN1YmNsYXNzIG9mIGBFcnJvcmAgd2l0aCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uXG4gKiBhYm91dCBsb2NhdGlvbiBvZiBpbmNvcnJlY3QgbWFya3VwLlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25hbWluZy1jb252ZW50aW9uXG5jb25zdCBTeW50YXhFcnJvcjogU3ludGF4RXJyb3JDb25zdHJ1Y3RvciA9IChmdW5jdGlvbiAoKSB7XG4gIFN5bnRheEVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcbiAgU3ludGF4RXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU3ludGF4RXJyb3I7XG5cbiAgZnVuY3Rpb24gU3ludGF4RXJyb3IodGhpczogU3ludGF4RXJyb3IsIG1lc3NhZ2U6IHN0cmluZywgbG9jYXRpb246IEFTVC5Tb3VyY2VMb2NhdGlvbikge1xuICAgIGxldCBlcnJvciA9IEVycm9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIHRoaXMuc3RhY2sgPSBlcnJvci5zdGFjaztcbiAgICB0aGlzLmxvY2F0aW9uID0gbG9jYXRpb247XG4gIH1cblxuICByZXR1cm4gU3ludGF4RXJyb3IgYXMgYW55O1xufSkoKTtcblxuZXhwb3J0IGRlZmF1bHQgU3ludGF4RXJyb3I7XG4iLCJpbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi90eXBlcy9ub2Rlcyc7XG5pbXBvcnQgKiBhcyBIQlMgZnJvbSAnLi90eXBlcy9oYW5kbGViYXJzLWFzdCc7XG5pbXBvcnQgeyBPcHRpb24gfSBmcm9tICdAZ2xpbW1lci9pbnRlcmZhY2VzJztcbmltcG9ydCBTeW50YXhFcnJvciBmcm9tICcuL2Vycm9ycy9zeW50YXgtZXJyb3InO1xuXG4vLyBSZWdleCB0byB2YWxpZGF0ZSB0aGUgaWRlbnRpZmllciBmb3IgYmxvY2sgcGFyYW1ldGVycy5cbi8vIEJhc2VkIG9uIHRoZSBJRCB2YWxpZGF0aW9uIHJlZ2V4IGluIEhhbmRsZWJhcnMuXG5cbmxldCBJRF9JTlZFUlNFX1BBVFRFUk4gPSAvWyFcIiMlLSxcXC5cXC87LT5AXFxbLVxcXmBcXHstfl0vO1xuXG4vLyBDaGVja3MgdGhlIGVsZW1lbnQncyBhdHRyaWJ1dGVzIHRvIHNlZSBpZiBpdCB1c2VzIGJsb2NrIHBhcmFtcy5cbi8vIElmIGl0IGRvZXMsIHJlZ2lzdGVycyB0aGUgYmxvY2sgcGFyYW1zIHdpdGggdGhlIHByb2dyYW0gYW5kXG4vLyByZW1vdmVzIHRoZSBjb3JyZXNwb25kaW5nIGF0dHJpYnV0ZXMgZnJvbSB0aGUgZWxlbWVudC5cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRWxlbWVudEJsb2NrUGFyYW1zKGVsZW1lbnQ6IEFTVC5FbGVtZW50Tm9kZSkge1xuICBsZXQgcGFyYW1zID0gcGFyc2VCbG9ja1BhcmFtcyhlbGVtZW50KTtcbiAgaWYgKHBhcmFtcykgZWxlbWVudC5ibG9ja1BhcmFtcyA9IHBhcmFtcztcbn1cblxuZnVuY3Rpb24gcGFyc2VCbG9ja1BhcmFtcyhlbGVtZW50OiBBU1QuRWxlbWVudE5vZGUpOiBPcHRpb248c3RyaW5nW10+IHtcbiAgbGV0IGwgPSBlbGVtZW50LmF0dHJpYnV0ZXMubGVuZ3RoO1xuICBsZXQgYXR0ck5hbWVzID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICBhdHRyTmFtZXMucHVzaChlbGVtZW50LmF0dHJpYnV0ZXNbaV0ubmFtZSk7XG4gIH1cblxuICBsZXQgYXNJbmRleCA9IGF0dHJOYW1lcy5pbmRleE9mKCdhcycpO1xuXG4gIGlmIChhc0luZGV4ICE9PSAtMSAmJiBsID4gYXNJbmRleCAmJiBhdHRyTmFtZXNbYXNJbmRleCArIDFdLmNoYXJBdCgwKSA9PT0gJ3wnKSB7XG4gICAgLy8gU29tZSBiYXNpYyB2YWxpZGF0aW9uLCBzaW5jZSB3ZSdyZSBkb2luZyB0aGUgcGFyc2luZyBvdXJzZWx2ZXNcbiAgICBsZXQgcGFyYW1zU3RyaW5nID0gYXR0ck5hbWVzLnNsaWNlKGFzSW5kZXgpLmpvaW4oJyAnKTtcbiAgICBpZiAoXG4gICAgICBwYXJhbXNTdHJpbmcuY2hhckF0KHBhcmFtc1N0cmluZy5sZW5ndGggLSAxKSAhPT0gJ3wnIHx8XG4gICAgICBwYXJhbXNTdHJpbmcubWF0Y2goL1xcfC9nKSEubGVuZ3RoICE9PSAyXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJJbnZhbGlkIGJsb2NrIHBhcmFtZXRlcnMgc3ludGF4OiAnXCIgKyBwYXJhbXNTdHJpbmcgKyBcIidcIiwgZWxlbWVudC5sb2MpO1xuICAgIH1cblxuICAgIGxldCBwYXJhbXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gYXNJbmRleCArIDE7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxldCBwYXJhbSA9IGF0dHJOYW1lc1tpXS5yZXBsYWNlKC9cXHwvZywgJycpO1xuICAgICAgaWYgKHBhcmFtICE9PSAnJykge1xuICAgICAgICBpZiAoSURfSU5WRVJTRV9QQVRURVJOLnRlc3QocGFyYW0pKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgICAgICAgXCJJbnZhbGlkIGlkZW50aWZpZXIgZm9yIGJsb2NrIHBhcmFtZXRlcnM6ICdcIiArIHBhcmFtICsgXCInIGluICdcIiArIHBhcmFtc1N0cmluZyArIFwiJ1wiLFxuICAgICAgICAgICAgZWxlbWVudC5sb2NcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHBhcmFtcy5wdXNoKHBhcmFtKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocGFyYW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgICBcIkNhbm5vdCB1c2UgemVybyBibG9jayBwYXJhbWV0ZXJzOiAnXCIgKyBwYXJhbXNTdHJpbmcgKyBcIidcIixcbiAgICAgICAgZWxlbWVudC5sb2NcbiAgICAgICk7XG4gICAgfVxuXG4gICAgZWxlbWVudC5hdHRyaWJ1dGVzID0gZWxlbWVudC5hdHRyaWJ1dGVzLnNsaWNlKDAsIGFzSW5kZXgpO1xuICAgIHJldHVybiBwYXJhbXM7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoaWxkcmVuRm9yKFxuICBub2RlOiBBU1QuQmxvY2sgfCBBU1QuVGVtcGxhdGUgfCBBU1QuRWxlbWVudE5vZGVcbik6IEFTVC5Ub3BMZXZlbFN0YXRlbWVudFtdIHtcbiAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICBjYXNlICdCbG9jayc6XG4gICAgY2FzZSAnVGVtcGxhdGUnOlxuICAgICAgcmV0dXJuIG5vZGUuYm9keTtcbiAgICBjYXNlICdFbGVtZW50Tm9kZSc6XG4gICAgICByZXR1cm4gbm9kZS5jaGlsZHJlbjtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ2hpbGQoXG4gIHBhcmVudDogQVNULkJsb2NrIHwgQVNULlRlbXBsYXRlIHwgQVNULkVsZW1lbnROb2RlLFxuICBub2RlOiBBU1QuU3RhdGVtZW50XG4pIHtcbiAgY2hpbGRyZW5Gb3IocGFyZW50KS5wdXNoKG5vZGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNMaXRlcmFsKHBhdGg6IEhCUy5FeHByZXNzaW9uKTogcGF0aCBpcyBIQlMuTGl0ZXJhbDtcbmV4cG9ydCBmdW5jdGlvbiBpc0xpdGVyYWwocGF0aDogQVNULkV4cHJlc3Npb24pOiBwYXRoIGlzIEFTVC5MaXRlcmFsO1xuZXhwb3J0IGZ1bmN0aW9uIGlzTGl0ZXJhbChcbiAgcGF0aDogSEJTLkV4cHJlc3Npb24gfCBBU1QuRXhwcmVzc2lvblxuKTogcGF0aCBpcyBIQlMuTGl0ZXJhbCB8IEFTVC5MaXRlcmFsIHtcbiAgcmV0dXJuIChcbiAgICBwYXRoLnR5cGUgPT09ICdTdHJpbmdMaXRlcmFsJyB8fFxuICAgIHBhdGgudHlwZSA9PT0gJ0Jvb2xlYW5MaXRlcmFsJyB8fFxuICAgIHBhdGgudHlwZSA9PT0gJ051bWJlckxpdGVyYWwnIHx8XG4gICAgcGF0aC50eXBlID09PSAnTnVsbExpdGVyYWwnIHx8XG4gICAgcGF0aC50eXBlID09PSAnVW5kZWZpbmVkTGl0ZXJhbCdcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByaW50TGl0ZXJhbChsaXRlcmFsOiBBU1QuTGl0ZXJhbCk6IHN0cmluZyB7XG4gIGlmIChsaXRlcmFsLnR5cGUgPT09ICdVbmRlZmluZWRMaXRlcmFsJykge1xuICAgIHJldHVybiAndW5kZWZpbmVkJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkobGl0ZXJhbC52YWx1ZSk7XG4gIH1cbn1cbiIsImltcG9ydCB7XG4gIEV2ZW50ZWRUb2tlbml6ZXIsXG4gIEVudGl0eVBhcnNlcixcbiAgSFRNTDVOYW1lZENoYXJSZWZzIGFzIG5hbWVkQ2hhclJlZnMsXG59IGZyb20gJ3NpbXBsZS1odG1sLXRva2VuaXplcic7XG5pbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi90eXBlcy9ub2Rlcyc7XG5pbXBvcnQgKiBhcyBIQlMgZnJvbSAnLi90eXBlcy9oYW5kbGViYXJzLWFzdCc7XG5pbXBvcnQgeyBPcHRpb24gfSBmcm9tICdAZ2xpbW1lci9pbnRlcmZhY2VzJztcbmltcG9ydCB7IGFzc2VydCwgZXhwZWN0IH0gZnJvbSAnQGdsaW1tZXIvdXRpbCc7XG5cbmV4cG9ydCB0eXBlIEVsZW1lbnQgPSBBU1QuVGVtcGxhdGUgfCBBU1QuQmxvY2sgfCBBU1QuRWxlbWVudE5vZGU7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFnPFQgZXh0ZW5kcyAnU3RhcnRUYWcnIHwgJ0VuZFRhZyc+IHtcbiAgdHlwZTogVDtcbiAgbmFtZTogc3RyaW5nO1xuICBhdHRyaWJ1dGVzOiBhbnlbXTtcbiAgbW9kaWZpZXJzOiBhbnlbXTtcbiAgY29tbWVudHM6IGFueVtdO1xuICBzZWxmQ2xvc2luZzogYm9vbGVhbjtcbiAgbG9jOiBBU1QuU291cmNlTG9jYXRpb247XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXR0cmlidXRlIHtcbiAgbmFtZTogc3RyaW5nO1xuICBwYXJ0czogKEFTVC5NdXN0YWNoZVN0YXRlbWVudCB8IEFTVC5UZXh0Tm9kZSlbXTtcbiAgaXNRdW90ZWQ6IGJvb2xlYW47XG4gIGlzRHluYW1pYzogYm9vbGVhbjtcbiAgc3RhcnQ6IEFTVC5Qb3NpdGlvbjtcbiAgdmFsdWVTdGFydExpbmU6IG51bWJlcjtcbiAgdmFsdWVTdGFydENvbHVtbjogbnVtYmVyO1xufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUGFyc2VyIHtcbiAgcHJvdGVjdGVkIGVsZW1lbnRTdGFjazogRWxlbWVudFtdID0gW107XG4gIHByaXZhdGUgc291cmNlOiBzdHJpbmdbXTtcbiAgcHVibGljIGN1cnJlbnRBdHRyaWJ1dGU6IE9wdGlvbjxBdHRyaWJ1dGU+ID0gbnVsbDtcbiAgcHVibGljIGN1cnJlbnROb2RlOiBPcHRpb248XG4gICAgQVNULkNvbW1lbnRTdGF0ZW1lbnQgfCBBU1QuVGV4dE5vZGUgfCBUYWc8J1N0YXJ0VGFnJyB8ICdFbmRUYWcnPlxuICA+ID0gbnVsbDtcbiAgcHVibGljIHRva2VuaXplcjogRXZlbnRlZFRva2VuaXplcjtcblxuICBjb25zdHJ1Y3Rvcihzb3VyY2U6IHN0cmluZywgZW50aXR5UGFyc2VyID0gbmV3IEVudGl0eVBhcnNlcihuYW1lZENoYXJSZWZzKSkge1xuICAgIHRoaXMuc291cmNlID0gc291cmNlLnNwbGl0KC8oPzpcXHJcXG4/fFxcbikvZyk7XG4gICAgdGhpcy50b2tlbml6ZXIgPSBuZXcgRXZlbnRlZFRva2VuaXplcih0aGlzLCBlbnRpdHlQYXJzZXIpO1xuICB9XG5cbiAgYWJzdHJhY3QgUHJvZ3JhbShub2RlOiBIQlMuUHJvZ3JhbSk6IEhCUy5PdXRwdXQ8J1Byb2dyYW0nPjtcbiAgYWJzdHJhY3QgTXVzdGFjaGVTdGF0ZW1lbnQobm9kZTogSEJTLk11c3RhY2hlU3RhdGVtZW50KTogSEJTLk91dHB1dDwnTXVzdGFjaGVTdGF0ZW1lbnQnPjtcbiAgYWJzdHJhY3QgRGVjb3JhdG9yKG5vZGU6IEhCUy5EZWNvcmF0b3IpOiBIQlMuT3V0cHV0PCdEZWNvcmF0b3InPjtcbiAgYWJzdHJhY3QgQmxvY2tTdGF0ZW1lbnQobm9kZTogSEJTLkJsb2NrU3RhdGVtZW50KTogSEJTLk91dHB1dDwnQmxvY2tTdGF0ZW1lbnQnPjtcbiAgYWJzdHJhY3QgRGVjb3JhdG9yQmxvY2sobm9kZTogSEJTLkRlY29yYXRvckJsb2NrKTogSEJTLk91dHB1dDwnRGVjb3JhdG9yQmxvY2snPjtcbiAgYWJzdHJhY3QgUGFydGlhbFN0YXRlbWVudChub2RlOiBIQlMuUGFydGlhbFN0YXRlbWVudCk6IEhCUy5PdXRwdXQ8J1BhcnRpYWxTdGF0ZW1lbnQnPjtcbiAgYWJzdHJhY3QgUGFydGlhbEJsb2NrU3RhdGVtZW50KFxuICAgIG5vZGU6IEhCUy5QYXJ0aWFsQmxvY2tTdGF0ZW1lbnRcbiAgKTogSEJTLk91dHB1dDwnUGFydGlhbEJsb2NrU3RhdGVtZW50Jz47XG4gIGFic3RyYWN0IENvbnRlbnRTdGF0ZW1lbnQobm9kZTogSEJTLkNvbnRlbnRTdGF0ZW1lbnQpOiBIQlMuT3V0cHV0PCdDb250ZW50U3RhdGVtZW50Jz47XG4gIGFic3RyYWN0IENvbW1lbnRTdGF0ZW1lbnQobm9kZTogSEJTLkNvbW1lbnRTdGF0ZW1lbnQpOiBIQlMuT3V0cHV0PCdDb21tZW50U3RhdGVtZW50Jz47XG4gIGFic3RyYWN0IFN1YkV4cHJlc3Npb24obm9kZTogSEJTLlN1YkV4cHJlc3Npb24pOiBIQlMuT3V0cHV0PCdTdWJFeHByZXNzaW9uJz47XG4gIGFic3RyYWN0IFBhdGhFeHByZXNzaW9uKG5vZGU6IEhCUy5QYXRoRXhwcmVzc2lvbik6IEhCUy5PdXRwdXQ8J1BhdGhFeHByZXNzaW9uJz47XG4gIGFic3RyYWN0IFN0cmluZ0xpdGVyYWwobm9kZTogSEJTLlN0cmluZ0xpdGVyYWwpOiBIQlMuT3V0cHV0PCdTdHJpbmdMaXRlcmFsJz47XG4gIGFic3RyYWN0IEJvb2xlYW5MaXRlcmFsKG5vZGU6IEhCUy5Cb29sZWFuTGl0ZXJhbCk6IEhCUy5PdXRwdXQ8J0Jvb2xlYW5MaXRlcmFsJz47XG4gIGFic3RyYWN0IE51bWJlckxpdGVyYWwobm9kZTogSEJTLk51bWJlckxpdGVyYWwpOiBIQlMuT3V0cHV0PCdOdW1iZXJMaXRlcmFsJz47XG4gIGFic3RyYWN0IFVuZGVmaW5lZExpdGVyYWwobm9kZTogSEJTLlVuZGVmaW5lZExpdGVyYWwpOiBIQlMuT3V0cHV0PCdVbmRlZmluZWRMaXRlcmFsJz47XG4gIGFic3RyYWN0IE51bGxMaXRlcmFsKG5vZGU6IEhCUy5OdWxsTGl0ZXJhbCk6IEhCUy5PdXRwdXQ8J051bGxMaXRlcmFsJz47XG5cbiAgYWJzdHJhY3QgcmVzZXQoKTogdm9pZDtcbiAgYWJzdHJhY3QgZmluaXNoRGF0YSgpOiB2b2lkO1xuICBhYnN0cmFjdCB0YWdPcGVuKCk6IHZvaWQ7XG4gIGFic3RyYWN0IGJlZ2luRGF0YSgpOiB2b2lkO1xuICBhYnN0cmFjdCBhcHBlbmRUb0RhdGEoY2hhcjogc3RyaW5nKTogdm9pZDtcbiAgYWJzdHJhY3QgYmVnaW5TdGFydFRhZygpOiB2b2lkO1xuICBhYnN0cmFjdCBhcHBlbmRUb1RhZ05hbWUoY2hhcjogc3RyaW5nKTogdm9pZDtcbiAgYWJzdHJhY3QgYmVnaW5BdHRyaWJ1dGUoKTogdm9pZDtcbiAgYWJzdHJhY3QgYXBwZW5kVG9BdHRyaWJ1dGVOYW1lKGNoYXI6IHN0cmluZyk6IHZvaWQ7XG4gIGFic3RyYWN0IGJlZ2luQXR0cmlidXRlVmFsdWUocXVvdGVkOiBib29sZWFuKTogdm9pZDtcbiAgYWJzdHJhY3QgYXBwZW5kVG9BdHRyaWJ1dGVWYWx1ZShjaGFyOiBzdHJpbmcpOiB2b2lkO1xuICBhYnN0cmFjdCBmaW5pc2hBdHRyaWJ1dGVWYWx1ZSgpOiB2b2lkO1xuICBhYnN0cmFjdCBtYXJrVGFnQXNTZWxmQ2xvc2luZygpOiB2b2lkO1xuICBhYnN0cmFjdCBiZWdpbkVuZFRhZygpOiB2b2lkO1xuICBhYnN0cmFjdCBmaW5pc2hUYWcoKTogdm9pZDtcbiAgYWJzdHJhY3QgYmVnaW5Db21tZW50KCk6IHZvaWQ7XG4gIGFic3RyYWN0IGFwcGVuZFRvQ29tbWVudERhdGEoY2hhcjogc3RyaW5nKTogdm9pZDtcbiAgYWJzdHJhY3QgZmluaXNoQ29tbWVudCgpOiB2b2lkO1xuICBhYnN0cmFjdCByZXBvcnRTeW50YXhFcnJvcihlcnJvcjogc3RyaW5nKTogdm9pZDtcblxuICBnZXQgY3VycmVudEF0dHIoKTogQXR0cmlidXRlIHtcbiAgICByZXR1cm4gZXhwZWN0KHRoaXMuY3VycmVudEF0dHJpYnV0ZSwgJ2V4cGVjdGVkIGF0dHJpYnV0ZScpO1xuICB9XG5cbiAgZ2V0IGN1cnJlbnRUYWcoKTogVGFnPCdTdGFydFRhZycgfCAnRW5kVGFnJz4ge1xuICAgIGxldCBub2RlID0gdGhpcy5jdXJyZW50Tm9kZTtcbiAgICBhc3NlcnQobm9kZSAmJiAobm9kZS50eXBlID09PSAnU3RhcnRUYWcnIHx8IG5vZGUudHlwZSA9PT0gJ0VuZFRhZycpLCAnZXhwZWN0ZWQgdGFnJyk7XG4gICAgcmV0dXJuIG5vZGUgYXMgVGFnPCdTdGFydFRhZycgfCAnRW5kVGFnJz47XG4gIH1cblxuICBnZXQgY3VycmVudFN0YXJ0VGFnKCk6IFRhZzwnU3RhcnRUYWcnPiB7XG4gICAgbGV0IG5vZGUgPSB0aGlzLmN1cnJlbnROb2RlO1xuICAgIGFzc2VydChub2RlICYmIG5vZGUudHlwZSA9PT0gJ1N0YXJ0VGFnJywgJ2V4cGVjdGVkIHN0YXJ0IHRhZycpO1xuICAgIHJldHVybiBub2RlIGFzIFRhZzwnU3RhcnRUYWcnPjtcbiAgfVxuXG4gIGdldCBjdXJyZW50RW5kVGFnKCk6IFRhZzwnRW5kVGFnJz4ge1xuICAgIGxldCBub2RlID0gdGhpcy5jdXJyZW50Tm9kZTtcbiAgICBhc3NlcnQobm9kZSAmJiBub2RlLnR5cGUgPT09ICdFbmRUYWcnLCAnZXhwZWN0ZWQgZW5kIHRhZycpO1xuICAgIHJldHVybiBub2RlIGFzIFRhZzwnRW5kVGFnJz47XG4gIH1cblxuICBnZXQgY3VycmVudENvbW1lbnQoKTogQVNULkNvbW1lbnRTdGF0ZW1lbnQge1xuICAgIGxldCBub2RlID0gdGhpcy5jdXJyZW50Tm9kZTtcbiAgICBhc3NlcnQobm9kZSAmJiBub2RlLnR5cGUgPT09ICdDb21tZW50U3RhdGVtZW50JywgJ2V4cGVjdGVkIGEgY29tbWVudCcpO1xuICAgIHJldHVybiBub2RlIGFzIEFTVC5Db21tZW50U3RhdGVtZW50O1xuICB9XG5cbiAgZ2V0IGN1cnJlbnREYXRhKCk6IEFTVC5UZXh0Tm9kZSB7XG4gICAgbGV0IG5vZGUgPSB0aGlzLmN1cnJlbnROb2RlO1xuICAgIGFzc2VydChub2RlICYmIG5vZGUudHlwZSA9PT0gJ1RleHROb2RlJywgJ2V4cGVjdGVkIGEgdGV4dCBub2RlJyk7XG4gICAgcmV0dXJuIG5vZGUgYXMgQVNULlRleHROb2RlO1xuICB9XG5cbiAgYWNjZXB0VGVtcGxhdGUobm9kZTogSEJTLlByb2dyYW0pOiBBU1QuVGVtcGxhdGUge1xuICAgIHJldHVybiAodGhpcyBhcyBhbnkpW25vZGUudHlwZV0obm9kZSkgYXMgQVNULlRlbXBsYXRlO1xuICB9XG5cbiAgYWNjZXB0Tm9kZShub2RlOiBIQlMuUHJvZ3JhbSk6IEFTVC5CbG9jayB8IEFTVC5UZW1wbGF0ZTtcbiAgYWNjZXB0Tm9kZTxVIGV4dGVuZHMgSEJTLk5vZGUgfCBBU1QuTm9kZT4obm9kZTogSEJTLk5vZGUpOiBVO1xuICBhY2NlcHROb2RlKG5vZGU6IEhCUy5Ob2RlKTogYW55IHtcbiAgICByZXR1cm4gKHRoaXMgYXMgYW55KVtub2RlLnR5cGVdKG5vZGUpO1xuICB9XG5cbiAgY3VycmVudEVsZW1lbnQoKTogRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFN0YWNrW3RoaXMuZWxlbWVudFN0YWNrLmxlbmd0aCAtIDFdO1xuICB9XG5cbiAgc291cmNlRm9yTm9kZShub2RlOiBIQlMuTm9kZSwgZW5kTm9kZT86IHsgbG9jOiBIQlMuU291cmNlTG9jYXRpb24gfSk6IHN0cmluZyB7XG4gICAgbGV0IGZpcnN0TGluZSA9IG5vZGUubG9jLnN0YXJ0LmxpbmUgLSAxO1xuICAgIGxldCBjdXJyZW50TGluZSA9IGZpcnN0TGluZSAtIDE7XG4gICAgbGV0IGZpcnN0Q29sdW1uID0gbm9kZS5sb2Muc3RhcnQuY29sdW1uO1xuICAgIGxldCBzdHJpbmcgPSBbXTtcbiAgICBsZXQgbGluZTtcblxuICAgIGxldCBsYXN0TGluZTogbnVtYmVyO1xuICAgIGxldCBsYXN0Q29sdW1uOiBudW1iZXI7XG5cbiAgICBpZiAoZW5kTm9kZSkge1xuICAgICAgbGFzdExpbmUgPSBlbmROb2RlLmxvYy5lbmQubGluZSAtIDE7XG4gICAgICBsYXN0Q29sdW1uID0gZW5kTm9kZS5sb2MuZW5kLmNvbHVtbjtcbiAgICB9IGVsc2Uge1xuICAgICAgbGFzdExpbmUgPSBub2RlLmxvYy5lbmQubGluZSAtIDE7XG4gICAgICBsYXN0Q29sdW1uID0gbm9kZS5sb2MuZW5kLmNvbHVtbjtcbiAgICB9XG5cbiAgICB3aGlsZSAoY3VycmVudExpbmUgPCBsYXN0TGluZSkge1xuICAgICAgY3VycmVudExpbmUrKztcbiAgICAgIGxpbmUgPSB0aGlzLnNvdXJjZVtjdXJyZW50TGluZV07XG5cbiAgICAgIGlmIChjdXJyZW50TGluZSA9PT0gZmlyc3RMaW5lKSB7XG4gICAgICAgIGlmIChmaXJzdExpbmUgPT09IGxhc3RMaW5lKSB7XG4gICAgICAgICAgc3RyaW5nLnB1c2gobGluZS5zbGljZShmaXJzdENvbHVtbiwgbGFzdENvbHVtbikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0cmluZy5wdXNoKGxpbmUuc2xpY2UoZmlyc3RDb2x1bW4pKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjdXJyZW50TGluZSA9PT0gbGFzdExpbmUpIHtcbiAgICAgICAgc3RyaW5nLnB1c2gobGluZS5zbGljZSgwLCBsYXN0Q29sdW1uKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHJpbmcucHVzaChsaW5lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3RyaW5nLmpvaW4oJ1xcbicpO1xuICB9XG59XG4iLCJpbXBvcnQgYiBmcm9tICcuLi9idWlsZGVycyc7XG5pbXBvcnQgeyBhcHBlbmRDaGlsZCwgaXNMaXRlcmFsLCBwcmludExpdGVyYWwgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi4vdHlwZXMvbm9kZXMnO1xuaW1wb3J0ICogYXMgSEJTIGZyb20gJy4uL3R5cGVzL2hhbmRsZWJhcnMtYXN0JztcbmltcG9ydCB7IFBhcnNlciwgVGFnLCBBdHRyaWJ1dGUgfSBmcm9tICcuLi9wYXJzZXInO1xuaW1wb3J0IFN5bnRheEVycm9yIGZyb20gJy4uL2Vycm9ycy9zeW50YXgtZXJyb3InO1xuaW1wb3J0IHsgT3B0aW9uIH0gZnJvbSAnQGdsaW1tZXIvdXRpbCc7XG5pbXBvcnQgeyBSZWNhc3QgfSBmcm9tICdAZ2xpbW1lci9pbnRlcmZhY2VzJztcbmltcG9ydCB7IFRva2VuaXplclN0YXRlIH0gZnJvbSAnc2ltcGxlLWh0bWwtdG9rZW5pemVyJztcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEhhbmRsZWJhcnNOb2RlVmlzaXRvcnMgZXh0ZW5kcyBQYXJzZXIge1xuICBhYnN0cmFjdCBhcHBlbmRUb0NvbW1lbnREYXRhKHM6IHN0cmluZyk6IHZvaWQ7XG4gIGFic3RyYWN0IGJlZ2luQXR0cmlidXRlVmFsdWUocXVvdGVkOiBib29sZWFuKTogdm9pZDtcbiAgYWJzdHJhY3QgZmluaXNoQXR0cmlidXRlVmFsdWUoKTogdm9pZDtcblxuICBwcml2YXRlIGdldCBpc1RvcExldmVsKCkge1xuICAgIHJldHVybiB0aGlzLmVsZW1lbnRTdGFjay5sZW5ndGggPT09IDA7XG4gIH1cblxuICBQcm9ncmFtKHByb2dyYW06IEhCUy5Qcm9ncmFtKTogQVNULkJsb2NrO1xuICBQcm9ncmFtKHByb2dyYW06IEhCUy5Qcm9ncmFtKTogQVNULlRlbXBsYXRlO1xuICBQcm9ncmFtKHByb2dyYW06IEhCUy5Qcm9ncmFtKTogQVNULlRlbXBsYXRlIHwgQVNULkJsb2NrO1xuICBQcm9ncmFtKHByb2dyYW06IEhCUy5Qcm9ncmFtKTogQVNULkJsb2NrIHwgQVNULlRlbXBsYXRlIHtcbiAgICBsZXQgYm9keTogQVNULlN0YXRlbWVudFtdID0gW107XG4gICAgbGV0IG5vZGU7XG5cbiAgICBpZiAodGhpcy5pc1RvcExldmVsKSB7XG4gICAgICBub2RlID0gYi50ZW1wbGF0ZShib2R5LCBwcm9ncmFtLmJsb2NrUGFyYW1zLCBwcm9ncmFtLmxvYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUgPSBiLmJsb2NrSXRzZWxmKGJvZHksIHByb2dyYW0uYmxvY2tQYXJhbXMsIHByb2dyYW0uY2hhaW5lZCwgcHJvZ3JhbS5sb2MpO1xuICAgIH1cblxuICAgIGxldCBpLFxuICAgICAgbCA9IHByb2dyYW0uYm9keS5sZW5ndGg7XG5cbiAgICB0aGlzLmVsZW1lbnRTdGFjay5wdXNoKG5vZGUpO1xuXG4gICAgaWYgKGwgPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRTdGFjay5wb3AoKSBhcyBBU1QuQmxvY2sgfCBBU1QuVGVtcGxhdGU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgdGhpcy5hY2NlcHROb2RlKHByb2dyYW0uYm9keVtpXSk7XG4gICAgfVxuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhhdCB0aGUgZWxlbWVudCBzdGFjayBpcyBiYWxhbmNlZCBwcm9wZXJseS5cbiAgICBsZXQgcG9wcGVkTm9kZSA9IHRoaXMuZWxlbWVudFN0YWNrLnBvcCgpO1xuICAgIGlmIChwb3BwZWROb2RlICE9PSBub2RlKSB7XG4gICAgICBsZXQgZWxlbWVudE5vZGUgPSBwb3BwZWROb2RlIGFzIEFTVC5FbGVtZW50Tm9kZTtcblxuICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgICAnVW5jbG9zZWQgZWxlbWVudCBgJyArIGVsZW1lbnROb2RlLnRhZyArICdgIChvbiBsaW5lICcgKyBlbGVtZW50Tm9kZS5sb2MhLnN0YXJ0LmxpbmUgKyAnKS4nLFxuICAgICAgICBlbGVtZW50Tm9kZS5sb2NcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBCbG9ja1N0YXRlbWVudChibG9jazogSEJTLkJsb2NrU3RhdGVtZW50KTogQVNULkJsb2NrU3RhdGVtZW50IHwgdm9pZCB7XG4gICAgaWYgKHRoaXMudG9rZW5pemVyLnN0YXRlID09PSBUb2tlbml6ZXJTdGF0ZS5jb21tZW50KSB7XG4gICAgICB0aGlzLmFwcGVuZFRvQ29tbWVudERhdGEodGhpcy5zb3VyY2VGb3JOb2RlKGJsb2NrKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGhpcy50b2tlbml6ZXIuc3RhdGUgIT09IFRva2VuaXplclN0YXRlLmRhdGEgJiZcbiAgICAgIHRoaXMudG9rZW5pemVyWydzdGF0ZSddICE9PSBUb2tlbml6ZXJTdGF0ZS5iZWZvcmVEYXRhXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgICdBIGJsb2NrIG1heSBvbmx5IGJlIHVzZWQgaW5zaWRlIGFuIEhUTUwgZWxlbWVudCBvciBhbm90aGVyIGJsb2NrLicsXG4gICAgICAgIGJsb2NrLmxvY1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBsZXQgeyBwYXRoLCBwYXJhbXMsIGhhc2ggfSA9IGFjY2VwdENhbGxOb2Rlcyh0aGlzLCBibG9jayk7XG4gICAgbGV0IHByb2dyYW0gPSB0aGlzLlByb2dyYW0oYmxvY2sucHJvZ3JhbSk7XG4gICAgbGV0IGludmVyc2UgPSBibG9jay5pbnZlcnNlID8gdGhpcy5Qcm9ncmFtKGJsb2NrLmludmVyc2UpIDogbnVsbDtcblxuICAgIGxldCBub2RlID0gYi5ibG9jayhcbiAgICAgIHBhdGgsXG4gICAgICBwYXJhbXMsXG4gICAgICBoYXNoLFxuICAgICAgcHJvZ3JhbSxcbiAgICAgIGludmVyc2UsXG4gICAgICBibG9jay5sb2MsXG4gICAgICBibG9jay5vcGVuU3RyaXAsXG4gICAgICBibG9jay5pbnZlcnNlU3RyaXAsXG4gICAgICBibG9jay5jbG9zZVN0cmlwXG4gICAgKTtcblxuICAgIGxldCBwYXJlbnRQcm9ncmFtID0gdGhpcy5jdXJyZW50RWxlbWVudCgpO1xuXG4gICAgYXBwZW5kQ2hpbGQocGFyZW50UHJvZ3JhbSwgbm9kZSk7XG4gIH1cblxuICBNdXN0YWNoZVN0YXRlbWVudChyYXdNdXN0YWNoZTogSEJTLk11c3RhY2hlU3RhdGVtZW50KTogQVNULk11c3RhY2hlU3RhdGVtZW50IHwgdm9pZCB7XG4gICAgbGV0IHsgdG9rZW5pemVyIH0gPSB0aGlzO1xuXG4gICAgaWYgKHRva2VuaXplci5zdGF0ZSA9PT0gJ2NvbW1lbnQnKSB7XG4gICAgICB0aGlzLmFwcGVuZFRvQ29tbWVudERhdGEodGhpcy5zb3VyY2VGb3JOb2RlKHJhd011c3RhY2hlKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IG11c3RhY2hlOiBBU1QuTXVzdGFjaGVTdGF0ZW1lbnQ7XG4gICAgbGV0IHsgZXNjYXBlZCwgbG9jLCBzdHJpcCB9ID0gcmF3TXVzdGFjaGU7XG5cbiAgICBpZiAoaXNMaXRlcmFsKHJhd011c3RhY2hlLnBhdGgpKSB7XG4gICAgICBtdXN0YWNoZSA9IHtcbiAgICAgICAgdHlwZTogJ011c3RhY2hlU3RhdGVtZW50JyxcbiAgICAgICAgcGF0aDogdGhpcy5hY2NlcHROb2RlPEFTVC5MaXRlcmFsPihyYXdNdXN0YWNoZS5wYXRoKSxcbiAgICAgICAgcGFyYW1zOiBbXSxcbiAgICAgICAgaGFzaDogYi5oYXNoKCksXG4gICAgICAgIGVzY2FwZWQsXG4gICAgICAgIGxvYyxcbiAgICAgICAgc3RyaXAsXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgeyBwYXRoLCBwYXJhbXMsIGhhc2ggfSA9IGFjY2VwdENhbGxOb2RlcyhcbiAgICAgICAgdGhpcyxcbiAgICAgICAgcmF3TXVzdGFjaGUgYXMgSEJTLk11c3RhY2hlU3RhdGVtZW50ICYge1xuICAgICAgICAgIHBhdGg6IEhCUy5QYXRoRXhwcmVzc2lvbjtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIG11c3RhY2hlID0gYi5tdXN0YWNoZShwYXRoLCBwYXJhbXMsIGhhc2gsICFlc2NhcGVkLCBsb2MsIHN0cmlwKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHRva2VuaXplci5zdGF0ZSkge1xuICAgICAgLy8gVGFnIGhlbHBlcnNcbiAgICAgIGNhc2UgVG9rZW5pemVyU3RhdGUudGFnT3BlbjpcbiAgICAgIGNhc2UgVG9rZW5pemVyU3RhdGUudGFnTmFtZTpcbiAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgICAgIGBDYW5ub3QgdXNlIG11c3RhY2hlcyBpbiBhbiBlbGVtZW50cyB0YWduYW1lOiBcXGAke3RoaXMuc291cmNlRm9yTm9kZShcbiAgICAgICAgICAgIHJhd011c3RhY2hlLFxuICAgICAgICAgICAgcmF3TXVzdGFjaGUucGF0aFxuICAgICAgICAgICl9XFxgIGF0IEwke2xvYy5zdGFydC5saW5lfTpDJHtsb2Muc3RhcnQuY29sdW1ufWAsXG4gICAgICAgICAgbXVzdGFjaGUubG9jXG4gICAgICAgICk7XG5cbiAgICAgIGNhc2UgVG9rZW5pemVyU3RhdGUuYmVmb3JlQXR0cmlidXRlTmFtZTpcbiAgICAgICAgYWRkRWxlbWVudE1vZGlmaWVyKHRoaXMuY3VycmVudFN0YXJ0VGFnLCBtdXN0YWNoZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlbml6ZXJTdGF0ZS5hdHRyaWJ1dGVOYW1lOlxuICAgICAgY2FzZSBUb2tlbml6ZXJTdGF0ZS5hZnRlckF0dHJpYnV0ZU5hbWU6XG4gICAgICAgIHRoaXMuYmVnaW5BdHRyaWJ1dGVWYWx1ZShmYWxzZSk7XG4gICAgICAgIHRoaXMuZmluaXNoQXR0cmlidXRlVmFsdWUoKTtcbiAgICAgICAgYWRkRWxlbWVudE1vZGlmaWVyKHRoaXMuY3VycmVudFN0YXJ0VGFnLCBtdXN0YWNoZSk7XG4gICAgICAgIHRva2VuaXplci50cmFuc2l0aW9uVG8oVG9rZW5pemVyU3RhdGUuYmVmb3JlQXR0cmlidXRlTmFtZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlbml6ZXJTdGF0ZS5hZnRlckF0dHJpYnV0ZVZhbHVlUXVvdGVkOlxuICAgICAgICBhZGRFbGVtZW50TW9kaWZpZXIodGhpcy5jdXJyZW50U3RhcnRUYWcsIG11c3RhY2hlKTtcbiAgICAgICAgdG9rZW5pemVyLnRyYW5zaXRpb25UbyhUb2tlbml6ZXJTdGF0ZS5iZWZvcmVBdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIC8vIEF0dHJpYnV0ZSB2YWx1ZXNcbiAgICAgIGNhc2UgVG9rZW5pemVyU3RhdGUuYmVmb3JlQXR0cmlidXRlVmFsdWU6XG4gICAgICAgIHRoaXMuYmVnaW5BdHRyaWJ1dGVWYWx1ZShmYWxzZSk7XG4gICAgICAgIGFwcGVuZER5bmFtaWNBdHRyaWJ1dGVWYWx1ZVBhcnQodGhpcy5jdXJyZW50QXR0cmlidXRlISwgbXVzdGFjaGUpO1xuICAgICAgICB0b2tlbml6ZXIudHJhbnNpdGlvblRvKFRva2VuaXplclN0YXRlLmF0dHJpYnV0ZVZhbHVlVW5xdW90ZWQpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5pemVyU3RhdGUuYXR0cmlidXRlVmFsdWVEb3VibGVRdW90ZWQ6XG4gICAgICBjYXNlIFRva2VuaXplclN0YXRlLmF0dHJpYnV0ZVZhbHVlU2luZ2xlUXVvdGVkOlxuICAgICAgY2FzZSBUb2tlbml6ZXJTdGF0ZS5hdHRyaWJ1dGVWYWx1ZVVucXVvdGVkOlxuICAgICAgICBhcHBlbmREeW5hbWljQXR0cmlidXRlVmFsdWVQYXJ0KHRoaXMuY3VycmVudEF0dHJpYnV0ZSEsIG11c3RhY2hlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIC8vIFRPRE86IE9ubHkgYXBwZW5kIGNoaWxkIHdoZW4gdGhlIHRva2VuaXplciBzdGF0ZSBtYWtlc1xuICAgICAgLy8gc2Vuc2UgdG8gZG8gc28sIG90aGVyd2lzZSB0aHJvdyBhbiBlcnJvci5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFwcGVuZENoaWxkKHRoaXMuY3VycmVudEVsZW1lbnQoKSwgbXVzdGFjaGUpO1xuICAgIH1cblxuICAgIHJldHVybiBtdXN0YWNoZTtcbiAgfVxuXG4gIENvbnRlbnRTdGF0ZW1lbnQoY29udGVudDogSEJTLkNvbnRlbnRTdGF0ZW1lbnQpOiB2b2lkIHtcbiAgICB1cGRhdGVUb2tlbml6ZXJMb2NhdGlvbih0aGlzLnRva2VuaXplciwgY29udGVudCk7XG5cbiAgICB0aGlzLnRva2VuaXplci50b2tlbml6ZVBhcnQoY29udGVudC52YWx1ZSk7XG4gICAgdGhpcy50b2tlbml6ZXIuZmx1c2hEYXRhKCk7XG4gIH1cblxuICBDb21tZW50U3RhdGVtZW50KHJhd0NvbW1lbnQ6IEhCUy5Db21tZW50U3RhdGVtZW50KTogT3B0aW9uPEFTVC5NdXN0YWNoZUNvbW1lbnRTdGF0ZW1lbnQ+IHtcbiAgICBsZXQgeyB0b2tlbml6ZXIgfSA9IHRoaXM7XG5cbiAgICBpZiAodG9rZW5pemVyLnN0YXRlID09PSBUb2tlbml6ZXJTdGF0ZS5jb21tZW50KSB7XG4gICAgICB0aGlzLmFwcGVuZFRvQ29tbWVudERhdGEodGhpcy5zb3VyY2VGb3JOb2RlKHJhd0NvbW1lbnQpKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGxldCB7IHZhbHVlLCBsb2MgfSA9IHJhd0NvbW1lbnQ7XG4gICAgbGV0IGNvbW1lbnQgPSBiLm11c3RhY2hlQ29tbWVudCh2YWx1ZSwgbG9jKTtcblxuICAgIHN3aXRjaCAodG9rZW5pemVyLnN0YXRlKSB7XG4gICAgICBjYXNlIFRva2VuaXplclN0YXRlLmJlZm9yZUF0dHJpYnV0ZU5hbWU6XG4gICAgICAgIHRoaXMuY3VycmVudFN0YXJ0VGFnLmNvbW1lbnRzLnB1c2goY29tbWVudCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFRva2VuaXplclN0YXRlLmJlZm9yZURhdGE6XG4gICAgICBjYXNlIFRva2VuaXplclN0YXRlLmRhdGE6XG4gICAgICAgIGFwcGVuZENoaWxkKHRoaXMuY3VycmVudEVsZW1lbnQoKSwgY29tbWVudCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgICAgYFVzaW5nIGEgSGFuZGxlYmFycyBjb21tZW50IHdoZW4gaW4gdGhlIFxcYCR7dG9rZW5pemVyWydzdGF0ZSddfVxcYCBzdGF0ZSBpcyBub3Qgc3VwcG9ydGVkOiBcIiR7Y29tbWVudC52YWx1ZX1cIiBvbiBsaW5lICR7bG9jLnN0YXJ0LmxpbmV9OiR7bG9jLnN0YXJ0LmNvbHVtbn1gLFxuICAgICAgICAgIHJhd0NvbW1lbnQubG9jXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbW1lbnQ7XG4gIH1cblxuICBQYXJ0aWFsU3RhdGVtZW50KHBhcnRpYWw6IEhCUy5QYXJ0aWFsU3RhdGVtZW50KTogbmV2ZXIge1xuICAgIGxldCB7IGxvYyB9ID0gcGFydGlhbDtcblxuICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgIGBIYW5kbGViYXJzIHBhcnRpYWxzIGFyZSBub3Qgc3VwcG9ydGVkOiBcIiR7dGhpcy5zb3VyY2VGb3JOb2RlKHBhcnRpYWwsIHBhcnRpYWwubmFtZSl9XCIgYXQgTCR7XG4gICAgICAgIGxvYy5zdGFydC5saW5lXG4gICAgICB9OkMke2xvYy5zdGFydC5jb2x1bW59YCxcbiAgICAgIHBhcnRpYWwubG9jXG4gICAgKTtcbiAgfVxuXG4gIFBhcnRpYWxCbG9ja1N0YXRlbWVudChwYXJ0aWFsQmxvY2s6IEhCUy5QYXJ0aWFsQmxvY2tTdGF0ZW1lbnQpOiBuZXZlciB7XG4gICAgbGV0IHsgbG9jIH0gPSBwYXJ0aWFsQmxvY2s7XG5cbiAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICBgSGFuZGxlYmFycyBwYXJ0aWFsIGJsb2NrcyBhcmUgbm90IHN1cHBvcnRlZDogXCIke3RoaXMuc291cmNlRm9yTm9kZShcbiAgICAgICAgcGFydGlhbEJsb2NrLFxuICAgICAgICBwYXJ0aWFsQmxvY2submFtZVxuICAgICAgKX1cIiBhdCBMJHtsb2Muc3RhcnQubGluZX06QyR7bG9jLnN0YXJ0LmNvbHVtbn1gLFxuICAgICAgcGFydGlhbEJsb2NrLmxvY1xuICAgICk7XG4gIH1cblxuICBEZWNvcmF0b3IoZGVjb3JhdG9yOiBIQlMuRGVjb3JhdG9yKTogbmV2ZXIge1xuICAgIGxldCB7IGxvYyB9ID0gZGVjb3JhdG9yO1xuXG4gICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgYEhhbmRsZWJhcnMgZGVjb3JhdG9ycyBhcmUgbm90IHN1cHBvcnRlZDogXCIke3RoaXMuc291cmNlRm9yTm9kZShcbiAgICAgICAgZGVjb3JhdG9yLFxuICAgICAgICBkZWNvcmF0b3IucGF0aFxuICAgICAgKX1cIiBhdCBMJHtsb2Muc3RhcnQubGluZX06QyR7bG9jLnN0YXJ0LmNvbHVtbn1gLFxuICAgICAgZGVjb3JhdG9yLmxvY1xuICAgICk7XG4gIH1cblxuICBEZWNvcmF0b3JCbG9jayhkZWNvcmF0b3JCbG9jazogSEJTLkRlY29yYXRvckJsb2NrKTogbmV2ZXIge1xuICAgIGxldCB7IGxvYyB9ID0gZGVjb3JhdG9yQmxvY2s7XG5cbiAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICBgSGFuZGxlYmFycyBkZWNvcmF0b3IgYmxvY2tzIGFyZSBub3Qgc3VwcG9ydGVkOiBcIiR7dGhpcy5zb3VyY2VGb3JOb2RlKFxuICAgICAgICBkZWNvcmF0b3JCbG9jayxcbiAgICAgICAgZGVjb3JhdG9yQmxvY2sucGF0aFxuICAgICAgKX1cIiBhdCBMJHtsb2Muc3RhcnQubGluZX06QyR7bG9jLnN0YXJ0LmNvbHVtbn1gLFxuICAgICAgZGVjb3JhdG9yQmxvY2subG9jXG4gICAgKTtcbiAgfVxuXG4gIFN1YkV4cHJlc3Npb24oc2V4cHI6IEhCUy5TdWJFeHByZXNzaW9uKTogQVNULlN1YkV4cHJlc3Npb24ge1xuICAgIGxldCB7IHBhdGgsIHBhcmFtcywgaGFzaCB9ID0gYWNjZXB0Q2FsbE5vZGVzKHRoaXMsIHNleHByKTtcbiAgICByZXR1cm4gYi5zZXhwcihwYXRoLCBwYXJhbXMsIGhhc2gsIHNleHByLmxvYyk7XG4gIH1cblxuICBQYXRoRXhwcmVzc2lvbihwYXRoOiBIQlMuUGF0aEV4cHJlc3Npb24pOiBBU1QuUGF0aEV4cHJlc3Npb24ge1xuICAgIGxldCB7IG9yaWdpbmFsLCBsb2MgfSA9IHBhdGg7XG4gICAgbGV0IHBhcnRzOiBzdHJpbmdbXTtcblxuICAgIGlmIChvcmlnaW5hbC5pbmRleE9mKCcvJykgIT09IC0xKSB7XG4gICAgICBpZiAob3JpZ2luYWwuc2xpY2UoMCwgMikgPT09ICcuLycpIHtcbiAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgICAgIGBVc2luZyBcIi4vXCIgaXMgbm90IHN1cHBvcnRlZCBpbiBHbGltbWVyIGFuZCB1bm5lY2Vzc2FyeTogXCIke3BhdGgub3JpZ2luYWx9XCIgb24gbGluZSAke2xvYy5zdGFydC5saW5lfS5gLFxuICAgICAgICAgIHBhdGgubG9jXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAob3JpZ2luYWwuc2xpY2UoMCwgMykgPT09ICcuLi8nKSB7XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgICAgICBgQ2hhbmdpbmcgY29udGV4dCB1c2luZyBcIi4uL1wiIGlzIG5vdCBzdXBwb3J0ZWQgaW4gR2xpbW1lcjogXCIke3BhdGgub3JpZ2luYWx9XCIgb24gbGluZSAke2xvYy5zdGFydC5saW5lfS5gLFxuICAgICAgICAgIHBhdGgubG9jXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAob3JpZ2luYWwuaW5kZXhPZignLicpICE9PSAtMSkge1xuICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgICAgYE1peGluZyAnLicgYW5kICcvJyBpbiBwYXRocyBpcyBub3Qgc3VwcG9ydGVkIGluIEdsaW1tZXI7IHVzZSBvbmx5ICcuJyB0byBzZXBhcmF0ZSBwcm9wZXJ0eSBwYXRoczogXCIke3BhdGgub3JpZ2luYWx9XCIgb24gbGluZSAke2xvYy5zdGFydC5saW5lfS5gLFxuICAgICAgICAgIHBhdGgubG9jXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBwYXJ0cyA9IFtwYXRoLnBhcnRzLmpvaW4oJy8nKV07XG4gICAgfSBlbHNlIGlmIChvcmlnaW5hbCA9PT0gJy4nKSB7XG4gICAgICBsZXQgbG9jYXRpb25JbmZvID0gYEwke2xvYy5zdGFydC5saW5lfTpDJHtsb2Muc3RhcnQuY29sdW1ufWA7XG4gICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgIGAnLicgaXMgbm90IGEgc3VwcG9ydGVkIHBhdGggaW4gR2xpbW1lcjsgY2hlY2sgZm9yIGEgcGF0aCB3aXRoIGEgdHJhaWxpbmcgJy4nIGF0ICR7bG9jYXRpb25JbmZvfS5gLFxuICAgICAgICBwYXRoLmxvY1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFydHMgPSBwYXRoLnBhcnRzO1xuICAgIH1cblxuICAgIGxldCB0aGlzSGVhZCA9IGZhbHNlO1xuXG4gICAgLy8gVGhpcyBpcyB0byBmaXggYSBidWcgaW4gdGhlIEhhbmRsZWJhcnMgQVNUIHdoZXJlIHRoZSBwYXRoIGV4cHJlc3Npb25zIGluXG4gICAgLy8gYHt7dGhpcy5mb299fWAgKGFuZCBzaW1pbGFybHkgYHt7Zm9vLWJhciB0aGlzLmZvbyBuYW1lZD10aGlzLmZvb319YCBldGMpXG4gICAgLy8gYXJlIHNpbXBseSB0dXJuZWQgaW50byBge3tmb299fWAuIFRoZSBmaXggaXMgdG8gcHVzaCBpdCBiYWNrIG9udG8gdGhlXG4gICAgLy8gcGFydHMgYXJyYXkgYW5kIGxldCB0aGUgcnVudGltZSBzZWUgdGhlIGRpZmZlcmVuY2UuIEhvd2V2ZXIsIHdlIGNhbm5vdFxuICAgIC8vIHNpbXBseSB1c2UgdGhlIHN0cmluZyBgdGhpc2AgYXMgaXQgbWVhbnMgbGl0ZXJhbGx5IHRoZSBwcm9wZXJ0eSBjYWxsZWRcbiAgICAvLyBcInRoaXNcIiBpbiB0aGUgY3VycmVudCBjb250ZXh0IChpdCBjYW4gYmUgZXhwcmVzc2VkIGluIHRoZSBzeW50YXggYXNcbiAgICAvLyBge3tbdGhpc119fWAsIHdoZXJlIHRoZSBzcXVhcmUgYnJhY2tldCBhcmUgZ2VuZXJhbGx5IGZvciB0aGlzIGtpbmQgb2ZcbiAgICAvLyBlc2NhcGluZyDigJMgc3VjaCBhcyBge3tmb28uW1wiYmFyLmJhelwiXX19YCB3b3VsZCBtZWFuIGxvb2t1cCBhIHByb3BlcnR5XG4gICAgLy8gbmFtZWQgbGl0ZXJhbGx5IFwiYmFyLmJhelwiIG9uIGB0aGlzLmZvb2ApLiBCeSBjb252ZW50aW9uLCB3ZSB1c2UgYG51bGxgXG4gICAgLy8gZm9yIHRoaXMgcHVycG9zZS5cbiAgICBpZiAob3JpZ2luYWwubWF0Y2goL150aGlzKFxcLi4rKT8kLykpIHtcbiAgICAgIHRoaXNIZWFkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ1BhdGhFeHByZXNzaW9uJyxcbiAgICAgIG9yaWdpbmFsOiBwYXRoLm9yaWdpbmFsLFxuICAgICAgdGhpczogdGhpc0hlYWQsXG4gICAgICBwYXJ0cyxcbiAgICAgIGRhdGE6IHBhdGguZGF0YSxcbiAgICAgIGxvYzogcGF0aC5sb2MsXG4gICAgfTtcbiAgfVxuXG4gIEhhc2goaGFzaDogSEJTLkhhc2gpOiBBU1QuSGFzaCB7XG4gICAgbGV0IHBhaXJzOiBBU1QuSGFzaFBhaXJbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBoYXNoLnBhaXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgcGFpciA9IGhhc2gucGFpcnNbaV07XG4gICAgICBwYWlycy5wdXNoKGIucGFpcihwYWlyLmtleSwgdGhpcy5hY2NlcHROb2RlKHBhaXIudmFsdWUpLCBwYWlyLmxvYykpO1xuICAgIH1cblxuICAgIHJldHVybiBiLmhhc2gocGFpcnMsIGhhc2gubG9jKTtcbiAgfVxuXG4gIFN0cmluZ0xpdGVyYWwoc3RyaW5nOiBIQlMuU3RyaW5nTGl0ZXJhbCk6IEFTVC5TdHJpbmdMaXRlcmFsIHtcbiAgICByZXR1cm4gYi5saXRlcmFsKCdTdHJpbmdMaXRlcmFsJywgc3RyaW5nLnZhbHVlLCBzdHJpbmcubG9jKTtcbiAgfVxuXG4gIEJvb2xlYW5MaXRlcmFsKGJvb2xlYW46IEhCUy5Cb29sZWFuTGl0ZXJhbCk6IEFTVC5Cb29sZWFuTGl0ZXJhbCB7XG4gICAgcmV0dXJuIGIubGl0ZXJhbCgnQm9vbGVhbkxpdGVyYWwnLCBib29sZWFuLnZhbHVlLCBib29sZWFuLmxvYyk7XG4gIH1cblxuICBOdW1iZXJMaXRlcmFsKG51bWJlcjogSEJTLk51bWJlckxpdGVyYWwpOiBBU1QuTnVtYmVyTGl0ZXJhbCB7XG4gICAgcmV0dXJuIGIubGl0ZXJhbCgnTnVtYmVyTGl0ZXJhbCcsIG51bWJlci52YWx1ZSwgbnVtYmVyLmxvYyk7XG4gIH1cblxuICBVbmRlZmluZWRMaXRlcmFsKHVuZGVmOiBIQlMuVW5kZWZpbmVkTGl0ZXJhbCk6IEFTVC5VbmRlZmluZWRMaXRlcmFsIHtcbiAgICByZXR1cm4gYi5saXRlcmFsKCdVbmRlZmluZWRMaXRlcmFsJywgdW5kZWZpbmVkLCB1bmRlZi5sb2MpO1xuICB9XG5cbiAgTnVsbExpdGVyYWwobnVsOiBIQlMuTnVsbExpdGVyYWwpOiBBU1QuTnVsbExpdGVyYWwge1xuICAgIHJldHVybiBiLmxpdGVyYWwoJ051bGxMaXRlcmFsJywgbnVsbCwgbnVsLmxvYyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlUmlnaHRTdHJpcHBlZE9mZnNldHMob3JpZ2luYWw6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICBpZiAodmFsdWUgPT09ICcnKSB7XG4gICAgLy8gaWYgaXQgaXMgZW1wdHksIGp1c3QgcmV0dXJuIHRoZSBjb3VudCBvZiBuZXdsaW5lc1xuICAgIC8vIGluIG9yaWdpbmFsXG4gICAgcmV0dXJuIHtcbiAgICAgIGxpbmVzOiBvcmlnaW5hbC5zcGxpdCgnXFxuJykubGVuZ3RoIC0gMSxcbiAgICAgIGNvbHVtbnM6IDAsXG4gICAgfTtcbiAgfVxuXG4gIC8vIG90aGVyd2lzZSwgcmV0dXJuIHRoZSBudW1iZXIgb2YgbmV3bGluZXMgcHJpb3IgdG9cbiAgLy8gYHZhbHVlYFxuICBsZXQgZGlmZmVyZW5jZSA9IG9yaWdpbmFsLnNwbGl0KHZhbHVlKVswXTtcbiAgbGV0IGxpbmVzID0gZGlmZmVyZW5jZS5zcGxpdCgvXFxuLyk7XG4gIGxldCBsaW5lQ291bnQgPSBsaW5lcy5sZW5ndGggLSAxO1xuXG4gIHJldHVybiB7XG4gICAgbGluZXM6IGxpbmVDb3VudCxcbiAgICBjb2x1bW5zOiBsaW5lc1tsaW5lQ291bnRdLmxlbmd0aCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlVG9rZW5pemVyTG9jYXRpb24odG9rZW5pemVyOiBQYXJzZXJbJ3Rva2VuaXplciddLCBjb250ZW50OiBIQlMuQ29udGVudFN0YXRlbWVudCkge1xuICBsZXQgbGluZSA9IGNvbnRlbnQubG9jLnN0YXJ0LmxpbmU7XG4gIGxldCBjb2x1bW4gPSBjb250ZW50LmxvYy5zdGFydC5jb2x1bW47XG5cbiAgbGV0IG9mZnNldHMgPSBjYWxjdWxhdGVSaWdodFN0cmlwcGVkT2Zmc2V0cyhcbiAgICBjb250ZW50Lm9yaWdpbmFsIGFzIFJlY2FzdDxIQlMuU3RyaXBGbGFncywgc3RyaW5nPixcbiAgICBjb250ZW50LnZhbHVlXG4gICk7XG5cbiAgbGluZSA9IGxpbmUgKyBvZmZzZXRzLmxpbmVzO1xuICBpZiAob2Zmc2V0cy5saW5lcykge1xuICAgIGNvbHVtbiA9IG9mZnNldHMuY29sdW1ucztcbiAgfSBlbHNlIHtcbiAgICBjb2x1bW4gPSBjb2x1bW4gKyBvZmZzZXRzLmNvbHVtbnM7XG4gIH1cblxuICB0b2tlbml6ZXIubGluZSA9IGxpbmU7XG4gIHRva2VuaXplci5jb2x1bW4gPSBjb2x1bW47XG59XG5cbmZ1bmN0aW9uIGFjY2VwdENhbGxOb2RlcyhcbiAgY29tcGlsZXI6IEhhbmRsZWJhcnNOb2RlVmlzaXRvcnMsXG4gIG5vZGU6IHtcbiAgICBwYXRoOiBIQlMuUGF0aEV4cHJlc3Npb247XG4gICAgcGFyYW1zOiBIQlMuRXhwcmVzc2lvbltdO1xuICAgIGhhc2g6IEhCUy5IYXNoO1xuICB9XG4pOiB7IHBhdGg6IEFTVC5QYXRoRXhwcmVzc2lvbjsgcGFyYW1zOiBBU1QuRXhwcmVzc2lvbltdOyBoYXNoOiBBU1QuSGFzaCB9IHtcbiAgbGV0IHBhdGggPSBjb21waWxlci5QYXRoRXhwcmVzc2lvbihub2RlLnBhdGgpO1xuXG4gIGxldCBwYXJhbXMgPSBub2RlLnBhcmFtcyA/IG5vZGUucGFyYW1zLm1hcCgoZSkgPT4gY29tcGlsZXIuYWNjZXB0Tm9kZTxBU1QuRXhwcmVzc2lvbj4oZSkpIDogW107XG4gIGxldCBoYXNoID0gbm9kZS5oYXNoID8gY29tcGlsZXIuSGFzaChub2RlLmhhc2gpIDogYi5oYXNoKCk7XG5cbiAgcmV0dXJuIHsgcGF0aCwgcGFyYW1zLCBoYXNoIH07XG59XG5cbmZ1bmN0aW9uIGFkZEVsZW1lbnRNb2RpZmllcihlbGVtZW50OiBUYWc8J1N0YXJ0VGFnJz4sIG11c3RhY2hlOiBBU1QuTXVzdGFjaGVTdGF0ZW1lbnQpIHtcbiAgbGV0IHsgcGF0aCwgcGFyYW1zLCBoYXNoLCBsb2MgfSA9IG11c3RhY2hlO1xuXG4gIGlmIChpc0xpdGVyYWwocGF0aCkpIHtcbiAgICBsZXQgbW9kaWZpZXIgPSBge3ske3ByaW50TGl0ZXJhbChwYXRoKX19fWA7XG4gICAgbGV0IHRhZyA9IGA8JHtlbGVtZW50Lm5hbWV9IC4uLiAke21vZGlmaWVyfSAuLi5gO1xuXG4gICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgYEluICR7dGFnfSwgJHttb2RpZmllcn0gaXMgbm90IGEgdmFsaWQgbW9kaWZpZXI6IFwiJHtwYXRoLm9yaWdpbmFsfVwiIG9uIGxpbmUgJHtcbiAgICAgICAgbG9jICYmIGxvYy5zdGFydC5saW5lXG4gICAgICB9LmAsXG4gICAgICBtdXN0YWNoZS5sb2NcbiAgICApO1xuICB9XG5cbiAgbGV0IG1vZGlmaWVyID0gYi5lbGVtZW50TW9kaWZpZXIocGF0aCwgcGFyYW1zLCBoYXNoLCBsb2MpO1xuICBlbGVtZW50Lm1vZGlmaWVycy5wdXNoKG1vZGlmaWVyKTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kRHluYW1pY0F0dHJpYnV0ZVZhbHVlUGFydChhdHRyaWJ1dGU6IEF0dHJpYnV0ZSwgcGFydDogQVNULk11c3RhY2hlU3RhdGVtZW50KSB7XG4gIGF0dHJpYnV0ZS5pc0R5bmFtaWMgPSB0cnVlO1xuICBhdHRyaWJ1dGUucGFydHMucHVzaChwYXJ0KTtcbn1cbiIsImltcG9ydCB7IHR1cGxlIH0gZnJvbSAnQGdsaW1tZXIvdXRpbCc7XG5pbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi4vdHlwZXMvbm9kZXMnO1xuXG4vLyBlbnN1cmUgc3RheXMgaW4gc3luYyB3aXRoIHR5cGluZ1xuLy8gUGFyZW50Tm9kZSBhbmQgQ2hpbGRLZXkgdHlwZXMgYXJlIGRlcml2ZWQgZnJvbSBWaXNpdG9yS2V5c01hcFxuY29uc3QgdmlzaXRvcktleXMgPSB7XG4gIFByb2dyYW06IHR1cGxlKCdib2R5JyksXG4gIFRlbXBsYXRlOiB0dXBsZSgnYm9keScpLFxuICBCbG9jazogdHVwbGUoJ2JvZHknKSxcblxuICBNdXN0YWNoZVN0YXRlbWVudDogdHVwbGUoJ3BhdGgnLCAncGFyYW1zJywgJ2hhc2gnKSxcbiAgQmxvY2tTdGF0ZW1lbnQ6IHR1cGxlKCdwYXRoJywgJ3BhcmFtcycsICdoYXNoJywgJ3Byb2dyYW0nLCAnaW52ZXJzZScpLFxuICBFbGVtZW50TW9kaWZpZXJTdGF0ZW1lbnQ6IHR1cGxlKCdwYXRoJywgJ3BhcmFtcycsICdoYXNoJyksXG4gIFBhcnRpYWxTdGF0ZW1lbnQ6IHR1cGxlKCduYW1lJywgJ3BhcmFtcycsICdoYXNoJyksXG4gIENvbW1lbnRTdGF0ZW1lbnQ6IHR1cGxlKCksXG4gIE11c3RhY2hlQ29tbWVudFN0YXRlbWVudDogdHVwbGUoKSxcbiAgRWxlbWVudE5vZGU6IHR1cGxlKCdhdHRyaWJ1dGVzJywgJ21vZGlmaWVycycsICdjaGlsZHJlbicsICdjb21tZW50cycpLFxuICBBdHRyTm9kZTogdHVwbGUoJ3ZhbHVlJyksXG4gIFRleHROb2RlOiB0dXBsZSgpLFxuXG4gIENvbmNhdFN0YXRlbWVudDogdHVwbGUoJ3BhcnRzJyksXG4gIFN1YkV4cHJlc3Npb246IHR1cGxlKCdwYXRoJywgJ3BhcmFtcycsICdoYXNoJyksXG4gIFBhdGhFeHByZXNzaW9uOiB0dXBsZSgpLFxuXG4gIFN0cmluZ0xpdGVyYWw6IHR1cGxlKCksXG4gIEJvb2xlYW5MaXRlcmFsOiB0dXBsZSgpLFxuICBOdW1iZXJMaXRlcmFsOiB0dXBsZSgpLFxuICBOdWxsTGl0ZXJhbDogdHVwbGUoKSxcbiAgVW5kZWZpbmVkTGl0ZXJhbDogdHVwbGUoKSxcblxuICBIYXNoOiB0dXBsZSgncGFpcnMnKSxcbiAgSGFzaFBhaXI6IHR1cGxlKCd2YWx1ZScpLFxufTtcblxudHlwZSBWaXNpdG9yS2V5c01hcCA9IHR5cGVvZiB2aXNpdG9yS2V5cztcblxuZXhwb3J0IHR5cGUgVmlzaXRvcktleXMgPSB7IFtQIGluIGtleW9mIFZpc2l0b3JLZXlzTWFwXTogVmlzaXRvcktleXNNYXBbUF1bbnVtYmVyXSB9O1xuZXhwb3J0IHR5cGUgVmlzaXRvcktleTxOIGV4dGVuZHMgQVNULk5vZGU+ID0gVmlzaXRvcktleXNbTlsndHlwZSddXSAmIGtleW9mIE47XG5cbmV4cG9ydCBkZWZhdWx0IHZpc2l0b3JLZXlzO1xuIiwiaW1wb3J0ICogYXMgQVNUIGZyb20gJy4uL3R5cGVzL25vZGVzJztcbmltcG9ydCB7IE9wdGlvbiB9IGZyb20gJ0BnbGltbWVyL2ludGVyZmFjZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRyYXZlcnNhbEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcjogVHJhdmVyc2FsRXJyb3JDb25zdHJ1Y3RvcjtcbiAga2V5OiBzdHJpbmc7XG4gIG5vZGU6IEFTVC5Ob2RlO1xuICBwYXJlbnQ6IE9wdGlvbjxBU1QuTm9kZT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJhdmVyc2FsRXJyb3JDb25zdHJ1Y3RvciB7XG4gIG5ldyAobWVzc2FnZTogc3RyaW5nLCBub2RlOiBBU1QuTm9kZSwgcGFyZW50OiBPcHRpb248QVNULk5vZGU+LCBrZXk6IHN0cmluZyk6IFRyYXZlcnNhbEVycm9yO1xuICByZWFkb25seSBwcm90b3R5cGU6IFRyYXZlcnNhbEVycm9yO1xufVxuXG5jb25zdCBUcmF2ZXJzYWxFcnJvcjogVHJhdmVyc2FsRXJyb3JDb25zdHJ1Y3RvciA9IChmdW5jdGlvbiAoKSB7XG4gIFRyYXZlcnNhbEVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlKTtcbiAgVHJhdmVyc2FsRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHJhdmVyc2FsRXJyb3I7XG5cbiAgZnVuY3Rpb24gVHJhdmVyc2FsRXJyb3IoXG4gICAgdGhpczogVHJhdmVyc2FsRXJyb3IsXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIG5vZGU6IEFTVC5Ob2RlLFxuICAgIHBhcmVudDogT3B0aW9uPEFTVC5Ob2RlPixcbiAgICBrZXk6IHN0cmluZ1xuICApIHtcbiAgICBsZXQgZXJyb3IgPSBFcnJvci5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuXG4gICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuc3RhY2sgPSBlcnJvci5zdGFjaztcbiAgfVxuXG4gIHJldHVybiBUcmF2ZXJzYWxFcnJvciBhcyBhbnk7XG59KSgpO1xuXG5leHBvcnQgZGVmYXVsdCBUcmF2ZXJzYWxFcnJvcjtcblxuZXhwb3J0IGZ1bmN0aW9uIGNhbm5vdFJlbW92ZU5vZGUobm9kZTogQVNULk5vZGUsIHBhcmVudDogQVNULk5vZGUsIGtleTogc3RyaW5nKSB7XG4gIHJldHVybiBuZXcgVHJhdmVyc2FsRXJyb3IoXG4gICAgJ0Nhbm5vdCByZW1vdmUgYSBub2RlIHVubGVzcyBpdCBpcyBwYXJ0IG9mIGFuIGFycmF5JyxcbiAgICBub2RlLFxuICAgIHBhcmVudCxcbiAgICBrZXlcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbm5vdFJlcGxhY2VOb2RlKG5vZGU6IEFTVC5Ob2RlLCBwYXJlbnQ6IEFTVC5Ob2RlLCBrZXk6IHN0cmluZykge1xuICByZXR1cm4gbmV3IFRyYXZlcnNhbEVycm9yKFxuICAgICdDYW5ub3QgcmVwbGFjZSBhIG5vZGUgd2l0aCBtdWx0aXBsZSBub2RlcyB1bmxlc3MgaXQgaXMgcGFydCBvZiBhbiBhcnJheScsXG4gICAgbm9kZSxcbiAgICBwYXJlbnQsXG4gICAga2V5XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5ub3RSZXBsYWNlT3JSZW1vdmVJbktleUhhbmRsZXJZZXQobm9kZTogQVNULk5vZGUsIGtleTogc3RyaW5nKSB7XG4gIHJldHVybiBuZXcgVHJhdmVyc2FsRXJyb3IoXG4gICAgJ1JlcGxhY2luZyBhbmQgcmVtb3ZpbmcgaW4ga2V5IGhhbmRsZXJzIGlzIG5vdCB5ZXQgc3VwcG9ydGVkLicsXG4gICAgbm9kZSxcbiAgICBudWxsLFxuICAgIGtleVxuICApO1xufVxuIiwiaW1wb3J0IHsgTm9kZSB9IGZyb20gJy4uL3R5cGVzL25vZGVzJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGF0aDxOIGV4dGVuZHMgTm9kZT4ge1xuICBub2RlOiBOO1xuICBwYXJlbnQ6IFBhdGg8Tm9kZT4gfCBudWxsO1xuICBwYXJlbnRLZXk6IHN0cmluZyB8IG51bGw7XG5cbiAgY29uc3RydWN0b3Iobm9kZTogTiwgcGFyZW50OiBQYXRoPE5vZGU+IHwgbnVsbCA9IG51bGwsIHBhcmVudEtleTogc3RyaW5nIHwgbnVsbCA9IG51bGwpIHtcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMucGFyZW50S2V5ID0gcGFyZW50S2V5O1xuICB9XG5cbiAgZ2V0IHBhcmVudE5vZGUoKTogTm9kZSB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnBhcmVudCA/IHRoaXMucGFyZW50Lm5vZGUgOiBudWxsO1xuICB9XG5cbiAgcGFyZW50cygpOiBJdGVyYWJsZTxQYXRoPE5vZGU+IHwgbnVsbD4ge1xuICAgIHJldHVybiB7XG4gICAgICBbU3ltYm9sLml0ZXJhdG9yXTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gbmV3IFBhdGhQYXJlbnRzSXRlcmF0b3IodGhpcyk7XG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cblxuY2xhc3MgUGF0aFBhcmVudHNJdGVyYXRvciBpbXBsZW1lbnRzIEl0ZXJhdG9yPFBhdGg8Tm9kZT4gfCBudWxsPiB7XG4gIHBhdGg6IFBhdGg8Tm9kZT47XG5cbiAgY29uc3RydWN0b3IocGF0aDogUGF0aDxOb2RlPikge1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gIH1cblxuICBuZXh0KCkge1xuICAgIGlmICh0aGlzLnBhdGgucGFyZW50KSB7XG4gICAgICB0aGlzLnBhdGggPSB0aGlzLnBhdGgucGFyZW50O1xuICAgICAgcmV0dXJuIHsgZG9uZTogZmFsc2UsIHZhbHVlOiB0aGlzLnBhdGggfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHsgZG9uZTogdHJ1ZSwgdmFsdWU6IG51bGwgfTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB2aXNpdG9yS2V5cywgeyBWaXNpdG9yS2V5cywgVmlzaXRvcktleSB9IGZyb20gJy4uL3R5cGVzL3Zpc2l0b3Ita2V5cyc7XG5pbXBvcnQge1xuICBjYW5ub3RSZW1vdmVOb2RlLFxuICBjYW5ub3RSZXBsYWNlTm9kZSxcbiAgY2Fubm90UmVwbGFjZU9yUmVtb3ZlSW5LZXlIYW5kbGVyWWV0LFxufSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi4vdHlwZXMvbm9kZXMnO1xuaW1wb3J0IHsgZGVwcmVjYXRlIH0gZnJvbSAnQGdsaW1tZXIvdXRpbCc7XG5pbXBvcnQgeyBMT0NBTF9ERUJVRyB9IGZyb20gJ0BnbGltbWVyL2xvY2FsLWRlYnVnLWZsYWdzJztcbmltcG9ydCB7IE5vZGVIYW5kbGVyLCBOb2RlVmlzaXRvciwgS2V5SGFuZGxlciwgTm9kZVRyYXZlcnNhbCwgS2V5VHJhdmVyc2FsIH0gZnJvbSAnLi92aXNpdG9yJztcbmltcG9ydCBQYXRoIGZyb20gJy4vcGF0aCc7XG5cbmZ1bmN0aW9uIGdldEVudGVyRnVuY3Rpb248TiBleHRlbmRzIEFTVC5Ob2RlPihcbiAgaGFuZGxlcjogTm9kZVRyYXZlcnNhbDxOPlxuKTogTm9kZUhhbmRsZXI8Tj4gfCB1bmRlZmluZWQ7XG5mdW5jdGlvbiBnZXRFbnRlckZ1bmN0aW9uPE4gZXh0ZW5kcyBBU1QuTm9kZSwgSyBleHRlbmRzIFZpc2l0b3JLZXk8Tj4+KFxuICBoYW5kbGVyOiBLZXlUcmF2ZXJzYWw8TiwgSz5cbik6IEtleUhhbmRsZXI8TiwgSz4gfCB1bmRlZmluZWQ7XG5mdW5jdGlvbiBnZXRFbnRlckZ1bmN0aW9uPE4gZXh0ZW5kcyBBU1QuTm9kZSwgSyBleHRlbmRzIFZpc2l0b3JLZXk8Tj4+KFxuICBoYW5kbGVyOiBOb2RlVHJhdmVyc2FsPE4+IHwgS2V5VHJhdmVyc2FsPE4sIEs+XG4pOiBOb2RlSGFuZGxlcjxOPiB8IEtleUhhbmRsZXI8TiwgSz4gfCB1bmRlZmluZWQge1xuICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gaGFuZGxlcjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gaGFuZGxlci5lbnRlciBhcyBOb2RlSGFuZGxlcjxOPiB8IEtleUhhbmRsZXI8TiwgSz47XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0RXhpdEZ1bmN0aW9uPE4gZXh0ZW5kcyBBU1QuTm9kZT4oaGFuZGxlcjogTm9kZVRyYXZlcnNhbDxOPik6IE5vZGVIYW5kbGVyPE4+IHwgdW5kZWZpbmVkO1xuZnVuY3Rpb24gZ2V0RXhpdEZ1bmN0aW9uPE4gZXh0ZW5kcyBBU1QuTm9kZSwgSyBleHRlbmRzIFZpc2l0b3JLZXk8Tj4+KFxuICBoYW5kbGVyOiBLZXlUcmF2ZXJzYWw8TiwgSz5cbik6IEtleUhhbmRsZXI8TiwgSz4gfCB1bmRlZmluZWQ7XG5mdW5jdGlvbiBnZXRFeGl0RnVuY3Rpb248TiBleHRlbmRzIEFTVC5Ob2RlLCBLIGV4dGVuZHMgVmlzaXRvcktleTxOPj4oXG4gIGhhbmRsZXI6IE5vZGVUcmF2ZXJzYWw8Tj4gfCBLZXlUcmF2ZXJzYWw8TiwgSz5cbik6IE5vZGVIYW5kbGVyPE4+IHwgS2V5SGFuZGxlcjxOLCBLPiB8IHVuZGVmaW5lZCB7XG4gIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGhhbmRsZXIuZXhpdCBhcyBOb2RlSGFuZGxlcjxOPiB8IEtleUhhbmRsZXI8TiwgSz47XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0S2V5SGFuZGxlcjxOIGV4dGVuZHMgQVNULk5vZGUsIEsgZXh0ZW5kcyBWaXNpdG9yS2V5PE4+PihcbiAgaGFuZGxlcjogTm9kZVRyYXZlcnNhbDxOPixcbiAga2V5OiBLXG4pOiBLZXlUcmF2ZXJzYWw8TiwgSz4gfCBLZXlUcmF2ZXJzYWw8TiwgVmlzaXRvcktleTxOPj4gfCB1bmRlZmluZWQge1xuICBsZXQga2V5VmlzaXRvciA9IHR5cGVvZiBoYW5kbGVyICE9PSAnZnVuY3Rpb24nID8gaGFuZGxlci5rZXlzIDogdW5kZWZpbmVkO1xuICBpZiAoa2V5VmlzaXRvciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG5cbiAgbGV0IGtleUhhbmRsZXIgPSBrZXlWaXNpdG9yW2tleV07XG4gIGlmIChrZXlIYW5kbGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4ga2V5SGFuZGxlciBhcyBLZXlUcmF2ZXJzYWw8TiwgSz47XG4gIH1cbiAgcmV0dXJuIGtleVZpc2l0b3IuQWxsO1xufVxuXG5mdW5jdGlvbiBnZXROb2RlSGFuZGxlcjxOIGV4dGVuZHMgQVNULk5vZGU+KFxuICB2aXNpdG9yOiBOb2RlVmlzaXRvcixcbiAgbm9kZVR5cGU6IE5bJ3R5cGUnXVxuKTogTm9kZVRyYXZlcnNhbDxOPjtcbmZ1bmN0aW9uIGdldE5vZGVIYW5kbGVyKHZpc2l0b3I6IE5vZGVWaXNpdG9yLCBub2RlVHlwZTogJ0FsbCcpOiBOb2RlVHJhdmVyc2FsPEFTVC5Ob2RlPjtcbmZ1bmN0aW9uIGdldE5vZGVIYW5kbGVyPE4gZXh0ZW5kcyBBU1QuTm9kZT4oXG4gIHZpc2l0b3I6IE5vZGVWaXNpdG9yLFxuICBub2RlVHlwZTogTlsndHlwZSddXG4pOiBOb2RlVHJhdmVyc2FsPE4+IHwgTm9kZVRyYXZlcnNhbDxBU1QuTm9kZT4gfCB1bmRlZmluZWQge1xuICBpZiAobm9kZVR5cGUgPT09ICdUZW1wbGF0ZScgfHwgbm9kZVR5cGUgPT09ICdCbG9jaycpIHtcbiAgICBpZiAodmlzaXRvci5Qcm9ncmFtKSB7XG4gICAgICBpZiAoTE9DQUxfREVCVUcpIHtcbiAgICAgICAgZGVwcmVjYXRlKGBUT0RPYCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB2aXNpdG9yLlByb2dyYW0gYXMgYW55O1xuICAgIH1cbiAgfVxuXG4gIGxldCBoYW5kbGVyID0gdmlzaXRvcltub2RlVHlwZV07XG4gIGlmIChoYW5kbGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gKGhhbmRsZXIgYXMgdW5rbm93bikgYXMgTm9kZVRyYXZlcnNhbDxOPjtcbiAgfVxuICByZXR1cm4gdmlzaXRvci5BbGw7XG59XG5cbmZ1bmN0aW9uIHZpc2l0Tm9kZTxOIGV4dGVuZHMgQVNULk5vZGU+KFxuICB2aXNpdG9yOiBOb2RlVmlzaXRvcixcbiAgcGF0aDogUGF0aDxOPlxuKTogQVNULk5vZGUgfCBBU1QuTm9kZVtdIHwgdW5kZWZpbmVkIHwgbnVsbCB8IHZvaWQge1xuICBsZXQgeyBub2RlLCBwYXJlbnQsIHBhcmVudEtleSB9ID0gcGF0aDtcblxuICBsZXQgaGFuZGxlcjogTm9kZVRyYXZlcnNhbDxOPiA9IGdldE5vZGVIYW5kbGVyKHZpc2l0b3IsIG5vZGUudHlwZSk7XG4gIGxldCBlbnRlcjtcbiAgbGV0IGV4aXQ7XG5cbiAgaWYgKGhhbmRsZXIgIT09IHVuZGVmaW5lZCkge1xuICAgIGVudGVyID0gZ2V0RW50ZXJGdW5jdGlvbihoYW5kbGVyKTtcbiAgICBleGl0ID0gZ2V0RXhpdEZ1bmN0aW9uKGhhbmRsZXIpO1xuICB9XG5cbiAgbGV0IHJlc3VsdDogQVNULk5vZGUgfCBBU1QuTm9kZVtdIHwgdW5kZWZpbmVkIHwgbnVsbCB8IHZvaWQ7XG4gIGlmIChlbnRlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmVzdWx0ID0gZW50ZXIobm9kZSwgcGF0aCk7XG4gIH1cblxuICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQgJiYgcmVzdWx0ICE9PSBudWxsKSB7XG4gICAgaWYgKEpTT04uc3RyaW5naWZ5KG5vZGUpID09PSBKU09OLnN0cmluZ2lmeShyZXN1bHQpKSB7XG4gICAgICByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdCkpIHtcbiAgICAgIHZpc2l0QXJyYXkodmlzaXRvciwgcmVzdWx0LCBwYXJlbnQsIHBhcmVudEtleSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcGF0aCA9IG5ldyBQYXRoKHJlc3VsdCwgcGFyZW50LCBwYXJlbnRLZXkpO1xuICAgICAgcmV0dXJuIHZpc2l0Tm9kZSh2aXNpdG9yLCBwYXRoKSB8fCByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGV0IGtleXMgPSB2aXNpdG9yS2V5c1tub2RlLnR5cGVdO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQga2V5ID0ga2V5c1tpXSBhcyBWaXNpdG9yS2V5c1tOWyd0eXBlJ11dICYga2V5b2YgTjtcbiAgICAgIC8vIHdlIGtub3cgaWYgaXQgaGFzIGNoaWxkIGtleXMgd2UgY2FuIHdpZGVuIHRvIGEgUGFyZW50Tm9kZVxuICAgICAgdmlzaXRLZXkodmlzaXRvciwgaGFuZGxlciwgcGF0aCwga2V5KTtcbiAgICB9XG5cbiAgICBpZiAoZXhpdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXN1bHQgPSBleGl0KG5vZGUsIHBhdGgpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGdldDxOIGV4dGVuZHMgQVNULk5vZGU+KFxuICBub2RlOiBOLFxuICBrZXk6IFZpc2l0b3JLZXlzW05bJ3R5cGUnXV0gJiBrZXlvZiBOXG4pOiBBU1QuTm9kZSB8IEFTVC5Ob2RlW10ge1xuICByZXR1cm4gKG5vZGVba2V5XSBhcyB1bmtub3duKSBhcyBBU1QuTm9kZSB8IEFTVC5Ob2RlW107XG59XG5cbmZ1bmN0aW9uIHNldDxOIGV4dGVuZHMgQVNULk5vZGUsIEsgZXh0ZW5kcyBrZXlvZiBOPihub2RlOiBOLCBrZXk6IEssIHZhbHVlOiBOW0tdKTogdm9pZCB7XG4gIG5vZGVba2V5XSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiB2aXNpdEtleTxOIGV4dGVuZHMgQVNULk5vZGU+KFxuICB2aXNpdG9yOiBOb2RlVmlzaXRvcixcbiAgaGFuZGxlcjogTm9kZVRyYXZlcnNhbDxOPixcbiAgcGF0aDogUGF0aDxOPixcbiAga2V5OiBWaXNpdG9yS2V5c1tOWyd0eXBlJ11dICYga2V5b2YgTlxuKSB7XG4gIGxldCB7IG5vZGUgfSA9IHBhdGg7XG5cbiAgbGV0IHZhbHVlID0gZ2V0KG5vZGUsIGtleSk7XG4gIGlmICghdmFsdWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBsZXQga2V5RW50ZXI7XG4gIGxldCBrZXlFeGl0O1xuXG4gIGlmIChoYW5kbGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICBsZXQga2V5SGFuZGxlciA9IGdldEtleUhhbmRsZXIoaGFuZGxlciwga2V5KTtcbiAgICBpZiAoa2V5SGFuZGxlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBrZXlFbnRlciA9IGdldEVudGVyRnVuY3Rpb24oa2V5SGFuZGxlcik7XG4gICAgICBrZXlFeGl0ID0gZ2V0RXhpdEZ1bmN0aW9uKGtleUhhbmRsZXIpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChrZXlFbnRlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKGtleUVudGVyKG5vZGUsIGtleSkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgY2Fubm90UmVwbGFjZU9yUmVtb3ZlSW5LZXlIYW5kbGVyWWV0KG5vZGUsIGtleSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgdmlzaXRBcnJheSh2aXNpdG9yLCB2YWx1ZSwgcGF0aCwga2V5KTtcbiAgfSBlbHNlIHtcbiAgICBsZXQga2V5UGF0aCA9IG5ldyBQYXRoKHZhbHVlLCBwYXRoLCBrZXkpO1xuICAgIGxldCByZXN1bHQgPSB2aXNpdE5vZGUodmlzaXRvciwga2V5UGF0aCk7XG4gICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBUT0RPOiBkeW5hbWljYWxseSBjaGVjayB0aGUgcmVzdWx0cyBieSBoYXZpbmcgYSB0YWJsZSBvZlxuICAgICAgLy8gZXhwZWN0ZWQgbm9kZSB0eXBlcyBpbiB2YWx1ZSBzcGFjZSwgbm90IGp1c3QgdHlwZSBzcGFjZVxuICAgICAgYXNzaWduS2V5KG5vZGUsIGtleSwgdmFsdWUsIHJlc3VsdCBhcyBhbnkpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChrZXlFeGl0ICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoa2V5RXhpdChub2RlLCBrZXkpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IGNhbm5vdFJlcGxhY2VPclJlbW92ZUluS2V5SGFuZGxlcllldChub2RlLCBrZXkpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB2aXNpdEFycmF5KFxuICB2aXNpdG9yOiBOb2RlVmlzaXRvcixcbiAgYXJyYXk6IEFTVC5Ob2RlW10sXG4gIHBhcmVudDogUGF0aDxBU1QuTm9kZT4gfCBudWxsLFxuICBwYXJlbnRLZXk6IHN0cmluZyB8IG51bGxcbikge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IG5vZGUgPSBhcnJheVtpXTtcbiAgICBsZXQgcGF0aCA9IG5ldyBQYXRoKG5vZGUsIHBhcmVudCwgcGFyZW50S2V5KTtcbiAgICBsZXQgcmVzdWx0ID0gdmlzaXROb2RlKHZpc2l0b3IsIHBhdGgpO1xuICAgIGlmIChyZXN1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaSArPSBzcGxpY2VBcnJheShhcnJheSwgaSwgcmVzdWx0KSAtIDE7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGFzc2lnbktleTxOIGV4dGVuZHMgQVNULk5vZGUsIEsgZXh0ZW5kcyBWaXNpdG9yS2V5PE4+PihcbiAgbm9kZTogTixcbiAga2V5OiBLLFxuICB2YWx1ZTogQVNULk5vZGUsXG4gIHJlc3VsdDogTltLXSB8IFtOW0tdXSB8IG51bGxcbikge1xuICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgdGhyb3cgY2Fubm90UmVtb3ZlTm9kZSh2YWx1ZSwgbm9kZSwga2V5KTtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJlc3VsdCkpIHtcbiAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgc2V0KG5vZGUsIGtleSwgcmVzdWx0WzBdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHJlc3VsdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgY2Fubm90UmVtb3ZlTm9kZSh2YWx1ZSwgbm9kZSwga2V5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGNhbm5vdFJlcGxhY2VOb2RlKHZhbHVlLCBub2RlLCBrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBzZXQobm9kZSwga2V5LCByZXN1bHQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNwbGljZUFycmF5KGFycmF5OiBBU1QuTm9kZVtdLCBpbmRleDogbnVtYmVyLCByZXN1bHQ6IEFTVC5Ob2RlIHwgQVNULk5vZGVbXSB8IG51bGwpIHtcbiAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xuICAgIGFycmF5LnNwbGljZShpbmRleCwgMSk7XG4gICAgcmV0dXJuIDA7XG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHQpKSB7XG4gICAgYXJyYXkuc3BsaWNlKGluZGV4LCAxLCAuLi5yZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQubGVuZ3RoO1xuICB9IGVsc2Uge1xuICAgIGFycmF5LnNwbGljZShpbmRleCwgMSwgcmVzdWx0KTtcbiAgICByZXR1cm4gMTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiB0cmF2ZXJzZShub2RlOiBBU1QuTm9kZSwgdmlzaXRvcjogTm9kZVZpc2l0b3IpIHtcbiAgbGV0IHBhdGggPSBuZXcgUGF0aChub2RlKTtcbiAgdmlzaXROb2RlKHZpc2l0b3IsIHBhdGgpO1xufVxuIiwiY29uc3QgZW51bSBDaGFyIHtcbiAgTkJTUCA9IDB4YTAsXG4gIFFVT1QgPSAweDIyLFxuICBMVCA9IDB4M2MsXG4gIEdUID0gMHgzZSxcbiAgQU1QID0gMHgyNixcbn1cblxuY29uc3QgQVRUUl9WQUxVRV9SRUdFWF9URVNUID0gL1tcXHhBMFwiJl0vO1xuY29uc3QgQVRUUl9WQUxVRV9SRUdFWF9SRVBMQUNFID0gbmV3IFJlZ0V4cChBVFRSX1ZBTFVFX1JFR0VYX1RFU1Quc291cmNlLCAnZycpO1xuXG5jb25zdCBURVhUX1JFR0VYX1RFU1QgPSAvW1xceEEwJjw+XS87XG5jb25zdCBURVhUX1JFR0VYX1JFUExBQ0UgPSBuZXcgUmVnRXhwKFRFWFRfUkVHRVhfVEVTVC5zb3VyY2UsICdnJyk7XG5cbmZ1bmN0aW9uIGF0dHJWYWx1ZVJlcGxhY2VyKGNoYXI6IHN0cmluZykge1xuICBzd2l0Y2ggKGNoYXIuY2hhckNvZGVBdCgwKSkge1xuICAgIGNhc2UgQ2hhci5OQlNQOlxuICAgICAgcmV0dXJuICcmbmJzcDsnO1xuICAgIGNhc2UgQ2hhci5RVU9UOlxuICAgICAgcmV0dXJuICcmcXVvdDsnO1xuICAgIGNhc2UgQ2hhci5BTVA6XG4gICAgICByZXR1cm4gJyZhbXA7JztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGNoYXI7XG4gIH1cbn1cblxuZnVuY3Rpb24gdGV4dFJlcGxhY2VyKGNoYXI6IHN0cmluZykge1xuICBzd2l0Y2ggKGNoYXIuY2hhckNvZGVBdCgwKSkge1xuICAgIGNhc2UgQ2hhci5OQlNQOlxuICAgICAgcmV0dXJuICcmbmJzcDsnO1xuICAgIGNhc2UgQ2hhci5BTVA6XG4gICAgICByZXR1cm4gJyZhbXA7JztcbiAgICBjYXNlIENoYXIuTFQ6XG4gICAgICByZXR1cm4gJyZsdDsnO1xuICAgIGNhc2UgQ2hhci5HVDpcbiAgICAgIHJldHVybiAnJmd0Oyc7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBjaGFyO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVBdHRyVmFsdWUoYXR0clZhbHVlOiBzdHJpbmcpIHtcbiAgaWYgKEFUVFJfVkFMVUVfUkVHRVhfVEVTVC50ZXN0KGF0dHJWYWx1ZSkpIHtcbiAgICByZXR1cm4gYXR0clZhbHVlLnJlcGxhY2UoQVRUUl9WQUxVRV9SRUdFWF9SRVBMQUNFLCBhdHRyVmFsdWVSZXBsYWNlcik7XG4gIH1cbiAgcmV0dXJuIGF0dHJWYWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZVRleHQodGV4dDogc3RyaW5nKSB7XG4gIGlmIChURVhUX1JFR0VYX1RFU1QudGVzdCh0ZXh0KSkge1xuICAgIHJldHVybiB0ZXh0LnJlcGxhY2UoVEVYVF9SRUdFWF9SRVBMQUNFLCB0ZXh0UmVwbGFjZXIpO1xuICB9XG4gIHJldHVybiB0ZXh0O1xufVxuIiwiaW1wb3J0IHtcbiAgQXR0ck5vZGUsXG4gIEJsb2NrLFxuICBCbG9ja1N0YXRlbWVudCxcbiAgRWxlbWVudE5vZGUsXG4gIE11c3RhY2hlU3RhdGVtZW50LFxuICBOb2RlLFxuICBQcm9ncmFtLFxuICBUZXh0Tm9kZSxcbiAgUGFydGlhbFN0YXRlbWVudCxcbiAgQ29uY2F0U3RhdGVtZW50LFxuICBNdXN0YWNoZUNvbW1lbnRTdGF0ZW1lbnQsXG4gIENvbW1lbnRTdGF0ZW1lbnQsXG4gIEVsZW1lbnRNb2RpZmllclN0YXRlbWVudCxcbiAgRXhwcmVzc2lvbixcbiAgUGF0aEV4cHJlc3Npb24sXG4gIFN1YkV4cHJlc3Npb24sXG4gIEhhc2gsXG4gIEhhc2hQYWlyLFxuICBMaXRlcmFsLFxuICBTdHJpbmdMaXRlcmFsLFxuICBCb29sZWFuTGl0ZXJhbCxcbiAgTnVtYmVyTGl0ZXJhbCxcbiAgVW5kZWZpbmVkTGl0ZXJhbCxcbiAgTnVsbExpdGVyYWwsXG4gIFRvcExldmVsU3RhdGVtZW50LFxuICBUZW1wbGF0ZSxcbn0gZnJvbSAnLi4vdHlwZXMvbm9kZXMnO1xuaW1wb3J0IHsgdm9pZE1hcCB9IGZyb20gJy4uL3BhcnNlci90b2tlbml6ZXItZXZlbnQtaGFuZGxlcnMnO1xuaW1wb3J0IHsgZXNjYXBlVGV4dCwgZXNjYXBlQXR0clZhbHVlIH0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgTk9OX1dISVRFU1BBQ0UgPSAvXFxTLztcblxuZXhwb3J0IGludGVyZmFjZSBQcmludGVyT3B0aW9ucyB7XG4gIGVudGl0eUVuY29kaW5nOiAndHJhbnNmb3JtZWQnIHwgJ3Jhdyc7XG5cbiAgLyoqXG4gICAqIFVzZWQgdG8gb3ZlcnJpZGUgdGhlIG1lY2hhbmlzbSBvZiBwcmludGluZyBhIGdpdmVuIEFTVC5Ob2RlLlxuICAgKlxuICAgKiBUaGlzIHdpbGwgZ2VuZXJhbGx5IG9ubHkgYmUgdXNlZnVsIHRvIHNvdXJjZSAtPiBzb3VyY2UgY29kZW1vZHNcbiAgICogd2hlcmUgeW91IHdvdWxkIGxpa2UgdG8gc3BlY2lhbGl6ZS9vdmVycmlkZSB0aGUgd2F5IGEgZ2l2ZW4gbm9kZSBpc1xuICAgKiBwcmludGVkIChlLmcuIHlvdSB3b3VsZCBsaWtlIHRvIHByZXNlcnZlIGFzIG11Y2ggb2YgdGhlIG9yaWdpbmFsXG4gICAqIGZvcm1hdHRpbmcgYXMgcG9zc2libGUpLlxuICAgKlxuICAgKiBXaGVuIHRoZSBwcm92aWRlZCBvdmVycmlkZSByZXR1cm5zIHVuZGVmaW5lZCwgdGhlIGRlZmF1bHQgYnVpbHQgaW4gcHJpbnRpbmdcbiAgICogd2lsbCBiZSBkb25lIGZvciB0aGUgQVNULk5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSBhc3QgdGhlIGFzdCBub2RlIHRvIGJlIHByaW50ZWRcbiAgICogQHBhcmFtIG9wdGlvbnMgdGhlIG9wdGlvbnMgc3BlY2lmaWVkIGR1cmluZyB0aGUgcHJpbnQoKSBpbnZvY2F0aW9uXG4gICAqL1xuICBvdmVycmlkZT8oYXN0OiBOb2RlLCBvcHRpb25zOiBQcmludGVyT3B0aW9ucyk6IHZvaWQgfCBzdHJpbmc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByaW50ZXIge1xuICBwcml2YXRlIGJ1ZmZlciA9ICcnO1xuICBwcml2YXRlIG9wdGlvbnM6IFByaW50ZXJPcHRpb25zO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFByaW50ZXJPcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgfVxuXG4gIC8qXG4gICAgVGhpcyBpcyB1c2VkIGJ5IF9hbGxfIG1ldGhvZHMgb24gdGhpcyBQcmludGVyIGNsYXNzIHRoYXQgYWRkIHRvIGB0aGlzLmJ1ZmZlcmAsXG4gICAgaXQgYWxsb3dzIGNvbnN1bWVycyBvZiB0aGUgcHJpbnRlciB0byB1c2UgYWx0ZXJuYXRlIHN0cmluZyByZXByZXNlbnRhdGlvbnMgZm9yXG4gICAgYSBnaXZlbiBub2RlLlxuXG4gICAgVGhlIHByaW1hcnkgdXNlIGNhc2UgZm9yIHRoaXMgYXJlIHRoaW5ncyBsaWtlIHNvdXJjZSAtPiBzb3VyY2UgY29kZW1vZCB1dGlsaXRpZXMuXG4gICAgRm9yIGV4YW1wbGUsIGVtYmVyLXRlbXBsYXRlLXJlY2FzdCBhdHRlbXB0cyB0byBhbHdheXMgcHJlc2VydmUgdGhlIG9yaWdpbmFsIHN0cmluZ1xuICAgIGZvcm1hdHRpbmcgaW4gZWFjaCBBU1Qgbm9kZSBpZiBubyBtb2RpZmljYXRpb25zIGFyZSBtYWRlIHRvIGl0LlxuICAqL1xuICBoYW5kbGVkQnlPdmVycmlkZShub2RlOiBOb2RlLCBlbnN1cmVMZWFkaW5nV2hpdGVzcGFjZSA9IGZhbHNlKTogYm9vbGVhbiB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVycmlkZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgcmVzdWx0ID0gdGhpcy5vcHRpb25zLm92ZXJyaWRlKG5vZGUsIHRoaXMub3B0aW9ucyk7XG4gICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKGVuc3VyZUxlYWRpbmdXaGl0ZXNwYWNlICYmIHJlc3VsdCAhPT0gJycgJiYgTk9OX1dISVRFU1BBQ0UudGVzdChyZXN1bHRbMF0pKSB7XG4gICAgICAgICAgcmVzdWx0ID0gYCAke3Jlc3VsdH1gO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5idWZmZXIgKz0gcmVzdWx0O1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBOb2RlKG5vZGU6IE5vZGUpOiB2b2lkIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSAnTXVzdGFjaGVTdGF0ZW1lbnQnOlxuICAgICAgY2FzZSAnQmxvY2tTdGF0ZW1lbnQnOlxuICAgICAgY2FzZSAnUGFydGlhbFN0YXRlbWVudCc6XG4gICAgICBjYXNlICdNdXN0YWNoZUNvbW1lbnRTdGF0ZW1lbnQnOlxuICAgICAgY2FzZSAnQ29tbWVudFN0YXRlbWVudCc6XG4gICAgICBjYXNlICdUZXh0Tm9kZSc6XG4gICAgICBjYXNlICdFbGVtZW50Tm9kZSc6XG4gICAgICBjYXNlICdBdHRyTm9kZSc6XG4gICAgICBjYXNlICdCbG9jayc6XG4gICAgICBjYXNlICdUZW1wbGF0ZSc6XG4gICAgICAgIHJldHVybiB0aGlzLlRvcExldmVsU3RhdGVtZW50KG5vZGUpO1xuICAgICAgY2FzZSAnU3RyaW5nTGl0ZXJhbCc6XG4gICAgICBjYXNlICdCb29sZWFuTGl0ZXJhbCc6XG4gICAgICBjYXNlICdOdW1iZXJMaXRlcmFsJzpcbiAgICAgIGNhc2UgJ1VuZGVmaW5lZExpdGVyYWwnOlxuICAgICAgY2FzZSAnTnVsbExpdGVyYWwnOlxuICAgICAgY2FzZSAnUGF0aEV4cHJlc3Npb24nOlxuICAgICAgY2FzZSAnU3ViRXhwcmVzc2lvbic6XG4gICAgICAgIHJldHVybiB0aGlzLkV4cHJlc3Npb24obm9kZSk7XG4gICAgICBjYXNlICdQcm9ncmFtJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuQmxvY2sobm9kZSk7XG4gICAgICBjYXNlICdDb25jYXRTdGF0ZW1lbnQnOlxuICAgICAgICAvLyBzaG91bGQgaGF2ZSBhbiBBdHRyTm9kZSBwYXJlbnRcbiAgICAgICAgcmV0dXJuIHRoaXMuQ29uY2F0U3RhdGVtZW50KG5vZGUpO1xuICAgICAgY2FzZSAnSGFzaCc6XG4gICAgICAgIHJldHVybiB0aGlzLkhhc2gobm9kZSk7XG4gICAgICBjYXNlICdIYXNoUGFpcic6XG4gICAgICAgIHJldHVybiB0aGlzLkhhc2hQYWlyKG5vZGUpO1xuICAgICAgY2FzZSAnRWxlbWVudE1vZGlmaWVyU3RhdGVtZW50JzpcbiAgICAgICAgcmV0dXJuIHRoaXMuRWxlbWVudE1vZGlmaWVyU3RhdGVtZW50KG5vZGUpO1xuICAgIH1cblxuICAgIHJldHVybiB1bnJlYWNoYWJsZShub2RlLCAnTm9kZScpO1xuICB9XG5cbiAgRXhwcmVzc2lvbihleHByZXNzaW9uOiBFeHByZXNzaW9uKTogdm9pZCB7XG4gICAgc3dpdGNoIChleHByZXNzaW9uLnR5cGUpIHtcbiAgICAgIGNhc2UgJ1N0cmluZ0xpdGVyYWwnOlxuICAgICAgY2FzZSAnQm9vbGVhbkxpdGVyYWwnOlxuICAgICAgY2FzZSAnTnVtYmVyTGl0ZXJhbCc6XG4gICAgICBjYXNlICdVbmRlZmluZWRMaXRlcmFsJzpcbiAgICAgIGNhc2UgJ051bGxMaXRlcmFsJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuTGl0ZXJhbChleHByZXNzaW9uKTtcbiAgICAgIGNhc2UgJ1BhdGhFeHByZXNzaW9uJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuUGF0aEV4cHJlc3Npb24oZXhwcmVzc2lvbik7XG4gICAgICBjYXNlICdTdWJFeHByZXNzaW9uJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuU3ViRXhwcmVzc2lvbihleHByZXNzaW9uKTtcbiAgICB9XG4gICAgcmV0dXJuIHVucmVhY2hhYmxlKGV4cHJlc3Npb24sICdFeHByZXNzaW9uJyk7XG4gIH1cblxuICBMaXRlcmFsKGxpdGVyYWw6IExpdGVyYWwpIHtcbiAgICBzd2l0Y2ggKGxpdGVyYWwudHlwZSkge1xuICAgICAgY2FzZSAnU3RyaW5nTGl0ZXJhbCc6XG4gICAgICAgIHJldHVybiB0aGlzLlN0cmluZ0xpdGVyYWwobGl0ZXJhbCk7XG4gICAgICBjYXNlICdCb29sZWFuTGl0ZXJhbCc6XG4gICAgICAgIHJldHVybiB0aGlzLkJvb2xlYW5MaXRlcmFsKGxpdGVyYWwpO1xuICAgICAgY2FzZSAnTnVtYmVyTGl0ZXJhbCc6XG4gICAgICAgIHJldHVybiB0aGlzLk51bWJlckxpdGVyYWwobGl0ZXJhbCk7XG4gICAgICBjYXNlICdVbmRlZmluZWRMaXRlcmFsJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuVW5kZWZpbmVkTGl0ZXJhbChsaXRlcmFsKTtcbiAgICAgIGNhc2UgJ051bGxMaXRlcmFsJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuTnVsbExpdGVyYWwobGl0ZXJhbCk7XG4gICAgfVxuICAgIHJldHVybiB1bnJlYWNoYWJsZShsaXRlcmFsLCAnTGl0ZXJhbCcpO1xuICB9XG5cbiAgVG9wTGV2ZWxTdGF0ZW1lbnQoc3RhdGVtZW50OiBUb3BMZXZlbFN0YXRlbWVudCkge1xuICAgIHN3aXRjaCAoc3RhdGVtZW50LnR5cGUpIHtcbiAgICAgIGNhc2UgJ011c3RhY2hlU3RhdGVtZW50JzpcbiAgICAgICAgcmV0dXJuIHRoaXMuTXVzdGFjaGVTdGF0ZW1lbnQoc3RhdGVtZW50KTtcbiAgICAgIGNhc2UgJ0Jsb2NrU3RhdGVtZW50JzpcbiAgICAgICAgcmV0dXJuIHRoaXMuQmxvY2tTdGF0ZW1lbnQoc3RhdGVtZW50KTtcbiAgICAgIGNhc2UgJ1BhcnRpYWxTdGF0ZW1lbnQnOlxuICAgICAgICByZXR1cm4gdGhpcy5QYXJ0aWFsU3RhdGVtZW50KHN0YXRlbWVudCk7XG4gICAgICBjYXNlICdNdXN0YWNoZUNvbW1lbnRTdGF0ZW1lbnQnOlxuICAgICAgICByZXR1cm4gdGhpcy5NdXN0YWNoZUNvbW1lbnRTdGF0ZW1lbnQoc3RhdGVtZW50KTtcbiAgICAgIGNhc2UgJ0NvbW1lbnRTdGF0ZW1lbnQnOlxuICAgICAgICByZXR1cm4gdGhpcy5Db21tZW50U3RhdGVtZW50KHN0YXRlbWVudCk7XG4gICAgICBjYXNlICdUZXh0Tm9kZSc6XG4gICAgICAgIHJldHVybiB0aGlzLlRleHROb2RlKHN0YXRlbWVudCk7XG4gICAgICBjYXNlICdFbGVtZW50Tm9kZSc6XG4gICAgICAgIHJldHVybiB0aGlzLkVsZW1lbnROb2RlKHN0YXRlbWVudCk7XG4gICAgICBjYXNlICdCbG9jayc6XG4gICAgICBjYXNlICdUZW1wbGF0ZSc6XG4gICAgICAgIHJldHVybiB0aGlzLkJsb2NrKHN0YXRlbWVudCk7XG4gICAgICBjYXNlICdBdHRyTm9kZSc6XG4gICAgICAgIC8vIHNob3VsZCBoYXZlIGVsZW1lbnRcbiAgICAgICAgcmV0dXJuIHRoaXMuQXR0ck5vZGUoc3RhdGVtZW50KTtcbiAgICB9XG4gICAgdW5yZWFjaGFibGUoc3RhdGVtZW50LCAnVG9wTGV2ZWxTdGF0ZW1lbnQnKTtcbiAgfVxuXG4gIEJsb2NrKGJsb2NrOiBCbG9jayB8IFByb2dyYW0gfCBUZW1wbGF0ZSk6IHZvaWQge1xuICAgIC8qXG4gICAgICBXaGVuIHByb2Nlc3NpbmcgYSB0ZW1wbGF0ZSBsaWtlOlxuXG4gICAgICBgYGBoYnNcbiAgICAgIHt7I2lmIHdoYXRldmVyfX1cbiAgICAgICAgd2hhdGV2ZXJcbiAgICAgIHt7ZWxzZSBpZiBzb21ldGhpbmdFbHNlfX1cbiAgICAgICAgc29tZXRoaW5nIGVsc2VcbiAgICAgIHt7ZWxzZX19XG4gICAgICAgIGZhbGxiYWNrXG4gICAgICB7ey9pZn19XG4gICAgICBgYGBcblxuICAgICAgVGhlIEFTVCBzdGlsbCBfZWZmZWN0aXZlbHlfIGxvb2tzIGxpa2U6XG5cbiAgICAgIGBgYGhic1xuICAgICAge3sjaWYgd2hhdGV2ZXJ9fVxuICAgICAgICB3aGF0ZXZlclxuICAgICAge3tlbHNlfX17eyNpZiBzb21ldGhpbmdFbHNlfX1cbiAgICAgICAgc29tZXRoaW5nIGVsc2VcbiAgICAgIHt7ZWxzZX19XG4gICAgICAgIGZhbGxiYWNrXG4gICAgICB7ey9pZn19e3svaWZ9fVxuICAgICAgYGBgXG5cbiAgICAgIFRoZSBvbmx5IHdheSB3ZSBjYW4gdGVsbCBpZiB0aGF0IGlzIHRoZSBjYXNlIGlzIGJ5IGNoZWNraW5nIGZvclxuICAgICAgYGJsb2NrLmNoYWluZWRgLCBidXQgdW5mb3J0dW5hdGVseSB3aGVuIHRoZSBhY3R1YWwgc3RhdGVtZW50cyBhcmVcbiAgICAgIHByb2Nlc3NlZCB0aGUgYGJsb2NrLmJvZHlbMF1gIG5vZGUgKHdoaWNoIHdpbGwgYWx3YXlzIGJlIGFcbiAgICAgIGBCbG9ja1N0YXRlbWVudGApIGhhcyBubyBjbHVlIHRoYXQgaXRzIGFuc2Nlc3RvciBgQmxvY2tgIG5vZGUgd2FzXG4gICAgICBjaGFpbmVkLlxuXG4gICAgICBUaGlzIFwiZm9yd2FyZHNcIiB0aGUgYGNoYWluZWRgIHNldHRpbmcgc28gdGhhdCB3ZSBjYW4gY2hlY2tcbiAgICAgIGl0IGxhdGVyIHdoZW4gcHJvY2Vzc2luZyB0aGUgYEJsb2NrU3RhdGVtZW50YC5cbiAgICAqL1xuICAgIGlmIChibG9jay5jaGFpbmVkKSB7XG4gICAgICBsZXQgZmlyc3RDaGlsZCA9IGJsb2NrLmJvZHlbMF0gYXMgQmxvY2tTdGF0ZW1lbnQ7XG4gICAgICBmaXJzdENoaWxkLmNoYWluZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhbmRsZWRCeU92ZXJyaWRlKGJsb2NrKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuVG9wTGV2ZWxTdGF0ZW1lbnRzKGJsb2NrLmJvZHkpO1xuICB9XG5cbiAgVG9wTGV2ZWxTdGF0ZW1lbnRzKHN0YXRlbWVudHM6IFRvcExldmVsU3RhdGVtZW50W10pIHtcbiAgICBzdGF0ZW1lbnRzLmZvckVhY2goKHN0YXRlbWVudCkgPT4gdGhpcy5Ub3BMZXZlbFN0YXRlbWVudChzdGF0ZW1lbnQpKTtcbiAgfVxuXG4gIEVsZW1lbnROb2RlKGVsOiBFbGVtZW50Tm9kZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmhhbmRsZWRCeU92ZXJyaWRlKGVsKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuT3BlbkVsZW1lbnROb2RlKGVsKTtcbiAgICB0aGlzLlRvcExldmVsU3RhdGVtZW50cyhlbC5jaGlsZHJlbik7XG4gICAgdGhpcy5DbG9zZUVsZW1lbnROb2RlKGVsKTtcbiAgfVxuXG4gIE9wZW5FbGVtZW50Tm9kZShlbDogRWxlbWVudE5vZGUpOiB2b2lkIHtcbiAgICB0aGlzLmJ1ZmZlciArPSBgPCR7ZWwudGFnfWA7XG4gICAgaWYgKGVsLmF0dHJpYnV0ZXMubGVuZ3RoKSB7XG4gICAgICBlbC5hdHRyaWJ1dGVzLmZvckVhY2goKGF0dHIpID0+IHtcbiAgICAgICAgdGhpcy5idWZmZXIgKz0gJyAnO1xuICAgICAgICB0aGlzLkF0dHJOb2RlKGF0dHIpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChlbC5tb2RpZmllcnMubGVuZ3RoKSB7XG4gICAgICBlbC5tb2RpZmllcnMuZm9yRWFjaCgobW9kKSA9PiB7XG4gICAgICAgIHRoaXMuYnVmZmVyICs9ICcgJztcbiAgICAgICAgdGhpcy5FbGVtZW50TW9kaWZpZXJTdGF0ZW1lbnQobW9kKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoZWwuY29tbWVudHMubGVuZ3RoKSB7XG4gICAgICBlbC5jb21tZW50cy5mb3JFYWNoKChjb21tZW50KSA9PiB7XG4gICAgICAgIHRoaXMuYnVmZmVyICs9ICcgJztcbiAgICAgICAgdGhpcy5NdXN0YWNoZUNvbW1lbnRTdGF0ZW1lbnQoY29tbWVudCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGVsLmJsb2NrUGFyYW1zLmxlbmd0aCkge1xuICAgICAgdGhpcy5CbG9ja1BhcmFtcyhlbC5ibG9ja1BhcmFtcyk7XG4gICAgfVxuICAgIGlmIChlbC5zZWxmQ2xvc2luZykge1xuICAgICAgdGhpcy5idWZmZXIgKz0gJyAvJztcbiAgICB9XG4gICAgdGhpcy5idWZmZXIgKz0gJz4nO1xuICB9XG5cbiAgQ2xvc2VFbGVtZW50Tm9kZShlbDogRWxlbWVudE5vZGUpOiB2b2lkIHtcbiAgICBpZiAoZWwuc2VsZkNsb3NpbmcgfHwgdm9pZE1hcFtlbC50YWcudG9Mb3dlckNhc2UoKV0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5idWZmZXIgKz0gYDwvJHtlbC50YWd9PmA7XG4gIH1cblxuICBBdHRyTm9kZShhdHRyOiBBdHRyTm9kZSk6IHZvaWQge1xuICAgIGlmICh0aGlzLmhhbmRsZWRCeU92ZXJyaWRlKGF0dHIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IHsgbmFtZSwgdmFsdWUgfSA9IGF0dHI7XG5cbiAgICB0aGlzLmJ1ZmZlciArPSBuYW1lO1xuICAgIGlmICh2YWx1ZS50eXBlICE9PSAnVGV4dE5vZGUnIHx8IHZhbHVlLmNoYXJzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuYnVmZmVyICs9ICc9JztcbiAgICAgIHRoaXMuQXR0ck5vZGVWYWx1ZSh2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgQXR0ck5vZGVWYWx1ZSh2YWx1ZTogQXR0ck5vZGVbJ3ZhbHVlJ10pIHtcbiAgICBpZiAodmFsdWUudHlwZSA9PT0gJ1RleHROb2RlJykge1xuICAgICAgdGhpcy5idWZmZXIgKz0gJ1wiJztcbiAgICAgIHRoaXMuVGV4dE5vZGUodmFsdWUsIHRydWUpO1xuICAgICAgdGhpcy5idWZmZXIgKz0gJ1wiJztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5Ob2RlKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBUZXh0Tm9kZSh0ZXh0OiBUZXh0Tm9kZSwgaXNBdHRyPzogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLmhhbmRsZWRCeU92ZXJyaWRlKHRleHQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5lbnRpdHlFbmNvZGluZyA9PT0gJ3JhdycpIHtcbiAgICAgIHRoaXMuYnVmZmVyICs9IHRleHQuY2hhcnM7XG4gICAgfSBlbHNlIGlmIChpc0F0dHIpIHtcbiAgICAgIHRoaXMuYnVmZmVyICs9IGVzY2FwZUF0dHJWYWx1ZSh0ZXh0LmNoYXJzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5idWZmZXIgKz0gZXNjYXBlVGV4dCh0ZXh0LmNoYXJzKTtcbiAgICB9XG4gIH1cblxuICBNdXN0YWNoZVN0YXRlbWVudChtdXN0YWNoZTogTXVzdGFjaGVTdGF0ZW1lbnQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5oYW5kbGVkQnlPdmVycmlkZShtdXN0YWNoZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmJ1ZmZlciArPSBtdXN0YWNoZS5lc2NhcGVkID8gJ3t7JyA6ICd7e3snO1xuXG4gICAgaWYgKG11c3RhY2hlLnN0cmlwLm9wZW4pIHtcbiAgICAgIHRoaXMuYnVmZmVyICs9ICd+JztcbiAgICB9XG5cbiAgICB0aGlzLkV4cHJlc3Npb24obXVzdGFjaGUucGF0aCk7XG4gICAgdGhpcy5QYXJhbXMobXVzdGFjaGUucGFyYW1zKTtcbiAgICB0aGlzLkhhc2gobXVzdGFjaGUuaGFzaCk7XG5cbiAgICBpZiAobXVzdGFjaGUuc3RyaXAuY2xvc2UpIHtcbiAgICAgIHRoaXMuYnVmZmVyICs9ICd+JztcbiAgICB9XG5cbiAgICB0aGlzLmJ1ZmZlciArPSBtdXN0YWNoZS5lc2NhcGVkID8gJ319JyA6ICd9fX0nO1xuICB9XG5cbiAgQmxvY2tTdGF0ZW1lbnQoYmxvY2s6IEJsb2NrU3RhdGVtZW50KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaGFuZGxlZEJ5T3ZlcnJpZGUoYmxvY2spKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGJsb2NrLmNoYWluZWQpIHtcbiAgICAgIHRoaXMuYnVmZmVyICs9IGJsb2NrLmludmVyc2VTdHJpcC5vcGVuID8gJ3t7ficgOiAne3snO1xuICAgICAgdGhpcy5idWZmZXIgKz0gJ2Vsc2UgJztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5idWZmZXIgKz0gYmxvY2sub3BlblN0cmlwLm9wZW4gPyAne3t+IycgOiAne3sjJztcbiAgICB9XG5cbiAgICB0aGlzLkV4cHJlc3Npb24oYmxvY2sucGF0aCk7XG4gICAgdGhpcy5QYXJhbXMoYmxvY2sucGFyYW1zKTtcbiAgICB0aGlzLkhhc2goYmxvY2suaGFzaCk7XG4gICAgaWYgKGJsb2NrLnByb2dyYW0uYmxvY2tQYXJhbXMubGVuZ3RoKSB7XG4gICAgICB0aGlzLkJsb2NrUGFyYW1zKGJsb2NrLnByb2dyYW0uYmxvY2tQYXJhbXMpO1xuICAgIH1cblxuICAgIGlmIChibG9jay5jaGFpbmVkKSB7XG4gICAgICB0aGlzLmJ1ZmZlciArPSBibG9jay5pbnZlcnNlU3RyaXAuY2xvc2UgPyAnfn19JyA6ICd9fSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYnVmZmVyICs9IGJsb2NrLm9wZW5TdHJpcC5jbG9zZSA/ICd+fX0nIDogJ319JztcbiAgICB9XG5cbiAgICB0aGlzLkJsb2NrKGJsb2NrLnByb2dyYW0pO1xuXG4gICAgaWYgKGJsb2NrLmludmVyc2UpIHtcbiAgICAgIGlmICghYmxvY2suaW52ZXJzZS5jaGFpbmVkKSB7XG4gICAgICAgIHRoaXMuYnVmZmVyICs9IGJsb2NrLmludmVyc2VTdHJpcC5vcGVuID8gJ3t7ficgOiAne3snO1xuICAgICAgICB0aGlzLmJ1ZmZlciArPSAnZWxzZSc7XG4gICAgICAgIHRoaXMuYnVmZmVyICs9IGJsb2NrLmludmVyc2VTdHJpcC5jbG9zZSA/ICd+fX0nIDogJ319JztcbiAgICAgIH1cblxuICAgICAgdGhpcy5CbG9jayhibG9jay5pbnZlcnNlKTtcbiAgICB9XG5cbiAgICBpZiAoIWJsb2NrLmNoYWluZWQpIHtcbiAgICAgIHRoaXMuYnVmZmVyICs9IGJsb2NrLmNsb3NlU3RyaXAub3BlbiA/ICd7e34vJyA6ICd7ey8nO1xuICAgICAgdGhpcy5FeHByZXNzaW9uKGJsb2NrLnBhdGgpO1xuICAgICAgdGhpcy5idWZmZXIgKz0gYmxvY2suY2xvc2VTdHJpcC5jbG9zZSA/ICd+fX0nIDogJ319JztcbiAgICB9XG4gIH1cblxuICBCbG9ja1BhcmFtcyhibG9ja1BhcmFtczogc3RyaW5nW10pIHtcbiAgICB0aGlzLmJ1ZmZlciArPSBgIGFzIHwke2Jsb2NrUGFyYW1zLmpvaW4oJyAnKX18YDtcbiAgfVxuXG4gIFBhcnRpYWxTdGF0ZW1lbnQocGFydGlhbDogUGFydGlhbFN0YXRlbWVudCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmhhbmRsZWRCeU92ZXJyaWRlKHBhcnRpYWwpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5idWZmZXIgKz0gJ3t7Pic7XG4gICAgdGhpcy5FeHByZXNzaW9uKHBhcnRpYWwubmFtZSk7XG4gICAgdGhpcy5QYXJhbXMocGFydGlhbC5wYXJhbXMpO1xuICAgIHRoaXMuSGFzaChwYXJ0aWFsLmhhc2gpO1xuICAgIHRoaXMuYnVmZmVyICs9ICd9fSc7XG4gIH1cblxuICBDb25jYXRTdGF0ZW1lbnQoY29uY2F0OiBDb25jYXRTdGF0ZW1lbnQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5oYW5kbGVkQnlPdmVycmlkZShjb25jYXQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5idWZmZXIgKz0gJ1wiJztcbiAgICBjb25jYXQucGFydHMuZm9yRWFjaCgocGFydCkgPT4ge1xuICAgICAgaWYgKHBhcnQudHlwZSA9PT0gJ1RleHROb2RlJykge1xuICAgICAgICB0aGlzLlRleHROb2RlKHBhcnQsIHRydWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5Ob2RlKHBhcnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuYnVmZmVyICs9ICdcIic7XG4gIH1cblxuICBNdXN0YWNoZUNvbW1lbnRTdGF0ZW1lbnQoY29tbWVudDogTXVzdGFjaGVDb21tZW50U3RhdGVtZW50KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaGFuZGxlZEJ5T3ZlcnJpZGUoY29tbWVudCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmJ1ZmZlciArPSBge3shLS0ke2NvbW1lbnQudmFsdWV9LS19fWA7XG4gIH1cblxuICBFbGVtZW50TW9kaWZpZXJTdGF0ZW1lbnQobW9kOiBFbGVtZW50TW9kaWZpZXJTdGF0ZW1lbnQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5oYW5kbGVkQnlPdmVycmlkZShtb2QpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5idWZmZXIgKz0gJ3t7JztcbiAgICB0aGlzLkV4cHJlc3Npb24obW9kLnBhdGgpO1xuICAgIHRoaXMuUGFyYW1zKG1vZC5wYXJhbXMpO1xuICAgIHRoaXMuSGFzaChtb2QuaGFzaCk7XG4gICAgdGhpcy5idWZmZXIgKz0gJ319JztcbiAgfVxuXG4gIENvbW1lbnRTdGF0ZW1lbnQoY29tbWVudDogQ29tbWVudFN0YXRlbWVudCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmhhbmRsZWRCeU92ZXJyaWRlKGNvbW1lbnQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5idWZmZXIgKz0gYDwhLS0ke2NvbW1lbnQudmFsdWV9LS0+YDtcbiAgfVxuXG4gIFBhdGhFeHByZXNzaW9uKHBhdGg6IFBhdGhFeHByZXNzaW9uKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaGFuZGxlZEJ5T3ZlcnJpZGUocGF0aCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmJ1ZmZlciArPSBwYXRoLm9yaWdpbmFsO1xuICB9XG5cbiAgU3ViRXhwcmVzc2lvbihzZXhwOiBTdWJFeHByZXNzaW9uKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaGFuZGxlZEJ5T3ZlcnJpZGUoc2V4cCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmJ1ZmZlciArPSAnKCc7XG4gICAgdGhpcy5FeHByZXNzaW9uKHNleHAucGF0aCk7XG4gICAgdGhpcy5QYXJhbXMoc2V4cC5wYXJhbXMpO1xuICAgIHRoaXMuSGFzaChzZXhwLmhhc2gpO1xuICAgIHRoaXMuYnVmZmVyICs9ICcpJztcbiAgfVxuXG4gIFBhcmFtcyhwYXJhbXM6IEV4cHJlc3Npb25bXSkge1xuICAgIC8vIFRPRE86IGltcGxlbWVudCBhIHRvcCBsZXZlbCBQYXJhbXMgQVNUIG5vZGUgKGp1c3QgbGlrZSB0aGUgSGFzaCBvYmplY3QpXG4gICAgLy8gc28gdGhhdCB0aGlzIGNhbiBhbHNvIGJlIG92ZXJyaWRkZW5cbiAgICBpZiAocGFyYW1zLmxlbmd0aCkge1xuICAgICAgcGFyYW1zLmZvckVhY2goKHBhcmFtKSA9PiB7XG4gICAgICAgIHRoaXMuYnVmZmVyICs9ICcgJztcbiAgICAgICAgdGhpcy5FeHByZXNzaW9uKHBhcmFtKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIEhhc2goaGFzaDogSGFzaCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmhhbmRsZWRCeU92ZXJyaWRlKGhhc2gsIHRydWUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaGFzaC5wYWlycy5mb3JFYWNoKChwYWlyKSA9PiB7XG4gICAgICB0aGlzLmJ1ZmZlciArPSAnICc7XG4gICAgICB0aGlzLkhhc2hQYWlyKHBhaXIpO1xuICAgIH0pO1xuICB9XG5cbiAgSGFzaFBhaXIocGFpcjogSGFzaFBhaXIpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5oYW5kbGVkQnlPdmVycmlkZShwYWlyKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYnVmZmVyICs9IHBhaXIua2V5O1xuICAgIHRoaXMuYnVmZmVyICs9ICc9JztcbiAgICB0aGlzLk5vZGUocGFpci52YWx1ZSk7XG4gIH1cblxuICBTdHJpbmdMaXRlcmFsKHN0cjogU3RyaW5nTGl0ZXJhbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmhhbmRsZWRCeU92ZXJyaWRlKHN0cikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmJ1ZmZlciArPSBKU09OLnN0cmluZ2lmeShzdHIudmFsdWUpO1xuICB9XG5cbiAgQm9vbGVhbkxpdGVyYWwoYm9vbDogQm9vbGVhbkxpdGVyYWwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5oYW5kbGVkQnlPdmVycmlkZShib29sKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYnVmZmVyICs9IGJvb2wudmFsdWU7XG4gIH1cblxuICBOdW1iZXJMaXRlcmFsKG51bWJlcjogTnVtYmVyTGl0ZXJhbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmhhbmRsZWRCeU92ZXJyaWRlKG51bWJlcikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmJ1ZmZlciArPSBudW1iZXIudmFsdWU7XG4gIH1cblxuICBVbmRlZmluZWRMaXRlcmFsKG5vZGU6IFVuZGVmaW5lZExpdGVyYWwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5oYW5kbGVkQnlPdmVycmlkZShub2RlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYnVmZmVyICs9ICd1bmRlZmluZWQnO1xuICB9XG5cbiAgTnVsbExpdGVyYWwobm9kZTogTnVsbExpdGVyYWwpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5oYW5kbGVkQnlPdmVycmlkZShub2RlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYnVmZmVyICs9ICdudWxsJztcbiAgfVxuXG4gIHByaW50KG5vZGU6IE5vZGUpIHtcbiAgICBsZXQgeyBvcHRpb25zIH0gPSB0aGlzO1xuXG4gICAgaWYgKG9wdGlvbnMub3ZlcnJpZGUpIHtcbiAgICAgIGxldCByZXN1bHQgPSBvcHRpb25zLm92ZXJyaWRlKG5vZGUsIG9wdGlvbnMpO1xuXG4gICAgICBpZiAocmVzdWx0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmJ1ZmZlciA9ICcnO1xuICAgIHRoaXMuTm9kZShub2RlKTtcbiAgICByZXR1cm4gdGhpcy5idWZmZXI7XG4gIH1cbn1cblxuZnVuY3Rpb24gdW5yZWFjaGFibGUobm9kZTogbmV2ZXIsIHBhcmVudE5vZGVUeXBlOiBzdHJpbmcpOiBuZXZlciB7XG4gIGxldCB7IGxvYywgdHlwZSB9ID0gKG5vZGUgYXMgYW55KSBhcyBOb2RlO1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgYE5vbi1leGhhdXN0aXZlIG5vZGUgbmFycm93aW5nICR7dHlwZX0gQCBsb2NhdGlvbjogJHtKU09OLnN0cmluZ2lmeShcbiAgICAgIGxvY1xuICAgICl9IGZvciBwYXJlbnQgJHtwYXJlbnROb2RlVHlwZX1gXG4gICk7XG59XG4iLCJpbXBvcnQgeyBOb2RlIH0gZnJvbSAnLi4vdHlwZXMvbm9kZXMnO1xuaW1wb3J0IFByaW50ZXIsIHsgUHJpbnRlck9wdGlvbnMgfSBmcm9tICcuL3ByaW50ZXInO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBidWlsZChcbiAgYXN0OiBOb2RlLFxuICBvcHRpb25zOiBQcmludGVyT3B0aW9ucyA9IHsgZW50aXR5RW5jb2Rpbmc6ICd0cmFuc2Zvcm1lZCcgfVxuKTogc3RyaW5nIHtcbiAgaWYgKCFhc3QpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICBsZXQgcHJpbnRlciA9IG5ldyBQcmludGVyKG9wdGlvbnMpO1xuICByZXR1cm4gcHJpbnRlci5wcmludChhc3QpO1xufVxuIiwiaW1wb3J0IHsgT3B0aW9uIH0gZnJvbSAnQGdsaW1tZXIvaW50ZXJmYWNlcyc7XG5pbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi4vdHlwZXMvbm9kZXMnO1xuXG5leHBvcnQgdHlwZSBOb2RlQ2FsbGJhY2s8TiBleHRlbmRzIEFTVC5Ob2RlPiA9IChub2RlOiBOLCB3YWxrZXI6IFdhbGtlcikgPT4gdm9pZDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV2Fsa2VyIHtcbiAgcHVibGljIHN0YWNrOiBhbnlbXSA9IFtdO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgb3JkZXI/OiBhbnkpIHt9XG5cbiAgdmlzaXQ8TiBleHRlbmRzIEFTVC5Ob2RlPihub2RlOiBPcHRpb248Tj4sIGNhbGxiYWNrOiBOb2RlQ2FsbGJhY2s8Tj4pIHtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnN0YWNrLnB1c2gobm9kZSk7XG5cbiAgICBpZiAodGhpcy5vcmRlciA9PT0gJ3Bvc3QnKSB7XG4gICAgICB0aGlzLmNoaWxkcmVuKG5vZGUsIGNhbGxiYWNrKTtcbiAgICAgIGNhbGxiYWNrKG5vZGUsIHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsYmFjayhub2RlLCB0aGlzKTtcbiAgICAgIHRoaXMuY2hpbGRyZW4obm9kZSwgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIHRoaXMuc3RhY2sucG9wKCk7XG4gIH1cblxuICBjaGlsZHJlbihub2RlOiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcbiAgICBsZXQgdHlwZTtcbiAgICBpZiAobm9kZS50eXBlID09PSAnQmxvY2snIHx8IChub2RlLnR5cGUgPT09ICdUZW1wbGF0ZScgJiYgdmlzaXRvcnMuUHJvZ3JhbSkpIHtcbiAgICAgIHR5cGUgPSAnUHJvZ3JhbSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHR5cGUgPSBub2RlLnR5cGU7XG4gICAgfVxuXG4gICAgbGV0IHZpc2l0b3IgPSAodmlzaXRvcnMgYXMgYW55KVt0eXBlXTtcbiAgICBpZiAodmlzaXRvcikge1xuICAgICAgdmlzaXRvcih0aGlzLCBub2RlLCBjYWxsYmFjayk7XG4gICAgfVxuICB9XG59XG5cbmxldCB2aXNpdG9ycyA9IHtcbiAgUHJvZ3JhbSh3YWxrZXI6IFdhbGtlciwgbm9kZTogQVNULlByb2dyYW0sIGNhbGxiYWNrOiBOb2RlQ2FsbGJhY2s8QVNULk5vZGU+KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlLmJvZHkubGVuZ3RoOyBpKyspIHtcbiAgICAgIHdhbGtlci52aXNpdChub2RlLmJvZHlbaV0sIGNhbGxiYWNrKTtcbiAgICB9XG4gIH0sXG5cbiAgVGVtcGxhdGUod2Fsa2VyOiBXYWxrZXIsIG5vZGU6IEFTVC5UZW1wbGF0ZSwgY2FsbGJhY2s6IE5vZGVDYWxsYmFjazxBU1QuTm9kZT4pIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUuYm9keS5sZW5ndGg7IGkrKykge1xuICAgICAgd2Fsa2VyLnZpc2l0KG5vZGUuYm9keVtpXSwgY2FsbGJhY2spO1xuICAgIH1cbiAgfSxcblxuICBCbG9jayh3YWxrZXI6IFdhbGtlciwgbm9kZTogQVNULkJsb2NrLCBjYWxsYmFjazogTm9kZUNhbGxiYWNrPEFTVC5Ob2RlPikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZS5ib2R5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB3YWxrZXIudmlzaXQobm9kZS5ib2R5W2ldLCBjYWxsYmFjayk7XG4gICAgfVxuICB9LFxuXG4gIEVsZW1lbnROb2RlKHdhbGtlcjogV2Fsa2VyLCBub2RlOiBBU1QuRWxlbWVudE5vZGUsIGNhbGxiYWNrOiBOb2RlQ2FsbGJhY2s8QVNULk5vZGU+KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICB3YWxrZXIudmlzaXQobm9kZS5jaGlsZHJlbltpXSwgY2FsbGJhY2spO1xuICAgIH1cbiAgfSxcblxuICBCbG9ja1N0YXRlbWVudCh3YWxrZXI6IFdhbGtlciwgbm9kZTogQVNULkJsb2NrU3RhdGVtZW50LCBjYWxsYmFjazogTm9kZUNhbGxiYWNrPEFTVC5CbG9jaz4pIHtcbiAgICB3YWxrZXIudmlzaXQobm9kZS5wcm9ncmFtLCBjYWxsYmFjayk7XG4gICAgd2Fsa2VyLnZpc2l0KG5vZGUuaW52ZXJzZSB8fCBudWxsLCBjYWxsYmFjayk7XG4gIH0sXG59O1xuIiwiaW1wb3J0IGIsIHsgU1lOVEhFVElDIH0gZnJvbSAnLi4vYnVpbGRlcnMnO1xuaW1wb3J0IHsgYXBwZW5kQ2hpbGQsIHBhcnNlRWxlbWVudEJsb2NrUGFyYW1zIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHsgSGFuZGxlYmFyc05vZGVWaXNpdG9ycyB9IGZyb20gJy4vaGFuZGxlYmFycy1ub2RlLXZpc2l0b3JzJztcbmltcG9ydCAqIGFzIEFTVCBmcm9tICcuLi90eXBlcy9ub2Rlcyc7XG5pbXBvcnQgKiBhcyBIQlMgZnJvbSAnLi4vdHlwZXMvaGFuZGxlYmFycy1hc3QnO1xuaW1wb3J0IFN5bnRheEVycm9yIGZyb20gJy4uL2Vycm9ycy9zeW50YXgtZXJyb3InO1xuaW1wb3J0IHsgVGFnIH0gZnJvbSAnLi4vcGFyc2VyJztcbmltcG9ydCBidWlsZGVycyBmcm9tICcuLi9idWlsZGVycyc7XG5pbXBvcnQgdHJhdmVyc2UgZnJvbSAnLi4vdHJhdmVyc2FsL3RyYXZlcnNlJztcbmltcG9ydCBwcmludCBmcm9tICcuLi9nZW5lcmF0aW9uL3ByaW50JztcbmltcG9ydCBXYWxrZXIgZnJvbSAnLi4vdHJhdmVyc2FsL3dhbGtlcic7XG5pbXBvcnQgeyBwYXJzZSwgcGFyc2VXaXRob3V0UHJvY2Vzc2luZyB9IGZyb20gJ0BoYW5kbGViYXJzL3BhcnNlcic7XG5pbXBvcnQgeyBhc3NpZ24gfSBmcm9tICdAZ2xpbW1lci91dGlsJztcbmltcG9ydCB7IE5vZGVWaXNpdG9yIH0gZnJvbSAnLi4vdHJhdmVyc2FsL3Zpc2l0b3InO1xuaW1wb3J0IHsgRW50aXR5UGFyc2VyIH0gZnJvbSAnc2ltcGxlLWh0bWwtdG9rZW5pemVyJztcblxuZXhwb3J0IGNvbnN0IHZvaWRNYXA6IHtcbiAgW3RhZ05hbWU6IHN0cmluZ106IGJvb2xlYW47XG59ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxubGV0IHZvaWRUYWdOYW1lcyA9XG4gICdhcmVhIGJhc2UgYnIgY29sIGNvbW1hbmQgZW1iZWQgaHIgaW1nIGlucHV0IGtleWdlbiBsaW5rIG1ldGEgcGFyYW0gc291cmNlIHRyYWNrIHdicic7XG52b2lkVGFnTmFtZXMuc3BsaXQoJyAnKS5mb3JFYWNoKCh0YWdOYW1lKSA9PiB7XG4gIHZvaWRNYXBbdGFnTmFtZV0gPSB0cnVlO1xufSk7XG5cbmV4cG9ydCBjbGFzcyBUb2tlbml6ZXJFdmVudEhhbmRsZXJzIGV4dGVuZHMgSGFuZGxlYmFyc05vZGVWaXNpdG9ycyB7XG4gIHByaXZhdGUgdGFnT3BlbkxpbmUgPSAwO1xuICBwcml2YXRlIHRhZ09wZW5Db2x1bW4gPSAwO1xuXG4gIHJlc2V0KCkge1xuICAgIHRoaXMuY3VycmVudE5vZGUgPSBudWxsO1xuICB9XG5cbiAgLy8gQ29tbWVudFxuXG4gIGJlZ2luQ29tbWVudCgpIHtcbiAgICB0aGlzLmN1cnJlbnROb2RlID0gYi5jb21tZW50KCcnKTtcbiAgICB0aGlzLmN1cnJlbnROb2RlLmxvYyA9IHtcbiAgICAgIHNvdXJjZTogbnVsbCxcbiAgICAgIHN0YXJ0OiBiLnBvcyh0aGlzLnRhZ09wZW5MaW5lLCB0aGlzLnRhZ09wZW5Db2x1bW4pLFxuICAgICAgZW5kOiAobnVsbCBhcyBhbnkpIGFzIEFTVC5Qb3NpdGlvbixcbiAgICB9O1xuICB9XG5cbiAgYXBwZW5kVG9Db21tZW50RGF0YShjaGFyOiBzdHJpbmcpIHtcbiAgICB0aGlzLmN1cnJlbnRDb21tZW50LnZhbHVlICs9IGNoYXI7XG4gIH1cblxuICBmaW5pc2hDb21tZW50KCkge1xuICAgIHRoaXMuY3VycmVudENvbW1lbnQubG9jLmVuZCA9IGIucG9zKHRoaXMudG9rZW5pemVyLmxpbmUsIHRoaXMudG9rZW5pemVyLmNvbHVtbik7XG5cbiAgICBhcHBlbmRDaGlsZCh0aGlzLmN1cnJlbnRFbGVtZW50KCksIHRoaXMuY3VycmVudENvbW1lbnQpO1xuICB9XG5cbiAgLy8gRGF0YVxuXG4gIGJlZ2luRGF0YSgpIHtcbiAgICB0aGlzLmN1cnJlbnROb2RlID0gYi50ZXh0KCk7XG4gICAgdGhpcy5jdXJyZW50Tm9kZS5sb2MgPSB7XG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgICBzdGFydDogYi5wb3ModGhpcy50b2tlbml6ZXIubGluZSwgdGhpcy50b2tlbml6ZXIuY29sdW1uKSxcbiAgICAgIGVuZDogKG51bGwgYXMgYW55KSBhcyBBU1QuUG9zaXRpb24sXG4gICAgfTtcbiAgfVxuXG4gIGFwcGVuZFRvRGF0YShjaGFyOiBzdHJpbmcpIHtcbiAgICB0aGlzLmN1cnJlbnREYXRhLmNoYXJzICs9IGNoYXI7XG4gIH1cblxuICBmaW5pc2hEYXRhKCkge1xuICAgIHRoaXMuY3VycmVudERhdGEubG9jLmVuZCA9IGIucG9zKHRoaXMudG9rZW5pemVyLmxpbmUsIHRoaXMudG9rZW5pemVyLmNvbHVtbik7XG5cbiAgICBhcHBlbmRDaGlsZCh0aGlzLmN1cnJlbnRFbGVtZW50KCksIHRoaXMuY3VycmVudERhdGEpO1xuICB9XG5cbiAgLy8gVGFncyAtIGJhc2ljXG5cbiAgdGFnT3BlbigpIHtcbiAgICB0aGlzLnRhZ09wZW5MaW5lID0gdGhpcy50b2tlbml6ZXIubGluZTtcbiAgICB0aGlzLnRhZ09wZW5Db2x1bW4gPSB0aGlzLnRva2VuaXplci5jb2x1bW47XG4gIH1cblxuICBiZWdpblN0YXJ0VGFnKCkge1xuICAgIHRoaXMuY3VycmVudE5vZGUgPSB7XG4gICAgICB0eXBlOiAnU3RhcnRUYWcnLFxuICAgICAgbmFtZTogJycsXG4gICAgICBhdHRyaWJ1dGVzOiBbXSxcbiAgICAgIG1vZGlmaWVyczogW10sXG4gICAgICBjb21tZW50czogW10sXG4gICAgICBzZWxmQ2xvc2luZzogZmFsc2UsXG4gICAgICBsb2M6IFNZTlRIRVRJQyxcbiAgICB9O1xuICB9XG5cbiAgYmVnaW5FbmRUYWcoKSB7XG4gICAgdGhpcy5jdXJyZW50Tm9kZSA9IHtcbiAgICAgIHR5cGU6ICdFbmRUYWcnLFxuICAgICAgbmFtZTogJycsXG4gICAgICBhdHRyaWJ1dGVzOiBbXSxcbiAgICAgIG1vZGlmaWVyczogW10sXG4gICAgICBjb21tZW50czogW10sXG4gICAgICBzZWxmQ2xvc2luZzogZmFsc2UsXG4gICAgICBsb2M6IFNZTlRIRVRJQyxcbiAgICB9O1xuICB9XG5cbiAgZmluaXNoVGFnKCkge1xuICAgIGxldCB7IGxpbmUsIGNvbHVtbiB9ID0gdGhpcy50b2tlbml6ZXI7XG5cbiAgICBsZXQgdGFnID0gdGhpcy5jdXJyZW50VGFnO1xuICAgIHRhZy5sb2MgPSBiLmxvYyh0aGlzLnRhZ09wZW5MaW5lLCB0aGlzLnRhZ09wZW5Db2x1bW4sIGxpbmUsIGNvbHVtbik7XG5cbiAgICBpZiAodGFnLnR5cGUgPT09ICdTdGFydFRhZycpIHtcbiAgICAgIHRoaXMuZmluaXNoU3RhcnRUYWcoKTtcblxuICAgICAgaWYgKHZvaWRNYXBbdGFnLm5hbWVdIHx8IHRhZy5zZWxmQ2xvc2luZykge1xuICAgICAgICB0aGlzLmZpbmlzaEVuZFRhZyh0cnVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRhZy50eXBlID09PSAnRW5kVGFnJykge1xuICAgICAgdGhpcy5maW5pc2hFbmRUYWcoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGZpbmlzaFN0YXJ0VGFnKCkge1xuICAgIGxldCB7IG5hbWUsIGF0dHJpYnV0ZXM6IGF0dHJzLCBtb2RpZmllcnMsIGNvbW1lbnRzLCBzZWxmQ2xvc2luZyB9ID0gdGhpcy5jdXJyZW50U3RhcnRUYWc7XG4gICAgbGV0IGxvYyA9IGIubG9jKHRoaXMudGFnT3BlbkxpbmUsIHRoaXMudGFnT3BlbkNvbHVtbik7XG4gICAgbGV0IGVsZW1lbnQgPSBiLmVsZW1lbnQoeyBuYW1lLCBzZWxmQ2xvc2luZyB9LCB7IGF0dHJzLCBtb2RpZmllcnMsIGNvbW1lbnRzLCBsb2MgfSk7XG4gICAgdGhpcy5lbGVtZW50U3RhY2sucHVzaChlbGVtZW50KTtcbiAgfVxuXG4gIGZpbmlzaEVuZFRhZyhpc1ZvaWQ6IGJvb2xlYW4pIHtcbiAgICBsZXQgdGFnID0gdGhpcy5jdXJyZW50VGFnO1xuXG4gICAgbGV0IGVsZW1lbnQgPSB0aGlzLmVsZW1lbnRTdGFjay5wb3AoKSBhcyBBU1QuRWxlbWVudE5vZGU7XG4gICAgbGV0IHBhcmVudCA9IHRoaXMuY3VycmVudEVsZW1lbnQoKTtcblxuICAgIHZhbGlkYXRlRW5kVGFnKHRhZywgZWxlbWVudCwgaXNWb2lkKTtcblxuICAgIGVsZW1lbnQubG9jLmVuZC5saW5lID0gdGhpcy50b2tlbml6ZXIubGluZTtcbiAgICBlbGVtZW50LmxvYy5lbmQuY29sdW1uID0gdGhpcy50b2tlbml6ZXIuY29sdW1uO1xuXG4gICAgcGFyc2VFbGVtZW50QmxvY2tQYXJhbXMoZWxlbWVudCk7XG4gICAgYXBwZW5kQ2hpbGQocGFyZW50LCBlbGVtZW50KTtcbiAgfVxuXG4gIG1hcmtUYWdBc1NlbGZDbG9zaW5nKCkge1xuICAgIHRoaXMuY3VycmVudFRhZy5zZWxmQ2xvc2luZyA9IHRydWU7XG4gIH1cblxuICAvLyBUYWdzIC0gbmFtZVxuXG4gIGFwcGVuZFRvVGFnTmFtZShjaGFyOiBzdHJpbmcpIHtcbiAgICB0aGlzLmN1cnJlbnRUYWcubmFtZSArPSBjaGFyO1xuICB9XG5cbiAgLy8gVGFncyAtIGF0dHJpYnV0ZXNcblxuICBiZWdpbkF0dHJpYnV0ZSgpIHtcbiAgICBsZXQgdGFnID0gdGhpcy5jdXJyZW50VGFnO1xuICAgIGlmICh0YWcudHlwZSA9PT0gJ0VuZFRhZycpIHtcbiAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgICAgYEludmFsaWQgZW5kIHRhZzogY2xvc2luZyB0YWcgbXVzdCBub3QgaGF2ZSBhdHRyaWJ1dGVzLCBgICtcbiAgICAgICAgICBgaW4gXFxgJHt0YWcubmFtZX1cXGAgKG9uIGxpbmUgJHt0aGlzLnRva2VuaXplci5saW5lfSkuYCxcbiAgICAgICAgdGFnLmxvY1xuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLmN1cnJlbnRBdHRyaWJ1dGUgPSB7XG4gICAgICBuYW1lOiAnJyxcbiAgICAgIHBhcnRzOiBbXSxcbiAgICAgIGlzUXVvdGVkOiBmYWxzZSxcbiAgICAgIGlzRHluYW1pYzogZmFsc2UsXG4gICAgICBzdGFydDogYi5wb3ModGhpcy50b2tlbml6ZXIubGluZSwgdGhpcy50b2tlbml6ZXIuY29sdW1uKSxcbiAgICAgIHZhbHVlU3RhcnRMaW5lOiAwLFxuICAgICAgdmFsdWVTdGFydENvbHVtbjogMCxcbiAgICB9O1xuICB9XG5cbiAgYXBwZW5kVG9BdHRyaWJ1dGVOYW1lKGNoYXI6IHN0cmluZykge1xuICAgIHRoaXMuY3VycmVudEF0dHIubmFtZSArPSBjaGFyO1xuICB9XG5cbiAgYmVnaW5BdHRyaWJ1dGVWYWx1ZShpc1F1b3RlZDogYm9vbGVhbikge1xuICAgIHRoaXMuY3VycmVudEF0dHIuaXNRdW90ZWQgPSBpc1F1b3RlZDtcbiAgICB0aGlzLmN1cnJlbnRBdHRyLnZhbHVlU3RhcnRMaW5lID0gdGhpcy50b2tlbml6ZXIubGluZTtcbiAgICB0aGlzLmN1cnJlbnRBdHRyLnZhbHVlU3RhcnRDb2x1bW4gPSB0aGlzLnRva2VuaXplci5jb2x1bW47XG4gIH1cblxuICBhcHBlbmRUb0F0dHJpYnV0ZVZhbHVlKGNoYXI6IHN0cmluZykge1xuICAgIGxldCBwYXJ0cyA9IHRoaXMuY3VycmVudEF0dHIucGFydHM7XG4gICAgbGV0IGxhc3RQYXJ0ID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV07XG5cbiAgICBpZiAobGFzdFBhcnQgJiYgbGFzdFBhcnQudHlwZSA9PT0gJ1RleHROb2RlJykge1xuICAgICAgbGFzdFBhcnQuY2hhcnMgKz0gY2hhcjtcblxuICAgICAgLy8gdXBkYXRlIGVuZCBsb2NhdGlvbiBmb3IgZWFjaCBhZGRlZCBjaGFyXG4gICAgICBsYXN0UGFydC5sb2MuZW5kLmxpbmUgPSB0aGlzLnRva2VuaXplci5saW5lO1xuICAgICAgbGFzdFBhcnQubG9jLmVuZC5jb2x1bW4gPSB0aGlzLnRva2VuaXplci5jb2x1bW47XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGluaXRpYWxseSBhc3N1bWUgdGhlIHRleHQgbm9kZSBpcyBhIHNpbmdsZSBjaGFyXG4gICAgICBsZXQgbG9jID0gYi5sb2MoXG4gICAgICAgIHRoaXMudG9rZW5pemVyLmxpbmUsXG4gICAgICAgIHRoaXMudG9rZW5pemVyLmNvbHVtbixcbiAgICAgICAgdGhpcy50b2tlbml6ZXIubGluZSxcbiAgICAgICAgdGhpcy50b2tlbml6ZXIuY29sdW1uXG4gICAgICApO1xuXG4gICAgICAvLyB0aGUgdG9rZW5pemVyIGxpbmUvY29sdW1uIGhhdmUgYWxyZWFkeSBiZWVuIGFkdmFuY2VkLCBjb3JyZWN0IGxvY2F0aW9uIGluZm9cbiAgICAgIGlmIChjaGFyID09PSAnXFxuJykge1xuICAgICAgICBsb2Muc3RhcnQubGluZSAtPSAxO1xuICAgICAgICBsb2Muc3RhcnQuY29sdW1uID0gbGFzdFBhcnQgPyBsYXN0UGFydC5sb2MuZW5kLmNvbHVtbiA6IHRoaXMuY3VycmVudEF0dHIudmFsdWVTdGFydENvbHVtbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvYy5zdGFydC5jb2x1bW4gLT0gMTtcbiAgICAgIH1cblxuICAgICAgbGV0IHRleHQgPSBiLnRleHQoY2hhciwgbG9jKTtcbiAgICAgIHBhcnRzLnB1c2godGV4dCk7XG4gICAgfVxuICB9XG5cbiAgZmluaXNoQXR0cmlidXRlVmFsdWUoKSB7XG4gICAgbGV0IHsgbmFtZSwgcGFydHMsIGlzUXVvdGVkLCBpc0R5bmFtaWMsIHZhbHVlU3RhcnRMaW5lLCB2YWx1ZVN0YXJ0Q29sdW1uIH0gPSB0aGlzLmN1cnJlbnRBdHRyO1xuICAgIGxldCB2YWx1ZSA9IGFzc2VtYmxlQXR0cmlidXRlVmFsdWUocGFydHMsIGlzUXVvdGVkLCBpc0R5bmFtaWMsIHRoaXMudG9rZW5pemVyLmxpbmUpO1xuICAgIHZhbHVlLmxvYyA9IGIubG9jKHZhbHVlU3RhcnRMaW5lLCB2YWx1ZVN0YXJ0Q29sdW1uLCB0aGlzLnRva2VuaXplci5saW5lLCB0aGlzLnRva2VuaXplci5jb2x1bW4pO1xuXG4gICAgbGV0IGxvYyA9IGIubG9jKFxuICAgICAgdGhpcy5jdXJyZW50QXR0ci5zdGFydC5saW5lLFxuICAgICAgdGhpcy5jdXJyZW50QXR0ci5zdGFydC5jb2x1bW4sXG4gICAgICB0aGlzLnRva2VuaXplci5saW5lLFxuICAgICAgdGhpcy50b2tlbml6ZXIuY29sdW1uXG4gICAgKTtcblxuICAgIGxldCBhdHRyaWJ1dGUgPSBiLmF0dHIobmFtZSwgdmFsdWUsIGxvYyk7XG5cbiAgICB0aGlzLmN1cnJlbnRTdGFydFRhZy5hdHRyaWJ1dGVzLnB1c2goYXR0cmlidXRlKTtcbiAgfVxuXG4gIHJlcG9ydFN5bnRheEVycm9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgIGBTeW50YXggZXJyb3IgYXQgbGluZSAke3RoaXMudG9rZW5pemVyLmxpbmV9IGNvbCAke3RoaXMudG9rZW5pemVyLmNvbHVtbn06ICR7bWVzc2FnZX1gLFxuICAgICAgYi5sb2ModGhpcy50b2tlbml6ZXIubGluZSwgdGhpcy50b2tlbml6ZXIuY29sdW1uKVxuICAgICk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZW1ibGVBdHRyaWJ1dGVWYWx1ZShcbiAgcGFydHM6IChBU1QuTXVzdGFjaGVTdGF0ZW1lbnQgfCBBU1QuVGV4dE5vZGUpW10sXG4gIGlzUXVvdGVkOiBib29sZWFuLFxuICBpc0R5bmFtaWM6IGJvb2xlYW4sXG4gIGxpbmU6IG51bWJlclxuKSB7XG4gIGlmIChpc0R5bmFtaWMpIHtcbiAgICBpZiAoaXNRdW90ZWQpIHtcbiAgICAgIHJldHVybiBhc3NlbWJsZUNvbmNhdGVuYXRlZFZhbHVlKHBhcnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKFxuICAgICAgICBwYXJ0cy5sZW5ndGggPT09IDEgfHxcbiAgICAgICAgKHBhcnRzLmxlbmd0aCA9PT0gMiAmJlxuICAgICAgICAgIHBhcnRzWzFdLnR5cGUgPT09ICdUZXh0Tm9kZScgJiZcbiAgICAgICAgICAocGFydHNbMV0gYXMgQVNULlRleHROb2RlKS5jaGFycyA9PT0gJy8nKVxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBwYXJ0c1swXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgICAgICBgQW4gdW5xdW90ZWQgYXR0cmlidXRlIHZhbHVlIG11c3QgYmUgYSBzdHJpbmcgb3IgYSBtdXN0YWNoZSwgYCArXG4gICAgICAgICAgICBgcHJlY2VlZGVkIGJ5IHdoaXRlc3BhY2Ugb3IgYSAnPScgY2hhcmFjdGVyLCBhbmQgYCArXG4gICAgICAgICAgICBgZm9sbG93ZWQgYnkgd2hpdGVzcGFjZSwgYSAnPicgY2hhcmFjdGVyLCBvciAnLz4nIChvbiBsaW5lICR7bGluZX0pYCxcbiAgICAgICAgICBiLmxvYyhsaW5lLCAwKVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcGFydHMubGVuZ3RoID4gMCA/IHBhcnRzWzBdIDogYi50ZXh0KCcnKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhc3NlbWJsZUNvbmNhdGVuYXRlZFZhbHVlKHBhcnRzOiAoQVNULk11c3RhY2hlU3RhdGVtZW50IHwgQVNULlRleHROb2RlKVtdKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgcGFydDogQVNULkJhc2VOb2RlID0gcGFydHNbaV07XG5cbiAgICBpZiAocGFydC50eXBlICE9PSAnTXVzdGFjaGVTdGF0ZW1lbnQnICYmIHBhcnQudHlwZSAhPT0gJ1RleHROb2RlJykge1xuICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgICAnVW5zdXBwb3J0ZWQgbm9kZSBpbiBxdW90ZWQgYXR0cmlidXRlIHZhbHVlOiAnICsgcGFydFsndHlwZSddLFxuICAgICAgICBwYXJ0LmxvY1xuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYi5jb25jYXQocGFydHMpO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUVuZFRhZyhcbiAgdGFnOiBUYWc8J1N0YXJ0VGFnJyB8ICdFbmRUYWcnPixcbiAgZWxlbWVudDogQVNULkVsZW1lbnROb2RlLFxuICBzZWxmQ2xvc2luZzogYm9vbGVhblxuKSB7XG4gIGxldCBlcnJvcjtcblxuICBpZiAodm9pZE1hcFt0YWcubmFtZV0gJiYgIXNlbGZDbG9zaW5nKSB7XG4gICAgLy8gRW5nVGFnIGlzIGFsc28gY2FsbGVkIGJ5IFN0YXJ0VGFnIGZvciB2b2lkIGFuZCBzZWxmLWNsb3NpbmcgdGFncyAoaS5lLlxuICAgIC8vIDxpbnB1dD4gb3IgPGJyIC8+LCBzbyB3ZSBuZWVkIHRvIGNoZWNrIGZvciB0aGF0IGhlcmUuIE90aGVyd2lzZSwgd2Ugd291bGRcbiAgICAvLyB0aHJvdyBhbiBlcnJvciBmb3IgdGhvc2UgY2FzZXMuXG4gICAgZXJyb3IgPSAnSW52YWxpZCBlbmQgdGFnICcgKyBmb3JtYXRFbmRUYWdJbmZvKHRhZykgKyAnICh2b2lkIGVsZW1lbnRzIGNhbm5vdCBoYXZlIGVuZCB0YWdzKS4nO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQudGFnID09PSB1bmRlZmluZWQpIHtcbiAgICBlcnJvciA9ICdDbG9zaW5nIHRhZyAnICsgZm9ybWF0RW5kVGFnSW5mbyh0YWcpICsgJyB3aXRob3V0IGFuIG9wZW4gdGFnLic7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC50YWcgIT09IHRhZy5uYW1lKSB7XG4gICAgZXJyb3IgPVxuICAgICAgJ0Nsb3NpbmcgdGFnICcgK1xuICAgICAgZm9ybWF0RW5kVGFnSW5mbyh0YWcpICtcbiAgICAgICcgZGlkIG5vdCBtYXRjaCBsYXN0IG9wZW4gdGFnIGAnICtcbiAgICAgIGVsZW1lbnQudGFnICtcbiAgICAgICdgIChvbiBsaW5lICcgK1xuICAgICAgZWxlbWVudC5sb2Muc3RhcnQubGluZSArXG4gICAgICAnKS4nO1xuICB9XG5cbiAgaWYgKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKGVycm9yLCBlbGVtZW50LmxvYyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZm9ybWF0RW5kVGFnSW5mbyh0YWc6IFRhZzwnU3RhcnRUYWcnIHwgJ0VuZFRhZyc+KSB7XG4gIHJldHVybiAnYCcgKyB0YWcubmFtZSArICdgIChvbiBsaW5lICcgKyB0YWcubG9jLmVuZC5saW5lICsgJyknO1xufVxuXG4vKipcbiAgQVNUUGx1Z2lucyBjYW4gbWFrZSBjaGFuZ2VzIHRvIHRoZSBHbGltbWVyIHRlbXBsYXRlIEFTVCBiZWZvcmVcbiAgY29tcGlsYXRpb24gYmVnaW5zLlxuKi9cbmV4cG9ydCBpbnRlcmZhY2UgQVNUUGx1Z2luQnVpbGRlciB7XG4gIChlbnY6IEFTVFBsdWdpbkVudmlyb25tZW50KTogQVNUUGx1Z2luO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFTVFBsdWdpbiB7XG4gIG5hbWU6IHN0cmluZztcbiAgdmlzaXRvcjogTm9kZVZpc2l0b3I7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQVNUUGx1Z2luRW52aXJvbm1lbnQge1xuICBtZXRhPzogb2JqZWN0O1xuICBzeW50YXg6IFN5bnRheDtcbn1cbmludGVyZmFjZSBIYW5kbGViYXJzUGFyc2VPcHRpb25zIHtcbiAgc3JjTmFtZT86IHN0cmluZztcbiAgaWdub3JlU3RhbmRhbG9uZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJlcHJvY2Vzc09wdGlvbnMge1xuICBtZXRhPzogb2JqZWN0O1xuICBwbHVnaW5zPzoge1xuICAgIGFzdD86IEFTVFBsdWdpbkJ1aWxkZXJbXTtcbiAgfTtcbiAgcGFyc2VPcHRpb25zPzogSGFuZGxlYmFyc1BhcnNlT3B0aW9ucztcblxuICAvKipcbiAgICBVc2VmdWwgZm9yIHNwZWNpZnlpbmcgYSBncm91cCBvZiBvcHRpb25zIHRvZ2V0aGVyLlxuXG4gICAgV2hlbiBgJ2NvZGVtb2QnYCB3ZSBkaXNhYmxlIGFsbCB3aGl0ZXNwYWNlIGNvbnRyb2wgaW4gaGFuZGxlYmFyc1xuICAgICh0byBwcmVzZXJ2ZSBhcyBtdWNoIGFzIHBvc3NpYmxlKSBhbmQgd2UgYWxzbyBhdm9pZCBhbnlcbiAgICBlc2NhcGluZy91bmVzY2FwaW5nIG9mIEhUTUwgZW50aXR5IGNvZGVzLlxuICAgKi9cbiAgbW9kZT86ICdjb2RlbW9kJyB8ICdwcmVjb21waWxlJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTeW50YXgge1xuICBwYXJzZTogdHlwZW9mIHByZXByb2Nlc3M7XG4gIGJ1aWxkZXJzOiB0eXBlb2YgYnVpbGRlcnM7XG4gIHByaW50OiB0eXBlb2YgcHJpbnQ7XG4gIHRyYXZlcnNlOiB0eXBlb2YgdHJhdmVyc2U7XG4gIFdhbGtlcjogdHlwZW9mIFdhbGtlcjtcbn1cblxuY29uc3Qgc3ludGF4OiBTeW50YXggPSB7XG4gIHBhcnNlOiBwcmVwcm9jZXNzLFxuICBidWlsZGVycyxcbiAgcHJpbnQsXG4gIHRyYXZlcnNlLFxuICBXYWxrZXIsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gcHJlcHJvY2VzcyhodG1sOiBzdHJpbmcsIG9wdGlvbnM6IFByZXByb2Nlc3NPcHRpb25zID0ge30pOiBBU1QuVGVtcGxhdGUge1xuICBsZXQgbW9kZSA9IG9wdGlvbnMubW9kZSB8fCAncHJlY29tcGlsZSc7XG5cbiAgbGV0IGFzdDogSEJTLlByb2dyYW07XG4gIGlmICh0eXBlb2YgaHRtbCA9PT0gJ29iamVjdCcpIHtcbiAgICBhc3QgPSBodG1sO1xuICB9IGVsc2UgaWYgKG1vZGUgPT09ICdjb2RlbW9kJykge1xuICAgIGFzdCA9IHBhcnNlV2l0aG91dFByb2Nlc3NpbmcoaHRtbCwgb3B0aW9ucy5wYXJzZU9wdGlvbnMpIGFzIEhCUy5Qcm9ncmFtO1xuICB9IGVsc2Uge1xuICAgIGFzdCA9IHBhcnNlKGh0bWwsIG9wdGlvbnMucGFyc2VPcHRpb25zKSBhcyBIQlMuUHJvZ3JhbTtcbiAgfVxuXG4gIGxldCBlbnRpdHlQYXJzZXIgPSB1bmRlZmluZWQ7XG4gIGlmIChtb2RlID09PSAnY29kZW1vZCcpIHtcbiAgICBlbnRpdHlQYXJzZXIgPSBuZXcgRW50aXR5UGFyc2VyKHt9KTtcbiAgfVxuXG4gIGxldCBwcm9ncmFtID0gbmV3IFRva2VuaXplckV2ZW50SGFuZGxlcnMoaHRtbCwgZW50aXR5UGFyc2VyKS5hY2NlcHRUZW1wbGF0ZShhc3QpO1xuXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMucGx1Z2lucyAmJiBvcHRpb25zLnBsdWdpbnMuYXN0KSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBvcHRpb25zLnBsdWdpbnMuYXN0Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGV0IHRyYW5zZm9ybSA9IG9wdGlvbnMucGx1Z2lucy5hc3RbaV07XG4gICAgICBsZXQgZW52OiBBU1RQbHVnaW5FbnZpcm9ubWVudCA9IGFzc2lnbih7fSwgb3B0aW9ucywgeyBzeW50YXggfSwgeyBwbHVnaW5zOiB1bmRlZmluZWQgfSk7XG5cbiAgICAgIGxldCBwbHVnaW5SZXN1bHQgPSB0cmFuc2Zvcm0oZW52KTtcblxuICAgICAgdHJhdmVyc2UocHJvZ3JhbSwgcGx1Z2luUmVzdWx0LnZpc2l0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwcm9ncmFtO1xufVxuIl0sIm5hbWVzIjpbImFzc2lnbiIsIkVudGl0eVBhcnNlciIsIm5hbWVkQ2hhclJlZnMiLCJFdmVudGVkVG9rZW5pemVyIiwiYiIsInR1cGxlIiwicHJpbnQiLCJwYXJzZVdpdGhvdXRQcm9jZXNzaW5nIiwicGFyc2UiXSwibWFwcGluZ3MiOiI7O0VBV0EsU0FBQSxhQUFBLENBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxLQUFBLEVBTXdCO0VBRXRCLE1BQUksT0FBQSxJQUFBLEtBQUosUUFBQSxFQUE4QjtFQUM1QixJQUFBLElBQUksR0FBRyxTQUFTLENBQWhCLElBQWdCLENBQWhCO0VBQ0Q7O0VBRUQsU0FBTztFQUNMLElBQUEsSUFBSSxFQURDLG1CQUFBO0VBRUwsSUFBQSxJQUZLLEVBRUwsSUFGSztFQUdMLElBQUEsTUFBTSxFQUFFLE1BQU0sSUFIVCxFQUFBO0VBSUwsSUFBQSxJQUFJLEVBQUUsSUFBSSxJQUFJLFNBQVMsQ0FKbEIsRUFJa0IsQ0FKbEI7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

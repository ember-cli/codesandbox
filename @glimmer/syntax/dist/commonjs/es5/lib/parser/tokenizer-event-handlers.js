"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.preprocess = preprocess;
exports.TokenizerEventHandlers = exports.voidMap = void 0;

var _builders = _interopRequireWildcard(require("../builders"));

var _utils = require("../utils");

var _handlebarsNodeVisitors = require("./handlebars-node-visitors");

var _syntaxError = _interopRequireDefault(require("../errors/syntax-error"));

var _traverse = _interopRequireDefault(require("../traversal/traverse"));

var _print = _interopRequireDefault(require("../generation/print"));

var _walker = _interopRequireDefault(require("../traversal/walker"));

var _parser = require("@handlebars/parser");

var _util = require("@glimmer/util");

var _simpleHtmlTokenizer = require("simple-html-tokenizer");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

var voidMap = Object.create(null);
exports.voidMap = voidMap;
var voidTagNames = 'area base br col command embed hr img input keygen link meta param source track wbr';
voidTagNames.split(' ').forEach(function (tagName) {
  voidMap[tagName] = true;
});

var TokenizerEventHandlers = /*#__PURE__*/function (_HandlebarsNodeVisito) {
  _inheritsLoose(TokenizerEventHandlers, _HandlebarsNodeVisito);

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
    this.currentNode = _builders.default.comment('');
    this.currentNode.loc = {
      source: null,
      start: _builders.default.pos(this.tagOpenLine, this.tagOpenColumn),
      end: null
    };
  };

  _proto.appendToCommentData = function appendToCommentData(_char) {
    this.currentComment.value += _char;
  };

  _proto.finishComment = function finishComment() {
    this.currentComment.loc.end = _builders.default.pos(this.tokenizer.line, this.tokenizer.column);
    (0, _utils.appendChild)(this.currentElement(), this.currentComment);
  } // Data
  ;

  _proto.beginData = function beginData() {
    this.currentNode = _builders.default.text();
    this.currentNode.loc = {
      source: null,
      start: _builders.default.pos(this.tokenizer.line, this.tokenizer.column),
      end: null
    };
  };

  _proto.appendToData = function appendToData(_char2) {
    this.currentData.chars += _char2;
  };

  _proto.finishData = function finishData() {
    this.currentData.loc.end = _builders.default.pos(this.tokenizer.line, this.tokenizer.column);
    (0, _utils.appendChild)(this.currentElement(), this.currentData);
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
      loc: _builders.SYNTHETIC
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
      loc: _builders.SYNTHETIC
    };
  };

  _proto.finishTag = function finishTag() {
    var _this$tokenizer = this.tokenizer,
        line = _this$tokenizer.line,
        column = _this$tokenizer.column;
    var tag = this.currentTag;
    tag.loc = _builders.default.loc(this.tagOpenLine, this.tagOpenColumn, line, column);

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

    var loc = _builders.default.loc(this.tagOpenLine, this.tagOpenColumn);

    var element = _builders.default.element({
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
    (0, _utils.parseElementBlockParams)(element);
    (0, _utils.appendChild)(parent, element);
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
      throw new _syntaxError.default("Invalid end tag: closing tag must not have attributes, " + ("in `" + tag.name + "` (on line " + this.tokenizer.line + ")."), tag.loc);
    }

    this.currentAttribute = {
      name: '',
      parts: [],
      isQuoted: false,
      isDynamic: false,
      start: _builders.default.pos(this.tokenizer.line, this.tokenizer.column),
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
      var loc = _builders.default.loc(this.tokenizer.line, this.tokenizer.column, this.tokenizer.line, this.tokenizer.column); // the tokenizer line/column have already been advanced, correct location info


      if (_char5 === '\n') {
        loc.start.line -= 1;
        loc.start.column = lastPart ? lastPart.loc.end.column : this.currentAttr.valueStartColumn;
      } else {
        loc.start.column -= 1;
      }

      var text = _builders.default.text(_char5, loc);

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
    value.loc = _builders.default.loc(valueStartLine, valueStartColumn, this.tokenizer.line, this.tokenizer.column);

    var loc = _builders.default.loc(this.currentAttr.start.line, this.currentAttr.start.column, this.tokenizer.line, this.tokenizer.column);

    var attribute = _builders.default.attr(name, value, loc);

    this.currentStartTag.attributes.push(attribute);
  };

  _proto.reportSyntaxError = function reportSyntaxError(message) {
    throw new _syntaxError.default("Syntax error at line " + this.tokenizer.line + " col " + this.tokenizer.column + ": " + message, _builders.default.loc(this.tokenizer.line, this.tokenizer.column));
  };

  return TokenizerEventHandlers;
}(_handlebarsNodeVisitors.HandlebarsNodeVisitors);

exports.TokenizerEventHandlers = TokenizerEventHandlers;

function assembleAttributeValue(parts, isQuoted, isDynamic, line) {
  if (isDynamic) {
    if (isQuoted) {
      return assembleConcatenatedValue(parts);
    } else {
      if (parts.length === 1 || parts.length === 2 && parts[1].type === 'TextNode' && parts[1].chars === '/') {
        return parts[0];
      } else {
        throw new _syntaxError.default("An unquoted attribute value must be a string or a mustache, " + "preceeded by whitespace or a '=' character, and " + ("followed by whitespace, a '>' character, or '/>' (on line " + line + ")"), _builders.default.loc(line, 0));
      }
    }
  } else {
    return parts.length > 0 ? parts[0] : _builders.default.text('');
  }
}

function assembleConcatenatedValue(parts) {
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];

    if (part.type !== 'MustacheStatement' && part.type !== 'TextNode') {
      throw new _syntaxError.default('Unsupported node in quoted attribute value: ' + part['type'], part.loc);
    }
  }

  return _builders.default.concat(parts);
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
    throw new _syntaxError.default(error, element.loc);
  }
}

function formatEndTagInfo(tag) {
  return '`' + tag.name + '` (on line ' + tag.loc.end.line + ')';
}

var syntax = {
  parse: preprocess,
  builders: _builders.default,
  print: _print.default,
  traverse: _traverse.default,
  Walker: _walker.default
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
    ast = (0, _parser.parseWithoutProcessing)(html, options.parseOptions);
  } else {
    ast = (0, _parser.parse)(html, options.parseOptions);
  }

  var entityParser = undefined;

  if (mode === 'codemod') {
    entityParser = new _simpleHtmlTokenizer.EntityParser({});
  }

  var program = new TokenizerEventHandlers(html, entityParser).acceptTemplate(ast);

  if (options && options.plugins && options.plugins.ast) {
    for (var i = 0, l = options.plugins.ast.length; i < l; i++) {
      var transform = options.plugins.ast[i];
      var env = (0, _util.assign)({}, options, {
        syntax: syntax
      }, {
        plugins: undefined
      });
      var pluginResult = transform(env);
      (0, _traverse.default)(program, pluginResult.visitor);
    }
  }

  return program;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3N5bnRheC9saWIvcGFyc2VyL3Rva2VuaXplci1ldmVudC1oYW5kbGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUdBOztBQUdBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOzs7Ozs7Ozs7Ozs7OztBQUVPLElBQU0sT0FBTyxHQUVoQixNQUFNLENBQU4sTUFBQSxDQUZHLElBRUgsQ0FGRzs7QUFJUCxJQUFJLFlBQVksR0FBaEIscUZBQUE7QUFFQSxZQUFZLENBQVosS0FBQSxDQUFBLEdBQUEsRUFBQSxPQUFBLENBQWlDLFVBQUQsT0FBQyxFQUFXO0FBQzFDLEVBQUEsT0FBTyxDQUFQLE9BQU8sQ0FBUCxHQUFBLElBQUE7QUFERixDQUFBOztBQUlBLElBQU0sc0JBQU4sR0FBQSxhQUFBLFVBQUEscUJBQUEsRUFBQTtBQUFBLEVBQUEsY0FBQSxDQUFBLHNCQUFBLEVBQUEscUJBQUEsQ0FBQTs7QUFBQSxXQUFBLHNCQUFBLEdBQUE7QUFBQSxRQUFBLEtBQUE7OztBQUNVLElBQUEsS0FBQSxDQUFBLFdBQUEsR0FBQSxDQUFBO0FBQ0EsSUFBQSxLQUFBLENBQUEsYUFBQSxHQUFBLENBQUE7QUFGVixXQUFBLEtBQUE7QUEwTkM7O0FBMU5ELE1BQUEsTUFBQSxHQUFBLHNCQUFBLENBQUEsU0FBQTs7QUFBQSxFQUFBLE1BQUEsQ0FBQSxLQUFBLEdBSUUsU0FBQSxLQUFBLEdBQUs7QUFDSCxTQUFBLFdBQUEsR0FBQSxJQUFBO0FBTEosR0FBQSxDQVFFO0FBUkY7O0FBQUEsRUFBQSxNQUFBLENBQUEsWUFBQSxHQVVFLFNBQUEsWUFBQSxHQUFZO0FBQ1YsU0FBQSxXQUFBLEdBQW1CLGtCQUFBLE9BQUEsQ0FBbkIsRUFBbUIsQ0FBbkI7QUFDQSxTQUFBLFdBQUEsQ0FBQSxHQUFBLEdBQXVCO0FBQ3JCLE1BQUEsTUFBTSxFQURlLElBQUE7QUFF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TCxDQUFBLEVBQVcsQ0FBQyxHQUFHLE9BQU8sQ0FBUCxPQUFBLENBQUEsR0FBQSxDQUFwQixNQUFBLEVBQWdELENBQUMsR0FBakQsQ0FBQSxFQUF1RCxDQUF2RCxFQUFBLEVBQTREO0FBQzFELFVBQUksU0FBUyxHQUFHLE9BQU8sQ0FBUCxPQUFBLENBQUEsR0FBQSxDQUFoQixDQUFnQixDQUFoQjtBQUNBLFVBQUksR0FBRyxHQUF5QixrQkFBTSxFQUFOLEVBQU0sT0FBTixFQUFvQjtBQUFFLFFBQUEsTUFBQSxFQUFBO0FBQUYsT0FBcEIsRUFBZ0M7QUFBRSxRQUFBLE9BQU8sRUFBRTtBQUFYLE9BQWhDLENBQWhDO0FBRUEsVUFBSSxZQUFZLEdBQUcsU0FBUyxDQUE1QixHQUE0QixDQUE1QjtBQUVBLDZCQUFRLE9BQVIsRUFBa0IsWUFBWSxDQUE5QixPQUFBO0FBQ0Q7QUFDRjs7QUFFRCxTQUFBLE9BQUE7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBiLCB7IFNZTlRIRVRJQyB9IGZyb20gJy4uL2J1aWxkZXJzJztcbmltcG9ydCB7IGFwcGVuZENoaWxkLCBwYXJzZUVsZW1lbnRCbG9ja1BhcmFtcyB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IEhhbmRsZWJhcnNOb2RlVmlzaXRvcnMgfSBmcm9tICcuL2hhbmRsZWJhcnMtbm9kZS12aXNpdG9ycyc7XG5pbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi4vdHlwZXMvbm9kZXMnO1xuaW1wb3J0ICogYXMgSEJTIGZyb20gJy4uL3R5cGVzL2hhbmRsZWJhcnMtYXN0JztcbmltcG9ydCBTeW50YXhFcnJvciBmcm9tICcuLi9lcnJvcnMvc3ludGF4LWVycm9yJztcbmltcG9ydCB7IFRhZyB9IGZyb20gJy4uL3BhcnNlcic7XG5pbXBvcnQgYnVpbGRlcnMgZnJvbSAnLi4vYnVpbGRlcnMnO1xuaW1wb3J0IHRyYXZlcnNlIGZyb20gJy4uL3RyYXZlcnNhbC90cmF2ZXJzZSc7XG5pbXBvcnQgcHJpbnQgZnJvbSAnLi4vZ2VuZXJhdGlvbi9wcmludCc7XG5pbXBvcnQgV2Fsa2VyIGZyb20gJy4uL3RyYXZlcnNhbC93YWxrZXInO1xuaW1wb3J0IHsgcGFyc2UsIHBhcnNlV2l0aG91dFByb2Nlc3NpbmcgfSBmcm9tICdAaGFuZGxlYmFycy9wYXJzZXInO1xuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnQGdsaW1tZXIvdXRpbCc7XG5pbXBvcnQgeyBOb2RlVmlzaXRvciB9IGZyb20gJy4uL3RyYXZlcnNhbC92aXNpdG9yJztcbmltcG9ydCB7IEVudGl0eVBhcnNlciB9IGZyb20gJ3NpbXBsZS1odG1sLXRva2VuaXplcic7XG5cbmV4cG9ydCBjb25zdCB2b2lkTWFwOiB7XG4gIFt0YWdOYW1lOiBzdHJpbmddOiBib29sZWFuO1xufSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbmxldCB2b2lkVGFnTmFtZXMgPVxuICAnYXJlYSBiYXNlIGJyIGNvbCBjb21tYW5kIGVtYmVkIGhyIGltZyBpbnB1dCBrZXlnZW4gbGluayBtZXRhIHBhcmFtIHNvdXJjZSB0cmFjayB3YnInO1xudm9pZFRhZ05hbWVzLnNwbGl0KCcgJykuZm9yRWFjaCgodGFnTmFtZSkgPT4ge1xuICB2b2lkTWFwW3RhZ05hbWVdID0gdHJ1ZTtcbn0pO1xuXG5leHBvcnQgY2xhc3MgVG9rZW5pemVyRXZlbnRIYW5kbGVycyBleHRlbmRzIEhhbmRsZWJhcnNOb2RlVmlzaXRvcnMge1xuICBwcml2YXRlIHRhZ09wZW5MaW5lID0gMDtcbiAgcHJpdmF0ZSB0YWdPcGVuQ29sdW1uID0gMDtcblxuICByZXNldCgpIHtcbiAgICB0aGlzLmN1cnJlbnROb2RlID0gbnVsbDtcbiAgfVxuXG4gIC8vIENvbW1lbnRcblxuICBiZWdpbkNvbW1lbnQoKSB7XG4gICAgdGhpcy5jdXJyZW50Tm9kZSA9IGIuY29tbWVudCgnJyk7XG4gICAgdGhpcy5jdXJyZW50Tm9kZS5sb2MgPSB7XG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgICBzdGFydDogYi5wb3ModGhpcy50YWdPcGVuTGluZSwgdGhpcy50YWdPcGVuQ29sdW1uKSxcbiAgICAgIGVuZDogKG51bGwgYXMgYW55KSBhcyBBU1QuUG9zaXRpb24sXG4gICAgfTtcbiAgfVxuXG4gIGFwcGVuZFRvQ29tbWVudERhdGEoY2hhcjogc3RyaW5nKSB7XG4gICAgdGhpcy5jdXJyZW50Q29tbWVudC52YWx1ZSArPSBjaGFyO1xuICB9XG5cbiAgZmluaXNoQ29tbWVudCgpIHtcbiAgICB0aGlzLmN1cnJlbnRDb21tZW50LmxvYy5lbmQgPSBiLnBvcyh0aGlzLnRva2VuaXplci5saW5lLCB0aGlzLnRva2VuaXplci5jb2x1bW4pO1xuXG4gICAgYXBwZW5kQ2hpbGQodGhpcy5jdXJyZW50RWxlbWVudCgpLCB0aGlzLmN1cnJlbnRDb21tZW50KTtcbiAgfVxuXG4gIC8vIERhdGFcblxuICBiZWdpbkRhdGEoKSB7XG4gICAgdGhpcy5jdXJyZW50Tm9kZSA9IGIudGV4dCgpO1xuICAgIHRoaXMuY3VycmVudE5vZGUubG9jID0ge1xuICAgICAgc291cmNlOiBudWxsLFxuICAgICAgc3RhcnQ6IGIucG9zKHRoaXMudG9rZW5pemVyLmxpbmUsIHRoaXMudG9rZW5pemVyLmNvbHVtbiksXG4gICAgICBlbmQ6IChudWxsIGFzIGFueSkgYXMgQVNULlBvc2l0aW9uLFxuICAgIH07XG4gIH1cblxuICBhcHBlbmRUb0RhdGEoY2hhcjogc3RyaW5nKSB7XG4gICAgdGhpcy5jdXJyZW50RGF0YS5jaGFycyArPSBjaGFyO1xuICB9XG5cbiAgZmluaXNoRGF0YSgpIHtcbiAgICB0aGlzLmN1cnJlbnREYXRhLmxvYy5lbmQgPSBiLnBvcyh0aGlzLnRva2VuaXplci5saW5lLCB0aGlzLnRva2VuaXplci5jb2x1bW4pO1xuXG4gICAgYXBwZW5kQ2hpbGQodGhpcy5jdXJyZW50RWxlbWVudCgpLCB0aGlzLmN1cnJlbnREYXRhKTtcbiAgfVxuXG4gIC8vIFRhZ3MgLSBiYXNpY1xuXG4gIHRhZ09wZW4oKSB7XG4gICAgdGhpcy50YWdPcGVuTGluZSA9IHRoaXMudG9rZW5pemVyLmxpbmU7XG4gICAgdGhpcy50YWdPcGVuQ29sdW1uID0gdGhpcy50b2tlbml6ZXIuY29sdW1uO1xuICB9XG5cbiAgYmVnaW5TdGFydFRhZygpIHtcbiAgICB0aGlzLmN1cnJlbnROb2RlID0ge1xuICAgICAgdHlwZTogJ1N0YXJ0VGFnJyxcbiAgICAgIG5hbWU6ICcnLFxuICAgICAgYXR0cmlidXRlczogW10sXG4gICAgICBtb2RpZmllcnM6IFtdLFxuICAgICAgY29tbWVudHM6IFtdLFxuICAgICAgc2VsZkNsb3Npbmc6IGZhbHNlLFxuICAgICAgbG9jOiBTWU5USEVUSUMsXG4gICAgfTtcbiAgfVxuXG4gIGJlZ2luRW5kVGFnKCkge1xuICAgIHRoaXMuY3VycmVudE5vZGUgPSB7XG4gICAgICB0eXBlOiAnRW5kVGFnJyxcbiAgICAgIG5hbWU6ICcnLFxuICAgICAgYXR0cmlidXRlczogW10sXG4gICAgICBtb2RpZmllcnM6IFtdLFxuICAgICAgY29tbWVudHM6IFtdLFxuICAgICAgc2VsZkNsb3Npbmc6IGZhbHNlLFxuICAgICAgbG9jOiBTWU5USEVUSUMsXG4gICAgfTtcbiAgfVxuXG4gIGZpbmlzaFRhZygpIHtcbiAgICBsZXQgeyBsaW5lLCBjb2x1bW4gfSA9IHRoaXMudG9rZW5pemVyO1xuXG4gICAgbGV0IHRhZyA9IHRoaXMuY3VycmVudFRhZztcbiAgICB0YWcubG9jID0gYi5sb2ModGhpcy50YWdPcGVuTGluZSwgdGhpcy50YWdPcGVuQ29sdW1uLCBsaW5lLCBjb2x1bW4pO1xuXG4gICAgaWYgKHRhZy50eXBlID09PSAnU3RhcnRUYWcnKSB7XG4gICAgICB0aGlzLmZpbmlzaFN0YXJ0VGFnKCk7XG5cbiAgICAgIGlmICh2b2lkTWFwW3RhZy5uYW1lXSB8fCB0YWcuc2VsZkNsb3NpbmcpIHtcbiAgICAgICAgdGhpcy5maW5pc2hFbmRUYWcodHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0YWcudHlwZSA9PT0gJ0VuZFRhZycpIHtcbiAgICAgIHRoaXMuZmluaXNoRW5kVGFnKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBmaW5pc2hTdGFydFRhZygpIHtcbiAgICBsZXQgeyBuYW1lLCBhdHRyaWJ1dGVzOiBhdHRycywgbW9kaWZpZXJzLCBjb21tZW50cywgc2VsZkNsb3NpbmcgfSA9IHRoaXMuY3VycmVudFN0YXJ0VGFnO1xuICAgIGxldCBsb2MgPSBiLmxvYyh0aGlzLnRhZ09wZW5MaW5lLCB0aGlzLnRhZ09wZW5Db2x1bW4pO1xuICAgIGxldCBlbGVtZW50ID0gYi5lbGVtZW50KHsgbmFtZSwgc2VsZkNsb3NpbmcgfSwgeyBhdHRycywgbW9kaWZpZXJzLCBjb21tZW50cywgbG9jIH0pO1xuICAgIHRoaXMuZWxlbWVudFN0YWNrLnB1c2goZWxlbWVudCk7XG4gIH1cblxuICBmaW5pc2hFbmRUYWcoaXNWb2lkOiBib29sZWFuKSB7XG4gICAgbGV0IHRhZyA9IHRoaXMuY3VycmVudFRhZztcblxuICAgIGxldCBlbGVtZW50ID0gdGhpcy5lbGVtZW50U3RhY2sucG9wKCkgYXMgQVNULkVsZW1lbnROb2RlO1xuICAgIGxldCBwYXJlbnQgPSB0aGlzLmN1cnJlbnRFbGVtZW50KCk7XG5cbiAgICB2YWxpZGF0ZUVuZFRhZyh0YWcsIGVsZW1lbnQsIGlzVm9pZCk7XG5cbiAgICBlbGVtZW50LmxvYy5lbmQubGluZSA9IHRoaXMudG9rZW5pemVyLmxpbmU7XG4gICAgZWxlbWVudC5sb2MuZW5kLmNvbHVtbiA9IHRoaXMudG9rZW5pemVyLmNvbHVtbjtcblxuICAgIHBhcnNlRWxlbWVudEJsb2NrUGFyYW1zKGVsZW1lbnQpO1xuICAgIGFwcGVuZENoaWxkKHBhcmVudCwgZWxlbWVudCk7XG4gIH1cblxuICBtYXJrVGFnQXNTZWxmQ2xvc2luZygpIHtcbiAgICB0aGlzLmN1cnJlbnRUYWcuc2VsZkNsb3NpbmcgPSB0cnVlO1xuICB9XG5cbiAgLy8gVGFncyAtIG5hbWVcblxuICBhcHBlbmRUb1RhZ05hbWUoY2hhcjogc3RyaW5nKSB7XG4gICAgdGhpcy5jdXJyZW50VGFnLm5hbWUgKz0gY2hhcjtcbiAgfVxuXG4gIC8vIFRhZ3MgLSBhdHRyaWJ1dGVzXG5cbiAgYmVnaW5BdHRyaWJ1dGUoKSB7XG4gICAgbGV0IHRhZyA9IHRoaXMuY3VycmVudFRhZztcbiAgICBpZiAodGFnLnR5cGUgPT09ICdFbmRUYWcnKSB7XG4gICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgIGBJbnZhbGlkIGVuZCB0YWc6IGNsb3NpbmcgdGFnIG11c3Qgbm90IGhhdmUgYXR0cmlidXRlcywgYCArXG4gICAgICAgICAgYGluIFxcYCR7dGFnLm5hbWV9XFxgIChvbiBsaW5lICR7dGhpcy50b2tlbml6ZXIubGluZX0pLmAsXG4gICAgICAgIHRhZy5sb2NcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50QXR0cmlidXRlID0ge1xuICAgICAgbmFtZTogJycsXG4gICAgICBwYXJ0czogW10sXG4gICAgICBpc1F1b3RlZDogZmFsc2UsXG4gICAgICBpc0R5bmFtaWM6IGZhbHNlLFxuICAgICAgc3RhcnQ6IGIucG9zKHRoaXMudG9rZW5pemVyLmxpbmUsIHRoaXMudG9rZW5pemVyLmNvbHVtbiksXG4gICAgICB2YWx1ZVN0YXJ0TGluZTogMCxcbiAgICAgIHZhbHVlU3RhcnRDb2x1bW46IDAsXG4gICAgfTtcbiAgfVxuXG4gIGFwcGVuZFRvQXR0cmlidXRlTmFtZShjaGFyOiBzdHJpbmcpIHtcbiAgICB0aGlzLmN1cnJlbnRBdHRyLm5hbWUgKz0gY2hhcjtcbiAgfVxuXG4gIGJlZ2luQXR0cmlidXRlVmFsdWUoaXNRdW90ZWQ6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmN1cnJlbnRBdHRyLmlzUXVvdGVkID0gaXNRdW90ZWQ7XG4gICAgdGhpcy5jdXJyZW50QXR0ci52YWx1ZVN0YXJ0TGluZSA9IHRoaXMudG9rZW5pemVyLmxpbmU7XG4gICAgdGhpcy5jdXJyZW50QXR0ci52YWx1ZVN0YXJ0Q29sdW1uID0gdGhpcy50b2tlbml6ZXIuY29sdW1uO1xuICB9XG5cbiAgYXBwZW5kVG9BdHRyaWJ1dGVWYWx1ZShjaGFyOiBzdHJpbmcpIHtcbiAgICBsZXQgcGFydHMgPSB0aGlzLmN1cnJlbnRBdHRyLnBhcnRzO1xuICAgIGxldCBsYXN0UGFydCA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdO1xuXG4gICAgaWYgKGxhc3RQYXJ0ICYmIGxhc3RQYXJ0LnR5cGUgPT09ICdUZXh0Tm9kZScpIHtcbiAgICAgIGxhc3RQYXJ0LmNoYXJzICs9IGNoYXI7XG5cbiAgICAgIC8vIHVwZGF0ZSBlbmQgbG9jYXRpb24gZm9yIGVhY2ggYWRkZWQgY2hhclxuICAgICAgbGFzdFBhcnQubG9jLmVuZC5saW5lID0gdGhpcy50b2tlbml6ZXIubGluZTtcbiAgICAgIGxhc3RQYXJ0LmxvYy5lbmQuY29sdW1uID0gdGhpcy50b2tlbml6ZXIuY29sdW1uO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpbml0aWFsbHkgYXNzdW1lIHRoZSB0ZXh0IG5vZGUgaXMgYSBzaW5nbGUgY2hhclxuICAgICAgbGV0IGxvYyA9IGIubG9jKFxuICAgICAgICB0aGlzLnRva2VuaXplci5saW5lLFxuICAgICAgICB0aGlzLnRva2VuaXplci5jb2x1bW4sXG4gICAgICAgIHRoaXMudG9rZW5pemVyLmxpbmUsXG4gICAgICAgIHRoaXMudG9rZW5pemVyLmNvbHVtblxuICAgICAgKTtcblxuICAgICAgLy8gdGhlIHRva2VuaXplciBsaW5lL2NvbHVtbiBoYXZlIGFscmVhZHkgYmVlbiBhZHZhbmNlZCwgY29ycmVjdCBsb2NhdGlvbiBpbmZvXG4gICAgICBpZiAoY2hhciA9PT0gJ1xcbicpIHtcbiAgICAgICAgbG9jLnN0YXJ0LmxpbmUgLT0gMTtcbiAgICAgICAgbG9jLnN0YXJ0LmNvbHVtbiA9IGxhc3RQYXJ0ID8gbGFzdFBhcnQubG9jLmVuZC5jb2x1bW4gOiB0aGlzLmN1cnJlbnRBdHRyLnZhbHVlU3RhcnRDb2x1bW47XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2Muc3RhcnQuY29sdW1uIC09IDE7XG4gICAgICB9XG5cbiAgICAgIGxldCB0ZXh0ID0gYi50ZXh0KGNoYXIsIGxvYyk7XG4gICAgICBwYXJ0cy5wdXNoKHRleHQpO1xuICAgIH1cbiAgfVxuXG4gIGZpbmlzaEF0dHJpYnV0ZVZhbHVlKCkge1xuICAgIGxldCB7IG5hbWUsIHBhcnRzLCBpc1F1b3RlZCwgaXNEeW5hbWljLCB2YWx1ZVN0YXJ0TGluZSwgdmFsdWVTdGFydENvbHVtbiB9ID0gdGhpcy5jdXJyZW50QXR0cjtcbiAgICBsZXQgdmFsdWUgPSBhc3NlbWJsZUF0dHJpYnV0ZVZhbHVlKHBhcnRzLCBpc1F1b3RlZCwgaXNEeW5hbWljLCB0aGlzLnRva2VuaXplci5saW5lKTtcbiAgICB2YWx1ZS5sb2MgPSBiLmxvYyh2YWx1ZVN0YXJ0TGluZSwgdmFsdWVTdGFydENvbHVtbiwgdGhpcy50b2tlbml6ZXIubGluZSwgdGhpcy50b2tlbml6ZXIuY29sdW1uKTtcblxuICAgIGxldCBsb2MgPSBiLmxvYyhcbiAgICAgIHRoaXMuY3VycmVudEF0dHIuc3RhcnQubGluZSxcbiAgICAgIHRoaXMuY3VycmVudEF0dHIuc3RhcnQuY29sdW1uLFxuICAgICAgdGhpcy50b2tlbml6ZXIubGluZSxcbiAgICAgIHRoaXMudG9rZW5pemVyLmNvbHVtblxuICAgICk7XG5cbiAgICBsZXQgYXR0cmlidXRlID0gYi5hdHRyKG5hbWUsIHZhbHVlLCBsb2MpO1xuXG4gICAgdGhpcy5jdXJyZW50U3RhcnRUYWcuYXR0cmlidXRlcy5wdXNoKGF0dHJpYnV0ZSk7XG4gIH1cblxuICByZXBvcnRTeW50YXhFcnJvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICBgU3ludGF4IGVycm9yIGF0IGxpbmUgJHt0aGlzLnRva2VuaXplci5saW5lfSBjb2wgJHt0aGlzLnRva2VuaXplci5jb2x1bW59OiAke21lc3NhZ2V9YCxcbiAgICAgIGIubG9jKHRoaXMudG9rZW5pemVyLmxpbmUsIHRoaXMudG9rZW5pemVyLmNvbHVtbilcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFzc2VtYmxlQXR0cmlidXRlVmFsdWUoXG4gIHBhcnRzOiAoQVNULk11c3RhY2hlU3RhdGVtZW50IHwgQVNULlRleHROb2RlKVtdLFxuICBpc1F1b3RlZDogYm9vbGVhbixcbiAgaXNEeW5hbWljOiBib29sZWFuLFxuICBsaW5lOiBudW1iZXJcbikge1xuICBpZiAoaXNEeW5hbWljKSB7XG4gICAgaWYgKGlzUXVvdGVkKSB7XG4gICAgICByZXR1cm4gYXNzZW1ibGVDb25jYXRlbmF0ZWRWYWx1ZShwYXJ0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChcbiAgICAgICAgcGFydHMubGVuZ3RoID09PSAxIHx8XG4gICAgICAgIChwYXJ0cy5sZW5ndGggPT09IDIgJiZcbiAgICAgICAgICBwYXJ0c1sxXS50eXBlID09PSAnVGV4dE5vZGUnICYmXG4gICAgICAgICAgKHBhcnRzWzFdIGFzIEFTVC5UZXh0Tm9kZSkuY2hhcnMgPT09ICcvJylcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gcGFydHNbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgICAgYEFuIHVucXVvdGVkIGF0dHJpYnV0ZSB2YWx1ZSBtdXN0IGJlIGEgc3RyaW5nIG9yIGEgbXVzdGFjaGUsIGAgK1xuICAgICAgICAgICAgYHByZWNlZWRlZCBieSB3aGl0ZXNwYWNlIG9yIGEgJz0nIGNoYXJhY3RlciwgYW5kIGAgK1xuICAgICAgICAgICAgYGZvbGxvd2VkIGJ5IHdoaXRlc3BhY2UsIGEgJz4nIGNoYXJhY3Rlciwgb3IgJy8+JyAob24gbGluZSAke2xpbmV9KWAsXG4gICAgICAgICAgYi5sb2MobGluZSwgMClcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHBhcnRzLmxlbmd0aCA+IDAgPyBwYXJ0c1swXSA6IGIudGV4dCgnJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZW1ibGVDb25jYXRlbmF0ZWRWYWx1ZShwYXJ0czogKEFTVC5NdXN0YWNoZVN0YXRlbWVudCB8IEFTVC5UZXh0Tm9kZSlbXSkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHBhcnQ6IEFTVC5CYXNlTm9kZSA9IHBhcnRzW2ldO1xuXG4gICAgaWYgKHBhcnQudHlwZSAhPT0gJ011c3RhY2hlU3RhdGVtZW50JyAmJiBwYXJ0LnR5cGUgIT09ICdUZXh0Tm9kZScpIHtcbiAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgICAgJ1Vuc3VwcG9ydGVkIG5vZGUgaW4gcXVvdGVkIGF0dHJpYnV0ZSB2YWx1ZTogJyArIHBhcnRbJ3R5cGUnXSxcbiAgICAgICAgcGFydC5sb2NcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGIuY29uY2F0KHBhcnRzKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVFbmRUYWcoXG4gIHRhZzogVGFnPCdTdGFydFRhZycgfCAnRW5kVGFnJz4sXG4gIGVsZW1lbnQ6IEFTVC5FbGVtZW50Tm9kZSxcbiAgc2VsZkNsb3Npbmc6IGJvb2xlYW5cbikge1xuICBsZXQgZXJyb3I7XG5cbiAgaWYgKHZvaWRNYXBbdGFnLm5hbWVdICYmICFzZWxmQ2xvc2luZykge1xuICAgIC8vIEVuZ1RhZyBpcyBhbHNvIGNhbGxlZCBieSBTdGFydFRhZyBmb3Igdm9pZCBhbmQgc2VsZi1jbG9zaW5nIHRhZ3MgKGkuZS5cbiAgICAvLyA8aW5wdXQ+IG9yIDxiciAvPiwgc28gd2UgbmVlZCB0byBjaGVjayBmb3IgdGhhdCBoZXJlLiBPdGhlcndpc2UsIHdlIHdvdWxkXG4gICAgLy8gdGhyb3cgYW4gZXJyb3IgZm9yIHRob3NlIGNhc2VzLlxuICAgIGVycm9yID0gJ0ludmFsaWQgZW5kIHRhZyAnICsgZm9ybWF0RW5kVGFnSW5mbyh0YWcpICsgJyAodm9pZCBlbGVtZW50cyBjYW5ub3QgaGF2ZSBlbmQgdGFncykuJztcbiAgfSBlbHNlIGlmIChlbGVtZW50LnRhZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZXJyb3IgPSAnQ2xvc2luZyB0YWcgJyArIGZvcm1hdEVuZFRhZ0luZm8odGFnKSArICcgd2l0aG91dCBhbiBvcGVuIHRhZy4nO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQudGFnICE9PSB0YWcubmFtZSkge1xuICAgIGVycm9yID1cbiAgICAgICdDbG9zaW5nIHRhZyAnICtcbiAgICAgIGZvcm1hdEVuZFRhZ0luZm8odGFnKSArXG4gICAgICAnIGRpZCBub3QgbWF0Y2ggbGFzdCBvcGVuIHRhZyBgJyArXG4gICAgICBlbGVtZW50LnRhZyArXG4gICAgICAnYCAob24gbGluZSAnICtcbiAgICAgIGVsZW1lbnQubG9jLnN0YXJ0LmxpbmUgK1xuICAgICAgJykuJztcbiAgfVxuXG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihlcnJvciwgZWxlbWVudC5sb2MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEVuZFRhZ0luZm8odGFnOiBUYWc8J1N0YXJ0VGFnJyB8ICdFbmRUYWcnPikge1xuICByZXR1cm4gJ2AnICsgdGFnLm5hbWUgKyAnYCAob24gbGluZSAnICsgdGFnLmxvYy5lbmQubGluZSArICcpJztcbn1cblxuLyoqXG4gIEFTVFBsdWdpbnMgY2FuIG1ha2UgY2hhbmdlcyB0byB0aGUgR2xpbW1lciB0ZW1wbGF0ZSBBU1QgYmVmb3JlXG4gIGNvbXBpbGF0aW9uIGJlZ2lucy5cbiovXG5leHBvcnQgaW50ZXJmYWNlIEFTVFBsdWdpbkJ1aWxkZXIge1xuICAoZW52OiBBU1RQbHVnaW5FbnZpcm9ubWVudCk6IEFTVFBsdWdpbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBU1RQbHVnaW4ge1xuICBuYW1lOiBzdHJpbmc7XG4gIHZpc2l0b3I6IE5vZGVWaXNpdG9yO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFTVFBsdWdpbkVudmlyb25tZW50IHtcbiAgbWV0YT86IG9iamVjdDtcbiAgc3ludGF4OiBTeW50YXg7XG59XG5pbnRlcmZhY2UgSGFuZGxlYmFyc1BhcnNlT3B0aW9ucyB7XG4gIHNyY05hbWU/OiBzdHJpbmc7XG4gIGlnbm9yZVN0YW5kYWxvbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByZXByb2Nlc3NPcHRpb25zIHtcbiAgbWV0YT86IG9iamVjdDtcbiAgcGx1Z2lucz86IHtcbiAgICBhc3Q/OiBBU1RQbHVnaW5CdWlsZGVyW107XG4gIH07XG4gIHBhcnNlT3B0aW9ucz86IEhhbmRsZWJhcnNQYXJzZU9wdGlvbnM7XG5cbiAgLyoqXG4gICAgVXNlZnVsIGZvciBzcGVjaWZ5aW5nIGEgZ3JvdXAgb2Ygb3B0aW9ucyB0b2dldGhlci5cblxuICAgIFdoZW4gYCdjb2RlbW9kJ2Agd2UgZGlzYWJsZSBhbGwgd2hpdGVzcGFjZSBjb250cm9sIGluIGhhbmRsZWJhcnNcbiAgICAodG8gcHJlc2VydmUgYXMgbXVjaCBhcyBwb3NzaWJsZSkgYW5kIHdlIGFsc28gYXZvaWQgYW55XG4gICAgZXNjYXBpbmcvdW5lc2NhcGluZyBvZiBIVE1MIGVudGl0eSBjb2Rlcy5cbiAgICovXG4gIG1vZGU/OiAnY29kZW1vZCcgfCAncHJlY29tcGlsZSc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3ludGF4IHtcbiAgcGFyc2U6IHR5cGVvZiBwcmVwcm9jZXNzO1xuICBidWlsZGVyczogdHlwZW9mIGJ1aWxkZXJzO1xuICBwcmludDogdHlwZW9mIHByaW50O1xuICB0cmF2ZXJzZTogdHlwZW9mIHRyYXZlcnNlO1xuICBXYWxrZXI6IHR5cGVvZiBXYWxrZXI7XG59XG5cbmNvbnN0IHN5bnRheDogU3ludGF4ID0ge1xuICBwYXJzZTogcHJlcHJvY2VzcyxcbiAgYnVpbGRlcnMsXG4gIHByaW50LFxuICB0cmF2ZXJzZSxcbiAgV2Fsa2VyLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHByZXByb2Nlc3MoaHRtbDogc3RyaW5nLCBvcHRpb25zOiBQcmVwcm9jZXNzT3B0aW9ucyA9IHt9KTogQVNULlRlbXBsYXRlIHtcbiAgbGV0IG1vZGUgPSBvcHRpb25zLm1vZGUgfHwgJ3ByZWNvbXBpbGUnO1xuXG4gIGxldCBhc3Q6IEhCUy5Qcm9ncmFtO1xuICBpZiAodHlwZW9mIGh0bWwgPT09ICdvYmplY3QnKSB7XG4gICAgYXN0ID0gaHRtbDtcbiAgfSBlbHNlIGlmIChtb2RlID09PSAnY29kZW1vZCcpIHtcbiAgICBhc3QgPSBwYXJzZVdpdGhvdXRQcm9jZXNzaW5nKGh0bWwsIG9wdGlvbnMucGFyc2VPcHRpb25zKSBhcyBIQlMuUHJvZ3JhbTtcbiAgfSBlbHNlIHtcbiAgICBhc3QgPSBwYXJzZShodG1sLCBvcHRpb25zLnBhcnNlT3B0aW9ucykgYXMgSEJTLlByb2dyYW07XG4gIH1cblxuICBsZXQgZW50aXR5UGFyc2VyID0gdW5kZWZpbmVkO1xuICBpZiAobW9kZSA9PT0gJ2NvZGVtb2QnKSB7XG4gICAgZW50aXR5UGFyc2VyID0gbmV3IEVudGl0eVBhcnNlcih7fSk7XG4gIH1cblxuICBsZXQgcHJvZ3JhbSA9IG5ldyBUb2tlbml6ZXJFdmVudEhhbmRsZXJzKGh0bWwsIGVudGl0eVBhcnNlcikuYWNjZXB0VGVtcGxhdGUoYXN0KTtcblxuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnBsdWdpbnMgJiYgb3B0aW9ucy5wbHVnaW5zLmFzdCkge1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gb3B0aW9ucy5wbHVnaW5zLmFzdC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGxldCB0cmFuc2Zvcm0gPSBvcHRpb25zLnBsdWdpbnMuYXN0W2ldO1xuICAgICAgbGV0IGVudjogQVNUUGx1Z2luRW52aXJvbm1lbnQgPSBhc3NpZ24oe30sIG9wdGlvbnMsIHsgc3ludGF4IH0sIHsgcGx1Z2luczogdW5kZWZpbmVkIH0pO1xuXG4gICAgICBsZXQgcGx1Z2luUmVzdWx0ID0gdHJhbnNmb3JtKGVudik7XG5cbiAgICAgIHRyYXZlcnNlKHByb2dyYW0sIHBsdWdpblJlc3VsdC52aXNpdG9yKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcHJvZ3JhbTtcbn1cbiJdLCJzb3VyY2VSb290IjoiIn0=
function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; subClass.__proto__ = superClass; }

import b, { SYNTHETIC } from '../builders';
import { appendChild, parseElementBlockParams } from '../utils';
import { HandlebarsNodeVisitors } from './handlebars-node-visitors';
import SyntaxError from '../errors/syntax-error';
import builders from '../builders';
import traverse from '../traversal/traverse';
import print from '../generation/print';
import Walker from '../traversal/walker';
import { parse, parseWithoutProcessing } from '@handlebars/parser';
import { assign } from '@glimmer/util';
import { EntityParser } from 'simple-html-tokenizer';
export var voidMap = Object.create(null);
var voidTagNames = 'area base br col command embed hr img input keygen link meta param source track wbr';
voidTagNames.split(' ').forEach(function (tagName) {
  voidMap[tagName] = true;
});
export var TokenizerEventHandlers = /*#__PURE__*/function (_HandlebarsNodeVisito) {
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
    this.currentNode = b.comment('');
    this.currentNode.loc = {
      source: null,
      start: b.pos(this.tagOpenLine, this.tagOpenColumn),
      end: null
    };
  };

  _proto.appendToCommentData = function appendToCommentData(_char) {
    this.currentComment.value += _char;
  };

  _proto.finishComment = function finishComment() {
    this.currentComment.loc.end = b.pos(this.tokenizer.line, this.tokenizer.column);
    appendChild(this.currentElement(), this.currentComment);
  } // Data
  ;

  _proto.beginData = function beginData() {
    this.currentNode = b.text();
    this.currentNode.loc = {
      source: null,
      start: b.pos(this.tokenizer.line, this.tokenizer.column),
      end: null
    };
  };

  _proto.appendToData = function appendToData(_char2) {
    this.currentData.chars += _char2;
  };

  _proto.finishData = function finishData() {
    this.currentData.loc.end = b.pos(this.tokenizer.line, this.tokenizer.column);
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
    tag.loc = b.loc(this.tagOpenLine, this.tagOpenColumn, line, column);

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
    var loc = b.loc(this.tagOpenLine, this.tagOpenColumn);
    var element = b.element({
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
      start: b.pos(this.tokenizer.line, this.tokenizer.column),
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
      var loc = b.loc(this.tokenizer.line, this.tokenizer.column, this.tokenizer.line, this.tokenizer.column); // the tokenizer line/column have already been advanced, correct location info

      if (_char5 === '\n') {
        loc.start.line -= 1;
        loc.start.column = lastPart ? lastPart.loc.end.column : this.currentAttr.valueStartColumn;
      } else {
        loc.start.column -= 1;
      }

      var text = b.text(_char5, loc);
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
    value.loc = b.loc(valueStartLine, valueStartColumn, this.tokenizer.line, this.tokenizer.column);
    var loc = b.loc(this.currentAttr.start.line, this.currentAttr.start.column, this.tokenizer.line, this.tokenizer.column);
    var attribute = b.attr(name, value, loc);
    this.currentStartTag.attributes.push(attribute);
  };

  _proto.reportSyntaxError = function reportSyntaxError(message) {
    throw new SyntaxError("Syntax error at line " + this.tokenizer.line + " col " + this.tokenizer.column + ": " + message, b.loc(this.tokenizer.line, this.tokenizer.column));
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
        throw new SyntaxError("An unquoted attribute value must be a string or a mustache, " + "preceeded by whitespace or a '=' character, and " + ("followed by whitespace, a '>' character, or '/>' (on line " + line + ")"), b.loc(line, 0));
      }
    }
  } else {
    return parts.length > 0 ? parts[0] : b.text('');
  }
}

function assembleConcatenatedValue(parts) {
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];

    if (part.type !== 'MustacheStatement' && part.type !== 'TextNode') {
      throw new SyntaxError('Unsupported node in quoted attribute value: ' + part['type'], part.loc);
    }
  }

  return b.concat(parts);
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
  print: print,
  traverse: traverse,
  Walker: Walker
};
export function preprocess(html, options) {
  if (options === void 0) {
    options = {};
  }

  var mode = options.mode || 'precompile';
  var ast;

  if (typeof html === 'object') {
    ast = html;
  } else if (mode === 'codemod') {
    ast = parseWithoutProcessing(html, options.parseOptions);
  } else {
    ast = parse(html, options.parseOptions);
  }

  var entityParser = undefined;

  if (mode === 'codemod') {
    entityParser = new EntityParser({});
  }

  var program = new TokenizerEventHandlers(html, entityParser, mode).acceptTemplate(ast);

  if (options && options.plugins && options.plugins.ast) {
    for (var i = 0, l = options.plugins.ast.length; i < l; i++) {
      var transform = options.plugins.ast[i];
      var env = assign({}, options, {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3N5bnRheC9saWIvcGFyc2VyL3Rva2VuaXplci1ldmVudC1oYW5kbGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE9BQUEsQ0FBQSxJQUFBLFNBQUEsUUFBQSxhQUFBO0FBQ0EsU0FBQSxXQUFBLEVBQUEsdUJBQUEsUUFBQSxVQUFBO0FBQ0EsU0FBQSxzQkFBQSxRQUFBLDRCQUFBO0FBR0EsT0FBQSxXQUFBLE1BQUEsd0JBQUE7QUFFQSxPQUFBLFFBQUEsTUFBQSxhQUFBO0FBQ0EsT0FBQSxRQUFBLE1BQUEsdUJBQUE7QUFDQSxPQUFBLEtBQUEsTUFBQSxxQkFBQTtBQUNBLE9BQUEsTUFBQSxNQUFBLHFCQUFBO0FBQ0EsU0FBQSxLQUFBLEVBQUEsc0JBQUEsUUFBQSxvQkFBQTtBQUNBLFNBQUEsTUFBQSxRQUFBLGVBQUE7QUFFQSxTQUFBLFlBQUEsUUFBQSx1QkFBQTtBQUVBLE9BQU8sSUFBTSxPQUFPLEdBRWhCLE1BQU0sQ0FBTixNQUFBLENBRkcsSUFFSCxDQUZHO0FBSVAsSUFBSSxZQUFZLEdBQWhCLHFGQUFBO0FBRUEsWUFBWSxDQUFaLEtBQUEsQ0FBQSxHQUFBLEVBQUEsT0FBQSxDQUFpQyxVQUFBLE9BQUQsRUFBWTtBQUMxQyxFQUFBLE9BQU8sQ0FBUCxPQUFPLENBQVAsR0FBQSxJQUFBO0FBREYsQ0FBQTtBQUlBLFdBQU0sc0JBQU47QUFBQTs7QUFBQSxvQ0FBQTtBQUFBOzs7QUFDVSxVQUFBLFdBQUEsR0FBQSxDQUFBO0FBQ0EsVUFBQSxhQUFBLEdBQUEsQ0FBQTtBQUZWO0FBME5DOztBQTFORDs7QUFBQSxTQUlFLEtBSkYsR0FJRSxpQkFBSztBQUNILFNBQUEsV0FBQSxHQUFBLElBQUE7QUFMOEQsR0FBbEUsQ0FRRTtBQVJGOztBQUFBLFNBVUUsWUFWRixHQVVFLHdCQUFZO0FBQ1YsU0FBQSxXQUFBLEdBQW1CLENBQUMsQ0FBRCxPQUFBLENBQW5CLEVBQW1CLENBQW5CO0FBQ0EsU0FBQSxXQUFBLENBQUEsR0FBQSxHQUF1QjtBQUNyQixNQUFBLE1BQU0sRUFEZSxJQUFBO0FBRXJCLE1BQUEsS0FBSyxFQUFFLENBQUMsQ0FBRCxHQUFBLENBQU0sS0FBTixXQUFBLEVBQXdCLEtBRlYsYUFFZCxDQUZjO0FBR3JCLE1BQUEsR0FBRyxFQUFHO0FBSGUsS0FBdkI7QUFLRCxHQWpCSDs7QUFBQSxTQW1CRSxtQkFuQkYsR0FtQkUsNkJBQW1CLEtBQW5CLEVBQWdDO0FBQzlCLFNBQUEsY0FBQSxDQUFBLEtBQUEsSUFBQSxLQUFBO0FBQ0QsR0FyQkg7O0FBQUEsU0F1QkUsYUF2QkYsR0F1QkUseUJBQWE7QUFDWCxTQUFBLGNBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxHQUE4QixDQUFDLENBQUQsR0FBQSxDQUFNLEtBQUEsU0FBQSxDQUFOLElBQUEsRUFBMkIsS0FBQSxTQUFBLENBQXpELE1BQThCLENBQTlCO0FBRUEsSUFBQSxXQUFXLENBQUMsS0FBRCxjQUFDLEVBQUQsRUFBd0IsS0FBbkMsY0FBVyxDQUFYO0FBMUI4RCxHQUFsRSxDQTZCRTtBQTdCRjs7QUFBQSxTQStCRSxTQS9CRixHQStCRSxxQkFBUztBQUNQLFNBQUEsV0FBQSxHQUFtQixDQUFDLENBQXBCLElBQW1CLEVBQW5CO0FBQ0EsU0FBQSxXQUFBLENBQUEsR0FBQSxHQUF1QjtBQUNyQixNQUFBLE1BQU0sRUFEZSxJQUFBO0FBRXJCLE1BQUEsS0FBSyxFQUFFLENBQUMsQ0FBRCxHQUFBLENBQU0sS0FBQSxTQUFBLENBQU4sSUFBQSxFQUEyQixLQUFBLFNBQUEsQ0FGYixNQUVkLENBRmM7QUFHckIsTUFBQSxHQUFHLEVBQUc7QUFIZSxLQUF2QjtBQUtELEdBdENIOztBQUFBLFNBd0NFLFlBeENGLEdBd0NFLHNCQUFZLE1BQVosRUFBeUI7QUFDdkIsU0FBQSxXQUFBLENBQUEsS0FBQSxJQUFBLE1BQUE7QUFDRCxHQTFDSDs7QUFBQSxTQTRDRSxVQTVDRixHQTRDRSxzQkFBVTtBQUNSLFNBQUEsV0FBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLEdBQTJCLENBQUMsQ0FBRCxHQUFBLENBQU0sS0FBQSxTQUFBLENBQU4sSUFBQSxFQUEyQixLQUFBLFNBQUEsQ0FBdEQsTUFBMkIsQ0FBM0I7QUFFQSxJQUFBLFdBQVcsQ0FBQyxLQUFELGNBQUMsRUFBRCxFQUF3QixLQUFuQyxXQUFXLENBQVg7QUEvQzhELEdBQWxFLENBa0RFO0FBbERGOztBQUFBLFNBb0RFLE9BcERGLEdBb0RFLG1CQUFPO0FBQ0wsU0FBQSxXQUFBLEdBQW1CLEtBQUEsU0FBQSxDQUFuQixJQUFBO0FBQ0EsU0FBQSxhQUFBLEdBQXFCLEtBQUEsU0FBQSxDQUFyQixNQUFBO0FBQ0QsR0F2REg7O0FBQUEsU0F5REUsYUF6REYsR0F5REUseUJBQWE7QUFDWCxTQUFBLFdBQUEsR0FBbUI7QUFDakIsTUFBQSxJQUFJLEVBRGEsVUFBQTtBQUVqQixNQUFBLElBQUksRUFGYSxFQUFBO0FBR2pCLE1BQUEsVUFBVSxFQUhPLEVBQUE7QUFJakIsTUFBQSxTQUFTLEVBSlEsRUFBQTtBQUtqQixNQUFBLFFBQVEsRUFMUyxFQUFBO0FBTWpCLE1BQUEsV0FBVyxFQU5NLEtBQUE7QUFPakIsTUFBQSxHQUFHLEVBQUU7QUFQWSxLQUFuQjtBQVNELEdBbkVIOztBQUFBLFNBcUVFLFdBckVGLEdBcUVFLHVCQUFXO0FBQ1QsU0FBQSxXQUFBLEdBQW1CO0FBQ2pCLE1BQUEsSUFBSSxFQURhLFFBQUE7QUFFakIsTUFBQSxJQUFJLEVBRmEsRUFBQTtBQUdqQixNQUFBLFVBQVUsRUFITyxFQUFBO0FBSWpCLE1BQUEsU0FBUyxFQUpRLEVBQUE7QUFLakIsTUFBQSxRQUFRLEVBTFMsRUFBQTtBQU1qQixNQUFBLFdBQVcsRUFOTSxLQUFBO0FBT2pCLE1BQUEsR0FBRyxFQUFFO0FBUFksS0FBbkI7QUFTRCxHQS9FSDs7QUFBQSxTQWlGRSxTQWpGRixHQWlGRSxxQkFBUztBQUFBLDBCQUNnQixLQUF2QixTQURPO0FBQUEsUUFDSCxJQURHLG1CQUNILElBREc7QUFBQSxRQUNLLE1BREwsbUJBQ0ssTUFETDtBQUdQLFFBQUksR0FBRyxHQUFHLEtBQVYsVUFBQTtBQUNBLElBQUEsR0FBRyxDQUFILEdBQUEsR0FBVSxDQUFDLENBQUQsR0FBQSxDQUFNLEtBQU4sV0FBQSxFQUF3QixLQUF4QixhQUFBLEVBQUEsSUFBQSxFQUFWLE1BQVUsQ0FBVjs7QUFFQSxRQUFJLEdBQUcsQ0FBSCxJQUFBLEtBQUosVUFBQSxFQUE2QjtBQUMzQixXQUFBLGNBQUE7O0FBRUEsVUFBSSxPQUFPLENBQUMsR0FBRyxDQUFYLElBQU8sQ0FBUCxJQUFxQixHQUFHLENBQTVCLFdBQUEsRUFBMEM7QUFDeEMsYUFBQSxZQUFBLENBQUEsSUFBQTtBQUNEO0FBTEgsS0FBQSxNQU1PLElBQUksR0FBRyxDQUFILElBQUEsS0FBSixRQUFBLEVBQTJCO0FBQ2hDLFdBQUEsWUFBQSxDQUFBLEtBQUE7QUFDRDtBQUNGLEdBaEdIOztBQUFBLFNBa0dFLGNBbEdGLEdBa0dFLDBCQUFjO0FBQUEsZ0NBQ3dELEtBQXBFLGVBRFk7QUFBQSxRQUNSLElBRFEseUJBQ1IsSUFEUTtBQUFBLFFBQ1IsS0FEUSx5QkFDQSxVQURBO0FBQUEsUUFDUixTQURRLHlCQUNSLFNBRFE7QUFBQSxRQUNSLFFBRFEseUJBQ1IsUUFEUTtBQUFBLFFBQ3dDLFdBRHhDLHlCQUN3QyxXQUR4QztBQUVaLFFBQUksR0FBRyxHQUFHLENBQUMsQ0FBRCxHQUFBLENBQU0sS0FBTixXQUFBLEVBQXdCLEtBQWxDLGFBQVUsQ0FBVjtBQUNBLFFBQUksT0FBTyxHQUFHLENBQUMsQ0FBRCxPQUFBLENBQVU7QUFBRSxNQUFBLElBQUYsRUFBRSxJQUFGO0FBQVEsTUFBQSxXQUFBLEVBQUE7QUFBUixLQUFWLEVBQWlDO0FBQUUsTUFBQSxLQUFGLEVBQUUsS0FBRjtBQUFTLE1BQUEsU0FBVCxFQUFTLFNBQVQ7QUFBb0IsTUFBQSxRQUFwQixFQUFvQixRQUFwQjtBQUE4QixNQUFBLEdBQUEsRUFBQTtBQUE5QixLQUFqQyxDQUFkO0FBQ0EsU0FBQSxZQUFBLENBQUEsSUFBQSxDQUFBLE9BQUE7QUFDRCxHQXZHSDs7QUFBQSxTQXlHRSxZQXpHRixHQXlHRSxzQkFBWSxNQUFaLEVBQTRCO0FBQzFCLFFBQUksR0FBRyxHQUFHLEtBQVYsVUFBQTtBQUVBLFFBQUksT0FBTyxHQUFHLEtBQUEsWUFBQSxDQUFkLEdBQWMsRUFBZDtBQUNBLFFBQUksTUFBTSxHQUFHLEtBQWIsY0FBYSxFQUFiO0FBRUEsSUFBQSxjQUFjLENBQUEsR0FBQSxFQUFBLE9BQUEsRUFBZCxNQUFjLENBQWQ7QUFFQSxJQUFBLE9BQU8sQ0FBUCxHQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsR0FBdUIsS0FBQSxTQUFBLENBQXZCLElBQUE7QUFDQSxJQUFBLE9BQU8sQ0FBUCxHQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsR0FBeUIsS0FBQSxTQUFBLENBQXpCLE1BQUE7QUFFQSxJQUFBLHVCQUF1QixDQUF2QixPQUF1QixDQUF2QjtBQUNBLElBQUEsV0FBVyxDQUFBLE1BQUEsRUFBWCxPQUFXLENBQVg7QUFDRCxHQXRISDs7QUFBQSxTQXdIRSxvQkF4SEYsR0F3SEUsZ0NBQW9CO0FBQ2xCLFNBQUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxJQUFBO0FBekg4RCxHQUFsRSxDQTRIRTtBQTVIRjs7QUFBQSxTQThIRSxlQTlIRixHQThIRSx5QkFBZSxNQUFmLEVBQTRCO0FBQzFCLFNBQUEsVUFBQSxDQUFBLElBQUEsSUFBQSxNQUFBO0FBL0g4RCxHQUFsRSxDQWtJRTtBQWxJRjs7QUFBQSxTQW9JRSxjQXBJRixHQW9JRSwwQkFBYztBQUNaLFFBQUksR0FBRyxHQUFHLEtBQVYsVUFBQTs7QUFDQSxRQUFJLEdBQUcsQ0FBSCxJQUFBLEtBQUosUUFBQSxFQUEyQjtBQUN6QixZQUFNLElBQUEsV0FBQSxDQUNKLHNFQUNVLEdBQUcsQ0FBQyxJQURkLG1CQUNpQyxLQUFBLFNBQUEsQ0FGN0IsSUFDSixRQURJLEVBR0osR0FBRyxDQUhMLEdBQU0sQ0FBTjtBQUtEOztBQUVELFNBQUEsZ0JBQUEsR0FBd0I7QUFDdEIsTUFBQSxJQUFJLEVBRGtCLEVBQUE7QUFFdEIsTUFBQSxLQUFLLEVBRmlCLEVBQUE7QUFHdEIsTUFBQSxRQUFRLEVBSGMsS0FBQTtBQUl0QixNQUFBLFNBQVMsRUFKYSxLQUFBO0FBS3RCLE1BQUEsS0FBSyxFQUFFLENBQUMsQ0FBRCxHQUFBLENBQU0sS0FBQSxTQUFBLENBQU4sSUFBQSxFQUEyQixLQUFBLFNBQUEsQ0FMWixNQUtmLENBTGU7QUFNdEIsTUFBQSxjQUFjLEVBTlEsQ0FBQTtBQU90QixNQUFBLGdCQUFnQixFQUFFO0FBUEksS0FBeEI7QUFTRCxHQXZKSDs7QUFBQSxTQXlKRSxxQkF6SkYsR0F5SkUsK0JBQXFCLE1BQXJCLEVBQWtDO0FBQ2hDLFNBQUEsV0FBQSxDQUFBLElBQUEsSUFBQSxNQUFBO0FBQ0QsR0EzSkg7O0FBQUEsU0E2SkUsbUJBN0pGLEdBNkpFLDZCQUFtQixRQUFuQixFQUFxQztBQUNuQyxTQUFBLFdBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQTtBQUNBLFNBQUEsV0FBQSxDQUFBLGNBQUEsR0FBa0MsS0FBQSxTQUFBLENBQWxDLElBQUE7QUFDQSxTQUFBLFdBQUEsQ0FBQSxnQkFBQSxHQUFvQyxLQUFBLFNBQUEsQ0FBcEMsTUFBQTtBQUNELEdBaktIOztBQUFBLFNBbUtFLHNCQW5LRixHQW1LRSxnQ0FBc0IsTUFBdEIsRUFBbUM7QUFDakMsUUFBSSxLQUFLLEdBQUcsS0FBQSxXQUFBLENBQVosS0FBQTtBQUNBLFFBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUwsTUFBQSxHQUFyQixDQUFvQixDQUFwQjs7QUFFQSxRQUFJLFFBQVEsSUFBSSxRQUFRLENBQVIsSUFBQSxLQUFoQixVQUFBLEVBQThDO0FBQzVDLE1BQUEsUUFBUSxDQUFSLEtBQUEsSUFENEMsTUFDNUMsQ0FENEMsQ0FHNUM7O0FBQ0EsTUFBQSxRQUFRLENBQVIsR0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLEdBQXdCLEtBQUEsU0FBQSxDQUF4QixJQUFBO0FBQ0EsTUFBQSxRQUFRLENBQVIsR0FBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLEdBQTBCLEtBQUEsU0FBQSxDQUExQixNQUFBO0FBTEYsS0FBQSxNQU1PO0FBQ0w7QUFDQSxVQUFJLEdBQUcsR0FBRyxDQUFDLENBQUQsR0FBQSxDQUNSLEtBQUEsU0FBQSxDQURRLElBQUEsRUFFUixLQUFBLFNBQUEsQ0FGUSxNQUFBLEVBR1IsS0FBQSxTQUFBLENBSFEsSUFBQSxFQUlSLEtBQUEsU0FBQSxDQU5HLE1BRUssQ0FBVixDQUZLLENBU0w7O0FBQ0EsVUFBSSxNQUFJLEtBQVIsSUFBQSxFQUFtQjtBQUNqQixRQUFBLEdBQUcsQ0FBSCxLQUFBLENBQUEsSUFBQSxJQUFBLENBQUE7QUFDQSxRQUFBLEdBQUcsQ0FBSCxLQUFBLENBQUEsTUFBQSxHQUFtQixRQUFRLEdBQUcsUUFBUSxDQUFSLEdBQUEsQ0FBQSxHQUFBLENBQUgsTUFBQSxHQUE2QixLQUFBLFdBQUEsQ0FBeEQsZ0JBQUE7QUFGRixPQUFBLE1BR087QUFDTCxRQUFBLEdBQUcsQ0FBSCxLQUFBLENBQUEsTUFBQSxJQUFBLENBQUE7QUFDRDs7QUFFRCxVQUFJLElBQUksR0FBRyxDQUFDLENBQUQsSUFBQSxDQUFBLE1BQUEsRUFBWCxHQUFXLENBQVg7QUFDQSxNQUFBLEtBQUssQ0FBTCxJQUFBLENBQUEsSUFBQTtBQUNEO0FBQ0YsR0FqTUg7O0FBQUEsU0FtTUUsb0JBbk1GLEdBbU1FLGdDQUFvQjtBQUFBLDRCQUMyRCxLQUE3RSxXQURrQjtBQUFBLFFBQ2QsSUFEYyxxQkFDZCxJQURjO0FBQUEsUUFDZCxLQURjLHFCQUNkLEtBRGM7QUFBQSxRQUNkLFFBRGMscUJBQ2QsUUFEYztBQUFBLFFBQ2QsU0FEYyxxQkFDZCxTQURjO0FBQUEsUUFDZCxjQURjLHFCQUNkLGNBRGM7QUFBQSxRQUNzQyxnQkFEdEMscUJBQ3NDLGdCQUR0QztBQUVsQixRQUFJLEtBQUssR0FBRyxzQkFBc0IsQ0FBQSxLQUFBLEVBQUEsUUFBQSxFQUFBLFNBQUEsRUFBNkIsS0FBQSxTQUFBLENBQS9ELElBQWtDLENBQWxDO0FBQ0EsSUFBQSxLQUFLLENBQUwsR0FBQSxHQUFZLENBQUMsQ0FBRCxHQUFBLENBQUEsY0FBQSxFQUFBLGdCQUFBLEVBQXdDLEtBQUEsU0FBQSxDQUF4QyxJQUFBLEVBQTZELEtBQUEsU0FBQSxDQUF6RSxNQUFZLENBQVo7QUFFQSxRQUFJLEdBQUcsR0FBRyxDQUFDLENBQUQsR0FBQSxDQUNSLEtBQUEsV0FBQSxDQUFBLEtBQUEsQ0FEUSxJQUFBLEVBRVIsS0FBQSxXQUFBLENBQUEsS0FBQSxDQUZRLE1BQUEsRUFHUixLQUFBLFNBQUEsQ0FIUSxJQUFBLEVBSVIsS0FBQSxTQUFBLENBSkYsTUFBVSxDQUFWO0FBT0EsUUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFELElBQUEsQ0FBQSxJQUFBLEVBQUEsS0FBQSxFQUFoQixHQUFnQixDQUFoQjtBQUVBLFNBQUEsZUFBQSxDQUFBLFVBQUEsQ0FBQSxJQUFBLENBQUEsU0FBQTtBQUNELEdBbE5IOztBQUFBLFNBb05FLGlCQXBORixHQW9ORSwyQkFBaUIsT0FBakIsRUFBaUM7QUFDL0IsVUFBTSxJQUFBLFdBQUEsMkJBQ29CLEtBQUEsU0FBQSxDQUFlLElBRG5DLGFBQytDLEtBQUEsU0FBQSxDQUFlLE1BRDlELFVBQUEsT0FBQSxFQUVKLENBQUMsQ0FBRCxHQUFBLENBQU0sS0FBQSxTQUFBLENBQU4sSUFBQSxFQUEyQixLQUFBLFNBQUEsQ0FGN0IsTUFFRSxDQUZJLENBQU47QUFJRCxHQXpOSDs7QUFBQTtBQUFBLEVBQU0sc0JBQU47O0FBNE5BLFNBQUEsc0JBQUEsQ0FBQSxLQUFBLEVBQUEsUUFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBSWM7QUFFWixNQUFBLFNBQUEsRUFBZTtBQUNiLFFBQUEsUUFBQSxFQUFjO0FBQ1osYUFBTyx5QkFBeUIsQ0FBaEMsS0FBZ0MsQ0FBaEM7QUFERixLQUFBLE1BRU87QUFDTCxVQUNFLEtBQUssQ0FBTCxNQUFBLEtBQUEsQ0FBQSxJQUNDLEtBQUssQ0FBTCxNQUFBLEtBQUEsQ0FBQSxJQUNDLEtBQUssQ0FBTCxDQUFLLENBQUwsQ0FBQSxJQUFBLEtBREQsVUFBQSxJQUVFLEtBQUssQ0FBTCxDQUFLLENBQUwsQ0FBQSxLQUFBLEtBSkwsR0FBQSxFQUtFO0FBQ0EsZUFBTyxLQUFLLENBQVosQ0FBWSxDQUFaO0FBTkYsT0FBQSxNQU9PO0FBQ0wsY0FBTSxJQUFBLFdBQUEsQ0FDSixzTEFESSxJQUNKLE9BREksRUFJSixDQUFDLENBQUQsR0FBQSxDQUFBLElBQUEsRUFKRixDQUlFLENBSkksQ0FBTjtBQU1EO0FBQ0Y7QUFuQkgsR0FBQSxNQW9CTztBQUNMLFdBQU8sS0FBSyxDQUFMLE1BQUEsR0FBQSxDQUFBLEdBQW1CLEtBQUssQ0FBeEIsQ0FBd0IsQ0FBeEIsR0FBOEIsQ0FBQyxDQUFELElBQUEsQ0FBckMsRUFBcUMsQ0FBckM7QUFDRDtBQUNGOztBQUVELFNBQUEseUJBQUEsQ0FBQSxLQUFBLEVBQWtGO0FBQ2hGLE9BQUssSUFBSSxDQUFDLEdBQVYsQ0FBQSxFQUFnQixDQUFDLEdBQUcsS0FBSyxDQUF6QixNQUFBLEVBQWtDLENBQWxDLEVBQUEsRUFBdUM7QUFDckMsUUFBSSxJQUFJLEdBQWlCLEtBQUssQ0FBOUIsQ0FBOEIsQ0FBOUI7O0FBRUEsUUFBSSxJQUFJLENBQUosSUFBQSxLQUFBLG1CQUFBLElBQXFDLElBQUksQ0FBSixJQUFBLEtBQXpDLFVBQUEsRUFBbUU7QUFDakUsWUFBTSxJQUFBLFdBQUEsQ0FDSixpREFBaUQsSUFBSSxDQURqRCxNQUNpRCxDQURqRCxFQUVKLElBQUksQ0FGTixHQUFNLENBQU47QUFJRDtBQUNGOztBQUVELFNBQU8sQ0FBQyxDQUFELE1BQUEsQ0FBUCxLQUFPLENBQVA7QUFDRDs7QUFFRCxTQUFBLGNBQUEsQ0FBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFdBQUEsRUFHc0I7QUFFcEIsTUFBQSxLQUFBOztBQUVBLE1BQUksT0FBTyxDQUFDLEdBQUcsQ0FBWCxJQUFPLENBQVAsSUFBcUIsQ0FBekIsV0FBQSxFQUF1QztBQUNyQztBQUNBO0FBQ0E7QUFDQSxJQUFBLEtBQUssR0FBRyxxQkFBcUIsZ0JBQWdCLENBQXJDLEdBQXFDLENBQXJDLEdBQVIsd0NBQUE7QUFKRixHQUFBLE1BS08sSUFBSSxPQUFPLENBQVAsR0FBQSxLQUFKLFNBQUEsRUFBK0I7QUFDcEMsSUFBQSxLQUFLLEdBQUcsaUJBQWlCLGdCQUFnQixDQUFqQyxHQUFpQyxDQUFqQyxHQUFSLHVCQUFBO0FBREssR0FBQSxNQUVBLElBQUksT0FBTyxDQUFQLEdBQUEsS0FBZ0IsR0FBRyxDQUF2QixJQUFBLEVBQThCO0FBQ25DLElBQUEsS0FBSyxHQUNILGlCQUNBLGdCQUFnQixDQURoQixHQUNnQixDQURoQixHQUFBLGdDQUFBLEdBR0EsT0FBTyxDQUhQLEdBQUEsR0FBQSxhQUFBLEdBS0EsT0FBTyxDQUFQLEdBQUEsQ0FBQSxLQUFBLENBTEEsSUFBQSxHQURGLElBQUE7QUFRRDs7QUFFRCxNQUFBLEtBQUEsRUFBVztBQUNULFVBQU0sSUFBQSxXQUFBLENBQUEsS0FBQSxFQUF1QixPQUFPLENBQXBDLEdBQU0sQ0FBTjtBQUNEO0FBQ0Y7O0FBRUQsU0FBQSxnQkFBQSxDQUFBLEdBQUEsRUFBeUQ7QUFDdkQsU0FBTyxNQUFNLEdBQUcsQ0FBVCxJQUFBLEdBQUEsYUFBQSxHQUFpQyxHQUFHLENBQUgsR0FBQSxDQUFBLEdBQUEsQ0FBakMsSUFBQSxHQUFQLEdBQUE7QUFDRDs7QUFtREQsSUFBTSxNQUFNLEdBQVc7QUFDckIsRUFBQSxLQUFLLEVBRGdCLFVBQUE7QUFFckIsRUFBQSxRQUZxQixFQUVyQixRQUZxQjtBQUdyQixFQUFBLEtBSHFCLEVBR3JCLEtBSHFCO0FBSXJCLEVBQUEsUUFKcUIsRUFJckIsUUFKcUI7QUFLckIsRUFBQSxNQUFBLEVBQUE7QUFMcUIsQ0FBdkI7QUFRQSxPQUFNLFNBQUEsVUFBQSxDQUFBLElBQUEsRUFBbUMsT0FBbkMsRUFBa0U7QUFBQSxNQUEvQixPQUErQjtBQUEvQixJQUFBLE9BQStCLEdBQWxFLEVBQWtFO0FBQUE7O0FBQ3RFLE1BQUksSUFBSSxHQUFHLE9BQU8sQ0FBUCxJQUFBLElBQVgsWUFBQTtBQUVBLE1BQUEsR0FBQTs7QUFDQSxNQUFJLE9BQUEsSUFBQSxLQUFKLFFBQUEsRUFBOEI7QUFDNUIsSUFBQSxHQUFHLEdBQUgsSUFBQTtBQURGLEdBQUEsTUFFTyxJQUFJLElBQUksS0FBUixTQUFBLEVBQXdCO0FBQzdCLElBQUEsR0FBRyxHQUFHLHNCQUFzQixDQUFBLElBQUEsRUFBTyxPQUFPLENBQTFDLFlBQTRCLENBQTVCO0FBREssR0FBQSxNQUVBO0FBQ0wsSUFBQSxHQUFHLEdBQUcsS0FBSyxDQUFBLElBQUEsRUFBTyxPQUFPLENBQXpCLFlBQVcsQ0FBWDtBQUNEOztBQUVELE1BQUksWUFBWSxHQUFoQixTQUFBOztBQUNBLE1BQUksSUFBSSxLQUFSLFNBQUEsRUFBd0I7QUFDdEIsSUFBQSxZQUFZLEdBQUcsSUFBQSxZQUFBLENBQWYsRUFBZSxDQUFmO0FBQ0Q7O0FBRUQsTUFBSSxPQUFPLEdBQUcsSUFBQSxzQkFBQSxDQUFBLElBQUEsRUFBQSxZQUFBLEVBQUEsSUFBQSxFQUFBLGNBQUEsQ0FBZCxHQUFjLENBQWQ7O0FBRUEsTUFBSSxPQUFPLElBQUksT0FBTyxDQUFsQixPQUFBLElBQThCLE9BQU8sQ0FBUCxPQUFBLENBQWxDLEdBQUEsRUFBdUQ7QUFDckQsU0FBSyxJQUFJLENBQUMsR0FBTCxDQUFBLEVBQVcsQ0FBQyxHQUFHLE9BQU8sQ0FBUCxPQUFBLENBQUEsR0FBQSxDQUFwQixNQUFBLEVBQWdELENBQUMsR0FBakQsQ0FBQSxFQUF1RCxDQUF2RCxFQUFBLEVBQTREO0FBQzFELFVBQUksU0FBUyxHQUFHLE9BQU8sQ0FBUCxPQUFBLENBQUEsR0FBQSxDQUFoQixDQUFnQixDQUFoQjtBQUNBLFVBQUksR0FBRyxHQUF5QixNQUFNLENBQUEsRUFBQSxFQUFBLE9BQUEsRUFBYztBQUFFLFFBQUEsTUFBQSxFQUFBO0FBQUYsT0FBZCxFQUEwQjtBQUFFLFFBQUEsT0FBTyxFQUFFO0FBQVgsT0FBMUIsQ0FBdEM7QUFFQSxVQUFJLFlBQVksR0FBRyxTQUFTLENBQTVCLEdBQTRCLENBQTVCO0FBRUEsTUFBQSxRQUFRLENBQUEsT0FBQSxFQUFVLFlBQVksQ0FBOUIsT0FBUSxDQUFSO0FBQ0Q7QUFDRjs7QUFFRCxTQUFBLE9BQUE7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBiLCB7IFNZTlRIRVRJQyB9IGZyb20gJy4uL2J1aWxkZXJzJztcbmltcG9ydCB7IGFwcGVuZENoaWxkLCBwYXJzZUVsZW1lbnRCbG9ja1BhcmFtcyB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCB7IEhhbmRsZWJhcnNOb2RlVmlzaXRvcnMgfSBmcm9tICcuL2hhbmRsZWJhcnMtbm9kZS12aXNpdG9ycyc7XG5pbXBvcnQgKiBhcyBBU1QgZnJvbSAnLi4vdHlwZXMvbm9kZXMnO1xuaW1wb3J0ICogYXMgSEJTIGZyb20gJy4uL3R5cGVzL2hhbmRsZWJhcnMtYXN0JztcbmltcG9ydCBTeW50YXhFcnJvciBmcm9tICcuLi9lcnJvcnMvc3ludGF4LWVycm9yJztcbmltcG9ydCB7IFRhZyB9IGZyb20gJy4uL3BhcnNlcic7XG5pbXBvcnQgYnVpbGRlcnMgZnJvbSAnLi4vYnVpbGRlcnMnO1xuaW1wb3J0IHRyYXZlcnNlIGZyb20gJy4uL3RyYXZlcnNhbC90cmF2ZXJzZSc7XG5pbXBvcnQgcHJpbnQgZnJvbSAnLi4vZ2VuZXJhdGlvbi9wcmludCc7XG5pbXBvcnQgV2Fsa2VyIGZyb20gJy4uL3RyYXZlcnNhbC93YWxrZXInO1xuaW1wb3J0IHsgcGFyc2UsIHBhcnNlV2l0aG91dFByb2Nlc3NpbmcgfSBmcm9tICdAaGFuZGxlYmFycy9wYXJzZXInO1xuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnQGdsaW1tZXIvdXRpbCc7XG5pbXBvcnQgeyBOb2RlVmlzaXRvciB9IGZyb20gJy4uL3RyYXZlcnNhbC92aXNpdG9yJztcbmltcG9ydCB7IEVudGl0eVBhcnNlciB9IGZyb20gJ3NpbXBsZS1odG1sLXRva2VuaXplcic7XG5cbmV4cG9ydCBjb25zdCB2b2lkTWFwOiB7XG4gIFt0YWdOYW1lOiBzdHJpbmddOiBib29sZWFuO1xufSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbmxldCB2b2lkVGFnTmFtZXMgPVxuICAnYXJlYSBiYXNlIGJyIGNvbCBjb21tYW5kIGVtYmVkIGhyIGltZyBpbnB1dCBrZXlnZW4gbGluayBtZXRhIHBhcmFtIHNvdXJjZSB0cmFjayB3YnInO1xudm9pZFRhZ05hbWVzLnNwbGl0KCcgJykuZm9yRWFjaCgodGFnTmFtZSkgPT4ge1xuICB2b2lkTWFwW3RhZ05hbWVdID0gdHJ1ZTtcbn0pO1xuXG5leHBvcnQgY2xhc3MgVG9rZW5pemVyRXZlbnRIYW5kbGVycyBleHRlbmRzIEhhbmRsZWJhcnNOb2RlVmlzaXRvcnMge1xuICBwcml2YXRlIHRhZ09wZW5MaW5lID0gMDtcbiAgcHJpdmF0ZSB0YWdPcGVuQ29sdW1uID0gMDtcblxuICByZXNldCgpIHtcbiAgICB0aGlzLmN1cnJlbnROb2RlID0gbnVsbDtcbiAgfVxuXG4gIC8vIENvbW1lbnRcblxuICBiZWdpbkNvbW1lbnQoKSB7XG4gICAgdGhpcy5jdXJyZW50Tm9kZSA9IGIuY29tbWVudCgnJyk7XG4gICAgdGhpcy5jdXJyZW50Tm9kZS5sb2MgPSB7XG4gICAgICBzb3VyY2U6IG51bGwsXG4gICAgICBzdGFydDogYi5wb3ModGhpcy50YWdPcGVuTGluZSwgdGhpcy50YWdPcGVuQ29sdW1uKSxcbiAgICAgIGVuZDogKG51bGwgYXMgYW55KSBhcyBBU1QuUG9zaXRpb24sXG4gICAgfTtcbiAgfVxuXG4gIGFwcGVuZFRvQ29tbWVudERhdGEoY2hhcjogc3RyaW5nKSB7XG4gICAgdGhpcy5jdXJyZW50Q29tbWVudC52YWx1ZSArPSBjaGFyO1xuICB9XG5cbiAgZmluaXNoQ29tbWVudCgpIHtcbiAgICB0aGlzLmN1cnJlbnRDb21tZW50LmxvYy5lbmQgPSBiLnBvcyh0aGlzLnRva2VuaXplci5saW5lLCB0aGlzLnRva2VuaXplci5jb2x1bW4pO1xuXG4gICAgYXBwZW5kQ2hpbGQodGhpcy5jdXJyZW50RWxlbWVudCgpLCB0aGlzLmN1cnJlbnRDb21tZW50KTtcbiAgfVxuXG4gIC8vIERhdGFcblxuICBiZWdpbkRhdGEoKSB7XG4gICAgdGhpcy5jdXJyZW50Tm9kZSA9IGIudGV4dCgpO1xuICAgIHRoaXMuY3VycmVudE5vZGUubG9jID0ge1xuICAgICAgc291cmNlOiBudWxsLFxuICAgICAgc3RhcnQ6IGIucG9zKHRoaXMudG9rZW5pemVyLmxpbmUsIHRoaXMudG9rZW5pemVyLmNvbHVtbiksXG4gICAgICBlbmQ6IChudWxsIGFzIGFueSkgYXMgQVNULlBvc2l0aW9uLFxuICAgIH07XG4gIH1cblxuICBhcHBlbmRUb0RhdGEoY2hhcjogc3RyaW5nKSB7XG4gICAgdGhpcy5jdXJyZW50RGF0YS5jaGFycyArPSBjaGFyO1xuICB9XG5cbiAgZmluaXNoRGF0YSgpIHtcbiAgICB0aGlzLmN1cnJlbnREYXRhLmxvYy5lbmQgPSBiLnBvcyh0aGlzLnRva2VuaXplci5saW5lLCB0aGlzLnRva2VuaXplci5jb2x1bW4pO1xuXG4gICAgYXBwZW5kQ2hpbGQodGhpcy5jdXJyZW50RWxlbWVudCgpLCB0aGlzLmN1cnJlbnREYXRhKTtcbiAgfVxuXG4gIC8vIFRhZ3MgLSBiYXNpY1xuXG4gIHRhZ09wZW4oKSB7XG4gICAgdGhpcy50YWdPcGVuTGluZSA9IHRoaXMudG9rZW5pemVyLmxpbmU7XG4gICAgdGhpcy50YWdPcGVuQ29sdW1uID0gdGhpcy50b2tlbml6ZXIuY29sdW1uO1xuICB9XG5cbiAgYmVnaW5TdGFydFRhZygpIHtcbiAgICB0aGlzLmN1cnJlbnROb2RlID0ge1xuICAgICAgdHlwZTogJ1N0YXJ0VGFnJyxcbiAgICAgIG5hbWU6ICcnLFxuICAgICAgYXR0cmlidXRlczogW10sXG4gICAgICBtb2RpZmllcnM6IFtdLFxuICAgICAgY29tbWVudHM6IFtdLFxuICAgICAgc2VsZkNsb3Npbmc6IGZhbHNlLFxuICAgICAgbG9jOiBTWU5USEVUSUMsXG4gICAgfTtcbiAgfVxuXG4gIGJlZ2luRW5kVGFnKCkge1xuICAgIHRoaXMuY3VycmVudE5vZGUgPSB7XG4gICAgICB0eXBlOiAnRW5kVGFnJyxcbiAgICAgIG5hbWU6ICcnLFxuICAgICAgYXR0cmlidXRlczogW10sXG4gICAgICBtb2RpZmllcnM6IFtdLFxuICAgICAgY29tbWVudHM6IFtdLFxuICAgICAgc2VsZkNsb3Npbmc6IGZhbHNlLFxuICAgICAgbG9jOiBTWU5USEVUSUMsXG4gICAgfTtcbiAgfVxuXG4gIGZpbmlzaFRhZygpIHtcbiAgICBsZXQgeyBsaW5lLCBjb2x1bW4gfSA9IHRoaXMudG9rZW5pemVyO1xuXG4gICAgbGV0IHRhZyA9IHRoaXMuY3VycmVudFRhZztcbiAgICB0YWcubG9jID0gYi5sb2ModGhpcy50YWdPcGVuTGluZSwgdGhpcy50YWdPcGVuQ29sdW1uLCBsaW5lLCBjb2x1bW4pO1xuXG4gICAgaWYgKHRhZy50eXBlID09PSAnU3RhcnRUYWcnKSB7XG4gICAgICB0aGlzLmZpbmlzaFN0YXJ0VGFnKCk7XG5cbiAgICAgIGlmICh2b2lkTWFwW3RhZy5uYW1lXSB8fCB0YWcuc2VsZkNsb3NpbmcpIHtcbiAgICAgICAgdGhpcy5maW5pc2hFbmRUYWcodHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0YWcudHlwZSA9PT0gJ0VuZFRhZycpIHtcbiAgICAgIHRoaXMuZmluaXNoRW5kVGFnKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICBmaW5pc2hTdGFydFRhZygpIHtcbiAgICBsZXQgeyBuYW1lLCBhdHRyaWJ1dGVzOiBhdHRycywgbW9kaWZpZXJzLCBjb21tZW50cywgc2VsZkNsb3NpbmcgfSA9IHRoaXMuY3VycmVudFN0YXJ0VGFnO1xuICAgIGxldCBsb2MgPSBiLmxvYyh0aGlzLnRhZ09wZW5MaW5lLCB0aGlzLnRhZ09wZW5Db2x1bW4pO1xuICAgIGxldCBlbGVtZW50ID0gYi5lbGVtZW50KHsgbmFtZSwgc2VsZkNsb3NpbmcgfSwgeyBhdHRycywgbW9kaWZpZXJzLCBjb21tZW50cywgbG9jIH0pO1xuICAgIHRoaXMuZWxlbWVudFN0YWNrLnB1c2goZWxlbWVudCk7XG4gIH1cblxuICBmaW5pc2hFbmRUYWcoaXNWb2lkOiBib29sZWFuKSB7XG4gICAgbGV0IHRhZyA9IHRoaXMuY3VycmVudFRhZztcblxuICAgIGxldCBlbGVtZW50ID0gdGhpcy5lbGVtZW50U3RhY2sucG9wKCkgYXMgQVNULkVsZW1lbnROb2RlO1xuICAgIGxldCBwYXJlbnQgPSB0aGlzLmN1cnJlbnRFbGVtZW50KCk7XG5cbiAgICB2YWxpZGF0ZUVuZFRhZyh0YWcsIGVsZW1lbnQsIGlzVm9pZCk7XG5cbiAgICBlbGVtZW50LmxvYy5lbmQubGluZSA9IHRoaXMudG9rZW5pemVyLmxpbmU7XG4gICAgZWxlbWVudC5sb2MuZW5kLmNvbHVtbiA9IHRoaXMudG9rZW5pemVyLmNvbHVtbjtcblxuICAgIHBhcnNlRWxlbWVudEJsb2NrUGFyYW1zKGVsZW1lbnQpO1xuICAgIGFwcGVuZENoaWxkKHBhcmVudCwgZWxlbWVudCk7XG4gIH1cblxuICBtYXJrVGFnQXNTZWxmQ2xvc2luZygpIHtcbiAgICB0aGlzLmN1cnJlbnRUYWcuc2VsZkNsb3NpbmcgPSB0cnVlO1xuICB9XG5cbiAgLy8gVGFncyAtIG5hbWVcblxuICBhcHBlbmRUb1RhZ05hbWUoY2hhcjogc3RyaW5nKSB7XG4gICAgdGhpcy5jdXJyZW50VGFnLm5hbWUgKz0gY2hhcjtcbiAgfVxuXG4gIC8vIFRhZ3MgLSBhdHRyaWJ1dGVzXG5cbiAgYmVnaW5BdHRyaWJ1dGUoKSB7XG4gICAgbGV0IHRhZyA9IHRoaXMuY3VycmVudFRhZztcbiAgICBpZiAodGFnLnR5cGUgPT09ICdFbmRUYWcnKSB7XG4gICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgIGBJbnZhbGlkIGVuZCB0YWc6IGNsb3NpbmcgdGFnIG11c3Qgbm90IGhhdmUgYXR0cmlidXRlcywgYCArXG4gICAgICAgICAgYGluIFxcYCR7dGFnLm5hbWV9XFxgIChvbiBsaW5lICR7dGhpcy50b2tlbml6ZXIubGluZX0pLmAsXG4gICAgICAgIHRhZy5sb2NcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50QXR0cmlidXRlID0ge1xuICAgICAgbmFtZTogJycsXG4gICAgICBwYXJ0czogW10sXG4gICAgICBpc1F1b3RlZDogZmFsc2UsXG4gICAgICBpc0R5bmFtaWM6IGZhbHNlLFxuICAgICAgc3RhcnQ6IGIucG9zKHRoaXMudG9rZW5pemVyLmxpbmUsIHRoaXMudG9rZW5pemVyLmNvbHVtbiksXG4gICAgICB2YWx1ZVN0YXJ0TGluZTogMCxcbiAgICAgIHZhbHVlU3RhcnRDb2x1bW46IDAsXG4gICAgfTtcbiAgfVxuXG4gIGFwcGVuZFRvQXR0cmlidXRlTmFtZShjaGFyOiBzdHJpbmcpIHtcbiAgICB0aGlzLmN1cnJlbnRBdHRyLm5hbWUgKz0gY2hhcjtcbiAgfVxuXG4gIGJlZ2luQXR0cmlidXRlVmFsdWUoaXNRdW90ZWQ6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmN1cnJlbnRBdHRyLmlzUXVvdGVkID0gaXNRdW90ZWQ7XG4gICAgdGhpcy5jdXJyZW50QXR0ci52YWx1ZVN0YXJ0TGluZSA9IHRoaXMudG9rZW5pemVyLmxpbmU7XG4gICAgdGhpcy5jdXJyZW50QXR0ci52YWx1ZVN0YXJ0Q29sdW1uID0gdGhpcy50b2tlbml6ZXIuY29sdW1uO1xuICB9XG5cbiAgYXBwZW5kVG9BdHRyaWJ1dGVWYWx1ZShjaGFyOiBzdHJpbmcpIHtcbiAgICBsZXQgcGFydHMgPSB0aGlzLmN1cnJlbnRBdHRyLnBhcnRzO1xuICAgIGxldCBsYXN0UGFydCA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdO1xuXG4gICAgaWYgKGxhc3RQYXJ0ICYmIGxhc3RQYXJ0LnR5cGUgPT09ICdUZXh0Tm9kZScpIHtcbiAgICAgIGxhc3RQYXJ0LmNoYXJzICs9IGNoYXI7XG5cbiAgICAgIC8vIHVwZGF0ZSBlbmQgbG9jYXRpb24gZm9yIGVhY2ggYWRkZWQgY2hhclxuICAgICAgbGFzdFBhcnQubG9jLmVuZC5saW5lID0gdGhpcy50b2tlbml6ZXIubGluZTtcbiAgICAgIGxhc3RQYXJ0LmxvYy5lbmQuY29sdW1uID0gdGhpcy50b2tlbml6ZXIuY29sdW1uO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpbml0aWFsbHkgYXNzdW1lIHRoZSB0ZXh0IG5vZGUgaXMgYSBzaW5nbGUgY2hhclxuICAgICAgbGV0IGxvYyA9IGIubG9jKFxuICAgICAgICB0aGlzLnRva2VuaXplci5saW5lLFxuICAgICAgICB0aGlzLnRva2VuaXplci5jb2x1bW4sXG4gICAgICAgIHRoaXMudG9rZW5pemVyLmxpbmUsXG4gICAgICAgIHRoaXMudG9rZW5pemVyLmNvbHVtblxuICAgICAgKTtcblxuICAgICAgLy8gdGhlIHRva2VuaXplciBsaW5lL2NvbHVtbiBoYXZlIGFscmVhZHkgYmVlbiBhZHZhbmNlZCwgY29ycmVjdCBsb2NhdGlvbiBpbmZvXG4gICAgICBpZiAoY2hhciA9PT0gJ1xcbicpIHtcbiAgICAgICAgbG9jLnN0YXJ0LmxpbmUgLT0gMTtcbiAgICAgICAgbG9jLnN0YXJ0LmNvbHVtbiA9IGxhc3RQYXJ0ID8gbGFzdFBhcnQubG9jLmVuZC5jb2x1bW4gOiB0aGlzLmN1cnJlbnRBdHRyLnZhbHVlU3RhcnRDb2x1bW47XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2Muc3RhcnQuY29sdW1uIC09IDE7XG4gICAgICB9XG5cbiAgICAgIGxldCB0ZXh0ID0gYi50ZXh0KGNoYXIsIGxvYyk7XG4gICAgICBwYXJ0cy5wdXNoKHRleHQpO1xuICAgIH1cbiAgfVxuXG4gIGZpbmlzaEF0dHJpYnV0ZVZhbHVlKCkge1xuICAgIGxldCB7IG5hbWUsIHBhcnRzLCBpc1F1b3RlZCwgaXNEeW5hbWljLCB2YWx1ZVN0YXJ0TGluZSwgdmFsdWVTdGFydENvbHVtbiB9ID0gdGhpcy5jdXJyZW50QXR0cjtcbiAgICBsZXQgdmFsdWUgPSBhc3NlbWJsZUF0dHJpYnV0ZVZhbHVlKHBhcnRzLCBpc1F1b3RlZCwgaXNEeW5hbWljLCB0aGlzLnRva2VuaXplci5saW5lKTtcbiAgICB2YWx1ZS5sb2MgPSBiLmxvYyh2YWx1ZVN0YXJ0TGluZSwgdmFsdWVTdGFydENvbHVtbiwgdGhpcy50b2tlbml6ZXIubGluZSwgdGhpcy50b2tlbml6ZXIuY29sdW1uKTtcblxuICAgIGxldCBsb2MgPSBiLmxvYyhcbiAgICAgIHRoaXMuY3VycmVudEF0dHIuc3RhcnQubGluZSxcbiAgICAgIHRoaXMuY3VycmVudEF0dHIuc3RhcnQuY29sdW1uLFxuICAgICAgdGhpcy50b2tlbml6ZXIubGluZSxcbiAgICAgIHRoaXMudG9rZW5pemVyLmNvbHVtblxuICAgICk7XG5cbiAgICBsZXQgYXR0cmlidXRlID0gYi5hdHRyKG5hbWUsIHZhbHVlLCBsb2MpO1xuXG4gICAgdGhpcy5jdXJyZW50U3RhcnRUYWcuYXR0cmlidXRlcy5wdXNoKGF0dHJpYnV0ZSk7XG4gIH1cblxuICByZXBvcnRTeW50YXhFcnJvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICBgU3ludGF4IGVycm9yIGF0IGxpbmUgJHt0aGlzLnRva2VuaXplci5saW5lfSBjb2wgJHt0aGlzLnRva2VuaXplci5jb2x1bW59OiAke21lc3NhZ2V9YCxcbiAgICAgIGIubG9jKHRoaXMudG9rZW5pemVyLmxpbmUsIHRoaXMudG9rZW5pemVyLmNvbHVtbilcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFzc2VtYmxlQXR0cmlidXRlVmFsdWUoXG4gIHBhcnRzOiAoQVNULk11c3RhY2hlU3RhdGVtZW50IHwgQVNULlRleHROb2RlKVtdLFxuICBpc1F1b3RlZDogYm9vbGVhbixcbiAgaXNEeW5hbWljOiBib29sZWFuLFxuICBsaW5lOiBudW1iZXJcbikge1xuICBpZiAoaXNEeW5hbWljKSB7XG4gICAgaWYgKGlzUXVvdGVkKSB7XG4gICAgICByZXR1cm4gYXNzZW1ibGVDb25jYXRlbmF0ZWRWYWx1ZShwYXJ0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChcbiAgICAgICAgcGFydHMubGVuZ3RoID09PSAxIHx8XG4gICAgICAgIChwYXJ0cy5sZW5ndGggPT09IDIgJiZcbiAgICAgICAgICBwYXJ0c1sxXS50eXBlID09PSAnVGV4dE5vZGUnICYmXG4gICAgICAgICAgKHBhcnRzWzFdIGFzIEFTVC5UZXh0Tm9kZSkuY2hhcnMgPT09ICcvJylcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gcGFydHNbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXG4gICAgICAgICAgYEFuIHVucXVvdGVkIGF0dHJpYnV0ZSB2YWx1ZSBtdXN0IGJlIGEgc3RyaW5nIG9yIGEgbXVzdGFjaGUsIGAgK1xuICAgICAgICAgICAgYHByZWNlZWRlZCBieSB3aGl0ZXNwYWNlIG9yIGEgJz0nIGNoYXJhY3RlciwgYW5kIGAgK1xuICAgICAgICAgICAgYGZvbGxvd2VkIGJ5IHdoaXRlc3BhY2UsIGEgJz4nIGNoYXJhY3Rlciwgb3IgJy8+JyAob24gbGluZSAke2xpbmV9KWAsXG4gICAgICAgICAgYi5sb2MobGluZSwgMClcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHBhcnRzLmxlbmd0aCA+IDAgPyBwYXJ0c1swXSA6IGIudGV4dCgnJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXNzZW1ibGVDb25jYXRlbmF0ZWRWYWx1ZShwYXJ0czogKEFTVC5NdXN0YWNoZVN0YXRlbWVudCB8IEFTVC5UZXh0Tm9kZSlbXSkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IHBhcnQ6IEFTVC5CYXNlTm9kZSA9IHBhcnRzW2ldO1xuXG4gICAgaWYgKHBhcnQudHlwZSAhPT0gJ011c3RhY2hlU3RhdGVtZW50JyAmJiBwYXJ0LnR5cGUgIT09ICdUZXh0Tm9kZScpIHtcbiAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcbiAgICAgICAgJ1Vuc3VwcG9ydGVkIG5vZGUgaW4gcXVvdGVkIGF0dHJpYnV0ZSB2YWx1ZTogJyArIHBhcnRbJ3R5cGUnXSxcbiAgICAgICAgcGFydC5sb2NcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGIuY29uY2F0KHBhcnRzKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVFbmRUYWcoXG4gIHRhZzogVGFnPCdTdGFydFRhZycgfCAnRW5kVGFnJz4sXG4gIGVsZW1lbnQ6IEFTVC5FbGVtZW50Tm9kZSxcbiAgc2VsZkNsb3Npbmc6IGJvb2xlYW5cbikge1xuICBsZXQgZXJyb3I7XG5cbiAgaWYgKHZvaWRNYXBbdGFnLm5hbWVdICYmICFzZWxmQ2xvc2luZykge1xuICAgIC8vIEVuZ1RhZyBpcyBhbHNvIGNhbGxlZCBieSBTdGFydFRhZyBmb3Igdm9pZCBhbmQgc2VsZi1jbG9zaW5nIHRhZ3MgKGkuZS5cbiAgICAvLyA8aW5wdXQ+IG9yIDxiciAvPiwgc28gd2UgbmVlZCB0byBjaGVjayBmb3IgdGhhdCBoZXJlLiBPdGhlcndpc2UsIHdlIHdvdWxkXG4gICAgLy8gdGhyb3cgYW4gZXJyb3IgZm9yIHRob3NlIGNhc2VzLlxuICAgIGVycm9yID0gJ0ludmFsaWQgZW5kIHRhZyAnICsgZm9ybWF0RW5kVGFnSW5mbyh0YWcpICsgJyAodm9pZCBlbGVtZW50cyBjYW5ub3QgaGF2ZSBlbmQgdGFncykuJztcbiAgfSBlbHNlIGlmIChlbGVtZW50LnRhZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZXJyb3IgPSAnQ2xvc2luZyB0YWcgJyArIGZvcm1hdEVuZFRhZ0luZm8odGFnKSArICcgd2l0aG91dCBhbiBvcGVuIHRhZy4nO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQudGFnICE9PSB0YWcubmFtZSkge1xuICAgIGVycm9yID1cbiAgICAgICdDbG9zaW5nIHRhZyAnICtcbiAgICAgIGZvcm1hdEVuZFRhZ0luZm8odGFnKSArXG4gICAgICAnIGRpZCBub3QgbWF0Y2ggbGFzdCBvcGVuIHRhZyBgJyArXG4gICAgICBlbGVtZW50LnRhZyArXG4gICAgICAnYCAob24gbGluZSAnICtcbiAgICAgIGVsZW1lbnQubG9jLnN0YXJ0LmxpbmUgK1xuICAgICAgJykuJztcbiAgfVxuXG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihlcnJvciwgZWxlbWVudC5sb2MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZvcm1hdEVuZFRhZ0luZm8odGFnOiBUYWc8J1N0YXJ0VGFnJyB8ICdFbmRUYWcnPikge1xuICByZXR1cm4gJ2AnICsgdGFnLm5hbWUgKyAnYCAob24gbGluZSAnICsgdGFnLmxvYy5lbmQubGluZSArICcpJztcbn1cblxuLyoqXG4gIEFTVFBsdWdpbnMgY2FuIG1ha2UgY2hhbmdlcyB0byB0aGUgR2xpbW1lciB0ZW1wbGF0ZSBBU1QgYmVmb3JlXG4gIGNvbXBpbGF0aW9uIGJlZ2lucy5cbiovXG5leHBvcnQgaW50ZXJmYWNlIEFTVFBsdWdpbkJ1aWxkZXIge1xuICAoZW52OiBBU1RQbHVnaW5FbnZpcm9ubWVudCk6IEFTVFBsdWdpbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBU1RQbHVnaW4ge1xuICBuYW1lOiBzdHJpbmc7XG4gIHZpc2l0b3I6IE5vZGVWaXNpdG9yO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFTVFBsdWdpbkVudmlyb25tZW50IHtcbiAgbWV0YT86IG9iamVjdDtcbiAgc3ludGF4OiBTeW50YXg7XG59XG5pbnRlcmZhY2UgSGFuZGxlYmFyc1BhcnNlT3B0aW9ucyB7XG4gIHNyY05hbWU/OiBzdHJpbmc7XG4gIGlnbm9yZVN0YW5kYWxvbmU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByZXByb2Nlc3NPcHRpb25zIHtcbiAgbWV0YT86IHtcbiAgICBtb2R1bGVOYW1lPzogc3RyaW5nO1xuICB9O1xuICBwbHVnaW5zPzoge1xuICAgIGFzdD86IEFTVFBsdWdpbkJ1aWxkZXJbXTtcbiAgfTtcbiAgcGFyc2VPcHRpb25zPzogSGFuZGxlYmFyc1BhcnNlT3B0aW9ucztcblxuICAvKipcbiAgICBVc2VmdWwgZm9yIHNwZWNpZnlpbmcgYSBncm91cCBvZiBvcHRpb25zIHRvZ2V0aGVyLlxuXG4gICAgV2hlbiBgJ2NvZGVtb2QnYCB3ZSBkaXNhYmxlIGFsbCB3aGl0ZXNwYWNlIGNvbnRyb2wgaW4gaGFuZGxlYmFyc1xuICAgICh0byBwcmVzZXJ2ZSBhcyBtdWNoIGFzIHBvc3NpYmxlKSBhbmQgd2UgYWxzbyBhdm9pZCBhbnlcbiAgICBlc2NhcGluZy91bmVzY2FwaW5nIG9mIEhUTUwgZW50aXR5IGNvZGVzLlxuICAgKi9cbiAgbW9kZT86ICdjb2RlbW9kJyB8ICdwcmVjb21waWxlJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTeW50YXgge1xuICBwYXJzZTogdHlwZW9mIHByZXByb2Nlc3M7XG4gIGJ1aWxkZXJzOiB0eXBlb2YgYnVpbGRlcnM7XG4gIHByaW50OiB0eXBlb2YgcHJpbnQ7XG4gIHRyYXZlcnNlOiB0eXBlb2YgdHJhdmVyc2U7XG4gIFdhbGtlcjogdHlwZW9mIFdhbGtlcjtcbn1cblxuY29uc3Qgc3ludGF4OiBTeW50YXggPSB7XG4gIHBhcnNlOiBwcmVwcm9jZXNzLFxuICBidWlsZGVycyxcbiAgcHJpbnQsXG4gIHRyYXZlcnNlLFxuICBXYWxrZXIsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gcHJlcHJvY2VzcyhodG1sOiBzdHJpbmcsIG9wdGlvbnM6IFByZXByb2Nlc3NPcHRpb25zID0ge30pOiBBU1QuVGVtcGxhdGUge1xuICBsZXQgbW9kZSA9IG9wdGlvbnMubW9kZSB8fCAncHJlY29tcGlsZSc7XG5cbiAgbGV0IGFzdDogSEJTLlByb2dyYW07XG4gIGlmICh0eXBlb2YgaHRtbCA9PT0gJ29iamVjdCcpIHtcbiAgICBhc3QgPSBodG1sO1xuICB9IGVsc2UgaWYgKG1vZGUgPT09ICdjb2RlbW9kJykge1xuICAgIGFzdCA9IHBhcnNlV2l0aG91dFByb2Nlc3NpbmcoaHRtbCwgb3B0aW9ucy5wYXJzZU9wdGlvbnMpIGFzIEhCUy5Qcm9ncmFtO1xuICB9IGVsc2Uge1xuICAgIGFzdCA9IHBhcnNlKGh0bWwsIG9wdGlvbnMucGFyc2VPcHRpb25zKSBhcyBIQlMuUHJvZ3JhbTtcbiAgfVxuXG4gIGxldCBlbnRpdHlQYXJzZXIgPSB1bmRlZmluZWQ7XG4gIGlmIChtb2RlID09PSAnY29kZW1vZCcpIHtcbiAgICBlbnRpdHlQYXJzZXIgPSBuZXcgRW50aXR5UGFyc2VyKHt9KTtcbiAgfVxuXG4gIGxldCBwcm9ncmFtID0gbmV3IFRva2VuaXplckV2ZW50SGFuZGxlcnMoaHRtbCwgZW50aXR5UGFyc2VyLCBtb2RlKS5hY2NlcHRUZW1wbGF0ZShhc3QpO1xuXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMucGx1Z2lucyAmJiBvcHRpb25zLnBsdWdpbnMuYXN0KSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBvcHRpb25zLnBsdWdpbnMuYXN0Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgbGV0IHRyYW5zZm9ybSA9IG9wdGlvbnMucGx1Z2lucy5hc3RbaV07XG4gICAgICBsZXQgZW52OiBBU1RQbHVnaW5FbnZpcm9ubWVudCA9IGFzc2lnbih7fSwgb3B0aW9ucywgeyBzeW50YXggfSwgeyBwbHVnaW5zOiB1bmRlZmluZWQgfSk7XG5cbiAgICAgIGxldCBwbHVnaW5SZXN1bHQgPSB0cmFuc2Zvcm0oZW52KTtcblxuICAgICAgdHJhdmVyc2UocHJvZ3JhbSwgcGx1Z2luUmVzdWx0LnZpc2l0b3IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwcm9ncmFtO1xufVxuIl0sInNvdXJjZVJvb3QiOiIifQ==
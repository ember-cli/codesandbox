'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EMPTY_ARGS = exports.CapturedArgumentsImpl = exports.BlockArgumentsImpl = exports.CapturedNamedArgumentsImpl = exports.NamedArgumentsImpl = exports.CapturedPositionalArgumentsImpl = exports.PositionalArgumentsImpl = exports.VMArgumentsImpl = undefined;

var _util = require('@glimmer/util');

var _reference = require('@glimmer/reference');

var _references = require('../references');

var _symbols = require('../symbols');

var _vm = require('@glimmer/vm');

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
        let base = stack[_symbols.REGISTERS][_vm.$sp] + 1;
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
        let namedBase = stack[_symbols.REGISTERS][_vm.$sp] - namedCount + 1;
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
        return (0, _reference.combineTagged)([this.positional, this.named]);
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
        let { stack } = this;
        if (offset > 0 && stack !== null) {
            let { positional, named } = this;
            let newBase = positional.base + offset;
            let length = positional.length + named.length;
            for (let i = length - 1; i >= 0; i--) {
                stack.copy(i + positional.base, i + newBase);
            }
            positional.base += offset;
            named.base += offset;
            stack[_symbols.REGISTERS][_vm.$sp] += offset;
        }
    }
    capture() {
        let positional = this.positional.length === 0 ? EMPTY_POSITIONAL : this.positional.capture();
        let named = this.named.length === 0 ? EMPTY_NAMED : this.named.capture();
        return new CapturedArgumentsImpl(this.tag, positional, named, this.length);
    }
    clear() {
        let { stack, length } = this;
        if (length > 0 && stack !== null) stack.pop(length);
    }
}
exports.VMArgumentsImpl = VMArgumentsImpl;
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
        this._tag = _reference.CONSTANT_TAG;
        this._references = _util.EMPTY_ARRAY;
    }
    setup(stack, base, length) {
        this.stack = stack;
        this.base = base;
        this.length = length;
        if (length === 0) {
            this._tag = _reference.CONSTANT_TAG;
            this._references = _util.EMPTY_ARRAY;
        } else {
            this._tag = null;
            this._references = null;
        }
    }
    get tag() {
        let tag = this._tag;
        if (!tag) {
            tag = this._tag = (0, _reference.combineTagged)(this.references);
        }
        return tag;
    }
    at(position) {
        let { base, length, stack } = this;
        if (position < 0 || position >= length) {
            return _references.UNDEFINED_REFERENCE;
        }
        return stack.get(position, base);
    }
    capture() {
        return new CapturedPositionalArgumentsImpl(this.tag, this.references);
    }
    prepend(other) {
        let additions = other.length;
        if (additions > 0) {
            let { base, length, stack } = this;
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
            let { stack, base, length } = this;
            references = this._references = stack.sliceArray(base, base + length);
        }
        return references;
    }
}
exports.PositionalArgumentsImpl = PositionalArgumentsImpl;
class CapturedPositionalArgumentsImpl {
    constructor(tag, references, length = references.length) {
        this.tag = tag;
        this.references = references;
        this.length = length;
    }
    static empty() {
        return new CapturedPositionalArgumentsImpl(_reference.CONSTANT_TAG, _util.EMPTY_ARRAY, 0);
    }
    at(position) {
        return this.references[position];
    }
    value() {
        return this.references.map(this.valueOf);
    }
    get(name) {
        let { references, length } = this;
        if (name === 'length') {
            return _references.PrimitiveReference.create(length);
        } else {
            let idx = parseInt(name, 10);
            if (idx < 0 || idx >= length) {
                return _references.UNDEFINED_REFERENCE;
            } else {
                return references[idx];
            }
        }
    }
    valueOf(reference) {
        return reference.value();
    }
}
exports.CapturedPositionalArgumentsImpl = CapturedPositionalArgumentsImpl;
class NamedArgumentsImpl {
    constructor() {
        this.base = 0;
        this.length = 0;
        this._references = null;
        this._names = _util.EMPTY_ARRAY;
        this._atNames = _util.EMPTY_ARRAY;
    }
    empty(stack, base) {
        this.stack = stack;
        this.base = base;
        this.length = 0;
        this._references = _util.EMPTY_ARRAY;
        this._names = _util.EMPTY_ARRAY;
        this._atNames = _util.EMPTY_ARRAY;
    }
    setup(stack, base, length, names, atNames) {
        this.stack = stack;
        this.base = base;
        this.length = length;
        if (length === 0) {
            this._references = _util.EMPTY_ARRAY;
            this._names = _util.EMPTY_ARRAY;
            this._atNames = _util.EMPTY_ARRAY;
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
        return (0, _reference.combineTagged)(this.references);
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
        let { base, stack } = this;
        let names = atNames ? this.atNames : this.names;
        let idx = names.indexOf(name);
        if (idx === -1) {
            return _references.UNDEFINED_REFERENCE;
        }
        return stack.get(idx, base);
    }
    capture() {
        return new CapturedNamedArgumentsImpl(this.tag, this.names, this.references);
    }
    merge(other) {
        let { length: extras } = other;
        if (extras > 0) {
            let { names, length, stack } = this;
            let { names: extraNames } = other;
            if (Object.isFrozen(names) && names.length === 0) {
                names = [];
            }
            for (let i = 0; i < extras; i++) {
                let name = extraNames[i];
                let idx = names.indexOf(name);
                if (idx === -1) {
                    length = names.push(name);
                    stack.push(other.references[i]);
                }
            }
            this.length = length;
            this._references = null;
            this._names = names;
            this._atNames = null;
        }
    }
    get references() {
        let references = this._references;
        if (!references) {
            let { base, length, stack } = this;
            references = this._references = stack.sliceArray(base, base + length);
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
exports.NamedArgumentsImpl = NamedArgumentsImpl;
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
            let { names, references } = this;
            map = this._map = (0, _util.dict)();
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
        let { names, references } = this;
        let idx = names.indexOf(name);
        if (idx === -1) {
            return _references.UNDEFINED_REFERENCE;
        } else {
            return references[idx];
        }
    }
    value() {
        let { names, references } = this;
        let out = (0, _util.dict)();
        for (let i = 0; i < names.length; i++) {
            let name = names[i];
            out[name] = references[i].value();
        }
        return out;
    }
}
exports.CapturedNamedArgumentsImpl = CapturedNamedArgumentsImpl;
class BlockArgumentsImpl {
    constructor() {
        this.internalValues = null;
        this.internalTag = null;
        this.names = _util.EMPTY_ARRAY;
        this.length = 0;
        this.base = 0;
    }
    empty(stack, base) {
        this.stack = stack;
        this.names = _util.EMPTY_ARRAY;
        this.base = base;
        this.length = 0;
        this.internalTag = _reference.CONSTANT_TAG;
        this.internalValues = _util.EMPTY_ARRAY;
    }
    setup(stack, base, length, names) {
        this.stack = stack;
        this.names = names;
        this.base = base;
        this.length = length;
        if (length === 0) {
            this.internalTag = _reference.CONSTANT_TAG;
            this.internalValues = _util.EMPTY_ARRAY;
        } else {
            this.internalTag = null;
            this.internalValues = null;
        }
    }
    get values() {
        let values = this.internalValues;
        if (!values) {
            let { base, length, stack } = this;
            values = this.internalValues = stack.sliceArray(base, base + length * 3);
        }
        return values;
    }
    has(name) {
        return this.names.indexOf(name) !== -1;
    }
    get(name) {
        let { base, stack, names } = this;
        let idx = names.indexOf(name);
        if (names.indexOf(name) === -1) {
            return null;
        }
        let table = stack.get(idx * 3, base);
        let scope = stack.get(idx * 3 + 1, base);
        let handle = stack.get(idx * 3 + 2, base);
        return handle === null ? null : [handle, scope, table];
    }
    capture() {
        return new CapturedBlockArgumentsImpl(this.names, this.values);
    }
}
exports.BlockArgumentsImpl = BlockArgumentsImpl;
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
exports.CapturedArgumentsImpl = CapturedArgumentsImpl;
const EMPTY_NAMED = new CapturedNamedArgumentsImpl(_reference.CONSTANT_TAG, _util.EMPTY_ARRAY, _util.EMPTY_ARRAY);
const EMPTY_POSITIONAL = new CapturedPositionalArgumentsImpl(_reference.CONSTANT_TAG, _util.EMPTY_ARRAY);
const EMPTY_ARGS = exports.EMPTY_ARGS = new CapturedArgumentsImpl(_reference.CONSTANT_TAG, EMPTY_POSITIONAL, EMPTY_NAMED, 0);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3J1bnRpbWUvbGliL3ZtL2FyZ3VtZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFFQTs7QUFvQkE7O0FBT0E7O0FBQ0E7O0FBRUE7Ozs7Ozs7QUFRTSxNQUFBLGVBQUEsQ0FBc0I7QUFBNUIsa0JBQUE7QUFDVSxhQUFBLEtBQUEsR0FBQSxJQUFBO0FBQ0QsYUFBQSxVQUFBLEdBQWEsSUFBYix1QkFBYSxFQUFiO0FBQ0EsYUFBQSxLQUFBLEdBQVEsSUFBUixrQkFBUSxFQUFSO0FBQ0EsYUFBQSxNQUFBLEdBQVMsSUFBVCxrQkFBUyxFQUFUO0FBMkZSO0FBekZDLFVBQUEsS0FBQSxFQUE0QjtBQUMxQixZQUFJLE9BQU8sTUFBQSxrQkFBQSxFQUFBLE9BQUEsSUFBWCxDQUFBO0FBRUEsYUFBQSxLQUFBLENBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxJQUFBO0FBQ0EsYUFBQSxVQUFBLENBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxJQUFBO0FBQ0EsYUFBQSxNQUFBLENBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxJQUFBO0FBRUEsZUFBQSxJQUFBO0FBQ0Q7QUFFRCxVQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsVUFBQSxFQUFBLGVBQUEsRUFBQSxPQUFBLEVBS2tCO0FBRWhCLGFBQUEsS0FBQSxHQUFBLEtBQUE7QUFFQTs7Ozs7OztBQVFBLFlBQUksUUFBUSxLQUFaLEtBQUE7QUFDQSxZQUFJLGFBQWEsTUFBakIsTUFBQTtBQUNBLFlBQUksWUFBWSxNQUFBLGtCQUFBLEVBQUEsT0FBQSxJQUFBLFVBQUEsR0FBaEIsQ0FBQTtBQUVBLGNBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsVUFBQSxFQUFBLEtBQUEsRUFBQSxPQUFBO0FBRUEsWUFBSSxhQUFhLEtBQWpCLFVBQUE7QUFDQSxZQUFJLGlCQUFpQixZQUFyQixlQUFBO0FBRUEsbUJBQUEsS0FBQSxDQUFBLEtB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LGdCQUFBLEVBQUEsV0FBQSxFQUFuQixDQUFtQixDQUFuQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV2YWx1YXRpb25TdGFjayB9IGZyb20gJy4vc3RhY2snO1xuaW1wb3J0IHsgZGljdCwgRU1QVFlfQVJSQVkgfSBmcm9tICdAZ2xpbW1lci91dGlsJztcbmltcG9ydCB7IGNvbWJpbmVUYWdnZWQgfSBmcm9tICdAZ2xpbW1lci9yZWZlcmVuY2UnO1xuaW1wb3J0IHtcbiAgRGljdCxcbiAgT3B0aW9uLFxuICB1bnNhZmUsXG4gIEJsb2NrU3ltYm9sVGFibGUsXG4gIFZNQXJndW1lbnRzLFxuICBDYXB0dXJlZEFyZ3VtZW50cyxcbiAgUG9zaXRpb25hbEFyZ3VtZW50cyxcbiAgQ2FwdHVyZWRQb3NpdGlvbmFsQXJndW1lbnRzLFxuICBOYW1lZEFyZ3VtZW50cyxcbiAgQ2FwdHVyZWROYW1lZEFyZ3VtZW50cyxcbiAgSml0T3JBb3RCbG9jayxcbiAgQmxvY2tWYWx1ZSxcbiAgU2NvcGVCbG9jayxcbiAgQ2FwdHVyZWRCbG9ja0FyZ3VtZW50cyxcbiAgU2NvcGUsXG4gIEJsb2NrQXJndW1lbnRzLFxufSBmcm9tICdAZ2xpbW1lci9pbnRlcmZhY2VzJztcbmltcG9ydCB7IFRhZywgVmVyc2lvbmVkUGF0aFJlZmVyZW5jZSwgQ09OU1RBTlRfVEFHIH0gZnJvbSAnQGdsaW1tZXIvcmVmZXJlbmNlJztcbmltcG9ydCB7IFByaW1pdGl2ZVJlZmVyZW5jZSwgVU5ERUZJTkVEX1JFRkVSRU5DRSB9IGZyb20gJy4uL3JlZmVyZW5jZXMnO1xuaW1wb3J0IHsgQ2hlY2tCbG9ja1N5bWJvbFRhYmxlLCBjaGVjaywgQ2hlY2tIYW5kbGUsIENoZWNrT3B0aW9uLCBDaGVja09yIH0gZnJvbSAnQGdsaW1tZXIvZGVidWcnO1xuaW1wb3J0IHtcbiAgQ2hlY2tQYXRoUmVmZXJlbmNlLFxuICBDaGVja0NvbXBpbGFibGVCbG9jayxcbiAgQ2hlY2tTY29wZSxcbn0gZnJvbSAnLi4vY29tcGlsZWQvb3Bjb2Rlcy8tZGVidWctc3RyaXAnO1xuaW1wb3J0IHsgUkVHSVNURVJTIH0gZnJvbSAnLi4vc3ltYm9scyc7XG5pbXBvcnQgeyAkc3AgfSBmcm9tICdAZ2xpbW1lci92bSc7XG5cbi8qXG4gIFRoZSBjYWxsaW5nIGNvbnZlbnRpb24gaXM6XG5cbiAgKiAwLU4gYmxvY2sgYXJndW1lbnRzIGF0IHRoZSBib3R0b21cbiAgKiAwLU4gcG9zaXRpb25hbCBhcmd1bWVudHMgbmV4dCAobGVmdC10by1yaWdodClcbiAgKiAwLU4gbmFtZWQgYXJndW1lbnRzIG5leHRcbiovXG5cbmV4cG9ydCBjbGFzcyBWTUFyZ3VtZW50c0ltcGwgaW1wbGVtZW50cyBWTUFyZ3VtZW50cyB7XG4gIHByaXZhdGUgc3RhY2s6IE9wdGlvbjxFdmFsdWF0aW9uU3RhY2s+ID0gbnVsbDtcbiAgcHVibGljIHBvc2l0aW9uYWwgPSBuZXcgUG9zaXRpb25hbEFyZ3VtZW50c0ltcGwoKTtcbiAgcHVibGljIG5hbWVkID0gbmV3IE5hbWVkQXJndW1lbnRzSW1wbCgpO1xuICBwdWJsaWMgYmxvY2tzID0gbmV3IEJsb2NrQXJndW1lbnRzSW1wbCgpO1xuXG4gIGVtcHR5KHN0YWNrOiBFdmFsdWF0aW9uU3RhY2spOiB0aGlzIHtcbiAgICBsZXQgYmFzZSA9IHN0YWNrW1JFR0lTVEVSU11bJHNwXSArIDE7XG5cbiAgICB0aGlzLm5hbWVkLmVtcHR5KHN0YWNrLCBiYXNlKTtcbiAgICB0aGlzLnBvc2l0aW9uYWwuZW1wdHkoc3RhY2ssIGJhc2UpO1xuICAgIHRoaXMuYmxvY2tzLmVtcHR5KHN0YWNrLCBiYXNlKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0dXAoXG4gICAgc3RhY2s6IEV2YWx1YXRpb25TdGFjayxcbiAgICBuYW1lczogc3RyaW5nW10sXG4gICAgYmxvY2tOYW1lczogc3RyaW5nW10sXG4gICAgcG9zaXRpb25hbENvdW50OiBudW1iZXIsXG4gICAgYXROYW1lczogYm9vbGVhblxuICApIHtcbiAgICB0aGlzLnN0YWNrID0gc3RhY2s7XG5cbiAgICAvKlxuICAgICAgICAgICB8IC4uLiB8IGJsb2NrcyAgICAgIHwgcG9zaXRpb25hbCAgfCBuYW1lZCB8XG4gICAgICAgICAgIHwgLi4uIHwgYjAgICAgYjEgICAgfCBwMCBwMSBwMiBwMyB8IG4wIG4xIHxcbiAgICAgaW5kZXggfCAuLi4gfCA0LzUvNiA3LzgvOSB8IDEwIDExIDEyIDEzIHwgMTQgMTUgfFxuICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgXiAgICAgICAgICAgICBeICBeXG4gICAgICAgICAgICAgICAgIGJiYXNlICAgICAgICAgcGJhc2UgICAgICAgbmJhc2UgIHNwXG4gICAgKi9cblxuICAgIGxldCBuYW1lZCA9IHRoaXMubmFtZWQ7XG4gICAgbGV0IG5hbWVkQ291bnQgPSBuYW1lcy5sZW5ndGg7XG4gICAgbGV0IG5hbWVkQmFzZSA9IHN0YWNrW1JFR0lTVEVSU11bJHNwXSAtIG5hbWVkQ291bnQgKyAxO1xuXG4gICAgbmFtZWQuc2V0dXAoc3RhY2ssIG5hbWVkQmFzZSwgbmFtZWRDb3VudCwgbmFtZXMsIGF0TmFtZXMpO1xuXG4gICAgbGV0IHBvc2l0aW9uYWwgPSB0aGlzLnBvc2l0aW9uYWw7XG4gICAgbGV0IHBvc2l0aW9uYWxCYXNlID0gbmFtZWRCYXNlIC0gcG9zaXRpb25hbENvdW50O1xuXG4gICAgcG9zaXRpb25hbC5zZXR1cChzdGFjaywgcG9zaXRpb25hbEJhc2UsIHBvc2l0aW9uYWxDb3VudCk7XG5cbiAgICBsZXQgYmxvY2tzID0gdGhpcy5ibG9ja3M7XG4gICAgbGV0IGJsb2Nrc0NvdW50ID0gYmxvY2tOYW1lcy5sZW5ndGg7XG4gICAgbGV0IGJsb2Nrc0Jhc2UgPSBwb3NpdGlvbmFsQmFzZSAtIGJsb2Nrc0NvdW50ICogMztcblxuICAgIGJsb2Nrcy5zZXR1cChzdGFjaywgYmxvY2tzQmFzZSwgYmxvY2tzQ291bnQsIGJsb2NrTmFtZXMpO1xuICB9XG5cbiAgZ2V0IHRhZygpOiBUYWcge1xuICAgIHJldHVybiBjb21iaW5lVGFnZ2VkKFt0aGlzLnBvc2l0aW9uYWwsIHRoaXMubmFtZWRdKTtcbiAgfVxuXG4gIGdldCBiYXNlKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuYmxvY2tzLmJhc2U7XG4gIH1cblxuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMucG9zaXRpb25hbC5sZW5ndGggKyB0aGlzLm5hbWVkLmxlbmd0aCArIHRoaXMuYmxvY2tzLmxlbmd0aCAqIDM7XG4gIH1cblxuICBhdDxUIGV4dGVuZHMgVmVyc2lvbmVkUGF0aFJlZmVyZW5jZTx1bmtub3duPj4ocG9zOiBudW1iZXIpOiBUIHtcbiAgICByZXR1cm4gdGhpcy5wb3NpdGlvbmFsLmF0PFQ+KHBvcyk7XG4gIH1cblxuICByZWFsbG9jKG9mZnNldDogbnVtYmVyKSB7XG4gICAgbGV0IHsgc3RhY2sgfSA9IHRoaXM7XG4gICAgaWYgKG9mZnNldCA+IDAgJiYgc3RhY2sgIT09IG51bGwpIHtcbiAgICAgIGxldCB7IHBvc2l0aW9uYWwsIG5hbWVkIH0gPSB0aGlzO1xuICAgICAgbGV0IG5ld0Jhc2UgPSBwb3NpdGlvbmFsLmJhc2UgKyBvZmZzZXQ7XG4gICAgICBsZXQgbGVuZ3RoID0gcG9zaXRpb25hbC5sZW5ndGggKyBuYW1lZC5sZW5ndGg7XG5cbiAgICAgIGZvciAobGV0IGkgPSBsZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBzdGFjay5jb3B5KGkgKyBwb3NpdGlvbmFsLmJhc2UsIGkgKyBuZXdCYXNlKTtcbiAgICAgIH1cblxuICAgICAgcG9zaXRpb25hbC5iYXNlICs9IG9mZnNldDtcbiAgICAgIG5hbWVkLmJhc2UgKz0gb2Zmc2V0O1xuICAgICAgc3RhY2tbUkVHSVNURVJTXVskc3BdICs9IG9mZnNldDtcbiAgICB9XG4gIH1cblxuICBjYXB0dXJlKCk6IENhcHR1cmVkQXJndW1lbnRzIHtcbiAgICBsZXQgcG9zaXRpb25hbCA9IHRoaXMucG9zaXRpb25hbC5sZW5ndGggPT09IDAgPyBFTVBUWV9QT1NJVElPTkFMIDogdGhpcy5wb3NpdGlvbmFsLmNhcHR1cmUoKTtcbiAgICBsZXQgbmFtZWQgPSB0aGlzLm5hbWVkLmxlbmd0aCA9PT0gMCA/IEVNUFRZX05BTUVEIDogdGhpcy5uYW1lZC5jYXB0dXJlKCk7XG5cbiAgICByZXR1cm4gbmV3IENhcHR1cmVkQXJndW1lbnRzSW1wbCh0aGlzLnRhZywgcG9zaXRpb25hbCwgbmFtZWQsIHRoaXMubGVuZ3RoKTtcbiAgfVxuXG4gIGNsZWFyKCk6IHZvaWQge1xuICAgIGxldCB7IHN0YWNrLCBsZW5ndGggfSA9IHRoaXM7XG4gICAgaWYgKGxlbmd0aCA+IDAgJiYgc3RhY2sgIT09IG51bGwpIHN0YWNrLnBvcChsZW5ndGgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQb3NpdGlvbmFsQXJndW1lbnRzSW1wbCBpbXBsZW1lbnRzIFBvc2l0aW9uYWxBcmd1bWVudHMge1xuICBwdWJsaWMgYmFzZSA9IDA7XG4gIHB1YmxpYyBsZW5ndGggPSAwO1xuXG4gIHByaXZhdGUgc3RhY2s6IEV2YWx1YXRpb25TdGFjayA9IG51bGwgYXMgYW55O1xuXG4gIHByaXZhdGUgX3RhZzogT3B0aW9uPFRhZz4gPSBudWxsO1xuICBwcml2YXRlIF9yZWZlcmVuY2VzOiBPcHRpb248VmVyc2lvbmVkUGF0aFJlZmVyZW5jZTx1bmtub3duPltdPiA9IG51bGw7XG5cbiAgZW1wdHkoc3RhY2s6IEV2YWx1YXRpb25TdGFjaywgYmFzZTogbnVtYmVyKSB7XG4gICAgdGhpcy5zdGFjayA9IHN0YWNrO1xuICAgIHRoaXMuYmFzZSA9IGJhc2U7XG4gICAgdGhpcy5sZW5ndGggPSAwO1xuXG4gICAgdGhpcy5fdGFnID0gQ09OU1RBTlRfVEFHO1xuICAgIHRoaXMuX3JlZmVyZW5jZXMgPSBFTVBUWV9BUlJBWTtcbiAgfVxuXG4gIHNldHVwKHN0YWNrOiBFdmFsdWF0aW9uU3RhY2ssIGJhc2U6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIpIHtcbiAgICB0aGlzLnN0YWNrID0gc3RhY2s7XG4gICAgdGhpcy5iYXNlID0gYmFzZTtcbiAgICB0aGlzLmxlbmd0aCA9IGxlbmd0aDtcblxuICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuX3RhZyA9IENPTlNUQU5UX1RBRztcbiAgICAgIHRoaXMuX3JlZmVyZW5jZXMgPSBFTVBUWV9BUlJBWTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fdGFnID0gbnVsbDtcbiAgICAgIHRoaXMuX3JlZmVyZW5jZXMgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGdldCB0YWcoKTogVGFnIHtcbiAgICBsZXQgdGFnID0gdGhpcy5fdGFnO1xuXG4gICAgaWYgKCF0YWcpIHtcbiAgICAgIHRhZyA9IHRoaXMuX3RhZyA9IGNvbWJpbmVUYWdnZWQodGhpcy5yZWZlcmVuY2VzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFnO1xuICB9XG5cbiAgYXQ8VCBleHRlbmRzIFZlcnNpb25lZFBhdGhSZWZlcmVuY2U8dW5rbm93bj4+KHBvc2l0aW9uOiBudW1iZXIpOiBUIHtcbiAgICBsZXQgeyBiYXNlLCBsZW5ndGgsIHN0YWNrIH0gPSB0aGlzO1xuXG4gICAgaWYgKHBvc2l0aW9uIDwgMCB8fCBwb3NpdGlvbiA+PSBsZW5ndGgpIHtcbiAgICAgIHJldHVybiAoVU5ERUZJTkVEX1JFRkVSRU5DRSBhcyB1bnNhZmUpIGFzIFQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoZWNrKHN0YWNrLmdldChwb3NpdGlvbiwgYmFzZSksIENoZWNrUGF0aFJlZmVyZW5jZSkgYXMgVDtcbiAgfVxuXG4gIGNhcHR1cmUoKTogQ2FwdHVyZWRQb3NpdGlvbmFsQXJndW1lbnRzSW1wbCB7XG4gICAgcmV0dXJuIG5ldyBDYXB0dXJlZFBvc2l0aW9uYWxBcmd1bWVudHNJbXBsKHRoaXMudGFnLCB0aGlzLnJlZmVyZW5jZXMpO1xuICB9XG5cbiAgcHJlcGVuZChvdGhlcjogQ2FwdHVyZWRQb3NpdGlvbmFsQXJndW1lbnRzKSB7XG4gICAgbGV0IGFkZGl0aW9ucyA9IG90aGVyLmxlbmd0aDtcblxuICAgIGlmIChhZGRpdGlvbnMgPiAwKSB7XG4gICAgICBsZXQgeyBiYXNlLCBsZW5ndGgsIHN0YWNrIH0gPSB0aGlzO1xuXG4gICAgICB0aGlzLmJhc2UgPSBiYXNlID0gYmFzZSAtIGFkZGl0aW9ucztcbiAgICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoICsgYWRkaXRpb25zO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFkZGl0aW9uczsgaSsrKSB7XG4gICAgICAgIHN0YWNrLnNldChvdGhlci5hdChpKSwgaSwgYmFzZSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3RhZyA9IG51bGw7XG4gICAgICB0aGlzLl9yZWZlcmVuY2VzID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldCByZWZlcmVuY2VzKCk6IFZlcnNpb25lZFBhdGhSZWZlcmVuY2U8dW5rbm93bj5bXSB7XG4gICAgbGV0IHJlZmVyZW5jZXMgPSB0aGlzLl9yZWZlcmVuY2VzO1xuXG4gICAgaWYgKCFyZWZlcmVuY2VzKSB7XG4gICAgICBsZXQgeyBzdGFjaywgYmFzZSwgbGVuZ3RoIH0gPSB0aGlzO1xuICAgICAgcmVmZXJlbmNlcyA9IHRoaXMuX3JlZmVyZW5jZXMgPSBzdGFjay5zbGljZUFycmF5PFZlcnNpb25lZFBhdGhSZWZlcmVuY2U8dW5rbm93bj4+KFxuICAgICAgICBiYXNlLFxuICAgICAgICBiYXNlICsgbGVuZ3RoXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiByZWZlcmVuY2VzO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDYXB0dXJlZFBvc2l0aW9uYWxBcmd1bWVudHNJbXBsIGltcGxlbWVudHMgQ2FwdHVyZWRQb3NpdGlvbmFsQXJndW1lbnRzIHtcbiAgc3RhdGljIGVtcHR5KCk6IENhcHR1cmVkUG9zaXRpb25hbEFyZ3VtZW50cyB7XG4gICAgcmV0dXJuIG5ldyBDYXB0dXJlZFBvc2l0aW9uYWxBcmd1bWVudHNJbXBsKENPTlNUQU5UX1RBRywgRU1QVFlfQVJSQVksIDApO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIHRhZzogVGFnLFxuICAgIHB1YmxpYyByZWZlcmVuY2VzOiBWZXJzaW9uZWRQYXRoUmVmZXJlbmNlPHVua25vd24+W10sXG4gICAgcHVibGljIGxlbmd0aCA9IHJlZmVyZW5jZXMubGVuZ3RoXG4gICkge31cblxuICBhdDxUIGV4dGVuZHMgVmVyc2lvbmVkUGF0aFJlZmVyZW5jZTx1bmtub3duPj4ocG9zaXRpb246IG51bWJlcik6IFQge1xuICAgIHJldHVybiB0aGlzLnJlZmVyZW5jZXNbcG9zaXRpb25dIGFzIFQ7XG4gIH1cblxuICB2YWx1ZSgpOiB1bmtub3duW10ge1xuICAgIHJldHVybiB0aGlzLnJlZmVyZW5jZXMubWFwKHRoaXMudmFsdWVPZik7XG4gIH1cblxuICBnZXQobmFtZTogc3RyaW5nKTogVmVyc2lvbmVkUGF0aFJlZmVyZW5jZTx1bmtub3duPiB7XG4gICAgbGV0IHsgcmVmZXJlbmNlcywgbGVuZ3RoIH0gPSB0aGlzO1xuXG4gICAgaWYgKG5hbWUgPT09ICdsZW5ndGgnKSB7XG4gICAgICByZXR1cm4gUHJpbWl0aXZlUmVmZXJlbmNlLmNyZWF0ZShsZW5ndGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgaWR4ID0gcGFyc2VJbnQobmFtZSwgMTApO1xuXG4gICAgICBpZiAoaWR4IDwgMCB8fCBpZHggPj0gbGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBVTkRFRklORURfUkVGRVJFTkNFO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlZmVyZW5jZXNbaWR4XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHZhbHVlT2YodGhpczogdm9pZCwgcmVmZXJlbmNlOiBWZXJzaW9uZWRQYXRoUmVmZXJlbmNlPHVua25vd24+KTogdW5rbm93biB7XG4gICAgcmV0dXJuIHJlZmVyZW5jZS52YWx1ZSgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOYW1lZEFyZ3VtZW50c0ltcGwgaW1wbGVtZW50cyBOYW1lZEFyZ3VtZW50cyB7XG4gIHB1YmxpYyBiYXNlID0gMDtcbiAgcHVibGljIGxlbmd0aCA9IDA7XG5cbiAgcHJpdmF0ZSBzdGFjayE6IEV2YWx1YXRpb25TdGFjaztcblxuICBwcml2YXRlIF9yZWZlcmVuY2VzOiBPcHRpb248VmVyc2lvbmVkUGF0aFJlZmVyZW5jZTx1bmtub3duPltdPiA9IG51bGw7XG5cbiAgcHJpdmF0ZSBfbmFtZXM6IE9wdGlvbjxzdHJpbmdbXT4gPSBFTVBUWV9BUlJBWTtcbiAgcHJpdmF0ZSBfYXROYW1lczogT3B0aW9uPHN0cmluZ1tdPiA9IEVNUFRZX0FSUkFZO1xuXG4gIGVtcHR5KHN0YWNrOiBFdmFsdWF0aW9uU3RhY2ssIGJhc2U6IG51bWJlcikge1xuICAgIHRoaXMuc3RhY2sgPSBzdGFjaztcbiAgICB0aGlzLmJhc2UgPSBiYXNlO1xuICAgIHRoaXMubGVuZ3RoID0gMDtcblxuICAgIHRoaXMuX3JlZmVyZW5jZXMgPSBFTVBUWV9BUlJBWTtcbiAgICB0aGlzLl9uYW1lcyA9IEVNUFRZX0FSUkFZO1xuICAgIHRoaXMuX2F0TmFtZXMgPSBFTVBUWV9BUlJBWTtcbiAgfVxuXG4gIHNldHVwKHN0YWNrOiBFdmFsdWF0aW9uU3RhY2ssIGJhc2U6IG51bWJlciwgbGVuZ3RoOiBudW1iZXIsIG5hbWVzOiBzdHJpbmdbXSwgYXROYW1lczogYm9vbGVhbikge1xuICAgIHRoaXMuc3RhY2sgPSBzdGFjaztcbiAgICB0aGlzLmJhc2UgPSBiYXNlO1xuICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xuXG4gICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5fcmVmZXJlbmNlcyA9IEVNUFRZX0FSUkFZO1xuICAgICAgdGhpcy5fbmFtZXMgPSBFTVBUWV9BUlJBWTtcbiAgICAgIHRoaXMuX2F0TmFtZXMgPSBFTVBUWV9BUlJBWTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVmZXJlbmNlcyA9IG51bGw7XG5cbiAgICAgIGlmIChhdE5hbWVzKSB7XG4gICAgICAgIHRoaXMuX25hbWVzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fYXROYW1lcyA9IG5hbWVzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbmFtZXMgPSBuYW1lcztcbiAgICAgICAgdGhpcy5fYXROYW1lcyA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0IHRhZygpOiBUYWcge1xuICAgIHJldHVybiBjb21iaW5lVGFnZ2VkKHRoaXMucmVmZXJlbmNlcyk7XG4gIH1cblxuICBnZXQgbmFtZXMoKTogc3RyaW5nW10ge1xuICAgIGxldCBuYW1lcyA9IHRoaXMuX25hbWVzO1xuXG4gICAgaWYgKCFuYW1lcykge1xuICAgICAgbmFtZXMgPSB0aGlzLl9uYW1lcyA9IHRoaXMuX2F0TmFtZXMhLm1hcCh0aGlzLnRvU3ludGhldGljTmFtZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5hbWVzITtcbiAgfVxuXG4gIGdldCBhdE5hbWVzKCk6IHN0cmluZ1tdIHtcbiAgICBsZXQgYXROYW1lcyA9IHRoaXMuX2F0TmFtZXM7XG5cbiAgICBpZiAoIWF0TmFtZXMpIHtcbiAgICAgIGF0TmFtZXMgPSB0aGlzLl9hdE5hbWVzID0gdGhpcy5fbmFtZXMhLm1hcCh0aGlzLnRvQXROYW1lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXROYW1lcyE7XG4gIH1cblxuICBoYXMobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubmFtZXMuaW5kZXhPZihuYW1lKSAhPT0gLTE7XG4gIH1cblxuICBnZXQ8VCBleHRlbmRzIFZlcnNpb25lZFBhdGhSZWZlcmVuY2U8dW5rbm93bj4+KG5hbWU6IHN0cmluZywgYXROYW1lcyA9IGZhbHNlKTogVCB7XG4gICAgbGV0IHsgYmFzZSwgc3RhY2sgfSA9IHRoaXM7XG5cbiAgICBsZXQgbmFtZXMgPSBhdE5hbWVzID8gdGhpcy5hdE5hbWVzIDogdGhpcy5uYW1lcztcblxuICAgIGxldCBpZHggPSBuYW1lcy5pbmRleE9mKG5hbWUpO1xuXG4gICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAoVU5ERUZJTkVEX1JFRkVSRU5DRSBhcyB1bnNhZmUpIGFzIFQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YWNrLmdldDxUPihpZHgsIGJhc2UpO1xuICB9XG5cbiAgY2FwdHVyZSgpOiBDYXB0dXJlZE5hbWVkQXJndW1lbnRzIHtcbiAgICByZXR1cm4gbmV3IENhcHR1cmVkTmFtZWRBcmd1bWVudHNJbXBsKHRoaXMudGFnLCB0aGlzLm5hbWVzLCB0aGlzLnJlZmVyZW5jZXMpO1xuICB9XG5cbiAgbWVyZ2Uob3RoZXI6IENhcHR1cmVkTmFtZWRBcmd1bWVudHMpIHtcbiAgICBsZXQgeyBsZW5ndGg6IGV4dHJhcyB9ID0gb3RoZXI7XG5cbiAgICBpZiAoZXh0cmFzID4gMCkge1xuICAgICAgbGV0IHsgbmFtZXMsIGxlbmd0aCwgc3RhY2sgfSA9IHRoaXM7XG4gICAgICBsZXQgeyBuYW1lczogZXh0cmFOYW1lcyB9ID0gb3RoZXI7XG5cbiAgICAgIGlmIChPYmplY3QuaXNGcm96ZW4obmFtZXMpICYmIG5hbWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBuYW1lcyA9IFtdO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4dHJhczsgaSsrKSB7XG4gICAgICAgIGxldCBuYW1lID0gZXh0cmFOYW1lc1tpXTtcbiAgICAgICAgbGV0IGlkeCA9IG5hbWVzLmluZGV4T2YobmFtZSk7XG5cbiAgICAgICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgICBsZW5ndGggPSBuYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgICAgIHN0YWNrLnB1c2gob3RoZXIucmVmZXJlbmNlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5sZW5ndGggPSBsZW5ndGg7XG4gICAgICB0aGlzLl9yZWZlcmVuY2VzID0gbnVsbDtcbiAgICAgIHRoaXMuX25hbWVzID0gbmFtZXM7XG4gICAgICB0aGlzLl9hdE5hbWVzID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldCByZWZlcmVuY2VzKCk6IFZlcnNpb25lZFBhdGhSZWZlcmVuY2U8dW5rbm93bj5bXSB7XG4gICAgbGV0IHJlZmVyZW5jZXMgPSB0aGlzLl9yZWZlcmVuY2VzO1xuXG4gICAgaWYgKCFyZWZlcmVuY2VzKSB7XG4gICAgICBsZXQgeyBiYXNlLCBsZW5ndGgsIHN0YWNrIH0gPSB0aGlzO1xuICAgICAgcmVmZXJlbmNlcyA9IHRoaXMuX3JlZmVyZW5jZXMgPSBzdGFjay5zbGljZUFycmF5PFZlcnNpb25lZFBhdGhSZWZlcmVuY2U8dW5rbm93bj4+KFxuICAgICAgICBiYXNlLFxuICAgICAgICBiYXNlICsgbGVuZ3RoXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiByZWZlcmVuY2VzO1xuICB9XG5cbiAgcHJpdmF0ZSB0b1N5bnRoZXRpY05hbWUodGhpczogdm9pZCwgbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbmFtZS5zbGljZSgxKTtcbiAgfVxuXG4gIHByaXZhdGUgdG9BdE5hbWUodGhpczogdm9pZCwgbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYEAke25hbWV9YDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2FwdHVyZWROYW1lZEFyZ3VtZW50c0ltcGwgaW1wbGVtZW50cyBDYXB0dXJlZE5hbWVkQXJndW1lbnRzIHtcbiAgcHVibGljIGxlbmd0aDogbnVtYmVyO1xuICBwcml2YXRlIF9tYXA6IE9wdGlvbjxEaWN0PFZlcnNpb25lZFBhdGhSZWZlcmVuY2U8dW5rbm93bj4+PjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgdGFnOiBUYWcsXG4gICAgcHVibGljIG5hbWVzOiBzdHJpbmdbXSxcbiAgICBwdWJsaWMgcmVmZXJlbmNlczogVmVyc2lvbmVkUGF0aFJlZmVyZW5jZTx1bmtub3duPltdXG4gICkge1xuICAgIHRoaXMubGVuZ3RoID0gbmFtZXMubGVuZ3RoO1xuICAgIHRoaXMuX21hcCA9IG51bGw7XG4gIH1cblxuICBnZXQgbWFwKCkge1xuICAgIGxldCBtYXAgPSB0aGlzLl9tYXA7XG5cbiAgICBpZiAoIW1hcCkge1xuICAgICAgbGV0IHsgbmFtZXMsIHJlZmVyZW5jZXMgfSA9IHRoaXM7XG4gICAgICBtYXAgPSB0aGlzLl9tYXAgPSBkaWN0PFZlcnNpb25lZFBhdGhSZWZlcmVuY2U8dW5rbm93bj4+KCk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgbWFwIVtuYW1lXSA9IHJlZmVyZW5jZXNbaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hcDtcbiAgfVxuXG4gIGhhcyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lcy5pbmRleE9mKG5hbWUpICE9PSAtMTtcbiAgfVxuXG4gIGdldDxUIGV4dGVuZHMgVmVyc2lvbmVkUGF0aFJlZmVyZW5jZTx1bmtub3duPj4obmFtZTogc3RyaW5nKTogVCB7XG4gICAgbGV0IHsgbmFtZXMsIHJlZmVyZW5jZXMgfSA9IHRoaXM7XG4gICAgbGV0IGlkeCA9IG5hbWVzLmluZGV4T2YobmFtZSk7XG5cbiAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgcmV0dXJuIChVTkRFRklORURfUkVGRVJFTkNFIGFzIHVuc2FmZSkgYXMgVDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJlZmVyZW5jZXNbaWR4XSBhcyBUO1xuICAgIH1cbiAgfVxuXG4gIHZhbHVlKCk6IERpY3Q8dW5rbm93bj4ge1xuICAgIGxldCB7IG5hbWVzLCByZWZlcmVuY2VzIH0gPSB0aGlzO1xuICAgIGxldCBvdXQgPSBkaWN0PHVua25vd24+KCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgbmFtZSA9IG5hbWVzW2ldO1xuICAgICAgb3V0W25hbWVdID0gcmVmZXJlbmNlc1tpXS52YWx1ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEJsb2NrQXJndW1lbnRzSW1wbDxDIGV4dGVuZHMgSml0T3JBb3RCbG9jaz4gaW1wbGVtZW50cyBCbG9ja0FyZ3VtZW50czxDPiB7XG4gIHByaXZhdGUgc3RhY2shOiBFdmFsdWF0aW9uU3RhY2s7XG4gIHByaXZhdGUgaW50ZXJuYWxWYWx1ZXM6IE9wdGlvbjxudW1iZXJbXT4gPSBudWxsO1xuXG4gIHB1YmxpYyBpbnRlcm5hbFRhZzogT3B0aW9uPFRhZz4gPSBudWxsO1xuICBwdWJsaWMgbmFtZXM6IHN0cmluZ1tdID0gRU1QVFlfQVJSQVk7XG5cbiAgcHVibGljIGxlbmd0aCA9IDA7XG4gIHB1YmxpYyBiYXNlID0gMDtcblxuICBlbXB0eShzdGFjazogRXZhbHVhdGlvblN0YWNrLCBiYXNlOiBudW1iZXIpIHtcbiAgICB0aGlzLnN0YWNrID0gc3RhY2s7XG4gICAgdGhpcy5uYW1lcyA9IEVNUFRZX0FSUkFZO1xuICAgIHRoaXMuYmFzZSA9IGJhc2U7XG4gICAgdGhpcy5sZW5ndGggPSAwO1xuXG4gICAgdGhpcy5pbnRlcm5hbFRhZyA9IENPTlNUQU5UX1RBRztcbiAgICB0aGlzLmludGVybmFsVmFsdWVzID0gRU1QVFlfQVJSQVk7XG4gIH1cblxuICBzZXR1cChzdGFjazogRXZhbHVhdGlvblN0YWNrLCBiYXNlOiBudW1iZXIsIGxlbmd0aDogbnVtYmVyLCBuYW1lczogc3RyaW5nW10pIHtcbiAgICB0aGlzLnN0YWNrID0gc3RhY2s7XG4gICAgdGhpcy5uYW1lcyA9IG5hbWVzO1xuICAgIHRoaXMuYmFzZSA9IGJhc2U7XG4gICAgdGhpcy5sZW5ndGggPSBsZW5ndGg7XG5cbiAgICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmludGVybmFsVGFnID0gQ09OU1RBTlRfVEFHO1xuICAgICAgdGhpcy5pbnRlcm5hbFZhbHVlcyA9IEVNUFRZX0FSUkFZO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmludGVybmFsVGFnID0gbnVsbDtcbiAgICAgIHRoaXMuaW50ZXJuYWxWYWx1ZXMgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGdldCB2YWx1ZXMoKTogQmxvY2tWYWx1ZVtdIHtcbiAgICBsZXQgdmFsdWVzID0gdGhpcy5pbnRlcm5hbFZhbHVlcztcblxuICAgIGlmICghdmFsdWVzKSB7XG4gICAgICBsZXQgeyBiYXNlLCBsZW5ndGgsIHN0YWNrIH0gPSB0aGlzO1xuICAgICAgdmFsdWVzID0gdGhpcy5pbnRlcm5hbFZhbHVlcyA9IHN0YWNrLnNsaWNlQXJyYXk8bnVtYmVyPihiYXNlLCBiYXNlICsgbGVuZ3RoICogMyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfVxuXG4gIGhhcyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lcyEuaW5kZXhPZihuYW1lKSAhPT0gLTE7XG4gIH1cblxuICBnZXQobmFtZTogc3RyaW5nKTogT3B0aW9uPFNjb3BlQmxvY2s8Qz4+IHtcbiAgICBsZXQgeyBiYXNlLCBzdGFjaywgbmFtZXMgfSA9IHRoaXM7XG5cbiAgICBsZXQgaWR4ID0gbmFtZXMhLmluZGV4T2YobmFtZSk7XG5cbiAgICBpZiAobmFtZXMhLmluZGV4T2YobmFtZSkgPT09IC0xKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBsZXQgdGFibGUgPSBjaGVjayhzdGFjay5nZXQoaWR4ICogMywgYmFzZSksIENoZWNrT3B0aW9uKENoZWNrQmxvY2tTeW1ib2xUYWJsZSkpO1xuICAgIGxldCBzY29wZSA9IGNoZWNrKHN0YWNrLmdldChpZHggKiAzICsgMSwgYmFzZSksIENoZWNrT3B0aW9uKENoZWNrU2NvcGUpKTtcbiAgICBsZXQgaGFuZGxlID0gY2hlY2soXG4gICAgICBzdGFjay5nZXQoaWR4ICogMyArIDIsIGJhc2UpLFxuICAgICAgQ2hlY2tPcHRpb24oQ2hlY2tPcihDaGVja0hhbmRsZSwgQ2hlY2tDb21waWxhYmxlQmxvY2spKVxuICAgICk7XG5cbiAgICByZXR1cm4gaGFuZGxlID09PSBudWxsID8gbnVsbCA6IChbaGFuZGxlLCBzY29wZSEsIHRhYmxlIV0gYXMgU2NvcGVCbG9jazxDPik7XG4gIH1cblxuICBjYXB0dXJlKCk6IENhcHR1cmVkQmxvY2tBcmd1bWVudHMge1xuICAgIHJldHVybiBuZXcgQ2FwdHVyZWRCbG9ja0FyZ3VtZW50c0ltcGwodGhpcy5uYW1lcywgdGhpcy52YWx1ZXMpO1xuICB9XG59XG5cbmNsYXNzIENhcHR1cmVkQmxvY2tBcmd1bWVudHNJbXBsIGltcGxlbWVudHMgQ2FwdHVyZWRCbG9ja0FyZ3VtZW50cyB7XG4gIHB1YmxpYyBsZW5ndGg6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZXM6IHN0cmluZ1tdLCBwdWJsaWMgdmFsdWVzOiBCbG9ja1ZhbHVlW10pIHtcbiAgICB0aGlzLmxlbmd0aCA9IG5hbWVzLmxlbmd0aDtcbiAgfVxuXG4gIGhhcyhuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lcy5pbmRleE9mKG5hbWUpICE9PSAtMTtcbiAgfVxuXG4gIGdldChuYW1lOiBzdHJpbmcpOiBPcHRpb248U2NvcGVCbG9jaz4ge1xuICAgIGxldCBpZHggPSB0aGlzLm5hbWVzLmluZGV4T2YobmFtZSk7XG5cbiAgICBpZiAoaWR4ID09PSAtMSkgcmV0dXJuIG51bGw7XG5cbiAgICByZXR1cm4gW1xuICAgICAgdGhpcy52YWx1ZXNbaWR4ICogMyArIDJdIGFzIG51bWJlcixcbiAgICAgIHRoaXMudmFsdWVzW2lkeCAqIDMgKyAxXSBhcyBTY29wZTxKaXRPckFvdEJsb2NrPixcbiAgICAgIHRoaXMudmFsdWVzW2lkeCAqIDNdIGFzIEJsb2NrU3ltYm9sVGFibGUsXG4gICAgXTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2FwdHVyZWRBcmd1bWVudHNJbXBsIGltcGxlbWVudHMgQ2FwdHVyZWRBcmd1bWVudHMge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgdGFnOiBUYWcsXG4gICAgcHVibGljIHBvc2l0aW9uYWw6IENhcHR1cmVkUG9zaXRpb25hbEFyZ3VtZW50cyxcbiAgICBwdWJsaWMgbmFtZWQ6IENhcHR1cmVkTmFtZWRBcmd1bWVudHMsXG4gICAgcHVibGljIGxlbmd0aDogbnVtYmVyXG4gICkge31cblxuICB2YWx1ZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZWQ6IHRoaXMubmFtZWQudmFsdWUoKSxcbiAgICAgIHBvc2l0aW9uYWw6IHRoaXMucG9zaXRpb25hbC52YWx1ZSgpLFxuICAgIH07XG4gIH1cbn1cblxuY29uc3QgRU1QVFlfTkFNRUQgPSBuZXcgQ2FwdHVyZWROYW1lZEFyZ3VtZW50c0ltcGwoQ09OU1RBTlRfVEFHLCBFTVBUWV9BUlJBWSwgRU1QVFlfQVJSQVkpO1xuY29uc3QgRU1QVFlfUE9TSVRJT05BTCA9IG5ldyBDYXB0dXJlZFBvc2l0aW9uYWxBcmd1bWVudHNJbXBsKENPTlNUQU5UX1RBRywgRU1QVFlfQVJSQVkpO1xuZXhwb3J0IGNvbnN0IEVNUFRZX0FSR1MgPSBuZXcgQ2FwdHVyZWRBcmd1bWVudHNJbXBsKENPTlNUQU5UX1RBRywgRU1QVFlfUE9TSVRJT05BTCwgRU1QVFlfTkFNRUQsIDApO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==
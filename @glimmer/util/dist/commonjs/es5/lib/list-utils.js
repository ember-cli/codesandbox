"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EMPTY_SLICE = exports.ListSlice = exports.LinkedList = exports.ListNode = undefined;

var _lifetimes = require("./lifetimes");

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var ListNode = exports.ListNode = function ListNode(value) {
    _classCallCheck(this, ListNode);

    this.next = null;
    this.prev = null;
    this.value = value;
};
var LinkedList = exports.LinkedList = function () {
    function LinkedList() {
        _classCallCheck(this, LinkedList);

        this.clear();
    }

    LinkedList.prototype.head = function head() {
        return this._head;
    };

    LinkedList.prototype.tail = function tail() {
        return this._tail;
    };

    LinkedList.prototype.clear = function clear() {
        this._head = this._tail = null;
    };

    LinkedList.prototype.toArray = function toArray() {
        var out = [];
        this.forEachNode(function (n) {
            return out.push(n);
        });
        return out;
    };

    LinkedList.prototype.nextNode = function nextNode(node) {
        return node.next;
    };

    LinkedList.prototype.forEachNode = function forEachNode(callback) {
        var node = this._head;
        while (node !== null) {
            callback(node);
            node = node.next;
        }
    };

    LinkedList.prototype.insertBefore = function insertBefore(node) {
        var reference = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        if (reference === null) return this.append(node);
        if (reference.prev) reference.prev.next = node;else this._head = node;
        node.prev = reference.prev;
        node.next = reference;
        reference.prev = node;
        return node;
    };

    LinkedList.prototype.append = function append(node) {
        var tail = this._tail;
        if (tail) {
            tail.next = node;
            node.prev = tail;
            node.next = null;
        } else {
            this._head = node;
        }
        return this._tail = node;
    };

    LinkedList.prototype.remove = function remove(node) {
        if (node.prev) node.prev.next = node.next;else this._head = node.next;
        if (node.next) node.next.prev = node.prev;else this._tail = node.prev;
        return node;
    };

    LinkedList.prototype[_lifetimes.DROP] = function () {
        this.forEachNode(function (d) {
            return (0, _lifetimes.destructor)(d)[_lifetimes.DROP]();
        });
    };

    _createClass(LinkedList, [{
        key: _lifetimes.CHILDREN,
        get: function get() {
            var out = [];
            this.forEachNode(function (d) {
                return out.push.apply(out, (0, _lifetimes.destructor)(d)[_lifetimes.CHILDREN]);
            });
            return out;
        }
    }]);

    return LinkedList;
}();
var ListSlice = exports.ListSlice = function () {
    function ListSlice(head, tail) {
        _classCallCheck(this, ListSlice);

        this._head = head;
        this._tail = tail;
    }

    ListSlice.prototype.forEachNode = function forEachNode(callback) {
        var node = this._head;
        while (node !== null) {
            callback(node);
            node = this.nextNode(node);
        }
    };

    ListSlice.prototype.head = function head() {
        return this._head;
    };

    ListSlice.prototype.tail = function tail() {
        return this._tail;
    };

    ListSlice.prototype.toArray = function toArray() {
        var out = [];
        this.forEachNode(function (n) {
            return out.push(n);
        });
        return out;
    };

    ListSlice.prototype.nextNode = function nextNode(node) {
        if (node === this._tail) return null;
        return node.next;
    };

    return ListSlice;
}();
var EMPTY_SLICE = exports.EMPTY_SLICE = new ListSlice(null, null);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL3V0aWwvbGliL2xpc3QtdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFRQSxJQUFBLDhCQUtFLFNBQUEsUUFBQSxDQUFBLEtBQUEsRUFBb0I7QUFBQSxvQkFBQSxJQUFBLEVBQUEsUUFBQTs7QUFKYixTQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsU0FBQSxJQUFBLEdBQUEsSUFBQTtBQUlMLFNBQUEsS0FBQSxHQUFBLEtBQUE7QUFOSixDQUFBO0FBY0EsSUFBQSxrQ0FBQSxZQUFBO0FBSUUsYUFBQSxVQUFBLEdBQUE7QUFBQSx3QkFBQSxJQUFBLEVBQUEsVUFBQTs7QUFDRSxhQUFBLEtBQUE7QUFDRDs7QUFOSCxlQUFBLFNBQUEsQ0FBQSxJQUFBLEdBQUEsU0FBQSxJQUFBLEdBUU07QUFDRixlQUFPLEtBQVAsS0FBQTtBQVRKLEtBQUE7O0FBQUEsZUFBQSxTQUFBLENBQUEsSUFBQSxHQUFBLFNBQUEsSUFBQSxHQVlNO0FBQ0YsZUFBTyxLQUFQLEtBQUE7QUFiSixLQUFBOztBQUFBLGVBQUEsU0FBQSxDQUFBLEtBQUEsR0FBQSxTQUFBLEtBQUEsR0FnQk87QUFDSCxhQUFBLEtBQUEsR0FBYSxLQUFBLEtBQUEsR0FBYixJQUFBO0FBakJKLEtBQUE7O0FBQUEsZUFBQSxTQUFBLENBQUEsT0FBQSxHQUFBLFNBQUEsT0FBQSxHQW9CUztBQUNMLFlBQUksTUFBSixFQUFBO0FBQ0EsYUFBQSxXQUFBLENBQWlCLFVBQUEsQ0FBQSxFQUFBO0FBQUEsbUJBQUssSUFBQSxJQUFBLENBQXRCLENBQXNCLENBQUw7QUFBakIsU0FBQTtBQUNBLGVBQUEsR0FBQTtBQXZCSixLQUFBOztBQUFBLGVBQUEsU0FBQSxDQUFBLFFBQUEsR0FBQSxTQUFBLFFBQUEsQ0FBQSxJQUFBLEVBMEJrQjtBQUNkLGVBQU8sS0FBUCxJQUFBO0FBM0JKLEtBQUE7O0FBQUEsZUFB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O0FBQ0EsbUJBQU8sS0FBQSxRQUFBLENBQVAsSUFBTyxDQUFQO0FBQ0Q7QUFmTCxLQUFBOztBQUFBLGNBQUEsU0FBQSxDQUFBLElBQUEsR0FBQSxTQUFBLElBQUEsR0FrQk07QUFDRixlQUFPLEtBQVAsS0FBQTtBQW5CSixLQUFBOztBQUFBLGNBQUEsU0FBQSxDQUFBLElBQUEsR0FBQSxTQUFBLElBQUEsR0FzQk07QUFDRixlQUFPLEtBQVAsS0FBQTtBQXZCSixLQUFBOztBQUFBLGNBQUEsU0FBQSxDQUFBLE9BQUEsR0FBQSxTQUFBLE9BQUEsR0EwQlM7QUFDTCxZQUFJLE1BQUosRUFBQTtBQUNBLGFBQUEsV0FBQSxDQUFpQixVQUFBLENBQUEsRUFBQTtBQUFBLG1CQUFLLElBQUEsSUFBQSxDQUF0QixDQUFzQixDQUFMO0FBQWpCLFNBQUE7QUFDQSxlQUFBLEdBQUE7QUE3QkosS0FBQTs7QUFBQSxjQUFBLFNBQUEsQ0FBQSxRQUFBLEdBQUEsU0FBQSxRQUFBLENBQUEsSUFBQSxFQWdDa0I7QUFDZCxZQUFJLFNBQVMsS0FBYixLQUFBLEVBQXlCLE9BQUEsSUFBQTtBQUN6QixlQUFPLEtBQVAsSUFBQTtBQWxDSixLQUFBOztBQUFBLFdBQUEsU0FBQTtBQUFBLENBQUEsRUFBQTtBQXNDTyxJQUFNLG9DQUFjLElBQUEsU0FBQSxDQUFBLElBQUEsRUFBcEIsSUFBb0IsQ0FBcEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPcHRpb24gfSBmcm9tICcuL3BsYXRmb3JtLXV0aWxzJztcbmltcG9ydCB7IERST1AsIGRlc3RydWN0b3IsIENISUxEUkVOIH0gZnJvbSAnLi9saWZldGltZXMnO1xuaW1wb3J0IHsgRHJvcCB9IGZyb20gJ0BnbGltbWVyL2ludGVyZmFjZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIExpbmtlZExpc3ROb2RlIHtcbiAgbmV4dDogT3B0aW9uPExpbmtlZExpc3ROb2RlPjtcbiAgcHJldjogT3B0aW9uPExpbmtlZExpc3ROb2RlPjtcbn1cblxuZXhwb3J0IGNsYXNzIExpc3ROb2RlPFQ+IGltcGxlbWVudHMgTGlua2VkTGlzdE5vZGUge1xuICBwdWJsaWMgbmV4dDogT3B0aW9uPExpc3ROb2RlPFQ+PiA9IG51bGw7XG4gIHB1YmxpYyBwcmV2OiBPcHRpb248TGlzdE5vZGU8VD4+ID0gbnVsbDtcbiAgcHVibGljIHZhbHVlOiBUO1xuXG4gIGNvbnN0cnVjdG9yKHZhbHVlOiBUKSB7XG4gICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB9XG59XG5cbi8vIHdlIGFyZSB1bmFibGUgdG8gZXhwcmVzcyB0aGUgY29uc3RyYWludCB0aGF0IFQncyAucHJldiBhbmQgLm5leHQgYXJlXG4vLyB0aGVtc2VsdmVzIFQuIEhvd2V2ZXIsIGl0IHdpbGwgYWx3YXlzIGJlIHRydWUsIHNvIHRydXN0IHVzLlxudHlwZSB0cnVzdCA9IGFueTtcblxuZXhwb3J0IGNsYXNzIExpbmtlZExpc3Q8VCBleHRlbmRzIExpbmtlZExpc3ROb2RlPiBpbXBsZW1lbnRzIFNsaWNlPFQ+LCBEcm9wIHtcbiAgcHJpdmF0ZSBfaGVhZCE6IE9wdGlvbjxUPjtcbiAgcHJpdmF0ZSBfdGFpbCE6IE9wdGlvbjxUPjtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmNsZWFyKCk7XG4gIH1cblxuICBoZWFkKCk6IE9wdGlvbjxUPiB7XG4gICAgcmV0dXJuIHRoaXMuX2hlYWQ7XG4gIH1cblxuICB0YWlsKCk6IE9wdGlvbjxUPiB7XG4gICAgcmV0dXJuIHRoaXMuX3RhaWw7XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICB0aGlzLl9oZWFkID0gdGhpcy5fdGFpbCA9IG51bGw7XG4gIH1cblxuICB0b0FycmF5KCk6IFRbXSB7XG4gICAgbGV0IG91dDogVFtdID0gW107XG4gICAgdGhpcy5mb3JFYWNoTm9kZShuID0+IG91dC5wdXNoKG4pKTtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgbmV4dE5vZGUobm9kZTogVCk6IFQge1xuICAgIHJldHVybiBub2RlLm5leHQgYXMgdHJ1c3Q7XG4gIH1cblxuICBmb3JFYWNoTm9kZShjYWxsYmFjazogKG5vZGU6IFQpID0+IHZvaWQpIHtcbiAgICBsZXQgbm9kZSA9IHRoaXMuX2hlYWQ7XG5cbiAgICB3aGlsZSAobm9kZSAhPT0gbnVsbCkge1xuICAgICAgY2FsbGJhY2sobm9kZSBhcyB0cnVzdCk7XG4gICAgICBub2RlID0gbm9kZS5uZXh0IGFzIHRydXN0O1xuICAgIH1cbiAgfVxuXG4gIGluc2VydEJlZm9yZShub2RlOiBULCByZWZlcmVuY2U6IE9wdGlvbjxUPiA9IG51bGwpOiBUIHtcbiAgICBpZiAocmVmZXJlbmNlID09PSBudWxsKSByZXR1cm4gdGhpcy5hcHBlbmQobm9kZSk7XG5cbiAgICBpZiAocmVmZXJlbmNlLnByZXYpIHJlZmVyZW5jZS5wcmV2Lm5leHQgPSBub2RlO1xuICAgIGVsc2UgdGhpcy5faGVhZCA9IG5vZGU7XG5cbiAgICBub2RlLnByZXYgPSByZWZlcmVuY2UucHJldjtcbiAgICBub2RlLm5leHQgPSByZWZlcmVuY2U7XG4gICAgcmVmZXJlbmNlLnByZXYgPSBub2RlO1xuXG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBhcHBlbmQobm9kZTogVCk6IFQge1xuICAgIGxldCB0YWlsID0gdGhpcy5fdGFpbDtcblxuICAgIGlmICh0YWlsKSB7XG4gICAgICB0YWlsLm5leHQgPSBub2RlO1xuICAgICAgbm9kZS5wcmV2ID0gdGFpbDtcbiAgICAgIG5vZGUubmV4dCA9IG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2hlYWQgPSBub2RlO1xuICAgIH1cblxuICAgIHJldHVybiAodGhpcy5fdGFpbCA9IG5vZGUpO1xuICB9XG5cbiAgcmVtb3ZlKG5vZGU6IFQpOiBUIHtcbiAgICBpZiAobm9kZS5wcmV2KSBub2RlLnByZXYubmV4dCA9IG5vZGUubmV4dDtcbiAgICBlbHNlIHRoaXMuX2hlYWQgPSBub2RlLm5leHQgYXMgdHJ1c3Q7XG5cbiAgICBpZiAobm9kZS5uZXh0KSBub2RlLm5leHQucHJldiA9IG5vZGUucHJldjtcbiAgICBlbHNlIHRoaXMuX3RhaWwgPSBub2RlLnByZXYgYXMgdHJ1c3Q7XG5cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIFtEUk9QXSgpIHtcbiAgICB0aGlzLmZvckVhY2hOb2RlKGQgPT4gZGVzdHJ1Y3RvcihkKVtEUk9QXSgpKTtcbiAgfVxuXG4gIGdldCBbQ0hJTERSRU5dKCk6IEl0ZXJhYmxlPERyb3A+IHtcbiAgICBsZXQgb3V0OiBEcm9wW10gPSBbXTtcbiAgICB0aGlzLmZvckVhY2hOb2RlKGQgPT4gb3V0LnB1c2goLi4uZGVzdHJ1Y3RvcihkKVtDSElMRFJFTl0pKTtcbiAgICByZXR1cm4gb3V0O1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2xpY2U8VCBleHRlbmRzIExpbmtlZExpc3ROb2RlPiB7XG4gIGhlYWQoKTogT3B0aW9uPFQ+O1xuICB0YWlsKCk6IE9wdGlvbjxUPjtcbiAgbmV4dE5vZGUobm9kZTogVCk6IE9wdGlvbjxUPjtcbiAgZm9yRWFjaE5vZGUoY2FsbGJhY2s6IChub2RlOiBUKSA9PiB2b2lkKTogdm9pZDtcbiAgdG9BcnJheSgpOiBUW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2xvbmVhYmxlTGlzdE5vZGUgZXh0ZW5kcyBMaW5rZWRMaXN0Tm9kZSB7XG4gIGNsb25lKCk6IHRoaXM7XG59XG5cbmV4cG9ydCBjbGFzcyBMaXN0U2xpY2U8VCBleHRlbmRzIExpbmtlZExpc3ROb2RlPiBpbXBsZW1lbnRzIFNsaWNlPFQ+IHtcbiAgcHJpdmF0ZSBfaGVhZDogT3B0aW9uPFQ+O1xuICBwcml2YXRlIF90YWlsOiBPcHRpb248VD47XG5cbiAgY29uc3RydWN0b3IoaGVhZDogT3B0aW9uPFQ+LCB0YWlsOiBPcHRpb248VD4pIHtcbiAgICB0aGlzLl9oZWFkID0gaGVhZDtcbiAgICB0aGlzLl90YWlsID0gdGFpbDtcbiAgfVxuXG4gIGZvckVhY2hOb2RlKGNhbGxiYWNrOiAobm9kZTogVCkgPT4gdm9pZCkge1xuICAgIGxldCBub2RlID0gdGhpcy5faGVhZDtcblxuICAgIHdoaWxlIChub2RlICE9PSBudWxsKSB7XG4gICAgICBjYWxsYmFjayhub2RlKTtcbiAgICAgIG5vZGUgPSB0aGlzLm5leHROb2RlKG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGhlYWQoKTogT3B0aW9uPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5faGVhZDtcbiAgfVxuXG4gIHRhaWwoKTogT3B0aW9uPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5fdGFpbDtcbiAgfVxuXG4gIHRvQXJyYXkoKTogVFtdIHtcbiAgICBsZXQgb3V0OiBUW10gPSBbXTtcbiAgICB0aGlzLmZvckVhY2hOb2RlKG4gPT4gb3V0LnB1c2gobikpO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBuZXh0Tm9kZShub2RlOiBUKTogT3B0aW9uPFQ+IHtcbiAgICBpZiAobm9kZSA9PT0gdGhpcy5fdGFpbCkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIG5vZGUubmV4dCBhcyBUO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBFTVBUWV9TTElDRSA9IG5ldyBMaXN0U2xpY2UobnVsbCwgbnVsbCk7XG4iXSwic291cmNlUm9vdCI6IiJ9
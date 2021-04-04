"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = BaseComponentManager;

var _env = require("@glimmer/env");

var _component = require("./component");

/**
 * This factory function returns a component manager class with common behavior
 * that can be extend to add Glimmer.js- or Ember.js-specific functionality. As
 * these environments converge, the need for two component manager
 * implementations (and thus this factory) should go away.
 */
function BaseComponentManager(setOwner, getOwner, capabilities) {
  return class {
    constructor(owner) {
      this.capabilities = capabilities;
      setOwner(this, owner);
    }

    static create(attrs) {
      let owner = getOwner(attrs);
      return new this(owner);
    }

    createComponent(ComponentClass, args) {
      if (_env.DEBUG) {
        _component.ARGS_SET.set(args.named, true);
      }

      return new ComponentClass(getOwner(this), args.named);
    }

    getContext(component) {
      return component;
    }

  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL2NvbXBvbmVudC9hZGRvbi8tcHJpdmF0ZS9iYXNlLWNvbXBvbmVudC1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O2tCQTJCd0Isb0I7O0FBM0J4Qjs7QUFDQTs7QUFvQkE7Ozs7OztBQU1jLFNBQVUsb0JBQVYsQ0FDWixRQURZLEVBRVosUUFGWSxFQUdaLFlBSFksRUFHNkI7QUFFekMsU0FBTyxNQUFBO0FBUUwsSUFBQSxXQUFBLENBQVksS0FBWixFQUEwQjtBQUYxQixXQUFBLFlBQUEsR0FBZSxZQUFmO0FBR0UsTUFBQSxRQUFRLENBQUMsSUFBRCxFQUFPLEtBQVAsQ0FBUjtBQUNEOztBQVRELFdBQU8sTUFBUCxDQUFjLEtBQWQsRUFBdUI7QUFDckIsVUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUQsQ0FBcEI7QUFDQSxhQUFPLElBQUksSUFBSixDQUFTLEtBQVQsQ0FBUDtBQUNEOztBQVFELElBQUEsZUFBZSxDQUNiLGNBRGEsRUFFYixJQUZhLEVBRWE7QUFFMUIsVUFBSSxVQUFKLEVBQVc7QUFDVCw0QkFBUyxHQUFULENBQWEsSUFBSSxDQUFDLEtBQWxCLEVBQXlCLElBQXpCO0FBQ0Q7O0FBRUQsYUFBTyxJQUFJLGNBQUosQ0FBbUIsUUFBUSxDQUFDLElBQUQsQ0FBM0IsRUFBbUMsSUFBSSxDQUFDLEtBQXhDLENBQVA7QUFDRDs7QUFFRCxJQUFBLFVBQVUsQ0FBQyxTQUFELEVBQTRCO0FBQ3BDLGFBQU8sU0FBUDtBQUNEOztBQXpCSSxHQUFQO0FBMkJEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgREVCVUcgfSBmcm9tICdAZ2xpbW1lci9lbnYnO1xuaW1wb3J0IEJhc2VDb21wb25lbnQsIHsgQVJHU19TRVQgfSBmcm9tICcuL2NvbXBvbmVudCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9uZW50TWFuYWdlckFyZ3Mge1xuICBuYW1lZDogb2JqZWN0O1xuICBwb3NpdGlvbmFsOiBhbnlbXTtcbn1cblxuZXhwb3J0IHR5cGUgU2V0T3duZXIgPSAob2JqOiB7fSwgb3duZXI6IHVua25vd24pID0+IHZvaWQ7XG5leHBvcnQgdHlwZSBHZXRPd25lciA9IChvYmo6IHt9KSA9PiB1bmtub3duO1xuXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUNvbXBvbmVudENhcGFiaWxpdGllcyB7XG4gIGFzeW5jTGlmZWN5Y2xlQ2FsbGJhY2tzOiBib29sZWFuO1xuICBkZXN0cnVjdG9yOiBib29sZWFuO1xuICB1cGRhdGVIb29rOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbnN0cnVjdG9yPFQ+IHtcbiAgbmV3IChvd25lcjogdW5rbm93biwgYXJnczoge30pOiBUO1xufVxuXG4vKipcbiAqIFRoaXMgZmFjdG9yeSBmdW5jdGlvbiByZXR1cm5zIGEgY29tcG9uZW50IG1hbmFnZXIgY2xhc3Mgd2l0aCBjb21tb24gYmVoYXZpb3JcbiAqIHRoYXQgY2FuIGJlIGV4dGVuZCB0byBhZGQgR2xpbW1lci5qcy0gb3IgRW1iZXIuanMtc3BlY2lmaWMgZnVuY3Rpb25hbGl0eS4gQXNcbiAqIHRoZXNlIGVudmlyb25tZW50cyBjb252ZXJnZSwgdGhlIG5lZWQgZm9yIHR3byBjb21wb25lbnQgbWFuYWdlclxuICogaW1wbGVtZW50YXRpb25zIChhbmQgdGh1cyB0aGlzIGZhY3RvcnkpIHNob3VsZCBnbyBhd2F5LlxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBCYXNlQ29tcG9uZW50TWFuYWdlcjxHbGltbWVyQ29tcG9uZW50IGV4dGVuZHMgQmFzZUNvbXBvbmVudD4oXG4gIHNldE93bmVyOiBTZXRPd25lcixcbiAgZ2V0T3duZXI6IEdldE93bmVyLFxuICBjYXBhYmlsaXRpZXM6IEN1c3RvbUNvbXBvbmVudENhcGFiaWxpdGllc1xuKSB7XG4gIHJldHVybiBjbGFzcyB7XG4gICAgc3RhdGljIGNyZWF0ZShhdHRyczoge30pIHtcbiAgICAgIGxldCBvd25lciA9IGdldE93bmVyKGF0dHJzKTtcbiAgICAgIHJldHVybiBuZXcgdGhpcyhvd25lcik7XG4gICAgfVxuXG4gICAgY2FwYWJpbGl0aWVzID0gY2FwYWJpbGl0aWVzO1xuXG4gICAgY29uc3RydWN0b3Iob3duZXI6IHVua25vd24pIHtcbiAgICAgIHNldE93bmVyKHRoaXMsIG93bmVyKTtcbiAgICB9XG5cbiAgICBjcmVhdGVDb21wb25lbnQoXG4gICAgICBDb21wb25lbnRDbGFzczogQ29uc3RydWN0b3I8R2xpbW1lckNvbXBvbmVudD4sXG4gICAgICBhcmdzOiBDb21wb25lbnRNYW5hZ2VyQXJnc1xuICAgICk6IEdsaW1tZXJDb21wb25lbnQge1xuICAgICAgaWYgKERFQlVHKSB7XG4gICAgICAgIEFSR1NfU0VULnNldChhcmdzLm5hbWVkLCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRDbGFzcyhnZXRPd25lcih0aGlzKSwgYXJncy5uYW1lZCk7XG4gICAgfVxuXG4gICAgZ2V0Q29udGV4dChjb21wb25lbnQ6IEdsaW1tZXJDb21wb25lbnQpIHtcbiAgICAgIHJldHVybiBjb21wb25lbnQ7XG4gICAgfVxuICB9O1xufVxuIl0sInNvdXJjZVJvb3QiOiIifQ==
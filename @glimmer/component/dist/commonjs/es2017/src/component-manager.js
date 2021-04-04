"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _application = require("@glimmer/application");

var _di = require("@glimmer/di");

var _baseComponentManager = require("../addon/-private/base-component-manager");

var _baseComponentManager2 = _interopRequireDefault(_baseComponentManager);

var _destroyables = require("../addon/-private/destroyables");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CAPABILITIES = (0, _application.capabilities)('3.13', {
  asyncLifecycleCallbacks: true,
  updateHook: true,
  destructor: true
});
/**
 * This component manager runs in Glimmer.js environments and extends the base component manager to:
 *
 * 1. Implement a lightweight destruction protocol (currently not deferred, like in Ember)
 * 2. Invoke legacy component lifecycle hooks (didInsertElement and didUpdate)
 */

class GlimmerComponentManager extends (0, _baseComponentManager2.default)(_di.setOwner, _di.getOwner, CAPABILITIES) {
  destroyComponent(component) {
    (0, _destroyables.setDestroying)(component);
    component.willDestroy();
    (0, _destroyables.setDestroyed)(component);
  }

  didCreateComponent(component) {
    component.didInsertElement();
  }

  updateComponent() {}

  didUpdateComponent(component) {
    component.didUpdate();
  }

  __glimmer__didRenderLayout(component, bounds) {
    component.bounds = bounds;
  }

}

exports.default = GlimmerComponentManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BhY2thZ2VzL0BnbGltbWVyL2NvbXBvbmVudC9zcmMvY29tcG9uZW50LW1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBQ0E7O0FBRUE7Ozs7QUFDQTs7OztBQUdBLE1BQU0sWUFBWSxHQUFHLCtCQUFhLE1BQWIsRUFBcUI7QUFDeEMsRUFBQSx1QkFBdUIsRUFBRSxJQURlO0FBRXhDLEVBQUEsVUFBVSxFQUFFLElBRjRCO0FBR3hDLEVBQUEsVUFBVSxFQUFFO0FBSDRCLENBQXJCLENBQXJCO0FBTUE7Ozs7Ozs7QUFNYyxNQUFPLHVCQUFQLFNBQXVDLG9DQUNuRCxZQURtRCxFQUVuRCxZQUZtRCxFQUduRCxZQUhtRCxDQUF2QyxDQUliO0FBQ0MsRUFBQSxnQkFBZ0IsQ0FBQyxTQUFELEVBQTRCO0FBQzFDLHFDQUFjLFNBQWQ7QUFDQSxJQUFBLFNBQVMsQ0FBQyxXQUFWO0FBQ0Esb0NBQWEsU0FBYjtBQUNEOztBQUVELEVBQUEsa0JBQWtCLENBQUMsU0FBRCxFQUE0QjtBQUM1QyxJQUFBLFNBQVMsQ0FBQyxnQkFBVjtBQUNEOztBQUVELEVBQUEsZUFBZSxHQUFBLENBQU07O0FBRXJCLEVBQUEsa0JBQWtCLENBQUMsU0FBRCxFQUE0QjtBQUM1QyxJQUFBLFNBQVMsQ0FBQyxTQUFWO0FBQ0Q7O0FBRUQsRUFBQSwwQkFBMEIsQ0FBQyxTQUFELEVBQThCLE1BQTlCLEVBQTRDO0FBQ3BFLElBQUEsU0FBUyxDQUFDLE1BQVYsR0FBbUIsTUFBbkI7QUFDRDs7QUFuQkY7O2tCQUpvQix1QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNhcGFiaWxpdGllcywgQm91bmRzIH0gZnJvbSAnQGdsaW1tZXIvYXBwbGljYXRpb24nO1xuaW1wb3J0IHsgc2V0T3duZXIsIGdldE93bmVyIH0gZnJvbSAnQGdsaW1tZXIvZGknO1xuXG5pbXBvcnQgQmFzZUNvbXBvbmVudE1hbmFnZXIgZnJvbSAnLi4vYWRkb24vLXByaXZhdGUvYmFzZS1jb21wb25lbnQtbWFuYWdlcic7XG5pbXBvcnQgeyBzZXREZXN0cm95aW5nLCBzZXREZXN0cm95ZWQgfSBmcm9tICcuLi9hZGRvbi8tcHJpdmF0ZS9kZXN0cm95YWJsZXMnO1xuaW1wb3J0IEdsaW1tZXJDb21wb25lbnQgZnJvbSAnLi9jb21wb25lbnQnO1xuXG5jb25zdCBDQVBBQklMSVRJRVMgPSBjYXBhYmlsaXRpZXMoJzMuMTMnLCB7XG4gIGFzeW5jTGlmZWN5Y2xlQ2FsbGJhY2tzOiB0cnVlLFxuICB1cGRhdGVIb29rOiB0cnVlLFxuICBkZXN0cnVjdG9yOiB0cnVlLFxufSk7XG5cbi8qKlxuICogVGhpcyBjb21wb25lbnQgbWFuYWdlciBydW5zIGluIEdsaW1tZXIuanMgZW52aXJvbm1lbnRzIGFuZCBleHRlbmRzIHRoZSBiYXNlIGNvbXBvbmVudCBtYW5hZ2VyIHRvOlxuICpcbiAqIDEuIEltcGxlbWVudCBhIGxpZ2h0d2VpZ2h0IGRlc3RydWN0aW9uIHByb3RvY29sIChjdXJyZW50bHkgbm90IGRlZmVycmVkLCBsaWtlIGluIEVtYmVyKVxuICogMi4gSW52b2tlIGxlZ2FjeSBjb21wb25lbnQgbGlmZWN5Y2xlIGhvb2tzIChkaWRJbnNlcnRFbGVtZW50IGFuZCBkaWRVcGRhdGUpXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdsaW1tZXJDb21wb25lbnRNYW5hZ2VyIGV4dGVuZHMgQmFzZUNvbXBvbmVudE1hbmFnZXIoXG4gIHNldE93bmVyLFxuICBnZXRPd25lcixcbiAgQ0FQQUJJTElUSUVTXG4pIHtcbiAgZGVzdHJveUNvbXBvbmVudChjb21wb25lbnQ6IEdsaW1tZXJDb21wb25lbnQpIHtcbiAgICBzZXREZXN0cm95aW5nKGNvbXBvbmVudCk7XG4gICAgY29tcG9uZW50LndpbGxEZXN0cm95KCk7XG4gICAgc2V0RGVzdHJveWVkKGNvbXBvbmVudCk7XG4gIH1cblxuICBkaWRDcmVhdGVDb21wb25lbnQoY29tcG9uZW50OiBHbGltbWVyQ29tcG9uZW50KSB7XG4gICAgY29tcG9uZW50LmRpZEluc2VydEVsZW1lbnQoKTtcbiAgfVxuXG4gIHVwZGF0ZUNvbXBvbmVudCgpIHsgfVxuXG4gIGRpZFVwZGF0ZUNvbXBvbmVudChjb21wb25lbnQ6IEdsaW1tZXJDb21wb25lbnQpIHtcbiAgICBjb21wb25lbnQuZGlkVXBkYXRlKCk7XG4gIH1cblxuICBfX2dsaW1tZXJfX2RpZFJlbmRlckxheW91dChjb21wb25lbnQ6IEdsaW1tZXJDb21wb25lbnQsIGJvdW5kczogQm91bmRzKSB7XG4gICAgY29tcG9uZW50LmJvdW5kcyA9IGJvdW5kcztcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIifQ==
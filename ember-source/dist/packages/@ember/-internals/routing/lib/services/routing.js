/**
@module ember
*/
import { getOwner } from '@ember/-internals/owner';
import { symbol } from '@ember/-internals/utils';
import { readOnly } from '@ember/object/computed';
import { assign } from '@ember/polyfills';
import Service from '@ember/service';
const ROUTER = symbol('ROUTER');
/**
  The Routing service is used by LinkComponent, and provides facilities for
  the component/view layer to interact with the router.

  This is a private service for internal usage only. For public usage,
  refer to the `Router` service.

  @private
  @class RoutingService
*/

export default class RoutingService extends Service {
  get router() {
    let router = this[ROUTER];

    if (router !== undefined) {
      return router;
    }

    const owner = getOwner(this);
    router = owner.lookup('router:main');
    router.setupRouter();
    return this[ROUTER] = router;
  }

  hasRoute(routeName) {
    return this.router.hasRoute(routeName);
  }

  transitionTo(routeName, models, queryParams, shouldReplace) {
    let transition = this.router._doTransition(routeName, models, queryParams);

    if (shouldReplace) {
      transition.method('replace');
    }

    return transition;
  }

  normalizeQueryParams(routeName, models, queryParams) {
    this.router._prepareQueryParams(routeName, models, queryParams);
  }

  _generateURL(routeName, models, queryParams) {
    let visibleQueryParams = {};

    if (queryParams) {
      assign(visibleQueryParams, queryParams);
      this.normalizeQueryParams(routeName, models, visibleQueryParams);
    }

    return this.router.generate(routeName, ...models, {
      queryParams: visibleQueryParams
    });
  }

  generateURL(routeName, models, queryParams) {
    if (this.router._initialTransitionStarted) {
      return this._generateURL(routeName, models, queryParams);
    } else {
      // Swallow error when transition has not started.
      // When rendering in tests without visit(), we cannot infer the route context which <LinkTo/> needs be aware of
      try {
        return this._generateURL(routeName, models, queryParams);
      } catch (_e) {
        return;
      }
    }
  }

  isActiveForRoute(contexts, queryParams, routeName, routerState) {
    let handlers = this.router._routerMicrolib.recognizer.handlersFor(routeName);

    let leafName = handlers[handlers.length - 1].handler;
    let maximumContexts = numberOfContextsAcceptedByHandler(routeName, handlers); // NOTE: any ugliness in the calculation of activeness is largely
    // due to the fact that we support automatic normalizing of
    // `resource` -> `resource.index`, even though there might be
    // dynamic segments / query params defined on `resource.index`
    // which complicates (and makes somewhat ambiguous) the calculation
    // of activeness for links that link to `resource` instead of
    // directly to `resource.index`.
    // if we don't have enough contexts revert back to full route name
    // this is because the leaf route will use one of the contexts

    if (contexts.length > maximumContexts) {
      routeName = leafName;
    }

    return routerState.isActiveIntent(routeName, contexts, queryParams);
  }

}
RoutingService.reopen({
  targetState: readOnly('router.targetState'),
  currentState: readOnly('router.currentState'),
  currentRouteName: readOnly('router.currentRouteName'),
  currentPath: readOnly('router.currentPath')
});

function numberOfContextsAcceptedByHandler(handlerName, handlerInfos) {
  let req = 0;

  for (let i = 0; i < handlerInfos.length; i++) {
    req += handlerInfos[i].names.length;

    if (handlerInfos[i].handler === handlerName) {
      break;
    }
  }

  return req;
}
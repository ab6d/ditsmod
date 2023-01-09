import { Req } from '../services/request';
import { Class, FactoryProvider, Injector, ResolvedProvider } from '../di';
import { DecoratorMetadata, HttpMethod, NormalizedGuard } from './mix';
import { PathParam, RouteHandler } from './router';
import { NodeRequest, NodeResponse } from './server-options';
import { Res } from '../services/response';

/**
 * This metadata is generated by `ROUTES_EXTENSIONS` group, and available via
 * HTTP interceptors in first argument, in oblect with RequestContext type.
 */
export class RouteMeta {
  /**
   * Useful to set `routeMeta.resolvedFactory`.
   */
  static getResolvedFactory(controller: Class, propertyKey: string | symbol) {
    const factoryProvider: FactoryProvider = { useFactory: [controller, controller.prototype[propertyKey]] };
    return Injector.resolve([factoryProvider])[0];
  }

  resolvedFactory: ResolvedProvider;
  resolvedDeps?: ResolvedProvider[];
  /**
   * An array of DI tokens used to look up `CanActivate()` handlers,
   * in order to determine if the current user is allowed to activate the controller.
   * By default, any user can activate.
   */
  guards: NormalizedGuard[];
  /**
   * Route decorator has value of the decorator and ref to other decorators
   * on the same controller's method.
   */
  decoratorMetadata: DecoratorMetadata;
}

export class RequestContext {
  routeMeta: RouteMeta;
  nodeReq: NodeRequest;
  nodeRes: NodeResponse;
  queryString: string;
  aPathParams: PathParam[] | null;
  req: Req;
  res: Res;
}

/**
 * This metadata is generated by PreRouterExtension as internal type that need only for it.
 */
export interface PreparedRouteMeta {
  moduleName: string;
  httpMethod: HttpMethod;
  path: string;
  handle: RouteHandler;
}

import { Type } from '@ts-stack/di';
import { DecoratorMetadata, HttpMethod, NormalizedGuard } from './mix';
import { RouteHandler } from './router';

/**
 * This metadata is generated by `ROUTES_EXTENSIONS` group, and available via DI per
 * a route.
 */
export class RouteMeta {
  controller: Type<any>;
  /**
   * The controller's method name.
   */
  methodName: string | symbol;
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

/**
 * This metadata is generated by extensions that sets routes.
 */
export interface PreparedRouteMeta {
  moduleName: string;
  httpMethod: HttpMethod;
  path: string;
  handle: RouteHandler;
}

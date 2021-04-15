import { edk } from '@ditsmod/core';
import { Injectable, Injector, ReflectiveInjector } from '@ts-stack/di';
import { XOasObject, XPathsObject } from '@ts-stack/openapi-spec';

import { OAS_OBJECT } from '../di-tokens';
import { OasRouteMeta } from '../types/oas-route-meta';

@Injectable()
export class OpenapiCompilerExtension implements edk.Extension<XOasObject> {
  #oasObject: XOasObject;

  constructor(private extensionManager: edk.ExtensionsManager, private injectorPerApp: Injector) {}

  async init() {
    if (this.#oasObject) {
      return this.#oasObject;
    }

    const paths: XPathsObject = {};

    const rawRouteMeta = await this.extensionManager.init(edk.ROUTES_EXTENSIONS);
    rawRouteMeta.forEach((rawMeta) => {
      const injectorPerRou = ReflectiveInjector.resolveAndCreate(rawMeta.providersPerRou);
      const oasRouteMeta = injectorPerRou.get(OasRouteMeta) as OasRouteMeta;
      if (oasRouteMeta.pathItem) {
        paths[oasRouteMeta.oasPath] = oasRouteMeta.pathItem;
      } else {
        const httpMethod = oasRouteMeta.httpMethod.toLowerCase();
        const path = oasRouteMeta.path || '/';
        if (paths[path]) {
          paths[path][httpMethod] = {};
        } else {
          paths[path] = { [httpMethod]: {} };
        }
      }
    });

    this.#oasObject = this.injectorPerApp.get(OAS_OBJECT);
    this.#oasObject.paths = paths;

    return this.#oasObject;
  }
}
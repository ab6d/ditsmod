import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { NODE_REQ, NODE_RES, PATH_PARAMS, QUERY_STRING, ROUTES_EXTENSIONS } from '../constans';
import { HttpHandler } from '../types/http-interceptor';
import { HttpMethod, Extension, ServiceProvider, ModuleWithParams, ModuleType } from '../types/mix';
import { PreparedRouteMeta } from '../types/route-data';
import { RouteHandler, Router } from '../types/router';
import { NodeResponse, RequestListener } from '../types/server-options';
import { Status } from '../utils/http-status-codes';
import { ExtensionsManager } from '../services/extensions-manager';
import { Log } from '../services/log';
import { ModuleManager } from '../services/module-manager';
import { normalizeProviders } from '../utils/ng-utils';
import { getUniqProviders } from '../utils/get-uniq-providers';
import { MetadataPerMod2 } from '../types/metadata-per-mod';

@Injectable()
export class PreRouterExtension implements Extension<void> {
  #inited: boolean;

  constructor(
    protected injectorPerApp: ReflectiveInjector,
    protected router: Router,
    protected extensionsManager: ExtensionsManager,
    protected log: Log,
    protected moduleManager: ModuleManager
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }
    const rawRoutesMeta = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    const preparedRouteMeta = await this.prepareRoutesMeta(rawRoutesMeta);
    this.setRoutes(preparedRouteMeta);
    this.#inited = true;
  }

  requestListener: RequestListener = async (nodeReq, nodeRes) => {
    const { method: httpMethod, url } = nodeReq;
    const [uri, queryString] = this.decodeUrl(url || '').split('?');
    const { handle, params } = this.router.find(httpMethod as HttpMethod, uri);
    if (!handle) {
      this.sendNotFound(nodeRes);
      return;
    }
    await handle(nodeReq, nodeRes, params, queryString).catch((err) => {
      this.sendInternalServerError(nodeRes, err);
    });
  };

  protected async prepareRoutesMeta(metadataPerMod2Arr: MetadataPerMod2[]) {
    const preparedRouteMeta: PreparedRouteMeta[] = [];

    for (const metadataPerMod2 of metadataPerMod2Arr) {
      const { module, moduleName, metaForExtensionsPerRouArr, providersPerMod } = metadataPerMod2;
      this.resolveProvidersOnModule(module, metadataPerMod2);
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);

      metaForExtensionsPerRouArr.forEach((metaForExtensionsPerRou) => {
        const { httpMethod, path, providersPerRou, providersPerReq } = metaForExtensionsPerRou;
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou);
        const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);
        const injectors = this.setSiblings(metadataPerMod2, injectorPerRou);

        const handle = (async (nodeReq, nodeRes, params, queryString) => {
          injectors.forEach((i) => i.clearCache());
          injectorPerReq.parent = injectorPerRou.resolveAndCreateChild([
            { provide: NODE_REQ, useValue: nodeReq },
            { provide: NODE_RES, useValue: nodeRes },
            { provide: PATH_PARAMS, useValue: params },
            { provide: QUERY_STRING, useValue: queryString },
          ]);

          // First HTTP handler in the chain of HTTP interceptors.
          const chain = injectorPerReq.get(HttpHandler) as HttpHandler;
          await chain.handle();
        }) as RouteHandler;

        preparedRouteMeta.push({ moduleName, httpMethod, path, handle });
      });
    }

    return preparedRouteMeta;
  }

  protected resolveProvidersOnModule(
    module: ModuleType | ModuleWithParams,
    metadataPerMod2: MetadataPerMod2,
  ) {
    const meta = this.moduleManager.getMetadata(module);
    const { providersPerMod, providersPerRou, providersPerReq } = metadataPerMod2;
    Object.freeze(providersPerMod);
    Object.freeze(providersPerRou);
    Object.freeze(providersPerReq);
    meta.dynamicProviders.resolve({ providersPerMod, providersPerRou, providersPerReq });
  }

  protected setSiblings(
    metadataPerMod2: MetadataPerMod2,
    currentInjector: ReflectiveInjector
  ) {
    const siblingsPromises: Promise<any>[] = [];
    const injectors: ReflectiveInjector[] = [];

    metadataPerMod2.siblingsTokens.forEach((sibling) => {
      siblingsPromises.push(sibling.promise);
      sibling.promise.then((providers) => {
      const meta = this.moduleManager.getMetadata(sibling.module);
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(meta.providersPerMod);
        const siblingInjector = injectorPerMod.resolveAndCreateChild(providers);
        currentInjector.addSibling(siblingInjector, sibling.tokens);
        injectors.push(siblingInjector);
      });
    });

    return injectors;
  }

  /**
   * Checks in "sandbox" mode that `providersPerReq` instantiatable.
   *
   * This allows avoids "Error: No provider for SomeDepends" when processing an HTTP request.
   *
   * @todo Refactor this. For now it's not works.
   */
  protected instantiateProvidersPerReq(injectorPerRou: ReflectiveInjector, providers: ServiceProvider[]) {
    const child = injectorPerRou.resolveAndCreateChild([
      ...providers,
      { provide: NODE_REQ, useValue: {} },
      { provide: NODE_RES, useValue: {} },
      { provide: PATH_PARAMS, useValue: {} },
      { provide: QUERY_STRING, useValue: {} },
    ]);

    providers.forEach((p) => child.resolveAndInstantiate(p));
  }

  protected setRoutes(preparedRouteMeta: PreparedRouteMeta[]) {
    if (!preparedRouteMeta.length) {
      this.log.noRoutes('warn');
      return;
    }

    preparedRouteMeta.forEach((data) => {
      const { moduleName, path, httpMethod, handle } = data;

      if (path?.charAt(0) == '/') {
        let msg = `Invalid configuration of route '${path}'`;
        msg += ` (in '${moduleName}'): path cannot start with a slash`;
        throw new Error(msg);
      }

      this.log.showRoutes('debug', { moduleName, httpMethod, path });

      if (httpMethod == 'ALL') {
        this.router.all(`/${path}`, handle);
      } else {
        this.router.on(httpMethod, `/${path}`, handle);
      }
    });
  }

  protected decodeUrl(url: string) {
    return decodeURI(url);
  }

  /**
   * Logs an error and sends the user message about an internal server error (500).
   *
   * @param err An error to logs it (not sends).
   */
  protected sendInternalServerError(nodeRes: NodeResponse, err: Error) {
    this.log.internalServerError('error', err);
    nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    nodeRes.end();
  }

  protected sendNotFound(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_FOUND;
    nodeRes.end();
  }
}

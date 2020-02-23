import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { parentPort, isMainThread, workerData } from 'worker_threads';
import { ReflectiveInjector, reflector, Provider, Type, resolveForwardRef } from '@ts-stack/di';

import { ApplicationMetadata, RootModuleDecorator } from './decorators/root-module';
import { RequestListener } from './types/types';
import { isHttp2SecureServerOptions, isRootModule } from './utils/type-guards';
import { PreRequest } from './services/pre-request';
import { Request } from './request';
import { ModuleFactory } from './module-factory';
import { pickProperties } from './utils/pick-properties';
import { mergeArrays } from './utils/merge-arrays-options';
import { Router, HttpMethod } from './types/router';
import { NodeResToken, NodeReqToken } from './types/injection-tokens';
import { Logger } from './types/logger';
import { Server, Http2SecureServerOptions } from './types/server-options';
import { ModuleType, ModuleWithOptions, ModuleDecorator } from './decorators/module';
import { getDuplicates } from './utils/get-duplicates';
import { flatten, normalizeProviders } from './utils/ng-utils';
import { Factory } from './factory';

export class AppFactory extends Factory {
  protected log: Logger;
  protected server: Server;
  protected injectorPerApp: ReflectiveInjector;
  protected router: Router;
  protected preReq: PreRequest;

  // Setting default metadata.
  protected opts = new ApplicationMetadata();

  bootstrap(appModule: ModuleType) {
    return new Promise<Server>((resolve, reject) => {
      try {
        this.prepareServerOptions(appModule);
        this.createServer();

        if (!isMainThread) {
          const port = workerData?.port || 9000;
          this.opts.listenOptions.port = port;
        }

        this.server.listen(this.opts.listenOptions, () => {
          resolve(this.server);
          const host = this.opts.listenOptions.host || 'localhost';
          this.log.info(`${this.opts.serverName} is running at ${host}:${this.opts.listenOptions.port}`);

          if (!isMainThread) {
            parentPort.postMessage('Runing worker!');
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  protected prepareServerOptions(appModule: ModuleType) {
    this.mergeMetadata(appModule);
    this.checkSecureServerOption(appModule);
    this.prepareProvidersPerApp(appModule);
    this.initProvidersPerApp();
    this.log.trace('Setting server name:', this.opts.serverName);
    this.log.trace('Setting listen options:', this.opts.listenOptions);
    this.bootstrapModuleFactory(appModule);
  }

  protected bootstrapModuleFactory(appModule: ModuleType) {
    const rootModulePrefix = this.opts.rootModules.find(config => config.rootModule === appModule)?.prefix || '';
    const importer = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
    importer.bootstrap(this.opts.routesPrefixPerApp, rootModulePrefix, appModule);

    this.opts.rootModules.forEach(config => {
      const moduleFactory = this.injectorPerApp.resolveAndInstantiate(ModuleFactory) as ModuleFactory;
      moduleFactory.bootstrap(this.opts.routesPrefixPerApp, config.prefix, config.rootModule, importer);
    });
  }

  /**
   * @todo Improve searching duplicates of providersPerApp.
   * Need diff between setting from `@RootModule` and `@Module`.
   */
  protected prepareProvidersPerApp(appModule: ModuleType) {
    const tokensFromAppModule = normalizeProviders(this.opts.providersPerApp).map(np => np.provide);
    const uniqTokensFromAppModule = [...new Set(tokensFromAppModule)];

    const providersPerApp: Provider[] = [];
    const modules = this.opts.rootModules.map(c => c.rootModule);
    [appModule, ...modules].forEach(mod => {
      providersPerApp.push(...this.getProvidersPerApp(mod));
    });

    const tokensFromChildModules = normalizeProviders(providersPerApp).map(np => np.provide);
    const duplicates = getDuplicates([...uniqTokensFromAppModule, ...tokensFromChildModules]).map(p => p.name || p);
    if (duplicates.length) {
      throw new Error(`The duplicates in 'providersPerApp' was found: ${duplicates.join(', ')}`);
    }
    this.opts.providersPerApp.push(...providersPerApp);
  }

  protected getProvidersPerApp(typeOrObject: Type<any> | ModuleWithOptions<any>) {
    const mod = this.getModule(typeOrObject);
    const modMetadata = this.getRawModuleMetadata(typeOrObject) as RootModuleDecorator | ModuleDecorator;
    this.checkModuleMetadata(modMetadata, mod.name);

    const imports = flatten((modMetadata.imports || []).slice()).map(resolveForwardRef);
    const providersPerApp: Provider[] = [];
    imports.forEach(imp => providersPerApp.push(...this.getProvidersPerApp(imp)));
    const currProvidersPerApp = isRootModule(modMetadata) ? [] : modMetadata.providersPerApp || [];

    return [...providersPerApp, ...currProvidersPerApp];
  }

  /**
   * Merge AppModule metadata with default ApplicationMetadata.
   */
  protected mergeMetadata(appModule: ModuleType): void {
    const modMetadata = reflector.annotations(appModule).find(isRootModule);
    if (!modMetadata) {
      throw new Error(`Module build failed: module "${appModule.name}" does not have the "@RootModule()" decorator`);
    }

    const providersPerApp = mergeArrays(this.opts.providersPerApp, modMetadata.providersPerApp);
    pickProperties(this.opts, modMetadata);
    this.opts.providersPerApp = providersPerApp;
    this.opts.rootModules = this.opts.rootModules.slice();
  }

  /**
   * Init providers per the application.
   */
  protected initProvidersPerApp() {
    this.injectorPerApp = ReflectiveInjector.resolveAndCreate(this.opts.providersPerApp);
    this.log = this.injectorPerApp.get(Logger) as Logger;
    this.router = this.injectorPerApp.get(Router) as Router;
    this.preReq = this.injectorPerApp.get(PreRequest) as PreRequest;
  }

  protected checkSecureServerOption(appModule: ModuleType) {
    const serverOptions = this.opts.serverOptions as Http2SecureServerOptions;
    if (serverOptions?.isHttp2SecureServer && !(this.opts.httpModule as typeof http2).createSecureServer) {
      throw new TypeError(`serverModule.createSecureServer() not found (see ${appModule.name} settings)`);
    }
  }

  protected requestListener: RequestListener = (nodeReq, nodeRes) => {
    nodeRes.setHeader('Server', this.opts.serverName);
    const { method: httpMethod, url } = nodeReq;
    const [uri, queryString] = this.preReq.decodeUrl(url).split('?');
    const { handle: handleRoute, params } = this.router.find(httpMethod as HttpMethod, uri);
    if (!handleRoute) {
      this.preReq.sendNotFound(nodeRes);
      return;
    }
    /**
     * @param injector Injector per module that tied to the route.
     * @param providers Resolved providers per request.
     * @param method Method of the class controller.
     * @param parseBody Need or not to parse body.
     */
    const { injector, providers, controller, method, parseBody, routeData } = handleRoute();
    const inj1 = injector.resolveAndCreateChild([
      { provide: NodeReqToken, useValue: nodeReq },
      { provide: NodeResToken, useValue: nodeRes }
    ]);
    const inj2 = inj1.createChildFromResolved(providers);
    const req = inj2.get(Request) as Request;
    req.handleRoute(controller, method, params, queryString, parseBody, routeData);
  };

  protected createServer() {
    if (isHttp2SecureServerOptions(this.opts.serverOptions)) {
      const serverModule = this.opts.httpModule as typeof http2;
      this.server = serverModule.createSecureServer(this.opts.serverOptions, this.requestListener);
    } else {
      const serverModule = this.opts.httpModule as typeof http | typeof https;
      const serverOptions = this.opts.serverOptions as http.ServerOptions | https.ServerOptions;
      this.server = serverModule.createServer(serverOptions, this.requestListener);
    }
  }
}

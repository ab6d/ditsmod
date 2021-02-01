import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { ReflectiveInjector, Type, Provider } from '@ts-stack/di';

import { AppFactory } from './app-factory';
import { RootModule, ApplicationMetadata } from './decorators/root-module';
import { PreRequest } from './services/pre-request';
import { Router, ImportsWithPrefix } from './types/router';
import { Logger } from './types/logger';
import { Server } from './types/server-options';
import { Module, ModuleType, ModuleWithOptions, ModuleMetadata } from './decorators/module';

describe('AppFactory', () => {
  class MockAppFactory extends AppFactory {
    log: Logger;
    server: Server;
    injectorPerApp: ReflectiveInjector;
    router: Router;
    preReq: PreRequest;
    opts = new ApplicationMetadata();

    mergeMetadata(appModule: ModuleType): void {
      return super.mergeMetadata(appModule);
    }

    getRawModuleMetadata(modOrObject: Type<any> | ModuleWithOptions<any>, isRoot?: boolean) {
      return super.getRawModuleMetadata(modOrObject, isRoot);
    }

    importProvidersPerApp(mod: Type<any> | ModuleWithOptions<any>) {
      return super.importProvidersPerApp(mod);
    }

    checkSecureServerOption(appModule: ModuleType) {
      return super.checkSecureServerOption(appModule);
    }

    prepareServerOptions(appModule: ModuleType) {
      return super.prepareServerOptions(appModule);
    }

    bootstrapModuleFactory(appModule: ModuleType) {
      return super.bootstrapModuleFactory(appModule);
    }

    prepareProvidersPerApp(appModule: ModuleType) {
      return super.prepareProvidersPerApp(appModule);
    }
  }

  let mock: MockAppFactory;
  class SomeClass {}
  class OtherClass {}

  beforeEach(() => {
    mock = new MockAppFactory();
  });

  describe('mergeMetadata()', () => {
    it('should set the default metatada', () => {
      @RootModule()
      class AppModule {}

      mock.mergeMetadata(AppModule);
      expect(mock.opts.httpModule).toBeDefined();
      expect(mock.opts.serverName).toBe('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.listenOptions).toBeDefined();
      expect(mock.opts.prefixPerApp).toBe('');
      expect(mock.opts.providersPerApp).toEqual([]);

      const opts = (mock.opts as unknown) as ModuleMetadata;
      expect(opts.controllers).toBe(undefined);
      expect(opts.exports).toBe(undefined);
      expect(opts.imports).toBe(undefined);
      expect(opts.providersPerMod).toBe(undefined);
      expect(opts.providersPerReq).toBe(undefined);
    });

    it('should merge default metatada with AppModule metadata', () => {
      class SomeModule {}
      class OtherModule {}

      const imports: ImportsWithPrefix[] = [
        { prefix: '', module: SomeModule },
        { prefix: '', module: OtherModule },
      ];

      @RootModule({
        prefixPerApp: 'api',
        imports,
        controllers: [SomeClass],
        providersPerApp: [OtherClass],
      })
      class AppModule {}

      mock.mergeMetadata(AppModule);
      expect(mock.opts.serverName).toEqual('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.httpModule).toBeDefined();
      expect(mock.opts.prefixPerApp).toBe('api');
      expect(mock.opts.providersPerApp).toEqual([OtherClass]);
      expect(mock.opts.listenOptions).toBeDefined();

      const opts = (mock.opts as unknown) as ModuleMetadata;
      expect(opts.controllers).toBe(undefined);
      expect(opts.exports).toBe(undefined);
      expect(opts.imports).toBe(undefined);
      expect(opts.providersPerMod).toBe(undefined);
      expect(opts.providersPerReq).toBe(undefined);
    });

    it('OtherClass should not have metatada', () => {
      const msg = `Module build failed: module "OtherClass" does not have the "@RootModule()" decorator`;
      expect(() => mock.mergeMetadata(OtherClass)).toThrowError(msg);
    });
  });

  describe('prepareProvidersPerApp()', () => {
    it(`should throw error about duplicates in providersPerApp`, () => {
      class Provider1 {}

      @Module({ providersPerApp: [{ provide: Provider1, useClass: Provider1 }] })
      class Module1 {}

      @Module({ providersPerApp: [Provider1] })
      class Module2 {}

      @RootModule({
        imports: [Module1, Module2],
      })
      class RootModule1 {}

      mock.mergeMetadata(RootModule1);
      const msg =
        `Exporting providers in RootModule1 was failed: found collision for: ` +
        `Provider1. You should manually add this provider to RootModule1.`;
      expect(() => mock.prepareProvidersPerApp(RootModule1)).toThrow(msg);
    });

    it(`should works with duplicates in providersPerApp of root module`, () => {
      class Provider1 {}

      @RootModule({ providersPerApp: [Provider1, Provider1] })
      class RootModule2 {}

      mock.mergeMetadata(RootModule2);
      expect(() => mock.prepareProvidersPerApp(RootModule2)).not.toThrow();
      expect(mock.opts.providersPerApp.length).toBe(2);
    });

    it(`should works with duplicates in root module`, () => {
      class Provider1 {}
      const Alias = Provider1;
      const duplicates = [Provider1, Alias];

      @Module({ providersPerApp: duplicates })
      class Module1 {}

      @RootModule({
        imports: [Module1],
      })
      class RootModule1 {}

      mock.mergeMetadata(RootModule1);
      expect(() => mock.prepareProvidersPerApp(RootModule1)).not.toThrow();
    });

    it(`should works with duplicates in feature module and root module`, () => {
      class Provider1 {}
      const Alias = Provider1;
      const duplicates = [Provider1, Alias];

      @Module({ providersPerApp: duplicates })
      class Module1 {}

      @RootModule({
        imports: [Module1],
        providersPerApp: duplicates,
      })
      class RootModule3 {}

      mock.mergeMetadata(RootModule3);
      expect(() => mock.prepareProvidersPerApp(RootModule3)).not.toThrow();
      expect(mock.opts.providersPerApp.length).toBe(3);
    });

    it(`should works with empty "imports" array in root module`, () => {
      @RootModule({
        imports: [],
      })
      class RootModule4 {}
      mock.mergeMetadata(RootModule4);
      expect(() => mock.prepareProvidersPerApp(RootModule4)).not.toThrow();
    });
  });

  describe('importProvidersPerApp()', () => {
    class Provider1 {}
    class Provider2 {}
    class Provider3 {}
    class Provider4 {}
    class Provider5 {}
    class Provider6 {}
    class Provider7 {}

    @Module({
      providersPerApp: [Provider1],
    })
    class Module1 {}

    @Module({
      providersPerApp: [Provider2, Provider3, Provider4],
      imports: [Module1],
    })
    class Module2 {}

    @Module({
      providersPerApp: [Provider5, Provider6],
      imports: [Module2],
    })
    class Module3 {}

    @Module({
      imports: [Module3],
      providersPerApp: [{ provide: Provider1, useClass: Provider7 }],
    })
    class Module4 {}

    it('should collects providers in particular order', () => {
      expect(mock.importProvidersPerApp(Module4)).toEqual([
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6,
        { provide: Provider1, useClass: Provider7 },
      ]);
    });

    it('should flattens arrays with modules', () => {
      @Module({
        imports: [Module1, [Module4]],
      })
      class Module5 {}

      expect(mock.importProvidersPerApp(Module5)).toEqual([
        Provider1,
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6,
        { provide: Provider1, useClass: Provider7 },
      ]);
    });

    it('should works with moduleWithOptions', () => {
      @Module({
        imports: [Module4],
      })
      class Module6 {
        static withOptions(providers: Provider[]): ModuleWithOptions<Module6> {
          return { module: Module6, providersPerApp: providers };
        }
      }
      const modWithOptions = Module6.withOptions([Provider7]);
      expect(mock.importProvidersPerApp(modWithOptions)).toEqual([
        Provider1,
        Provider2,
        Provider3,
        Provider4,
        Provider5,
        Provider6,
        { provide: Provider1, useClass: Provider7 },
        Provider7,
      ]);
    });

    it('should have empty array of providersPerApp', () => {
      @Module()
      class Module7 {}
      expect(mock.importProvidersPerApp(Module7)).toEqual([]);
    });
  });

  describe('checkSecureServerOption()', () => {
    @RootModule({
      controllers: [SomeClass],
      providersPerApp: [OtherClass],
    })
    class AppModule {}

    it('should not to throw with http2 and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = http2;
      expect(() => mock.checkSecureServerOption(AppModule)).not.toThrow();
    });

    it('should to throw with http and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule)).toThrowError(msg);
    });

    it('should not to throw with http and isHttp2SecureServer == false', () => {
      mock.opts.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule)).not.toThrowError(msg);
    });

    it('should to throw with https and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = https;
      const msg = 'serverModule.createSecureServer() not found (see AppModule settings)';
      expect(() => mock.checkSecureServerOption(AppModule)).toThrowError(msg);
    });
  });
});

import 'reflect-metadata';
import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { ReflectiveInjector, Type, Provider } from 'ts-di';

import { AppFactory } from './app-factory';
import { RootModule, ApplicationMetadata, defaultProvidersPerApp } from './decorators/root-module';
import { PreRequest } from './services/pre-request';
import { Router } from './types/router';
import { Logger } from './types/logger';
import { Server } from './types/server-options';
import { Module, ModuleType, ModuleDecorator, ModuleWithOptions } from './decorators/module';
import { Controller } from './decorators/controller';
import { ModuleFactory } from './module-factory';

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

    checkSecureServerOption(appModule: ModuleType) {
      return super.checkSecureServerOption(appModule);
    }

    prepareServerOptions(appModule: ModuleType) {
      return super.prepareServerOptions(appModule);
    }
  }

  let mock: MockAppFactory;
  class SomeControllerClass {}
  class ClassWithoutDecorators {}

  beforeEach(() => {
    mock = new MockAppFactory();
  });

  describe('mergeMetadata()', () => {
    it('should set default metatada', () => {
      @RootModule()
      class ClassWithDecorators {}

      mock.mergeMetadata(ClassWithDecorators);
      expect(mock.opts.serverName).toBe('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.httpModule).toBeDefined();
      expect(mock.opts.routesPrefixPerApp).toBe('');
      expect(mock.opts.routesPrefixPerMod).toEqual([]);
      expect(mock.opts.providersPerApp).toEqual(defaultProvidersPerApp);
      expect(mock.opts.listenOptions).toBeDefined();
      // Ignore controllers - it's intended behavior.
      expect((mock.opts as any).routesPerMod).toBe(undefined);
      expect((mock.opts as any).controllers).toBe(undefined);
      expect((mock.opts as any).exports).toBe(undefined);
      expect((mock.opts as any).imports).toBe(undefined);
      expect((mock.opts as any).providersPerMod).toBe(undefined);
      expect((mock.opts as any).providersPerReq).toBe(undefined);
    });

    it('should merge default metatada with ClassWithDecorators metadata', () => {
      class SomeModule {}
      class OtherModule {}
      class SomeEntity {}

      const routesPrefixPerMod = [
        { prefix: '', module: SomeModule },
        { prefix: '', module: OtherModule }
      ];

      @RootModule({
        routesPrefixPerApp: 'api',
        routesPrefixPerMod,
        controllers: [SomeControllerClass],
        providersPerApp: [ClassWithoutDecorators]
      })
      class ClassWithDecorators {}

      mock.mergeMetadata(ClassWithDecorators);
      expect(mock.opts.serverName).toEqual('Node.js');
      expect(mock.opts.serverOptions).toEqual({});
      expect(mock.opts.httpModule).toBeDefined();
      expect(mock.opts.routesPrefixPerApp).toBe('api');
      expect(mock.opts.routesPrefixPerMod).toEqual(routesPrefixPerMod);
      expect(mock.opts.providersPerApp).toEqual([...defaultProvidersPerApp, ClassWithoutDecorators]);
      expect(mock.opts.listenOptions).toBeDefined();
      // Ignore controllers - it's intended behavior.
      expect((mock.opts as any).routesPerMod).toBe(undefined);
      expect((mock.opts as any).controllers).toBe(undefined);
      expect((mock.opts as any).exports).toBe(undefined);
      expect((mock.opts as any).imports).toBe(undefined);
      expect((mock.opts as any).providersPerMod).toBe(undefined);
      expect((mock.opts as any).providersPerReq).toBe(undefined);
    });

    it('ClassWithoutDecorators should not have metatada', () => {
      const msg = `Module build failed: module "ClassWithoutDecorators" does not have the "@RootModule()" decorator`;
      expect(() => mock.mergeMetadata(ClassWithoutDecorators)).toThrowError(msg);
    });
  });

  describe('checkSecureServerOption()', () => {
    @RootModule({
      controllers: [SomeControllerClass],
      providersPerApp: [ClassWithoutDecorators]
    })
    class ClassWithDecorators {}

    it('should not to throw with http2 and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = http2;
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).not.toThrow();
    });

    it('should to throw with http and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).toThrowError(msg);
    });

    it('should not to throw with http and isHttp2SecureServer == false', () => {
      mock.opts.httpModule = http;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).not.toThrowError(msg);
    });

    it('should to throw with https and isHttp2SecureServer == true', () => {
      mock.opts.serverOptions = { isHttp2SecureServer: true };
      mock.opts.httpModule = https;
      const msg = 'serverModule.createSecureServer() not found (see ClassWithDecorators settings)';
      expect(() => mock.checkSecureServerOption(ClassWithDecorators)).toThrowError(msg);
    });
  });

  describe('prepareServerOptions()', () => {
    let numCallSingleton = 0;
    let numCallNotSingleton = 0;
    @Controller()
    class Provider1 {}

    @Module({
      controllers: [Provider1]
    })
    class Module1 {
      constructor() {
        ++numCallNotSingleton;
      }
    }

    @Module({
      controllers: [Provider1]
    })
    class ModuleSingleton {
      constructor() {
        ++numCallSingleton;
      }
    }

    @RootModule({
      imports: [Module1, Module1, ModuleSingleton, ModuleSingleton],
      providersPerApp: [ModuleSingleton]
    })
    class Module9 {}

    it(`should instantiate ModuleSingleton as singleton`, () => {
      mock.prepareServerOptions(Module9);
      expect(mock.opts.providersPerApp.includes(ModuleSingleton));
      expect(numCallNotSingleton).toBe(2);
      expect(numCallSingleton).toBe(1);
      expect((ModuleFactory as any).singletons).toEqual([ModuleSingleton]);
    });
  });
});

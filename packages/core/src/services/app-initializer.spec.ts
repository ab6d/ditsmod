import 'reflect-metadata';
import { Injectable } from '@ts-stack/di';

import { AppInitializer } from './app-initializer';
import { Logger, LoggerConfig } from '../types/logger';
import { Router } from '../types/router';
import { ModuleType, ModuleWithParams, ImportedProviders } from '../types/mix';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { RootModule } from '../decorators/root-module';
import { RootMetadata } from '../models/root-metadata';
import { DefaultLogger } from './default-logger';
import { ModuleManager } from './module-manager';
import { FilterConfig, Log } from './log';
import { LogManager } from './log-manager';
import { Module } from '../decorators/module';
import { Controller } from '../decorators/controller';
import { Route } from '../decorators/route';

describe('AppInitializer', () => {
  type M = ModuleType | ModuleWithParams;
  type S = ImportedProviders;

  @Injectable()
  class AppInitializerMock extends AppInitializer {
    override meta = new RootMetadata();

    constructor(public override moduleManager: ModuleManager, public override log: Log) {
      super(moduleManager, log);
    }

    override mergeRootMetadata(meta: NormalizedModuleMetadata) {
      return super.mergeRootMetadata(meta);
    }

    override collectProvidersPerApp(meta: NormalizedModuleMetadata, moduleManager: ModuleManager) {
      return super.collectProvidersPerApp(meta, moduleManager);
    }

    override prepareProvidersPerApp(meta: NormalizedModuleMetadata, moduleManager: ModuleManager) {
      return super.prepareProvidersPerApp(meta, moduleManager);
    }
  }

  let mock: AppInitializerMock;
  let moduleManager: ModuleManager;

  describe('bootstrapProvidersPerApp()', () => {
    fit('case 1', () => {
      const loggerSpy = jest.fn();

      class LogMock extends Log {
        override flush() {
          const { level } = (this._logger as any).config;
          loggerSpy(level);
          super.flush();
        }
      }

      // Simulation of a call from the Application
      const log = new LogMock(new LogManager());
      moduleManager = new ModuleManager(log);
      mock = new AppInitializerMock(moduleManager, log);

      // Simulation of a call from the AppModule
      const config2 = new LoggerConfig('trace');
      @RootModule({
        providersPerApp: [
          Router,
          { provide: LoggerConfig, useValue: config2 },
          { provide: Log, useClass: LogMock },
        ],
      })
      class AppModule {}

      moduleManager.scanRootModule(AppModule);
      mock.bootstrapProvidersPerApp();
      // Here log used from Application
      log.flush();
      mock.flushLogs();
      expect(loggerSpy.mock.calls[0]).toEqual(['info']);
      expect(loggerSpy.mock.calls[1]).toEqual(['trace']);
    });
  });

  describe('init()', () => {
    const testMethodSpy = jest.fn();
    class LogMock1 extends Log {
      testMethod(level: keyof Logger, filterConfig: FilterConfig = {}, ...args: any[]) {
        testMethodSpy();
        this.setLog(level, filterConfig, `${args}`);
      }
    }
    class LogMock2 extends Log {}

    @Module({ providersPerApp: [{ provide: Log, useClass: LogMock2 }] })
    class Module1 {}

    @RootModule({
      imports: [Module1],
      providersPerApp: [
        { provide: Router, useValue: 'fake' },
        { provide: Log, useClass: LogMock1 },
        { provide: LogManager, useValue: new LogManager() },
      ],
    })
    class AppModule {}

    beforeEach(() => {
      testMethodSpy.mockRestore();
    });

    it('logs should collects between two init()', async () => {
      @Controller()
      class Ctrl {
        @Route('GET')
        method() {}
      }

      @Module({ controllers: [Ctrl] })
      class Module1 {}

      @RootModule({
        imports: [Module1]
      })
      class AppModule {}
      moduleManager.scanRootModule(AppModule);

      // First init
      await mock.bootstrapProvidersPerApp();
    });

    it('logs should collects between two init()', async () => {
      expect(mock.log.buffer).toHaveLength(0);
      expect(mock.log).toBeInstanceOf(Log);
      expect(mock.log).not.toBeInstanceOf(LogMock1);
      moduleManager.scanRootModule(AppModule);

      // First init
      await mock.bootstrapProvidersPerApp();
      const { buffer } = mock.log;
      expect(mock.log).toBeInstanceOf(LogMock1);
      (mock.log as LogMock1).testMethod('debug', {}, 'one', 'two');
      const msgIndex1 = buffer.length - 1;
      expect(buffer[msgIndex1].level).toBe('debug');
      expect(buffer[msgIndex1].msg).toBe('one,two');
      expect(testMethodSpy.mock.calls.length).toBe(1);

      // Second init
      await mock.bootstrapProvidersPerApp();
      expect(mock.log).toBeInstanceOf(LogMock1);
      (mock.log as LogMock1).testMethod('info', {}, 'three', 'four');
      // Logs from first init() still here
      expect(buffer[msgIndex1].level).toBe('debug');
      expect(buffer[msgIndex1].msg).toBe('one,two');
      const msgIndex2 = buffer.length - 1;
      expect(buffer[msgIndex2].level).toBe('info');
      expect(buffer[msgIndex2].msg).toBe('three,four');
      expect(testMethodSpy.mock.calls.length).toBe(2);
      mock.log.flush();
      expect(buffer.length).toBe(0);
    });
  });
});

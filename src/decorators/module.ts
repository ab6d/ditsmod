import { Type, Provider, makeDecorator, TypeProvider } from '@ts-stack/di';

import { Request } from '../services/request';
import { Response } from '../services/response';
import { ControllerErrorHandler, Extension } from '../types/types';
import { DefaultControllerErrorHandler } from '../services/default-controller-error-handler';
import { ImportWithOptions, ImportWithOptions2 } from '../types/import-with-options';
  
export const defaultProvidersPerReq: Readonly<Provider[]> = [
  Request,
  Response,
  { provide: ControllerErrorHandler, useClass: DefaultControllerErrorHandler }
];

export interface ModuleDecoratorFactory {
  (data?: ModuleDecorator): any;
  new (data?: ModuleDecorator): ModuleDecorator;
}

export const Module = makeDecorator('Module', (data: any) => data) as ModuleDecoratorFactory;

/**
 * @todo It should be clarified that providers can go array by array.
 */
export class ProvidersMetadata {
  /**
   * Providers per the application.
   */
  providersPerApp: Provider[] = [];
  /**
   * Providers per module.
   */
  providersPerMod: Provider[] = [];
  /**
   * Providers per request.
   */
  providersPerReq: Provider[] = [];
}

export interface ModuleWithOptions<T> extends Partial<ProvidersMetadata> {
  module: Type<T>;
}

export abstract class StaticModuleMetadata extends ProvidersMetadata {
  /**
   * The application controllers.
   */
  controllers: TypeProvider[] = [];
  extensions: Type<Extension>[] = [];
}

export interface ModuleDecorator extends Partial<StaticModuleMetadata> {
  /**
   * List of modules or `ModuleWithOptions` imported by this module.
   * Also you can imports modules and set some prefix per each the module.
   */
  imports?: Array<ModuleType | ModuleWithOptions<any> | ImportWithOptions | any[]>;
  /**
   * List of modules, `ModuleWithOptions` or providers exported by this
   * module.
   */
  exports?: Array<ModuleType | ModuleWithOptions<any> | Provider | any[]>;
}

export class ModuleMetadata extends StaticModuleMetadata {
  /**
   * Imports modules and setting some prefix per each the module.
   */
  imports: ImportWithOptions[] = [];
  exports: Array<ModuleType | ModuleWithOptions<any> | Provider> = [];
}

export type NormalizedModuleMetadata = ScanedModuleMetadata & { ngMetadataName: string };

export class ScanedModuleMetadata extends StaticModuleMetadata {
  /**
   * Imports modules and setting some prefix per each the module.
   */
  imports: ImportWithOptions2[] = [];
  exports: Array<ModuleType | ModuleWithOptions<any> | Provider> = [];
}

/**
 * @todo Replace this duplicate by `../types/types#ModuleType`.
 */
export type ModuleType = new (...args: any[]) => any;

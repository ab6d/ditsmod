import { AppendsWithParams } from '../types/module-metadata';
import {
  AnyObj,
  ModuleType,
  ModuleWithParams,
  ServiceProvider,
  ExtensionProvider,
  NormalizedGuard,
  AnyFn,
} from '../types/mix';
import { MultiProvider } from '../utils/type-guards';
import { ProvidersMetadata } from './providers-metadata';
import { Class } from '../di';

export class NormalizedModuleMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj> extends ProvidersMetadata {
  /**
   * The module setted here must be identical to the module
   * passed to "imports", "exports" or "appends" array of `@Module` metadata.
   */
  module: ModuleType<T> | ModuleWithParams<T> | AppendsWithParams<T>;
  /**
   * The module name.
   */
  name: string;
  /**
   * The module ID.
   */
  id?: string = '';
  importsModules: ModuleType[] = [];
  importsWithParams: ModuleWithParams[] = [];
  appendsWithParams: AppendsWithParams[] = [];
  controllers: Class[] = [];
  decoratorFactory: AnyFn;
  exportsModules: ModuleType[] = [];
  exportsWithParams: ModuleWithParams[] = [];
  exportedProvidersPerMod: ServiceProvider[] = [];
  exportedProvidersPerRou: ServiceProvider[] = [];
  exportedProvidersPerReq: ServiceProvider[] = [];
  exportedMultiProvidersPerMod: MultiProvider[] = [];
  exportedMultiProvidersPerRou: MultiProvider[] = [];
  exportedMultiProvidersPerReq: MultiProvider[] = [];
  normalizedGuardsPerMod: NormalizedGuard[] = [];
  resolvedCollisionsPerApp: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerMod: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerRou: [any, ModuleType | ModuleWithParams][] = [];
  resolvedCollisionsPerReq: [any, ModuleType | ModuleWithParams][] = [];
  extensionsProviders: ExtensionProvider[] = [];
  exportedExtensions: ExtensionProvider[] = [];
  /**
   * This property allows you to pass any information to extensions.
   *
   * You must follow this rule: data for one extension - one key in `extensionsMeta` object.
   */
  extensionsMeta = {} as A;
}

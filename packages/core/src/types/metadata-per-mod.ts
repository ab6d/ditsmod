import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ExportedProviders } from '../models/exported-providers';
import { ControllerAndMethodMetadata } from './controller-and-method-metadata';
import { HttpMethod, ModuleType, ModuleWithParams, NormalizedGuard, ServiceProvider } from './mix';

export class SiblingsMap {
  siblingsPerMod = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
  siblingsPerRou = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
  siblingsPerReq = new Map<ServiceProvider, ModuleType | ModuleWithParams>();
}

/**
 * Metadata collected using `ModuleFactory`.
 */
export class MetadataPerMod1 {
  prefixPerMod: string;
  guardsPerMod: NormalizedGuard[];
  meta: NormalizedModuleMetadata;
  /**
   * The controller metadata collected from all controllers of current module.
   */
  controllersMetadata: ControllerAndMethodMetadata[];
  siblingTokensArr: ExportedProviders[];
}

/**
 * This metadata is generated by `ROUTES_EXTENSIONS` group, and available for other extensions
 * that need set routes.
 */
 export class MetadataPerMod2 {
  module: ModuleType | ModuleWithParams;
  moduleName: string;
  /**
   * Providers per a module.
   */
  providersPerMod: ServiceProvider[];
  /**
   * Providers per a route.
   */
  providersPerRou: ServiceProvider[];
  /**
   * Providers per a request.
   */
  providersPerReq: ServiceProvider[];
  metaForExtensionsPerRouArr: MetaForExtensionsPerRou[];
  siblingTokensArr: ExportedProviders[];
}

export class MetaForExtensionsPerRou {
  /**
   * Providers per a route.
   */
  providersPerRou: ServiceProvider[];
  /**
   * Providers per a request.
   */
  providersPerReq: ServiceProvider[];
  path: string;
  httpMethod: HttpMethod;
}

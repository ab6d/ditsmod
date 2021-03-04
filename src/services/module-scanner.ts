import { Injectable, resolveForwardRef } from '@ts-stack/di';

import { GuardItem } from '../types/guard-item';
import { ModuleType } from '../types/module-type';
import { ModuleWithParams } from '../types/module-with-params';
import { NormalizedGuard } from '../types/normalized-guard';
import { checkModuleMetadata } from '../utils/check-module-metadata';
import { getModuleName } from '../utils/get-module-name';
import { getModuleMetadata } from '../utils/get-module-metadata';
import { isModuleWithParams, isProvider } from '../utils/type-guards';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';
import { ModuleMetadata } from '../types/module-metadata';

@Injectable()
export class ModuleScanner {
  protected map = new Map<string | number | ModuleType | ModuleWithParams, NormalizedModuleMetadata>();

  scanModule(modOrObj: ModuleType | ModuleWithParams<any>) {
    const metadata = this.normalizeMetadata(modOrObj);

    [...metadata.imports1, ...metadata.imports2, ...metadata.exports1].forEach((impOrExp) => {
      this.scanModule(impOrExp);
    });

    type ImpOrExp = Exclude<keyof NormalizedModuleMetadata, 'id'>;
    const group: ImpOrExp[] = ['imports1', 'imports2', 'exports1', 'exports2'];

    group.forEach((prop) => {
      if (!metadata[prop]?.length) {
        delete metadata[prop];
      }
    });

    const id = metadata.id || modOrObj;
    this.map.set(id, metadata);
  }

  /**
   * Freezes original module metadata and returns normalized module metadata.
   */
  protected normalizeMetadata(mod: ModuleType | ModuleWithParams) {
    if (!Object.isFrozen(mod)) {
      Object.freeze(mod);
    }
    const modMetadata = getModuleMetadata(mod);
    const modName = getModuleName(mod);
    checkModuleMetadata(modMetadata, modName);

    /**
     * Setting initial properties of metadata.
     */
    const metadata = new NormalizedModuleMetadata();
    /**
     * `ngMetadataName` is used only internally and is hidden from the public API.
     */
    metadata.ngMetadataName = (modMetadata as any).ngMetadataName;

    if (modMetadata.id) {
      metadata.id = modMetadata.id;
    }
    this.normalizeImports(modMetadata, metadata);
    this.normalizeExports(modMetadata, metadata);
    this.normalizeOtherProperties(modMetadata, metadata);

    return metadata;
  }

  protected normalizeImports(modMetadata: ModuleMetadata, metadata: NormalizedModuleMetadata) {
    modMetadata.imports?.forEach((imp) => {
      imp = resolveForwardRef(imp);

      if (isModuleWithParams(imp)) {
        const normImp: ModuleWithParams = Object.assign({}, imp, {
          prefix: imp.prefix || '',
          module: resolveForwardRef(imp.module),
          guards: this.normalizeGuards(imp.guards),
        });
        metadata.imports2.push(normImp);
      } else {
        metadata.imports1.push(imp);
      }
    });
  }

  protected normalizeExports(modMetadata: ModuleMetadata, metadata: NormalizedModuleMetadata) {
    modMetadata.exports?.forEach((exp) => {
      exp = resolveForwardRef(exp);

      if (isProvider(exp)) {
        metadata.exports2.push(exp);
      } else {
        metadata.exports1.push(exp);
      }
    });
  }

  /**
   * Normalizes all the properties of a module metadata, except `id`, `imports` and `exports`.
   */
  protected normalizeOtherProperties(modMetadata: ModuleMetadata, metadata: NormalizedModuleMetadata) {
    const group: Exclude<keyof ModuleMetadata, 'id' | 'imports' | 'exports'>[] = [
      'controllers',
      'providersPerApp',
      'providersPerMod',
      'providersPerReq',
      'extensions',
    ];

    group.forEach((prop) => {
      if (modMetadata[prop]?.length) {
        metadata[prop] = this.normalizeArray(modMetadata[prop]);
      } else {
        delete metadata[prop];
      }
    });
  }

  protected normalizeArray(arr: any[]) {
    return (arr || []).slice().map(resolveForwardRef);
  }

  protected normalizeGuards(guards: GuardItem[]) {
    return (guards || []).slice().map((item) => {
      if (Array.isArray(item)) {
        return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
      } else {
        return { guard: item } as NormalizedGuard;
      }
    });
  }
}

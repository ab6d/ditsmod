import { Inject, Injectable } from '@ts-stack/di';
import { edk } from '@ditsmod/core';
import { ReferenceObject, XParameterObject } from '@ts-stack/openapi-spec';

import { OasModuleWithParams } from '../types/oas-modul-with-params';
import { isReferenceObject } from '../utils/type-guards';
import { getLastParameterObjects, getLastReferenceObjects } from '../utils/get-last-params';
import { RECURSIVE_PARAM } from '../utils/parameters';

@Injectable()
export class OpenapiPatchMetadataExtension implements edk.Extension<void> {
  protected inited: boolean;

  constructor(
    protected moduleManager: edk.ModuleManager,
    @Inject(edk.APP_METADATA_MAP) protected appMetadataMap: edk.AppMetadataMap
  ) {}

  async init() {
    if (this.inited) {
      return;
    }

    this.appMetadataMap.forEach((metadataPerMod) => {
      const { moduleMetadata } = metadataPerMod;
      this.setPrefixParams(moduleMetadata);
    });

    this.inited = true;
  }

  protected setPrefixParams(moduleMetadata: edk.NormalizedModuleMetadata) {
    if (edk.isModuleWithParams(moduleMetadata.module)) {
      const { prefixParams } = moduleMetadata.module as OasModuleWithParams;
      if (prefixParams?.length) {
        let imp: OasModuleWithParams;
        for (imp of moduleMetadata.importsWithParams) {
          imp.prefixParams = this.getUniqParams(prefixParams, imp.prefixParams);
          const meta = this.moduleManager.getMetadata(imp);
          this.setPrefixParams(meta);
        }
      }
    }
  }

  protected getUniqParams(
    parent: (XParameterObject<any> | ReferenceObject)[],
    children: (XParameterObject<any> | ReferenceObject)[]
  ) {
    const parentReferenceObjects: ReferenceObject[] = [];
    const parentParametersObjets: XParameterObject[] = [];
    for (let param of (parent || [])) {
      if (isReferenceObject(param)) {
        parentReferenceObjects.push(param);
      } else {
        if (param[RECURSIVE_PARAM]) {
          param = { ...param };
          --param[RECURSIVE_PARAM];
          parentParametersObjets.push(param);
        }
      }
    }

    const childReferenceObjects: ReferenceObject[] = [];
    const childParametersObjets: XParameterObject[] = [];
    for (const param of (children || [])) {
      if (isReferenceObject(param)) {
        childReferenceObjects.push(param);
      } else {
        childParametersObjets.push(param);
      }
    }

    return [
      ...getLastReferenceObjects([...parentReferenceObjects, ...childReferenceObjects]),
      ...getLastParameterObjects([...parentParametersObjets, ...childParametersObjets]),
    ];
  }
}

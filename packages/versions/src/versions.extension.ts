import { Extension, ExtensionsManager, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { injectable } from '@ditsmod/core';

@injectable()
export class VersionsExtension implements Extension<void> {
  constructor(protected extensionManager: ExtensionsManager) {}

  async init() {
    const aMetadataPerMod2 = await this.extensionManager.init(ROUTES_EXTENSIONS);
    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
      console.log('-'.repeat(50), metadataPerMod2.moduleName);

      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq }) => {
        console.log(providersPerMod, providersPerRou, providersPerReq);
      });
    });
  }
}

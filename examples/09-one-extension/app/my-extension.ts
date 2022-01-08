import { Injectable } from '@ts-stack/di';
import { Extension, ExtensionsManager, Logger, ROUTES_EXTENSIONS } from '@ditsmod/core';

@Injectable()
export class MyExtension implements Extension<void> {
  #inited: boolean;

  constructor(
    private extensionsManager: ExtensionsManager,
    private logger: Logger
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    this.logger.info(aMetadataPerMod2[0]);

    this.#inited = true;
  }
}

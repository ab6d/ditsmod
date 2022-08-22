import { Extension, ExtensionsManager, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { Inject, Injectable, Optional, Type } from '@ts-stack/di';

import { I18nLogMediator } from './i18n-log-mediator';
import { I18nDictionary, I18N_TRANSLATIONS, TranslationGroup, Translation } from './types/mix';

@Injectable()
export class I18nExtension implements Extension<void> {
  #inited: boolean;
  protected i18n: any;

  constructor(
    private log: I18nLogMediator,
    @Optional() @Inject(I18N_TRANSLATIONS) private translations: Translation[] = [],
    private extensionsManager: ExtensionsManager
  ) {}

  async init() {
    if (this.#inited) {
      return;
    }

    const { moduleName } = this.extensionsManager;
    if (moduleName == 'I18nModule') {
      return;
    }

    if (!this.translations.length) {
      this.log.translationNotFound(this, moduleName);
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);
    for (const translation of this.translations) {
      for (const dictionariesGroup of translation.current || []) {
        const token = dictionariesGroup[0]; // First class uses as group's token
        for (const dict of dictionariesGroup) {
          if (token !== dict) {
            this.logMissingMethods(token, dict);
          }
          for (const metadataPerMod2 of aMetadataPerMod2) {
            const { providersPerMod } = metadataPerMod2;
            providersPerMod.push({ provide: token, useClass: dict, multi: true });
          }
        }
      }
      for (const dictionariesGroup of translation.imported || []) {
        const token = dictionariesGroup[0]; // First class uses as group's token
        for (const dict of dictionariesGroup.slice(1)) {
          if (token !== dict) {
            this.logMissingMethods(token, dict);
          }
          for (const metadataPerMod2 of aMetadataPerMod2) {
            const { providersPerMod } = metadataPerMod2;
            providersPerMod.push({ provide: token, useClass: dict, multi: true });
          }
        }
      }
    }

    this.#inited = true;
  }

  protected logMissingMethods(base: Type<I18nDictionary>, extended: Type<I18nDictionary>) {
    const baseMethods = Object.getOwnPropertyNames(base.prototype);
    const overridedMethods = Object.getOwnPropertyNames(extended.prototype);
    const missingMethods: string[] = [];
    baseMethods.forEach((b) => {
      if (!overridedMethods.includes(b)) {
        missingMethods.push(b);
      }
    });
    if (missingMethods.length) {
      this.log.missingMethods(this, extended.name, missingMethods);
    }
  }
}

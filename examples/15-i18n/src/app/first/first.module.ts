import { Module } from '@ditsmod/core';
import { getI18nProviders, I18nModule, I18N_TRANSLATIONS } from '@ditsmod/i18n';

import { current } from './locales/current';
import { FirstService } from './first.service';
import { FirstController } from './first.controller';

@Module({
  imports: [I18nModule],
  controllers: [FirstController],
  providersPerReq: [FirstService],
  providersPerMod: [
    ...getI18nProviders(this, { current, moduleName: 'FirstModule' }, { defaultLng: 'en' })
  ],
  exports: [FirstService, I18N_TRANSLATIONS],
})
export class FirstModule {}

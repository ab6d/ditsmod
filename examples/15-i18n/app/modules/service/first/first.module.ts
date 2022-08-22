import { Module } from '@ditsmod/core';
import { I18nModule, I18nOptions } from '@ditsmod/i18n';

import { currentTranslations } from './locales/current/translations';
import { FirstService } from './first.service';
import { FirstController } from './first.controller';

const i18nOptions: I18nOptions = { defaultLng: 'en' };
const i18nWithParams = I18nModule.withParams({ current: currentTranslations }, i18nOptions);

@Module({
  imports: [i18nWithParams],
  controllers: [FirstController],
  providersPerReq: [FirstService],
  exports: [FirstService, i18nWithParams],
})
export class FirstModule {}

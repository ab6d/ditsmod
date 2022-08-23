import { LoggerConfig, LogMediatorConfig, Module, FilterConfig } from '@ditsmod/core';
import { I18nModule, getI18nProviders } from '@ditsmod/i18n';

import { FirstModule } from '../first/first.module';
import { SecondController } from './second.controller';
import { current } from './locales/current';
import { imported } from './locales/imported';

const loggerConfig = new LoggerConfig('debug');
const filterConfig: FilterConfig = { classesNames: ['I18nExtension'] };

@Module({
  imports: [I18nModule, FirstModule],
  controllers: [SecondController],
  providersPerMod: [
    { provide: LoggerConfig, useValue: loggerConfig },
    { provide: LogMediatorConfig, useValue: { filterConfig } },
    ...getI18nProviders(this, { current, imported, moduleName: 'SecondModule' }, { defaultLng: 'uk' })
  ],
})
export class SecondModule {}

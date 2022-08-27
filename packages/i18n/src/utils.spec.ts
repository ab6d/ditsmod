import { describe, it, fit, xit, expect } from '@jest/globals';
import { I18nProviders } from './utils';
import { Common } from './test/common-en';
import { CommonUk } from './test/common-uk';
import { I18nOptions, I18N_TRANSLATIONS, Translations } from './types/mix';
import { Providers } from '@ditsmod/core';

describe('I18nProviders', () => {
  it('returns arrays with two elements of DI providers', () => {
    let providers: I18nProviders;

    function callback() {
      providers = new I18nProviders();
      providers.i18n({ current: [[Common, CommonUk]] }, { defaultLng: 'uk' });
    }

    expect(callback).not.toThrow();
    const expectedUseValue: Translations = { current: [[Common, CommonUk]] };
    expect([...providers!]).toEqual([
      { provide: I18N_TRANSLATIONS, useValue: expectedUseValue, multi: true },
      { provide: I18nOptions, useValue: { defaultLng: 'uk' }, multi: undefined },
    ]);
  });

  it('works as plugin for Providers', () => {
    let providers: I18nProviders;

    function callback() {
      providers = new Providers().use(I18nProviders);
      providers.i18n({ current: [[Common, CommonUk]] }, { defaultLng: 'uk' });
    }

    expect(callback).not.toThrow();
    const expectedUseValue: Translations = { current: [[Common, CommonUk]] };
    expect([...providers!]).toEqual([
      { provide: I18N_TRANSLATIONS, useValue: expectedUseValue, multi: true },
      { provide: I18nOptions, useValue: { defaultLng: 'uk' }, multi: undefined },
    ]);
  });
});

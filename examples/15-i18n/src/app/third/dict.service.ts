import { Req } from '@ditsmod/core';
import { DictPerModService, I18nLogMediator, I18nOptions, ISO639 } from '@ditsmod/i18n';
import { Injectable, Injector } from '@ts-stack/di';

@Injectable()
export class MyDictService extends DictPerModService {
  constructor(
    protected override injector: Injector,
    protected override i18nOptions: I18nOptions,
    protected override log: I18nLogMediator,
    protected req: Req
  ) {
    super(injector, i18nOptions, log);
  }

  override set lng(lng: ISO639) {
    super.lng = lng;
  }

  override get lng() {
    if (this._lng) {
      return this._lng;
    }
    const lng = this.getHeaderLng() || this.req.queryParams[this.i18nOptions.lngParam || 'lng'];
    return lng || this.i18nOptions.defaultLng;
  }

  protected getHeaderLng(): ISO639 | void {
    const acceptLanguage = this.req.nodeReq.headers['accept-language']; // Here string like: uk,en-US;q=0.9,en;q=0.8
    // ... here your code for parsing acceptLanguage, after that you should returns result
    console.log('works custom DictService');
  }
}
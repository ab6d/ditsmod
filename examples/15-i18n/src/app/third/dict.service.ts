import {
  AnyObj,
  fromSelf,
  inject,
  injectable,
  Injector,
  NodeRequest,
  NODE_REQ,
  optional,
  QUERY_PARAMS,
} from '@ditsmod/core';
import { DictService, I18nLogMediator, I18nOptions, ISO639 } from '@ditsmod/i18n';

@injectable()
export class MyDictService extends DictService {
  constructor(
    protected override injector: Injector,
    protected override log: I18nLogMediator,
    @optional() protected override i18nOptions?: I18nOptions,
    @inject(QUERY_PARAMS) protected override queryParams?: AnyObj,
    @optional() @fromSelf() @inject(NODE_REQ) protected nodeReq?: NodeRequest
  ) {
    super(injector, log, i18nOptions, queryParams);
  }

  override set lng(lng: ISO639) {
    super.lng = lng;
  }

  override get lng() {
    if (this._lng) {
      return this._lng;
    }
    const lng = this.getHeaderLng() || this.queryParams?.[this.i18nOptions?.lngParam || 'lng'];
    return lng || this.i18nOptions?.defaultLng;
  }

  protected getHeaderLng(): ISO639 | void {
    const acceptLanguage = this.nodeReq?.headers['accept-language']; // Here string like: uk,en-US;q=0.9,en;q=0.8
    // ... here your code for parsing acceptLanguage, after that you should returns result
    console.log('works custom DictService');
  }
}

import {
  injectable,
  Injector,
  skipSelf,
  RouteMeta,
  HttpHandler,
  HttpInterceptor,
  Status,
  CustomError,
  NodeRequest,
  NodeResponse,
  inject,
  NODE_REQ,
  NODE_RES,
  fromSelf
} from '@ditsmod/core';
import { XSchemaObject } from '@ts-stack/openapi-spec';
import { DictService } from '@ditsmod/i18n';

import { ValidationRouteMeta } from './types';
import { AssertDict } from './locales/current';
import { AjvService } from './ajv.service';

@injectable()
export class ValidationInterceptor implements HttpInterceptor {
  constructor(
    protected injector: Injector,
    protected ajvService: AjvService,
    @skipSelf() protected routeMeta: RouteMeta,
    @fromSelf() @inject(NODE_REQ) protected nodeReq: NodeRequest,
    @fromSelf() @inject(NODE_RES) protected nodeRes: NodeResponse,
  ) {}

  intercept(next: HttpHandler) {
    this.prepareAndValidate();
    return next.handle();
  }

  protected prepareAndValidate() {}

  protected validate(schema: XSchemaObject, value: any, parameter?: string) {
    const validate = this.ajvService.getValidator(schema);
    if (!validate) {
      const dict = this.getDict();
      throw new CustomError({ msg2: dict.ajvSchemaNotFound, status: Status.INTERNAL_SERVER_ERROR, level: 'error' });
    }
    if (!validate(value)) {
      const msg1 = this.ajvService.ajv.errorsText(validate.errors);
      let args1: any;
      if (parameter) {
        args1 = { parameter };
      } else {
        args1 = validate.errors;
      }
      const validationRouteMeta = this.routeMeta as ValidationRouteMeta;
      throw new CustomError({ msg1, args1, status: validationRouteMeta.options.invalidStatus });
    }
  }

  protected getDict() {
    const dictService: DictService = this.injector.get(DictService);
    return dictService.getDictionary(AssertDict);
  }
}

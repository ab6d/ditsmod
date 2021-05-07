import { Inject, Injectable } from '@ts-stack/di';
import { parse } from 'querystring';

import { ControllerErrorHandler } from '../services/controller-error-handler';
import { HttpFrontend, HttpHandler } from '../types/http-interceptor';
import { Request } from './request';
import { AnyObj } from '../types/mix';
import { PathParam } from '../types/router';
import { PATH_PARAMS, QUERY_STRING } from '../constans';

@Injectable()
export class DefaultHttpFrontend implements HttpFrontend {
  constructor(
    @Inject(PATH_PARAMS) protected pathParamsArr: PathParam[],
    @Inject(QUERY_STRING) protected queryString: any,
    private req: Request
  ) {}

  async intercept(next: HttpHandler) {
    try {
      if (this.queryString) {
        this.req.queryParams = parse(this.queryString);
      }
      if (this.pathParamsArr) {
        this.req.pathParamsArr = this.pathParamsArr;
        const pathParams: AnyObj = this.pathParamsArr?.length ? {} : undefined;
        this.pathParamsArr?.forEach((param) => (pathParams[param.key] = param.value));
        this.req.pathParams = pathParams;
      }
    } catch (err) {
      this.lazyLoadErrorHandler(err);
    }

    await next.handle().catch((err) => {
      this.lazyLoadErrorHandler(err);
    });
  }

  protected lazyLoadErrorHandler(err: any) {
    const errorHandler = this.req.injector.get(ControllerErrorHandler);
    errorHandler.handleError(err);
  }

  protected decodeUrl(url: string) {
    return decodeURI(url);
  }
}

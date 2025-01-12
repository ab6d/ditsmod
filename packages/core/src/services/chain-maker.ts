import { fromSelf, inject, injectable, optional } from '../di';
import { HTTP_INTERCEPTORS } from '../constans';
import {
  HttpFrontend,
  HttpBackend,
  HttpInterceptor,
  HttpInterceptorHandler,
  HttpHandler,
} from '../types/http-interceptor';

/**
 * An injectable `ChainMaker` that ties multiple interceptors in chain.
 */
@injectable()
export class ChainMaker {
  makeChain(
    @fromSelf() frontend: HttpFrontend,
    @fromSelf() backend: HttpBackend,
    @fromSelf() @inject(HTTP_INTERCEPTORS) @optional() interceptors: HttpInterceptor[] = []
  ): HttpHandler {
    return [frontend, ...interceptors].reduceRight(
      (next, interceptor) => new HttpInterceptorHandler(interceptor, next),
      backend
    );
  }
}

import {
  fromSelf,
  inject,
  injectable,
  Injector,
  NodeRequest,
  NodeResponse,
  NODE_REQ,
  NODE_RES,
  Res,
  RouteMeta,
  skipSelf,
} from '@ditsmod/core';
import { HttpBackend, DefaultHttpBackend, Status, HttpMethod } from '@ditsmod/core';

@injectable()
export class ReturnHttpBackend extends DefaultHttpBackend implements HttpBackend {
  constructor(
    @fromSelf() @inject(NODE_REQ) protected nodeReq: NodeRequest,
    @fromSelf() @inject(NODE_RES) protected nodeRes: NodeResponse,
    @skipSelf() protected override routeMeta: RouteMeta,
    protected override injector: Injector,
    protected res: Res
  ) {
    super(injector, routeMeta);
  }

  override async handle() {
    const value = await super.handle(); // Controller's route returned value.
    let { statusCode } = this.nodeRes;
    if (!statusCode) {
      const httpMethod = this.nodeReq.method as HttpMethod;
      if (httpMethod == 'GET') {
        statusCode = Status.OK;
      } else if (httpMethod == 'POST') {
        statusCode = Status.CREATED;
      } else if (httpMethod == 'OPTIONS') {
        statusCode = Status.NO_CONTENT;
      } else {
        statusCode = Status.OK;
      }
    }

    if (typeof value == 'object' || this.nodeRes.getHeader('content-type') == 'application/json') {
      this.res.sendJson(value, statusCode);
    } else {
      this.res.send(value, statusCode);
    }
  }
}

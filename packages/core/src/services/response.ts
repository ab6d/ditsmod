import { format } from 'util';

import { Status } from '../utils/http-status-codes';
import { RedirectStatusCodes } from '../types/mix';
import { fromSelf, inject, injectable } from '../di';
import { NODE_RES } from '../constans';
import { NodeResponse } from '../types/server-options';

@injectable()
export class Res<T = any> {
  constructor(
    /**
     * Native Node.js response.
     */
    @fromSelf() @inject(NODE_RES) private nodeRes: NodeResponse
  ) {}

  /**
   * Setting value to the response header `Content-Type`.
   *
   * @example
   *
   * res.setContentType('application/xml').send({ one: 1, two: 2 });
   */
  setContentType(contentType: string) {
    this.nodeRes.setHeader('Content-Type', contentType);
    return this;
  }

  /**
   * Send data as is, without any transformation.
   */
  send(data?: string | Buffer | Uint8Array, statusCode: Status = Status.OK): void {
    const contentType = this.nodeRes.getHeader('Content-Type');
    if (!contentType) {
      this.setContentType('text/plain; charset=utf-8');
    }
    this.nodeRes.statusCode = statusCode;
    this.nodeRes.end(data || '');
  }

  /**
   * To convert `any` type to `string` type, the `util.format()` function is used here.
   */
  sendText(data?: any, statusCode: Status = Status.OK): void {
    this.send(format(data), statusCode);
  }

  sendJson(data?: T, statusCode: Status = Status.OK): void {
    this.setContentType('application/json; charset=utf-8').send(JSON.stringify(data), statusCode);
  }

  redirect(statusCode: RedirectStatusCodes, path: string) {
    this.nodeRes.writeHead(statusCode, { Location: path });
    this.nodeRes.end();
  }
}

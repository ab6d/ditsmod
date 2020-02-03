import { Injectable } from 'ts-di';

import { NodeResponse, Logger } from '../types/types';
import { Status } from '../http-status-codes';

@Injectable()
export class PreRequest {
  constructor(protected log: Logger) {}

  /**
   * Called by the `ModuleFactory` before call a router.
   *
   * In inherited class you can to use standart `decodeURI(url)` function.
   * See inheritance in the docs.
   */
  decodeUrl(url: string) {
    return decodeURI(url);
  }

  /**
   * Called by the `ModuleFactory` when a route is not found.
   */
  sendNotFound(nodeRes: NodeResponse) {
    nodeRes.statusCode = Status.NOT_FOUND;
    nodeRes.end();
  }

  /**
   * Logs an error and sends the user message about an internal server error.
   *
   * @param err An error to logs it (not sends).
   */
  sendInternalServerError(nodeRes: NodeResponse, err: Error) {
    this.log.error(err);
    nodeRes.statusCode = Status.INTERNAL_SERVER_ERROR;
    nodeRes.end();
  }
}

import { ChainError } from '@ts-stack/chain-error';

import { ErrorOpts } from './error-opts';

export class CustomError extends ChainError {
  constructor(info: ErrorOpts, cause?: Error) {
    // Merge with default options
    info = new ErrorOpts(info);

    super(`${info.msg1}`, { info, cause }, true);
  }
}

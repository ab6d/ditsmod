import { Injectable } from '@ts-stack/di';
import { Logger, LoggerConfig } from '@ditsmod/core';
import winston = require('winston');

import { setCustomLogger } from '../../utils/set-custom-logger';

@Injectable()
export class WinstonService extends Logger {
  constructor(config: LoggerConfig) {
    super();
    this.init(config);
  }

  protected init(config: LoggerConfig) {
    const logger: Logger = this.createCustomLogger(config);
    setCustomLogger(config, this, logger);
  }

  protected createCustomLogger(config: LoggerConfig) {
    const transports = [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
    ];

    const customLevels = {
      levels: {
        fatal: 1,
        error: 2,
        warn: 3,
        info: 4,
        debug: 5,
        trace: 6,
      },
      colors: {
        fatal: 'red',
        error: 'yellow',
        debug: 'green',
        info: 'blue',
        trace: 'grey',
      },
    };

    winston.addColors(customLevels.colors);

    return winston.createLogger({
      levels: customLevels.levels,
      level: config.level,
      transports,
    }) as any;
  }
}

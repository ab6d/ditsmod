import 'reflect-metadata';
import { describe, beforeEach, it, expect, jest, afterEach } from '@jest/globals';
import { ReflectiveInjector } from '@ts-stack/di';

import { ErrorOpts } from '../custom-error/error-opts';
import { DefaultControllerErrorHandler as ErrorHandler } from './default-controller-error-handler';
import { Req } from './request';
import { Res } from './response';
import { Logger } from '../types/logger';
import { Status } from '../utils/http-status-codes';
import { CustomError } from '../custom-error/custom-error';

describe('ErrorHandler', () => {
  type ErrorLog = ErrorOpts & { err?: any };
  let errorHandler: ErrorHandler;

  const req = {
    requestId: '',
    toString() {
      return '';
    },
  } as Req;

  const res = {
    nodeRes: {
      headersSent: false,
      hasHeader(...args: any[]) {},
      setHeader(...args: any[]) {},
    },
    sendJson(...args: any[]) {},
  } as Res;

  const logger = {
    log(...args: any[]) {},
    error(...args: any[]) {},
  } as Logger;

  beforeEach(() => {
    const injector = ReflectiveInjector.resolveAndCreate([
      { provide: Req, useValue: req },
      { provide: Res, useValue: res },
      { provide: Logger, useValue: logger },
      ErrorHandler,
    ]);

    errorHandler = injector.get(ErrorHandler);

    jest.spyOn(res, 'sendJson');
    jest.spyOn(logger, 'log');
    jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('default error with some message', () => {
    const err = new Error('one');
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'Internal server error' }, Status.INTERNAL_SERVER_ERROR);
    expect(res.sendJson).toBeCalledTimes(1);
    const log: ErrorLog = { err: expect.anything() };
    expect(logger.error).toBeCalledWith(expect.objectContaining(log as any));
    expect(logger.error).toBeCalledTimes(1);
    expect(logger.log).toBeCalledTimes(0);
  });

  it('custom error with msg1', () => {
    const msg1 = 'one';
    const err = new CustomError({ msg1 });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'one' }, Status.BAD_REQUEST);
    expect(res.sendJson).toBeCalledTimes(1);
    const log: ErrorLog = { msg1: 'one', msg2: '', status: Status.BAD_REQUEST, err: expect.anything() };
    expect(logger.log).toBeCalledWith('debug', expect.objectContaining(log as any));
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });

  it('custom error with status and level changed', () => {
    const msg1 = 'one';
    const err = new CustomError({ msg1, status: Status.CONFLICT, level: 'fatal' });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'one' }, Status.CONFLICT);
    expect(res.sendJson).toBeCalledTimes(1);
    const log: ErrorLog = { msg1: 'one', msg2: '', status: Status.CONFLICT, err: expect.anything() };
    expect(logger.log).toBeCalledWith('fatal', expect.objectContaining(log as any));
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });

  it('custom error with msg1 and arguments for format', () => {
    const msg1 = 'one two';
    const err = new CustomError({ msg1 });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'one two' }, Status.BAD_REQUEST);
    expect(res.sendJson).toBeCalledTimes(1);
    const log: ErrorLog = { msg1, msg2: '', status: Status.BAD_REQUEST, err: expect.anything() };
    expect(logger.log).toBeCalledWith('debug', expect.objectContaining(log as any));
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });

  it('custom error with msg2', () => {
    const msg2 = 'one';
    const err = new CustomError({ msg2 });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'Internal server error' }, Status.BAD_REQUEST);
    expect(res.sendJson).toBeCalledTimes(1);
    const log: ErrorLog = { msg1: 'Internal server error', msg2, status: Status.BAD_REQUEST, err: expect.anything() };
    expect(logger.log).toBeCalledWith('debug', expect.objectContaining(log as any));
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });

  it('custom error with msg2 and arguments for format', () => {
    const msg2 = 'one %s three';
    const err = new CustomError({ msg2 });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'Internal server error' }, Status.BAD_REQUEST);
    expect(res.sendJson).toBeCalledTimes(1);
    const log: ErrorLog = {
      msg1: 'Internal server error',
      msg2,
      status: Status.BAD_REQUEST,
      err: expect.anything(),
    };
    expect(logger.log).toBeCalledWith('debug', expect.objectContaining(log as any));
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });

  it('custom error with msg1, msg2 and arguments for format', () => {
    const msg1 = 'one two';
    const msg2 = 'four six';
    const err = new CustomError({ msg1, msg2 });
    expect(() => errorHandler.handleError(err)).not.toThrow();
    expect(res.sendJson).toBeCalledWith({ error: 'one two' }, Status.BAD_REQUEST);
    expect(res.sendJson).toBeCalledTimes(1);
    const log: ErrorLog = { msg1, msg2, status: Status.BAD_REQUEST, err: expect.anything() };
    expect(logger.log).toBeCalledWith('debug', expect.objectContaining(log as any));
    expect(logger.log).toBeCalledTimes(1);
    expect(logger.error).toBeCalledTimes(0);
  });
});
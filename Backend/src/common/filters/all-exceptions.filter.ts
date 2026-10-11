import {
  Catch,
  HttpStatus,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import { Logger } from 'nestjs-pino';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ??
            exception.message);
    }

    if (status >= 500) {
      this.logger.error(
        exception,
        `Unhandled exception on ${req.method} ${req.url}`,
      );
    }

    res.status(status).json({
      statusCode: status,
      message,
      error: STATUS_CODES[status] ?? 'Error',
      requestId: req.id,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}

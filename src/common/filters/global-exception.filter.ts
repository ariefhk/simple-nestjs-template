import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { RequestWithContext } from '../interfaces/request-with-context.interface';

// logging uncaught / unhandled exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();

    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorMessage =
      exception instanceof Error ? exception.message : String(exception);

    const responseLog = {
      pipeline: 'error',
      method: request.method,
      requestBody: request.originalUrl.includes('/auth')
        ? '-'
        : (request.body as unknown),

      statusCode,
      errorBody: errorMessage,
      responseTime: Date.now() - (request.timeStart ?? Date.now()),

      url: request.path,
      path: request.originalUrl,
      userAgent: request.get('user-agent') || '',
      ip: request.ip,
      user: request.userSession?.email || 'no login',
      userId: request.userSession?.userId || 'no login',
    };

    const isServerError = statusCode >= 500;

    if (isServerError) {
      this.logger.error(responseLog);
      console.error(exception);
    } else {
      this.logger.warn(responseLog);
    }

    response.status(statusCode).json({
      statusCode,
      method: request.method,
      path: request.url,
      data: message,
    });
  }
}

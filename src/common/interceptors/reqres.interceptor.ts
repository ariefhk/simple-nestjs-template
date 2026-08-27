import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Response as ExpressResponse } from 'express';

import { RequestWithContext } from '../interfaces/request-with-context.interface';
import { SILENCED_PATHS } from './constants/reqres.constants';
import { Response } from './interfaces/response.interface';

@Injectable()
export class ReqResInterceptor<T> implements NestInterceptor<T, Response<T>> {
  private logger = new Logger('REQ-RES');

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const response = context.switchToHttp().getResponse<ExpressResponse>();
    const request = context.switchToHttp().getRequest<RequestWithContext>();

    request.timeStart = Date.now();

    const isSilenced = SILENCED_PATHS.some((path) =>
      request.originalUrl.includes(path),
    );

    const requestLog = {
      pipeline: 'request',
      method: request.method,
      requestBody: isSilenced ? '-' : (request.body as unknown),

      path: request.path,
      url: request.originalUrl,
      userAgent: request.get('user-agent') || '',
      ip: request.ip,
      user: request.userSession?.email || 'no login',
      userId: request.userSession?.userId || 'no login',
    };

    this.logger.log(requestLog);

    return next.handle().pipe(
      map((data: T) => {
        const responseLog = {
          pipeline: 'response',
          method: request.method,
          requestBody: isSilenced ? '-' : (request.body as unknown),

          statusCode: response.statusCode,
          responseBody: isSilenced ? '-' : data,
          responseTime: Date.now() - (request.timeStart ?? Date.now()),

          path: request.path,
          url: request.originalUrl,
          userAgent: request.get('user-agent') || '',
          ip: request.ip,
          user: request.userSession?.email || 'no login',
          userId: request.userSession?.userId || 'no login',
        };

        this.logger.log(responseLog);

        return {
          statusCode: response.statusCode,
          method: request.method,
          path: request.url,
          data: data,
        };
      }),
    );
  }
}

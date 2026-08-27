import { INestApplication } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export function getCorsOptions(app: INestApplication): CorsOptions {
  const origin = app.get(ConfigService).get<string>('corsOrigin', '*');

  return {
    origin: origin === '*' ? '*' : origin.split(','),
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: '*',
    exposedHeaders: '*',
  };
}

export function setupCors(app: INestApplication): void {
  app.enableCors(getCorsOptions(app));
}

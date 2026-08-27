import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function setupGlobalPrefix(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('apiPrefix', 'v1');

  app.setGlobalPrefix(apiPrefix);
}

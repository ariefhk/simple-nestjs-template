import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export function setupHelmet(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('nodeEnv') === 'production';

  app.use(
    helmet({
      hsts: isProduction,
      contentSecurityPolicy: isProduction,
    }),
  );
}

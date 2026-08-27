import { mkdirSync } from 'fs';
import { join } from 'path';

import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';

export const setupStaticAssets = (app: NestExpressApplication): void => {
  const configService = app.get(ConfigService);

  if (configService.get<string>('storageDriver') !== 'local') {
    return;
  }

  const localDir = configService.get<string>('storageLocalDir', 'storage');
  const prefix = configService.get<string>('storageLocalPrefix', '/storage');
  const rootPath = join(process.cwd(), localDir);

  mkdirSync(rootPath, { recursive: true });

  app.useStaticAssets(rootPath, { prefix });
};

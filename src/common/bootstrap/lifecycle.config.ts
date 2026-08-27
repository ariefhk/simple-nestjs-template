import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const setupShutdownHooks = (app: INestApplication): void => {
  app.enableShutdownHooks();
};

export const startServer = async (app: INestApplication): Promise<void> => {
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Application is running at http://localhost:${port}`);
};

import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { setupGlobalFilters } from '../../src/common/filters/filters.config';
import { setupGlobalInterceptors } from '../../src/common/interceptors/interceptors.config';
import { setupCors } from '../../src/common/middlewares/cors.config';
import { setupGlobalPrefix } from '../../src/common/middlewares/global-prefix.config';
import { setupHelmet } from '../../src/common/middlewares/helmet.config';
import { setupStaticAssets } from '../../src/common/middlewares/static-assets.config';
import { setupGlobalPipes } from '../../src/common/pipes/global-pipe.config';
import { setupSwagger } from '../../src/common/swagger/swagger.config';

/**
 * Builds a fully-initialized app, applying the same global setup as
 * main.ts's bootstrap() — minus setupLogger (avoids writing log files
 * during tests and the raw APP_NAME/LOG_PATH env vars it requires) and
 * minus setupShutdownHooks/startServer (e2e tests hit the app in-process
 * via supertest, they never bind a real port).
 */
export async function createTestApp(): Promise<NestExpressApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();

  setupGlobalPrefix(app);
  setupHelmet(app);
  setupCors(app);
  setupStaticAssets(app);
  setupGlobalPipes(app);
  setupGlobalInterceptors(app);
  setupGlobalFilters(app);
  setupSwagger(app);

  await app.init();

  return app;
}

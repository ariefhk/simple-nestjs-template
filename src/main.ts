import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import {
  setupShutdownHooks,
  startServer,
} from './common/bootstrap/lifecycle.config';
import { setupGlobalFilters } from './common/filters/filters.config';
import { setupGlobalInterceptors } from './common/interceptors/interceptors.config';
import { setupLogger } from './common/logger/winston.config';
import { setupCors } from './common/middlewares/cors.config';
import { setupGlobalPrefix } from './common/middlewares/global-prefix.config';
import { setupHelmet } from './common/middlewares/helmet.config';
import { setupStaticAssets } from './common/middlewares/static-assets.config';
import { setupGlobalPipes } from './common/pipes/validation.config';
import { setupSwagger } from './common/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  // Global prefix
  setupGlobalPrefix(app);

  // Logger (first, so all subsequent bootstrap logs go through it)
  setupLogger(app);

  // Middleware
  setupHelmet(app);
  setupCors(app);

  // Static assets (local file uploads, when STORAGE_DRIVER=local)
  setupStaticAssets(app);

  // Pipes
  setupGlobalPipes(app);

  // Interceptors
  setupGlobalInterceptors(app);

  // Exception Filter
  setupGlobalFilters(app);

  // Swagger
  setupSwagger(app);

  // Shutdown hooks (process lifecycle, right before the app starts listening)
  setupShutdownHooks(app);

  // Start
  await startServer(app);
}
void bootstrap().catch((error) => {
  console.error('Failed to start application', error);
  process.exit(1);
});

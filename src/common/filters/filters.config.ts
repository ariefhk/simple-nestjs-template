import { INestApplication } from '@nestjs/common';

import { GlobalExceptionFilter } from './global-exception.filter';

export const setupGlobalFilters = (app: INestApplication): void => {
  app.useGlobalFilters(new GlobalExceptionFilter());
};

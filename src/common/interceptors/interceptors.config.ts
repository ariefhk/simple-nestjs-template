import { INestApplication } from '@nestjs/common';

import { ReqResInterceptor } from './reqres.interceptor';

export const setupGlobalInterceptors = (app: INestApplication): void => {
  app.useGlobalInterceptors(new ReqResInterceptor());
};

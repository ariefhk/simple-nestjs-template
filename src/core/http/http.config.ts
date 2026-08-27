import { HttpModuleOptions } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

export const httpConfig = (configService: ConfigService): HttpModuleOptions => {
  const timeout = configService.get<number>('httpTimeout');
  const maxRedirects = configService.get<number>('httpMaxRedirects');
  return {
    timeout,
    maxRedirects,
  };
};

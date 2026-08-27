import { HttpModuleOptions } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

export const httpConfig = (
  configService: ConfigService,
): HttpModuleOptions => ({
  timeout: configService.get<number>('httpTimeout'),
  maxRedirects: configService.get<number>('httpMaxRedirects'),
});

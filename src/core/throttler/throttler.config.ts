import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig = (
  configService: ConfigService,
): ThrottlerModuleOptions => {
  const ttl = configService.get<number>('throttleTtl') ?? 60000;
  const limit = configService.get<number>('throttleLimit') ?? 100;

  return {
    throttlers: [
      {
        ttl,
        limit,
      },
    ],
  };
};

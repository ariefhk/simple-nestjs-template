import { createKeyv } from '@keyv/redis';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

export const cacheConfig = (
  configService: ConfigService,
): CacheModuleOptions => {
  const redisUrl = configService.get<string>('redisUrl');
  const ttl = configService.get<number>('cacheTtl');
  const stores = redisUrl ? [createKeyv(redisUrl)] : undefined;

  return {
    ttl,
    stores,
  };
};

import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { cacheConfig } from './cache/cache.config';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { httpConfig } from './http/http.config';
import { throttlerConfig } from './throttler/throttler.config';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      global: true,
      useFactory: httpConfig,
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: cacheConfig,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: throttlerConfig,
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class CoreModule {}

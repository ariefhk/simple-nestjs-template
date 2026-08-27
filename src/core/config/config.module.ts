import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envConfig, getEnvFilePath } from './config.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFilePath(),
      load: [envConfig],
    }),
  ],
})
export class ConfigModule {}

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { multerConfig } from '../../core/multer/multer.config';
import { LocalStorageDriver } from './drivers/local-storage.driver';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: multerConfig,
      inject: [ConfigService],
    }),
  ],
  controllers: [StorageController],
  providers: [StorageService, LocalStorageDriver],
})
export class StorageModule {}

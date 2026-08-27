import { Module } from '@nestjs/common';

import { CoreModule } from './core/core.module';
import { CatModule } from './modules/cat/cat.module';
import { StorageModule } from './modules/storage/storage.module';

// Core Module
const coreModules = [CoreModule];

// Domain Module
const domainModules = [CatModule, StorageModule];

@Module({
  imports: [...coreModules, ...domainModules],
  controllers: [],
  providers: [],
})
export class AppModule {}

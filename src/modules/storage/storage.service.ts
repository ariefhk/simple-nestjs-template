import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LocalStorageDriver } from './drivers/local-storage.driver';
import {
  StorageDriver,
  StoredFile,
} from './interfaces/storage-driver.interface';

@Injectable()
export class StorageService {
  private readonly driver: StorageDriver;

  constructor(
    configService: ConfigService,
    localStorageDriver: LocalStorageDriver,
  ) {
    const storageDriver = configService.get<string>('storageDriver', 'local');

    if (storageDriver !== 'local') {
      throw new Error(
        `Unsupported STORAGE_DRIVER "${storageDriver}": only "local" is currently implemented`,
      );
    }

    this.driver = localStorageDriver;
  }

  upload(file: Express.Multer.File): Promise<StoredFile> {
    return this.driver.upload(file);
  }

  delete(key: string): Promise<void> {
    return this.driver.delete(key);
  }
}

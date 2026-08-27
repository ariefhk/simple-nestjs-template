import { unlink } from 'fs/promises';
import { basename, join } from 'path';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  StorageDriver,
  StoredFile,
} from '../interfaces/storage-driver.interface';

@Injectable()
export class LocalStorageDriver implements StorageDriver {
  constructor(private readonly configService: ConfigService) {}

  upload(file: Express.Multer.File): Promise<StoredFile> {
    return Promise.resolve({
      key: file.filename,
      url: this.getUrl(file.filename),
      size: file.size,
      mimetype: file.mimetype,
      originalName: file.originalname,
    });
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolvePath(key);

    try {
      await unlink(filePath);
    } catch {
      throw new NotFoundException(`File "${key}" not found`);
    }
  }

  getUrl(key: string): string {
    const baseUrl = this.configService.get<string>('storageLocalBaseUrl', '');
    return `${baseUrl}/${key}`;
  }

  private resolvePath(key: string): string {
    const safeKey = basename(key);

    if (safeKey !== key) {
      throw new BadRequestException('Invalid file key');
    }

    const rootDir = this.configService.get<string>(
      'storageLocalDir',
      'storage',
    );

    return join(process.cwd(), rootDir, safeKey);
  }
}

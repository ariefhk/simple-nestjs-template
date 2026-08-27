import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';

import { LocalStorageDriver } from './drivers/local-storage.driver';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const buildFile = (): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'cat.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1234,
    stream: new Readable(),
    destination: 'storage',
    filename: 'generated-key.png',
    path: 'storage/generated-key.png',
    buffer: Buffer.from(''),
  });

  const buildModule = async (storageDriver: string) => {
    const driver = {
      upload: jest.fn(),
      delete: jest.fn(),
      getUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: LocalStorageDriver, useValue: driver },
        {
          provide: ConfigService,
          useValue: { get: () => storageDriver },
        },
      ],
    }).compile();

    return { service: module.get(StorageService), driver };
  };

  it('delegates upload/delete to LocalStorageDriver when STORAGE_DRIVER=local', async () => {
    const { service, driver } = await buildModule('local');
    const file = buildFile();

    await service.upload(file);
    expect(driver.upload).toHaveBeenCalledWith(file);

    await service.delete('foo.png');
    expect(driver.delete).toHaveBeenCalledWith('foo.png');
  });

  it('throws when STORAGE_DRIVER is not "local"', async () => {
    await expect(buildModule('s3')).rejects.toThrow(
      'Unsupported STORAGE_DRIVER "s3": only "local" is currently implemented',
    );
  });
});

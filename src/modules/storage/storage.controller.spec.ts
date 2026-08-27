import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';

import { StoredFile } from './interfaces/storage-driver.interface';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

describe('StorageController', () => {
  let controller: StorageController;
  let storageService: Partial<Record<keyof StorageService, jest.Mock>>;

  const storedFile: StoredFile = {
    key: 'foo.png',
    url: 'http://localhost:3000/storage/foo.png',
    size: 1234,
    mimetype: 'image/png',
    originalName: 'cat.png',
  };

  const file: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'cat.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1234,
    stream: new Readable(),
    destination: 'storage',
    filename: 'foo.png',
    path: 'storage/foo.png',
    buffer: Buffer.from(''),
  };

  beforeEach(async () => {
    storageService = {
      upload: jest.fn().mockResolvedValue(storedFile),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [{ provide: StorageService, useValue: storageService }],
    }).compile();

    controller = module.get(StorageController);
  });

  it('upload() delegates to StorageService.upload', async () => {
    await expect(controller.upload(file)).resolves.toEqual(storedFile);
    expect(storageService.upload).toHaveBeenCalledWith(file);
  });

  it('remove() delegates to StorageService.delete', async () => {
    await controller.remove('foo.png');
    expect(storageService.delete).toHaveBeenCalledWith('foo.png');
  });
});

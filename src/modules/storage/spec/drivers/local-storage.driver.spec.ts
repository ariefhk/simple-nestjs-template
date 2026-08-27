import { unlink } from 'fs/promises';
import { join } from 'path';
import { Readable } from 'stream';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { LocalStorageDriver } from '../../drivers/local-storage.driver';

jest.mock('fs/promises', () => ({ unlink: jest.fn() }));

const mockedUnlink = unlink as jest.Mock;

describe('LocalStorageDriver', () => {
  let driver: LocalStorageDriver;

  const config: Record<string, string> = {
    storageLocalDir: 'storage',
    storageLocalBaseUrl: 'http://localhost:3000/storage',
  };

  beforeEach(async () => {
    mockedUnlink.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStorageDriver,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: string) =>
              config[key] ?? defaultValue,
          },
        },
      ],
    }).compile();

    driver = module.get(LocalStorageDriver);
  });

  const buildFile = (
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File => ({
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
    ...overrides,
  });

  describe('upload', () => {
    it('resolves the stored file metadata from the multer file', async () => {
      const file = buildFile();

      await expect(driver.upload(file)).resolves.toEqual({
        key: 'generated-key.png',
        url: 'http://localhost:3000/storage/generated-key.png',
        size: 1234,
        mimetype: 'image/png',
        originalName: 'cat.png',
      });
    });
  });

  describe('getUrl', () => {
    it('joins the base url and key', () => {
      expect(driver.getUrl('foo.png')).toBe(
        'http://localhost:3000/storage/foo.png',
      );
    });
  });

  describe('delete', () => {
    it('unlinks the file at the resolved path', async () => {
      mockedUnlink.mockResolvedValue(undefined);

      await driver.delete('foo.png');

      expect(mockedUnlink).toHaveBeenCalledWith(
        join(process.cwd(), 'storage', 'foo.png'),
      );
    });

    it('throws NotFoundException when the file does not exist', async () => {
      mockedUnlink.mockRejectedValue(new Error('ENOENT'));

      await expect(driver.delete('missing.png')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException on a path-traversal key', async () => {
      await expect(driver.delete('../../etc/passwd')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockedUnlink).not.toHaveBeenCalled();
    });
  });
});

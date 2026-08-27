import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CATS_CACHE_KEY } from './constants/cat.constants';
import { CatService } from './cat.service';

describe('CatService', () => {
  let service: CatService;
  let cacheManager: { del: jest.Mock };

  beforeEach(async () => {
    cacheManager = { del: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get(CatService);
  });

  describe('create', () => {
    it('creates a cat with a generated id and invalidates the list cache', () => {
      const cat = service.create({ name: 'Tom', age: 3, breed: 'Tabby' });

      expect(cat).toMatchObject({ name: 'Tom', age: 3, breed: 'Tabby' });
      expect(cat.id).toEqual(expect.any(String));
      expect(cacheManager.del).toHaveBeenCalledWith(CATS_CACHE_KEY);
    });
  });

  describe('findAll', () => {
    it('returns an empty array when no cats exist', () => {
      expect(service.findAll()).toEqual([]);
    });

    it('returns every created cat', () => {
      const cat = service.create({ name: 'Tom', age: 3, breed: 'Tabby' });

      expect(service.findAll()).toEqual([cat]);
    });
  });

  describe('findOne', () => {
    it('returns the matching cat', () => {
      const cat = service.create({ name: 'Tom', age: 3, breed: 'Tabby' });

      expect(service.findOne(cat.id)).toEqual(cat);
    });

    it('throws NotFoundException when the id does not exist', () => {
      expect(() => service.findOne('missing-id')).toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('merges the dto into the existing cat and invalidates the cache', () => {
      const cat = service.create({ name: 'Tom', age: 3, breed: 'Tabby' });
      cacheManager.del.mockClear();

      const updated = service.update(cat.id, { age: 4 });

      expect(updated).toEqual({ ...cat, age: 4 });
      expect(cacheManager.del).toHaveBeenCalledWith(CATS_CACHE_KEY);
    });

    it('throws NotFoundException when the id does not exist', () => {
      expect(() => service.update('missing-id', { age: 4 })).toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes the cat and invalidates the cache', () => {
      const cat = service.create({ name: 'Tom', age: 3, breed: 'Tabby' });
      cacheManager.del.mockClear();

      service.remove(cat.id);

      expect(service.findAll()).toEqual([]);
      expect(cacheManager.del).toHaveBeenCalledWith(CATS_CACHE_KEY);
    });

    it('throws NotFoundException when the id does not exist', () => {
      expect(() => service.remove('missing-id')).toThrow(NotFoundException);
    });
  });
});

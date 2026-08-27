import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';

import { CatFactService } from '../cat-fact.service';
import { CatController } from '../cat.controller';
import { CatService } from '../cat.service';
import { Cat } from '../entities/cat.entity';

describe('CatController', () => {
  let controller: CatController;
  let catService: Partial<Record<keyof CatService, jest.Mock>>;
  let catFactService: Partial<Record<keyof CatFactService, jest.Mock>>;

  const cat: Cat = { id: '1', name: 'Tom', age: 3, breed: 'Tabby' };

  beforeEach(async () => {
    catService = {
      create: jest.fn().mockReturnValue(cat),
      findAll: jest.fn().mockReturnValue([cat]),
      findOne: jest.fn().mockReturnValue(cat),
      update: jest.fn().mockReturnValue({ ...cat, age: 4 }),
      remove: jest.fn(),
    };
    catFactService = {
      getRandomFact: jest
        .fn()
        .mockResolvedValue({ fact: 'Cats are cool.', length: 15 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatController],
      providers: [
        { provide: CatService, useValue: catService },
        { provide: CatFactService, useValue: catFactService },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(CatController);
  });

  it('create() delegates to CatService.create', () => {
    const dto = { name: 'Tom', age: 3, breed: 'Tabby' };

    expect(controller.create(dto)).toEqual(cat);
    expect(catService.create).toHaveBeenCalledWith(dto);
  });

  it('findAll() delegates to CatService.findAll', () => {
    expect(controller.findAll()).toEqual([cat]);
    expect(catService.findAll).toHaveBeenCalled();
  });

  it('getFact() delegates to CatFactService.getRandomFact', async () => {
    await expect(controller.getFact()).resolves.toEqual({
      fact: 'Cats are cool.',
      length: 15,
    });
    expect(catFactService.getRandomFact).toHaveBeenCalled();
  });

  it('findOne() delegates to CatService.findOne', () => {
    expect(controller.findOne('1')).toEqual(cat);
    expect(catService.findOne).toHaveBeenCalledWith('1');
  });

  it('update() delegates to CatService.update', () => {
    expect(controller.update('1', { age: 4 })).toEqual({ ...cat, age: 4 });
    expect(catService.update).toHaveBeenCalledWith('1', { age: 4 });
  });

  it('remove() delegates to CatService.remove', () => {
    controller.remove('1');
    expect(catService.remove).toHaveBeenCalledWith('1');
  });
});

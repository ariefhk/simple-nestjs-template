import { randomUUID } from 'crypto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';

import { CATS_CACHE_KEY } from './constants/cat.constants';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { Cat } from './entities/cat.entity';

@Injectable()
export class CatService {
  private readonly cats: Cat[] = [];

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  create(dto: CreateCatDto): Cat {
    const cat: Cat = { id: randomUUID(), ...dto };
    this.cats.push(cat);
    void this.invalidateListCache();
    return cat;
  }

  findAll(): Cat[] {
    return this.cats;
  }

  findOne(id: string): Cat {
    const cat = this.cats.find((c) => c.id === id);

    if (!cat) {
      throw new NotFoundException(`Cat with id ${id} not found`);
    }

    return cat;
  }

  update(id: string, dto: UpdateCatDto): Cat {
    const cat = this.findOne(id);
    Object.assign(cat, dto);
    void this.invalidateListCache();
    return cat;
  }

  remove(id: string): void {
    const index = this.cats.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new NotFoundException(`Cat with id ${id} not found`);
    }

    this.cats.splice(index, 1);
    void this.invalidateListCache();
  }

  private invalidateListCache(): Promise<boolean> {
    return this.cacheManager.del(CATS_CACHE_KEY);
  }
}

import { Module } from '@nestjs/common';

import { CatFactService } from './cat-fact.service';
import { CatController } from './cat.controller';
import { CatService } from './cat.service';

@Module({
  controllers: [CatController],
  providers: [CatService, CatFactService],
})
export class CatModule {}

import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CatFactService } from './cat-fact.service';
import { CatService } from './cat.service';
import { CATS_CACHE_KEY } from './constants/cat.constants';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { CatFact } from './interfaces/cat-fact.interface';
import { Cat } from './entities/cat.entity';

@ApiTags('Cats')
@Controller('cats')
export class CatController {
  constructor(
    private readonly catService: CatService,
    private readonly catFactService: CatFactService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a cat' })
  @ApiOkResponse({ type: Cat })
  create(@Body() dto: CreateCatDto): Cat {
    return this.catService.create(dto);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey(CATS_CACHE_KEY)
  @CacheTTL(30000)
  @ApiOperation({ summary: 'List all cats (cached)' })
  @ApiOkResponse({ type: Cat, isArray: true })
  findAll(): Cat[] {
    return this.catService.findAll();
  }

  @Get('fact')
  @Throttle({ default: { limit: 3, ttl: 10000 } })
  @ApiOperation({ summary: 'Fetch a random cat fact from an external API' })
  @ApiOkResponse({
    schema: {
      example: { fact: 'Cats sleep 70% of their lives.', length: 30 },
    },
  })
  getFact(): Promise<CatFact> {
    return this.catFactService.getRandomFact();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cat by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: Cat })
  findOne(@Param('id') id: string): Cat {
    return this.catService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cat' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: Cat })
  update(@Param('id') id: string, @Body() dto: UpdateCatDto): Cat {
    return this.catService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a cat' })
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string): void {
    this.catService.remove(id);
  }
}

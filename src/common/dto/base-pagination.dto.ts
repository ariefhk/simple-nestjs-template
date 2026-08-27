import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum SortDir {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class BasePaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search: string = '';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  limit: number = 20;

  @ApiProperty({ required: false, enum: SortDir })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(SortDir)
  sortDir: SortDir = SortDir.ASC;
}

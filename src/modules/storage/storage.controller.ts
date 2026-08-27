import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { StoredFile } from './interfaces/storage-driver.interface';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({
    schema: {
      example: {
        key: '3c2c9c2e-1b1a-4b8b-9c2a-1a2b3c4d5e6f.png',
        url: 'http://localhost:3000/storage/3c2c9c2e-1b1a-4b8b-9c2a-1a2b3c4d5e6f.png',
        size: 12345,
        mimetype: 'image/png',
        originalName: 'cat.png',
      },
    },
  })
  upload(@UploadedFile() file: Express.Multer.File): Promise<StoredFile> {
    return this.storageService.upload(file);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a stored file' })
  @ApiParam({ name: 'key', type: String })
  remove(@Param('key') key: string): Promise<void> {
    return this.storageService.delete(key);
  }
}

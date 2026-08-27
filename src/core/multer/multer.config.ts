import { randomUUID } from 'crypto';
import { extname } from 'path';

import { ConfigService } from '@nestjs/config';
import { MulterModuleOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

export const multerConfig = (
  configService: ConfigService,
): MulterModuleOptions => {
  const dest = configService.get<string>('storageLocalDir', 'storage');
  const fileSize = configService.get<number>('storageMaxFileSize');

  return {
    storage: diskStorage({
      destination: dest,
      filename: (_req, file, callback) => {
        callback(null, `${randomUUID()}${extname(file.originalname)}`);
      },
    }),
    limits: {
      fileSize,
    },
  };
};

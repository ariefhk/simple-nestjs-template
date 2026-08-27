import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import winstonDaily = require('winston-daily-rotate-file');

const createAppLogger = (appName: string, logPath: string, level: string) => {
  return winston.createLogger({
    level,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          nestWinstonModuleUtilities.format.nestLike(appName, {
            processId: true,
            colors: true,
            prettyPrint: true,
            appName: true,
          }),
        ),
      }),
      new winston.transports.File({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        filename: `${logPath}/app.log`,
      }),
      new winstonDaily({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        datePattern: 'YYYY-MM-DD',
        dirname: `${logPath}/per-date/`,
        filename: `%DATE%.log`,
        maxFiles: 30, // 30 Days saved
        handleExceptions: true,
      }),
    ],
  });
};

export function setupLogger(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('nodeEnv') === 'production';

  app.useLogger(
    WinstonModule.createLogger({
      instance: createAppLogger(
        configService.getOrThrow('APP_NAME'),
        configService.getOrThrow('LOG_PATH'),
        isProduction ? 'info' : 'debug',
      ),
    }),
  );
}

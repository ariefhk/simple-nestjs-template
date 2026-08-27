import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: INestApplication): void => {
  const configService = app.get(ConfigService);

  if (configService.get<string>('nodeEnv') === 'production') {
    return;
  }

  const swaggerPath = configService.get<string>('swaggerPath', 'docs');

  const config = new DocumentBuilder()
    .setTitle('Simple Nestjs Template')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPath, app, document);
};

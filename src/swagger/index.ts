import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  SWAGGER_API_ROOT,
  SWAGGER_API_NAME,
  SWAGGER_API_DESCRIPTION,
  SWAGGER_API_CURRENT_VERSION,
} from './constants';
import expressBasicAuth from 'express-basic-auth';
import { ConfigService } from '@nestjs/config';

export const setupSwagger = (
  app: INestApplication,
  configService: ConfigService,
): void => {
  const documentBuilder = new DocumentBuilder()
    .setTitle(SWAGGER_API_NAME)
    .setDescription(SWAGGER_API_DESCRIPTION)
    .setVersion(SWAGGER_API_CURRENT_VERSION)
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .addServer(configService.get('HTTP_DOMAIN'));

  app.use(
    ['/docs'],
    expressBasicAuth({
      challenge: true,
      users: {
        [configService.get('SWAGGER_USERNAME')]: configService.get(
          'SWAGGER_USER_PASSWORD',
        ),
      },
    }),
  );

  const document = SwaggerModule.createDocument(app, documentBuilder.build());

  SwaggerModule.setup(SWAGGER_API_ROOT, app, document);
};

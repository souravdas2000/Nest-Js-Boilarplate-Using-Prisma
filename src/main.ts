import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    bufferLogs: true,
  });

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  setupSwagger(app, configService);

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port, '0.0.0.0');

  Logger.log(`Application is running on: ${await app.getUrl()}`);
}

process.on('unhandledRejection', (reason) => {
  Logger.error(`Unhandled rejection: ${String(reason)}`);
});

process.on('uncaughtException', (error) => {
  Logger.error(`Uncaught exception: ${error.message}`, error.stack);
});

bootstrap();

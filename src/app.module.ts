import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RoutesModule } from './routes/routes.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validate } from './common/validators';
import { DatabaseModule } from '@modules/database';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from '@common/exceptions';
import {
  AuditLogMiddleware,
  LoggerMiddleware,
  LoggerService,
} from '@common/logger';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate,
    }),
    RoutesModule,
    DatabaseModule,
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get('FALLBACK_LANGUAGE'),
        loaderOptions: {
          path: join(__dirname, '/i18n/'),
          watch: true,
        },
        typesOutputPath: join(__dirname, '../src/generated/i18n.generated.ts'),
      }),
      resolvers: [new QueryResolver(['lang']), AcceptLanguageResolver],
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
  ],
  controllers: [HealthController],
  providers: [
    LoggerService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware, AuditLogMiddleware).forRoutes('*');
  }
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DbConfigService } from './services';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useClass: DbConfigService,
    }),
  ],
})
export class DatabaseModule {}

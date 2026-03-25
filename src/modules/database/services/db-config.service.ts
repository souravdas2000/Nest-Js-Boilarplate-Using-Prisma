import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MongooseModuleOptions,
  MongooseOptionsFactory,
} from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { toJSON } from '../plugins';

@Injectable()
export class DbConfigService implements MongooseOptionsFactory {
  constructor(private configService: ConfigService) {}

  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: this.configService.get<string>('DATABASE_URL'),
      connectionFactory: (connection: Connection) => {
        connection.plugin(toJSON);
        return connection;
      },
    };
  }
}

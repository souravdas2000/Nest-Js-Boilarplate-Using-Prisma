import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createLogger, format, transports } from 'winston';
import 'winston-mongodb';

@Injectable()
export class LoggerService {
  constructor(private configService: ConfigService) {}

  // Fill all keys into metadata except those provided
  formattedLogger = format.combine(
    format.timestamp(),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    format.json(),
  );

  logger = createLogger({
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.printf(({ level, message }) => `${level}: ${message}`),
        ),
      }),
      new transports.MongoDB({
        level: 'error',
        db: this.configService.get<string>('DATABASE_URL'),
        collection: 'logger',
        options: { useUnifiedTopology: true },
        tryReconnect: true,
        format: this.formattedLogger,
      }),
    ],
  });
}

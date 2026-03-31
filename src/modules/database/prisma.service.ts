import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly slowQueryThresholdMs: number;

  constructor(private readonly configService: ConfigService) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });

    this.slowQueryThresholdMs = Number(
      this.configService.get('PRISMA_SLOW_QUERY_THRESHOLD_MS') ?? 500,
    );

    this.bindPrismaEvents();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  private bindPrismaEvents() {
    this.$on('query', (event) => {
      if (event.duration >= this.slowQueryThresholdMs) {
        this.logger.warn(
          `Slow query detected: ${event.duration}ms on ${event.target}`,
        );
      }
    });

    this.$on('warn', (event) => {
      this.logger.warn(event.message);
    });

    this.$on('error', (event) => {
      this.logger.error(event.message);
    });
  }
}

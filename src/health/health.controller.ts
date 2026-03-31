import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@modules/database';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const startedAt = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      db_latency_ms: Date.now() - startedAt,
    };
  }
}

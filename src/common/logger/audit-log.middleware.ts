import { Injectable, NestMiddleware } from '@nestjs/common';
import { PrismaService } from '@modules/database';
import { NextFunction, Request, Response } from 'express';

type TRequestWithUser = Request & { user?: { id?: string } };

@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  use(request: TRequestWithUser, response: Response, next: NextFunction): void {
    const startedAt = Date.now();

    response.on('finish', () => {
      void this.createAuditLog(request, response, startedAt);
    });

    next();
  }

  private async createAuditLog(
    request: TRequestWithUser,
    response: Response,
    startedAt: number,
  ) {
    if (!request.originalUrl?.startsWith('/api/')) {
      return;
    }

    const path = this.removeQueryString(request.originalUrl);
    const entity = this.resolveEntity(path);
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      request.method,
    );

    try {
      await this.prisma.auditLog.create({
        data: {
          userId: request.user?.id,
          action: `${request.method} ${path}`,
          entity,
          entity_id: this.resolveEntityId(request.params),
          description: `HTTP ${request.method} ${path} responded ${response.statusCode}`,
          old_values: undefined,
          new_values: isMutation
            ? this.safeSerialize(this.maskSensitiveData(request.body))
            : undefined,
          metadata: this.safeSerialize({
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
            query: this.maskSensitiveData(request.query),
            params: request.params,
          }),
          method: request.method,
          path,
          ip_address: request.ip,
          user_agent: request.headers['user-agent'],
        },
      });
    } catch {
      // Keep API response flow safe even if audit logging fails.
    }
  }

  private resolveEntity(path: string) {
    const parts = path.split('/').filter(Boolean);
    return parts[2] ?? 'system';
  }

  private resolveEntityId(params?: Record<string, unknown>) {
    if (!params) {
      return undefined;
    }

    const knownKeys = ['id', 'userId', 'tokenId', 'otpId'];

    for (const key of knownKeys) {
      if (params[key] !== undefined && params[key] !== null) {
        return String(params[key]);
      }
    }

    return undefined;
  }

  private removeQueryString(url: string) {
    return url.split('?')[0];
  }

  private safeSerialize(value: unknown) {
    if (value === null || value === undefined) {
      return undefined;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private maskSensitiveData(value: unknown): unknown {
    const sensitiveKeys = new Set([
      'password',
      'new_password',
      'old_password',
      'confirm_password',
      'token',
      'refresh_token',
      'access_token',
      'authorization',
      'secret',
      'otp',
    ]);

    if (Array.isArray(value)) {
      return value.map((item) => this.maskSensitiveData(item));
    }

    if (value && typeof value === 'object') {
      const result: Record<string, unknown> = {};

      for (const [key, fieldValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (sensitiveKeys.has(key.toLowerCase())) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = this.maskSensitiveData(fieldValue);
        }
      }

      return result;
    }

    return value;
  }
}

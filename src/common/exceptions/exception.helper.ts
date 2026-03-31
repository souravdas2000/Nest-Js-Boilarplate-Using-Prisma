import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { errorMesssgeFormat } from './error-message-format';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';
import { PrismaService } from '@modules/database';
import { Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private i18n: I18nService<I18nTranslations>,
    private readonly prisma: PrismaService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request & { user?: { id?: string } }>();

    response.exception = exception;

    this.logger.error(exception);

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? errorMesssgeFormat(
            JSON.parse(JSON.stringify(exception.getResponse())).message,
          )
        : this.i18n.t('message.somethingWentWrong');

    await this.saveErrorLog({
      exception,
      message: String(message),
      httpStatus,
      request,
    });

    const responseBody = { status: false, message };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private async saveErrorLog({
    exception,
    message,
    httpStatus,
    request,
  }: {
    exception: unknown;
    message: string;
    httpStatus: number;
    request: Request & { user?: { id?: string } };
  }) {
    try {
      await this.prisma.errorLog.create({
        data: {
          userId: request?.user?.id,
          status_code: httpStatus,
          error_name:
            exception instanceof Error ? exception.name : 'UnknownException',
          message,
          stack: exception instanceof Error ? exception.stack : undefined,
          method: request?.method,
          path: request?.originalUrl ?? request?.url,
          ip_address: request?.ip,
          user_agent: request?.headers?.['user-agent'],
          request_body: this.safeSerialize(request?.body),
          request_query: this.safeSerialize(request?.query),
          request_params: this.safeSerialize(request?.params),
        },
      });
    } catch (dbError) {
      this.logger.error('Failed to persist error log in database', dbError);
    }
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
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private loggerService: LoggerService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl } = request;
    const startTime = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const endTime = Date.now();
      const resTime = endTime - startTime;

      if (statusCode < 400) {
        this.loggerService.logger.info(
          `${method} ${originalUrl} ${statusCode} time: ${resTime}ms`,
        );
      } else if (statusCode >= 400) {
        this.loggerService.logger.error(
          `${method} ${originalUrl} ${statusCode} time: ${resTime}ms`,
          { exception: response['exception'] },
        );
      }
    });

    next();
  }
}

/**
 * src/common/middleware/request-logger.middleware.ts
 * * Logs incoming requests and responses as structured JSON.
 * * This format is easier to parse by log aggregation tools.
 */
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ContextService } from '../context/context.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  constructor(private readonly contextService: ContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const originalUrl = req.originalUrl;
    const ip = req.ip;

    const body = req.body as unknown;

    const userAgent = req.get('user-agent') || '';
    const start = Date.now();

    // Retrieve the request ID set by the RequestIdMiddleware
    const requestId = this.contextService.getRequestId() || 'unknown';

    // 1. Log Incoming Request as JSON
    const requestLog = {
      event: 'http_request',
      requestId,
      direction: 'incoming',
      method,
      url: originalUrl,
      ip,
      userAgent,
      body,
    };

    // Stringify the log object to ensure it is printed as a valid JSON string
    this.logger.log(JSON.stringify(requestLog));

    // 2. Log Response as JSON when finished
    res.on('finish', () => {
      const { statusCode } = res;
      const durationMs = Date.now() - start;
      const contentLength = res.get('content-length');

      const responseLog = {
        event: 'http_response',
        requestId,
        direction: 'outgoing',
        method,
        url: originalUrl,
        statusCode,
        durationMs,
        contentLength: contentLength || '0',
      };

      this.logger.log(JSON.stringify(responseLog));
    });

    next();
  }
}

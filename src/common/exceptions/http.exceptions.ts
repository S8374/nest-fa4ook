/**
 * src/common/exceptions/http.exceptions.ts
 */
import { HttpStatus } from '@nestjs/common';
import { BaseException, ExceptionOptions } from './base.exception';

// Helper type for the constructor argument
type ExceptionArgs = ExceptionOptions | string;

export class BadRequestException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(options || 'Bad Request', HttpStatus.BAD_REQUEST, 'BAD_REQUEST');
  }
}

export class UnauthorizedException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Authentication required',
      HttpStatus.UNAUTHORIZED,
      'AUTHENTICATION_ERROR',
    );
  }
}

export class ForbiddenException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Insufficient permissions',
      HttpStatus.FORBIDDEN,
      'AUTHORIZATION_ERROR',
    );
  }
}

export class NotFoundException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(options || 'Resource not found', HttpStatus.NOT_FOUND, 'NOT_FOUND');
  }
}

export class ConflictException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Resource conflict',
      HttpStatus.CONFLICT,
      'CONFLICT_ERROR',
    );
  }
}

export class PayloadTooLargeException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Payload too large',
      HttpStatus.PAYLOAD_TOO_LARGE,
      'PAYLOAD_TOO_LARGE',
    );
  }
}

export class RateLimitException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Too many requests',
      HttpStatus.TOO_MANY_REQUESTS,
      'RATE_LIMIT_ERROR',
    );
  }
}

export class InternalServerException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_ERROR',
    );
  }
}

export class ExternalServiceException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'External service error',
      HttpStatus.BAD_GATEWAY,
      'EXTERNAL_SERVICE_ERROR',
    );
  }
}

export class TimeoutException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Request timeout',
      HttpStatus.REQUEST_TIMEOUT,
      'TIMEOUT_ERROR',
    );
  }
}

export class ServiceUnavailableException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Service unavailable',
      HttpStatus.SERVICE_UNAVAILABLE,
      'SERVICE_UNAVAILABLE',
    );
  }
}

export class GatewayTimeoutException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Gateway timeout',
      HttpStatus.GATEWAY_TIMEOUT,
      'GATEWAY_TIMEOUT',
    );
  }
}

export class BadGatewayException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Bad gateway',
      HttpStatus.BAD_GATEWAY,
      'BAD_GATEWAY_ERROR',
    );
  }
}

export class TooManyRequestsException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Too many requests',
      HttpStatus.TOO_MANY_REQUESTS,
      'TOO_MANY_REQUESTS',
    );
  }
}

export class MethodNotAllowedException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Method not allowed',
      HttpStatus.METHOD_NOT_ALLOWED,
      'METHOD_NOT_ALLOWED',
    );
  }
}

export class NotAcceptableException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Not acceptable',
      HttpStatus.NOT_ACCEPTABLE,
      'NOT_ACCEPTABLE',
    );
  }
}

export class UnsupportedMediaTypeException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Unsupported media type',
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      'UNSUPPORTED_MEDIA_TYPE',
    );
  }
}

export class UnprocessableEntityException extends BaseException {
  constructor(options?: ExceptionArgs) {
    super(
      options || 'Unprocessable entity',
      HttpStatus.UNPROCESSABLE_ENTITY,
      'UNPROCESSABLE_ENTITY',
    );
  }
}

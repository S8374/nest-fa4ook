/**
 * src/common/exceptions/base.exception.ts
 */
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorDetail } from '../dto/api-error-response.dto';

/**
 * Configuration object for exceptions.
 * This makes passing multiple optional parameters clean and readable.
 */
export interface ExceptionOptions {
  message?: string;
  code?: string;
  errors?: ErrorDetail[];
  instruction?: string;
  details?: unknown;
}

export class BaseException extends HttpException {
  public readonly code: string;
  public readonly errors: ErrorDetail[];
  public readonly instruction?: string;
  public readonly details?: unknown;

  constructor(
    // Allow passing a simple string message OR the full options object
    optionsOrMessage: ExceptionOptions | string,
    status: HttpStatus,
    defaultCode: string = 'INTERNAL_ERROR',
  ) {
    // Normalize input: if string, convert to object
    const options: ExceptionOptions =
      typeof optionsOrMessage === 'string'
        ? { message: optionsOrMessage }
        : optionsOrMessage || {};

    const {
      message = 'An error occurred',
      code = defaultCode,
      errors,
      instruction,
      details,
    } = options;

    // Construct the response body
    const responseBody = {
      message,
      code,
      errors: errors || (message ? [{ code, message }] : []),
      instruction,
      details,
    };

    super(responseBody, status);

    this.code = code;
    this.errors = responseBody.errors;
    this.instruction = instruction;
    this.details = details;
  }
}

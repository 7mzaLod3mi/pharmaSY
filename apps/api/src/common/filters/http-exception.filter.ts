import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, string[]> | undefined;
    let code: string | undefined;
    let accountState: string | undefined;
    let reason: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res.message as string) || message;
        code = typeof res.code === 'string' ? res.code : undefined;
        accountState =
          typeof res.accountState === 'string' ? res.accountState : undefined;
        reason = typeof res.reason === 'string' ? res.reason : undefined;
        if (res.errors && typeof res.errors === 'object') {
          errors = res.errors as Record<string, string[]>;
        }
        if (Array.isArray(res.message)) {
          errors = { validation: res.message as string[] };
          message = res.message[0] as string;
          code = code ?? 'VALIDATION_ERROR';
        }
      } else {
        message = exceptionResponse as string;
      }
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      code,
      accountState,
      reason,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

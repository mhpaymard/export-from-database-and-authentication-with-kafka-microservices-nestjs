import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      
      // Handle specific error types
      if (message.includes('timeout')) {
        status = HttpStatus.GATEWAY_TIMEOUT;
        error = 'Gateway Timeout';
      } else if (message.includes('not found')) {
        status = HttpStatus.NOT_FOUND;
        error = 'Not Found';
      } else if (message.includes('unauthorized') || message.includes('authentication')) {
        status = HttpStatus.UNAUTHORIZED;
        error = 'Unauthorized';
      } else if (message.includes('forbidden') || message.includes('permission')) {
        status = HttpStatus.FORBIDDEN;
        error = 'Forbidden';
      }
    }

    const errorResponse = {
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json(errorResponse);
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from '../exceptions/domain.exceptions';

interface ValidationErrorResponse {
  statusCode: number;
  message: string[] | string;
  error: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const meta = {
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof DomainError) {
      reply.status(exception.httpStatus).send({
        statusCode: exception.httpStatus,
        error: exception.code,
        message: exception.message,
        meta,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const response = exceptionResponse as ValidationErrorResponse;
        const isValidation =
          Array.isArray(response.message) &&
          status === (HttpStatus.BAD_REQUEST as number);

        reply.status(status).send({
          statusCode: status,
          error: isValidation
            ? 'VALIDATION_ERROR'
            : (response.error ?? 'HTTP_ERROR'),
          message: isValidation
            ? 'Validation failed'
            : Array.isArray(response.message)
              ? response.message[0]
              : response.message,
          ...(isValidation && {
            details: (response.message as string[]).map((msg) => ({
              field: msg.split(' ')[0],
              message: msg,
            })),
          }),
          meta,
        });
        return;
      }

      reply.status(status).send({
        statusCode: status,
        error: 'HTTP_ERROR',
        message: exception.message,
        meta,
      });
      return;
    }

    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
      meta,
    });
  }
}

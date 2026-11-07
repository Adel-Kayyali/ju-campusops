import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exceptions';

/** Uniform error body returned by every endpoint. */
export interface ApiErrorBody {
  status: number;
  error: string;
  code: string;
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
}

/**
 * Converts every thrown error into an {@link ApiErrorBody}:
 *  - DomainException      -> its own status/code
 *  - HttpException        -> Nest/validation errors
 *  - Prisma known errors  -> 404 / 409 (unique, exclusion constraint ...)
 *  - anything else        -> 500 (logged, details hidden from the client)
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const body = this.toErrorBody(exception, request.originalUrl ?? request.url);
    if (body.status >= 500) {
      this.logger.error(`${request.method} ${request.url} failed`, exception instanceof Error ? exception.stack : exception);
    }
    response.status(body.status).json(body);
  }

  private toErrorBody(exception: unknown, path: string): ApiErrorBody {
    const base = { path, timestamp: new Date().toISOString() };

    if (exception instanceof DomainException) {
      return { ...base, status: exception.httpStatus, error: HttpStatus[exception.httpStatus], code: exception.code, message: exception.message, details: exception.details };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const rawMessage = typeof payload === 'object' && payload !== null ? (payload as { message?: unknown }).message : payload;
      const isValidation = Array.isArray(rawMessage);
      return {
        ...base,
        status,
        error: HttpStatus[status] ?? 'ERROR',
        code: isValidation ? 'VALIDATION_FAILED' : (HttpStatus[status] ?? 'HTTP_ERROR'),
        message: isValidation ? 'Request validation failed' : String(rawMessage ?? exception.message),
        details: isValidation ? rawMessage : undefined,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return { ...base, ...this.fromPrismaError(exception) };
    }

    if (isExclusionViolation(exception)) {
      return { ...base, status: HttpStatus.CONFLICT, error: 'CONFLICT', code: 'OVERLAPPING_PERIOD', message: 'The requested period overlaps an existing record' };
    }

    return { ...base, status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL_SERVER_ERROR', code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' };
  }

  private fromPrismaError(error: Prisma.PrismaClientKnownRequestError): Omit<ApiErrorBody, 'path' | 'timestamp'> {
    switch (error.code) {
      case 'P2002': {
        const fields = (error.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        return { status: HttpStatus.CONFLICT, error: 'CONFLICT', code: 'DUPLICATE_VALUE', message: `A record with the same ${fields} already exists`, details: { fields } };
      }
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, error: 'NOT_FOUND', code: 'RECORD_NOT_FOUND', message: 'The requested record was not found' };
      case 'P2003':
        return { status: HttpStatus.UNPROCESSABLE_ENTITY, error: 'UNPROCESSABLE_ENTITY', code: 'INVALID_REFERENCE', message: 'A referenced record does not exist' };
      default:
        if (String(error.message).includes('23P01')) {
          return { status: HttpStatus.CONFLICT, error: 'CONFLICT', code: 'OVERLAPPING_PERIOD', message: 'The requested period overlaps an existing record' };
        }
        return { status: HttpStatus.BAD_REQUEST, error: 'BAD_REQUEST', code: `DB_${error.code}`, message: 'The database rejected the operation' };
    }
  }
}

/** PostgreSQL error 23P01 = exclusion_violation (e.g. overlapping locker subscriptions). */
function isExclusionViolation(exception: unknown): boolean {
  const text = exception instanceof Error ? exception.message : String(exception);
  return text.includes('23P01') || text.includes('locker_subscriptions_no_overlap');
}

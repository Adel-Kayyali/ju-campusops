import { HttpStatus } from '@nestjs/common';

/**
 * Base class of all business (domain) errors. Services throw these; the
 * {@link GlobalExceptionFilter} translates them into consistent HTTP responses,
 * like a Spring @ControllerAdvice.
 */
export abstract class DomainException extends Error {
  abstract readonly httpStatus: HttpStatus;

  protected constructor(
    message: string,
    /** Stable machine-readable error code, e.g. LOCKER_ALREADY_SUBSCRIBED. */
    readonly code: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** 404 - the requested entity does not exist. */
export class EntityNotFoundException extends DomainException {
  readonly httpStatus = HttpStatus.NOT_FOUND;

  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" was not found`, `${toCode(entity)}_NOT_FOUND`, { entity, id });
  }
}

/** 422 - the request is well-formed but breaks a business rule. */
export class BusinessRuleViolationException extends DomainException {
  readonly httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(message: string, code = 'BUSINESS_RULE_VIOLATION', details?: Record<string, unknown>) {
    super(message, code, details);
  }
}

/** 422 - an entity cannot move from its current state to the requested one. */
export class InvalidStateTransitionException extends BusinessRuleViolationException {
  constructor(entity: string, from: string, to: string) {
    super(`${entity} cannot move from ${from} to ${to}`, 'INVALID_STATE_TRANSITION', { entity, from, to });
  }
}

/** 409 - the operation conflicts with existing data (duplicates, overlaps...). */
export class ResourceConflictException extends DomainException {
  readonly httpStatus = HttpStatus.CONFLICT;

  constructor(message: string, code = 'RESOURCE_CONFLICT', details?: Record<string, unknown>) {
    super(message, code, details);
  }
}

/** 403 - the user is authenticated but not allowed to touch this resource. */
export class AccessDeniedException extends DomainException {
  readonly httpStatus = HttpStatus.FORBIDDEN;

  constructor(message = 'You are not allowed to access this resource') {
    super(message, 'ACCESS_DENIED');
  }
}

/** 401 - wrong credentials or inactive account. */
export class AuthenticationFailedException extends DomainException {
  readonly httpStatus = HttpStatus.UNAUTHORIZED;

  constructor(message = 'Invalid email or password') {
    super(message, 'AUTHENTICATION_FAILED');
  }
}

function toCode(entity: string): string {
  return entity.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/\s+/g, '_').toUpperCase();
}

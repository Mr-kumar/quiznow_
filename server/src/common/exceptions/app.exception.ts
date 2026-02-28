import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Unified App Exception for DRY error handling
 * Prevents code duplication across services
 */
export class AppException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    code?: string,
  ) {
    const response = {
      message,
      code: code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    };
    super(response, statusCode);
  }
}

// Specific Exceptions for common errors
export class ResourceNotFoundException extends AppException {
  constructor(resource: string, identifier?: string) {
    super(
      `${resource}${identifier ? ` with ID ${identifier}` : ''} not found`,
      HttpStatus.NOT_FOUND,
      'RESOURCE_NOT_FOUND',
    );
  }
}

export class ValidationException extends AppException {
  constructor(message: string, code = 'VALIDATION_FAILED') {
    super(message, HttpStatus.BAD_REQUEST, code);
  }
}

export class ConflictException extends AppException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT');
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN');
  }
}

export class UnauthorizedException extends AppException {
  constructor(message: string) {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

export class InternalServerException extends AppException {
  constructor(message: string) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR');
  }
}

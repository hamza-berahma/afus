/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code || this.name.toUpperCase().replace('ERROR', '');
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400
 * Used for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication Error - 401
 * Used when user is not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

/**
 * Authorization Error - 403
 * Used when user doesn't have permission
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions', details = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

/**
 * Not Found Error - 404
 * Used when resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * External API Error - 502
 * Used when external API calls fail
 */
export class ExternalAPIError extends AppError {
  constructor(message = 'External API error', details = null, originalError = null) {
    super(message, 502, 'EXTERNAL_API_ERROR', details);
    this.originalError = originalError;
  }
}

/**
 * Database Error - 500
 * Used for database-related errors
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database error', details = null, originalError = null) {
    super(message, 500, 'DATABASE_ERROR', details);
    this.originalError = originalError;
  }
}


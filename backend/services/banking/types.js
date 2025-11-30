/**
 * Banking Service Types
 * 
 * Comprehensive types for the banking service layer
 * supporting both CIH Bank live APIs and mock implementations.
 */

/**
 * Banking error base class
 */
export class BankingError extends Error {
  constructor(message, code, statusCode = 500, details = null) {
    super(message);
    this.name = 'BankingError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InsufficientBalanceError extends BankingError {
  constructor(message = 'Insufficient balance', details = null) {
    super(message, 'INSUFFICIENT_BALANCE', 400, details);
    this.name = 'InsufficientBalanceError';
  }
}

export class InvalidCredentialsError extends BankingError {
  constructor(message = 'Invalid banking credentials', details = null) {
    super(message, 'INVALID_CREDENTIALS', 401, details);
    this.name = 'InvalidCredentialsError';
  }
}

export class NetworkError extends BankingError {
  constructor(message = 'Network error', details = null) {
    super(message, 'NETWORK_ERROR', 0, details);
    this.name = 'NetworkError';
  }
}

export class ServiceUnavailableError extends BankingError {
  constructor(message = 'Banking service unavailable', details = null) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
    this.name = 'ServiceUnavailableError';
  }
}

export class ValidationError extends BankingError {
  constructor(message = 'Invalid request parameters', details = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}


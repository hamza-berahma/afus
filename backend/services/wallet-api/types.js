/**
 * Wallet API Types and Error Classes
 */

export class WalletAPIError extends Error {
  constructor(message, code, statusCode = 500, details = null) {
    super(message);
    this.name = 'WalletAPIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends WalletAPIError {
  constructor(message = 'Validation error', details = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class InvalidOTPError extends WalletAPIError {
  constructor(message = 'Invalid or expired OTP', details = null) {
    super(message, 'INVALID_OTP', 400, details);
    this.name = 'InvalidOTPError';
  }
}

export class InsufficientBalanceError extends WalletAPIError {
  constructor(message = 'Insufficient balance', details = null) {
    super(message, 'INSUFFICIENT_BALANCE', 400, details);
    this.name = 'InsufficientBalanceError';
  }
}

export class ContractNotFoundError extends WalletAPIError {
  constructor(message = 'Contract ID not found', details = null) {
    super(message, 'CONTRACT_NOT_FOUND', 404, details);
    this.name = 'ContractNotFoundError';
  }
}

export class InvalidPhoneNumberError extends WalletAPIError {
  constructor(message = 'Invalid phone number format', details = null) {
    super(message, 'INVALID_PHONE', 400, details);
    this.name = 'InvalidPhoneNumberError';
  }
}

export class TransactionFailedError extends WalletAPIError {
  constructor(message = 'Transaction processing failed', details = null) {
    super(message, 'TRANSACTION_FAILED', 500, details);
    this.name = 'TransactionFailedError';
  }
}


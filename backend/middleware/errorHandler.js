import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ExternalAPIError,
  DatabaseError,
} from './errors.js';

/**
 * Global error handler middleware
 * Catches all errors and returns consistent error format
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details
  const errorDetails = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };

  // Log to console
  console.error('Error occurred:', {
    ...errorDetails,
    statusCode: err.statusCode || 500,
    code: err.code,
  });

  // Determine status code
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal Server Error';
  let details = null;

  // Handle known error types
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof AuthenticationError) {
    statusCode = 401;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ExternalAPIError) {
    statusCode = 502;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof DatabaseError) {
    statusCode = 500;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode || 500;
    errorCode = err.code || 'APPLICATION_ERROR';
    message = err.message;
    details = err.details;
  } else if (err.statusCode) {
    // Handle errors with statusCode property
    statusCode = err.statusCode;
    errorCode = err.code || `HTTP_${statusCode}`;
    message = err.message || 'An error occurred';
    details = err.details;
  } else {
    // Unknown error - log full details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Unknown error:', err);
    }
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      message,
      code: errorCode,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
      }),
    },
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Must be placed before error handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(
    `Route ${req.method} ${req.originalUrl} not found`
  );
  next(error);
};

/**
 * Async handler wrapper
 * Catches promise rejections and passes to error handler
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped route handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Export error classes for use in routes
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ExternalAPIError,
  DatabaseError,
};

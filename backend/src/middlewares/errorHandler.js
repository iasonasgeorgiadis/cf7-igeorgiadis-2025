const logger = require('../utils/logger');

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Default error
  let error = {
    message: err.message || 'Internal server error',
    status: err.status || 500
  };

  // Log error with context
  const errorContext = {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get('user-agent'),
    errorCode: err.code,
    errorName: err.name
  };
  
  // Log based on error severity
  if (error.status >= 500) {
    logger.error('Server error occurred', { ...errorContext, error: err });
  } else if (error.status >= 400) {
    logger.warn('Client error occurred', { ...errorContext, message: err.message });
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    // Unique constraint violation
    error.status = 409;
    error.message = 'Resource already exists';
  } else if (err.code === '23503') {
    // Foreign key violation
    error.status = 400;
    error.message = 'Invalid reference';
  } else if (err.code === '22P02') {
    // Invalid UUID
    error.status = 400;
    error.message = 'Invalid ID format';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation failed';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.status = 401;
    error.message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    error.status = 401;
    error.message = 'Token expired';
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    message: error.message,
    requestId: req.id
  };
  
  // Add additional information in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }
  
  // Add specific error codes for client handling
  if (err.code === '23505') {
    errorResponse.code = 'DUPLICATE_RESOURCE';
  } else if (err.code === '23503') {
    errorResponse.code = 'INVALID_REFERENCE';
  } else if (err.code === '22P02') {
    errorResponse.code = 'INVALID_ID_FORMAT';
  } else if (err.name === 'ValidationError') {
    errorResponse.code = 'VALIDATION_FAILED';
    errorResponse.errors = err.errors;
  } else if (err.name === 'JsonWebTokenError') {
    errorResponse.code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    errorResponse.code = 'TOKEN_EXPIRED';
  }
  
  // Send error response
  res.status(error.status).json(errorResponse);
};

// Not found middleware
const notFound = (req, res, next) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.id
  });
  
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
    requestId: req.id
  });
};

// Async error wrapper for route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error formatter for express-validator
const validationErrorHandler = (req, res, next) => {
  const errors = require('express-validator').validationResult(req);
  
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.status = 400;
    error.errors = errors.array();
    return next(error);
  }
  
  next();
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  validationErrorHandler
};
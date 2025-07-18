/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default error
  let error = {
    message: err.message || 'Internal server error',
    status: err.status || 500
  };

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
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

  // Send error response
  res.status(error.status).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

/**
 * Not found middleware
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
};

module.exports = {
  errorHandler,
  notFound
};
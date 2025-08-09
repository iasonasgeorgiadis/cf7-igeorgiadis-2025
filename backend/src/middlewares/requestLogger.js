const logger = require('../utils/logger');
const onFinished = require('on-finished');

// Request logging middleware

// Log HTTP requests with timing and context
const requestLogger = () => {
  return (req, res, next) => {
    // Start time
    req.startTime = Date.now();
    
    // Log request start in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Request started', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        requestId: req.id
      });
    }
    
    // Log when response finishes
    onFinished(res, (err, res) => {
      // Calculate response time
      res.responseTime = Date.now() - req.startTime;
      
      // Prepare log data
      const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: `${res.responseTime}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
        userId: req.user?.id,
        userRole: req.user?.role,
        contentLength: res.get('content-length'),
        referrer: req.get('referrer')
      };
      
      // Add error info if present
      if (err) {
        logData.error = err.message;
      }
      
      // Determine log level based on status code
      if (res.statusCode >= 500) {
        logger.error('Request failed', logData);
      } else if (res.statusCode >= 400) {
        logger.warn('Request client error', logData);
      } else if (res.statusCode >= 300) {
        logger.info('Request redirected', logData);
      } else {
        logger.info('Request completed', logData);
      }
      
      // Log slow requests
      if (res.responseTime > 1000) {
        logger.warn('Slow request detected', {
          ...logData,
          slowRequest: true
        });
      }
    });
    
    next();
  };
};

// Log request body (use carefully, may contain sensitive data)
const requestBodyLogger = (skipPaths = ['/api/auth']) => {
  return (req, res, next) => {
    // Skip logging for sensitive paths
    const shouldSkip = skipPaths.some(path => req.originalUrl.startsWith(path));
    
    if (!shouldSkip && req.body && Object.keys(req.body).length > 0) {
      // Create a sanitized copy of the body
      const sanitizedBody = { ...req.body };
      
      // Remove sensitive fields
      const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'credit_card'];
      sensitiveFields.forEach(field => {
        if (sanitizedBody[field]) {
          sanitizedBody[field] = '[REDACTED]';
        }
      });
      
      logger.debug('Request body', {
        requestId: req.id,
        body: sanitizedBody
      });
    }
    
    next();
  };
};

// Performance monitoring middleware
const performanceMonitor = () => {
  const slowRequestThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 3000;
  
  return (req, res, next) => {
    const startTime = process.hrtime();
    
    // Override res.json to log response data size
    const originalJson = res.json;
    res.json = function(data) {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = seconds * 1000 + nanoseconds / 1000000;
      
      // Log performance metrics
      if (responseTime > slowRequestThreshold) {
        logger.warn('Slow API response', {
          method: req.method,
          url: req.originalUrl,
          responseTime: `${responseTime.toFixed(2)}ms`,
          dataSize: JSON.stringify(data).length,
          requestId: req.id
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  requestLogger,
  requestBodyLogger,
  performanceMonitor
};
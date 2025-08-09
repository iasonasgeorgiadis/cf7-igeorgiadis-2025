const winston = require('winston');
const path = require('path');
const config = require('../config/app');

// Production-ready logger using Winston

// Get logging configuration
const loggingConfig = config.env === 'production' 
  ? require('../config/production').logging 
  : {
      level: 'debug',
      format: 'simple',
      transports: ['console']
    };

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple(),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create transports array
const transports = [];

// Console transport
if (loggingConfig.transports.includes('console')) {
  transports.push(new winston.transports.Console({
    format: config.env === 'development' ? consoleFormat : logFormat,
    level: loggingConfig.level
  }));
}

// File transports for production
if (config.env === 'production' && loggingConfig.transports.includes('file')) {
  // Error log file
  if (loggingConfig.errorFile) {
    transports.push(new winston.transports.File({
      filename: loggingConfig.errorFile,
      level: 'error',
      maxsize: loggingConfig.maxSize || '20m',
      maxFiles: loggingConfig.maxFiles || '14d',
      format: logFormat
    }));
  }
  
  // Combined log file
  if (loggingConfig.combinedFile) {
    transports.push(new winston.transports.File({
      filename: loggingConfig.combinedFile,
      maxsize: loggingConfig.maxSize || '20m',
      maxFiles: loggingConfig.maxFiles || '14d',
      format: logFormat
    }));
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: loggingConfig.level || 'info',
  format: logFormat,
  defaultMeta: { service: 'lms-backend' },
  transports,
  // Don't exit on uncaught errors
  exitOnError: false
});

// Create a stream object for Morgan integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Log request details with status-based log levels
logger.logRequest = (req, res, extra = {}) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.id,
    userId: req.user?.id,
    statusCode: res.statusCode,
    responseTime: res.responseTime,
    ...extra
  };
  
  // Log level based on status code
  if (res.statusCode >= 500) {
    logger.error('Server error', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('Client error', logData);
  } else {
    logger.info('Request completed', logData);
  }
};

// Log error with additional context information
logger.logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    ...context
  });
};

// Create child logger with additional context
logger.child = (metadata) => {
  return logger.child(metadata);
};

// Handle uncaught exceptions and rejections in production
if (config.env === 'production') {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Give the logger time to write before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
  });
}

module.exports = logger;
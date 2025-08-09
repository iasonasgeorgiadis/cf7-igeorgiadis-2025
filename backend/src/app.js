const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');
const productionConfig = config.env === 'production' ? require('./config/production') : {};
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { getSecurityMiddleware, additionalSecurityHeaders, requestId, maintenanceMode } = require('./middlewares/security');
const { requestLogger, performanceMonitor } = require('./middlewares/requestLogger');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const lessonRoutes = require('./routes/lessons');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');

/**
 * Create Express application
 */
const app = express();

// Security middleware
const securityConfig = config.env === 'production' ? productionConfig : config;
app.use(getSecurityMiddleware(securityConfig));
app.use(additionalSecurityHeaders(securityConfig));
app.use(requestId());
app.use(maintenanceMode(securityConfig));
app.use(cors(securityConfig.cors || config.cors));

// Rate limiting configuration
const rateLimitConfig = securityConfig.rateLimit || config.rateLimit;

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: rateLimitConfig.endpoints?.auth?.windowMs || rateLimitConfig.windowMs,
  max: config.env === 'development' ? 1000 : (rateLimitConfig.endpoints?.auth?.max || 5),
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: rateLimitConfig.standardHeaders || true,
  legacyHeaders: rateLimitConfig.legacyHeaders || false,
  skip: () => config.env === 'development' // Skip rate limiting in development
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: rateLimitConfig.endpoints?.api?.windowMs || rateLimitConfig.windowMs,
  max: config.env === 'development' ? 10000 : (rateLimitConfig.endpoints?.api?.max || rateLimitConfig.max),
  standardHeaders: rateLimitConfig.standardHeaders || true,
  legacyHeaders: rateLimitConfig.legacyHeaders || false
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
app.use(requestLogger());
app.use(performanceMonitor());
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  // Use winston stream for production
  app.use(morgan('combined', { stream: logger.stream }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LMS API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', generalLimiter, userRoutes);
app.use('/api/courses', generalLimiter, courseRoutes);
app.use('/api/enrollments', generalLimiter, enrollmentRoutes);
app.use('/api', generalLimiter, lessonRoutes); // Lesson routes use mixed paths
app.use('/api', generalLimiter, assignmentRoutes); // Assignment routes use mixed paths
app.use('/api', generalLimiter, submissionRoutes); // Submission routes use mixed paths

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
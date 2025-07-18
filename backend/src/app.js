const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

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
app.use(helmet());
app.use(cors(config.cors));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: 5, // Limit auth attempts
  message: 'Too many authentication attempts, please try again later'
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
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
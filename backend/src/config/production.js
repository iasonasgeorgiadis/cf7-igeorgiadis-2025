// Production configuration

module.exports = {
  // Environment
  env: 'production',
  
  // Server configuration
  port: parseInt(process.env.PORT) || 5000,
  
  // Database configuration with production optimizations
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    
    // Production pool configuration
    max: parseInt(process.env.DB_POOL_MAX) || 50,
    min: parseInt(process.env.DB_POOL_MIN) || 10,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 10000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
    
    // SSL configuration
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    } : false
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    algorithm: 'HS256'
  },
  
  // Rate limiting configuration (stricter for production)
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50, // Stricter limit
    standardHeaders: true,
    legacyHeaders: false,
    
    // Different limits for different endpoints
    endpoints: {
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5 // Very strict for auth endpoints
      },
      api: {
        windowMs: 15 * 60 * 1000,
        max: 100 // Standard API limit
      },
      upload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10 // Limited uploads
      }
    }
  },
  
  // CORS configuration
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : [];
      
      // Allow requests with no origin (server-to-server)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    maxAge: 86400 // 24 hours
  },
  
  // Security headers
  security: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET,
    name: 'lms.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // HTTPS only
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    },
    rolling: true
  },
  
  // Cookie configuration
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: process.env.COOKIE_DOMAIN
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    transports: ['file', 'console'],
    errorFile: '/var/log/lms/error.log',
    combinedFile: '/var/log/lms/combined.log',
    maxSize: '20m',
    maxFiles: '14d'
  },
  
  // Upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    uploadDir: process.env.UPLOAD_DIR || '/var/uploads/lms'
  },
  
  // Email configuration
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: process.env.EMAIL_FROM || 'noreply@lms.edu'
  },
  
  // Cache configuration
  cache: {
    enabled: true,
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600 // 10 minutes
  },
  
  // Performance monitoring
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    apm: {
      serviceName: 'lms-backend',
      serverUrl: process.env.APM_SERVER_URL,
      secretToken: process.env.APM_SECRET_TOKEN
    }
  },
  
  // Feature flags
  features: {
    emailNotifications: process.env.FEATURE_EMAIL_NOTIFICATIONS === 'true',
    fileUploads: process.env.FEATURE_FILE_UPLOADS === 'true',
    videoLessons: process.env.FEATURE_VIDEO_LESSONS === 'true',
    analytics: process.env.FEATURE_ANALYTICS === 'true'
  },
  
  // External services
  services: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0
    }
  },
  
  // Maintenance mode
  maintenance: {
    enabled: process.env.MAINTENANCE_MODE === 'true',
    message: process.env.MAINTENANCE_MESSAGE || 'The system is currently under maintenance. Please try again later.',
    allowedIPs: process.env.MAINTENANCE_ALLOWED_IPS 
      ? process.env.MAINTENANCE_ALLOWED_IPS.split(',').map(ip => ip.trim())
      : []
  }
};
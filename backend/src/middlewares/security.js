const helmet = require('helmet');

// Security middleware configuration for production

// Get security configuration based on environment
const getSecurityMiddleware = (config) => {
  const isProduction = config.env === 'production';
  
  // Base helmet configuration
  const helmetConfig = {
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    } : false, // Disable CSP in development
    
    hsts: isProduction ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    } : false,
    
    // Additional security headers
    crossOriginEmbedderPolicy: isProduction,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  };
  
  return helmet(helmetConfig);
};

// Additional security headers middleware
const additionalSecurityHeaders = (config) => {
  return (req, res, next) => {
    // Add additional security headers for production
    if (config.env === 'production') {
      // Permissions Policy (formerly Feature-Policy)
      res.setHeader('Permissions-Policy', 
        'geolocation=(), midi=(), notifications=(), push=(), sync-xhr=(), microphone=(), camera=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=(self), payment=()'
      );
      
      // Additional cache control for security
      if (req.path.includes('/api/auth')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
      }
      
      // Expect-CT header for Certificate Transparency
      res.setHeader('Expect-CT', 'max-age=86400, enforce');
      
      // Additional XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
    }
    
    next();
  };
};

// Request ID middleware for tracking
const requestId = () => {
  return (req, res, next) => {
    const requestId = req.headers['x-request-id'] || 
                     `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.id = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  };
};

// IP filtering middleware for maintenance mode
const maintenanceMode = (config) => {
  return (req, res, next) => {
    if (config.maintenance && config.maintenance.enabled) {
      const clientIp = req.ip || req.connection.remoteAddress;
      const allowedIPs = config.maintenance.allowedIPs || [];
      
      if (!allowedIPs.includes(clientIp)) {
        return res.status(503).json({
          success: false,
          message: config.maintenance.message || 'Service temporarily unavailable',
          retryAfter: 3600
        });
      }
    }
    next();
  };
};

module.exports = {
  getSecurityMiddleware,
  additionalSecurityHeaders,
  requestId,
  maintenanceMode
};
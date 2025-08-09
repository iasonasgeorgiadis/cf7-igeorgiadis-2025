const app = require('./app');
const config = require('./config/app');
const { testConnection } = require('./config/database');

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Start server
    const server = app.listen(config.port, () => {
      console.log(`
========================================
LMS Backend Server Started
========================================
Environment: ${config.env}
URL: http://localhost:${config.port}
API Docs: http://localhost:${config.port}/api-docs
========================================
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
const { Pool } = require('pg');
require('dotenv').config();
const logger = require('../utils/logger');
const config = require('./app');

// Get database configuration based on environment
const getDatabaseConfig = () => {
  const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'lms_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  };
  
  if (config.env === 'production') {
    const prodConfig = require('./production').database;
    return {
      ...baseConfig,
      ...prodConfig,
      // Production-specific settings
      statement_timeout: 30000, // 30 seconds
      query_timeout: 30000,
      application_name: 'lms-backend',
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    };
  }
  
  // Development configuration
  return {
    ...baseConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  };
};

/**
 * PostgreSQL database connection pool configuration
 * @type {Pool}
 */
const pool = new Pool(getDatabaseConfig());

// Pool event handlers
pool.on('connect', (client) => {
  if (config.env === 'development') {
    logger.debug('New database client connected');
  }
});

pool.on('error', (err, client) => {
  logger.error('Unexpected database error on idle client', { error: err });
});

pool.on('remove', (client) => {
  if (config.env === 'development') {
    logger.debug('Database client removed');
  }
});

/**
 * Test database connection
 * @returns {Promise<void>}
 */
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    const poolStats = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    };
    client.release();
    logger.info('Database connected successfully', {
      timestamp: result.rows[0].now,
      poolStats
    });
  } catch (error) {
    logger.error('Database connection error', {
      error: error.message,
      code: error.code
    });
    throw error;
  }
};

/**
 * Execute a database query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
    } else if (duration > 1000) {
      // Log slow queries in production
      logger.warn('Slow query detected', {
        text: text.substring(0, 100) + '...',
        duration,
        rows: res.rowCount
      });
    }
    
    return res;
  } catch (error) {
    logger.error('Database query error', {
      query: text.substring(0, 100) + '...',
      error: error.message,
      code: error.code
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>}
 */
const getClient = () => {
  return pool.connect();
};

/**
 * Get pool statistics
 * @returns {Object} Pool statistics
 */
const getPoolStats = () => {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  };
};

/**
 * Gracefully close database connections
 * @returns {Promise<void>}
 */
const closePool = async () => {
  try {
    await pool.end();
    logger.info('Database pool closed gracefully');
  } catch (error) {
    logger.error('Error closing database pool', { error: error.message });
    throw error;
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database connections');
  await closePool();
});

module.exports = {
  pool,
  testConnection,
  query,
  getClient,
  getPoolStats,
  closePool
};
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * Test database helper for setting up and tearing down test database
 */
class TestDb {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.TEST_DB_NAME || 'lms_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });
  }

  /**
   * Run all migrations on test database
   */
  async runMigrations() {
    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        try {
          await this.pool.query(sql);
        } catch (error) {
          // Ignore errors for already existing types/tables
          if (!error.message.includes('already exists')) {
            throw error;
          }
        }
      }
    }
  }

  /**
   * Clean all tables in test database
   */
  async cleanTables() {
    const tables = [
      'submissions',
      'assignments',
      'lessons',
      'enrollments',
      'course_prerequisites',
      'courses',
      'users'
    ];

    for (const table of tables) {
      await this.pool.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }

  /**
   * Get a client for running transactions
   */
  async getClient() {
    return await this.pool.connect();
  }

  /**
   * Begin a transaction
   */
  async beginTransaction(client) {
    await client.query('BEGIN');
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
    client.release();
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(client) {
    await client.query('COMMIT');
    client.release();
  }
}

module.exports = new TestDb();
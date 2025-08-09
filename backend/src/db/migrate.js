const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');

// Initialize migrations table
const createMigrationsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  await pool.query(query);
};

// Get list of executed migrations
const getExecutedMigrations = async () => {
  const result = await pool.query('SELECT filename FROM migrations ORDER BY id');
  return result.rows.map(row => row.filename);
};

// Record migration execution
const recordMigration = async (filename) => {
  await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
};

// Run all pending migrations
const runMigrations = async () => {
  try {
    console.log('Starting database migrations...');
    
    // Create migrations table if not exists
    await createMigrationsTable();
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    
    // Get all migration files
    const migrationsPath = path.join(__dirname, '../../migrations');
    const files = await fs.readdir(migrationsPath);
    const migrationFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    // Run pending migrations
    let migrationsRun = 0;
    
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        console.log(`Running migration: ${file}`);
        
        const filePath = path.join(migrationsPath, file);
        const sql = await fs.readFile(filePath, 'utf8');
        
        // Start transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // Execute migration
          await client.query(sql);
          
          // Record migration
          await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
          
          await client.query('COMMIT');
          console.log(`✓ Migration ${file} completed`);
          migrationsRun++;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    }
    
    if (migrationsRun === 0) {
      console.log('No pending migrations');
    } else {
      console.log(`✓ ${migrationsRun} migration(s) completed successfully`);
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = {
  runMigrations
};
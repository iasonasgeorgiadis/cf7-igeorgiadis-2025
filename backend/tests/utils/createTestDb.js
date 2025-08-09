const { Client } = require('pg');

/**
 * Create test database if it doesn't exist
 */
async function createTestDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  try {
    await client.connect();
    
    // Check if test database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'lms_test'"
    );
    
    if (result.rows.length === 0) {
      console.log('Creating test database...');
      await client.query('CREATE DATABASE lms_test');
      console.log('Test database created successfully');
    } else {
      console.log('Test database already exists');
    }
  } catch (error) {
    console.error('Error creating test database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  createTestDatabase().catch(console.error);
}

module.exports = createTestDatabase;
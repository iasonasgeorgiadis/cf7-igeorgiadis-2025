const testDb = require('./utils/testDb');

/**
 * Global test setup
 */

// Increase test timeout for database operations
jest.setTimeout(30000);

// Setup before all tests
beforeAll(async () => {
  // Ensure we're using test database
  if (!process.env.TEST_DB_NAME) {
    process.env.TEST_DB_NAME = 'lms_test';
  }
  
  // Run migrations
  try {
    await testDb.runMigrations();
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
});

// Cleanup after each test
afterEach(async () => {
  // Clean all tables to ensure test isolation
  await testDb.cleanTables();
});

// Cleanup after all tests
afterAll(async () => {
  await testDb.close();
});

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};
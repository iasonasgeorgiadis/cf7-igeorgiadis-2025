const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const config = require('../config/app');

// Seed the database with test data
const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seeding...');
    
    await client.query('BEGIN');

    // Clear existing data
    console.log('Clearing existing data...');
    await client.query('DELETE FROM submissions');
    await client.query('DELETE FROM assignments');
    await client.query('DELETE FROM lessons');
    await client.query('DELETE FROM enrollments');
    await client.query('DELETE FROM course_prerequisites');
    await client.query('DELETE FROM courses');
    await client.query('DELETE FROM users');

    // Create test users
    console.log('Creating test users...');
    
    const instructorPassword = await bcrypt.hash('TeachPass123!', config.bcrypt.saltRounds);
    const studentPassword = await bcrypt.hash('StudyPass123!', config.bcrypt.saltRounds);

    const instructorResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['instructor@lms.com', instructorPassword, 'John', 'Doe', 'instructor']);

    const instructor2Result = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['instructor2@lms.com', instructorPassword, 'Jane', 'Smith', 'instructor']);

    const studentResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['student@lms.com', studentPassword, 'Alice', 'Johnson', 'student']);

    const student2Result = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['student2@lms.com', studentPassword, 'Bob', 'Williams', 'student']);

    const instructorId = instructorResult.rows[0].id;
    const instructor2Id = instructor2Result.rows[0].id;
    const studentId = studentResult.rows[0].id;
    const student2Id = student2Result.rows[0].id;

    // Create test courses
    console.log('Creating test courses...');
    
    const jsBasicsResult = await client.query(`
      INSERT INTO courses (title, description, capacity, instructor_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      'JavaScript Basics',
      'Learn the fundamentals of JavaScript programming',
      30,
      instructorId
    ]);

    const reactResult = await client.query(`
      INSERT INTO courses (title, description, capacity, instructor_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      'Advanced React',
      'Master React.js with hooks, context, and advanced patterns',
      25,
      instructor2Id
    ]);

    const nodeResult = await client.query(`
      INSERT INTO courses (title, description, capacity, instructor_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      'Node.js Development',
      'Build server-side applications with Node.js and Express',
      20,
      instructorId
    ]);

    const jsBasicsId = jsBasicsResult.rows[0].id;
    const reactId = reactResult.rows[0].id;
    const nodeId = nodeResult.rows[0].id;

    // Create course prerequisites
    console.log('Creating course prerequisites...');
    
    // React requires JS Basics
    await client.query(`
      INSERT INTO course_prerequisites (course_id, prerequisite_id)
      VALUES ($1, $2)
    `, [reactId, jsBasicsId]);

    // Node.js requires JS Basics
    await client.query(`
      INSERT INTO course_prerequisites (course_id, prerequisite_id)
      VALUES ($1, $2)
    `, [nodeId, jsBasicsId]);

    // Create enrollments
    console.log('Creating enrollments...');
    
    await client.query(`
      INSERT INTO enrollments (student_id, course_id, status)
      VALUES ($1, $2, $3)
    `, [studentId, jsBasicsId, 'active']);

    await client.query(`
      INSERT INTO enrollments (student_id, course_id, status)
      VALUES ($1, $2, $3)
    `, [student2Id, jsBasicsId, 'active']);

    await client.query(`
      INSERT INTO enrollments (student_id, course_id, status)
      VALUES ($1, $2, $3)
    `, [studentId, reactId, 'active']);

    // Create lessons
    console.log('Creating lessons...');
    
    await client.query(`
      INSERT INTO lessons (course_id, title, content, "order", duration)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      jsBasicsId,
      'Introduction to JavaScript',
      'Learn about JavaScript history, setup, and basic syntax',
      1,
      45
    ]);

    await client.query(`
      INSERT INTO lessons (course_id, title, content, "order", duration)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      jsBasicsId,
      'Variables and Data Types',
      'Understanding let, const, var and JavaScript data types',
      2,
      60
    ]);

    await client.query('COMMIT');
    
    console.log('✓ Database seeded successfully!');
    console.log('\nTest users created:');
    console.log('- Instructor: instructor@lms.com / TeachPass123!');
    console.log('- Instructor 2: instructor2@lms.com / TeachPass123!');
    console.log('- Student: student@lms.com / StudyPass123!');
    console.log('- Student 2: student2@lms.com / StudyPass123!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };
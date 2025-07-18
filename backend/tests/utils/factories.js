const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/**
 * Test data factories for generating test objects
 */
const factories = {
  /**
   * Create a test user object
   */
  user: (overrides = {}) => ({
    id: uuidv4(),
    email: `test${Date.now()}@example.com`,
    password: 'TestPass123!',
    first_name: 'Test',
    last_name: 'User',
    role: 'student',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),

  /**
   * Create a test user with hashed password
   */
  userWithHash: async (overrides = {}) => {
    const user = factories.user(overrides);
    const password_hash = await bcrypt.hash(user.password, 10);
    delete user.password;
    return { ...user, password_hash };
  },

  /**
   * Create a test course object
   */
  course: (overrides = {}) => ({
    id: uuidv4(),
    title: `Test Course ${Date.now()}`,
    description: 'This is a test course description',
    capacity: 30,
    instructor_id: overrides.instructor_id || uuidv4(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),

  /**
   * Create a test enrollment object
   */
  enrollment: (overrides = {}) => {
    const enrollmentData = {
      id: uuidv4(),
      student_id: overrides.student_id || uuidv4(),
      course_id: overrides.course_id || uuidv4(),
      enrollment_date: new Date(),
      status: 'active',
      completion_percentage: 0,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
    
    // Add toJSON method to mimic the Enrollment model
    enrollmentData.toJSON = function() {
      return { ...this };
    };
    
    return enrollmentData;
  },

  /**
   * Create a test lesson object
   */
  lesson: (overrides = {}) => ({
    id: uuidv4(),
    course_id: overrides.course_id || uuidv4(),
    title: `Test Lesson ${Date.now()}`,
    description: 'This is a test lesson',
    content: 'Test lesson content goes here',
    order_number: 1,
    duration_minutes: 30,
    is_published: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),

  /**
   * Create a test assignment object
   */
  assignment: (overrides = {}) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
    
    return {
      id: uuidv4(),
      lesson_id: overrides.lesson_id || uuidv4(),
      title: `Test Assignment ${Date.now()}`,
      description: 'This is a test assignment',
      instructions: 'Complete the following tasks...',
      max_points: 100,
      due_date: dueDate,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };
  },

  /**
   * Create a test submission object
   */
  submission: (overrides = {}) => ({
    id: uuidv4(),
    assignment_id: overrides.assignment_id || uuidv4(),
    student_id: overrides.student_id || uuidv4(),
    content: 'This is my test submission',
    submitted_at: new Date(),
    grade: null,
    feedback: null,
    graded_at: null,
    graded_by: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides
  }),

  /**
   * Create JWT tokens for testing
   */
  tokens: (userId, role = 'student') => ({
    accessToken: `test-access-token-${userId}`,
    refreshToken: `test-refresh-token-${userId}`,
    user: {
      userId,
      role,
      email: `test${userId}@example.com`
    }
  })
};

module.exports = factories;
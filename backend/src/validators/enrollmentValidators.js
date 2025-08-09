const { body, param, query } = require('express-validator');

// Validation middleware for enrollment routes

/**
 * Validate enroll request
 */
const validateEnroll = [
  body('course_id')
    .isUUID()
    .withMessage('Invalid course ID format')
];

/**
 * Validate drop course request
 */
const validateDrop = [
  body('course_id')
    .isUUID()
    .withMessage('Invalid course ID format')
];

/**
 * Validate course ID parameter
 */
const validateCourseIdParam = [
  param('courseId')
    .isUUID()
    .withMessage('Invalid course ID format')
];

/**
 * Validate enrollment status query
 */
const validateStatusQuery = [
  query('status')
    .optional()
    .isIn(['active', 'completed', 'dropped'])
    .withMessage('Status must be one of: active, completed, dropped')
];

module.exports = {
  validateEnroll,
  validateDrop,
  validateCourseIdParam,
  validateStatusQuery
};
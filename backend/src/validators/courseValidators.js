const { body, param, query } = require('express-validator');

/**
 * Validation middleware for course routes
 */

/**
 * Validate course ID parameter
 */
const validateCourseId = [
  param('id')
    .isUUID()
    .withMessage('Invalid course ID format')
];

/**
 * Validate create course request
 */
const validateCreateCourse = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Course description is required')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  
  body('capacity')
    .isInt({ min: 1, max: 500 })
    .withMessage('Capacity must be between 1 and 500'),
  
  body('prerequisiteIds')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        return value.every(id => 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        );
      }
      return true;
    })
    .withMessage('All prerequisite IDs must be valid UUIDs')
];

/**
 * Validate update course request
 */
const validateUpdateCourse = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Capacity must be between 1 and 500'),
  
  body('prerequisiteIds')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        return value.every(id => 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        );
      }
      return true;
    })
    .withMessage('All prerequisite IDs must be valid UUIDs')
];

/**
 * Validate course query parameters
 */
const validateCourseQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('instructor_id')
    .optional()
    .isUUID()
    .withMessage('Invalid instructor ID format'),
  
  query('available_only')
    .optional()
    .isBoolean()
    .withMessage('available_only must be true or false')
];

module.exports = {
  validateCourseId,
  validateCreateCourse,
  validateUpdateCourse,
  validateCourseQuery
};
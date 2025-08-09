const { body, param, query } = require('express-validator');

// Validation middleware for assignment routes

// Validate assignment ID parameter
const validateAssignmentId = [
  param('id')
    .isUUID()
    .withMessage('Invalid assignment ID format')
];

// Validate lesson ID parameter
const validateLessonId = [
  param('lessonId')
    .isUUID()
    .withMessage('Invalid lesson ID format')
];

// Validate create assignment request
const validateCreateAssignment = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  
  body('due_date')
    .notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  
  body('points')
    .isInt({ min: 1, max: 100 }).withMessage('Points must be between 1 and 100')
];

// Validate update assignment request
const validateUpdateAssignment = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters long'),
  
  body('due_date')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  
  body('points')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Points must be between 1 and 100')
];

// Validate upcoming assignments query
const validateUpcomingQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
];

module.exports = {
  validateAssignmentId,
  validateLessonId,
  validateCreateAssignment,
  validateUpdateAssignment,
  validateUpcomingQuery
};
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware for lesson routes

// Validate course ID parameter
const validateCourseId = [
  param('courseId')
    .isUUID()
    .withMessage('Invalid course ID format')
];

// Validate lesson ID parameter
const validateLessonId = [
  param('id')
    .isUUID()
    .withMessage('Invalid lesson ID format')
];

// Validate create lesson request
const validateCreateLesson = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
  
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 10 }).withMessage('Content must be at least 10 characters long'),
  
  body('duration')
    .isInt({ min: 1, max: 480 }).withMessage('Duration must be between 1 and 480 minutes'),
  
  body('order')
    .optional()
    .isInt({ min: 1 }).withMessage('Order must be a positive integer')
];

// Validate update lesson request
const validateUpdateLesson = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
  
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10 }).withMessage('Content must be at least 10 characters long'),
  
  body('duration')
    .optional()
    .isInt({ min: 1, max: 480 }).withMessage('Duration must be between 1 and 480 minutes'),
  
  body('order')
    .optional()
    .isInt({ min: 1 }).withMessage('Order must be a positive integer')
];

// Validate reorder lessons request
const validateReorderLessons = [
  body('lessons')
    .isArray({ min: 1 }).withMessage('Lessons array is required')
    .custom((lessons) => {
      // Check if each item has required properties
      for (const lesson of lessons) {
        if (!lesson.lessonId || !lesson.order) {
          throw new Error('Each lesson must have lessonId and order');
        }
        if (typeof lesson.order !== 'number' || lesson.order < 1) {
          throw new Error('Order must be a positive integer');
        }
      }
      
      // Check for duplicate orders
      const orders = lessons.map(l => l.order);
      if (new Set(orders).size !== orders.length) {
        throw new Error('Duplicate order values are not allowed');
      }
      
      return true;
    })
];

module.exports = {
  validateCourseId,
  validateLessonId,
  validateCreateLesson,
  validateUpdateLesson,
  validateReorderLessons
};
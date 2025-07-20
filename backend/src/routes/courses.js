const express = require('express');
const router = express.Router();
const courseController = require('../controllers/CourseController');
const { authenticate, authorize, optionalAuth } = require('../middlewares/auth');
const { checkValidation } = require('../validators/authValidators');
const {
  validateCourseId,
  validateCreateCourse,
  validateUpdateCourse,
  validateCourseQuery
} = require('../validators/courseValidators');

/**
 * Course routes
 * Base path: /api/courses
 */

// Public routes (with optional auth for enrollment status)
router.get('/', 
  optionalAuth,
  validateCourseQuery, 
  checkValidation, 
  courseController.getAllCourses
);

// Protected routes requiring authentication
router.use(authenticate);

// Instructor routes - MUST come before /:id route
router.get('/my-courses',
  authorize('instructor'),
  courseController.getMyCourses
);

// Public route with optional auth (moved after specific routes)
router.get('/:id', 
  optionalAuth,
  validateCourseId, 
  checkValidation, 
  courseController.getCourseById
);

// Check prerequisites (student)
router.get('/:id/prerequisites/check',
  validateCourseId,
  checkValidation,
  courseController.checkPrerequisites
);

router.post('/', 
  authorize('instructor'),
  validateCreateCourse, 
  checkValidation, 
  courseController.createCourse
);

router.put('/:id', 
  authorize('instructor'),
  validateCourseId,
  validateUpdateCourse, 
  checkValidation, 
  courseController.updateCourse
);

router.delete('/:id', 
  authorize('instructor'),
  validateCourseId, 
  checkValidation, 
  courseController.deleteCourse
);

module.exports = router;
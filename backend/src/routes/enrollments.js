const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/EnrollmentController');
const { authenticate, authorize } = require('../middlewares/auth');
const { checkValidation } = require('../validators/authValidators');
const {
  validateEnroll,
  validateDrop,
  validateCourseIdParam,
  validateStatusQuery
} = require('../validators/enrollmentValidators');

/**
 * Enrollment routes
 * Base path: /api/enrollments
 */

// All routes require authentication
router.use(authenticate);

// Student routes
router.post('/enroll',
  authorize('student'),
  validateEnroll,
  checkValidation,
  enrollmentController.enrollInCourse
);

router.post('/drop',
  authorize('student'),
  validateDrop,
  checkValidation,
  enrollmentController.dropCourse
);

router.get('/my-courses',
  authorize('student'),
  validateStatusQuery,
  checkValidation,
  enrollmentController.getMyCourses
);

router.get('/statistics',
  authorize('student'),
  enrollmentController.getStatistics
);

router.get('/check-eligibility/:courseId',
  authorize('student'),
  validateCourseIdParam,
  checkValidation,
  enrollmentController.checkEligibility
);

// Instructor routes
router.get('/course/:courseId',
  authorize('instructor'),
  validateCourseIdParam,
  checkValidation,
  enrollmentController.getCourseEnrollments
);

module.exports = router;
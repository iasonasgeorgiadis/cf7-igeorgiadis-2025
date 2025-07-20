const express = require('express');
const router = express.Router();
const AssignmentController = require('../controllers/AssignmentController');
const { authenticate, authorize } = require('../middlewares/auth');
const { checkValidation } = require('../validators/authValidators');
const { validateCourseId } = require('../validators/lessonValidators');
const {
  validateAssignmentId,
  validateLessonId,
  validateCreateAssignment,
  validateUpdateAssignment,
  validateUpcomingQuery
} = require('../validators/assignmentValidators');

// Initialize controller with database
const db = require('../config/database');
const assignmentController = new AssignmentController(db);

/**
 * Assignment routes
 * Base path: /api
 */

// All routes require authentication
router.use(authenticate);

// Student-specific routes (must come before :id routes to avoid conflicts)
router.get('/assignments/upcoming',
  authorize('student'),
  validateUpcomingQuery,
  checkValidation,
  assignmentController.getUpcomingAssignments.bind(assignmentController)
);

// Instructor statistics route
router.get('/assignments/stats',
  authorize('instructor'),
  assignmentController.getInstructorStats.bind(assignmentController)
);

// Course assignment routes
router.get('/courses/:courseId/assignments',
  validateCourseId,
  checkValidation,
  assignmentController.getCourseAssignments.bind(assignmentController)
);

// Lesson assignment routes
router.get('/lessons/:lessonId/assignments',
  validateLessonId,
  checkValidation,
  assignmentController.getLessonAssignments.bind(assignmentController)
);

router.post('/lessons/:lessonId/assignments',
  authorize('instructor'),
  validateLessonId,
  validateCreateAssignment,
  checkValidation,
  assignmentController.createAssignment.bind(assignmentController)
);

// Individual assignment routes
router.get('/assignments/:id',
  validateAssignmentId,
  checkValidation,
  assignmentController.getAssignmentById.bind(assignmentController)
);

router.put('/assignments/:id',
  authorize('instructor'),
  validateAssignmentId,
  validateUpdateAssignment,
  checkValidation,
  assignmentController.updateAssignment.bind(assignmentController)
);

router.delete('/assignments/:id',
  authorize('instructor'),
  validateAssignmentId,
  checkValidation,
  assignmentController.deleteAssignment.bind(assignmentController)
);

module.exports = router;
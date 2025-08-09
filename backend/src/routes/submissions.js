const express = require('express');
const router = express.Router();
const SubmissionController = require('../controllers/SubmissionController');
const { authenticate, authorize } = require('../middlewares/auth');
const { checkValidation } = require('../validators/authValidators');
const { validateCourseId } = require('../validators/lessonValidators');
const {
  validateSubmissionId,
  validateAssignmentId,
  validateSubmitAssignment,
  validateGradeSubmission,
  validatePendingQuery
} = require('../validators/submissionValidators');

// Initialize controller with database
const db = require('../config/database');
const submissionController = new SubmissionController(db);

/**
 * Submission routes
 * Base path: /api
 */

// All routes require authentication
router.use(authenticate);

// Instructor-specific routes (must come before :id routes to avoid conflicts)
router.get('/submissions/pending',
  authorize('instructor'),
  validatePendingQuery,
  checkValidation,
  submissionController.getPendingSubmissions.bind(submissionController)
);

// Assignment submission routes
router.get('/assignments/:assignmentId/submissions',
  authorize('instructor'),
  validateAssignmentId,
  checkValidation,
  submissionController.getAssignmentSubmissions.bind(submissionController)
);

router.get('/assignments/:assignmentId/submission',
  authorize('student'),
  validateAssignmentId,
  checkValidation,
  submissionController.getStudentSubmission.bind(submissionController)
);

router.post('/assignments/:assignmentId/submit',
  authorize('student'),
  validateAssignmentId,
  validateSubmitAssignment,
  checkValidation,
  submissionController.submitAssignment.bind(submissionController)
);

// Course submission routes
router.get('/courses/:courseId/submissions',
  authorize('student'),
  validateCourseId,
  checkValidation,
  submissionController.getStudentCourseSubmissions.bind(submissionController)
);

router.get('/courses/:courseId/submission-stats',
  authorize('instructor'),
  validateCourseId,
  checkValidation,
  submissionController.getCourseStats.bind(submissionController)
);

// Individual submission routes
router.get('/submissions/:id',
  validateSubmissionId,
  checkValidation,
  submissionController.getSubmissionById.bind(submissionController)
);

router.put('/submissions/:id/grade',
  authorize('instructor'),
  validateSubmissionId,
  validateGradeSubmission,
  checkValidation,
  submissionController.gradeSubmission.bind(submissionController)
);

router.delete('/submissions/:id',
  validateSubmissionId,
  checkValidation,
  submissionController.deleteSubmission.bind(submissionController)
);

module.exports = router;
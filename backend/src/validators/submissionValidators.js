const { body, param, query } = require('express-validator');

// Validation middleware for submission routes

// Validate submission ID parameter
const validateSubmissionId = [
  param('id')
    .isUUID()
    .withMessage('Invalid submission ID format')
];

// Validate assignment ID parameter
const validateAssignmentId = [
  param('assignmentId')
    .isUUID()
    .withMessage('Invalid assignment ID format')
];

// Validate submit assignment request
const validateSubmitAssignment = [
  body('content')
    .trim()
    .notEmpty().withMessage('Submission content is required')
    .isLength({ min: 10 }).withMessage('Submission content must be at least 10 characters long')
];

// Validate grade submission request
const validateGradeSubmission = [
  body('grade')
    .isFloat({ min: 0 }).withMessage('Grade must be a non-negative number')
    .custom((value, { req }) => {
      // We'll validate against max points in the service layer
      // since we need to fetch the assignment details
      return true;
    }),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Feedback must be at least 3 characters long if provided')
];

// Validate pending submissions query
const validatePendingQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
];

module.exports = {
  validateSubmissionId,
  validateAssignmentId,
  validateSubmitAssignment,
  validateGradeSubmission,
  validatePendingQuery
};
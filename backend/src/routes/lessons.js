const express = require('express');
const router = express.Router();
const LessonController = require('../controllers/LessonController');
const { authenticate, authorize } = require('../middlewares/auth');
const { checkValidation } = require('../validators/authValidators');
const {
  validateCourseId,
  validateLessonId,
  validateCreateLesson,
  validateUpdateLesson,
  validateReorderLessons
} = require('../validators/lessonValidators');

// Initialize controller with database
const db = require('../config/database');
const lessonController = new LessonController(db);

/**
 * Lesson routes
 * Base path: /api
 */

// All routes require authentication
router.use(authenticate);

// Course lesson routes
router.get('/courses/:courseId/lessons',
  validateCourseId,
  checkValidation,
  lessonController.getCourseLessons.bind(lessonController)
);

router.post('/courses/:courseId/lessons',
  authorize('instructor'),
  validateCourseId,
  validateCreateLesson,
  checkValidation,
  lessonController.createLesson.bind(lessonController)
);

router.put('/courses/:courseId/lessons/reorder',
  authorize('instructor'),
  validateCourseId,
  validateReorderLessons,
  checkValidation,
  lessonController.reorderLessons.bind(lessonController)
);

router.get('/courses/:courseId/lessons/progress',
  authorize('student'),
  validateCourseId,
  checkValidation,
  lessonController.getLessonProgress.bind(lessonController)
);

// Individual lesson routes
router.get('/lessons/:id',
  validateLessonId,
  checkValidation,
  lessonController.getLessonById.bind(lessonController)
);

router.put('/lessons/:id',
  authorize('instructor'),
  validateLessonId,
  validateUpdateLesson,
  checkValidation,
  lessonController.updateLesson.bind(lessonController)
);

router.delete('/lessons/:id',
  authorize('instructor'),
  validateLessonId,
  checkValidation,
  lessonController.deleteLesson.bind(lessonController)
);

module.exports = router;
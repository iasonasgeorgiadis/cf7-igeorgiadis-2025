const LessonService = require('../services/LessonService');

/**
 * Lesson controller
 */
class LessonController {
  constructor(db) {
    this.lessonService = new LessonService(db);
  }

  /**
   * Get all lessons for a course
   * GET /api/courses/:courseId/lessons
   */
  async getCourseLessons(req, res, next) {
    try {
      const { courseId } = req.params;
      const { userId, role } = req.user;

      const result = await this.lessonService.getCourseLessons(
        courseId,
        userId,
        role
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific lesson
   * GET /api/lessons/:id
   */
  async getLessonById(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      const lesson = await this.lessonService.getLessonById(id, userId, role);

      res.json({
        success: true,
        data: { lesson }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new lesson
   * POST /api/courses/:courseId/lessons
   * Instructor only
   */
  async createLesson(req, res, next) {
    try {
      const { courseId } = req.params;
      const lessonData = req.body;
      const instructorId = req.user.userId;

      const lesson = await this.lessonService.createLesson(
        courseId,
        lessonData,
        instructorId
      );

      res.status(201).json({
        success: true,
        data: { lesson },
        message: 'Lesson created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a lesson
   * PUT /api/lessons/:id
   * Instructor only
   */
  async updateLesson(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const instructorId = req.user.userId;

      const lesson = await this.lessonService.updateLesson(
        id,
        updateData,
        instructorId
      );

      res.json({
        success: true,
        data: { lesson },
        message: 'Lesson updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a lesson
   * DELETE /api/lessons/:id
   * Instructor only
   */
  async deleteLesson(req, res, next) {
    try {
      const { id } = req.params;
      const instructorId = req.user.userId;

      const success = await this.lessonService.deleteLesson(id, instructorId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      }

      res.json({
        success: true,
        message: 'Lesson deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder lessons in a course
   * PUT /api/courses/:courseId/lessons/reorder
   * Instructor only
   */
  async reorderLessons(req, res, next) {
    try {
      const { courseId } = req.params;
      const { lessons } = req.body; // Array of {lessonId, order}
      const instructorId = req.user.userId;

      await this.lessonService.reorderLessons(courseId, lessons, instructorId);

      res.json({
        success: true,
        message: 'Lessons reordered successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get lesson progress for current student
   * GET /api/courses/:courseId/lessons/progress
   * Student only
   */
  async getLessonProgress(req, res, next) {
    try {
      const { courseId } = req.params;
      const studentId = req.user.userId;

      const progress = await this.lessonService.getLessonProgress(
        courseId,
        studentId
      );

      res.json({
        success: true,
        data: { progress }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = LessonController;
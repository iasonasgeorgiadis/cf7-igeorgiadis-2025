const AssignmentService = require('../services/AssignmentService');

/**
 * Assignment controller
 */
class AssignmentController {
  constructor(db) {
    this.assignmentService = new AssignmentService(db);
  }

  /**
   * Get all assignments for a lesson
   * GET /api/lessons/:lessonId/assignments
   */
  async getLessonAssignments(req, res, next) {
    try {
      const { lessonId } = req.params;
      const { userId, role } = req.user;

      const result = await this.assignmentService.getLessonAssignments(
        lessonId,
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
   * Get all assignments for a course
   * GET /api/courses/:courseId/assignments
   */
  async getCourseAssignments(req, res, next) {
    try {
      const { courseId } = req.params;
      const { userId, role } = req.user;

      const result = await this.assignmentService.getCourseAssignments(
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
   * Get a specific assignment
   * GET /api/assignments/:id
   */
  async getAssignmentById(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      const assignment = await this.assignmentService.getAssignmentById(
        id,
        userId,
        role
      );

      res.json({
        success: true,
        data: { assignment }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get upcoming assignments for current student
   * GET /api/assignments/upcoming
   * Student only
   */
  async getUpcomingAssignments(req, res, next) {
    try {
      const studentId = req.user.userId;
      const { limit = 5 } = req.query;

      const assignments = await this.assignmentService.getUpcomingAssignments(
        studentId,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: { assignments }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new assignment
   * POST /api/lessons/:lessonId/assignments
   * Instructor only
   */
  async createAssignment(req, res, next) {
    try {
      const { lessonId } = req.params;
      const assignmentData = req.body;
      const instructorId = req.user.userId;

      const assignment = await this.assignmentService.createAssignment(
        lessonId,
        assignmentData,
        instructorId
      );

      res.status(201).json({
        success: true,
        data: { assignment },
        message: 'Assignment created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an assignment
   * PUT /api/assignments/:id
   * Instructor only
   */
  async updateAssignment(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const instructorId = req.user.userId;

      const assignment = await this.assignmentService.updateAssignment(
        id,
        updateData,
        instructorId
      );

      res.json({
        success: true,
        data: { assignment },
        message: 'Assignment updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an assignment
   * DELETE /api/assignments/:id
   * Instructor only
   */
  async deleteAssignment(req, res, next) {
    try {
      const { id } = req.params;
      const instructorId = req.user.userId;

      const success = await this.assignmentService.deleteAssignment(
        id,
        instructorId
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      res.json({
        success: true,
        message: 'Assignment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get assignment statistics for instructor
   * GET /api/assignments/stats
   * Instructor only
   */
  async getInstructorStats(req, res, next) {
    try {
      const instructorId = req.user.userId;

      const stats = await this.assignmentService.getInstructorStats(instructorId);

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AssignmentController;
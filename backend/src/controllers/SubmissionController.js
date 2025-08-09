const SubmissionService = require('../services/SubmissionService');

/**
 * Submission controller
 */
class SubmissionController {
  constructor(db) {
    this.submissionService = new SubmissionService(db);
  }

  /**
   * Get a specific submission
   * GET /api/submissions/:id
   */
  async getSubmissionById(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      const submission = await this.submissionService.getSubmissionById(
        id,
        userId,
        role
      );

      res.json({
        success: true,
        data: { submission }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all submissions for an assignment
   * GET /api/assignments/:assignmentId/submissions
   * Instructor only
   */
  async getAssignmentSubmissions(req, res, next) {
    try {
      const { assignmentId } = req.params;
      const instructorId = req.user.userId;

      const result = await this.submissionService.getAssignmentSubmissions(
        assignmentId,
        instructorId
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
   * Get student's submission for an assignment
   * GET /api/assignments/:assignmentId/submission
   * Student only
   */
  async getStudentSubmission(req, res, next) {
    try {
      const { assignmentId } = req.params;
      const studentId = req.user.userId;

      const result = await this.submissionService.getStudentSubmission(
        assignmentId,
        studentId
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
   * Get all submissions for a student in a course
   * GET /api/courses/:courseId/submissions
   * Student only
   */
  async getStudentCourseSubmissions(req, res, next) {
    try {
      const { courseId } = req.params;
      const studentId = req.user.userId;

      const result = await this.submissionService.getStudentCourseSubmissions(
        courseId,
        studentId
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
   * Submit an assignment
   * POST /api/assignments/:assignmentId/submit
   * Student only
   */
  async submitAssignment(req, res, next) {
    try {
      const { assignmentId } = req.params;
      const { content } = req.body;
      const studentId = req.user.userId;

      const submission = await this.submissionService.submitAssignment(
        assignmentId,
        studentId,
        content
      );

      res.status(201).json({
        success: true,
        data: { submission },
        message: 'Assignment submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Grade a submission
   * PUT /api/submissions/:id/grade
   * Instructor only
   */
  async gradeSubmission(req, res, next) {
    try {
      const { id } = req.params;
      const { grade, feedback } = req.body;
      const instructorId = req.user.userId;

      const submission = await this.submissionService.gradeSubmission(
        id,
        instructorId,
        grade,
        feedback
      );

      res.json({
        success: true,
        data: { submission },
        message: 'Submission graded successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a submission
   * DELETE /api/submissions/:id
   */
  async deleteSubmission(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      const success = await this.submissionService.deleteSubmission(
        id,
        userId,
        role
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      res.json({
        success: true,
        message: 'Submission deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get course submission statistics
   * GET /api/courses/:courseId/submission-stats
   * Instructor only
   */
  async getCourseStats(req, res, next) {
    try {
      const { courseId } = req.params;
      const instructorId = req.user.userId;

      const result = await this.submissionService.getCourseStats(
        courseId,
        instructorId
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
   * Get pending submissions for instructor
   * GET /api/submissions/pending
   * Instructor only
   */
  async getPendingSubmissions(req, res, next) {
    try {
      const instructorId = req.user.userId;
      const { limit = 10 } = req.query;

      const submissions = await this.submissionService.getPendingSubmissions(
        instructorId,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: { submissions }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SubmissionController;
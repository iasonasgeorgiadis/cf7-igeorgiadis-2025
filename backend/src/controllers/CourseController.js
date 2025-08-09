const courseService = require('../services/CourseService');

/**
 * Course controller handling HTTP requests
 */
class CourseController {
  /**
   * Get all courses
   * GET /api/courses
   */
  async getAllCourses(req, res, next) {
    try {
      const { page, limit, search, instructor_id, available_only } = req.query;
      
      // Pass student ID if user is a student to check enrollment status
      const studentId = req.user && req.user.role === 'student' ? req.user.userId : null;
      
      const result = await courseService.getAllCourses({
        page,
        limit,
        search,
        instructor_id,
        available_only: available_only === 'true'
      }, studentId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get course by ID
   * GET /api/courses/:id
   */
  async getCourseById(req, res, next) {
    try {
      const course = await courseService.getCourseById(req.params.id);

      res.json({
        success: true,
        data: {
          course: course.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new course
   * POST /api/courses
   */
  async createCourse(req, res, next) {
    try {
      const course = await courseService.createCourse(
        req.body,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        data: {
          course: course.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update course
   * PUT /api/courses/:id
   */
  async updateCourse(req, res, next) {
    try {
      const course = await courseService.updateCourse(
        req.params.id,
        req.body,
        req.user.userId,
        req.user.role
      );

      res.json({
        success: true,
        data: {
          course: course.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete course
   * DELETE /api/courses/:id
   */
  async deleteCourse(req, res, next) {
    try {
      await courseService.deleteCourse(
        req.params.id,
        req.user.userId,
        req.user.role
      );

      res.json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get instructor's courses
   * GET /api/courses/my-courses
   */
  async getMyCourses(req, res, next) {
    try {
      if (req.user.role !== 'instructor') {
        return res.status(403).json({
          success: false,
          message: 'Only instructors can access this endpoint'
        });
      }

      const courses = await courseService.getCoursesByInstructor(req.user.userId);

      res.json({
        success: true,
        data: {
          courses
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check prerequisites for a course
   * GET /api/courses/:id/prerequisites/check
   */
  async checkPrerequisites(req, res, next) {
    try {
      const result = await courseService.checkPrerequisites(
        req.params.id,
        req.user.userId
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CourseController();
const enrollmentService = require('../services/EnrollmentService');

/**
 * Enrollment controller handling HTTP requests
 */
class EnrollmentController {
  /**
   * Enroll in a course
   * POST /api/enrollments/enroll
   */
  async enrollInCourse(req, res, next) {
    try {
      const { course_id } = req.body;
      
      if (req.user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Only students can enroll in courses'
        });
      }

      const enrollment = await enrollmentService.enrollStudent(
        req.user.userId,
        course_id
      );

      res.status(201).json({
        success: true,
        message: 'Successfully enrolled in course',
        data: {
          enrollment: enrollment.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Drop a course
   * POST /api/enrollments/drop
   */
  async dropCourse(req, res, next) {
    try {
      const { course_id } = req.body;
      
      if (req.user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Only students can drop courses'
        });
      }

      await enrollmentService.dropCourse(
        req.user.userId,
        course_id
      );

      res.json({
        success: true,
        message: 'Successfully dropped the course'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my enrollments (student)
   * GET /api/enrollments/my-courses
   */
  async getMyCourses(req, res, next) {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is for students only'
        });
      }

      const { status } = req.query;
      const enrollments = await enrollmentService.getStudentEnrollments(
        req.user.userId,
        status
      );

      res.json({
        success: true,
        data: {
          enrollments
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get course enrollments (instructor)
   * GET /api/enrollments/course/:courseId
   */
  async getCourseEnrollments(req, res, next) {
    try {
      if (req.user.role !== 'instructor') {
        return res.status(403).json({
          success: false,
          message: 'Only instructors can view course enrollments'
        });
      }

      const enrollments = await enrollmentService.getCourseEnrollments(
        req.params.courseId,
        req.user.userId
      );

      res.json({
        success: true,
        data: {
          enrollments,
          total: enrollments.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student statistics
   * GET /api/enrollments/statistics
   */
  async getStatistics(req, res, next) {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is for students only'
        });
      }

      const statistics = await enrollmentService.getStudentStatistics(
        req.user.userId
      );

      res.json({
        success: true,
        data: {
          statistics
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check enrollment eligibility
   * GET /api/enrollments/check-eligibility/:courseId
   */
  async checkEligibility(req, res, next) {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is for students only'
        });
      }

      const eligibility = await enrollmentService.checkEnrollmentEligibility(
        req.user.userId,
        req.params.courseId
      );

      res.json({
        success: true,
        data: eligibility
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EnrollmentController();
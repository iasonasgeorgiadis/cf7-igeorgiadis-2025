const enrollmentRepository = require('../repositories/EnrollmentRepository');
const courseRepository = require('../repositories/CourseRepository');
const { getClient } = require('../config/database');

/**
 * Enrollment service for business logic
 */
class EnrollmentService {
  /**
   * Enroll student in a course
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Enrollment>} Created enrollment
   */
  async enrollStudent(studentId, courseId) {
    // Use transaction for atomic operations
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Check if already enrolled
      const existingEnrollment = await enrollmentRepository.findByStudentAndCourse(studentId, courseId);
      if (existingEnrollment) {
        if (existingEnrollment.status === 'active') {
          throw new Error('You are already enrolled in this course');
        } else if (existingEnrollment.status === 'completed') {
          throw new Error('You have already completed this course');
        } else if (existingEnrollment.status === 'dropped') {
          // Allow re-enrollment if previously dropped
          existingEnrollment.status = 'active';
          existingEnrollment.enrollment_date = new Date();
          const updated = await enrollmentRepository.update(existingEnrollment.id, {
            status: 'active'
          });
          await client.query('COMMIT');
          return updated;
        }
      }

      // Get course details
      const course = await courseRepository.findById(courseId, true);
      if (!course) {
        throw new Error('Course not found');
      }

      // Check capacity
      const activeEnrollments = await enrollmentRepository.countActiveByCourse(courseId);
      if (activeEnrollments >= course.capacity) {
        throw new Error('Course is full');
      }

      // Check prerequisites
      const prerequisites = await courseRepository.getPrerequisites(courseId);
      if (prerequisites.length > 0) {
        const prerequisiteIds = prerequisites.map(p => p.id);
        const hasCompleted = await enrollmentRepository.hasCompletedPrerequisites(studentId, prerequisiteIds);
        
        if (!hasCompleted) {
          const completedIds = await enrollmentRepository.getCompletedCourseIds(studentId);
          const missing = prerequisites.filter(p => !completedIds.includes(p.id));
          throw new Error(`Prerequisites not met. You must complete: ${missing.map(p => p.title).join(', ')}`);
        }
      }

      // Create enrollment
      const enrollment = await enrollmentRepository.create({
        student_id: studentId,
        course_id: courseId
      });

      await client.query('COMMIT');
      return enrollment;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Drop a course
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @returns {Promise<void>}
   */
  async dropCourse(studentId, courseId) {
    const enrollment = await enrollmentRepository.findByStudentAndCourse(studentId, courseId);
    
    if (!enrollment) {
      throw new Error('You are not enrolled in this course');
    }

    if (enrollment.status !== 'active') {
      throw new Error('You can only drop active enrollments');
    }

    // Update status to dropped
    await enrollmentRepository.update(enrollment.id, {
      status: 'dropped'
    });
  }

  /**
   * Get student's enrollments
   * @param {string} studentId - Student ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Enrollment[]>} Student's enrollments
   */
  async getStudentEnrollments(studentId, status = null) {
    const enrollments = await enrollmentRepository.findByStudent(studentId, status);
    return enrollments.map(e => e.toJSON());
  }

  /**
   * Get course enrollments (for instructors)
   * @param {string} courseId - Course ID
   * @param {string} instructorId - Instructor ID
   * @returns {Promise<Enrollment[]>} Course enrollments
   */
  async getCourseEnrollments(courseId, instructorId) {
    // Verify instructor owns the course
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.instructor_id !== instructorId) {
      throw new Error('You can only view enrollments for your own courses');
    }

    const enrollments = await enrollmentRepository.findByCourse(courseId, 'active');
    return enrollments.map(e => e.toJSON());
  }

  /**
   * Update enrollment progress
   * @param {string} enrollmentId - Enrollment ID
   * @param {number} completionPercentage - New completion percentage
   * @returns {Promise<Enrollment>} Updated enrollment
   */
  async updateProgress(enrollmentId, completionPercentage) {
    if (completionPercentage < 0 || completionPercentage > 100) {
      throw new Error('Completion percentage must be between 0 and 100');
    }

    const updates = {
      completion_percentage: completionPercentage
    };

    // Mark as completed if 100%
    if (completionPercentage === 100) {
      updates.status = 'completed';
      updates.completed_at = new Date();
    }

    return await enrollmentRepository.update(enrollmentId, updates);
  }

  /**
   * Get enrollment statistics for a student
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Statistics
   */
  async getStudentStatistics(studentId) {
    const enrollments = await enrollmentRepository.findByStudent(studentId);
    
    const stats = {
      total: enrollments.length,
      active: enrollments.filter(e => e.status === 'active').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      dropped: enrollments.filter(e => e.status === 'dropped').length,
      average_completion: 0
    };

    if (enrollments.length > 0) {
      const totalPercentage = enrollments.reduce((sum, e) => sum + e.completion_percentage, 0);
      stats.average_completion = Math.round(totalPercentage / enrollments.length);
    }

    return stats;
  }

  /**
   * Check if student can enroll in a course
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Enrollment eligibility
   */
  async checkEnrollmentEligibility(studentId, courseId) {
    const result = {
      canEnroll: true,
      reasons: []
    };

    try {
      // Check if already enrolled
      const existingEnrollment = await enrollmentRepository.findByStudentAndCourse(studentId, courseId);
      if (existingEnrollment) {
        if (existingEnrollment.status === 'active') {
          result.canEnroll = false;
          result.reasons.push('Already enrolled');
        } else if (existingEnrollment.status === 'completed') {
          result.canEnroll = false;
          result.reasons.push('Already completed');
        }
      }

      // Check course capacity
      const course = await courseRepository.findById(courseId, true);
      if (course.isFull()) {
        result.canEnroll = false;
        result.reasons.push('Course is full');
      }

      // Check prerequisites
      const prerequisites = await courseRepository.getPrerequisites(courseId);
      if (prerequisites.length > 0) {
        const prerequisiteIds = prerequisites.map(p => p.id);
        const hasCompleted = await enrollmentRepository.hasCompletedPrerequisites(studentId, prerequisiteIds);
        
        if (!hasCompleted) {
          result.canEnroll = false;
          result.reasons.push('Prerequisites not met');
          result.missingPrerequisites = prerequisites.map(p => ({
            id: p.id,
            title: p.title
          }));
        }
      }

    } catch (error) {
      result.canEnroll = false;
      result.reasons.push('Error checking eligibility');
    }

    return result;
  }
}

module.exports = new EnrollmentService();
import api from './api';

/**
 * Enrollment service for API calls
 */
const enrollmentService = {
  /**
   * Enroll in a course
   */
  async enrollInCourse(courseId) {
    const response = await api.post('/enrollments/enroll', {
      course_id: courseId
    });
    return response.data;
  },

  /**
   * Drop a course
   */
  async dropCourse(courseId) {
    const response = await api.post('/enrollments/drop', {
      course_id: courseId
    });
    return response.data;
  },

  /**
   * Get student's enrollments
   */
  async getMyCourses(status = null) {
    const params = status ? { status } : {};
    const response = await api.get('/enrollments/my-courses', { params });
    return response.data.data.enrollments;
  },

  /**
   * Get course enrollments (instructor)
   */
  async getCourseEnrollments(courseId) {
    const response = await api.get(`/enrollments/course/${courseId}`);
    return response.data.data;
  },

  /**
   * Get student statistics
   */
  async getStatistics() {
    const response = await api.get('/enrollments/statistics');
    return response.data.data.statistics;
  },

  /**
   * Check enrollment eligibility
   */
  async checkEligibility(courseId) {
    const response = await api.get(`/enrollments/check-eligibility/${courseId}`);
    return response.data.data;
  }
};

export default enrollmentService;
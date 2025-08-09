import api from './api';

/**
 * Course service for API calls
 */
const courseService = {
  /**
   * Get all courses with filters
   */
  async getAllCourses(params = {}) {
    const response = await api.get('/courses', { params });
    return response.data.data;
  },

  /**
   * Get course by ID
   */
  async getCourseById(id) {
    const response = await api.get(`/courses/${id}`);
    return response.data.data.course;
  },

  /**
   * Create new course (instructor)
   */
  async createCourse(courseData) {
    const response = await api.post('/courses', courseData);
    return response.data.data.course;
  },

  /**
   * Update course (instructor)
   */
  async updateCourse(id, courseData) {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data.data.course;
  },

  /**
   * Delete course (instructor)
   */
  async deleteCourse(id) {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  /**
   * Get instructor's courses
   */
  async getMyCourses() {
    const response = await api.get('/courses/my-courses');
    return response.data.data.courses;
  },

  /**
   * Get instructor's courses (alias for consistency)
   */
  async getInstructorCourses() {
    const response = await api.get('/courses/my-courses');
    return response.data.data;
  },

  /**
   * Check prerequisites for a course
   */
  async checkPrerequisites(courseId) {
    const response = await api.get(`/courses/${courseId}/prerequisites/check`);
    return response.data.data;
  }
};

export default courseService;
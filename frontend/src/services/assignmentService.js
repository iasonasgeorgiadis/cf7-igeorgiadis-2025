import api from './api';

/**
 * Assignment service for API calls
 */
const assignmentService = {
  /**
   * Get all assignments for a lesson
   */
  async getAssignmentsByLesson(lessonId) {
    const response = await api.get(`/lessons/${lessonId}/assignments`);
    return response.data.data.assignments;
  },

  /**
   * Get all assignments for a course
   */
  async getAssignmentsByCourse(courseId) {
    const response = await api.get(`/courses/${courseId}/assignments`);
    return response.data.data.assignments;
  },

  /**
   * Get assignment by ID
   */
  async getAssignmentById(id) {
    const response = await api.get(`/assignments/${id}`);
    return response.data.data.assignment;
  },

  /**
   * Get upcoming assignments (student)
   */
  async getUpcomingAssignments() {
    const response = await api.get('/assignments/upcoming');
    return response.data.data.assignments;
  },

  /**
   * Get assignment statistics (instructor)
   */
  async getAssignmentStats() {
    const response = await api.get('/assignments/stats');
    return response.data.data.stats;
  },

  /**
   * Create new assignment (instructor)
   */
  async createAssignment(lessonId, assignmentData) {
    const response = await api.post(`/lessons/${lessonId}/assignments`, assignmentData);
    return response.data.data.assignment;
  },

  /**
   * Update assignment (instructor)
   */
  async updateAssignment(id, assignmentData) {
    const response = await api.put(`/assignments/${id}`, assignmentData);
    return response.data.data.assignment;
  },

  /**
   * Delete assignment (instructor)
   */
  async deleteAssignment(id) {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
  }
};

export default assignmentService;
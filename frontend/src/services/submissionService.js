import api from './api';

/**
 * Submission service for API calls
 */
const submissionService = {
  /**
   * Get specific submission
   */
  async getSubmissionById(id) {
    const response = await api.get(`/submissions/${id}`);
    return response.data.data.submission;
  },

  /**
   * Get pending submissions (instructor)
   */
  async getPendingSubmissions() {
    const response = await api.get('/submissions/pending');
    return response.data.data.submissions;
  },

  /**
   * Get all submissions for an assignment (instructor)
   */
  async getSubmissionsByAssignment(assignmentId) {
    const response = await api.get(`/assignments/${assignmentId}/submissions`);
    return response.data.data.submissions;
  },

  /**
   * Get student's submission for an assignment (student)
   */
  async getMySubmission(assignmentId) {
    const response = await api.get(`/assignments/${assignmentId}/submission`);
    return response.data.data.submission;
  },

  /**
   * Get all student submissions in a course (student)
   */
  async getMySubmissionsByCourse(courseId) {
    const response = await api.get(`/courses/${courseId}/submissions`);
    return response.data.data.submissions;
  },

  /**
   * Get course submission statistics (instructor)
   */
  async getCourseSubmissionStats(courseId) {
    const response = await api.get(`/courses/${courseId}/submission-stats`);
    return response.data.data.stats;
  },

  /**
   * Submit assignment (student)
   */
  async submitAssignment(assignmentId, submissionData) {
    const response = await api.post(`/assignments/${assignmentId}/submit`, submissionData);
    return response.data.data.submission;
  },

  /**
   * Grade submission (instructor)
   */
  async gradeSubmission(id, gradeData) {
    const response = await api.put(`/submissions/${id}/grade`, gradeData);
    return response.data.data.submission;
  },

  /**
   * Delete submission
   */
  async deleteSubmission(id) {
    const response = await api.delete(`/submissions/${id}`);
    return response.data;
  }
};

export default submissionService;
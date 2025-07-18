import api from './api';

/**
 * Lesson service for API calls
 */
const lessonService = {
  /**
   * Get all lessons for a course
   */
  async getLessonsByCourse(courseId) {
    const response = await api.get(`/courses/${courseId}/lessons`);
    return response.data.data.lessons;
  },

  /**
   * Get lesson by ID
   */
  async getLessonById(id) {
    const response = await api.get(`/lessons/${id}`);
    return response.data.data.lesson;
  },

  /**
   * Create new lesson (instructor)
   */
  async createLesson(courseId, lessonData) {
    const response = await api.post(`/courses/${courseId}/lessons`, lessonData);
    return response.data.data.lesson;
  },

  /**
   * Update lesson (instructor)
   */
  async updateLesson(id, lessonData) {
    const response = await api.put(`/lessons/${id}`, lessonData);
    return response.data.data.lesson;
  },

  /**
   * Delete lesson (instructor)
   */
  async deleteLesson(id) {
    const response = await api.delete(`/lessons/${id}`);
    return response.data;
  },

  /**
   * Reorder lessons (instructor)
   */
  async reorderLessons(courseId, lessonIds) {
    const response = await api.put(`/courses/${courseId}/lessons/reorder`, { lessonIds });
    return response.data.data;
  },

  /**
   * Get lesson progress for a course (student)
   */
  async getLessonProgress(courseId) {
    const response = await api.get(`/courses/${courseId}/lessons/progress`);
    return response.data.data;
  },

  /**
   * Mark lesson as completed (student)
   */
  async markLessonCompleted(lessonId) {
    const response = await api.post(`/lessons/${lessonId}/complete`);
    return response.data.data;
  }
};

export default lessonService;
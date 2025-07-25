/**
 * Lesson model
 */
class Lesson {
  constructor(data) {
    this.id = data.id;
    this.course_id = data.course_id;
    this.title = data.title;
    this.content = data.content;
    this.order = data.order;
    this.duration = data.duration; // in minutes
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Relations
    this.course = data.course;
    this.assignments = data.assignments || [];
  }

  /**
   * Check if lesson belongs to a specific course
   */
  belongsToCourse(courseId) {
    return this.course_id === courseId;
  }

  /**
   * Get formatted duration
   */
  getFormattedDuration() {
    if (this.duration < 60) {
      return `${this.duration} min`;
    }
    const hours = Math.floor(this.duration / 60);
    const minutes = this.duration % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }

  /**
   * Check if lesson has assignments
   */
  hasAssignments() {
    return this.assignments && this.assignments.length > 0;
  }

  /**
   * Get total assignment points
   */
  getTotalAssignmentPoints() {
    return this.assignments.reduce((total, assignment) => total + (assignment.points || 0), 0);
  }

  /**
   * Convert to JSON-safe object
   */
  toJSON() {
    return {
      id: this.id,
      course_id: this.course_id,
      title: this.title,
      content: this.content,
      order: this.order,
      duration: this.duration,
      formatted_duration: this.getFormattedDuration(),
      has_assignments: this.hasAssignments(),
      assignment_count: this.assignments.length,
      total_points: this.getTotalAssignmentPoints(),
      created_at: this.created_at,
      updated_at: this.updated_at,
      course: this.course,
      assignments: this.assignments
    };
  }
}

module.exports = Lesson;
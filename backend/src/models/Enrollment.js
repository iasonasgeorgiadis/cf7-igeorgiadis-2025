/**
 * Enrollment model representing the enrollments table structure
 */
class Enrollment {
  /**
   * Create a new Enrollment instance
   * @param {Object} data - Enrollment data
   * @param {string} data.id - Enrollment UUID
   * @param {string} data.student_id - Student's user ID
   * @param {string} data.course_id - Course ID
   * @param {Date} data.enrollment_date - When student enrolled
   * @param {string} data.status - Enrollment status (active, completed, dropped)
   * @param {number} data.completion_percentage - Course completion percentage
   * @param {Date} data.completed_at - Completion timestamp
   * @param {Date} data.created_at - Creation timestamp
   * @param {Date} data.updated_at - Last update timestamp
   * @param {Object} data.course - Course details (optional, from JOIN)
   * @param {Object} data.student - Student details (optional, from JOIN)
   */
  constructor(data) {
    this.id = data.id;
    this.student_id = data.student_id;
    this.course_id = data.course_id;
    this.enrollment_date = data.enrollment_date;
    this.status = data.status;
    this.completion_percentage = parseFloat(data.completion_percentage) || 0;
    this.completed_at = data.completed_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Optional fields from JOINs
    if (data.course) {
      this.course = data.course;
    }
    if (data.student) {
      this.student = data.student;
    }
  }

  /**
   * Check if enrollment is active
   * @returns {boolean} True if enrollment is active
   */
  isActive() {
    return this.status === 'active';
  }

  /**
   * Check if enrollment is completed
   * @returns {boolean} True if course is completed
   */
  isCompleted() {
    return this.status === 'completed';
  }

  /**
   * Check if enrollment is dropped
   * @returns {boolean} True if course was dropped
   */
  isDropped() {
    return this.status === 'dropped';
  }

  /**
   * Convert enrollment to JSON
   * @returns {Object} Enrollment object
   */
  toJSON() {
    return {
      id: this.id,
      student_id: this.student_id,
      course_id: this.course_id,
      enrollment_date: this.enrollment_date,
      status: this.status,
      completion_percentage: this.completion_percentage,
      completed_at: this.completed_at,
      course: this.course,
      student: this.student,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Enrollment;
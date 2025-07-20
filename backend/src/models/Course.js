/**
 * Course model representing the courses table structure
 */
class Course {
  /**
   * Create a new Course instance
   * @param {Object} data - Course data
   * @param {string} data.id - Course UUID
   * @param {string} data.title - Course title
   * @param {string} data.description - Course description
   * @param {number} data.capacity - Maximum number of students
   * @param {string} data.instructor_id - Instructor's user ID
   * @param {Date} data.created_at - Creation timestamp
   * @param {Date} data.updated_at - Last update timestamp
   * @param {Object} data.instructor - Instructor details (optional, from JOIN)
   * @param {number} data.enrolled_count - Current enrollment count (optional, from JOIN)
   * @param {Array} data.prerequisites - Prerequisite courses (optional, from JOIN)
   */
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.capacity = data.capacity;
    this.instructor_id = data.instructor_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Optional fields from JOINs
    if (data.instructor) {
      this.instructor = data.instructor;
    }
    if (data.enrolled_count !== undefined) {
      this.enrolled_count = parseInt(data.enrolled_count) || 0;
    }
    if (data.prerequisites) {
      this.prerequisites = data.prerequisites;
    }
    if (data.is_enrolled !== undefined) {
      this.is_enrolled = data.is_enrolled;
    }
  }

  /**
   * Check if course has available capacity
   * @returns {boolean} True if course has space
   */
  hasAvailableCapacity() {
    return this.enrolled_count < this.capacity;
  }

  /**
   * Get remaining capacity
   * @returns {number} Number of available spots
   */
  getRemainingCapacity() {
    return Math.max(0, this.capacity - (this.enrolled_count || 0));
  }

  /**
   * Check if course is full
   * @returns {boolean} True if course is at capacity
   */
  isFull() {
    return this.enrolled_count >= this.capacity;
  }

  /**
   * Convert course to JSON
   * @returns {Object} Course object
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      capacity: this.capacity,
      instructor_id: this.instructor_id,
      instructor: this.instructor,
      enrolled_count: this.enrolled_count,
      remaining_capacity: this.getRemainingCapacity(),
      is_full: this.isFull(),
      is_enrolled: this.is_enrolled || false,
      prerequisites: this.prerequisites,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Course;
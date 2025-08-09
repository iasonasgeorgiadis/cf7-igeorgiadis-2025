// Course model representing the courses table structure
class Course {
  // Creates a new Course with data including optional instructor and enrollment info
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

  // Checks if the course still has spots available
  hasAvailableCapacity() {
    return this.enrolled_count < this.capacity;
  }

  // Calculates how many spots are left in the course
  getRemainingCapacity() {
    return Math.max(0, this.capacity - (this.enrolled_count || 0));
  }

  // Returns true if course is at maximum capacity
  isFull() {
    return this.enrolled_count >= this.capacity;
  }

  // Converts course to JSON with all calculated fields
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
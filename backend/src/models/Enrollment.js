// Enrollment model representing the enrollments table structure
class Enrollment {
  // Creates new Enrollment with student and course info
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

  // Returns true if student is actively enrolled
  isActive() {
    return this.status === 'active';
  }

  // Returns true if student completed the course
  isCompleted() {
    return this.status === 'completed';
  }

  // Returns true if student dropped the course
  isDropped() {
    return this.status === 'dropped';
  }

  // Converts enrollment to JSON format
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
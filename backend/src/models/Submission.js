/**
 * Submission model
 */
class Submission {
  constructor(data) {
    this.id = data.id;
    this.assignment_id = data.assignment_id;
    this.student_id = data.student_id;
    this.content = data.content;
    this.submitted_at = data.submitted_at;
    this.grade = data.grade;
    this.feedback = data.feedback;
    this.graded_at = data.graded_at;
    
    // Relations
    this.assignment = data.assignment;
    this.student = data.student;
    this.course = data.course;
  }

  /**
   * Check if submission is graded
   */
  isGraded() {
    return this.grade !== null;
  }

  /**
   * Check if submission was late
   */
  isLate() {
    if (!this.assignment || !this.assignment.due_date) {
      return false;
    }
    return new Date(this.submitted_at) > new Date(this.assignment.due_date);
  }

  /**
   * Get time between submission and due date
   */
  getSubmissionTimeDiff() {
    if (!this.assignment || !this.assignment.due_date) {
      return null;
    }

    const submitted = new Date(this.submitted_at);
    const due = new Date(this.assignment.due_date);
    const diff = submitted - due;

    if (diff <= 0) {
      // Submitted on time
      const earlyDiff = Math.abs(diff);
      const days = Math.floor(earlyDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((earlyDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} early`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} early`;
      } else {
        return 'On time';
      }
    } else {
      // Submitted late
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} late`;
      } else {
        return `${hours} hour${hours > 1 ? 's' : ''} late`;
      }
    }
  }

  /**
   * Get formatted submission date
   */
  getFormattedSubmittedAt() {
    return new Date(this.submitted_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get formatted graded date
   */
  getFormattedGradedAt() {
    if (!this.graded_at) {
      return null;
    }
    return new Date(this.graded_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get grade percentage
   */
  getGradePercentage() {
    if (!this.isGraded() || !this.assignment || !this.assignment.points) {
      return null;
    }
    return Math.round((this.grade / this.assignment.points) * 100);
  }

  /**
   * Get letter grade
   */
  getLetterGrade() {
    const percentage = this.getGradePercentage();
    if (!percentage) return null;

    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /**
   * Get student display name
   */
  getStudentDisplayName() {
    if (!this.student) return 'Unknown';
    
    if (this.student.first_name && this.student.last_name) {
      return `${this.student.first_name} ${this.student.last_name}`;
    }
    return this.student.email || 'Unknown';
  }

  /**
   * Convert to JSON-safe object
   */
  toJSON() {
    return {
      id: this.id,
      assignment_id: this.assignment_id,
      student_id: this.student_id,
      content: this.content,
      submitted_at: this.submitted_at,
      formatted_submitted_at: this.getFormattedSubmittedAt(),
      is_late: this.isLate(),
      submission_time_diff: this.getSubmissionTimeDiff(),
      grade: this.grade,
      feedback: this.feedback,
      graded_at: this.graded_at,
      formatted_graded_at: this.getFormattedGradedAt(),
      is_graded: this.isGraded(),
      grade_percentage: this.getGradePercentage(),
      letter_grade: this.getLetterGrade(),
      assignment: this.assignment,
      student: this.student ? {
        id: this.student.id,
        email: this.student.email,
        display_name: this.getStudentDisplayName()
      } : null,
      course: this.course
    };
  }
}

module.exports = Submission;
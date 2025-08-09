// Assignment model
class Assignment {
  constructor(data) {
    this.id = data.id;
    this.lesson_id = data.lesson_id;
    this.title = data.title;
    this.description = data.description;
    this.due_date = data.due_date;
    this.points = data.points;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Relations
    this.lesson = data.lesson;
    this.course = data.course;
    this.submissions = data.submissions || [];
    
    // Computed fields
    this.submission_count = data.submission_count || 0;
    this.graded_count = data.graded_count || 0;
  }

  // Checks if assignment due date has passed
  isPastDue() {
    return new Date() > new Date(this.due_date);
  }

  // Returns nicely formatted due date string
  getFormattedDueDate() {
    const date = new Date(this.due_date);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calculates how much time is left until due date
  getTimeRemaining() {
    const now = new Date();
    const due = new Date(this.due_date);
    const diff = due - now;

    if (diff <= 0) {
      return 'Past due';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }

  // Checks if this assignment is part of given lesson
  belongsToLesson(lessonId) {
    return this.lesson_id === lessonId;
  }

  // Calculates stats about submissions and grading progress
  getSubmissionStats() {
    const totalStudents = this.course?.enrolled_count || 0;
    const submissionRate = totalStudents > 0 
      ? Math.round((this.submission_count / totalStudents) * 100) 
      : 0;
    const gradingProgress = this.submission_count > 0
      ? Math.round((this.graded_count / this.submission_count) * 100)
      : 0;

    return {
      total_students: totalStudents,
      submitted: this.submission_count,
      graded: this.graded_count,
      pending_grading: this.submission_count - this.graded_count,
      submission_rate: submissionRate,
      grading_progress: gradingProgress
    };
  }

  // Converts assignment to JSON with all calculated fields
  toJSON() {
    return {
      id: this.id,
      lesson_id: this.lesson_id,
      title: this.title,
      description: this.description,
      due_date: this.due_date,
      formatted_due_date: this.getFormattedDueDate(),
      time_remaining: this.getTimeRemaining(),
      is_past_due: this.isPastDue(),
      points: this.points,
      created_at: this.created_at,
      updated_at: this.updated_at,
      lesson: this.lesson,
      course: this.course,
      submission_stats: this.getSubmissionStats()
    };
  }
}

module.exports = Assignment;
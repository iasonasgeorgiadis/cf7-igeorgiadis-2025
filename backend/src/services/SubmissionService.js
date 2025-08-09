const SubmissionRepository = require('../repositories/SubmissionRepository');
const AssignmentRepository = require('../repositories/AssignmentRepository');
const enrollmentRepository = require('../repositories/EnrollmentRepository');
const courseRepository = require('../repositories/CourseRepository');

/**
 * Submission service for business logic
 */
class SubmissionService {
  constructor(db) {
    this.submissionRepository = new SubmissionRepository(db);
    this.assignmentRepository = new AssignmentRepository(db);
    this.enrollmentRepository = enrollmentRepository;
    this.courseRepository = courseRepository;
  }

  /**
   * Get a submission by ID
   */
  async getSubmissionById(id, userId, userRole) {
    const submission = await this.submissionRepository.findById(id);
    
    if (!submission) {
      throw new Error('Submission not found');
    }

    // Check access permissions
    if (userRole === 'student' && submission.student_id !== userId) {
      throw new Error('You can only view your own submissions');
    } else if (userRole === 'instructor' && submission.course.instructor_id !== userId) {
      throw new Error('You can only view submissions for your own courses');
    }

    return submission;
  }

  /**
   * Get all submissions for an assignment
   * Instructor only
   */
  async getAssignmentSubmissions(assignmentId, instructorId) {
    // Verify assignment exists and instructor owns the course
    const assignment = await this.assignmentRepository.findById(assignmentId);
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (assignment.course.instructor_id !== instructorId) {
      throw new Error('You can only view submissions for your own assignments');
    }

    // Get all submissions with student info
    const submissions = await this.submissionRepository.findByAssignment(assignmentId, true);

    return {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        points: assignment.points,
        due_date: assignment.due_date
      },
      submissions,
      stats: assignment.getSubmissionStats()
    };
  }

  /**
   * Get student's submission for an assignment
   */
  async getStudentSubmission(assignmentId, studentId) {
    // Verify assignment exists
    const assignment = await this.assignmentRepository.findById(assignmentId);
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Verify student is enrolled
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      studentId, 
      assignment.course.id
    );

    if (!enrollment || enrollment.status !== 'active') {
      throw new Error('You must be enrolled in this course to view assignments');
    }

    // Get submission if exists
    const submission = await this.submissionRepository.findByAssignmentAndStudent(
      assignmentId,
      studentId
    );

    return {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        points: assignment.points,
        due_date: assignment.due_date,
        is_past_due: assignment.isPastDue(),
        time_remaining: assignment.getTimeRemaining()
      },
      submission
    };
  }

  /**
   * Get all submissions for a student in a course
   */
  async getStudentCourseSubmissions(courseId, studentId) {
    // Verify course exists
    const course = await this.courseRepository.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    // Verify student is enrolled
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(studentId, courseId);

    if (!enrollment || enrollment.status !== 'active') {
      throw new Error('You must be enrolled in this course to view submissions');
    }

    // Get all submissions
    const submissions = await this.submissionRepository.findByStudentAndCourse(studentId, courseId);

    // Calculate grade statistics
    const graded = submissions.filter(s => s.isGraded());
    const totalPoints = graded.reduce((sum, s) => sum + s.assignment.points, 0);
    const earnedPoints = graded.reduce((sum, s) => sum + s.grade, 0);
    const averageGrade = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : null;

    return {
      course: {
        id: course.id,
        title: course.title,
        code: course.code
      },
      submissions,
      stats: {
        total_assignments: submissions.length,
        submitted: submissions.length,
        graded: graded.length,
        average_grade: averageGrade
      }
    };
  }

  /**
   * Submit an assignment
   * Student only
   */
  async submitAssignment(assignmentId, studentId, content) {
    // Verify assignment exists
    const assignment = await this.assignmentRepository.findById(assignmentId);
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Verify student is enrolled
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      studentId,
      assignment.course.id
    );

    if (!enrollment || enrollment.status !== 'active') {
      throw new Error('You must be enrolled in this course to submit assignments');
    }

    // Validate content
    if (!content || content.trim().length < 10) {
      throw new Error('Submission content must be at least 10 characters long');
    }

    // Check if already submitted
    const existingSubmission = await this.submissionRepository.findByAssignmentAndStudent(
      assignmentId,
      studentId
    );

    let submission;
    if (existingSubmission) {
      // Update existing submission (resubmission)
      if (existingSubmission.isGraded()) {
        throw new Error('Cannot resubmit after assignment has been graded');
      }
      
      submission = await this.submissionRepository.update(
        existingSubmission.id,
        content.trim()
      );
    } else {
      // Create new submission
      submission = await this.submissionRepository.create({
        assignment_id: assignmentId,
        student_id: studentId,
        content: content.trim()
      });
    }

    return submission;
  }

  /**
   * Grade a submission
   * Instructor only
   */
  async gradeSubmission(submissionId, instructorId, grade, feedback = null) {
    // Get submission with full details
    const submission = await this.submissionRepository.findById(submissionId);
    
    if (!submission) {
      throw new Error('Submission not found');
    }

    // Verify instructor owns the course
    if (submission.course.instructor_id !== instructorId) {
      throw new Error('You can only grade submissions for your own courses');
    }

    // Validate grade
    if (grade < 0 || grade > submission.assignment.points) {
      throw new Error(`Grade must be between 0 and ${submission.assignment.points}`);
    }

    // Validate feedback if provided
    if (feedback && feedback.trim().length > 0 && feedback.trim().length < 3) {
      throw new Error('Feedback must be at least 3 characters long');
    }

    // Grade the submission
    const gradedSubmission = await this.submissionRepository.grade(
      submissionId,
      grade,
      feedback ? feedback.trim() : null
    );

    return gradedSubmission;
  }

  /**
   * Delete a submission
   * Student can delete their own ungraded submissions
   */
  async deleteSubmission(submissionId, userId, userRole) {
    // Get submission details
    const submission = await this.submissionRepository.findById(submissionId);
    
    if (!submission) {
      throw new Error('Submission not found');
    }

    // Check permissions
    if (userRole === 'student') {
      if (submission.student_id !== userId) {
        throw new Error('You can only delete your own submissions');
      }
      if (submission.isGraded()) {
        throw new Error('Cannot delete graded submissions');
      }
    } else if (userRole === 'instructor') {
      if (submission.course.instructor_id !== userId) {
        throw new Error('You can only delete submissions from your own courses');
      }
    } else {
      throw new Error('Unauthorized to delete submissions');
    }

    // Delete submission
    const success = await this.submissionRepository.delete(submissionId);
    
    return success;
  }

  /**
   * Get course submission statistics
   */
  async getCourseStats(courseId, instructorId) {
    // Verify course exists and instructor owns it
    const course = await this.courseRepository.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    if (course.instructor_id !== instructorId) {
      throw new Error('You can only view statistics for your own courses');
    }

    // Get statistics
    const stats = await this.submissionRepository.getCourseStats(courseId);
    
    return {
      course: {
        id: course.id,
        title: course.title,
        code: course.code
      },
      stats
    };
  }

  /**
   * Get pending submissions for instructor
   */
  async getPendingSubmissions(instructorId, limit = 10) {
    return await this.submissionRepository.findPendingForInstructor(instructorId, limit);
  }
}

module.exports = SubmissionService;
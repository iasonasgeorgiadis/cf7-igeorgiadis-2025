const AssignmentRepository = require('../repositories/AssignmentRepository');
const LessonRepository = require('../repositories/LessonRepository');
const courseRepository = require('../repositories/CourseRepository');
const enrollmentRepository = require('../repositories/EnrollmentRepository');

/**
 * Assignment service for business logic
 */
class AssignmentService {
  constructor(db) {
    this.assignmentRepository = new AssignmentRepository(db);
    this.lessonRepository = new LessonRepository(db);
    this.courseRepository = courseRepository;
    this.enrollmentRepository = enrollmentRepository;
  }

  /**
   * Get all assignments for a lesson
   */
  async getLessonAssignments(lessonId, userId, userRole) {
    // Verify lesson exists
    const lesson = await this.lessonRepository.findById(lessonId);
    
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Get course details
    const course = await this.courseRepository.findById(lesson.course_id);

    // Check access permissions
    if (userRole === 'student') {
      const enrollment = await this.enrollmentRepository.findByStudentAndCourse(userId, course.id);
      if (!enrollment || enrollment.status !== 'active') {
        throw new Error('You must be enrolled in this course to view assignments');
      }
    } else if (userRole === 'instructor' && course.instructor_id !== userId) {
      throw new Error('You can only view assignments for your own courses');
    }

    // Get assignments
    const assignments = await this.assignmentRepository.findByLesson(lessonId);

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        course_id: course.id,
        course_title: course.title
      },
      assignments
    };
  }

  /**
   * Get all assignments for a course
   */
  async getCourseAssignments(courseId, userId, userRole) {
    // Verify course exists
    const course = await this.courseRepository.findById(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    // Check access permissions
    if (userRole === 'student') {
      const enrollment = await this.enrollmentRepository.findByStudentAndCourse(userId, courseId);
      if (!enrollment || enrollment.status !== 'active') {
        throw new Error('You must be enrolled in this course to view assignments');
      }
    } else if (userRole === 'instructor' && course.instructor_id !== userId) {
      throw new Error('You can only view assignments for your own courses');
    }

    // Get assignments
    const assignments = await this.assignmentRepository.findByCourse(courseId);

    return {
      course: {
        id: course.id,
        title: course.title,
        code: course.code
      },
      assignments
    };
  }

  /**
   * Get a specific assignment
   */
  async getAssignmentById(id, userId, userRole) {
    const assignment = await this.assignmentRepository.findById(id, userRole === 'instructor');
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Get course through lesson
    const lesson = await this.lessonRepository.findById(assignment.lesson_id);
    const course = await this.courseRepository.findById(lesson.course_id);

    // Check access permissions
    if (userRole === 'student') {
      const enrollment = await this.enrollmentRepository.findByStudentAndCourse(userId, course.id);
      if (!enrollment || enrollment.status !== 'active') {
        throw new Error('You must be enrolled in this course to view this assignment');
      }
    } else if (userRole === 'instructor' && course.instructor_id !== userId) {
      throw new Error('You can only view assignments for your own courses');
    }

    return assignment;
  }

  /**
   * Get upcoming assignments for a student
   */
  async getUpcomingAssignments(studentId, limit = 5) {
    return await this.assignmentRepository.findUpcomingForStudent(studentId, limit);
  }

  /**
   * Create a new assignment
   * Instructor only
   */
  async createAssignment(lessonId, assignmentData, instructorId) {
    // Verify lesson exists
    const lesson = await this.lessonRepository.findById(lessonId);
    
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Get course and verify ownership
    const course = await this.courseRepository.findById(lesson.course_id);
    
    if (course.instructor_id !== instructorId) {
      throw new Error('You can only create assignments for your own courses');
    }

    // Validate assignment data
    if (!assignmentData.title || assignmentData.title.trim().length < 3) {
      throw new Error('Assignment title must be at least 3 characters long');
    }

    if (!assignmentData.description || assignmentData.description.trim().length < 10) {
      throw new Error('Assignment description must be at least 10 characters long');
    }

    if (!assignmentData.due_date) {
      throw new Error('Due date is required');
    }

    const dueDate = new Date(assignmentData.due_date);
    if (dueDate < new Date()) {
      throw new Error('Due date must be in the future');
    }

    if (!assignmentData.points || assignmentData.points < 1 || assignmentData.points > 100) {
      throw new Error('Points must be between 1 and 100');
    }

    // Create assignment
    const assignment = await this.assignmentRepository.create({
      lesson_id: lessonId,
      title: assignmentData.title.trim(),
      description: assignmentData.description.trim(),
      due_date: assignmentData.due_date,
      points: assignmentData.points
    });

    return assignment;
  }

  /**
   * Update an assignment
   * Instructor only
   */
  async updateAssignment(id, updateData, instructorId) {
    // Get assignment with course info
    const assignment = await this.assignmentRepository.findById(id);
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Verify ownership through lesson and course
    const lesson = await this.lessonRepository.findById(assignment.lesson_id);
    const course = await this.courseRepository.findById(lesson.course_id);
    
    if (course.instructor_id !== instructorId) {
      throw new Error('You can only update assignments for your own courses');
    }

    // Validate update data
    const updates = {};

    if (updateData.title !== undefined) {
      if (updateData.title.trim().length < 3) {
        throw new Error('Assignment title must be at least 3 characters long');
      }
      updates.title = updateData.title.trim();
    }

    if (updateData.description !== undefined) {
      if (updateData.description.trim().length < 10) {
        throw new Error('Assignment description must be at least 10 characters long');
      }
      updates.description = updateData.description.trim();
    }

    if (updateData.due_date !== undefined) {
      const dueDate = new Date(updateData.due_date);
      if (dueDate < new Date()) {
        throw new Error('Due date must be in the future');
      }
      updates.due_date = updateData.due_date;
    }

    if (updateData.points !== undefined) {
      if (updateData.points < 1 || updateData.points > 100) {
        throw new Error('Points must be between 1 and 100');
      }
      updates.points = updateData.points;
    }

    // Update assignment
    const updatedAssignment = await this.assignmentRepository.update(id, updates);
    
    return updatedAssignment;
  }

  /**
   * Delete an assignment
   * Instructor only
   */
  async deleteAssignment(id, instructorId) {
    // Get assignment with course info
    const assignment = await this.assignmentRepository.findById(id);
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Verify ownership through lesson and course
    const lesson = await this.lessonRepository.findById(assignment.lesson_id);
    const course = await this.courseRepository.findById(lesson.course_id);
    
    if (course.instructor_id !== instructorId) {
      throw new Error('You can only delete assignments for your own courses');
    }

    // Delete assignment (submissions will be cascade deleted)
    const success = await this.assignmentRepository.delete(id);
    
    return success;
  }

  /**
   * Get assignment statistics for instructor
   */
  async getInstructorStats(instructorId) {
    return await this.assignmentRepository.getInstructorStats(instructorId);
  }
}

module.exports = AssignmentService;
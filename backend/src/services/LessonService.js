const LessonRepository = require('../repositories/LessonRepository');
const courseRepository = require('../repositories/CourseRepository');
const enrollmentRepository = require('../repositories/EnrollmentRepository');

/**
 * Lesson service for business logic
 */
class LessonService {
  constructor(db) {
    this.lessonRepository = new LessonRepository(db);
    this.courseRepository = courseRepository;
    this.enrollmentRepository = enrollmentRepository;
  }

  /**
   * Get all lessons for a course
   * @param {string} courseId - Course ID
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<Object>} Lessons data
   */
  async getCourseLessons(courseId, userId, userRole) {
    // Verify course exists
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check access permissions
    if (userRole === 'student') {
      // Students must be enrolled
      const enrollment = await this.enrollmentRepository.findByStudentAndCourse(userId, courseId);
      if (!enrollment || enrollment.status !== 'active') {
        throw new Error('You must be enrolled in this course to view lessons');
      }
    } else if (userRole === 'instructor' && course.instructor_id !== userId) {
      // Instructors can only view their own courses
      throw new Error('You can only view lessons for your own courses');
    }

    // Get lessons with assignments if instructor
    const includeAssignments = userRole === 'instructor';
    const lessons = await this.lessonRepository.findByCourseId(courseId, includeAssignments);

    // Get total duration
    const totalDuration = await this.lessonRepository.getTotalDuration(courseId);

    return {
      course: {
        id: course.id,
        title: course.title,
        instructor_id: course.instructor_id
      },
      lessons,
      total_lessons: lessons.length,
      total_duration: totalDuration,
      formatted_duration: this.formatDuration(totalDuration)
    };
  }

  /**
   * Get a specific lesson
   * @param {string} lessonId - Lesson ID
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<Lesson>} Lesson instance
   */
  async getLessonById(lessonId, userId, userRole) {
    const lesson = await this.lessonRepository.findById(lessonId, {
      includeCourse: true,
      includeAssignments: true
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Check access permissions
    if (userRole === 'student') {
      const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
        userId, 
        lesson.course_id
      );
      if (!enrollment || enrollment.status !== 'active') {
        throw new Error('You must be enrolled in this course to view this lesson');
      }
    } else if (userRole === 'instructor' && lesson.course.instructor_id !== userId) {
      throw new Error('You can only view lessons from your own courses');
    }

    return lesson;
  }

  /**
   * Create a new lesson
   * @param {string} courseId - Course ID
   * @param {Object} lessonData - Lesson data
   * @param {string} instructorId - Instructor ID
   * @returns {Promise<Lesson>} Created lesson
   */
  async createLesson(courseId, lessonData, instructorId) {
    // Verify course exists and instructor owns it
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    if (course.instructor_id !== instructorId) {
      throw new Error('You can only create lessons for your own courses');
    }

    // Validate lesson data
    this.validateLessonData(lessonData);

    // Create the lesson
    const lesson = await this.lessonRepository.create({
      course_id: courseId,
      title: lessonData.title,
      content: lessonData.content,
      duration: lessonData.duration,
      order: lessonData.order // optional, will auto-increment if not provided
    });

    return lesson;
  }

  /**
   * Update a lesson
   * @param {string} lessonId - Lesson ID
   * @param {Object} updateData - Update data
   * @param {string} instructorId - Instructor ID
   * @returns {Promise<Lesson>} Updated lesson
   */
  async updateLesson(lessonId, updateData, instructorId) {
    // Get lesson with course info
    const lesson = await this.lessonRepository.findById(lessonId, {
      includeCourse: true
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    if (lesson.course.instructor_id !== instructorId) {
      throw new Error('You can only update lessons from your own courses');
    }

    // Validate update data
    if (updateData.title !== undefined || updateData.content !== undefined || 
        updateData.duration !== undefined) {
      this.validateLessonData(updateData, true);
    }

    // If changing order, validate it's unique
    if (updateData.order !== undefined && updateData.order !== lesson.order) {
      await this.validateUniqueOrder(lesson.course_id, updateData.order, lessonId);
    }

    return await this.lessonRepository.update(lessonId, updateData);
  }

  /**
   * Delete a lesson
   * @param {string} lessonId - Lesson ID
   * @param {string} instructorId - Instructor ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteLesson(lessonId, instructorId) {
    // Get lesson with course info
    const lesson = await this.lessonRepository.findById(lessonId, {
      includeCourse: true
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    if (lesson.course.instructor_id !== instructorId) {
      throw new Error('You can only delete lessons from your own courses');
    }

    // Check if lesson has assignments
    if (lesson.hasAssignments()) {
      throw new Error('Cannot delete lesson with assignments. Delete assignments first.');
    }

    return await this.lessonRepository.delete(lessonId);
  }

  /**
   * Reorder lessons in a course
   * @param {string} courseId - Course ID
   * @param {Array} lessonOrders - Array of {lessonId, order} objects
   * @param {string} instructorId - Instructor ID
   * @returns {Promise<void>}
   */
  async reorderLessons(courseId, lessonOrders, instructorId) {
    // Verify course exists and instructor owns it
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    if (course.instructor_id !== instructorId) {
      throw new Error('You can only reorder lessons in your own courses');
    }

    // Validate lesson orders
    if (!Array.isArray(lessonOrders) || lessonOrders.length === 0) {
      throw new Error('Invalid lesson orders');
    }

    // Check for duplicate orders
    const orders = lessonOrders.map(item => item.order);
    if (new Set(orders).size !== orders.length) {
      throw new Error('Duplicate order values found');
    }

    // Reorder lessons
    await this.lessonRepository.reorderLessons(courseId, lessonOrders);
  }

  /**
   * Get lesson progress for a student
   * @param {string} courseId - Course ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Progress data
   */
  async getLessonProgress(courseId, studentId) {
    // Verify enrollment
    const enrollment = await this.enrollmentRepository.findByStudentAndCourse(
      studentId, 
      courseId
    );
    if (!enrollment || enrollment.status !== 'active') {
      throw new Error('Student not enrolled in this course');
    }

    const lessons = await this.lessonRepository.findByCourseId(courseId, true);
    
    // TODO: In Phase 4, track actual lesson completion
    // For now, return basic structure
    const progress = lessons.map(lesson => ({
      lesson_id: lesson.id,
      title: lesson.title,
      completed: false,
      assignments_completed: 0,
      total_assignments: lesson.assignments.length
    }));

    return {
      total_lessons: lessons.length,
      completed_lessons: 0,
      progress_percentage: 0,
      lessons: progress
    };
  }

  /**
   * Validate lesson data
   * @param {Object} data - Lesson data
   * @param {boolean} isUpdate - Whether this is an update
   */
  validateLessonData(data, isUpdate = false) {
    if (!isUpdate || data.title !== undefined) {
      if (!data.title || data.title.trim().length < 3) {
        throw new Error('Lesson title must be at least 3 characters long');
      }
      if (data.title.length > 255) {
        throw new Error('Lesson title must be less than 255 characters');
      }
    }

    if (!isUpdate || data.content !== undefined) {
      if (!data.content || data.content.trim().length < 10) {
        throw new Error('Lesson content must be at least 10 characters long');
      }
    }

    if (!isUpdate || data.duration !== undefined) {
      if (!data.duration || data.duration < 1) {
        throw new Error('Lesson duration must be at least 1 minute');
      }
      if (data.duration > 480) { // 8 hours
        throw new Error('Lesson duration cannot exceed 480 minutes (8 hours)');
      }
    }
  }

  /**
   * Validate unique order within course
   * @param {string} courseId - Course ID
   * @param {number} order - Order number
   * @param {string} excludeLessonId - Lesson ID to exclude
   */
  async validateUniqueOrder(courseId, order, excludeLessonId = null) {
    const lessons = await this.lessonRepository.findByCourseId(courseId);
    const duplicate = lessons.find(lesson => 
      lesson.order === order && lesson.id !== excludeLessonId
    );
    
    if (duplicate) {
      throw new Error(`Order ${order} is already taken by another lesson`);
    }
  }

  /**
   * Format duration in minutes to human readable
   * @param {number} minutes - Duration in minutes
   * @returns {string} Formatted duration
   */
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}

module.exports = LessonService;
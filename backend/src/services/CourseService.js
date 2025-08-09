const courseRepository = require('../repositories/CourseRepository');
const userRepository = require('../repositories/UserRepository');
const { query } = require('../config/database');

// Course service - handles course operations
class CourseService {
  // Get all courses with filters and pagination
  // Also checks enrollment status if student ID provided
  async getAllCourses(options = {}, studentId = null) {
    const { page = 1, limit = 20, search, instructor_id, available_only } = options;
    const offset = (page - 1) * limit;

    const { courses, total } = await courseRepository.findAll({
      limit: parseInt(limit),
      offset,
      search,
      instructor_id,
      available_only
    });

    // Get prerequisites and enrollment status for each course
    for (const course of courses) {
      course.prerequisites = await courseRepository.getPrerequisites(course.id);
      
      // Check enrollment status if student ID provided
      if (studentId) {
        const enrollment = await query(
          'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2 AND status = \'active\'',
          [studentId, course.id]
        );
        course.is_enrolled = enrollment.rows.length > 0;
      }
    }

    return {
      courses: courses.map(course => course.toJSON()),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    };
  }

  // Get single course by ID with all details
  async getCourseById(id) {
    const course = await courseRepository.findById(id, true);
    if (!course) {
      throw new Error('Course not found');
    }

    // Get prerequisites
    course.prerequisites = await courseRepository.getPrerequisites(id);

    return course;
  }

  // Create new course
  // Only instructors can create courses
  async createCourse(courseData, instructorId) {
    // Verify instructor role
    const instructor = await userRepository.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      throw new Error('Only instructors can create courses');
    }

    // Validate capacity
    if (courseData.capacity < 1) {
      throw new Error('Course capacity must be at least 1');
    }

    // Create course
    const course = await courseRepository.create({
      ...courseData,
      instructor_id: instructorId
    });

    // Add prerequisites if provided
    if (courseData.prerequisiteIds && courseData.prerequisiteIds.length > 0) {
      for (const prereqId of courseData.prerequisiteIds) {
        // Verify prerequisite exists
        const prereqCourse = await courseRepository.findById(prereqId);
        if (!prereqCourse) {
          throw new Error(`Prerequisite course ${prereqId} not found`);
        }
        
        // Prevent circular dependencies
        if (prereqId === course.id) {
          throw new Error('Course cannot be its own prerequisite');
        }

        await courseRepository.addPrerequisite(course.id, prereqId);
      }
    }

    // Return course with prerequisites
    course.prerequisites = await courseRepository.getPrerequisites(course.id);
    return course;
  }

  /**
   * Update course
   * @param {string} id - Course ID
   * @param {Object} updates - Course updates
   * @param {string} userId - User making the update
   * @param {string} userRole - User's role
   * @returns {Promise<Course>} Updated course
   */
  async updateCourse(id, updates, userId, userRole) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check permissions
    if (course.instructor_id !== userId) {
      throw new Error('You can only update your own courses');
    }

    // Validate capacity if provided
    if (updates.capacity !== undefined) {
      if (updates.capacity < 1) {
        throw new Error('Course capacity must be at least 1');
      }

      // Check current enrollment count
      const courseWithDetails = await courseRepository.findById(id, true);
      if (updates.capacity < courseWithDetails.enrolled_count) {
        throw new Error(`Cannot reduce capacity below current enrollment count (${courseWithDetails.enrolled_count})`);
      }
    }

    // Update course
    const updatedCourse = await courseRepository.update(id, updates);

    // Update prerequisites if provided
    if (updates.prerequisiteIds !== undefined) {
      // Get current prerequisites
      const currentPrereqs = await courseRepository.getPrerequisites(id);
      const currentPrereqIds = currentPrereqs.map(p => p.id);

      // Remove old prerequisites
      for (const prereqId of currentPrereqIds) {
        if (!updates.prerequisiteIds.includes(prereqId)) {
          await courseRepository.removePrerequisite(id, prereqId);
        }
      }

      // Add new prerequisites
      for (const prereqId of updates.prerequisiteIds) {
        if (!currentPrereqIds.includes(prereqId)) {
          // Verify prerequisite exists
          const prereqCourse = await courseRepository.findById(prereqId);
          if (!prereqCourse) {
            throw new Error(`Prerequisite course ${prereqId} not found`);
          }

          // Prevent circular dependencies
          if (prereqId === id) {
            throw new Error('Course cannot be its own prerequisite');
          }

          // Check if this would create a circular dependency
          const prereqPrereqs = await courseRepository.getPrerequisites(prereqId);
          if (prereqPrereqs.some(p => p.id === id)) {
            throw new Error('This would create a circular prerequisite dependency');
          }

          await courseRepository.addPrerequisite(id, prereqId);
        }
      }
    }

    // Return updated course with prerequisites
    updatedCourse.prerequisites = await courseRepository.getPrerequisites(id);
    return updatedCourse;
  }

  /**
   * Delete course
   * @param {string} id - Course ID
   * @param {string} userId - User making the deletion
   * @param {string} userRole - User's role
   * @returns {Promise<void>}
   */
  async deleteCourse(id, userId, userRole) {
    const course = await courseRepository.findById(id, true);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check permissions
    if (course.instructor_id !== userId) {
      throw new Error('You can only delete your own courses');
    }

    // Check if course has active enrollments
    if (course.enrolled_count > 0) {
      throw new Error('Cannot delete course with active enrollments');
    }

    const deleted = await courseRepository.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete course');
    }
  }

  /**
   * Get courses by instructor
   * @param {string} instructorId - Instructor ID
   * @returns {Promise<Course[]>} Instructor's courses
   */
  async getCoursesByInstructor(instructorId) {
    const courses = await courseRepository.findByInstructor(instructorId);
    
    // Get prerequisites for each course
    for (const course of courses) {
      course.prerequisites = await courseRepository.getPrerequisites(course.id);
    }

    return courses.map(course => course.toJSON());
  }

  /**
   * Check if user has completed prerequisites
   * @param {string} courseId - Course ID
   * @param {string} studentId - Student ID
   * @returns {Promise<{completed: boolean, missing: Course[]}>}
   */
  async checkPrerequisites(courseId, studentId) {
    const prerequisites = await courseRepository.getPrerequisites(courseId);
    
    if (prerequisites.length === 0) {
      return { completed: true, missing: [] };
    }

    // Check completion of each prerequisite
    const missing = [];
    for (const prereq of prerequisites) {
      // This will be implemented in EnrollmentService
      // For now, we'll check directly in the database
      const result = await query(
        `SELECT 1 FROM enrollments 
         WHERE student_id = $1 AND course_id = $2 AND status = 'completed'`,
        [studentId, prereq.id]
      );

      if (result.rows.length === 0) {
        missing.push(prereq);
      }
    }

    return {
      completed: missing.length === 0,
      missing: missing.map(course => course.toJSON())
    };
  }
}

module.exports = new CourseService();
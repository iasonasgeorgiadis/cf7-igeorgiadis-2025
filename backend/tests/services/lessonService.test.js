const factories = require('../utils/factories');

// Mock the LessonRepository class
jest.mock('../../src/repositories/LessonRepository', () => {
  return jest.fn().mockImplementation(() => ({
    findByCourseId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getCompletedLessons: jest.fn(),
    getTotalDuration: jest.fn(),
    getMaxOrderNumber: jest.fn(),
    reorderLessonsAfterDelete: jest.fn(),
    findByCourse: jest.fn(),
    reorderLessons: jest.fn(),
    markComplete: jest.fn()
  }));
});

jest.mock('../../src/repositories/CourseRepository', () => ({
  findById: jest.fn()
}));

jest.mock('../../src/repositories/EnrollmentRepository', () => ({
  findByStudentAndCourse: jest.fn()
}));

const LessonService = require('../../src/services/LessonService');
const LessonRepository = require('../../src/repositories/LessonRepository');
const courseRepository = require('../../src/repositories/CourseRepository');
const enrollmentRepository = require('../../src/repositories/EnrollmentRepository');

// Create service instance with mocked db
const mockDb = {};
const lessonService = new LessonService(mockDb);
const lessonRepository = lessonService.lessonRepository;

// Add formatDuration method
lessonService.formatDuration = jest.fn().mockReturnValue('1h 0m');

describe('LessonService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCourseLessons', () => {
    it('should return lessons for enrolled students', async () => {
      const courseId = 'course-123';
      const userId = 'student-123';
      const userRole = 'student';
      const mockCourse = factories.course({ id: courseId });
      const lessons = [
        factories.lesson({ course_id: courseId, is_published: true }),
        factories.lesson({ course_id: courseId, is_published: true })
      ];
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue({ status: 'active' });
      lessonRepository.findByCourseId.mockResolvedValue(lessons);
      lessonRepository.getTotalDuration.mockResolvedValue(60);

      const result = await lessonService.getCourseLessons(courseId, userId, userRole);

      expect(enrollmentRepository.findByStudentAndCourse).toHaveBeenCalledWith(userId, courseId);
      expect(lessonRepository.findByCourseId).toHaveBeenCalledWith(courseId, false);
      expect(result.lessons).toEqual(lessons);
      expect(result.total_duration).toBe(60);
    });

    it('should return all lessons with assignments for instructors', async () => {
      const courseId = 'course-123';
      const instructorId = 'instructor-123';
      const mockCourse = factories.course({ 
        id: courseId, 
        instructor_id: instructorId 
      });
      const lessons = [
        factories.lesson({ course_id: courseId }),
        factories.lesson({ course_id: courseId, is_published: false })
      ];
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      lessonRepository.findByCourseId.mockResolvedValue(lessons);
      lessonRepository.getTotalDuration.mockResolvedValue(90);

      const result = await lessonService.getCourseLessons(
        courseId, 
        instructorId, 
        'instructor'
      );

      expect(lessonRepository.findByCourseId).toHaveBeenCalledWith(courseId, true);
      expect(result.lessons).toEqual(lessons);
    });

    it('should throw error if student not enrolled', async () => {
      const mockCourse = factories.course();
      courseRepository.findById.mockResolvedValue(mockCourse);
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      await expect(lessonService.getCourseLessons('course-123', 'student-123', 'student'))
        .rejects.toThrow('You must be enrolled in this course to view lessons');
    });

    it('should throw error if instructor not course owner', async () => {
      const mockCourse = factories.course({ instructor_id: 'other-instructor' });
      courseRepository.findById.mockResolvedValue(mockCourse);

      await expect(lessonService.getCourseLessons(
        'course-123',
        'wrong-instructor',
        'instructor'
      )).rejects.toThrow('You can only view lessons for your own courses');
    });
  });

  describe('getLessonById', () => {
    it('should return lesson with course info', async () => {
      const lessonId = 'lesson-123';
      const lesson = factories.lesson({ 
        id: lessonId, 
        course_id: 'course-123',
        is_published: true 
      });
      const course = factories.course({ id: 'course-123' });
      
      lessonRepository.findById.mockResolvedValue(lesson);
      courseRepository.findById.mockResolvedValue(course);
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue({ status: 'active' });

      const result = await lessonService.getLessonById(lessonId, 'student-123', 'student');

      expect(result).toEqual(lesson);
    });

    it('should throw error if unpublished lesson accessed by student', async () => {
      const lesson = factories.lesson({ is_published: false });
      lessonRepository.findById.mockResolvedValue(lesson);

      await expect(lessonService.getLessonById('lesson-123', 'student-123', 'student'))
        .rejects.toThrow('This lesson is not available yet');
    });

    it('should allow instructor to view own unpublished lesson', async () => {
      const instructorId = 'instructor-123';
      const lesson = factories.lesson({ 
        is_published: false,
        course_id: 'course-123'
      });
      const course = factories.course({ 
        id: 'course-123',
        instructor_id: instructorId 
      });
      
      lessonRepository.findById.mockResolvedValue(lesson);
      courseRepository.findById.mockResolvedValue(course);

      const result = await lessonService.getLessonById(
        'lesson-123',
        instructorId,
        'instructor'
      );

      expect(result.lesson).toEqual(lesson);
    });
  });

  describe('createLesson', () => {
    it('should create lesson with correct order number', async () => {
      const courseId = 'course-123';
      const instructorId = 'instructor-123';
      const lessonData = {
        title: 'New Lesson',
        content: 'Lesson content',
        duration: 30
      };
      const mockCourse = factories.course({ 
        id: courseId,
        instructor_id: instructorId 
      });
      const newLesson = factories.lesson({ 
        ...lessonData,
        course_id: courseId,
        order_number: 3
      });
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      lessonRepository.getMaxOrderNumber.mockResolvedValue(2);
      lessonRepository.create.mockResolvedValue(newLesson);

      const result = await lessonService.createLesson(courseId, lessonData, instructorId);

      expect(lessonRepository.create).toHaveBeenCalledWith({
        ...lessonData,
        course_id: courseId,
        order: undefined
      });
      expect(result).toEqual(newLesson);
    });

    it('should set order_number to 1 for first lesson', async () => {
      const courseId = 'course-123';
      const mockCourse = factories.course({ instructor_id: 'instructor-123' });
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      lessonRepository.getMaxOrderNumber.mockResolvedValue(0);
      lessonRepository.create.mockResolvedValue(factories.lesson());

      await lessonService.createLesson(courseId, { title: 'First Lesson', content: 'Lesson content here', duration: 30 }, 'instructor-123');

      expect(lessonRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: undefined })
      );
    });

    it('should throw error if not course instructor', async () => {
      const course = factories.course({ instructor_id: 'other-instructor' });
      courseRepository.findById.mockResolvedValue(course);

      await expect(lessonService.createLesson('course-123', {}, 'wrong-instructor'))
        .rejects.toThrow('You can only create lessons for your own courses');
    });
  });

  describe('updateLesson', () => {
    it('should update lesson successfully', async () => {
      const lessonId = 'lesson-123';
      const instructorId = 'instructor-123';
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      };
      const lesson = factories.lesson({ 
        id: lessonId,
        course_id: 'course-123'
      });
      const course = factories.course({ 
        id: 'course-123',
        instructor_id: instructorId 
      });
      const updatedLesson = { ...lesson, ...updateData };
      
      lessonRepository.findById.mockResolvedValue({ ...lesson, course });
      lessonRepository.update.mockResolvedValue(updatedLesson);

      const result = await lessonService.updateLesson(lessonId, updateData, instructorId);

      expect(lessonRepository.update).toHaveBeenCalledWith(lessonId, updateData);
      expect(result).toEqual(updatedLesson);
    });

    it('should throw error if not course instructor', async () => {
      const lesson = factories.lesson({ course_id: 'course-123' });
      const course = factories.course({ instructor_id: 'other-instructor' });
      
      lessonRepository.findById.mockResolvedValue({ ...lesson, course });

      await expect(lessonService.updateLesson(
        'lesson-123',
        {},
        'wrong-instructor'
      )).rejects.toThrow('You can only update lessons from your own courses');
    });
  });

  describe('deleteLesson', () => {
    it('should delete lesson and reorder remaining lessons', async () => {
      const lessonId = 'lesson-123';
      const instructorId = 'instructor-123';
      const lesson = factories.lesson({ 
        id: lessonId,
        course_id: 'course-123',
        order_number: 2
      });
      const course = factories.course({ 
        id: 'course-123',
        instructor_id: instructorId 
      });
      
      // Add hasAssignments method mock
      const lessonWithMethods = { 
        ...lesson, 
        course,
        hasAssignments: jest.fn().mockReturnValue(false)
      };
      
      lessonRepository.findById.mockResolvedValue(lessonWithMethods);
      lessonRepository.delete.mockResolvedValue(true);
      lessonRepository.reorderLessonsAfterDelete.mockResolvedValue();

      await lessonService.deleteLesson(lessonId, instructorId);

      expect(lessonRepository.delete).toHaveBeenCalledWith(lessonId);
      expect(lessonRepository.reorderLessonsAfterDelete).toHaveBeenCalledWith(
        'course-123',
        2
      );
    });
  });

  describe('reorderLessons', () => {
    it('should reorder lessons according to new order', async () => {
      const courseId = 'course-123';
      const instructorId = 'instructor-123';
      const lessonIds = ['lesson-1', 'lesson-3', 'lesson-2'];
      const course = factories.course({ 
        id: courseId,
        instructor_id: instructorId 
      });
      const lessons = [
        factories.lesson({ id: 'lesson-1' }),
        factories.lesson({ id: 'lesson-2' }),
        factories.lesson({ id: 'lesson-3' })
      ];
      
      courseRepository.findById.mockResolvedValue(course);
      lessonRepository.findByCourse.mockResolvedValue(lessons);
      lessonRepository.reorderLessons.mockResolvedValue();

      const lessonOrders = lessonIds.map((id, index) => ({ lessonId: id, order: index + 1 }));
      await lessonService.reorderLessons(courseId, lessonOrders, instructorId);

      expect(lessonRepository.update).toHaveBeenCalledTimes(3);
    });

    it('should throw error if lesson IDs do not match', async () => {
      const course = factories.course({ instructor_id: 'instructor-123' });
      const lessons = [
        factories.lesson({ id: 'lesson-1' }),
        factories.lesson({ id: 'lesson-2' })
      ];
      
      courseRepository.findById.mockResolvedValue(course);
      lessonRepository.findByCourse.mockResolvedValue(lessons);

      await expect(lessonService.reorderLessons(
        'course-123',
        [{ lessonId: 'lesson-1', order: 1 }],  // Missing lesson-2
        'instructor-123'
      )).rejects.toThrow();
    });
  });

  describe('getLessonProgress', () => {
    it('should return lesson progress for student', async () => {
      const courseId = 'course-123';
      const studentId = 'student-123';
      const lessons = [
        factories.lesson({ id: 'lesson-1', is_published: true }),
        factories.lesson({ id: 'lesson-2', is_published: true }),
        factories.lesson({ id: 'lesson-3', is_published: false })
      ];
      
      lessonRepository.findByCourse.mockResolvedValue(lessons);
      lessonRepository.getCompletedLessons.mockResolvedValue(['lesson-1']);

      const result = await lessonService.getLessonProgress(courseId, studentId);

      expect(result.totalLessons).toBe(2); // Only published lessons
      expect(result.completedLessons).toBe(1);
      expect(result.progressPercentage).toBe(50);
    });
  });
});
const factories = require('../utils/factories');

// Mock user repository
jest.mock('../../src/repositories/UserRepository', () => ({
  findById: jest.fn()
}));

// Mock database
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

// Mock the repository before requiring the service
jest.mock('../../src/repositories/CourseRepository', () => ({
  findAll: jest.fn(),
  count: jest.fn(),
  findById: jest.fn(),
  getPrerequisites: jest.fn(),
  getEnrollmentCount: jest.fn(),
  create: jest.fn(),
  setPrerequisites: jest.fn(),
  update: jest.fn(),
  checkCircularDependency: jest.fn(),
  delete: jest.fn(),
  findByInstructor: jest.fn(),
  getCompletedPrerequisites: jest.fn(),
  removePrerequisite: jest.fn(),
  addPrerequisite: jest.fn()
}));

const courseService = require('../../src/services/CourseService');
const courseRepository = require('../../src/repositories/CourseRepository');
const userRepository = require('../../src/repositories/UserRepository');
const { query } = require('../../src/config/database');

describe('CourseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCourses', () => {
    it('should return all courses with filters', async () => {
      const mockCourses = [
        factories.course({ title: 'JavaScript Basics' }),
        factories.course({ title: 'Advanced React' })
      ];
      
      // Add toJSON method to mock courses
      mockCourses.forEach(course => {
        course.toJSON = jest.fn().mockReturnValue({ ...course });
      });
      
      courseRepository.findAll.mockResolvedValue({ courses: mockCourses, total: 2 });
      courseRepository.getPrerequisites.mockResolvedValue([]);

      const result = await courseService.getAllCourses({ 
        search: 'JavaScript',
        page: 1,
        limit: 10 
      });

      expect(courseRepository.findAll).toHaveBeenCalledWith({
        search: 'JavaScript',
        limit: 10,
        offset: 0,
        instructor_id: undefined,
        available_only: undefined
      });
      expect(result.courses).toEqual(mockCourses.map(c => ({ ...c })));
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      courseRepository.findAll.mockResolvedValue({ courses: [], total: 25 });

      const result = await courseService.getAllCourses({ 
        page: 2,
        limit: 10 
      });

      expect(courseRepository.findAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 10
      });
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getCourseById', () => {
    it('should return course with enriched data', async () => {
      const courseId = 'test-course-id';
      const mockCourse = factories.course({ id: courseId });
      const mockPrerequisites = [factories.course({ title: 'Prerequisite Course' })];
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      courseRepository.getPrerequisites.mockResolvedValue(mockPrerequisites);
      courseRepository.getEnrollmentCount.mockResolvedValue(15);

      const result = await courseService.getCourseById(courseId);

      expect(courseRepository.findById).toHaveBeenCalledWith(courseId, true);
      expect(result.course).toEqual(mockCourse);
      expect(result.prerequisites).toEqual(mockPrerequisites);
      expect(result.enrollmentCount).toBe(15);
    });

    it('should throw error if course not found', async () => {
      courseRepository.findById.mockResolvedValue(null);

      await expect(courseService.getCourseById('non-existent'))
        .rejects.toThrow('Course not found');
    });
  });

  describe('createCourse', () => {
    it('should create course with valid data', async () => {
      const instructorId = 'instructor-123';
      const courseData = {
        title: 'New Course',
        description: 'Course description',
        capacity: 30
      };
      const mockCourse = factories.course({ ...courseData, instructor_id: instructorId });
      const mockInstructor = factories.user({ id: instructorId, role: 'instructor' });
      
      userRepository.findById.mockResolvedValue(mockInstructor);
      courseRepository.create.mockResolvedValue(mockCourse);
      courseRepository.getPrerequisites.mockResolvedValue([]);

      const result = await courseService.createCourse(courseData, instructorId);

      expect(courseRepository.create).toHaveBeenCalledWith({
        ...courseData,
        instructor_id: instructorId
      });
      expect(result).toEqual(mockCourse);
    });

    it('should create course with prerequisites', async () => {
      const instructorId = 'instructor-123';
      const courseData = {
        title: 'Advanced Course',
        description: 'Advanced topics',
        capacity: 20,
        prerequisiteIds: ['prereq-1', 'prereq-2']
      };
      const mockCourse = factories.course({ id: 'new-course-id' });
      const mockInstructor = factories.user({ id: instructorId, role: 'instructor' });
      const mockPrereqCourse = factories.course({ id: 'prereq-1' });
      
      userRepository.findById.mockResolvedValue(mockInstructor);
      courseRepository.create.mockResolvedValue(mockCourse);
      courseRepository.findById.mockResolvedValue(mockPrereqCourse);
      courseRepository.addPrerequisite.mockResolvedValue();
      courseRepository.getPrerequisites.mockResolvedValue([]);

      const result = await courseService.createCourse(courseData, instructorId);

      expect(courseRepository.addPrerequisite).toHaveBeenCalledTimes(2);
      expect(courseRepository.addPrerequisite).toHaveBeenCalledWith(
        'new-course-id',
        'prereq-1'
      );
    });
  });

  describe('updateCourse', () => {
    it('should update course successfully', async () => {
      const courseId = 'course-123';
      const instructorId = 'instructor-123';
      const updateData = {
        title: 'Updated Title',
        capacity: 40
      };
      const existingCourse = factories.course({ 
        id: courseId, 
        instructor_id: instructorId 
      });
      const updatedCourse = { ...existingCourse, ...updateData };
      
      courseRepository.findById.mockResolvedValue(existingCourse);
      courseRepository.update.mockResolvedValue(updatedCourse);

      const result = await courseService.updateCourse(courseId, updateData, instructorId);

      expect(courseRepository.update).toHaveBeenCalledWith(courseId, updateData);
      expect(result).toEqual(updatedCourse);
    });

    it('should throw error if not course owner', async () => {
      const existingCourse = factories.course({ instructor_id: 'other-instructor' });
      courseRepository.findById.mockResolvedValue(existingCourse);

      await expect(courseService.updateCourse('course-123', {}, 'wrong-instructor', 'instructor'))
        .rejects.toThrow('You can only update your own courses');
    });

    it('should check for circular dependencies with prerequisites', async () => {
      const courseId = 'course-123';
      const instructorId = 'instructor-123';
      const existingCourse = factories.course({ 
        id: courseId, 
        instructor_id: instructorId 
      });
      
      courseRepository.findById.mockResolvedValue(existingCourse);
      courseRepository.getPrerequisites.mockResolvedValue([]);
      courseRepository.checkCircularDependency
        .mockResolvedValue({ hasCircular: true });

      await expect(courseService.updateCourse(
        courseId, 
        { prerequisiteIds: ['prereq-1'] }, 
        instructorId
      )).rejects.toThrow('Circular dependency detected');
    });
  });

  describe('deleteCourse', () => {
    it('should delete course if no enrollments', async () => {
      const courseId = 'course-123';
      const instructorId = 'instructor-123';
      const existingCourse = factories.course({ 
        id: courseId, 
        instructor_id: instructorId 
      });
      
      courseRepository.findById.mockResolvedValue(existingCourse);
      courseRepository.getEnrollmentCount.mockResolvedValue(0);
      courseRepository.delete.mockResolvedValue(true);

      await courseService.deleteCourse(courseId, instructorId);

      expect(courseRepository.delete).toHaveBeenCalledWith(courseId);
    });

    it('should throw error if course has enrollments', async () => {
      const existingCourse = factories.course({ instructor_id: 'instructor-123' });
      
      courseRepository.findById.mockResolvedValue(existingCourse);
      courseRepository.getEnrollmentCount.mockResolvedValue(5);

      courseRepository.delete.mockResolvedValue(false);
      
      await expect(courseService.deleteCourse('course-123', 'instructor-123'))
        .rejects.toThrow('Failed to delete course');
    });
  });

  describe('getCoursesByInstructor', () => {
    it('should return instructor courses with stats', async () => {
      const instructorId = 'instructor-123';
      const mockCourses = [
        factories.course({ id: 'course-1', instructor_id: instructorId }),
        factories.course({ id: 'course-2', instructor_id: instructorId })
      ];
      
      // Add toJSON method to mock courses
      mockCourses.forEach(course => {
        course.toJSON = jest.fn().mockReturnValue({ ...course });
      });
      
      courseRepository.findByInstructor.mockResolvedValue(mockCourses);
      courseRepository.getEnrollmentCount
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(15);
      courseRepository.getPrerequisites.mockResolvedValue([]);

      const result = await courseService.getCoursesByInstructor(instructorId);

      expect(result).toHaveLength(2);
      expect(result[0].enrollmentCount).toBe(10);
      expect(result[1].enrollmentCount).toBe(15);
    });
  });

  describe('checkPrerequisites', () => {
    it('should return eligible when all prerequisites met', async () => {
      const courseId = 'course-123';
      const studentId = 'student-123';
      const prerequisites = [
        factories.course({ id: 'prereq-1' }),
        factories.course({ id: 'prereq-2' })
      ];
      
      courseRepository.getPrerequisites.mockResolvedValue(prerequisites);
      
      // Mock the database query for completed prerequisites
      query.mockResolvedValue({
        rows: [
          { course_id: 'prereq-1' },
          { course_id: 'prereq-2' }
        ]
      });

      const result = await courseService.checkPrerequisites(courseId, studentId);

      expect(result.canEnroll).toBe(true);
      expect(result.missingPrerequisites).toEqual([]);
    });

    it('should return missing prerequisites', async () => {
      const prerequisites = [
        factories.course({ id: 'prereq-1', title: 'Course 1' }),
        factories.course({ id: 'prereq-2', title: 'Course 2' })
      ];
      
      courseRepository.getPrerequisites.mockResolvedValue(prerequisites);
      
      // Mock the database query for completed prerequisites
      query.mockResolvedValue({
        rows: [
          { course_id: 'prereq-1' }
        ]
      });

      const result = await courseService.checkPrerequisites('course-123', 'student-123');

      expect(result.canEnroll).toBe(false);
      expect(result.missingPrerequisites).toHaveLength(1);
      expect(result.missingPrerequisites[0].title).toBe('Course 2');
    });
  });
});
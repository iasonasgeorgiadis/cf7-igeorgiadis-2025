const CourseRepository = require('../../src/repositories/CourseRepository');
const { query, getClient } = require('../../src/config/database');
const factories = require('../utils/factories');
const Course = require('../../src/models/Course');

// Mock the database
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn()
}));

// Mock the Course model
jest.mock('../../src/models/Course', () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    toJSON: jest.fn().mockReturnValue(data)
  }));
});

describe('CourseRepository', () => {
  let courseRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    courseRepository = new CourseRepository();
  });

  describe('findById', () => {
    it('should return course when found without details', async () => {
      const mockCourse = factories.course({ id: 'course-123' });
      query.mockResolvedValue({
        rows: [mockCourse],
        rowCount: 1
      });

      const result = await courseRepository.findById('course-123');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT c.* FROM courses c WHERE c.id = $1'),
        ['course-123']
      );
      expect(Course).toHaveBeenCalledWith(mockCourse);
      expect(result).toEqual(mockCourse);
    });

    it('should return course with details when includeDetails is true', async () => {
      const mockCourseData = {
        ...factories.course({ id: 'course-123' }),
        instructor_first_name: 'John',
        instructor_last_name: 'Doe',
        instructor_email: 'john@example.com',
        enrolled_count: '25'
      };

      query.mockResolvedValue({
        rows: [mockCourseData],
        rowCount: 1
      });

      const result = await courseRepository.findById('course-123', true);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN users u ON c.instructor_id = u.id'),
        ['course-123']
      );
      expect(mockCourseData.instructor).toEqual({
        id: mockCourseData.instructor_id,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        full_name: 'John Doe'
      });
    });

    it('should return null when course not found', async () => {
      query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const result = await courseRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return courses with default options', async () => {
      const mockCourses = [
        factories.course({ id: 'course-1' }),
        factories.course({ id: 'course-2' })
      ];

      query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // count query
        .mockResolvedValueOnce({ rows: mockCourses }); // main query

      const result = await courseRepository.findAll();

      expect(result.total).toBe(2);
      expect(result.courses).toHaveLength(2);
      expect(Course).toHaveBeenCalledTimes(2);
    });

    it('should filter by search term', async () => {
      const mockCourses = [factories.course({ title: 'JavaScript Basics' })];

      query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockCourses });

      await courseRepository.findAll({ search: 'JavaScript' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('c.title ILIKE $1 OR c.description ILIKE $1'),
        ['%JavaScript%']
      );
    });

    it('should filter by instructor_id', async () => {
      const mockCourses = [factories.course({ instructor_id: 'instructor-123' })];

      query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockCourses });

      await courseRepository.findAll({ instructor_id: 'instructor-123' });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('c.instructor_id = $1'),
        ['instructor-123']
      );
    });

    it('should apply limit and offset', async () => {
      query
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [] });

      await courseRepository.findAll({ limit: 5, offset: 10 });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1 OFFSET $2'),
        [5, 10]
      );
    });
  });

  describe('create', () => {
    it('should create new course', async () => {
      const courseData = {
        title: 'New Course',
        description: 'Course description',
        instructor_id: 'instructor-123',
        code: 'CS101',
        credits: 3,
        capacity: 30
      };

      const mockCourse = factories.course(courseData);
      query.mockResolvedValue({
        rows: [mockCourse],
        rowCount: 1
      });

      const result = await courseRepository.create(courseData);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO courses'),
        expect.arrayContaining([
          courseData.title,
          courseData.description,
          courseData.instructor_id,
          courseData.code,
          courseData.credits,
          courseData.capacity
        ])
      );
      expect(Course).toHaveBeenCalledWith(mockCourse);
    });
  });

  describe('update', () => {
    it('should update course with provided fields', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const mockCourse = factories.course({ id: 'course-123', ...updates });
      query.mockResolvedValue({
        rows: [mockCourse],
        rowCount: 1
      });

      const result = await courseRepository.update('course-123', updates);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE courses SET'),
        expect.arrayContaining(['course-123'])
      );
      expect(Course).toHaveBeenCalledWith(mockCourse);
    });

    it('should return null if course not found', async () => {
      query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const result = await courseRepository.update('non-existent', { title: 'New Title' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete course successfully', async () => {
      query.mockResolvedValue({
        rowCount: 1
      });

      const result = await courseRepository.delete('course-123');

      expect(query).toHaveBeenCalledWith(
        'DELETE FROM courses WHERE id = $1',
        ['course-123']
      );
      expect(result).toBe(true);
    });

    it('should return false if course not found', async () => {
      query.mockResolvedValue({
        rowCount: 0
      });

      const result = await courseRepository.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getPrerequisites', () => {
    it('should return course prerequisites', async () => {
      const mockPrerequisites = [
        { id: 'prereq-1', title: 'Math 101', code: 'MATH101' },
        { id: 'prereq-2', title: 'Physics 101', code: 'PHYS101' }
      ];

      query.mockResolvedValue({
        rows: mockPrerequisites
      });

      const result = await courseRepository.getPrerequisites('course-123');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT p.* FROM courses p'),
        ['course-123']
      );
      expect(result).toHaveLength(2);
      expect(Course).toHaveBeenCalledTimes(2);
    });
  });

  describe('addPrerequisite', () => {
    it('should add prerequisite successfully', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rowCount: 1 }),
        release: jest.fn()
      };
      getClient.mockResolvedValue(mockClient);

      const result = await courseRepository.addPrerequisite('course-123', 'prereq-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO course_prerequisites (course_id, prerequisite_id) VALUES ($1, $2)',
        ['course-123', 'prereq-123']
      );
      expect(result).toBe(true);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Database error')),
        release: jest.fn()
      };
      getClient.mockResolvedValue(mockClient);

      await expect(
        courseRepository.addPrerequisite('course-123', 'prereq-123')
      ).rejects.toThrow('Database error');

      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('removePrerequisite', () => {
    it('should remove prerequisite successfully', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rowCount: 1 }),
        release: jest.fn()
      };
      getClient.mockResolvedValue(mockClient);

      const result = await courseRepository.removePrerequisite('course-123', 'prereq-123');

      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM course_prerequisites WHERE course_id = $1 AND prerequisite_id = $2',
        ['course-123', 'prereq-123']
      );
      expect(result).toBe(true);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('findByInstructor', () => {
    it('should return instructor courses with stats', async () => {
      const mockCourses = [
        {
          ...factories.course({ instructor_id: 'instructor-123' }),
          enrolled_count: '25',
          completed_count: '20'
        }
      ];

      query.mockResolvedValue({
        rows: mockCourses
      });

      const result = await courseRepository.findByInstructor('instructor-123');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.instructor_id = $1'),
        ['instructor-123']
      );
      expect(result).toHaveLength(1);
      expect(Course).toHaveBeenCalledWith(mockCourses[0]);
    });
  });
});
const factories = require('../utils/factories');

// Mock database client
jest.mock('../../src/config/database', () => ({
  getClient: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn()
  })
}));

// Mock repositories before requiring the service
jest.mock('../../src/repositories/AssignmentRepository');
jest.mock('../../src/repositories/LessonRepository');
jest.mock('../../src/repositories/CourseRepository', () => ({
  findById: jest.fn()
}));
jest.mock('../../src/repositories/EnrollmentRepository', () => ({
  findByStudentAndCourse: jest.fn()
}));

const AssignmentService = require('../../src/services/AssignmentService');
const db = require('../../src/config/database');

describe('AssignmentService', () => {
  let assignmentService;
  let mockAssignmentRepository;
  let mockLessonRepository;
  let mockCourseRepository;
  let mockEnrollmentRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get mocked repositories
    const AssignmentRepository = require('../../src/repositories/AssignmentRepository');
    const LessonRepository = require('../../src/repositories/LessonRepository');
    mockCourseRepository = require('../../src/repositories/CourseRepository');
    mockEnrollmentRepository = require('../../src/repositories/EnrollmentRepository');

    // Create mock instances
    mockAssignmentRepository = {
      findById: jest.fn(),
      findByLesson: jest.fn(),
      findByCourse: jest.fn(),
      findUpcomingForStudent: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getInstructorStats: jest.fn()
    };

    mockLessonRepository = {
      findById: jest.fn()
    };

    // Mock constructor implementations
    AssignmentRepository.mockImplementation(() => mockAssignmentRepository);
    LessonRepository.mockImplementation(() => mockLessonRepository);

    assignmentService = new AssignmentService(db);
  });

  describe('getLessonAssignments', () => {
    it('should get assignments for a lesson when user is enrolled', async () => {
      const lessonId = 'lesson-123';
      const userId = 'student-123';
      const userRole = 'student';

      const mockLesson = factories.lesson({ id: lessonId, course_id: 'course-123' });
      const mockCourse = factories.course({ id: 'course-123' });
      const mockEnrollment = factories.enrollment({ 
        student_id: userId, 
        course_id: 'course-123',
        status: 'active'
      });
      const mockAssignments = [
        factories.assignment({ lesson_id: lessonId }),
        factories.assignment({ lesson_id: lessonId })
      ];

      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(mockEnrollment);
      mockAssignmentRepository.findByLesson.mockResolvedValueOnce(mockAssignments);

      const result = await assignmentService.getLessonAssignments(lessonId, userId, userRole);

      expect(result.lesson).toMatchObject({
        id: lessonId,
        title: mockLesson.title,
        course_id: mockCourse.id,
        course_title: mockCourse.title
      });
      expect(result.assignments).toEqual(mockAssignments);
      expect(mockEnrollmentRepository.findByStudentAndCourse).toHaveBeenCalledWith(userId, mockCourse.id);
    });

    it('should get assignments for instructor of the course', async () => {
      const lessonId = 'lesson-123';
      const instructorId = 'instructor-123';
      const userRole = 'instructor';

      const mockLesson = factories.lesson({ id: lessonId, course_id: 'course-123' });
      const mockCourse = factories.course({ 
        id: 'course-123',
        instructor_id: instructorId 
      });
      const mockAssignments = [factories.assignment({ lesson_id: lessonId })];

      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);
      mockAssignmentRepository.findByLesson.mockResolvedValueOnce(mockAssignments);

      const result = await assignmentService.getLessonAssignments(lessonId, instructorId, userRole);

      expect(result.assignments).toEqual(mockAssignments);
      expect(mockEnrollmentRepository.findByStudentAndCourse).not.toHaveBeenCalled();
    });

    it('should throw error if lesson not found', async () => {
      mockLessonRepository.findById.mockResolvedValueOnce(null);

      await expect(
        assignmentService.getLessonAssignments('invalid-id', 'user-123', 'student')
      ).rejects.toThrow('Lesson not found');
    });

    it('should throw error if student not enrolled', async () => {
      const lessonId = 'lesson-123';
      const userId = 'student-123';

      const mockLesson = factories.lesson({ id: lessonId });
      const mockCourse = factories.course({ id: mockLesson.course_id });

      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(null);

      await expect(
        assignmentService.getLessonAssignments(lessonId, userId, 'student')
      ).rejects.toThrow('You must be enrolled in this course to view assignments');
    });

    it('should throw error if instructor does not own course', async () => {
      const lessonId = 'lesson-123';
      const instructorId = 'instructor-123';

      const mockLesson = factories.lesson({ id: lessonId });
      const mockCourse = factories.course({ 
        id: mockLesson.course_id,
        instructor_id: 'other-instructor' 
      });

      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);

      await expect(
        assignmentService.getLessonAssignments(lessonId, instructorId, 'instructor')
      ).rejects.toThrow('You can only view assignments for your own courses');
    });
  });

  describe('getCourseAssignments', () => {
    it('should get all assignments for a course', async () => {
      const courseId = 'course-123';
      const userId = 'student-123';
      const userRole = 'student';

      const mockCourse = factories.course({ id: courseId });
      const mockEnrollment = factories.enrollment({ 
        student_id: userId, 
        course_id: courseId,
        status: 'active'
      });
      const mockAssignments = [
        factories.assignment({ lesson_id: 'lesson-1' }),
        factories.assignment({ lesson_id: 'lesson-2' })
      ];

      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(mockEnrollment);
      mockAssignmentRepository.findByCourse.mockResolvedValueOnce(mockAssignments);

      const result = await assignmentService.getCourseAssignments(courseId, userId, userRole);

      expect(result.course).toMatchObject({
        id: courseId,
        title: mockCourse.title,
        code: mockCourse.code
      });
      expect(result.assignments).toEqual(mockAssignments);
    });

    it('should throw error if course not found', async () => {
      mockCourseRepository.findById.mockResolvedValueOnce(null);

      await expect(
        assignmentService.getCourseAssignments('invalid-id', 'user-123', 'student')
      ).rejects.toThrow('Course not found');
    });
  });

  describe('getAssignmentById', () => {
    it('should get assignment details for enrolled student', async () => {
      const assignmentId = 'assignment-123';
      const userId = 'student-123';
      const userRole = 'student';

      const mockAssignment = factories.assignment({ 
        id: assignmentId,
        lesson_id: 'lesson-123' 
      });
      const mockLesson = factories.lesson({ 
        id: 'lesson-123',
        course_id: 'course-123' 
      });
      const mockCourse = factories.course({ id: 'course-123' });
      const mockEnrollment = factories.enrollment({ 
        student_id: userId,
        course_id: 'course-123',
        status: 'active'
      });

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(mockEnrollment);

      const result = await assignmentService.getAssignmentById(assignmentId, userId, userRole);

      expect(result).toEqual(mockAssignment);
      expect(mockAssignmentRepository.findById).toHaveBeenCalledWith(assignmentId, false);
    });

    it('should include submission stats for instructor', async () => {
      const assignmentId = 'assignment-123';
      const instructorId = 'instructor-123';
      const userRole = 'instructor';

      const mockAssignment = factories.assignment({ 
        id: assignmentId,
        lesson_id: 'lesson-123' 
      });
      const mockLesson = factories.lesson({ 
        id: 'lesson-123',
        course_id: 'course-123' 
      });
      const mockCourse = factories.course({ 
        id: 'course-123',
        instructor_id: instructorId 
      });

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);

      const result = await assignmentService.getAssignmentById(assignmentId, instructorId, userRole);

      expect(result).toEqual(mockAssignment);
      expect(mockAssignmentRepository.findById).toHaveBeenCalledWith(assignmentId, true);
    });

    it('should throw error if assignment not found', async () => {
      mockAssignmentRepository.findById.mockResolvedValueOnce(null);

      await expect(
        assignmentService.getAssignmentById('invalid-id', 'user-123', 'student')
      ).rejects.toThrow('Assignment not found');
    });
  });

  describe('getUpcomingAssignments', () => {
    it('should get upcoming assignments for student', async () => {
      const studentId = 'student-123';
      const limit = 5;
      const mockAssignments = [
        factories.assignment({ due_date: new Date(Date.now() + 86400000) }),
        factories.assignment({ due_date: new Date(Date.now() + 172800000) })
      ];

      mockAssignmentRepository.findUpcomingForStudent.mockResolvedValueOnce(mockAssignments);

      const result = await assignmentService.getUpcomingAssignments(studentId, limit);

      expect(result).toEqual(mockAssignments);
      expect(mockAssignmentRepository.findUpcomingForStudent).toHaveBeenCalledWith(studentId, limit);
    });
  });

  describe('createAssignment', () => {
    it('should create assignment for instructor\'s course', async () => {
      const lessonId = 'lesson-123';
      const instructorId = 'instructor-123';
      const assignmentData = {
        title: 'Test Assignment',
        description: 'This is a test assignment description',
        due_date: new Date(Date.now() + 86400000).toISOString(),
        points: 100
      };

      const mockLesson = factories.lesson({ id: lessonId, course_id: 'course-123' });
      const mockCourse = factories.course({ 
        id: 'course-123',
        instructor_id: instructorId 
      });
      const mockAssignment = factories.assignment({
        ...assignmentData,
        lesson_id: lessonId
      });

      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);
      mockAssignmentRepository.create.mockResolvedValueOnce(mockAssignment);

      const result = await assignmentService.createAssignment(lessonId, assignmentData, instructorId);

      expect(result).toEqual(mockAssignment);
      expect(mockAssignmentRepository.create).toHaveBeenCalledWith({
        lesson_id: lessonId,
        title: assignmentData.title,
        description: assignmentData.description,
        due_date: assignmentData.due_date,
        points: assignmentData.points
      });
    });

    it('should throw error if lesson not found', async () => {
      mockLessonRepository.findById.mockResolvedValueOnce(null);

      await expect(
        assignmentService.createAssignment('invalid-id', {}, 'instructor-123')
      ).rejects.toThrow('Lesson not found');
    });

    it('should throw error if instructor does not own course', async () => {
      const lessonId = 'lesson-123';
      const instructorId = 'instructor-123';

      const mockLesson = factories.lesson({ id: lessonId });
      const mockCourse = factories.course({ 
        id: mockLesson.course_id,
        instructor_id: 'other-instructor' 
      });

      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);

      await expect(
        assignmentService.createAssignment(lessonId, {}, instructorId)
      ).rejects.toThrow('You can only create assignments for your own courses');
    });

    it('should validate assignment title', async () => {
      const lessonId = 'lesson-123';
      const instructorId = 'instructor-123';

      const mockLesson = factories.lesson({ id: lessonId });
      const mockCourse = factories.course({ 
        id: mockLesson.course_id,
        instructor_id: instructorId 
      });

      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);

      await expect(
        assignmentService.createAssignment(lessonId, { title: 'ab' }, instructorId)
      ).rejects.toThrow('Assignment title must be at least 3 characters long');
    });

    it('should validate assignment description', async () => {
      const lessonId = 'lesson-123';
      const instructorId = 'instructor-123';

      const mockLesson = factories.lesson({ id: lessonId });
      const mockCourse = factories.course({ 
        id: mockLesson.course_id,
        instructor_id: instructorId 
      });

      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);

      await expect(
        assignmentService.createAssignment(lessonId, { 
          title: 'Valid Title',
          description: 'Short' 
        }, instructorId)
      ).rejects.toThrow('Assignment description must be at least 10 characters long');
    });

    it('should validate due date is in future', async () => {
      const lessonId = 'lesson-123';
      const instructorId = 'instructor-123';

      const mockLesson = factories.lesson({ id: lessonId });
      const mockCourse = factories.course({ 
        id: mockLesson.course_id,
        instructor_id: instructorId 
      });

      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);

      await expect(
        assignmentService.createAssignment(lessonId, { 
          title: 'Valid Title',
          description: 'Valid description',
          due_date: new Date(Date.now() - 86400000).toISOString()
        }, instructorId)
      ).rejects.toThrow('Due date must be in the future');
    });

    it('should validate points range', async () => {
      const lessonId = 'lesson-123';
      const instructorId = 'instructor-123';

      const mockLesson = factories.lesson({ id: lessonId });
      const mockCourse = factories.course({ 
        id: mockLesson.course_id,
        instructor_id: instructorId 
      });

      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);

      await expect(
        assignmentService.createAssignment(lessonId, { 
          title: 'Valid Title',
          description: 'Valid description',
          due_date: new Date(Date.now() + 86400000).toISOString(),
          points: 150
        }, instructorId)
      ).rejects.toThrow('Points must be between 1 and 100');
    });
  });

  describe('updateAssignment', () => {
    it('should update assignment successfully', async () => {
      const assignmentId = 'assignment-123';
      const instructorId = 'instructor-123';
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description that is long enough',
        points: 90
      };

      const mockAssignment = factories.assignment({ 
        id: assignmentId,
        lesson_id: 'lesson-123' 
      });
      const mockLesson = factories.lesson({ 
        id: 'lesson-123',
        course_id: 'course-123' 
      });
      const mockCourse = factories.course({ 
        id: 'course-123',
        instructor_id: instructorId 
      });
      const updatedAssignment = { ...mockAssignment, ...updateData };

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);
      mockAssignmentRepository.update.mockResolvedValueOnce(updatedAssignment);

      const result = await assignmentService.updateAssignment(assignmentId, updateData, instructorId);

      expect(result).toEqual(updatedAssignment);
      expect(mockAssignmentRepository.update).toHaveBeenCalledWith(assignmentId, updateData);
    });

    it('should throw error if assignment not found', async () => {
      mockAssignmentRepository.findById.mockResolvedValueOnce(null);

      await expect(
        assignmentService.updateAssignment('invalid-id', {}, 'instructor-123')
      ).rejects.toThrow('Assignment not found');
    });

    it('should validate update data', async () => {
      const assignmentId = 'assignment-123';
      const instructorId = 'instructor-123';

      const mockAssignment = factories.assignment({ id: assignmentId });
      const mockLesson = factories.lesson({ id: mockAssignment.lesson_id });
      const mockCourse = factories.course({ 
        id: mockLesson.course_id,
        instructor_id: instructorId 
      });

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);

      await expect(
        assignmentService.updateAssignment(assignmentId, { title: 'ab' }, instructorId)
      ).rejects.toThrow('Assignment title must be at least 3 characters long');
    });
  });

  describe('deleteAssignment', () => {
    it('should delete assignment successfully', async () => {
      const assignmentId = 'assignment-123';
      const instructorId = 'instructor-123';

      const mockAssignment = factories.assignment({ 
        id: assignmentId,
        lesson_id: 'lesson-123' 
      });
      const mockLesson = factories.lesson({ 
        id: 'lesson-123',
        course_id: 'course-123' 
      });
      const mockCourse = factories.course({ 
        id: 'course-123',
        instructor_id: instructorId 
      });

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);
      mockAssignmentRepository.delete.mockResolvedValueOnce(true);

      const result = await assignmentService.deleteAssignment(assignmentId, instructorId);

      expect(result).toBe(true);
      expect(mockAssignmentRepository.delete).toHaveBeenCalledWith(assignmentId);
    });

    it('should throw error if instructor does not own course', async () => {
      const assignmentId = 'assignment-123';
      const instructorId = 'instructor-123';

      const mockAssignment = factories.assignment({ id: assignmentId });
      const mockLesson = factories.lesson({ id: mockAssignment.lesson_id });
      const mockCourse = factories.course({ 
        id: mockLesson.course_id,
        instructor_id: 'other-instructor' 
      });

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockLessonRepository.findById.mockResolvedValueOnce(mockLesson);
      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);

      await expect(
        assignmentService.deleteAssignment(assignmentId, instructorId)
      ).rejects.toThrow('You can only delete assignments for your own courses');
    });
  });

  describe('getInstructorStats', () => {
    it('should get instructor statistics', async () => {
      const instructorId = 'instructor-123';
      const mockStats = {
        total_assignments: 10,
        total_submissions: 25,
        graded_submissions: 20,
        pending_submissions: 5
      };

      mockAssignmentRepository.getInstructorStats.mockResolvedValueOnce(mockStats);

      const result = await assignmentService.getInstructorStats(instructorId);

      expect(result).toEqual(mockStats);
      expect(mockAssignmentRepository.getInstructorStats).toHaveBeenCalledWith(instructorId);
    });
  });
});
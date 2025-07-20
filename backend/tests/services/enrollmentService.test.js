const factories = require('../utils/factories');

// Mock database client
jest.mock('../../src/config/database', () => ({
  getClient: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn()
  })
}));

// Mock repositories before requiring the service
jest.mock('../../src/repositories/EnrollmentRepository', () => ({
  findByStudentAndCourse: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findByStudent: jest.fn(),
  findByCourse: jest.fn(),
  countActiveByCourse: jest.fn(),
  hasCompletedPrerequisites: jest.fn(),
  getCompletedCourseIds: jest.fn()
}));

jest.mock('../../src/repositories/CourseRepository', () => ({
  findById: jest.fn(),
  getEnrollmentCount: jest.fn(),
  getPrerequisites: jest.fn(),
  getCompletedPrerequisites: jest.fn()
}));

const enrollmentService = require('../../src/services/EnrollmentService');
const enrollmentRepository = require('../../src/repositories/EnrollmentRepository');
const courseRepository = require('../../src/repositories/CourseRepository');

describe('EnrollmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enrollStudent', () => {
    it('should enroll student successfully', async () => {
      const studentId = 'student-123';
      const courseId = 'course-123';
      const mockCourse = factories.course({ 
        id: courseId, 
        capacity: 30 
      });
      const mockEnrollment = factories.enrollment({ 
        student_id: studentId, 
        course_id: courseId 
      });
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      enrollmentRepository.countActiveByCourse.mockResolvedValue(10);
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      courseRepository.getPrerequisites.mockResolvedValue([]);
      enrollmentRepository.hasCompletedPrerequisites.mockResolvedValue(true);
      enrollmentRepository.create.mockResolvedValue(mockEnrollment);

      const result = await enrollmentService.enrollStudent(studentId, courseId);

      expect(enrollmentRepository.create).toHaveBeenCalledWith({
        student_id: studentId,
        course_id: courseId
      });
      expect(result).toEqual(mockEnrollment);
    });

    it('should throw error if course is full', async () => {
      const mockCourse = factories.course({ capacity: 20 });
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      enrollmentRepository.countActiveByCourse.mockResolvedValue(20);

      await expect(enrollmentService.enrollStudent('student-123', 'course-123'))
        .rejects.toThrow('Course is full');
    });

    it('should throw error if already enrolled', async () => {
      const mockCourse = factories.course();
      const existingEnrollment = factories.enrollment({ status: 'active' });
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      courseRepository.getEnrollmentCount.mockResolvedValue(5);
      enrollmentRepository.findByStudentAndCourse
        .mockResolvedValue(existingEnrollment);

      await expect(enrollmentService.enrollStudent('student-123', 'course-123'))
        .rejects.toThrow('You are already enrolled in this course');
    });

    it('should allow re-enrollment if previously dropped', async () => {
      const studentId = 'student-123';
      const courseId = 'course-123';
      const mockCourse = factories.course({ id: courseId });
      const droppedEnrollment = factories.enrollment({ 
        id: 'enrollment-123',
        status: 'dropped' 
      });
      const updatedEnrollment = { ...droppedEnrollment, status: 'active' };
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      courseRepository.getEnrollmentCount.mockResolvedValue(5);
      enrollmentRepository.findByStudentAndCourse
        .mockResolvedValue(droppedEnrollment);
      courseRepository.getPrerequisites.mockResolvedValue([]);
      enrollmentRepository.update.mockResolvedValue(updatedEnrollment);

      const result = await enrollmentService.enrollStudent(studentId, courseId);

      expect(enrollmentRepository.update).toHaveBeenCalledWith(
        'enrollment-123',
        {
          status: 'active'
        }
      );
      expect(result).toEqual(updatedEnrollment);
    });

    it('should check prerequisites before enrollment', async () => {
      const mockCourse = factories.course();
      const prerequisites = [factories.course({ id: 'prereq-1' })];
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      courseRepository.getEnrollmentCount.mockResolvedValue(5);
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      courseRepository.getPrerequisites.mockResolvedValue(prerequisites);
      enrollmentRepository.hasCompletedPrerequisites.mockResolvedValue(false);
      enrollmentRepository.getCompletedCourseIds.mockResolvedValue([]);

      await expect(enrollmentService.enrollStudent('student-123', 'course-123'))
        .rejects.toThrow('Prerequisites not met');
    });
  });

  describe('dropCourse', () => {
    it('should drop course successfully', async () => {
      const enrollmentId = 'enrollment-123';
      const enrollment = factories.enrollment({ 
        id: enrollmentId,
        student_id: 'student-123',
        status: 'active' 
      });
      const updatedEnrollment = { ...enrollment, status: 'dropped' };
      
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(enrollment);
      enrollmentRepository.update.mockResolvedValue(updatedEnrollment);

      await enrollmentService.dropCourse('student-123', 'course-123');

      expect(enrollmentRepository.update).toHaveBeenCalledWith(
        enrollmentId,
        { status: 'dropped' }
      );
    });

    it('should throw error if not enrolled', async () => {
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);

      await expect(enrollmentService.dropCourse('student-123', 'course-123'))
        .rejects.toThrow('You are not enrolled in this course');
    });

    it('should throw error if already dropped', async () => {
      const enrollment = factories.enrollment({ status: 'dropped' });
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(enrollment);

      await expect(enrollmentService.dropCourse('student-123', 'course-123'))
        .rejects.toThrow('You can only drop active enrollments');
    });
  });

  describe('getStudentEnrollments', () => {
    it('should return student enrollments with details', async () => {
      const studentId = 'student-123';
      const enrollments = [
        factories.enrollment({ 
          course: factories.course({ title: 'Course 1' }),
          completion_percentage: 50
        }),
        factories.enrollment({ 
          course: factories.course({ title: 'Course 2' }),
          completion_percentage: 100,
          status: 'completed'
        })
      ];
      
      enrollmentRepository.findByStudent.mockResolvedValue(enrollments);

      const result = await enrollmentService.getStudentEnrollments(studentId);

      expect(enrollmentRepository.findByStudent).toHaveBeenCalledWith(
        studentId,
        null
      );
      expect(result).toEqual(enrollments.map(e => e.toJSON()));
    });

    it('should filter by status', async () => {
      const studentId = 'student-123';
      const activeEnrollments = [
        factories.enrollment({ status: 'active' })
      ];
      
      enrollmentRepository.findByStudent.mockResolvedValue(activeEnrollments);

      const result = await enrollmentService.getStudentEnrollments(studentId, 'active');

      expect(enrollmentRepository.findByStudent).toHaveBeenCalledWith(
        studentId,
        'active'
      );
      expect(result).toEqual(activeEnrollments.map(e => e.toJSON()));
    });
  });

  describe('updateProgress', () => {
    it('should update enrollment progress', async () => {
      const studentId = 'student-123';
      const courseId = 'course-123';
      const enrollment = factories.enrollment({ 
        id: 'enrollment-123',
        completion_percentage: 50 
      });
      const updatedEnrollment = { 
        ...enrollment, 
        completion_percentage: 75 
      };
      
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(enrollment);
      enrollmentRepository.update.mockResolvedValue(updatedEnrollment);

      const result = await enrollmentService.updateProgress('enrollment-123', 75);

      expect(enrollmentRepository.update).toHaveBeenCalledWith(
        'enrollment-123',
        { completion_percentage: 75 }
      );
      expect(result).toEqual(updatedEnrollment);
    });

    it('should mark as completed when progress is 100%', async () => {
      const enrollment = factories.enrollment({ 
        id: 'enrollment-123',
        completion_percentage: 90 
      });
      
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(enrollment);
      enrollmentRepository.update.mockResolvedValue({
        ...enrollment,
        completion_percentage: 100,
        status: 'completed'
      });

      await enrollmentService.updateProgress('enrollment-123', 100);

      expect(enrollmentRepository.update).toHaveBeenCalledWith(
        'enrollment-123',
        {
          completion_percentage: 100,
          status: 'completed',
          completed_at: expect.any(Date)
        }
      );
    });
  });

  describe('checkEnrollmentEligibility', () => {
    it('should return eligible when all conditions are met', async () => {
      const studentId = 'student-123';
      const courseId = 'course-123';
      const mockCourse = factories.course({ 
        id: courseId, 
        capacity: 30 
      });
      mockCourse.isFull = jest.fn().mockReturnValue(false);
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      courseRepository.getPrerequisites.mockResolvedValue([]);

      const result = await enrollmentService.checkEnrollmentEligibility(studentId, courseId);

      expect(result.canEnroll).toBe(true);
      expect(result.reasons).toEqual([]);
    });

    it('should return all reasons why student cannot enroll', async () => {
      const mockCourse = factories.course({ capacity: 20 });
      mockCourse.isFull = jest.fn().mockReturnValue(true);
      const prerequisites = [
        factories.course({ id: 'prereq-1', title: 'Prereq Course' })
      ];
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      enrollmentRepository.findByStudentAndCourse.mockResolvedValue(null);
      courseRepository.getPrerequisites.mockResolvedValue(prerequisites);
      enrollmentRepository.hasCompletedPrerequisites.mockResolvedValue(false);

      const result = await enrollmentService.checkEnrollmentEligibility('student-123', 'course-123');

      expect(result.canEnroll).toBe(false);
      expect(result.reasons).toContain('Course is full');
      expect(result.reasons).toContain('Prerequisites not met');
      expect(result.missingPrerequisites).toHaveLength(1);
    });
  });

  describe('getCourseEnrollments', () => {
    it('should return enrolled students for instructor', async () => {
      const courseId = 'course-123';
      const instructorId = 'instructor-123';
      const mockCourse = factories.course({ 
        id: courseId,
        instructor_id: instructorId 
      });
      const enrollments = [
        factories.enrollment({ 
          student: factories.user({ 
            first_name: 'John', 
            last_name: 'Doe' 
          })
        })
      ];
      
      courseRepository.findById.mockResolvedValue(mockCourse);
      enrollmentRepository.findByCourse.mockResolvedValue(enrollments);

      const result = await enrollmentService.getCourseEnrollments(courseId, instructorId);

      expect(enrollmentRepository.findByCourse).toHaveBeenCalledWith(
        courseId,
        'active'
      );
      expect(result).toEqual(enrollments.map(e => e.toJSON()));
    });

    it('should throw error if not course instructor', async () => {
      const mockCourse = factories.course({ instructor_id: 'other-instructor' });
      courseRepository.findById.mockResolvedValue(mockCourse);

      await expect(enrollmentService.getCourseEnrollments('course-123', 'wrong-instructor'))
        .rejects.toThrow('You can only view enrollments for your own courses');
    });
  });
});
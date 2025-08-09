const factories = require('../utils/factories');

// Mock database client
jest.mock('../../src/config/database', () => ({
  getClient: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn()
  })
}));

// Mock repositories before requiring the service
jest.mock('../../src/repositories/SubmissionRepository');
jest.mock('../../src/repositories/AssignmentRepository');
jest.mock('../../src/repositories/CourseRepository', () => ({
  findById: jest.fn()
}));
jest.mock('../../src/repositories/EnrollmentRepository', () => ({
  findByStudentAndCourse: jest.fn()
}));

const SubmissionService = require('../../src/services/SubmissionService');
const db = require('../../src/config/database');

describe('SubmissionService', () => {
  let submissionService;
  let mockSubmissionRepository;
  let mockAssignmentRepository;
  let mockCourseRepository;
  let mockEnrollmentRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get mocked repositories
    const SubmissionRepository = require('../../src/repositories/SubmissionRepository');
    const AssignmentRepository = require('../../src/repositories/AssignmentRepository');
    mockCourseRepository = require('../../src/repositories/CourseRepository');
    mockEnrollmentRepository = require('../../src/repositories/EnrollmentRepository');

    // Create mock instances
    mockSubmissionRepository = {
      findById: jest.fn(),
      findByAssignment: jest.fn(),
      findByAssignmentAndStudent: jest.fn(),
      findByStudentAndCourse: jest.fn(),
      findPendingForInstructor: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      grade: jest.fn(),
      delete: jest.fn(),
      getCourseStats: jest.fn()
    };

    mockAssignmentRepository = {
      findById: jest.fn()
    };

    // Mock constructor implementations
    SubmissionRepository.mockImplementation(() => mockSubmissionRepository);
    AssignmentRepository.mockImplementation(() => mockAssignmentRepository);

    submissionService = new SubmissionService(db);
  });

  describe('getSubmissionById', () => {
    it('should get submission for student owner', async () => {
      const submissionId = 'submission-123';
      const studentId = 'student-123';
      const userRole = 'student';

      const mockSubmission = {
        id: submissionId,
        student_id: studentId,
        assignment_id: 'assignment-123',
        content: 'Test submission content',
        course: { id: 'course-123', instructor_id: 'instructor-123' }
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);

      const result = await submissionService.getSubmissionById(submissionId, studentId, userRole);

      expect(result).toEqual(mockSubmission);
      expect(mockSubmissionRepository.findById).toHaveBeenCalledWith(submissionId);
    });

    it('should get submission for course instructor', async () => {
      const submissionId = 'submission-123';
      const instructorId = 'instructor-123';
      const userRole = 'instructor';

      const mockSubmission = {
        id: submissionId,
        student_id: 'student-123',
        assignment_id: 'assignment-123',
        course: { id: 'course-123', instructor_id: instructorId }
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);

      const result = await submissionService.getSubmissionById(submissionId, instructorId, userRole);

      expect(result).toEqual(mockSubmission);
    });

    it('should throw error if submission not found', async () => {
      mockSubmissionRepository.findById.mockResolvedValueOnce(null);

      await expect(
        submissionService.getSubmissionById('invalid-id', 'user-123', 'student')
      ).rejects.toThrow('Submission not found');
    });

    it('should throw error if student tries to view other\'s submission', async () => {
      const mockSubmission = {
        id: 'submission-123',
        student_id: 'other-student',
        course: { id: 'course-123', instructor_id: 'instructor-123' }
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);

      await expect(
        submissionService.getSubmissionById('submission-123', 'student-123', 'student')
      ).rejects.toThrow('You can only view your own submissions');
    });

    it('should throw error if instructor tries to view submission from other course', async () => {
      const mockSubmission = {
        id: 'submission-123',
        student_id: 'student-123',
        course: { id: 'course-123', instructor_id: 'other-instructor' }
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);

      await expect(
        submissionService.getSubmissionById('submission-123', 'instructor-123', 'instructor')
      ).rejects.toThrow('You can only view submissions for your own courses');
    });
  });

  describe('getAssignmentSubmissions', () => {
    it('should get all submissions for an assignment', async () => {
      const assignmentId = 'assignment-123';
      const instructorId = 'instructor-123';

      const mockAssignment = {
        id: assignmentId,
        title: 'Test Assignment',
        points: 100,
        due_date: new Date(),
        course: { id: 'course-123', instructor_id: instructorId },
        getSubmissionStats: jest.fn().mockReturnValue({
          total: 5,
          submitted: 3,
          graded: 2,
          average: 85
        })
      };

      const mockSubmissions = [
        factories.submission({ assignment_id: assignmentId }),
        factories.submission({ assignment_id: assignmentId })
      ];

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockSubmissionRepository.findByAssignment.mockResolvedValueOnce(mockSubmissions);

      const result = await submissionService.getAssignmentSubmissions(assignmentId, instructorId);

      expect(result.assignment).toMatchObject({
        id: assignmentId,
        title: mockAssignment.title,
        points: mockAssignment.points,
        due_date: mockAssignment.due_date
      });
      expect(result.submissions).toEqual(mockSubmissions);
      expect(result.stats).toEqual({
        total: 5,
        submitted: 3,
        graded: 2,
        average: 85
      });
      expect(mockSubmissionRepository.findByAssignment).toHaveBeenCalledWith(assignmentId, true);
    });

    it('should throw error if assignment not found', async () => {
      mockAssignmentRepository.findById.mockResolvedValueOnce(null);

      await expect(
        submissionService.getAssignmentSubmissions('invalid-id', 'instructor-123')
      ).rejects.toThrow('Assignment not found');
    });

    it('should throw error if instructor does not own course', async () => {
      const mockAssignment = {
        id: 'assignment-123',
        course: { id: 'course-123', instructor_id: 'other-instructor' }
      };

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);

      await expect(
        submissionService.getAssignmentSubmissions('assignment-123', 'instructor-123')
      ).rejects.toThrow('You can only view submissions for your own assignments');
    });
  });

  describe('getStudentSubmission', () => {
    it('should get student submission for assignment', async () => {
      const assignmentId = 'assignment-123';
      const studentId = 'student-123';

      const mockAssignment = {
        id: assignmentId,
        title: 'Test Assignment',
        description: 'Test description',
        points: 100,
        due_date: new Date(Date.now() + 86400000),
        course: { id: 'course-123' },
        isPastDue: jest.fn().mockReturnValue(false),
        getTimeRemaining: jest.fn().mockReturnValue('1 day')
      };

      const mockEnrollment = factories.enrollment({
        student_id: studentId,
        course_id: 'course-123',
        status: 'active'
      });

      const mockSubmission = factories.submission({
        assignment_id: assignmentId,
        student_id: studentId
      });

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(mockEnrollment);
      mockSubmissionRepository.findByAssignmentAndStudent.mockResolvedValueOnce(mockSubmission);

      const result = await submissionService.getStudentSubmission(assignmentId, studentId);

      expect(result.assignment).toMatchObject({
        id: assignmentId,
        title: mockAssignment.title,
        description: mockAssignment.description,
        points: mockAssignment.points,
        due_date: mockAssignment.due_date,
        is_past_due: false,
        time_remaining: '1 day'
      });
      expect(result.submission).toEqual(mockSubmission);
    });

    it('should return null submission if not submitted yet', async () => {
      const assignmentId = 'assignment-123';
      const studentId = 'student-123';

      const mockAssignment = {
        id: assignmentId,
        course: { id: 'course-123' },
        isPastDue: jest.fn().mockReturnValue(false),
        getTimeRemaining: jest.fn().mockReturnValue('2 days')
      };

      const mockEnrollment = factories.enrollment({
        student_id: studentId,
        course_id: 'course-123',
        status: 'active'
      });

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(mockEnrollment);
      mockSubmissionRepository.findByAssignmentAndStudent.mockResolvedValueOnce(null);

      const result = await submissionService.getStudentSubmission(assignmentId, studentId);

      expect(result.submission).toBeNull();
    });

    it('should throw error if student not enrolled', async () => {
      const mockAssignment = {
        id: 'assignment-123',
        course: { id: 'course-123' }
      };

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(null);

      await expect(
        submissionService.getStudentSubmission('assignment-123', 'student-123')
      ).rejects.toThrow('You must be enrolled in this course to view assignments');
    });
  });

  describe('getStudentCourseSubmissions', () => {
    it('should get all student submissions for a course', async () => {
      const courseId = 'course-123';
      const studentId = 'student-123';

      const mockCourse = factories.course({ id: courseId });
      const mockEnrollment = factories.enrollment({
        student_id: studentId,
        course_id: courseId,
        status: 'active'
      });

      const mockSubmissions = [
        {
          id: 'sub-1',
          assignment: { points: 100 },
          grade: 90,
          isGraded: jest.fn().mockReturnValue(true)
        },
        {
          id: 'sub-2',
          assignment: { points: 50 },
          grade: 45,
          isGraded: jest.fn().mockReturnValue(true)
        },
        {
          id: 'sub-3',
          assignment: { points: 100 },
          isGraded: jest.fn().mockReturnValue(false)
        }
      ];

      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(mockEnrollment);
      mockSubmissionRepository.findByStudentAndCourse.mockResolvedValueOnce(mockSubmissions);

      const result = await submissionService.getStudentCourseSubmissions(courseId, studentId);

      expect(result.course).toMatchObject({
        id: courseId,
        title: mockCourse.title,
        code: mockCourse.code
      });
      expect(result.submissions).toEqual(mockSubmissions);
      expect(result.stats).toEqual({
        total_assignments: 3,
        submitted: 3,
        graded: 2,
        average_grade: 90 // (90+45)/(100+50) * 100
      });
    });

    it('should throw error if course not found', async () => {
      mockCourseRepository.findById.mockResolvedValueOnce(null);

      await expect(
        submissionService.getStudentCourseSubmissions('invalid-id', 'student-123')
      ).rejects.toThrow('Course not found');
    });

    it('should throw error if student not enrolled', async () => {
      const mockCourse = factories.course({ id: 'course-123' });

      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(null);

      await expect(
        submissionService.getStudentCourseSubmissions('course-123', 'student-123')
      ).rejects.toThrow('You must be enrolled in this course to view submissions');
    });
  });

  describe('submitAssignment', () => {
    it('should create new submission', async () => {
      const assignmentId = 'assignment-123';
      const studentId = 'student-123';
      const content = 'This is my submission content for the assignment';

      const mockAssignment = {
        id: assignmentId,
        course: { id: 'course-123' }
      };

      const mockEnrollment = factories.enrollment({
        student_id: studentId,
        course_id: 'course-123',
        status: 'active'
      });

      const mockSubmission = factories.submission({
        assignment_id: assignmentId,
        student_id: studentId,
        content: content
      });

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(mockEnrollment);
      mockSubmissionRepository.findByAssignmentAndStudent.mockResolvedValueOnce(null);
      mockSubmissionRepository.create.mockResolvedValueOnce(mockSubmission);

      const result = await submissionService.submitAssignment(assignmentId, studentId, content);

      expect(result).toEqual(mockSubmission);
      expect(mockSubmissionRepository.create).toHaveBeenCalledWith({
        assignment_id: assignmentId,
        student_id: studentId,
        content: content
      });
    });

    it('should update existing ungraded submission', async () => {
      const assignmentId = 'assignment-123';
      const studentId = 'student-123';
      const content = 'Updated submission content';

      const mockAssignment = {
        id: assignmentId,
        course: { id: 'course-123' }
      };

      const mockEnrollment = factories.enrollment({
        student_id: studentId,
        course_id: 'course-123',
        status: 'active'
      });

      const existingSubmission = {
        id: 'submission-123',
        isGraded: jest.fn().mockReturnValue(false)
      };

      const updatedSubmission = {
        ...existingSubmission,
        content: content
      };

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(mockEnrollment);
      mockSubmissionRepository.findByAssignmentAndStudent.mockResolvedValueOnce(existingSubmission);
      mockSubmissionRepository.update.mockResolvedValueOnce(updatedSubmission);

      const result = await submissionService.submitAssignment(assignmentId, studentId, content);

      expect(result).toEqual(updatedSubmission);
      expect(mockSubmissionRepository.update).toHaveBeenCalledWith('submission-123', content);
    });

    it('should throw error if assignment not found', async () => {
      mockAssignmentRepository.findById.mockResolvedValueOnce(null);

      await expect(
        submissionService.submitAssignment('invalid-id', 'student-123', 'content')
      ).rejects.toThrow('Assignment not found');
    });

    it('should throw error if student not enrolled', async () => {
      const mockAssignment = {
        id: 'assignment-123',
        course: { id: 'course-123' }
      };

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(null);

      await expect(
        submissionService.submitAssignment('assignment-123', 'student-123', 'content')
      ).rejects.toThrow('You must be enrolled in this course to submit assignments');
    });

    it('should validate content length', async () => {
      const mockAssignment = {
        id: 'assignment-123',
        course: { id: 'course-123' }
      };

      const mockEnrollment = factories.enrollment({
        student_id: 'student-123',
        course_id: 'course-123',
        status: 'active'
      });

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(mockEnrollment);

      await expect(
        submissionService.submitAssignment('assignment-123', 'student-123', 'short')
      ).rejects.toThrow('Submission content must be at least 10 characters long');
    });

    it('should throw error if trying to resubmit graded assignment', async () => {
      const mockAssignment = {
        id: 'assignment-123',
        course: { id: 'course-123' }
      };

      const mockEnrollment = factories.enrollment({
        student_id: 'student-123',
        course_id: 'course-123',
        status: 'active'
      });

      const existingSubmission = {
        id: 'submission-123',
        isGraded: jest.fn().mockReturnValue(true)
      };

      mockAssignmentRepository.findById.mockResolvedValueOnce(mockAssignment);
      mockEnrollmentRepository.findByStudentAndCourse.mockResolvedValueOnce(mockEnrollment);
      mockSubmissionRepository.findByAssignmentAndStudent.mockResolvedValueOnce(existingSubmission);

      await expect(
        submissionService.submitAssignment('assignment-123', 'student-123', 'new content')
      ).rejects.toThrow('Cannot resubmit after assignment has been graded');
    });
  });

  describe('gradeSubmission', () => {
    it('should grade submission successfully', async () => {
      const submissionId = 'submission-123';
      const instructorId = 'instructor-123';
      const grade = 85;
      const feedback = 'Good work!';

      const mockSubmission = {
        id: submissionId,
        assignment: { points: 100 },
        course: { instructor_id: instructorId }
      };

      const gradedSubmission = {
        ...mockSubmission,
        grade: grade,
        feedback: feedback
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);
      mockSubmissionRepository.grade.mockResolvedValueOnce(gradedSubmission);

      const result = await submissionService.gradeSubmission(submissionId, instructorId, grade, feedback);

      expect(result).toEqual(gradedSubmission);
      expect(mockSubmissionRepository.grade).toHaveBeenCalledWith(submissionId, grade, feedback);
    });

    it('should throw error if submission not found', async () => {
      mockSubmissionRepository.findById.mockResolvedValueOnce(null);

      await expect(
        submissionService.gradeSubmission('invalid-id', 'instructor-123', 85)
      ).rejects.toThrow('Submission not found');
    });

    it('should throw error if instructor does not own course', async () => {
      const mockSubmission = {
        id: 'submission-123',
        course: { instructor_id: 'other-instructor' }
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);

      await expect(
        submissionService.gradeSubmission('submission-123', 'instructor-123', 85)
      ).rejects.toThrow('You can only grade submissions for your own courses');
    });

    it('should validate grade range', async () => {
      const mockSubmission = {
        id: 'submission-123',
        assignment: { points: 100 },
        course: { instructor_id: 'instructor-123' }
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);

      await expect(
        submissionService.gradeSubmission('submission-123', 'instructor-123', 150)
      ).rejects.toThrow('Grade must be between 0 and 100');
    });

    it('should validate feedback length', async () => {
      const mockSubmission = {
        id: 'submission-123',
        assignment: { points: 100 },
        course: { instructor_id: 'instructor-123' }
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);

      await expect(
        submissionService.gradeSubmission('submission-123', 'instructor-123', 85, 'ok')
      ).rejects.toThrow('Feedback must be at least 3 characters long');
    });
  });

  describe('deleteSubmission', () => {
    it('should allow student to delete own ungraded submission', async () => {
      const submissionId = 'submission-123';
      const studentId = 'student-123';

      const mockSubmission = {
        id: submissionId,
        student_id: studentId,
        course: { instructor_id: 'instructor-123' },
        isGraded: jest.fn().mockReturnValue(false)
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);
      mockSubmissionRepository.delete.mockResolvedValueOnce(true);

      const result = await submissionService.deleteSubmission(submissionId, studentId, 'student');

      expect(result).toBe(true);
      expect(mockSubmissionRepository.delete).toHaveBeenCalledWith(submissionId);
    });

    it('should allow instructor to delete any submission', async () => {
      const submissionId = 'submission-123';
      const instructorId = 'instructor-123';

      const mockSubmission = {
        id: submissionId,
        student_id: 'student-123',
        course: { instructor_id: instructorId },
        isGraded: jest.fn().mockReturnValue(true)
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);
      mockSubmissionRepository.delete.mockResolvedValueOnce(true);

      const result = await submissionService.deleteSubmission(submissionId, instructorId, 'instructor');

      expect(result).toBe(true);
    });

    it('should throw error if submission not found', async () => {
      mockSubmissionRepository.findById.mockResolvedValueOnce(null);

      await expect(
        submissionService.deleteSubmission('invalid-id', 'user-123', 'student')
      ).rejects.toThrow('Submission not found');
    });

    it('should throw error if student tries to delete other\'s submission', async () => {
      const mockSubmission = {
        id: 'submission-123',
        student_id: 'other-student',
        course: { instructor_id: 'instructor-123' }
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);

      await expect(
        submissionService.deleteSubmission('submission-123', 'student-123', 'student')
      ).rejects.toThrow('You can only delete your own submissions');
    });

    it('should throw error if student tries to delete graded submission', async () => {
      const mockSubmission = {
        id: 'submission-123',
        student_id: 'student-123',
        course: { instructor_id: 'instructor-123' },
        isGraded: jest.fn().mockReturnValue(true)
      };

      mockSubmissionRepository.findById.mockResolvedValueOnce(mockSubmission);

      await expect(
        submissionService.deleteSubmission('submission-123', 'student-123', 'student')
      ).rejects.toThrow('Cannot delete graded submissions');
    });
  });

  describe('getCourseStats', () => {
    it('should get course statistics for instructor', async () => {
      const courseId = 'course-123';
      const instructorId = 'instructor-123';

      const mockCourse = factories.course({
        id: courseId,
        instructor_id: instructorId
      });

      const mockStats = {
        total_assignments: 10,
        total_submissions: 50,
        graded_submissions: 40,
        pending_submissions: 10,
        average_grade: 85
      };

      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);
      mockSubmissionRepository.getCourseStats.mockResolvedValueOnce(mockStats);

      const result = await submissionService.getCourseStats(courseId, instructorId);

      expect(result.course).toMatchObject({
        id: courseId,
        title: mockCourse.title,
        code: mockCourse.code
      });
      expect(result.stats).toEqual(mockStats);
    });

    it('should throw error if course not found', async () => {
      mockCourseRepository.findById.mockResolvedValueOnce(null);

      await expect(
        submissionService.getCourseStats('invalid-id', 'instructor-123')
      ).rejects.toThrow('Course not found');
    });

    it('should throw error if instructor does not own course', async () => {
      const mockCourse = factories.course({
        id: 'course-123',
        instructor_id: 'other-instructor'
      });

      mockCourseRepository.findById.mockResolvedValueOnce(mockCourse);

      await expect(
        submissionService.getCourseStats('course-123', 'instructor-123')
      ).rejects.toThrow('You can only view statistics for your own courses');
    });
  });

  describe('getPendingSubmissions', () => {
    it('should get pending submissions for instructor', async () => {
      const instructorId = 'instructor-123';
      const limit = 10;

      const mockSubmissions = [
        factories.submission({ grade: null }),
        factories.submission({ grade: null })
      ];

      mockSubmissionRepository.findPendingForInstructor.mockResolvedValueOnce(mockSubmissions);

      const result = await submissionService.getPendingSubmissions(instructorId, limit);

      expect(result).toEqual(mockSubmissions);
      expect(mockSubmissionRepository.findPendingForInstructor).toHaveBeenCalledWith(instructorId, limit);
    });
  });
});
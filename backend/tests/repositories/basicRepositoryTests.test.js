// Basic repository functionality tests
const factories = require('../utils/factories');

// Mock database
const mockDb = {
  query: jest.fn()
};

const { query } = require('../../src/config/database');
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

// Mock repositories
const AssignmentRepository = require('../../src/repositories/AssignmentRepository');
const SubmissionRepository = require('../../src/repositories/SubmissionRepository');

describe('Basic Repository Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.query.mockReset();
    query.mockReset();
  });

  describe('AssignmentRepository', () => {
    let assignmentRepo;

    beforeEach(() => {
      assignmentRepo = new AssignmentRepository(mockDb);
    });

    it('should find assignments by lesson', async () => {
      const mockAssignments = [
        factories.assignment({ lesson_id: 'lesson-123' }),
        factories.assignment({ lesson_id: 'lesson-123' })
      ];

      mockDb.query.mockResolvedValue({
        rows: mockAssignments
      });

      const result = await assignmentRepo.findByLesson('lesson-123');

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
    });

    it('should create assignment', async () => {
      const assignmentData = {
        lesson_id: 'lesson-123',
        title: 'Test Assignment',
        description: 'Test description',
        due_date: new Date(),
        points: 100
      };

      const mockAssignment = factories.assignment(assignmentData);
      mockDb.query.mockResolvedValue({
        rows: [mockAssignment]
      });

      const result = await assignmentRepo.create(assignmentData);

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(result.title).toBe(assignmentData.title);
    });

    it('should delete assignment', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: 'assignment-123' }]
      });

      const result = await assignmentRepo.delete('assignment-123');

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });
  });

  describe('SubmissionRepository', () => {
    let submissionRepo;

    beforeEach(() => {
      submissionRepo = new SubmissionRepository(mockDb);
    });

    it('should find submission by assignment and student', async () => {
      const mockSubmission = factories.submission({
        assignment_id: 'assignment-123',
        student_id: 'student-123'
      });

      mockDb.query.mockResolvedValue({
        rows: [mockSubmission]
      });

      const result = await submissionRepo.findByAssignmentAndStudent('assignment-123', 'student-123');

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(result.assignment_id).toBe('assignment-123');
    });

    it('should create submission', async () => {
      const submissionData = {
        assignment_id: 'assignment-123',
        student_id: 'student-123',
        content: 'My submission content'
      };

      const mockSubmission = factories.submission(submissionData);
      mockDb.query.mockResolvedValue({
        rows: [mockSubmission]
      });

      const result = await submissionRepo.create(submissionData);

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(result.content).toBe(submissionData.content);
    });

    it('should grade submission', async () => {
      const mockSubmission = factories.submission({
        id: 'submission-123',
        grade: 85,
        feedback: 'Good work!'
      });

      mockDb.query.mockResolvedValue({
        rows: [mockSubmission]
      });

      const result = await submissionRepo.grade('submission-123', 85, 'Good work!');

      expect(mockDb.query).toHaveBeenCalledTimes(1);
      expect(result.grade).toBe(85);
    });
  });
});
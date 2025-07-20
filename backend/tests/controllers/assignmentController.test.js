const request = require('supertest');
const express = require('express');
const assignmentRoutes = require('../../src/routes/assignments');

// Mock the assignment service
jest.mock('../../src/services/AssignmentService', () => {
  return jest.fn().mockImplementation(() => ({
    getLessonAssignments: jest.fn(),
    getCourseAssignments: jest.fn(),
    getAssignmentById: jest.fn(),
    getUpcomingAssignments: jest.fn(),
    createAssignment: jest.fn(),
    updateAssignment: jest.fn(),
    deleteAssignment: jest.fn(),
    getInstructorStats: jest.fn()
  }));
});

// Mock authentication middleware
jest.mock('../../src/middlewares/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'instructor'
    };
    next();
  },
  authorize: (...roles) => (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Access denied' });
    }
  }
}));

const AssignmentService = require('../../src/services/AssignmentService');

describe('Assignment Controller', () => {
  let app;
  let assignmentService;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/assignments', assignmentRoutes);
    
    assignmentService = new AssignmentService();
    jest.clearAllMocks();
  });

  describe('GET /assignments/lesson/:lessonId', () => {
    it('should get assignments for a lesson', async () => {
      const mockResponse = {
        lesson: {
          id: 'lesson-123',
          title: 'Test Lesson',
          course_id: 'course-123',
          course_title: 'Test Course'
        },
        assignments: [
          {
            id: 'assignment-1',
            title: 'Assignment 1',
            description: 'First assignment',
            due_date: new Date(),
            points: 100
          }
        ]
      };

      assignmentService.getLessonAssignments.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .get('/assignments/lesson/lesson-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lesson.id).toBe('lesson-123');
      expect(response.body.data.assignments).toHaveLength(1);
      expect(assignmentService.getLessonAssignments).toHaveBeenCalledWith(
        'lesson-123',
        'user-123',
        'instructor'
      );
    });

    it('should handle service errors', async () => {
      assignmentService.getLessonAssignments.mockRejectedValueOnce(new Error('Lesson not found'));

      const response = await request(app)
        .get('/assignments/lesson/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Lesson not found');
    });
  });

  describe('GET /assignments/course/:courseId', () => {
    it('should get assignments for a course', async () => {
      const mockResponse = {
        course: {
          id: 'course-123',
          title: 'Test Course',
          code: 'CS101'
        },
        assignments: [
          {
            id: 'assignment-1',
            title: 'Assignment 1',
            lesson_title: 'Lesson 1',
            due_date: new Date(),
            points: 100
          }
        ]
      };

      assignmentService.getCourseAssignments.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .get('/assignments/course/course-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course.id).toBe('course-123');
      expect(response.body.data.assignments).toHaveLength(1);
      expect(assignmentService.getCourseAssignments).toHaveBeenCalledWith(
        'course-123',
        'user-123',
        'instructor'
      );
    });
  });

  describe('GET /assignments/:id', () => {
    it('should get assignment by id', async () => {
      const mockAssignment = {
        id: 'assignment-123',
        title: 'Test Assignment',
        description: 'Assignment description',
        due_date: new Date(),
        points: 100,
        lesson_id: 'lesson-123'
      };

      assignmentService.getAssignmentById.mockResolvedValueOnce(mockAssignment);

      const response = await request(app)
        .get('/assignments/assignment-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('assignment-123');
      expect(assignmentService.getAssignmentById).toHaveBeenCalledWith(
        'assignment-123',
        'user-123',
        'instructor'
      );
    });

    it('should return 404 for non-existent assignment', async () => {
      assignmentService.getAssignmentById.mockRejectedValueOnce(new Error('Assignment not found'));

      const response = await request(app)
        .get('/assignments/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /assignments/lesson/:lessonId', () => {
    it('should create assignment successfully', async () => {
      const assignmentData = {
        title: 'New Assignment',
        description: 'Assignment description',
        due_date: new Date(Date.now() + 86400000).toISOString(),
        points: 100
      };

      const mockAssignment = {
        id: 'assignment-123',
        lesson_id: 'lesson-123',
        ...assignmentData
      };

      assignmentService.createAssignment.mockResolvedValueOnce(mockAssignment);

      const response = await request(app)
        .post('/assignments/lesson/lesson-123')
        .send(assignmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(assignmentData.title);
      expect(assignmentService.createAssignment).toHaveBeenCalledWith(
        'lesson-123',
        assignmentData,
        'user-123'
      );
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = {
        title: 'ab', // too short
        description: 'short', // too short
        due_date: new Date(Date.now() - 86400000).toISOString(), // past date
        points: 150 // too high
      };

      const response = await request(app)
        .post('/assignments/lesson/lesson-123')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /assignments/:id', () => {
    it('should update assignment successfully', async () => {
      const updateData = {
        title: 'Updated Assignment',
        description: 'Updated description',
        points: 90
      };

      const mockUpdatedAssignment = {
        id: 'assignment-123',
        ...updateData
      };

      assignmentService.updateAssignment.mockResolvedValueOnce(mockUpdatedAssignment);

      const response = await request(app)
        .put('/assignments/assignment-123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(assignmentService.updateAssignment).toHaveBeenCalledWith(
        'assignment-123',
        updateData,
        'user-123'
      );
    });

    it('should return 404 for non-existent assignment', async () => {
      assignmentService.updateAssignment.mockRejectedValueOnce(new Error('Assignment not found'));

      const response = await request(app)
        .put('/assignments/invalid-id')
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /assignments/:id', () => {
    it('should delete assignment successfully', async () => {
      assignmentService.deleteAssignment.mockResolvedValueOnce(true);

      const response = await request(app)
        .delete('/assignments/assignment-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Assignment deleted successfully');
      expect(assignmentService.deleteAssignment).toHaveBeenCalledWith(
        'assignment-123',
        'user-123'
      );
    });

    it('should return 404 for non-existent assignment', async () => {
      assignmentService.deleteAssignment.mockRejectedValueOnce(new Error('Assignment not found'));

      const response = await request(app)
        .delete('/assignments/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /assignments/stats/instructor', () => {
    it('should get instructor statistics', async () => {
      const mockStats = {
        total_assignments: 15,
        total_submissions: 45,
        graded_submissions: 35,
        pending_submissions: 10,
        avg_grade: 87.2
      };

      assignmentService.getInstructorStats.mockResolvedValueOnce(mockStats);

      const response = await request(app)
        .get('/assignments/stats/instructor')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_assignments).toBe(15);
      expect(assignmentService.getInstructorStats).toHaveBeenCalledWith('user-123');
    });
  });
});
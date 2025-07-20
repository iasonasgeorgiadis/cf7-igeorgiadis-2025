const request = require('supertest');
const express = require('express');
const submissionRoutes = require('../../src/routes/submissions');

// Mock the submission controller
jest.mock('../../src/controllers/SubmissionController', () => {
  return jest.fn().mockImplementation(() => ({
    getPendingSubmissions: jest.fn(),
    getAssignmentSubmissions: jest.fn(),
    getStudentSubmission: jest.fn(),
    submitAssignment: jest.fn(),
    getStudentCourseSubmissions: jest.fn(),
    getCourseStats: jest.fn(),
    getSubmissionById: jest.fn(),
    gradeSubmission: jest.fn(),
    deleteSubmission: jest.fn()
  }));
});

// Mock database
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

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

const SubmissionController = require('../../src/controllers/SubmissionController');

describe('Submission Controller', () => {
  let app;
  let mockController;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', submissionRoutes);
    
    // Get the mock controller instance
    mockController = new SubmissionController();
    jest.clearAllMocks();
  });

  describe('GET /submissions/pending', () => {
    it('should get pending submissions for instructor', async () => {
      const mockPendingSubmissions = {
        submissions: [
          {
            id: 'submission-1',
            assignment: {
              id: 'assignment-1',
              title: 'JavaScript Basics',
              course_title: 'Web Development'
            },
            student: {
              id: 'student-1',
              firstName: 'John',
              lastName: 'Doe'
            },
            submitted_at: new Date(),
            content: 'Student solution...'
          },
          {
            id: 'submission-2',
            assignment: {
              id: 'assignment-2',
              title: 'React Components',
              course_title: 'Frontend Development'
            },
            student: {
              id: 'student-2',
              firstName: 'Jane',
              lastName: 'Smith'
            },
            submitted_at: new Date(),
            content: 'Another solution...'
          }
        ],
        total: 2
      };

      mockController.getPendingSubmissions.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockPendingSubmissions
        });
      });

      const response = await request(app)
        .get('/api/submissions/pending?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.submissions).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(mockController.getPendingSubmissions).toHaveBeenCalled();
    });
  });

  describe('GET /assignments/:assignmentId/submissions', () => {
    it('should get assignment submissions for instructor', async () => {
      const mockSubmissions = {
        assignment: {
          id: 'assignment-123',
          title: 'JavaScript Functions',
          due_date: new Date()
        },
        submissions: [
          {
            id: 'submission-1',
            student: {
              id: 'student-1',
              firstName: 'John',
              lastName: 'Doe'
            },
            submitted_at: new Date(),
            grade: 85,
            feedback: 'Good work!'
          },
          {
            id: 'submission-2',
            student: {
              id: 'student-2',
              firstName: 'Jane',
              lastName: 'Smith'
            },
            submitted_at: new Date(),
            grade: null,
            feedback: null
          }
        ],
        stats: {
          total: 2,
          graded: 1,
          pending: 1,
          avg_grade: 85
        }
      };

      mockController.getAssignmentSubmissions.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockSubmissions
        });
      });

      const response = await request(app)
        .get('/api/assignments/assignment-123/submissions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.submissions).toHaveLength(2);
      expect(response.body.data.stats.total).toBe(2);
      expect(mockController.getAssignmentSubmissions).toHaveBeenCalled();
    });
  });

  describe('GET /assignments/:assignmentId/submission', () => {
    beforeEach(() => {
      // Mock student role for this endpoint
      jest.doMock('../../src/middlewares/auth', () => ({
        authenticate: (req, res, next) => {
          req.user = {
            id: 'student-123',
            email: 'student@example.com',
            role: 'student'
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
    });

    it('should get student submission for assignment', async () => {
      const mockSubmission = {
        id: 'submission-123',
        assignment: {
          id: 'assignment-123',
          title: 'JavaScript Functions',
          due_date: new Date(),
          points: 100
        },
        content: 'My solution to the assignment...',
        submitted_at: new Date(),
        grade: 85,
        feedback: 'Great work! Consider optimizing the loop.'
      };

      mockController.getStudentSubmission.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockSubmission
        });
      });

      // Create a new app instance with student auth
      const studentApp = express();
      studentApp.use(express.json());
      studentApp.use((req, res, next) => {
        req.user = {
          id: 'student-123',
          email: 'student@example.com',
          role: 'student'
        };
        next();
      });
      studentApp.use('/api', submissionRoutes);

      const response = await request(studentApp)
        .get('/api/assignments/assignment-123/submission')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.grade).toBe(85);
      expect(mockController.getStudentSubmission).toHaveBeenCalled();
    });
  });

  describe('POST /assignments/:assignmentId/submit', () => {
    beforeEach(() => {
      // Mock student role for this endpoint
      jest.doMock('../../src/middlewares/auth', () => ({
        authenticate: (req, res, next) => {
          req.user = {
            id: 'student-123',
            email: 'student@example.com',
            role: 'student'
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
    });

    it('should submit assignment successfully', async () => {
      const submissionData = {
        content: 'Here is my solution to the assignment...',
        attachments: ['file1.js', 'file2.md']
      };

      const mockSubmission = {
        id: 'submission-456',
        assignment_id: 'assignment-123',
        student_id: 'student-123',
        content: submissionData.content,
        attachments: submissionData.attachments,
        submitted_at: new Date()
      };

      mockController.submitAssignment.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          data: mockSubmission
        });
      });

      // Create a new app instance with student auth
      const studentApp = express();
      studentApp.use(express.json());
      studentApp.use((req, res, next) => {
        req.user = {
          id: 'student-123',
          email: 'student@example.com',
          role: 'student'
        };
        next();
      });
      studentApp.use('/api', submissionRoutes);

      const response = await request(studentApp)
        .post('/api/assignments/assignment-123/submit')
        .send(submissionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(submissionData.content);
      expect(mockController.submitAssignment).toHaveBeenCalled();
    });

    it('should handle submission after deadline', async () => {
      const submissionData = {
        content: 'Late submission...'
      };

      mockController.submitAssignment.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          message: 'Assignment deadline has passed'
        });
      });

      // Create a new app instance with student auth
      const studentApp = express();
      studentApp.use(express.json());
      studentApp.use((req, res, next) => {
        req.user = {
          id: 'student-123',
          email: 'student@example.com',
          role: 'student'
        };
        next();
      });
      studentApp.use('/api', submissionRoutes);

      const response = await request(studentApp)
        .post('/api/assignments/assignment-123/submit')
        .send(submissionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Assignment deadline has passed');
    });
  });

  describe('PUT /submissions/:id/grade', () => {
    it('should grade submission successfully (instructor only)', async () => {
      const gradeData = {
        grade: 92,
        feedback: 'Excellent work! Very clean code and good logic.'
      };

      const mockGradedSubmission = {
        id: 'submission-123',
        grade: gradeData.grade,
        feedback: gradeData.feedback,
        graded_at: new Date(),
        graded_by: 'user-123'
      };

      mockController.gradeSubmission.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockGradedSubmission
        });
      });

      const response = await request(app)
        .put('/api/submissions/submission-123/grade')
        .send(gradeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.grade).toBe(92);
      expect(response.body.data.feedback).toBe(gradeData.feedback);
      expect(mockController.gradeSubmission).toHaveBeenCalled();
    });

    it('should return validation errors for invalid grade', async () => {
      const invalidGradeData = {
        grade: 150, // over 100
        feedback: 'ab' // too short
      };

      const response = await request(app)
        .put('/api/submissions/submission-123/grade')
        .send(invalidGradeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /courses/:courseId/submissions', () => {
    beforeEach(() => {
      // Mock student role for this endpoint
      jest.doMock('../../src/middlewares/auth', () => ({
        authenticate: (req, res, next) => {
          req.user = {
            id: 'student-123',
            email: 'student@example.com',
            role: 'student'
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
    });

    it('should get student course submissions', async () => {
      const mockCourseSubmissions = {
        course: {
          id: 'course-123',
          title: 'JavaScript Fundamentals'
        },
        submissions: [
          {
            id: 'submission-1',
            assignment: {
              id: 'assignment-1',
              title: 'Variables Exercise',
              due_date: new Date()
            },
            submitted_at: new Date(),
            grade: 90,
            feedback: 'Good work!'
          },
          {
            id: 'submission-2',
            assignment: {
              id: 'assignment-2',
              title: 'Functions Exercise',
              due_date: new Date()
            },
            submitted_at: new Date(),
            grade: 85,
            feedback: 'Well done!'
          }
        ],
        stats: {
          total_submissions: 2,
          graded_submissions: 2,
          avg_grade: 87.5
        }
      };

      mockController.getStudentCourseSubmissions.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockCourseSubmissions
        });
      });

      // Create a new app instance with student auth
      const studentApp = express();
      studentApp.use(express.json());
      studentApp.use((req, res, next) => {
        req.user = {
          id: 'student-123',
          email: 'student@example.com',
          role: 'student'
        };
        next();
      });
      studentApp.use('/api', submissionRoutes);

      const response = await request(studentApp)
        .get('/api/courses/course-123/submissions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.submissions).toHaveLength(2);
      expect(response.body.data.stats.avg_grade).toBe(87.5);
      expect(mockController.getStudentCourseSubmissions).toHaveBeenCalled();
    });
  });

  describe('GET /courses/:courseId/submission-stats', () => {
    it('should get course submission statistics (instructor only)', async () => {
      const mockStats = {
        course: {
          id: 'course-123',
          title: 'JavaScript Fundamentals'
        },
        total_assignments: 10,
        total_submissions: 85,
        graded_submissions: 70,
        pending_submissions: 15,
        avg_grade: 82.3,
        grade_distribution: {
          'A': 20,
          'B': 30,
          'C': 15,
          'D': 5,
          'F': 0
        }
      };

      mockController.getCourseStats.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockStats
        });
      });

      const response = await request(app)
        .get('/api/courses/course-123/submission-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_assignments).toBe(10);
      expect(response.body.data.avg_grade).toBe(82.3);
      expect(mockController.getCourseStats).toHaveBeenCalled();
    });
  });

  describe('GET /submissions/:id', () => {
    it('should get submission by id', async () => {
      const mockSubmission = {
        id: 'submission-123',
        assignment: {
          id: 'assignment-123',
          title: 'JavaScript Functions',
          course_title: 'Web Development'
        },
        student: {
          id: 'student-123',
          firstName: 'John',
          lastName: 'Doe'
        },
        content: 'Student solution content...',
        attachments: ['solution.js'],
        submitted_at: new Date(),
        grade: 88,
        feedback: 'Good solution with room for improvement'
      };

      mockController.getSubmissionById.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockSubmission
        });
      });

      const response = await request(app)
        .get('/api/submissions/submission-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('submission-123');
      expect(response.body.data.grade).toBe(88);
      expect(mockController.getSubmissionById).toHaveBeenCalled();
    });

    it('should return 404 for non-existent submission', async () => {
      mockController.getSubmissionById.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      });

      const response = await request(app)
        .get('/api/submissions/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Submission not found');
    });
  });

  describe('DELETE /submissions/:id', () => {
    it('should delete submission successfully', async () => {
      mockController.deleteSubmission.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Submission deleted successfully'
        });
      });

      const response = await request(app)
        .delete('/api/submissions/submission-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Submission deleted successfully');
      expect(mockController.deleteSubmission).toHaveBeenCalled();
    });

    it('should return 404 for non-existent submission', async () => {
      mockController.deleteSubmission.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      });

      const response = await request(app)
        .delete('/api/submissions/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Submission not found');
    });
  });
});
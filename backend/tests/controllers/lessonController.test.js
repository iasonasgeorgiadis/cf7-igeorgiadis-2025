const request = require('supertest');
const express = require('express');
const lessonRoutes = require('../../src/routes/lessons');

// Mock the lesson controller
jest.mock('../../src/controllers/LessonController', () => {
  return jest.fn().mockImplementation(() => ({
    getCourseLessons: jest.fn(),
    createLesson: jest.fn(),
    reorderLessons: jest.fn(),
    getLessonProgress: jest.fn(),
    getLessonById: jest.fn(),
    updateLesson: jest.fn(),
    deleteLesson: jest.fn()
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

const LessonController = require('../../src/controllers/LessonController');

describe('Lesson Controller', () => {
  let app;
  let mockController;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', lessonRoutes);
    
    // Get the mock controller instance
    mockController = new LessonController();
    jest.clearAllMocks();
  });

  describe('GET /courses/:courseId/lessons', () => {
    it('should get course lessons', async () => {
      const mockLessons = [
        {
          id: 'lesson-1',
          title: 'Introduction to JavaScript',
          content: 'Learn the basics of JavaScript',
          order: 1,
          duration: 45,
          is_completed: false
        },
        {
          id: 'lesson-2',
          title: 'Variables and Data Types',
          content: 'Understanding variables',
          order: 2,
          duration: 60,
          is_completed: true
        }
      ];

      mockController.getCourseLessons.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockLessons
        });
      });

      const response = await request(app)
        .get('/api/courses/course-123/lessons')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(mockController.getCourseLessons).toHaveBeenCalled();
    });

    it('should handle course not found', async () => {
      mockController.getCourseLessons.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      });

      const response = await request(app)
        .get('/api/courses/invalid-id/lessons')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Course not found');
    });
  });

  describe('POST /courses/:courseId/lessons', () => {
    it('should create lesson successfully (instructor only)', async () => {
      const lessonData = {
        title: 'New Lesson',
        content: 'Lesson content here',
        duration: 30,
        order: 3
      };

      const mockLesson = {
        id: 'lesson-123',
        course_id: 'course-123',
        ...lessonData
      };

      mockController.createLesson.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          data: mockLesson
        });
      });

      const response = await request(app)
        .post('/api/courses/course-123/lessons')
        .send(lessonData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(lessonData.title);
      expect(mockController.createLesson).toHaveBeenCalled();
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = {
        title: 'ab', // too short
        content: 'short', // too short
        duration: -5 // negative
      };

      const response = await request(app)
        .post('/api/courses/course-123/lessons')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /courses/:courseId/lessons/reorder', () => {
    it('should reorder lessons successfully (instructor only)', async () => {
      const reorderData = {
        lessons: [
          { id: 'lesson-1', order: 2 },
          { id: 'lesson-2', order: 1 },
          { id: 'lesson-3', order: 3 }
        ]
      };

      mockController.reorderLessons.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Lessons reordered successfully'
        });
      });

      const response = await request(app)
        .put('/api/courses/course-123/lessons/reorder')
        .send(reorderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Lessons reordered successfully');
      expect(mockController.reorderLessons).toHaveBeenCalled();
    });

    it('should handle invalid lesson order data', async () => {
      const invalidData = {
        lessons: [
          { id: 'lesson-1' }, // missing order
          { order: 2 } // missing id
        ]
      };

      const response = await request(app)
        .put('/api/courses/course-123/lessons/reorder')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /courses/:courseId/lessons/progress', () => {
    beforeEach(() => {
      // Mock student role for progress endpoint
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

    it('should get lesson progress for student', async () => {
      const mockProgress = {
        course: {
          id: 'course-123',
          title: 'JavaScript Fundamentals'
        },
        total_lessons: 5,
        completed_lessons: 3,
        progress_percentage: 60,
        lessons: [
          {
            id: 'lesson-1',
            title: 'Introduction',
            is_completed: true,
            completion_date: new Date()
          },
          {
            id: 'lesson-2',
            title: 'Variables',
            is_completed: true,
            completion_date: new Date()
          },
          {
            id: 'lesson-3',
            title: 'Functions',
            is_completed: true,
            completion_date: new Date()
          },
          {
            id: 'lesson-4',
            title: 'Objects',
            is_completed: false,
            completion_date: null
          },
          {
            id: 'lesson-5',
            title: 'Arrays',
            is_completed: false,
            completion_date: null
          }
        ]
      };

      mockController.getLessonProgress.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockProgress
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
      studentApp.use('/api', lessonRoutes);

      const response = await request(studentApp)
        .get('/api/courses/course-123/lessons/progress')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.completed_lessons).toBe(3);
      expect(response.body.data.progress_percentage).toBe(60);
      expect(mockController.getLessonProgress).toHaveBeenCalled();
    });
  });

  describe('GET /lessons/:id', () => {
    it('should get lesson by id', async () => {
      const mockLesson = {
        id: 'lesson-123',
        title: 'JavaScript Functions',
        content: 'Learn about functions in JavaScript',
        duration: 45,
        order: 3,
        course: {
          id: 'course-123',
          title: 'JavaScript Fundamentals'
        },
        assignments: [
          {
            id: 'assignment-1',
            title: 'Function Practice',
            due_date: new Date()
          }
        ]
      };

      mockController.getLessonById.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockLesson
        });
      });

      const response = await request(app)
        .get('/api/lessons/lesson-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('lesson-123');
      expect(response.body.data.assignments).toHaveLength(1);
      expect(mockController.getLessonById).toHaveBeenCalled();
    });

    it('should return 404 for non-existent lesson', async () => {
      mockController.getLessonById.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      });

      const response = await request(app)
        .get('/api/lessons/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Lesson not found');
    });
  });

  describe('PUT /lessons/:id', () => {
    it('should update lesson successfully (instructor only)', async () => {
      const updateData = {
        title: 'Updated Lesson Title',
        content: 'Updated lesson content',
        duration: 60
      };

      const mockUpdatedLesson = {
        id: 'lesson-123',
        ...updateData
      };

      mockController.updateLesson.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockUpdatedLesson
        });
      });

      const response = await request(app)
        .put('/api/lessons/lesson-123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(mockController.updateLesson).toHaveBeenCalled();
    });

    it('should return 404 for non-existent lesson', async () => {
      mockController.updateLesson.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      });

      const response = await request(app)
        .put('/api/lessons/invalid-id')
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Lesson not found');
    });
  });

  describe('DELETE /lessons/:id', () => {
    it('should delete lesson successfully (instructor only)', async () => {
      mockController.deleteLesson.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Lesson deleted successfully'
        });
      });

      const response = await request(app)
        .delete('/api/lessons/lesson-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Lesson deleted successfully');
      expect(mockController.deleteLesson).toHaveBeenCalled();
    });

    it('should return 404 for non-existent lesson', async () => {
      mockController.deleteLesson.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          message: 'Lesson not found'
        });
      });

      const response = await request(app)
        .delete('/api/lessons/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Lesson not found');
    });

    it('should handle lessons with dependencies', async () => {
      mockController.deleteLesson.mockImplementation((req, res) => {
        res.status(400).json({
          success: false,
          message: 'Cannot delete lesson with active assignments'
        });
      });

      const response = await request(app)
        .delete('/api/lessons/lesson-123')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot delete lesson with active assignments');
    });
  });
});
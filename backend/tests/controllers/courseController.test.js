const request = require('supertest');
const express = require('express');
const courseRoutes = require('../../src/routes/courses');

// Mock the course service
jest.mock('../../src/services/CourseService', () => {
  return jest.fn().mockImplementation(() => ({
    getAllCourses: jest.fn(),
    getCourseById: jest.fn(),
    getMyCourses: jest.fn(),
    checkPrerequisites: jest.fn(),
    createCourse: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn()
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
  },
  optionalAuth: (req, res, next) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'student'
    };
    next();
  }
}));

const CourseService = require('../../src/services/CourseService');

describe('Course Controller', () => {
  let app;
  let courseService;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/courses', courseRoutes);
    
    courseService = new CourseService();
    jest.clearAllMocks();
  });

  describe('GET /courses', () => {
    it('should get all courses with optional auth', async () => {
      const mockResponse = {
        courses: [
          {
            id: 'course-1',
            title: 'JavaScript Fundamentals',
            code: 'JS101',
            description: 'Learn JavaScript basics',
            credits: 3,
            isEnrolled: false
          },
          {
            id: 'course-2',
            title: 'Advanced React',
            code: 'REACT201',
            description: 'Advanced React concepts',
            credits: 4,
            isEnrolled: true
          }
        ],
        total: 2,
        page: 1,
        limit: 10
      };

      courseService.getAllCourses.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .get('/courses?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(courseService.getAllCourses).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        'user-123'
      );
    });

    it('should handle service errors', async () => {
      courseService.getAllCourses.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/courses')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /courses/my-courses', () => {
    it('should get instructor courses', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'JavaScript Fundamentals',
          code: 'JS101',
          enrolled_students: 25,
          active_lessons: 8
        }
      ];

      courseService.getMyCourses.mockResolvedValueOnce(mockCourses);

      const response = await request(app)
        .get('/courses/my-courses')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(courseService.getMyCourses).toHaveBeenCalledWith('user-123', 'instructor');
    });
  });

  describe('GET /courses/:id', () => {
    it('should get course by id', async () => {
      const mockCourse = {
        id: 'course-123',
        title: 'JavaScript Fundamentals',
        code: 'JS101',
        description: 'Learn JavaScript basics',
        credits: 3,
        prerequisites: [],
        isEnrolled: false,
        lessons: [
          {
            id: 'lesson-1',
            title: 'Variables and Data Types',
            order: 1
          }
        ]
      };

      courseService.getCourseById.mockResolvedValueOnce(mockCourse);

      const response = await request(app)
        .get('/courses/course-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('course-123');
      expect(response.body.data.lessons).toHaveLength(1);
      expect(courseService.getCourseById).toHaveBeenCalledWith('course-123', 'user-123');
    });

    it('should return 404 for non-existent course', async () => {
      courseService.getCourseById.mockRejectedValueOnce(new Error('Course not found'));

      const response = await request(app)
        .get('/courses/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /courses/:id/prerequisites/check', () => {
    it('should check prerequisites', async () => {
      const mockPrereqCheck = {
        eligible: true,
        missingPrerequisites: [],
        completedPrerequisites: ['MATH101', 'CS50']
      };

      courseService.checkPrerequisites.mockResolvedValueOnce(mockPrereqCheck);

      const response = await request(app)
        .get('/courses/course-123/prerequisites/check')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.eligible).toBe(true);
      expect(courseService.checkPrerequisites).toHaveBeenCalledWith('course-123', 'user-123');
    });

    it('should return ineligible with missing prerequisites', async () => {
      const mockPrereqCheck = {
        eligible: false,
        missingPrerequisites: ['MATH101'],
        completedPrerequisites: ['CS50']
      };

      courseService.checkPrerequisites.mockResolvedValueOnce(mockPrereqCheck);

      const response = await request(app)
        .get('/courses/course-123/prerequisites/check')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.eligible).toBe(false);
      expect(response.body.data.missingPrerequisites).toContain('MATH101');
    });
  });

  describe('POST /courses', () => {
    it('should create course successfully (instructor only)', async () => {
      const courseData = {
        title: 'New Course',
        code: 'NEW101',
        description: 'A new course',
        credits: 3,
        prerequisites: []
      };

      const mockCourse = {
        id: 'course-456',
        instructor_id: 'user-123',
        ...courseData
      };

      courseService.createCourse.mockResolvedValueOnce(mockCourse);

      const response = await request(app)
        .post('/courses')
        .send(courseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(courseData.title);
      expect(courseService.createCourse).toHaveBeenCalledWith(courseData, 'user-123');
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = {
        title: 'ab', // too short
        code: '', // empty
        credits: 0 // invalid
      };

      const response = await request(app)
        .post('/courses')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /courses/:id', () => {
    it('should update course successfully', async () => {
      const updateData = {
        title: 'Updated Course Title',
        description: 'Updated description',
        credits: 4
      };

      const mockUpdatedCourse = {
        id: 'course-123',
        ...updateData
      };

      courseService.updateCourse.mockResolvedValueOnce(mockUpdatedCourse);

      const response = await request(app)
        .put('/courses/course-123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(courseService.updateCourse).toHaveBeenCalledWith(
        'course-123',
        updateData,
        'user-123'
      );
    });

    it('should return 404 for non-existent course', async () => {
      courseService.updateCourse.mockRejectedValueOnce(new Error('Course not found'));

      const response = await request(app)
        .put('/courses/invalid-id')
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /courses/:id', () => {
    it('should delete course successfully', async () => {
      courseService.deleteCourse.mockResolvedValueOnce(true);

      const response = await request(app)
        .delete('/courses/course-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Course deleted successfully');
      expect(courseService.deleteCourse).toHaveBeenCalledWith('course-123', 'user-123');
    });

    it('should return 404 for non-existent course', async () => {
      courseService.deleteCourse.mockRejectedValueOnce(new Error('Course not found'));

      const response = await request(app)
        .delete('/courses/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle courses with active enrollments', async () => {
      courseService.deleteCourse.mockRejectedValueOnce(
        new Error('Cannot delete course with active enrollments')
      );

      const response = await request(app)
        .delete('/courses/course-123')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot delete course with active enrollments');
    });
  });
});
const request = require('supertest');
const express = require('express');
const enrollmentRoutes = require('../../src/routes/enrollments');

// Mock the enrollment service
jest.mock('../../src/services/EnrollmentService', () => {
  return jest.fn().mockImplementation(() => ({
    enrollInCourse: jest.fn(),
    dropCourse: jest.fn(),
    getMyCourses: jest.fn(),
    getStatistics: jest.fn(),
    checkEligibility: jest.fn(),
    getCourseEnrollments: jest.fn()
  }));
});

// Mock authentication middleware
jest.mock('../../src/middlewares/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
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

const EnrollmentService = require('../../src/services/EnrollmentService');

describe('Enrollment Controller', () => {
  let app;
  let enrollmentService;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/enrollments', enrollmentRoutes);
    
    enrollmentService = new EnrollmentService();
    jest.clearAllMocks();
  });

  describe('POST /enrollments/enroll', () => {
    it('should enroll in course successfully', async () => {
      const enrollmentData = {
        courseId: 'course-123'
      };

      const mockEnrollment = {
        id: 'enrollment-123',
        student_id: 'user-123',
        course_id: 'course-123',
        enrollment_date: new Date(),
        status: 'active',
        course: {
          title: 'JavaScript Fundamentals',
          code: 'JS101'
        }
      };

      enrollmentService.enrollInCourse.mockResolvedValueOnce(mockEnrollment);

      const response = await request(app)
        .post('/enrollments/enroll')
        .send(enrollmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.course_id).toBe('course-123');
      expect(response.body.data.status).toBe('active');
      expect(enrollmentService.enrollInCourse).toHaveBeenCalledWith('user-123', 'course-123');
    });

    it('should handle already enrolled error', async () => {
      const enrollmentData = {
        courseId: 'course-123'
      };

      enrollmentService.enrollInCourse.mockRejectedValueOnce(
        new Error('Already enrolled in this course')
      );

      const response = await request(app)
        .post('/enrollments/enroll')
        .send(enrollmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Already enrolled in this course');
    });

    it('should handle prerequisite not met error', async () => {
      const enrollmentData = {
        courseId: 'course-123'
      };

      enrollmentService.enrollInCourse.mockRejectedValueOnce(
        new Error('Prerequisites not met')
      );

      const response = await request(app)
        .post('/enrollments/enroll')
        .send(enrollmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Prerequisites not met');
    });
  });

  describe('POST /enrollments/drop', () => {
    it('should drop course successfully', async () => {
      const dropData = {
        courseId: 'course-123'
      };

      enrollmentService.dropCourse.mockResolvedValueOnce(true);

      const response = await request(app)
        .post('/enrollments/drop')
        .send(dropData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Dropped from course successfully');
      expect(enrollmentService.dropCourse).toHaveBeenCalledWith('user-123', 'course-123');
    });

    it('should handle not enrolled error', async () => {
      const dropData = {
        courseId: 'course-123'
      };

      enrollmentService.dropCourse.mockRejectedValueOnce(
        new Error('Not enrolled in this course')
      );

      const response = await request(app)
        .post('/enrollments/drop')
        .send(dropData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not enrolled in this course');
    });

    it('should handle drop deadline passed error', async () => {
      const dropData = {
        courseId: 'course-123'
      };

      enrollmentService.dropCourse.mockRejectedValueOnce(
        new Error('Drop deadline has passed')
      );

      const response = await request(app)
        .post('/enrollments/drop')
        .send(dropData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Drop deadline has passed');
    });
  });

  describe('GET /enrollments/my-courses', () => {
    it('should get student enrolled courses', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'JavaScript Fundamentals',
          code: 'JS101',
          enrollment_date: new Date(),
          status: 'active',
          progress: 75.5,
          current_lesson: 'Variables and Functions'
        },
        {
          id: 'course-2',
          title: 'React Basics',
          code: 'REACT101',
          enrollment_date: new Date(),
          status: 'completed',
          progress: 100,
          completion_date: new Date()
        }
      ];

      enrollmentService.getMyCourses.mockResolvedValueOnce(mockCourses);

      const response = await request(app)
        .get('/enrollments/my-courses?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(enrollmentService.getMyCourses).toHaveBeenCalledWith('user-123', { status: 'active' });
    });

    it('should get all enrolled courses when no status filter', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'JavaScript Fundamentals',
          status: 'active'
        }
      ];

      enrollmentService.getMyCourses.mockResolvedValueOnce(mockCourses);

      const response = await request(app)
        .get('/enrollments/my-courses')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(enrollmentService.getMyCourses).toHaveBeenCalledWith('user-123', {});
    });
  });

  describe('GET /enrollments/statistics', () => {
    it('should get student enrollment statistics', async () => {
      const mockStats = {
        total_enrolled: 5,
        active_courses: 3,
        completed_courses: 2,
        dropped_courses: 0,
        total_credits: 15,
        avg_progress: 68.4,
        total_assignments: 25,
        completed_assignments: 20,
        pending_assignments: 5
      };

      enrollmentService.getStatistics.mockResolvedValueOnce(mockStats);

      const response = await request(app)
        .get('/enrollments/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_enrolled).toBe(5);
      expect(response.body.data.avg_progress).toBe(68.4);
      expect(enrollmentService.getStatistics).toHaveBeenCalledWith('user-123');
    });
  });

  describe('GET /enrollments/check-eligibility/:courseId', () => {
    it('should check enrollment eligibility', async () => {
      const mockEligibility = {
        eligible: true,
        reasons: [],
        prerequisites_met: true,
        already_enrolled: false,
        course_full: false
      };

      enrollmentService.checkEligibility.mockResolvedValueOnce(mockEligibility);

      const response = await request(app)
        .get('/enrollments/check-eligibility/course-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.eligible).toBe(true);
      expect(enrollmentService.checkEligibility).toHaveBeenCalledWith('user-123', 'course-123');
    });

    it('should return ineligible with reasons', async () => {
      const mockEligibility = {
        eligible: false,
        reasons: ['Prerequisites not met', 'Course is full'],
        prerequisites_met: false,
        already_enrolled: false,
        course_full: true
      };

      enrollmentService.checkEligibility.mockResolvedValueOnce(mockEligibility);

      const response = await request(app)
        .get('/enrollments/check-eligibility/course-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.eligible).toBe(false);
      expect(response.body.data.reasons).toContain('Prerequisites not met');
      expect(response.body.data.reasons).toContain('Course is full');
    });
  });

  describe('GET /enrollments/course/:courseId (instructor only)', () => {
    beforeEach(() => {
      // Mock instructor role for these tests
      jest.doMock('../../src/middlewares/auth', () => ({
        authenticate: (req, res, next) => {
          req.user = {
            id: 'instructor-123',
            email: 'instructor@example.com',
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
    });

    it('should get course enrollments for instructor', async () => {
      const mockEnrollments = {
        course: {
          id: 'course-123',
          title: 'JavaScript Fundamentals',
          code: 'JS101'
        },
        enrollments: [
          {
            id: 'enrollment-1',
            student: {
              id: 'student-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com'
            },
            enrollment_date: new Date(),
            status: 'active',
            progress: 75.5
          },
          {
            id: 'enrollment-2',
            student: {
              id: 'student-2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane.smith@example.com'
            },
            enrollment_date: new Date(),
            status: 'completed',
            progress: 100
          }
        ],
        total: 2,
        active: 1,
        completed: 1,
        dropped: 0
      };

      enrollmentService.getCourseEnrollments.mockResolvedValueOnce(mockEnrollments);

      // Create a new app instance with instructor auth
      const instructorApp = express();
      instructorApp.use(express.json());
      instructorApp.use((req, res, next) => {
        req.user = {
          id: 'instructor-123',
          email: 'instructor@example.com',
          role: 'instructor'
        };
        next();
      });
      instructorApp.use('/enrollments', enrollmentRoutes);

      const response = await request(instructorApp)
        .get('/enrollments/course/course-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enrollments).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(enrollmentService.getCourseEnrollments).toHaveBeenCalledWith(
        'course-123',
        'instructor-123'
      );
    });
  });
});
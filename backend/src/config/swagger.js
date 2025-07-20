const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LMS API Documentation',
      version: '1.0.0',
      description: `
        Learning Management System API for Coding Factory 7
        
        This REST API provides endpoints for:
        - User authentication and authorization
        - Course management
        - Student enrollment
        - Lesson management
        - Assignment creation and submission
        - Grading system
        
        All endpoints except authentication require a valid JWT token.
      `,
      contact: {
        name: 'Iasonas Georgiadis',
        email: 'support@lms.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5001/api',
        description: 'Development server'
      },
      {
        url: 'https://api.lms.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['student', 'instructor'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Course: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            code: { type: 'string' },
            description: { type: 'string' },
            credits: { type: 'integer' },
            capacity: { type: 'integer' },
            instructorId: { type: 'string', format: 'uuid' },
            prerequisites: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Enrollment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
            courseId: { type: 'string', format: 'uuid' },
            enrollmentDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['active', 'completed', 'dropped'] },
            progress: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        Lesson: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            courseId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            content: { type: 'string' },
            duration: { type: 'integer' },
            order: { type: 'integer' },
            isPublished: { type: 'boolean' }
          }
        },
        Assignment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            lessonId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            points: { type: 'integer', minimum: 0, maximum: 100 }
          }
        },
        Submission: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            assignmentId: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            submittedAt: { type: 'string', format: 'date-time' },
            grade: { type: 'integer', minimum: 0, maximum: 100 },
            feedback: { type: 'string' },
            isLate: { type: 'boolean' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/swagger/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
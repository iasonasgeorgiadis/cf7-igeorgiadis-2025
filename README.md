# LMS - Learning Management System

## Project Description
A full-stack Learning Management System built for Coding Factory 7 at Athens University of Economics and Business. This platform enables students to enroll in courses, instructors to manage their courses and content, and administrators to oversee the entire system.

## Features

### Phase 1 (Completed) ✅
- User authentication with JWT and refresh tokens
- Role-based access control (Student, Instructor, Admin)
- User registration and profile management
- Secure password handling with bcrypt
- Password reset functionality
- Session management with Remember Me option

### Phase 2 (Completed) ✅
- Course management with CRUD operations
- Course prerequisites and circular dependency prevention
- Enrollment system with capacity management
- Course browsing with search and filtering
- Instructor course creation and editing
- Student enrollment with eligibility checking
- My Courses dashboard for students and instructors
- Course deletion with confirmation

### Phase 3 (Completed) ✅
- Lesson management within courses ✅
- Assignment creation and management ✅
- Student submission system ✅
- Grading and feedback functionality ✅
- Progress tracking and dashboards ✅
- Frontend implementation completed ✅

### General Features
- RESTful API architecture
- Responsive UI with Tailwind CSS
- Real-time validation and error handling
- Performance optimized with pagination

## Technology Stack
- Frontend: React 19.x with Vite 7.x
- Backend: Node.js 20.x with Express 5.x
- Database: PostgreSQL 15.x
- Authentication: JWT with refresh tokens
- Styling: Tailwind CSS 4.x
- Form Handling: React Hook Form 7.x
- HTTP Client: Axios 1.x

## Prerequisites
- Node.js >= 20.0.0
- PostgreSQL >= 15.0
- npm or yarn

## Quick Start
For a quick setup, run:
```bash
./quickstart.sh
```

## Installation Instructions

### Backend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/cf7-igeorgiadis-2025.git
   cd cf7-igeorgiadis-2025
   ```

2. Navigate to backend directory
   ```bash
   cd backend
   ```

3. Install dependencies
   ```bash
   npm install
   ```

4. Create .env file
   ```bash
   cp .env.example .env
   ```
   Update the .env file with your database credentials and other configurations.

5. Create PostgreSQL database
   ```bash
   createdb lms_db
   ```

6. Run migrations
   ```bash
   npm run migrate
   ```

7. Seed database (optional)
   ```bash
   npm run seed
   ```

### Frontend Setup
1. Navigate to frontend directory
   ```bash
   cd ../frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create .env file
   ```bash
   cp .env.example .env
   ```

## Running the Application

### Development Mode
Start both servers in separate terminal windows:

Backend (runs on port 5001):
```bash
cd backend
npm run dev
```

Frontend (runs on port 5173):
```bash
cd frontend
npm run dev
```

### Production Build
Frontend:
```bash
cd frontend
npm run build
```

## Testing
Backend tests:
```bash
cd backend
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## API Documentation
- Base URL: http://localhost:5001/api
- All endpoints require authentication except /auth/login and /auth/register

### Authentication Endpoints
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/logout - Logout user
- POST /api/auth/refresh - Refresh access token
- GET /api/auth/me - Get current user

### User Management (Admin only)
- GET /api/users - List all users
- GET /api/users/:id - Get user details
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user

### Course Management
- GET /api/courses - List all courses
- GET /api/courses/:id - Get course details
- POST /api/courses - Create course (Instructor)
- PUT /api/courses/:id - Update course (Instructor)
- DELETE /api/courses/:id - Delete course (Instructor)
- GET /api/courses/my-courses - Get instructor's courses

### Enrollment Management
- POST /api/enrollments/enroll - Enroll in course
- POST /api/enrollments/drop - Drop course
- GET /api/enrollments/my-courses - Get enrolled courses
- GET /api/enrollments/check-eligibility/:courseId - Check enrollment eligibility

### Lesson Management (Phase 3)
- GET /api/courses/:courseId/lessons - List all lessons for a course
- GET /api/lessons/:id - Get specific lesson details
- POST /api/courses/:courseId/lessons - Create new lesson (Instructor)
- PUT /api/lessons/:id - Update lesson (Instructor)
- DELETE /api/lessons/:id - Delete lesson (Instructor)
- PUT /api/courses/:courseId/lessons/reorder - Reorder lessons (Instructor)
- GET /api/courses/:courseId/lessons/progress - Get lesson progress (Student)

### Assignment Management (Phase 3)
- GET /api/lessons/:lessonId/assignments - List assignments for a lesson
- GET /api/courses/:courseId/assignments - List all assignments for a course
- GET /api/assignments/:id - Get assignment details
- GET /api/assignments/upcoming - Get upcoming assignments (Student)
- GET /api/assignments/stats - Get assignment statistics (Instructor)
- POST /api/lessons/:lessonId/assignments - Create assignment (Instructor)
- PUT /api/assignments/:id - Update assignment (Instructor)
- DELETE /api/assignments/:id - Delete assignment (Instructor)

### Submission Management (Phase 3)
- GET /api/submissions/:id - Get specific submission
- GET /api/submissions/pending - Get pending submissions (Instructor)
- GET /api/assignments/:assignmentId/submissions - Get all submissions for assignment (Instructor)
- GET /api/assignments/:assignmentId/submission - Get student's submission (Student)
- GET /api/courses/:courseId/submissions - Get all student submissions in course (Student)
- GET /api/courses/:courseId/submission-stats - Get course submission statistics (Instructor)
- POST /api/assignments/:assignmentId/submit - Submit assignment (Student)
- PUT /api/submissions/:id/grade - Grade submission (Instructor)
- DELETE /api/submissions/:id - Delete submission

## Default Test Users
After running the seed script, you can use these accounts:
- Admin: admin@lms.com / AdminPass123!
- Instructor: instructor@lms.com / TeachPass123!
- Instructor 2: instructor2@lms.com / TeachPass123!
- Student: student@lms.com / StudyPass123!
- Student 2: student2@lms.com / StudyPass123!

## Database Schema
### Users Table
- id (UUID, Primary Key)
- email (Unique)
- password_hash
- first_name
- last_name
- role (student, instructor, admin)
- refresh_token
- reset_token
- reset_token_expires
- created_at
- updated_at

### Courses Table
- id (UUID, Primary Key)
- title
- description
- capacity
- instructor_id (Foreign Key → users)
- created_at
- updated_at

### Enrollments Table
- id (UUID, Primary Key)
- student_id (Foreign Key → users)
- course_id (Foreign Key → courses)
- enrollment_date
- status (active, completed, dropped)
- completion_percentage
- completed_at
- created_at
- updated_at

### Additional Tables
- course_prerequisites
- lessons
- assignments
- submissions

## Project Structure
```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── config/
│   │   └── db/
│   ├── migrations/
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── contexts/
│   │   └── utils/
│   ├── tests/
│   └── package.json
├── docs/
└── README.md
```

## Development Progress

### Phase 1 Completion Summary ✅
- Backend project initialized with Express and PostgreSQL
- Database schema designed and migrations created
- User authentication system with JWT implemented
- Role-based authorization middleware
- Basic user CRUD operations
- Frontend initialized with React and Vite
- Login and registration UI components
- Protected routes and role-based dashboards
- Authentication context for state management

### Phase 2 Completion Summary ✅
- Complete course management system with CRUD operations
- Course prerequisites with validation
- Enrollment system with capacity checking
- Course search and filtering functionality
- Instructor dashboard with course statistics
- Student course browsing and enrollment
- My Courses page for enrolled courses
- Course editing and deletion capabilities
- Remember Me functionality for login

### Phase 3 Backend Completion Summary ✅
- Complete lesson management system with ordering and reordering
- Assignment creation with due dates and automatic validation
- Student submission system with late detection
- Grading system with feedback and letter grades
- Repository pattern for all data access
- Service layer with comprehensive business logic
- Full authentication and authorization for all endpoints
- Submission statistics and course analytics
- Automatic capacity and enrollment checking
- Transactional operations for data consistency

### Phase 3 Frontend Completion Summary ✅
- Lesson display interface for students with navigation
- Lesson management UI with drag-and-drop reordering for instructors
- Assignment creation, viewing, and submission forms
- Grading dashboard with batch grading for instructors
- Student submission tracking with grades and feedback
- Dashboard widgets for upcoming assignments and pending submissions
- Integrated lesson content with assignment lists

## Phase 4 Progress - Testing & Quality Assurance (In Progress)

### Completed ✅
- Jest testing infrastructure configured for backend
- EnrollmentService unit tests (16/16 tests passing)
- CourseService unit tests (14/14 tests passing)
- LessonService unit tests (16/16 tests passing)
- AuthService unit tests (4/4 tests passing)
- Test factories and utilities created
- Test coverage reporting configured
- UserRepository unit tests created
- Frontend testing infrastructure with Vitest and React Testing Library

### Current Status 📊

#### Backend Testing
- Total Tests: 50+ tests written
- Test Suites: 5 suites (services + repositories)
- Code Coverage: 14.31% lines covered
- Services tested: 4/6 services with unit tests

#### Frontend Testing
- Testing framework: Vitest + React Testing Library
- Initial test files created for components and hooks
- Tests written: 14 (11 failing, 3 passing)
- Test coverage setup configured

### In Progress 🔄
- Fixing frontend test failures (mocking issues)
- Creating more repository unit tests
- Increasing overall code coverage
- Writing component tests for key UI elements

### Remaining Tasks 📋
- Complete unit tests for remaining backend repositories
- Unit tests for backend controllers
- Unit tests for AssignmentService and SubmissionService
- Integration tests for API endpoints
- Complete frontend component tests
- End-to-end testing for critical user flows
- Performance testing for database queries
- Security testing for authentication
- Input validation testing
- Achieve 80%+ code coverage

## Contributing
This is an academic project for Coding Factory 7. Please follow the established coding standards and patterns.

## License
MIT License - Academic Project

## Author
Iasonas Georgiadis
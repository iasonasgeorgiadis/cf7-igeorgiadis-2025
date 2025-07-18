# LMS - Learning Management System

## Project Description
A full-stack Learning Management System built for Coding Factory 7 at Athens University of Economics and Business. This platform enables students to enroll in courses, instructors to manage their courses and content, and administrators to oversee the entire system.

## Features
- User authentication with JWT
- Role-based access control (Student, Instructor, Admin)
- Course management with prerequisites
- User registration and profile management
- Secure password handling with bcrypt
- RESTful API architecture
- Responsive UI with Tailwind CSS

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

Backend (runs on port 5000):
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
- Base URL: http://localhost:5000/api
- Authentication endpoints: /auth/*
- User management endpoints: /users/*

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

## Phase 1 Completion Summary
✅ Backend project initialized with Express and PostgreSQL
✅ Database schema designed and migrations created
✅ User authentication system with JWT implemented
✅ Role-based authorization middleware
✅ Basic user CRUD operations
✅ Frontend initialized with React and Vite
✅ Login and registration UI components
✅ Protected routes and role-based dashboards
✅ Authentication context for state management

## Next Steps (Phase 2)
- Course management system
- Enrollment functionality
- Lesson management
- Assignment system
- Enhanced UI/UX features

## Contributing
This is an academic project for Coding Factory 7. Please follow the established coding standards and patterns.

## License
MIT License - Academic Project

## Author
Iasonas Georgiadis
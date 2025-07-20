# Learning Management System

## About This Project

I built this LMS as my final project for Coding Factory 7 at Athens University of Economics and Business. It's a web application where instructors can create and manage courses, and students can enroll and submit assignments.

**University**: Athens University of Economics and Business  
**Program**: Coding Factory 7 - Center for Training and Lifelong Learning  
**Author**: Iasonas Georgiadis

## What It Does

### For Students
- Create an account and log in securely
- Browse available courses and see what you're eligible for
- Enroll in courses (if there's space available)
- View lessons and course materials
- Submit assignments before the due date
- Track your progress and grades
- See all your courses in one dashboard

### For Instructors
- Create and manage your own courses
- Set course capacity and prerequisites
- Add lessons to your courses
- Create assignments with due dates
- Review and grade student submissions
- Provide feedback to students
- Manage all your courses from one place

## Tech Stack

I used modern web technologies to build this:

**Backend**: Node.js with Express for the server, PostgreSQL for the database, and JWT for secure authentication.

**Frontend**: React with Vite for fast development, styled with Tailwind CSS, and React Router for navigation.

**Documentation**: Swagger provides interactive API documentation at `/api-docs`.

## Getting Started

### What You Need
- Node.js version 20 or higher
- PostgreSQL database
- npm (comes with Node.js)

### Setting It Up

1. **Get the code**
   ```bash
   git clone https://github.com/yourusername/cf7-igeorgiadis-2025.git
   cd cf7-igeorgiadis-2025
   ```

2. **Create your database**
   ```bash
   createdb lms_db
   ```

3. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   
   Open `.env` and add your database details:
   ```
   NODE_ENV=development
   PORT=5001
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=lms_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=any-long-random-string
   JWT_REFRESH_SECRET=another-long-random-string
   ```

   Set up the database tables:
   ```bash
   npm run migrate
   npm run seed  # This adds some test data
   ```

4. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   ```

### Running It

You'll need two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open your browser to http://localhost:5173

### Test Accounts

After running the seed command, you can log in with:
- Instructor: instructor@lms.com / TeachPass123!
- Student: student@lms.com / StudyPass123!

## API Documentation

Once the backend is running, check out the interactive API docs at:
http://localhost:5001/api-docs

You can test all the endpoints directly from your browser.

## Project Structure

The project is organized into two main parts:

```
backend/
  src/
    controllers/     # Handle web requests
    services/        # Business logic
    repositories/    # Database queries
    routes/          # API endpoints
    middlewares/     # Authentication, etc.
    validators/      # Input validation
  tests/            # Test files
  migrations/       # Database setup

frontend/
  src/
    pages/          # Main app screens
    components/     # Reusable UI pieces
    services/       # API calls
    contexts/       # App-wide state
```

## Running Tests

Both parts of the app have tests:

**Backend tests:**
```bash
cd backend
npm test
```

**Frontend tests:**
```bash
cd frontend
npm test
```

Note: You'll need your database configured for the tests to run properly.

## Deployment

### For Local Testing
Just follow the setup instructions above.

### For Production
1. Set up a PostgreSQL database with your hosting provider
2. Deploy the backend as a Node.js app
3. Build the frontend (`npm run build`) and serve the files
4. Use a web server like nginx to route requests

Here's a basic nginx setup:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
    }
}
```

## Common Issues

**Can't connect to database?**
- Make sure PostgreSQL is running
- Double-check your `.env` file
- Try: `psql -U postgres` to test your connection

**Port already in use?**
```bash
lsof -i :5001  # Find what's using the port
kill -9 <PID>  # Stop it
```

**Too many login attempts?**
The app has rate limiting - wait 15 minutes or restart the backend.

## Assignment Requirements

This project covers all the requirements for the Coding Factory 7 final assignment:

- Complete domain model with users, courses, enrollments, lessons, assignments, and submissions
- PostgreSQL database with proper relationships
- Organized code with separate layers for controllers, services, and data access
- Authentication system with role-based access
- React frontend with protected routes
- Test setup for both backend and frontend
- Full API documentation with Swagger
- Clear build and deployment instructions

---
**Author**: Iasonas Georgiadis  
**Program**: Coding Factory 7 - Athens University of Economics and Business

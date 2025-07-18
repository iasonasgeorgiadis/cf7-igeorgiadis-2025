# How to Review and Run the LMS Project

## 1. Understanding the Project Structure

The project consists of two main parts:
- **Backend**: Node.js/Express API server (in `/backend` folder)
- **Frontend**: React application (in `/frontend` folder)

## 2. Prerequisites You Need

Before running the project, ensure you have:
- **Node.js** installed (version 20 or higher)
  - Check with: `node --version`
  - Install from: https://nodejs.org/
- **PostgreSQL** database installed and running
  - Check with: `psql --version`
  - Install from: https://www.postgresql.org/download/
- **A code editor** (like VS Code) to view the files
  - Download from: https://code.visualstudio.com/

## 3. Step-by-Step Setup Guide

### Option A: Quick Setup (Recommended)
1. Open terminal in the project folder
2. Run the setup script:
   ```bash
   ./quickstart.sh
   ```
3. Follow the prompts (it will ask if you want test data)

### Option B: Manual Setup

#### Backend Setup:
1. Open terminal and navigate to backend:
   ```bash
   cd backend
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` file with your PostgreSQL credentials:
   ```
   DB_USER=your_postgres_username
   DB_PASSWORD=your_postgres_password
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Create the database:
   ```bash
   createdb lms_db
   ```

6. Run database migrations:
   ```bash
   npm run migrate
   ```

7. (Optional) Add test data:
   ```bash
   npm run seed
   ```

8. Start the backend server:
   ```bash
   npm run dev
   ```
   You should see: "🚀 LMS Backend Server Started"

#### Frontend Setup:
1. Open a NEW terminal and navigate to frontend:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend:
   ```bash
   npm run dev
   ```
   You should see: "Local: http://localhost:5173"

## 4. Testing the Application

1. Open your browser to: http://localhost:5173
2. You should see the LMS Platform homepage
3. Try logging in with test accounts:
   - **Admin**: admin@lms.com / AdminPass123!
   - **Student**: student@lms.com / StudyPass123!
   - **Instructor**: instructor@lms.com / TeachPass123!

## 5. Key Features to Test

### As a Student:
- Register a new account (click "create a new account")
- Login with student credentials
- View student dashboard (shows enrolled courses, completed courses, pending assignments)
- Click your name in top-right to see role
- Logout

### As an Instructor:
- Login with instructor credentials
- View instructor dashboard (shows courses, students, pending grading)
- See navigation change to instructor-specific items
- Logout

### As an Admin:
- Login with admin credentials
- View admin dashboard (shows system statistics)
- See admin-specific navigation options
- Logout

## 6. Reviewing the Code

### Backend Structure (`/backend/src/`):
```
controllers/    → Handle HTTP requests/responses
services/       → Business logic and rules
repositories/   → Database queries
models/         → Data models
middlewares/    → Auth and error handling
routes/         → API endpoint definitions
validators/     → Input validation rules
config/         → App and database config
db/            → Migration and seed scripts
```

### Frontend Structure (`/frontend/src/`):
```
pages/         → Page components (Login, Register, Dashboards)
components/    → Reusable components (Layout, PrivateRoute)
contexts/      → Authentication state management
services/      → API calls to backend
```

### Database Structure:
- **users**: Stores all users with roles
- **courses**: Course information
- **enrollments**: Student-course relationships
- **lessons**: Course content
- **assignments**: Tasks for students
- **submissions**: Student assignment submissions

## 7. Common Issues and Solutions

### Issue: "PostgreSQL is not running"
**Solution:**
- Mac: `brew services start postgresql`
- Ubuntu: `sudo service postgresql start`
- Windows: Start PostgreSQL from Services

### Issue: "Database connection error"
**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env` file
3. Create database if missing: `createdb lms_db`

### Issue: "Port already in use"
**Solution:**
- Backend uses port 5000 (change in `.env`)
- Frontend uses port 5173 (change in `vite.config.js`)

### Issue: "Cannot login"
**Solution:**
1. Make sure backend is running (port 5000)
2. Check if you ran `npm run seed` for test users
3. Verify you're using correct credentials

## 8. What's Working in Phase 1

✅ **Authentication System**
- User registration with role selection
- Login/logout with JWT tokens
- Password security with bcrypt
- Session management

✅ **Role-Based Access**
- Three roles: Student, Instructor, Admin
- Protected routes based on roles
- Role-specific dashboards
- Different navigation per role

✅ **User Management**
- User profile viewing
- Password change functionality
- Admin can manage all users (backend ready)

✅ **Database**
- All 7 tables created
- Relationships established
- Test data available

✅ **Security**
- Input validation
- SQL injection prevention
- XSS protection
- Rate limiting
- CORS configuration

## 9. Exploring the API

You can test the API directly:

### Get your user info:
```bash
# First login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@lms.com","password":"StudyPass123!"}'

# Use the token to get user info
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### View API endpoints:
- Auth: `http://localhost:5000/api/auth/*`
- Users: `http://localhost:5000/api/users/*`

## 10. Next Steps

1. **Familiarize yourself** with the current features
2. **Review the code** structure in your editor
3. **Test different user roles** to see the differences
4. **Check the database** tables if you're comfortable with SQL
5. **Prepare for Phase 2** which will add:
   - Course creation and management
   - Student enrollment
   - Lesson content
   - Assignment system

## Need More Help?

- **Project Documentation**: Check `README.md`
- **What was built**: Read `PHASE1_SUMMARY.md`
- **Database schema**: See migration files in `/backend/migrations/`
- **API structure**: Look at `/backend/src/routes/`

## Quick Commands Reference

```bash
# Backend
cd backend
npm run dev        # Start server
npm run migrate    # Run migrations
npm run seed       # Add test data
npm test          # Run tests

# Frontend
cd frontend
npm run dev        # Start app
npm run build      # Production build

# Database
createdb lms_db    # Create database
psql lms_db        # Connect to database
```
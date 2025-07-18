# Complete Guide: How to Use the LMS Application

## Table of Contents
1. [What is This Application?](#what-is-this-application)
2. [Before You Begin](#before-you-begin)
3. [Installation & Setup](#installation--setup)
4. [Running the Application](#running-the-application)
5. [Using the Application](#using-the-application)
6. [Understanding the Architecture](#understanding-the-architecture)
7. [Troubleshooting](#troubleshooting)
8. [Technical Concepts Explained](#technical-concepts-explained)
9. [For Project Reviewers](#for-project-reviewers)

---

## What is This Application?

This is a **Learning Management System (LMS)** - a web application similar to platforms like Moodle or Blackboard. It allows:
- **Students** to enroll in courses and submit assignments
- **Instructors** to create courses and grade work
- **Administrators** to manage the entire system

### Current Status
- **✅ Phase 1 (Complete)**: User login, registration, and role-based dashboards
- **🚧 Phase 2 (Coming)**: Course creation and enrollment
- **📋 Phase 3 (Planned)**: Assignments and grading

---

## Before You Begin

### Required Software

#### 1. Check if Node.js is installed
Open Terminal and type:
```bash
node --version
```
- ✅ If you see `v20.x.x` or higher, you're good
- ❌ If not, download from: https://nodejs.org/

#### 2. Check if PostgreSQL is installed
Open Terminal and type:
```bash
psql --version
```
- ✅ If you see `PostgreSQL 15.x` or higher, you're good
- ❌ If not, for Mac users: Download Postgres.app from https://postgresapp.com/

#### 3. Ensure PostgreSQL is running
- On Mac: Look for the elephant icon in your menu bar
- Or open Postgres.app and click "Start"

### What is Terminal?
Terminal is a text-based way to interact with your computer. To open it:
- Mac: Press `Cmd + Space`, type "Terminal", press Enter
- Windows: Search for "Command Prompt" or "PowerShell"

### Basic Terminal Commands You'll Use
- `cd foldername` - Navigate into a folder
- `cd ..` - Go back one folder
- `ls` - List files in current folder (Mac/Linux)
- `pwd` - Show current folder path
- `Ctrl + C` - Stop a running program

---

## Installation & Setup

### First Time Setup (Do This Once)

#### Step 1: Navigate to the project
```bash
cd /Users/igeorgiadis/Desktop/cf7-igeorgiadis-2025
```
**What this does**: Changes your terminal's location to the project folder

#### Step 2: Configure PostgreSQL (Mac users)
```bash
export PATH=$PATH:/Applications/Postgres.app/Contents/Versions/latest/bin
```
**What this does**: Tells your computer where to find PostgreSQL commands

#### Step 3: Run automatic setup
```bash
./quickstart.sh
```
**What this does**: 
- Creates the database
- Sets up all the tables
- Installs necessary code libraries
- Configures the application

**When asked** "Do you want to seed the database with test data?", type `y` and press Enter

---

## Running the Application

You need TWO terminal windows - one for the backend (server) and one for the frontend (user interface).

### Terminal 1: Start the Backend Server

1. Open Terminal
2. Navigate to backend:
   ```bash
   cd /Users/igeorgiadis/Desktop/cf7-igeorgiadis-2025/backend
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

**Success looks like**:
```
🚀 LMS Backend Server Started
📡 Environment: development
🔗 URL: http://localhost:5001
```

**What this means**: The server that handles data and user authentication is running

### Terminal 2: Start the Frontend

1. Open a NEW Terminal window (`Cmd + N`)
2. Navigate to frontend:
   ```bash
   cd /Users/igeorgiadis/Desktop/cf7-igeorgiadis-2025/frontend
   ```
3. Start the interface:
   ```bash
   npm run dev
   ```

**Success looks like**:
```
VITE ready in 507 ms
➜  Local:   http://localhost:5173/
```

**What this means**: The user interface is ready

### Step 3: Open the Application
- Click the link `http://localhost:5173/` in Terminal
- Or open your web browser and type: `http://localhost:5173`

---

## Using the Application

### Test Accounts

| Role | Email | Password | What They Can Do |
|------|-------|----------|------------------|
| **Student** | student@lms.com | StudyPass123! | View courses, submit work |
| **Instructor** | instructor@lms.com | TeachPass123! | Create courses, grade |
| **Admin** | admin@lms.com | AdminPass123! | Manage everything |

### How to Login
1. Go to http://localhost:5173
2. Enter email and password
3. Click "Sign in"

### What You'll See After Login

#### Student Dashboard
- **Enrolled Courses**: Shows 0 (courses not implemented yet)
- **Completed Courses**: Shows 0 
- **Pending Assignments**: Shows 0
- **Available Actions**: Buttons are placeholders for Phase 2

#### Instructor Dashboard
- **My Courses**: Shows 0 (creation coming in Phase 2)
- **Total Students**: Shows 0
- **Pending Grading**: Shows 0
- **Quick Actions**: Buttons are placeholders

#### Admin Dashboard
- **Total Users**: Shows actual count from database
- **Total Courses**: Shows 0
- **Active Enrollments**: Shows 0
- **System Management**: Buttons are placeholders

### How to Register a New Account
1. On login page, click "create a new account"
2. Fill in:
   - First Name
   - Last Name
   - Email
   - Select Role (Student or Instructor)
   - Password (must have uppercase, lowercase, number, and special character)
3. Click "Create Account"

### How to Logout
Click "Logout" in the top-right corner

---

## Understanding the Architecture

### How This Application Works

```
Your Browser (Frontend)          Backend Server          Database
    http://localhost:5173  <-->  http://localhost:5001  <-->  PostgreSQL
         React App                  Express API              Data Storage
```

1. **Frontend (React)**: What you see and interact with
2. **Backend (Express)**: Handles logic, security, and data processing
3. **Database (PostgreSQL)**: Stores all information permanently

### Why Two Terminals?
- **Terminal 1**: Runs the backend server (handles data)
- **Terminal 2**: Runs the frontend server (shows the interface)
- Both must be running for the app to work

### Project Folder Structure
```
cf7-igeorgiadis-2025/
├── backend/          # Server code
│   ├── src/         # Source code
│   └── .env         # Configuration
├── frontend/        # User interface code
│   ├── src/         # React components
│   └── .env         # Configuration
└── HOW_TO_USE.md    # This file
```

---

## Troubleshooting

### Common Issues and Solutions

#### "Cannot connect to database"
**Check PostgreSQL is running**:
1. Open Postgres.app
2. Should show green "Running" status
3. If not, click "Start"

#### "Login failed" 
**Possible causes**:
1. Backend not running - check Terminal 1 shows "Server Started"
2. Wrong credentials - use exact email/password from test accounts
3. Database not seeded - run `npm run seed` in backend folder

#### "Port already in use"
**Solution**:
1. Another program is using the port
2. Find it: `lsof -i :5001` (for backend) or `lsof -i :5173` (for frontend)
3. Stop it or use different ports

#### "Command not found: npm"
**Solution**: Node.js not installed. Download from https://nodejs.org/

#### "Command not found: psql"
**Solution for Mac**: 
```bash
export PATH=$PATH:/Applications/Postgres.app/Contents/Versions/latest/bin
```

### How to Restart Everything
1. Stop both servers: Press `Ctrl + C` in each terminal
2. Close terminals
3. Start fresh following "Running the Application" steps

### How to Reset Database
```bash
cd backend
npm run migrate  # Recreate tables
npm run seed     # Add test data
```

---

## Technical Concepts Explained

### What is a Database?
- Think of it as Excel spreadsheets that store information
- Tables: Users, Courses, Enrollments, etc.
- Each row is a record (like one user)
- Each column is a property (like email, name)

### What are Ports?
- Like apartment numbers for programs
- Backend uses 5001
- Frontend uses 5173
- Your browser knows which "apartment" to visit

### What is an API?
- Application Programming Interface
- How the frontend asks the backend for data
- Like a waiter taking orders between you (frontend) and kitchen (backend)

### What is Authentication?
- Proves who you are (login)
- JWT tokens are like temporary ID cards
- Stored securely, expires after time

### Frontend vs Backend
- **Frontend**: What you see (buttons, forms, colors)
- **Backend**: Business logic (who can do what, data rules)
- Work together to create the full application

---

## For Project Reviewers

### Evaluating the Code

#### Key Files to Review
1. **Backend Structure**:
   - `/backend/src/controllers/` - HTTP request handlers
   - `/backend/src/services/` - Business logic
   - `/backend/src/repositories/` - Database queries
   - `/backend/src/middlewares/auth.js` - Security

2. **Frontend Structure**:
   - `/frontend/src/pages/` - Page components
   - `/frontend/src/contexts/AuthContext.jsx` - User state management
   - `/frontend/src/components/` - Reusable UI pieces

3. **Database Design**:
   - `/backend/migrations/` - Table definitions
   - 7 tables with proper relationships

#### Security Features Implemented
- Password hashing with bcrypt
- JWT authentication
- Input validation
- SQL injection prevention
- Role-based access control

#### Testing the Requirements
1. **Authentication**: ✅ Login/Logout/Register work
2. **Three User Roles**: ✅ Different dashboards per role
3. **Database**: ✅ All tables created with relationships
4. **Security**: ✅ Passwords hashed, tokens expire
5. **Architecture**: ✅ Repository pattern, service layer

### Running Tests
```bash
cd backend
npm test          # Run unit tests
npm run test:coverage  # See code coverage
```

### API Documentation
Base URL: `http://localhost:5001/api`

**Public Endpoints**:
- POST `/auth/login` - User login
- POST `/auth/register` - New user registration

**Protected Endpoints** (require login):
- GET `/auth/me` - Get current user
- POST `/auth/logout` - Logout
- GET `/users` - List all users (Admin only)

### Verifying Phase 1 Completion
- [x] User registration with role selection
- [x] Login/logout functionality
- [x] JWT-based authentication
- [x] Role-based dashboards
- [x] PostgreSQL database with migrations
- [x] Repository pattern implementation
- [x] Service layer for business logic
- [x] Input validation
- [x] Error handling
- [x] Basic test coverage

---

## Quick Reference Card

### Daily Use Commands
```bash
# Start everything
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2

# Stop everything
Ctrl + C                     # In each terminal

# If something breaks
cd backend
npm run migrate             # Reset database
npm run seed               # Add test users
```

### Test Logins
- Student: student@lms.com / StudyPass123!
- Teacher: instructor@lms.com / TeachPass123!
- Admin: admin@lms.com / AdminPass123!

### URLs
- Application: http://localhost:5173
- API Health Check: http://localhost:5001/health

---

*This guide covers Phase 1 of the LMS project. Features like course creation, enrollment, and assignments will be added in future phases.*
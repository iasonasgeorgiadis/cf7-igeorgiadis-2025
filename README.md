# Learning Management System

## About This Project

I built this LMS as my final project for Coding Factory 7 at Athens University of Economics and Business. It's a web application where instructors can create and manage courses, and students can enroll and submit assignments.

**University**: Athens University of Economics and Business  
**Program**: Coding Factory 7 - Center for Training and Lifelong Learning  
**Creator**: Iasonas Georgiadis

## What It Does

### For Students
- Log in securely with test credentials (registration not implemented)
- Browse available courses and see what you're eligible for
- Enroll in courses (if there's space available)
- View course details and enrolled courses
- See your courses in the dashboard

### For Instructors
- Create and manage your own courses
- Set course capacity and prerequisites
- View enrolled students
- See your courses in the dashboard

*Note: Lesson management, assignment creation, and grading features are considered but not yet implemented in the UI*

## Tech Stack

I used the following web technologies to build this:

**Backend**: Node.js with Express for the server, PostgreSQL for the database, and JWT for secure authentication.

**Frontend**: React with Vite for fast development, styled with Tailwind CSS, and React Router for navigation.


## Getting Started

### What You Need
- Node.js version 20 or higher
- PostgreSQL database (see installation instructions below)
- npm (comes with Node.js)

#### Installing PostgreSQL

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and run the installer from https://www.postgresql.org/download/windows/

### Setting It Up

1. **Get the code**
   ```bash
   git clone https://github.com/iasonasgeorgiadis/cf7-iasongeorgiadis-2025.git
   cd cf7-iasongeorgiadis-2025
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

Open your browser to the URL shown in the frontend terminal (usually http://localhost:5173)

### Test Accounts

After running the seed command, you can log in with:
- Instructor: instructor@lms.com / TeachPass123!
- Student: student@lms.com / StudyPass123!

**Note**: Registration is disabled. Please use these test accounts to explore the application.

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

---
**Author**: Iasonas Georgiadis  
**Program**: Coding Factory 7 - Athens University of Economics and Business

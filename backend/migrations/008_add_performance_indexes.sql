-- Add performance indexes for common queries

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Courses table indexes
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);

-- Enrollments table indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrollment_date ON enrollments(enrollment_date DESC);
-- Composite index for finding student's enrollments in a course
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON enrollments(student_id, course_id);

-- Lessons table indexes
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons(course_id, "order");
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at DESC);

-- Assignments table indexes
CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id ON assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date) WHERE due_date IS NOT NULL;

-- Submissions table indexes
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);
-- Composite index for finding student's submission for an assignment
CREATE INDEX IF NOT EXISTS idx_submissions_student_assignment ON submissions(student_id, assignment_id);
-- Index for grading queries
CREATE INDEX IF NOT EXISTS idx_submissions_graded ON submissions(graded_at) WHERE graded_at IS NOT NULL;

-- Course prerequisites indexes
CREATE INDEX IF NOT EXISTS idx_prerequisites_course_id ON course_prerequisites(course_id);
CREATE INDEX IF NOT EXISTS idx_prerequisites_prerequisite_id ON course_prerequisites(prerequisite_id);

-- Performance indexes for common JOIN operations
-- Index for finding all courses taught by an instructor with enrollments
CREATE INDEX IF NOT EXISTS idx_courses_instructor_title ON courses(instructor_id, title);

-- Index for finding enrollments by date
CREATE INDEX IF NOT EXISTS idx_enrollments_dates ON enrollments(enrollment_date DESC);

-- Full-text search indexes (PostgreSQL specific)
-- Add GIN index for course search
CREATE INDEX IF NOT EXISTS idx_courses_search ON courses 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Add GIN index for lesson search
CREATE INDEX IF NOT EXISTS idx_lessons_search ON lessons 
  USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Statistics update for query planner
ANALYZE users;
ANALYZE courses;
ANALYZE enrollments;
ANALYZE lessons;
ANALYZE assignments;
ANALYZE submissions;
ANALYZE course_prerequisites;
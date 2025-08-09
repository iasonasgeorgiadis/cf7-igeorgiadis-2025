-- Create submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    grade DECIMAL(5,2) CHECK (grade >= 0 AND grade <= 100),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    graded_by UUID REFERENCES users(id),
    feedback TEXT,
    UNIQUE(student_id, assignment_id)
);

-- Create indexes
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);

-- Create trigger to ensure graded_at is set when grade is updated
CREATE OR REPLACE FUNCTION update_graded_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.grade IS NOT NULL AND OLD.grade IS NULL THEN
        NEW.graded_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_submissions_graded_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_graded_at();
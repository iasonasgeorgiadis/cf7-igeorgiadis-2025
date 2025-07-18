-- Create course prerequisites table
CREATE TABLE course_prerequisites (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    prerequisite_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, prerequisite_id),
    CHECK (course_id != prerequisite_id)
);

-- Create indexes
CREATE INDEX idx_prerequisites_course_id ON course_prerequisites(course_id);
CREATE INDEX idx_prerequisites_prerequisite_id ON course_prerequisites(prerequisite_id);
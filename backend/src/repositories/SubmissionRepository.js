const Submission = require('../models/Submission');

// Submission repository for database operations
class SubmissionRepository {
  constructor(db) {
    this.db = db;
  }

  // Finds submission for specific assignment and student
  async findByAssignmentAndStudent(assignmentId, studentId) {
    const query = `
      SELECT 
        s.*,
        a.title as assignment_title,
        a.points as assignment_points,
        a.due_date as assignment_due_date,
        u.email,
        u.first_name,
        u.last_name
      FROM submissions s
      INNER JOIN assignments a ON a.id = s.assignment_id
      INNER JOIN users u ON u.id = s.student_id
      WHERE s.assignment_id = $1 AND s.student_id = $2
    `;

    const result = await this.db.query(query, [assignmentId, studentId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return new Submission({
      ...result.rows[0],
      assignment: {
        id: result.rows[0].assignment_id,
        title: result.rows[0].assignment_title,
        points: result.rows[0].assignment_points,
        due_date: result.rows[0].assignment_due_date
      },
      student: {
        id: result.rows[0].student_id,
        email: result.rows[0].email,
        first_name: result.rows[0].first_name,
        last_name: result.rows[0].last_name
      }
    });
  }

  // Gets all submissions for an assignment with optional student info
  async findByAssignment(assignmentId, includeStudentInfo = true) {
    let query = `
      SELECT 
        s.*,
        a.title as assignment_title,
        a.points as assignment_points,
        a.due_date as assignment_due_date
    `;

    if (includeStudentInfo) {
      query += `,
        u.email,
        u.first_name,
        u.last_name
      `;
    }

    query += `
      FROM submissions s
      INNER JOIN assignments a ON a.id = s.assignment_id
    `;

    if (includeStudentInfo) {
      query += `
        INNER JOIN users u ON u.id = s.student_id
      `;
    }

    query += `
      WHERE s.assignment_id = $1
      ORDER BY s.submitted_at DESC
    `;

    const result = await this.db.query(query, [assignmentId]);
    
    return result.rows.map(row => new Submission({
      ...row,
      assignment: {
        id: row.assignment_id,
        title: row.assignment_title,
        points: row.assignment_points,
        due_date: row.assignment_due_date
      },
      student: includeStudentInfo ? {
        id: row.student_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name
      } : null
    }));
  }

  // Gets all submissions from a student in a specific course
  async findByStudentAndCourse(studentId, courseId) {
    const query = `
      SELECT 
        s.*,
        a.title as assignment_title,
        a.points as assignment_points,
        a.due_date as assignment_due_date,
        l.title as lesson_title,
        l.order as lesson_order
      FROM submissions s
      INNER JOIN assignments a ON a.id = s.assignment_id
      INNER JOIN lessons l ON l.id = a.lesson_id
      WHERE s.student_id = $1 AND l.course_id = $2
      ORDER BY l.order ASC, a.created_at ASC
    `;

    const result = await this.db.query(query, [studentId, courseId]);
    
    return result.rows.map(row => new Submission({
      ...row,
      assignment: {
        id: row.assignment_id,
        title: row.assignment_title,
        points: row.assignment_points,
        due_date: row.assignment_due_date,
        lesson_title: row.lesson_title,
        lesson_order: row.lesson_order
      }
    }));
  }

  // Finds submission by ID with assignment, student, and course details
  async findById(id) {
    const query = `
      SELECT 
        s.*,
        a.title as assignment_title,
        a.points as assignment_points,
        a.due_date as assignment_due_date,
        a.lesson_id,
        l.course_id,
        c.title as course_title,
        c.instructor_id,
        u.email,
        u.first_name,
        u.last_name
      FROM submissions s
      INNER JOIN assignments a ON a.id = s.assignment_id
      INNER JOIN lessons l ON l.id = a.lesson_id
      INNER JOIN courses c ON c.id = l.course_id
      INNER JOIN users u ON u.id = s.student_id
      WHERE s.id = $1
    `;

    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return new Submission({
      ...result.rows[0],
      assignment: {
        id: result.rows[0].assignment_id,
        title: result.rows[0].assignment_title,
        points: result.rows[0].assignment_points,
        due_date: result.rows[0].assignment_due_date,
        lesson_id: result.rows[0].lesson_id
      },
      student: {
        id: result.rows[0].student_id,
        email: result.rows[0].email,
        first_name: result.rows[0].first_name,
        last_name: result.rows[0].last_name
      },
      course: {
        id: result.rows[0].course_id,
        title: result.rows[0].course_title,
        instructor_id: result.rows[0].instructor_id
      }
    });
  }

  // Creates a new submission for an assignment
  async create(submissionData) {
    const query = `
      INSERT INTO submissions (
        assignment_id, student_id, content, submitted_at
      ) VALUES (
        $1, $2, $3, NOW()
      ) RETURNING *
    `;

    const values = [
      submissionData.assignment_id,
      submissionData.student_id,
      submissionData.content
    ];

    const result = await this.db.query(query, values);
    return new Submission(result.rows[0]);
  }

  // Updates submission content when student resubmits
  async update(id, content) {
    const query = `
      UPDATE submissions
      SET content = $1, submitted_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await this.db.query(query, [content, id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return new Submission(result.rows[0]);
  }

  // Grades a submission with score and feedback
  async grade(id, grade, feedback = null) {
    const query = `
      UPDATE submissions
      SET grade = $1, feedback = $2, graded_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await this.db.query(query, [grade, feedback, id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return new Submission(result.rows[0]);
  }

  // Deletes a submission from database
  async delete(id) {
    const query = 'DELETE FROM submissions WHERE id = $1 RETURNING id';
    const result = await this.db.query(query, [id]);
    return result.rows.length > 0;
  }

  // Calculates submission and grading stats for a course
  async getCourseStats(courseId) {
    const query = `
      SELECT 
        COUNT(DISTINCT a.id) as total_assignments,
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.grade IS NOT NULL THEN s.id END) as graded_submissions,
        COUNT(DISTINCT e.student_id) as total_students,
        ROUND(AVG(CASE WHEN s.grade IS NOT NULL THEN (s.grade::float / a.points * 100) END), 2) as average_grade
      FROM courses c
      INNER JOIN lessons l ON l.course_id = c.id
      INNER JOIN assignments a ON a.lesson_id = l.id
      INNER JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = e.student_id
      WHERE c.id = $1
    `;

    const result = await this.db.query(query, [courseId]);
    return result.rows[0];
  }

  // Gets ungraded submissions for instructor to review
  async findPendingForInstructor(instructorId, limit = 10) {
    const query = `
      SELECT 
        s.*,
        a.title as assignment_title,
        a.points as assignment_points,
        a.due_date as assignment_due_date,
        c.title as course_title,
        u.email,
        u.first_name,
        u.last_name
      FROM submissions s
      INNER JOIN assignments a ON a.id = s.assignment_id
      INNER JOIN lessons l ON l.id = a.lesson_id
      INNER JOIN courses c ON c.id = l.course_id
      INNER JOIN users u ON u.id = s.student_id
      WHERE c.instructor_id = $1 AND s.grade IS NULL
      ORDER BY s.submitted_at ASC
      LIMIT $2
    `;

    const result = await this.db.query(query, [instructorId, limit]);
    
    return result.rows.map(row => new Submission({
      ...row,
      assignment: {
        id: row.assignment_id,
        title: row.assignment_title,
        points: row.assignment_points,
        due_date: row.assignment_due_date
      },
      student: {
        id: row.student_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name
      },
      course: {
        title: row.course_title
      }
    }));
  }
}

module.exports = SubmissionRepository;
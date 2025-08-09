const Assignment = require('../models/Assignment');

// Assignment repository for database operations
class AssignmentRepository {
  constructor(db) {
    this.db = db;
  }

  // Gets all assignments for a specific lesson
  async findByLesson(lessonId) {
    const query = `
      SELECT 
        a.*,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT CASE WHEN s.grade IS NOT NULL THEN s.id END) as graded_count
      FROM assignments a
      LEFT JOIN submissions s ON s.assignment_id = a.id
      WHERE a.lesson_id = $1
      GROUP BY a.id
      ORDER BY a.created_at ASC
    `;

    const result = await this.db.query(query, [lessonId]);
    return result.rows.map(row => new Assignment(row));
  }

  // Gets all assignments for a course with submission stats
  async findByCourse(courseId) {
    const query = `
      SELECT 
        a.*,
        l.title as lesson_title,
        l.order as lesson_order,
        COUNT(DISTINCT e.id) as enrolled_count,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT CASE WHEN s.grade IS NOT NULL THEN s.id END) as graded_count
      FROM assignments a
      INNER JOIN lessons l ON l.id = a.lesson_id
      INNER JOIN courses c ON c.id = l.course_id
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
      LEFT JOIN submissions s ON s.assignment_id = a.id
      WHERE l.course_id = $1
      GROUP BY a.id, l.title, l.order
      ORDER BY l.order ASC, a.created_at ASC
    `;

    const result = await this.db.query(query, [courseId]);
    return result.rows.map(row => new Assignment({
      ...row,
      lesson: {
        id: row.lesson_id,
        title: row.lesson_title,
        order: row.lesson_order
      },
      course: {
        enrolled_count: row.enrolled_count
      }
    }));
  }

  // Finds assignment by ID with lesson and course info
  async findById(id, includeSubmissions = false) {
    let query = `
      SELECT 
        a.*,
        l.title as lesson_title,
        l.order as lesson_order,
        c.id as course_id,
        c.title as course_title,
        COUNT(DISTINCT e.id) as enrolled_count,
        COUNT(DISTINCT s.id) as submission_count,
        COUNT(DISTINCT CASE WHEN s.grade IS NOT NULL THEN s.id END) as graded_count
      FROM assignments a
      INNER JOIN lessons l ON l.id = a.lesson_id
      INNER JOIN courses c ON c.id = l.course_id
      LEFT JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
      LEFT JOIN submissions s ON s.assignment_id = a.id
      WHERE a.id = $1
      GROUP BY a.id, l.title, l.order, c.id, c.title
    `;

    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const assignmentData = {
      ...result.rows[0],
      lesson: {
        id: result.rows[0].lesson_id,
        title: result.rows[0].lesson_title,
        order: result.rows[0].lesson_order
      },
      course: {
        id: result.rows[0].course_id,
        title: result.rows[0].course_title,
        enrolled_count: result.rows[0].enrolled_count
      }
    };

    if (includeSubmissions) {
      const submissionsQuery = `
        SELECT 
          s.*,
          u.username,
          u.first_name,
          u.last_name
        FROM submissions s
        INNER JOIN users u ON u.id = s.student_id
        WHERE s.assignment_id = $1
        ORDER BY s.submitted_at DESC
      `;
      
      const submissionsResult = await this.db.query(submissionsQuery, [id]);
      assignmentData.submissions = submissionsResult.rows;
    }

    return new Assignment(assignmentData);
  }

  // Gets upcoming assignments that student hasn't submitted yet
  async findUpcomingForStudent(studentId, limit = 5) {
    const query = `
      SELECT 
        a.*,
        l.title as lesson_title,
        c.title as course_title,
        s.id as submission_id,
        s.submitted_at
      FROM assignments a
      INNER JOIN lessons l ON l.id = a.lesson_id
      INNER JOIN courses c ON c.id = l.course_id
      INNER JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = $1
      WHERE e.student_id = $1
        AND e.status = 'active'
        AND a.due_date > NOW()
        AND s.id IS NULL
      ORDER BY a.due_date ASC
      LIMIT $2
    `;

    const result = await this.db.query(query, [studentId, limit]);
    return result.rows.map(row => new Assignment({
      ...row,
      lesson: {
        id: row.lesson_id,
        title: row.lesson_title
      },
      course: {
        title: row.course_title
      }
    }));
  }

  // Creates a new assignment for a lesson
  async create(assignmentData) {
    const query = `
      INSERT INTO assignments (
        lesson_id, title, description, due_date, points
      ) VALUES (
        $1, $2, $3, $4, $5
      ) RETURNING *
    `;

    const values = [
      assignmentData.lesson_id,
      assignmentData.title,
      assignmentData.description,
      assignmentData.due_date,
      assignmentData.points
    ];

    const result = await this.db.query(query, values);
    return new Assignment(result.rows[0]);
  }

  // Updates assignment details like title, description, due date
  async update(id, updateData) {
    const allowedFields = ['title', 'description', 'due_date', 'points'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(updateData[field]);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE assignments
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    values.push(id);

    const result = await this.db.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    return new Assignment(result.rows[0]);
  }

  // Deletes an assignment from database
  async delete(id) {
    const query = 'DELETE FROM assignments WHERE id = $1 RETURNING id';
    const result = await this.db.query(query, [id]);
    return result.rows.length > 0;
  }

  // Gets assignment stats for instructor's dashboard
  async getInstructorStats(instructorId) {
    const query = `
      SELECT 
        COUNT(DISTINCT a.id) as total_assignments,
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.grade IS NOT NULL THEN s.id END) as graded_submissions,
        COUNT(DISTINCT CASE WHEN s.grade IS NULL AND s.id IS NOT NULL THEN s.id END) as pending_grading,
        COUNT(DISTINCT CASE WHEN a.due_date < NOW() THEN a.id END) as past_due,
        COUNT(DISTINCT CASE WHEN a.due_date > NOW() THEN a.id END) as upcoming
      FROM assignments a
      INNER JOIN lessons l ON l.id = a.lesson_id
      INNER JOIN courses c ON c.id = l.course_id
      LEFT JOIN submissions s ON s.assignment_id = a.id
      WHERE c.instructor_id = $1
    `;

    const result = await this.db.query(query, [instructorId]);
    return result.rows[0];
  }
}

module.exports = AssignmentRepository;
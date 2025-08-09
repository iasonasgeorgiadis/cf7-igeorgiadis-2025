const { query, getClient } = require('../config/database');
const Enrollment = require('../models/Enrollment');

// Enrollment repository for database operations
class EnrollmentRepository {
  // Finds enrollment for specific student and course
  async findByStudentAndCourse(studentId, courseId) {
    const result = await query(
      'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );
    
    return result.rows[0] ? new Enrollment(result.rows[0]) : null;
  }

  // Finds enrollment by ID
  async findById(id) {
    const result = await query(
      'SELECT * FROM enrollments WHERE id = $1',
      [id]
    );
    
    return result.rows[0] ? new Enrollment(result.rows[0]) : null;
  }

  // Gets all enrollments for a student with optional status filter
  async findByStudent(studentId, status = null) {
    let queryText = `
      SELECT 
        e.*,
        c.title as course_title,
        c.description as course_description,
        c.capacity as course_capacity,
        u.first_name as instructor_first_name,
        u.last_name as instructor_last_name
      FROM enrollments e
      INNER JOIN courses c ON e.course_id = c.id
      INNER JOIN users u ON c.instructor_id = u.id
      WHERE e.student_id = $1
    `;
    
    const params = [studentId];
    
    if (status) {
      queryText += ' AND e.status = $2';
      params.push(status);
    }
    
    queryText += ' ORDER BY e.enrollment_date DESC';
    
    const result = await query(queryText, params);
    
    return result.rows.map(row => {
      row.course = {
        id: row.course_id,
        title: row.course_title,
        description: row.course_description,
        capacity: row.course_capacity,
        instructor: {
          first_name: row.instructor_first_name,
          last_name: row.instructor_last_name,
          full_name: `${row.instructor_first_name} ${row.instructor_last_name}`
        }
      };
      return new Enrollment(row);
    });
  }

  // Gets all enrollments for a course with optional status filter
  async findByCourse(courseId, status = null) {
    let queryText = `
      SELECT 
        e.*,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        u.email as student_email
      FROM enrollments e
      INNER JOIN users u ON e.student_id = u.id
      WHERE e.course_id = $1
    `;
    
    const params = [courseId];
    
    if (status) {
      queryText += ' AND e.status = $2';
      params.push(status);
    }
    
    queryText += ' ORDER BY e.enrollment_date DESC';
    
    const result = await query(queryText, params);
    
    return result.rows.map(row => {
      row.student = {
        id: row.student_id,
        first_name: row.student_first_name,
        last_name: row.student_last_name,
        email: row.student_email,
        full_name: `${row.student_first_name} ${row.student_last_name}`
      };
      return new Enrollment(row);
    });
  }

  // Creates a new enrollment (student joining course)
  async create(enrollmentData) {
    const { student_id, course_id } = enrollmentData;
    
    const result = await query(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2)
       RETURNING *`,
      [student_id, course_id]
    );
    
    return new Enrollment(result.rows[0]);
  }

  // Updates enrollment status or completion info
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && ['status', 'completion_percentage', 'completed_at'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    
    const result = await query(
      `UPDATE enrollments SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    return result.rows[0] ? new Enrollment(result.rows[0]) : null;
  }

  // Counts how many students are actively enrolled in course
  async countActiveByCourse(courseId) {
    const result = await query(
      'SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = $2',
      [courseId, 'active']
    );
    
    return parseInt(result.rows[0].count);
  }

  // Checks if student has completed all required prerequisite courses
  async hasCompletedPrerequisites(studentId, prerequisiteIds) {
    if (!prerequisiteIds || prerequisiteIds.length === 0) {
      return true;
    }

    const result = await query(
      `SELECT COUNT(*) FROM enrollments 
       WHERE student_id = $1 
       AND course_id = ANY($2::uuid[])
       AND status = 'completed'`,
      [studentId, prerequisiteIds]
    );
    
    return parseInt(result.rows[0].count) === prerequisiteIds.length;
  }

  // Gets list of course IDs that student has completed
  async getCompletedCourseIds(studentId) {
    const result = await query(
      'SELECT course_id FROM enrollments WHERE student_id = $1 AND status = $2',
      [studentId, 'completed']
    );
    
    return result.rows.map(row => row.course_id);
  }

  // Deletes enrollment (student drops course)
  async delete(id) {
    const result = await query('DELETE FROM enrollments WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
}

module.exports = new EnrollmentRepository();
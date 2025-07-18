const { query, getClient } = require('../config/database');
const Enrollment = require('../models/Enrollment');

/**
 * Enrollment repository for database operations
 */
class EnrollmentRepository {
  /**
   * Find enrollment by student and course
   * @param {string} studentId - Student ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Enrollment|null>} Enrollment or null
   */
  async findByStudentAndCourse(studentId, courseId) {
    const result = await query(
      'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );
    
    return result.rows[0] ? new Enrollment(result.rows[0]) : null;
  }

  /**
   * Find enrollment by ID
   * @param {string} id - Enrollment ID
   * @returns {Promise<Enrollment|null>} Enrollment or null
   */
  async findById(id) {
    const result = await query(
      'SELECT * FROM enrollments WHERE id = $1',
      [id]
    );
    
    return result.rows[0] ? new Enrollment(result.rows[0]) : null;
  }

  /**
   * Get student's enrollments
   * @param {string} studentId - Student ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Enrollment[]>} Student's enrollments
   */
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

  /**
   * Get course enrollments
   * @param {string} courseId - Course ID
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<Enrollment[]>} Course enrollments
   */
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

  /**
   * Create new enrollment
   * @param {Object} enrollmentData - Enrollment data
   * @returns {Promise<Enrollment>} Created enrollment
   */
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

  /**
   * Update enrollment
   * @param {string} id - Enrollment ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Enrollment|null>} Updated enrollment or null
   */
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

  /**
   * Count active enrollments for a course
   * @param {string} courseId - Course ID
   * @returns {Promise<number>} Active enrollment count
   */
  async countActiveByCourse(courseId) {
    const result = await query(
      'SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = $2',
      [courseId, 'active']
    );
    
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if student completed prerequisites
   * @param {string} studentId - Student ID
   * @param {string[]} prerequisiteIds - Prerequisite course IDs
   * @returns {Promise<boolean>} True if all prerequisites completed
   */
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

  /**
   * Get completed courses for a student
   * @param {string} studentId - Student ID
   * @returns {Promise<string[]>} Completed course IDs
   */
  async getCompletedCourseIds(studentId) {
    const result = await query(
      'SELECT course_id FROM enrollments WHERE student_id = $1 AND status = $2',
      [studentId, 'completed']
    );
    
    return result.rows.map(row => row.course_id);
  }

  /**
   * Delete enrollment (drop course)
   * @param {string} id - Enrollment ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await query('DELETE FROM enrollments WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
}

module.exports = new EnrollmentRepository();
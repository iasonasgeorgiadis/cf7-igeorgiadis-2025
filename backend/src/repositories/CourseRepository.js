const { query, getClient } = require('../config/database');
const Course = require('../models/Course');

/**
 * Course repository for database operations
 */
class CourseRepository {
  /**
   * Find course by ID
   * @param {string} id - Course ID
   * @param {boolean} includeDetails - Include instructor and enrollment count
   * @returns {Promise<Course|null>} Course instance or null
   */
  async findById(id, includeDetails = false) {
    let queryText = `
      SELECT c.*
    `;

    if (includeDetails) {
      queryText = `
        SELECT 
          c.*,
          u.first_name as instructor_first_name,
          u.last_name as instructor_last_name,
          u.email as instructor_email,
          COUNT(DISTINCT e.id) as enrolled_count
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
        WHERE c.id = $1
        GROUP BY c.id, u.id
      `;
    } else {
      queryText += 'FROM courses c WHERE c.id = $1';
    }

    const result = await query(queryText, [id]);
    
    if (!result.rows[0]) {
      return null;
    }

    const courseData = result.rows[0];
    if (includeDetails && courseData.instructor_first_name) {
      courseData.instructor = {
        id: courseData.instructor_id,
        first_name: courseData.instructor_first_name,
        last_name: courseData.instructor_last_name,
        email: courseData.instructor_email,
        full_name: `${courseData.instructor_first_name} ${courseData.instructor_last_name}`
      };
    }

    return new Course(courseData);
  }

  /**
   * Get all courses with filters
   * @param {Object} options - Query options
   * @returns {Promise<{courses: Course[], total: number}>} Courses and total count
   */
  async findAll(options = {}) {
    const { 
      limit = 20, 
      offset = 0, 
      search = null,
      instructor_id = null,
      available_only = false 
    } = options;

    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (search) {
      whereConditions.push(`(c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (instructor_id) {
      whereConditions.push(`c.instructor_id = $${paramCount}`);
      params.push(instructor_id);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) 
      FROM courses c
      ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Main query with details
    let mainQuery = `
      SELECT 
        c.*,
        u.first_name as instructor_first_name,
        u.last_name as instructor_last_name,
        u.email as instructor_email,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      ${whereClause}
      GROUP BY c.id, u.id
    `;

    if (available_only) {
      mainQuery += ` HAVING COUNT(DISTINCT e.id) < c.capacity`;
    }

    mainQuery += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(mainQuery, params);
    
    const courses = result.rows.map(row => {
      if (row.instructor_first_name) {
        row.instructor = {
          id: row.instructor_id,
          first_name: row.instructor_first_name,
          last_name: row.instructor_last_name,
          email: row.instructor_email,
          full_name: `${row.instructor_first_name} ${row.instructor_last_name}`
        };
      }
      return new Course(row);
    });

    return { courses, total };
  }

  /**
   * Create new course
   * @param {Object} courseData - Course data
   * @returns {Promise<Course>} Created course
   */
  async create(courseData) {
    const { title, description, capacity, instructor_id } = courseData;
    
    const result = await query(
      `INSERT INTO courses (title, description, capacity, instructor_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, capacity, instructor_id]
    );
    
    return new Course(result.rows[0]);
  }

  /**
   * Update course
   * @param {string} id - Course ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Course|null>} Updated course or null
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && ['title', 'description', 'capacity'].includes(key)) {
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
      `UPDATE courses SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    return result.rows[0] ? new Course(result.rows[0]) : null;
  }

  /**
   * Delete course
   * @param {string} id - Course ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await query('DELETE FROM courses WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Get course prerequisites
   * @param {string} courseId - Course ID
   * @returns {Promise<Course[]>} Prerequisite courses
   */
  async getPrerequisites(courseId) {
    const result = await query(
      `SELECT c.* FROM courses c
       INNER JOIN course_prerequisites cp ON c.id = cp.prerequisite_id
       WHERE cp.course_id = $1`,
      [courseId]
    );
    
    return result.rows.map(row => new Course(row));
  }

  /**
   * Add prerequisite to course
   * @param {string} courseId - Course ID
   * @param {string} prerequisiteId - Prerequisite course ID
   * @returns {Promise<void>}
   */
  async addPrerequisite(courseId, prerequisiteId) {
    await query(
      `INSERT INTO course_prerequisites (course_id, prerequisite_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [courseId, prerequisiteId]
    );
  }

  /**
   * Remove prerequisite from course
   * @param {string} courseId - Course ID
   * @param {string} prerequisiteId - Prerequisite course ID
   * @returns {Promise<boolean>} True if removed
   */
  async removePrerequisite(courseId, prerequisiteId) {
    const result = await query(
      `DELETE FROM course_prerequisites 
       WHERE course_id = $1 AND prerequisite_id = $2`,
      [courseId, prerequisiteId]
    );
    return result.rowCount > 0;
  }

  /**
   * Get courses by instructor
   * @param {string} instructorId - Instructor ID
   * @returns {Promise<Course[]>} Instructor's courses
   */
  async findByInstructor(instructorId) {
    const result = await query(
      `SELECT 
        c.*,
        COUNT(DISTINCT e.id) as enrolled_count
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE c.instructor_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC`,
      [instructorId]
    );
    
    return result.rows.map(row => new Course(row));
  }
}

module.exports = new CourseRepository();
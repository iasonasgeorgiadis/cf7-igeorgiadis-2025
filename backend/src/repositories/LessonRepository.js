const Lesson = require('../models/Lesson');

// Lesson repository for database operations
class LessonRepository {
  constructor(db) {
    this.db = db;
  }

  // Gets all lessons for a course with optional assignments
  async findByCourseId(courseId, includeAssignments = false) {
    let query = `
      SELECT l.*
      FROM lessons l
      WHERE l.course_id = $1
      ORDER BY l."order" ASC
    `;

    const result = await this.db.query(query, [courseId]);
    const lessons = result.rows.map(row => new Lesson(row));

    if (includeAssignments) {
      // Load assignments for each lesson
      for (const lesson of lessons) {
        const assignmentsQuery = `
          SELECT * FROM assignments 
          WHERE lesson_id = $1 
          ORDER BY due_date ASC
        `;
        const assignmentsResult = await this.db.query(assignmentsQuery, [lesson.id]);
        lesson.assignments = assignmentsResult.rows;
      }
    }

    return lessons;
  }

  // Finds lesson by ID with optional course and assignment info
  async findById(id, options = {}) {
    const { includeCourse = false, includeAssignments = false } = options;

    let query = `
      SELECT l.*
      ${includeCourse ? ', c.title as course_title, c.instructor_id' : ''}
      FROM lessons l
      ${includeCourse ? 'LEFT JOIN courses c ON l.course_id = c.id' : ''}
      WHERE l.id = $1
    `;

    const result = await this.db.query(query, [id]);
    if (result.rows.length === 0) return null;

    const lessonData = result.rows[0];
    
    if (includeCourse && lessonData.course_title) {
      lessonData.course = {
        id: lessonData.course_id,
        title: lessonData.course_title,
        instructor_id: lessonData.instructor_id
      };
      delete lessonData.course_title;
      delete lessonData.instructor_id;
    }

    const lesson = new Lesson(lessonData);

    if (includeAssignments) {
      const assignmentsQuery = `
        SELECT * FROM assignments 
        WHERE lesson_id = $1 
        ORDER BY due_date ASC
      `;
      const assignmentsResult = await this.db.query(assignmentsQuery, [id]);
      lesson.assignments = assignmentsResult.rows;
    }

    return lesson;
  }

  // Creates a new lesson and sets the correct order number
  async create(data) {
    // Get the next order number for the course
    const orderQuery = `
      SELECT COALESCE(MAX("order"), 0) + 1 as next_order
      FROM lessons
      WHERE course_id = $1
    `;
    const orderResult = await this.db.query(orderQuery, [data.course_id]);
    const nextOrder = data.order || orderResult.rows[0].next_order;

    const query = `
      INSERT INTO lessons (course_id, title, content, "order", duration)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.course_id,
      data.title,
      data.content,
      nextOrder,
      data.duration
    ];

    const result = await this.db.query(query, values);
    return new Lesson(result.rows[0]);
  }

  // Updates lesson details like title, content, order
  async update(id, data) {
    const allowedFields = ['title', 'content', 'order', 'duration'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return this.findById(id);
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `"${key}" = $${index + 2}`)
      .join(', ');

    const query = `
      UPDATE lessons
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const values = [id, ...Object.values(updates)];
    const result = await this.db.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Lesson not found');
    }

    return new Lesson(result.rows[0]);
  }

  // Reorders multiple lessons within a course
  async reorderLessons(courseId, lessonOrders) {
    const client = await this.db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verify all lessons belong to the course
      const lessonIds = lessonOrders.map(item => item.lessonId);
      const verifyQuery = `
        SELECT id FROM lessons 
        WHERE course_id = $1 AND id = ANY($2::uuid[])
      `;
      const verifyResult = await client.query(verifyQuery, [courseId, lessonIds]);
      
      if (verifyResult.rows.length !== lessonIds.length) {
        throw new Error('Some lessons do not belong to this course');
      }

      // Update each lesson's order
      for (const item of lessonOrders) {
        const updateQuery = `
          UPDATE lessons 
          SET "order" = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 AND course_id = $3
        `;
        await client.query(updateQuery, [item.order, item.lessonId, courseId]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Deletes lesson and fixes order numbers for remaining lessons
  async delete(id) {
    const client = await this.db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get lesson details
      const lessonQuery = 'SELECT course_id, "order" FROM lessons WHERE id = $1';
      const lessonResult = await client.query(lessonQuery, [id]);
      
      if (lessonResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const { course_id, order } = lessonResult.rows[0];

      // Delete the lesson
      const deleteQuery = 'DELETE FROM lessons WHERE id = $1';
      await client.query(deleteQuery, [id]);

      // Reorder remaining lessons
      const reorderQuery = `
        UPDATE lessons 
        SET "order" = "order" - 1, updated_at = CURRENT_TIMESTAMP
        WHERE course_id = $1 AND "order" > $2
      `;
      await client.query(reorderQuery, [course_id, order]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Calculates total duration of all lessons in a course
  async getTotalDuration(courseId) {
    const query = `
      SELECT COALESCE(SUM(duration), 0) as total_duration
      FROM lessons
      WHERE course_id = $1
    `;
    const result = await this.db.query(query, [courseId]);
    return parseInt(result.rows[0].total_duration);
  }

  // Counts how many lessons are in a course
  async countByCourseId(courseId) {
    const query = 'SELECT COUNT(*) FROM lessons WHERE course_id = $1';
    const result = await this.db.query(query, [courseId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = LessonRepository;
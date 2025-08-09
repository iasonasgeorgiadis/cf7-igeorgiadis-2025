const { query, getClient } = require('../config/database');
const User = require('../models/User');

// User repository for database operations
class UserRepository {
  // Finds user by their ID
  async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Finds user by their email address
  async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Finds user by valid reset token (not expired)
  async findByResetToken(resetToken) {
    const result = await query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [resetToken]
    );
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Creates a new user in the database
  async create(userData) {
    const { email, password_hash, first_name, last_name, role } = userData;
    
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [email, password_hash, first_name, last_name, role]
    );
    
    return new User(result.rows[0]);
  }

  // Updates user with new information
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
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
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  // Deletes user from database
  async delete(id) {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // Gets all users with pagination and optional role filter
  async findAll({ limit = 20, offset = 0, role = null }) {
    let countQuery = 'SELECT COUNT(*) FROM users';
    let selectQuery = 'SELECT * FROM users';
    const params = [];
    
    if (role) {
      countQuery += ' WHERE role = $1';
      selectQuery += ' WHERE role = $1';
      params.push(role);
    }
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    selectQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await query(selectQuery, params);
    const users = result.rows.map(row => new User(row));
    
    return { users, total };
  }

  // Updates user's refresh token for authentication
  async updateRefreshToken(id, refreshToken) {
    await query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [refreshToken, id]
    );
  }

  // Sets password reset token with expiration date
  async setResetToken(id, resetToken, expiresAt) {
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expiresAt, id]
    );
  }

  // Clears password reset token after use
  async clearResetToken(id) {
    await query(
      'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1',
      [id]
    );
  }
}

module.exports = new UserRepository();
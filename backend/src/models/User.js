/**
 * User model representing the users table structure
 */
class User {
  /**
   * Create a new User instance
   * @param {Object} data - User data
   * @param {string} data.id - User UUID
   * @param {string} data.email - User email
   * @param {string} data.password_hash - Hashed password
   * @param {string} data.first_name - First name
   * @param {string} data.last_name - Last name
   * @param {string} data.role - User role (student, instructor)
   * @param {string} data.refresh_token - JWT refresh token
   * @param {string} data.reset_token - Password reset token
   * @param {Date} data.reset_token_expires - Reset token expiration
   * @param {Date} data.created_at - Creation timestamp
   * @param {Date} data.updated_at - Last update timestamp
   */
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.role = data.role;
    this.refresh_token = data.refresh_token;
    this.reset_token = data.reset_token;
    this.reset_token_expires = data.reset_token_expires;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get full name of the user
   * @returns {string} Full name
   */
  getFullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  /**
   * Convert user to JSON, excluding sensitive data
   * @returns {Object} User object without sensitive fields
   */
  toJSON() {
    const { password_hash, refresh_token, reset_token, reset_token_expires, ...publicData } = this;
    return publicData;
  }

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has the role
   */
  hasRole(role) {
    return this.role === role;
  }

  /**
   * Check if user is instructor
   * @returns {boolean} True if user is instructor
   */
  isInstructor() {
    return this.role === 'instructor';
  }

  /**
   * Check if user is student
   * @returns {boolean} True if user is student
   */
  isStudent() {
    return this.role === 'student';
  }
}

module.exports = User;
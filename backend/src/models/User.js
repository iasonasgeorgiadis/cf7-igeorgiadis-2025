// User model representing the users table structure
class User {
  // Creates a new User with all the data from database
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

  // Combines first and last name together
  getFullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  // Converts user to safe JSON format without passwords or tokens
  toJSON() {
    const { password_hash, refresh_token, reset_token, reset_token_expires, ...publicData } = this;
    return publicData;
  }

  // Checks if user has the given role
  hasRole(role) {
    return this.role === role;
  }

  // Returns true if user is an instructor
  isInstructor() {
    return this.role === 'instructor';
  }

  // Returns true if user is a student
  isStudent() {
    return this.role === 'student';
  }
}

module.exports = User;
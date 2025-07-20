const bcrypt = require('bcrypt');
const userRepository = require('../repositories/UserRepository');
const config = require('../config/app');

/**
 * User service for business logic
 */
class UserService {
  /**
   * Get all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<{users: Array, total: number, page: number, totalPages: number}>}
   */
  async getAllUsers(options = {}) {
    const { page = 1, limit = 20, role } = options;
    const offset = (page - 1) * limit;

    const { users, total } = await userRepository.findAll({
      limit: parseInt(limit),
      offset,
      role
    });

    return {
      users: users.map(user => user.toJSON()),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<User>}
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @param {string} currentUserId - Current user ID
   * @param {string} currentUserRole - Current user role
   * @returns {Promise<User>}
   */
  async updateUser(id, updates, currentUserId, currentUserRole) {
    // Check if user exists
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Users can only update their own profile
    if (currentUserId !== id) {
      throw new Error('You can only update your own profile');
    }

    // Prevent role changes
    if (updates.role) {
      delete updates.role;
    }

    // Prevent email changes if email already exists
    if (updates.email && updates.email !== user.email) {
      const existingUser = await userRepository.findByEmail(updates.email);
      if (existingUser) {
        throw new Error('Email already in use');
      }
    }

    // Hash password if provided
    if (updates.password) {
      updates.password_hash = await bcrypt.hash(updates.password, config.bcrypt.saltRounds);
      delete updates.password;
    }

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    const updatedUser = await userRepository.update(id, updates);
    return updatedUser;
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @param {string} currentUserId - Current user ID
   * @returns {Promise<void>}
   */
  async deleteUser(id, currentUserId) {
    // Check if user exists
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent self-deletion
    if (id === currentUserId) {
      throw new Error('You cannot delete your own account');
    }

    const deleted = await userRepository.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    
    await userRepository.update(userId, { password_hash });
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async getUsersByRole(role, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { users, total } = await userRepository.findAll({
      limit: parseInt(limit),
      offset,
      role
    });

    return {
      users: users.map(user => user.toJSON()),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    };
  }
}

module.exports = new UserService();
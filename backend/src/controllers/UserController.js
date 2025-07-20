const userService = require('../services/UserService');

/**
 * User controller handling HTTP requests
 */
class UserController {
  /**
   * Get all users
   * GET /api/users
   */
  async getAllUsers(req, res, next) {
    try {
      const { page, limit, role } = req.query;
      const result = await userService.getAllUsers({ page, limit, role });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);

      res.json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const updatedUser = await userService.updateUser(
        req.params.id,
        req.body,
        req.user.userId,
        req.user.role
      );

      res.json({
        success: true,
        data: {
          user: updatedUser.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      await userService.deleteUser(req.params.id, req.user.userId);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * PUT /api/users/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      await userService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/users/me
   */
  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.userId);

      res.json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   * PUT /api/users/me
   */
  async updateProfile(req, res, next) {
    try {
      // Remove fields that users shouldn't update on their own profile
      const { role, ...updates } = req.body;

      const updatedUser = await userService.updateUser(
        req.user.userId,
        updates,
        req.user.userId,
        req.user.role
      );

      res.json({
        success: true,
        data: {
          user: updatedUser.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
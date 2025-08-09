const authService = require('../services/AuthService');
const config = require('../config/app');

// Authentication controller for user login/register
class AuthController {
  // Register new user
  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const { user, tokens } = await authService.register(req.body);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, config.cookie);

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          accessToken: tokens.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user with email and password
  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const { email, password, rememberMe = false } = req.body;
      const { user, tokens } = await authService.login(email, password, rememberMe);

      // Set refresh token in httpOnly cookie with extended expiration if rememberMe
      const cookieOptions = {
        ...config.cookie,
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : config.cookie.maxAge
      };
      res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          accessToken: tokens.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout user and clear tokens
  // POST /api/auth/logout
  async logout(req, res, next) {
    try {
      await authService.logout(req.user.userId);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Refresh access token using refresh token
  // POST /api/auth/refresh
  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token not provided'
        });
      }

      const tokens = await authService.refreshToken(refreshToken);

      // Set new refresh token in httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, config.cookie);

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Request password reset link
  // POST /api/auth/forgot-password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const resetToken = await authService.forgotPassword(email);

      // In production, send email with reset link
      // For development, return token (remove in production!)
      const message = process.env.NODE_ENV === 'development' && resetToken
        ? `Reset token: ${resetToken}`
        : 'If an account exists with this email, a password reset link has been sent';

      res.json({
        success: true,
        message
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset password with token
  // POST /api/auth/reset-password
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get current logged in user
  // GET /api/auth/me
  async getCurrentUser(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
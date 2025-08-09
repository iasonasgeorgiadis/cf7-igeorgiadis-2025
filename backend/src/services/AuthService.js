const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/UserRepository');
const config = require('../config/app');

// Service for handling authentication logic
class AuthService {
  // Register a new user
  // Returns user and JWT tokens
  async register(userData) {
    const { email, password, first_name, last_name, role } = userData;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, config.bcrypt.saltRounds);

    // Create user
    const user = await userRepository.create({
      email,
      password_hash,
      first_name,
      last_name,
      role
    });

    // Generate tokens
    const tokens = await this.generateTokens(user, false);

    // Save refresh token
    await userRepository.updateRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  // Login user with email and password
  // Returns user and JWT tokens
  async login(email, password, rememberMe = false) {
    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, rememberMe);

    // Save refresh token
    await userRepository.updateRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  // Logout user by clearing refresh token
  async logout(userId) {
    await userRepository.updateRefreshToken(userId, null);
  }

  // Refresh access token using refresh token
  // Returns new access and refresh tokens
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      // Find user
      const user = await userRepository.findById(decoded.userId);
      if (!user || user.refresh_token !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user, false);

      // Save new refresh token
      await userRepository.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Request password reset
  // Generates and returns reset token
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return null;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token
    await userRepository.setResetToken(user.id, hashedToken, expiresAt);

    return resetToken;
  }

  // Reset password using token
  async resetPassword(resetToken, newPassword) {
    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user by reset token
    const user = await userRepository.findByResetToken(hashedToken);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    // Update password and clear reset token
    await userRepository.update(user.id, { password_hash });
    await userRepository.clearResetToken(user.id);
  }

  // Generate JWT tokens for user
  // Returns access and refresh tokens
  async generateTokens(user, rememberMe = false) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: rememberMe ? '30d' : config.jwt.refreshExpiresIn
    });

    return { accessToken, refreshToken };
  }

  // Verify and decode JWT token
  verifyAccessToken(token) {
    return jwt.verify(token, config.jwt.secret);
  }
}

module.exports = new AuthService();
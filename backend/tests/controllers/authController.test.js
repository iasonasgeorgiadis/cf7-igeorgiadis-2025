const request = require('supertest');
const express = require('express');
const authRoutes = require('../../src/routes/auth');

// Mock the auth service
jest.mock('../../src/services/AuthService', () => ({
  register: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn()
}));

// Mock the rate limiting middleware
jest.mock('express-rate-limit', () => {
  return () => (req, res, next) => next();
});

const AuthService = require('../../src/services/AuthService');

describe('Auth Controller', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      const mockResponse = {
        user: {
          id: 'user-123',
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role
        },
        accessToken: 'mock-access-token'
      };

      AuthService.register.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(AuthService.register).toHaveBeenCalledWith(userData);
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // too short
        firstName: '',
        lastName: ''
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle service errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      AuthService.register.mockRejectedValueOnce(new Error('User already exists'));

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!'
      };

      const mockResponse = {
        user: {
          id: 'user-123',
          email: loginData.email,
          firstName: 'Test',
          lastName: 'User',
          role: 'student'
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };

      AuthService.login.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.accessToken).toBe('mock-access-token');
      expect(AuthService.login).toHaveBeenCalledWith(loginData.email, loginData.password);
    });

    it('should return validation errors for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      AuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'));

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      const mockResponse = {
        accessToken: 'new-access-token'
      };

      AuthService.refreshToken.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe('new-access-token');
      expect(AuthService.refreshToken).toHaveBeenCalledWith(refreshData.refreshToken);
    });

    it('should handle invalid refresh token', async () => {
      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      AuthService.refreshToken.mockRejectedValueOnce(new Error('Invalid refresh token'));

      const response = await request(app)
        .post('/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid refresh token');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      AuthService.logout.mockResolvedValueOnce();

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});
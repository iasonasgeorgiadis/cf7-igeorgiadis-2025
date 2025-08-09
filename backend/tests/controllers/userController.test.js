const request = require('supertest');
const express = require('express');
const userRoutes = require('../../src/routes/users');

// Mock the user service
jest.mock('../../src/services/UserService', () => {
  return jest.fn().mockImplementation(() => ({
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    changePassword: jest.fn(),
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
  }));
});

// Mock authentication middleware
jest.mock('../../src/middlewares/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'instructor'
    };
    next();
  },
  authorize: (...roles) => (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Access denied' });
    }
  }
}));

const UserService = require('../../src/services/UserService');

describe('User Controller', () => {
  let app;
  let userService;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', userRoutes);
    
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('GET /users/me', () => {
    it('should get user profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      };

      userService.getUserProfile.mockResolvedValueOnce(mockProfile);

      const response = await request(app)
        .get('/users/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(userService.getUserProfile).toHaveBeenCalledWith('user-123');
    });

    it('should handle profile not found', async () => {
      userService.getUserProfile.mockRejectedValueOnce(new Error('User not found'));

      const response = await request(app)
        .get('/users/me')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /users/me', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'User'
      };

      const mockUpdatedProfile = {
        id: 'user-123',
        email: 'test@example.com',
        ...updateData
      };

      userService.updateUserProfile.mockResolvedValueOnce(mockUpdatedProfile);

      const response = await request(app)
        .put('/users/me')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(userService.updateUserProfile).toHaveBeenCalledWith('user-123', updateData);
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = {
        firstName: 'ab', // too short
        lastName: ''
      };

      const response = await request(app)
        .put('/users/me')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /users/change-password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!'
      };

      userService.changePassword.mockResolvedValueOnce(true);

      const response = await request(app)
        .put('/users/change-password')
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
      expect(userService.changePassword).toHaveBeenCalledWith(
        'user-123',
        'OldPass123!',
        'NewPass123!'
      );
    });

    it('should handle incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!'
      };

      userService.changePassword.mockRejectedValueOnce(new Error('Current password is incorrect'));

      const response = await request(app)
        .put('/users/change-password')
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Current password is incorrect');
    });
  });

  describe('GET /users', () => {
    it('should get all users (admin only)', async () => {
      const mockUsers = {
        users: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            firstName: 'User',
            lastName: 'One',
            role: 'student'
          },
          {
            id: 'user-2',
            email: 'user2@example.com',
            firstName: 'User',
            lastName: 'Two',
            role: 'instructor'
          }
        ],
        total: 2,
        page: 1,
        limit: 10
      };

      userService.getAllUsers.mockResolvedValueOnce(mockUsers);

      const response = await request(app)
        .get('/users?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(userService.getAllUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by id (admin only)', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'other@example.com',
        firstName: 'Other',
        lastName: 'User',
        role: 'student'
      };

      userService.getUserById.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .get('/users/user-456')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('user-456');
      expect(userService.getUserById).toHaveBeenCalledWith('user-456');
    });

    it('should return 404 for non-existent user', async () => {
      userService.getUserById.mockRejectedValueOnce(new Error('User not found'));

      const response = await request(app)
        .get('/users/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user by id (admin only)', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'instructor'
      };

      const mockUpdatedUser = {
        id: 'user-456',
        email: 'other@example.com',
        ...updateData
      };

      userService.updateUser.mockResolvedValueOnce(mockUpdatedUser);

      const response = await request(app)
        .put('/users/user-456')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(userService.updateUser).toHaveBeenCalledWith('user-456', updateData);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user by id (admin only)', async () => {
      userService.deleteUser.mockResolvedValueOnce(true);

      const response = await request(app)
        .delete('/users/user-456')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User deleted successfully');
      expect(userService.deleteUser).toHaveBeenCalledWith('user-456');
    });

    it('should return 404 for non-existent user', async () => {
      userService.deleteUser.mockRejectedValueOnce(new Error('User not found'));

      const response = await request(app)
        .delete('/users/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
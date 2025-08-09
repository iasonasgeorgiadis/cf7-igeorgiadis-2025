const UserRepository = require('../../src/repositories/UserRepository');
const { query } = require('../../src/config/database');
const factories = require('../utils/factories');
const User = require('../../src/models/User');

// Mock the database
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

// Mock the User model
jest.mock('../../src/models/User', () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    toJSON: jest.fn().mockReturnValue(data)
  }));
});

describe('UserRepository', () => {
  let userRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = UserRepository;
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = factories.user({ id: 'user-123' });
      query.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1
      });

      const result = await userRepository.findById('user-123');

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['user-123']
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const result = await userRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const mockUser = factories.user({ email: 'test@example.com' });
      query.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1
      });

      const result = await userRepository.findByEmail('test@example.com');

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const result = await userRepository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return new user', async () => {
      const userData = {
        email: 'new@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student'
      };
      const mockUser = factories.user(userData);
      
      query.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1
      });

      const result = await userRepository.create(userData);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          userData.email,
          userData.password_hash,
          userData.first_name,
          userData.last_name,
          userData.role
        ])
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update user and return updated data', async () => {
      const userId = 'user-123';
      const updates = {
        first_name: 'Updated',
        last_name: 'Name'
      };
      const updatedUser = factories.user({ id: userId, ...updates });
      
      query.mockResolvedValue({
        rows: [updatedUser],
        rowCount: 1
      });

      const result = await userRepository.update(userId, updates);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([userId])
      );
      expect(result).toEqual(updatedUser);
    });

    it('should return null if user not found', async () => {
      query.mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const result = await userRepository.update('non-existent', { first_name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete user and return true', async () => {
      query.mockResolvedValue({
        rowCount: 1
      });

      const result = await userRepository.delete('user-123');

      expect(query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = $1',
        ['user-123']
      );
      expect(result).toBe(true);
    });

    it('should return false if user not found', async () => {
      query.mockResolvedValue({
        rowCount: 0
      });

      const result = await userRepository.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all users with pagination', async () => {
      const mockUsers = [
        factories.user({ role: 'student' }),
        factories.user({ role: 'instructor' })
      ];
      
      query.mockResolvedValue({
        rows: mockUsers,
        rowCount: 2
      });

      const result = await userRepository.findAll({ limit: 10, offset: 0 });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users'),
        [10, 0]
      );
      expect(result).toEqual(mockUsers);
    });

    it('should filter by role when provided', async () => {
      const mockUsers = [factories.user({ role: 'student' })];
      
      query.mockResolvedValue({
        rows: mockUsers,
        rowCount: 1
      });

      const result = await userRepository.findAll({ 
        limit: 10, 
        offset: 0, 
        role: 'student' 
      });

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE role = $1'),
        ['student', 10, 0]
      );
      expect(result).toEqual(mockUsers);
    });
  });

  describe('count', () => {
    it('should return total user count', async () => {
      query.mockResolvedValue({
        rows: [{ count: '25' }],
        rowCount: 1
      });

      const result = await userRepository.count();

      expect(query).toHaveBeenCalledWith('SELECT COUNT(*) FROM users');
      expect(result).toBe(25);
    });

    it('should count users by role when provided', async () => {
      query.mockResolvedValue({
        rows: [{ count: '10' }],
        rowCount: 1
      });

      const result = await userRepository.count({ role: 'student' });

      expect(query).toHaveBeenCalledWith(
        'SELECT COUNT(*) FROM users WHERE role = $1',
        ['student']
      );
      expect(result).toBe(10);
    });
  });

  describe('updateRefreshToken', () => {
    it('should update user refresh token', async () => {
      const userId = 'user-123';
      const refreshToken = 'new-refresh-token';
      
      query.mockResolvedValue({
        rowCount: 1
      });

      await userRepository.updateRefreshToken(userId, refreshToken);

      expect(query).toHaveBeenCalledWith(
        'UPDATE users SET refresh_token = $1 WHERE id = $2',
        [refreshToken, userId]
      );
    });
  });

  describe('findByRefreshToken', () => {
    it('should return user when found by refresh token', async () => {
      const mockUser = factories.user({ refresh_token: 'valid-token' });
      query.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1
      });

      const result = await userRepository.findByRefreshToken('valid-token');

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE refresh_token = $1',
        ['valid-token']
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateResetToken', () => {
    it('should update reset token and expiry', async () => {
      const userId = 'user-123';
      const resetToken = 'reset-token';
      const expiresAt = new Date();
      
      query.mockResolvedValue({
        rowCount: 1
      });

      await userRepository.updateResetToken(userId, resetToken, expiresAt);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET reset_token = $1, reset_token_expires = $2'),
        [resetToken, expiresAt, userId]
      );
    });
  });

  describe('findByResetToken', () => {
    it('should return user with valid reset token', async () => {
      const mockUser = factories.user({ 
        reset_token: 'valid-reset-token',
        reset_token_expires: new Date(Date.now() + 3600000) // 1 hour from now
      });
      query.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1
      });

      const result = await userRepository.findByResetToken('valid-reset-token');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE reset_token = $1 AND reset_token_expires > NOW()'),
        ['valid-reset-token']
      );
      expect(result).toEqual(mockUser);
    });
  });
});
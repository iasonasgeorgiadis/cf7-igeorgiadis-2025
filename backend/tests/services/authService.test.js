const authService = require('../../src/services/AuthService');
const userRepository = require('../../src/repositories/UserRepository');
const bcrypt = require('bcrypt');

// Mock dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('bcrypt');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
        role: 'student'
      };

      const hashedPassword = 'hashed_password';
      const newUser = {
        id: '123',
        ...userData,
        password_hash: hashedPassword,
        toJSON: jest.fn().mockReturnValue({ id: '123', email: userData.email })
      };

      userRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      userRepository.create.mockResolvedValue(newUser);
      userRepository.updateRefreshToken.mockResolvedValue();

      const result = await authService.register(userData);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: userData.email,
        password_hash: hashedPassword,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
        role: 'student'
      };

      userRepository.findByEmail.mockResolvedValue({ id: '123' });

      await expect(authService.register(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'TestPass123!';
      const user = {
        id: '123',
        email,
        password_hash: 'hashed_password',
        role: 'student',
        toJSON: jest.fn().mockReturnValue({ id: '123', email })
      };

      userRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      userRepository.updateRefreshToken.mockResolvedValue();

      const result = await authService.login(email, password);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password_hash);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });

    it('should throw error with invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'WrongPass123!';

      userRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(email, password)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });
});
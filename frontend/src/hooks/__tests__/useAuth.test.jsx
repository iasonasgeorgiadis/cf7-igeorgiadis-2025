import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

// Mock auth service
vi.mock('../../services/authService', () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
    isAuthenticated: vi.fn()
  }
}));

const wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with unauthenticated state', async () => {
    authService.isAuthenticated.mockReturnValue(false);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('handles successful login', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      role: 'student'
    };

    authService.login.mockResolvedValueOnce({
      user: mockUser,
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(authService.login).toHaveBeenCalledWith(
      'test@example.com',
      'password123',
      false
    );
  });

  it('handles failed login', async () => {
    authService.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const response = await result.current.login('test@example.com', 'wrongpassword');
      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid credentials');
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it('handles logout', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      role: 'student'
    };

    // Set initial authenticated state
    authService.isAuthenticated.mockReturnValue(true);
    authService.getCurrentUser.mockResolvedValueOnce(mockUser);
    authService.logout.mockResolvedValueOnce();

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial auth check
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(authService.logout).toHaveBeenCalled();
  });

  it('handles successful registration', async () => {
    const mockUser = {
      id: '123',
      email: 'newuser@example.com',
      role: 'student'
    };

    authService.register.mockResolvedValueOnce({
      user: mockUser,
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'student'
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('checks authentication on mount', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      role: 'student'
    };

    authService.isAuthenticated.mockReturnValue(true);
    authService.getCurrentUser.mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('handles getCurrentUser failure gracefully', async () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.getCurrentUser.mockRejectedValueOnce(new Error('Token expired'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });
});
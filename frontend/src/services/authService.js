import api from './api';
import apiSimple from './apiSimple';

/**
 * Authentication service
 */
const authService = {
  /**
   * Register new user
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    const { accessToken, user } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    return { user, accessToken };
  },

  /**
   * Login user
   */
  async login(email, password, rememberMe = false) {
    console.log('AuthService: Login attempt with:', { email, rememberMe });
    console.log('Using API URL:', apiSimple.defaults.baseURL);
    
    try {
      // Use simple API for debugging
      const response = await apiSimple.post('/auth/login', { email, password, rememberMe });
      console.log('AuthService: Response received:', response.data);
      
      const { accessToken, user } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      return { user, accessToken };
    } catch (error) {
      console.error('AuthService: Login error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('rememberMe');
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password
   */
  async resetPassword(token, password) {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }
};

export default authService;
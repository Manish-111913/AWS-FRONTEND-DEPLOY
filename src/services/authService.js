// Auth Service for INVEXIS
import { http } from './apiClient';

class AuthService {
  // User signup
  async signup(userData) {
    try {
  const data = await http.post('/auth/signup', userData);
  if (!data || data.success === false) throw new Error((data && data.error) || 'Signup failed');
  return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // User signin
  async signin(credentials) {
    try {
  const data = await http.post('/auth/signin', credentials);
  if (!data || data.success === false) throw new Error((data && data.error) || 'Signin failed');

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  }

  // Check authentication status
  async checkAuthStatus() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return { authenticated: false };
      }

      const data = await http.get('/auth/status', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      return data;
    } catch (error) {
      console.error('Auth status check error:', error);
      return { authenticated: false };
    }
  }

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get auth token
  getToken() {
    return localStorage.getItem('authToken');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');

      const data = await http.put('/auth/profile', profileData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!data || data.success === false) {
        throw new Error(data?.error || 'Profile update failed');
      }

      // Update stored user data
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');

      const data = await http.put('/auth/change-password', {
        currentPassword,
        newPassword
      }, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!data || data.success === false) {
        throw new Error(data?.error || 'Password change failed');
      }

      return data;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  // Verify current password without altering stored session
  async verifyPassword(password) {
    const user = this.getCurrentUser();
    if (!user?.email) throw new Error('Not signed in');

    const data = await http.post('/auth/signin', { email: user.email, password }).catch(async (e) => {
      // Normalize error to include message
      throw new Error(e?.message || 'Invalid password');
    });
    if (!data || data.success === false) {
      throw new Error((data && data.error) || 'Invalid password');
    }

    // Do not update localStorage/token here; just return success
    return true;
  }
}

export default new AuthService();
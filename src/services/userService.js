import { http } from './apiClient';

class UserService {
  // Get all users for a business
  static async getUsers(businessId = 1) {
    try {
  const data = await http.get(`/users?business_id=${businessId}`);
  if (!data.success) throw new Error(data.error || 'Failed to fetch users');
  return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get specific user
  static async getUserById(id) {
    try {
  const data = await http.get(`/users/${id}`);
  if (!data.success) throw new Error(data.error || 'Failed to fetch user');
  return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Create new user
  static async createUser(userData) {
    try {
  const data = await http.post('/users', userData);
  if (!data.success) throw new Error(data.error || 'Failed to create user');
  return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user's role
  static async updateUserRole(userId, roleId, businessId = 1) {
    try {
      const data = await http.put(`/users/${userId}/role`, { role_id: roleId, business_id: businessId });
      if (!data.success) throw new Error(data.error || 'Failed to update user role');
      return data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }
}

export default UserService;
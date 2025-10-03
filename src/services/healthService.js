import { http } from './apiClient';

class HealthService {
  // Basic health check
  static async getHealth() {
    try {
  return await http.get('/health');
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  // Database status check
  static async getDatabaseStatus() {
    try {
  return await http.get('/health/db-status');
    } catch (error) {
      console.error('Error checking database status:', error);
      throw error;
    }
  }
}

export default HealthService;
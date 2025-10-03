import { http } from './apiClient';

class SettingsService {
  // Business settings
  static async getSettings(businessId = 1, keys = []) {
    const query = keys && keys.length ? `?keys=${encodeURIComponent(keys.join(','))}` : '';
    return http.get(`/settings/${businessId}${query}`);
  }

  static async upsertSettings(businessId = 1, settings = []) {
    return http.put(`/settings/${businessId}`, { settings });
  }

  // Notification preferences
  static async getNotificationPreferences(businessId = 1, userId) {
    return http.get(`/settings/${businessId}/notification-preferences?userId=${userId}`);
  }

  static async updateNotificationPreferences(businessId = 1, userId, preferences) {
    return http.put(`/settings/${businessId}/notification-preferences`, { userId, preferences });
  }

  // Payment methods
  static async listPaymentMethods(businessId = 1) {
    return http.get(`/settings/${businessId}/payment-methods`);
  }

  static async addPaymentMethod(businessId = 1, { method_name, description }) {
    return http.post(`/settings/${businessId}/payment-methods`, { method_name, description });
  }

  static async deletePaymentMethod(id) {
    return http.delete(`/settings/payment-methods/${id}`);
  }
}

export default SettingsService;

import { http } from './apiClient';
import { getTenant } from './tenantContext';

class UsageService {
  // Record production usage
  static async recordUsage(usageData) {
    try {
  return await http.post('/usage/record', usageData);
    } catch (error) {
      console.error('Error recording usage:', error);
      throw error;
    }
  }

  // Get usage records
  static async getUsageRecords(page = 1, limit = 50) {
    try {
      const tenant = getTenant();
      if (!tenant) throw new Error('Missing tenant. Set tenant before fetching usage records');
      const params = new URLSearchParams({ page, limit });
      return await http.get(`/usage/records?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching usage records:', error);
      throw error;
    }
  }

  // Get usage summary by date range
  static async getUsageSummary(startDate = null, endDate = null) {
    try {
      const tenant = getTenant();
      if (!tenant) throw new Error('Missing tenant. Set tenant before fetching usage summary');
      const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const qs = params.toString();
  return await http.get(`/usage/summary${qs ? `?${qs}` : ''}`);
    } catch (error) {
      console.error('Error fetching usage summary:', error);
      throw error;
    }
  }
}

export default UsageService;
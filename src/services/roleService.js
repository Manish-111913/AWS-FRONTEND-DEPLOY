import { http } from './apiClient';

class RoleService {
  static async listRoles(businessId = 1) {
    const data = await http.get(`/roles?business_id=${businessId}`);
    if (!data.success) throw new Error(data.error || 'Failed to fetch roles');
    return data;
  }
}

export default RoleService;

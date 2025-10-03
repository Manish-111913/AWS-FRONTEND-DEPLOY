import { http } from './apiClient';

class InventoryCategoriesService {
  static async list(businessId = 1) {
    return http.get(`/inventory-categories/${businessId}`);
  }
  static async add(businessId = 1, name) {
    return http.post(`/inventory-categories/${businessId}`, { name });
  }
  static async remove(categoryId) {
    return http.delete(`/inventory-categories/${categoryId}`);
  }
}

export default InventoryCategoriesService;

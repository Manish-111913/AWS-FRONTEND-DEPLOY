import { http } from './apiClient';

class MenuService {
  // Get all menu items
  static async getMenuItems() {
    try {
  const data = await http.get('/menu/items');
  if (!data.success) throw new Error(data.error || 'Failed to fetch menu items');
  return data;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }

  // Get menu categories
  static async getMenuCategories() {
    try {
  const data = await http.get('/menu/categories');
  if (!data.success) throw new Error(data.error || 'Failed to fetch menu categories');
  return data;
    } catch (error) {
      console.error('Error fetching menu categories:', error);
      throw error;
    }
  }

  // Test image accessibility
  static async testImage(filename) {
    try {
  const data = await http.get(`/menu/test-image/${filename}`);
  if (!data.success) throw new Error(data.error || 'Failed to test image');
  return data;
    } catch (error) {
      console.error('Error testing image:', error);
      throw error;
    }
  }
}

export default MenuService;
// Enhanced MenuService with better error handling and fallback data
import { http } from './apiClient';

// Fallback menu items if API fails
const fallbackMenuItems = [
  {
    id: 1,
    name: 'Masala Dosa',
    category: 'Breakfast',
    price: 80,
    servings_per_batch: 1,
    is_active: true,
    image_url: '/images/masala-dosa.jpg',
    serving_unit: 'piece'
  },
  {
    id: 2,
    name: 'Idli Sambar',
    category: 'Breakfast', 
    price: 60,
    servings_per_batch: 1,
    is_active: true,
    image_url: '/images/idli-sambar.jpg',
    serving_unit: 'plate'
  },
  {
    id: 3,
    name: 'Chicken Biryani',
    category: 'Main Course',
    price: 180,
    servings_per_batch: 1,
    is_active: true,
    image_url: '/images/chicken-biryani.jpg',
    serving_unit: 'plate'
  },
  {
    id: 4,
    name: 'Paneer Butter Masala',
    category: 'Main Course',
    price: 150,
    servings_per_batch: 1,
    is_active: true,
    image_url: '/images/paneer-masala.jpg',
    serving_unit: 'plate'
  },
  {
    id: 5,
    name: 'Chicken Tandoori',
    category: 'Main Course',
    price: 220,
    servings_per_batch: 1,
    is_active: true,
    image_url: '/images/chicken-tandoori.jpg',
    serving_unit: 'plate'
  },
  {
    id: 6,
    name: 'Veg Fried Rice',
    category: 'Main Course',
    price: 120,
    servings_per_batch: 1,
    is_active: true,
    image_url: '/images/veg-fried-rice.jpg',
    serving_unit: 'plate'
  },
  {
    id: 7,
    name: 'Dal Tadka',
    category: 'Main Course',
    price: 90,
    servings_per_batch: 1,
    is_active: true,
    image_url: '/images/dal-tadka.jpg',
    serving_unit: 'bowl'
  },
  {
    id: 8,
    name: 'Gulab Jamun',
    category: 'Desserts',
    price: 40,
    servings_per_batch: 2,
    is_active: true,
    image_url: '/images/gulab-jamun.jpg',
    serving_unit: 'pieces'
  },
  {
    id: 9,
    name: 'Rasgulla',
    category: 'Desserts',
    price: 35,
    servings_per_batch: 2,
    is_active: true,
    image_url: '/images/rasgulla.jpg',
    serving_unit: 'pieces'
  },
  {
    id: 10,
    name: 'Masala Chai',
    category: 'Beverages',
    price: 20,
    servings_per_batch: 1,
    is_active: true,
    image_url: '/images/masala-chai.jpg',
    serving_unit: 'cup'
  }
];

const fallbackCategories = [
  { id: 1, name: 'Breakfast', is_active: true },
  { id: 2, name: 'Main Course', is_active: true },
  { id: 3, name: 'Desserts', is_active: true },
  { id: 4, name: 'Beverages', is_active: true }
];

class MenuService {
  // Get all menu items with fallback
  static async getMenuItems() {
    try {
      console.log('🔍 Fetching menu items from API...');
      const data = await http.get('/menu/items');
      
      if (data && data.success && data.data && data.data.length > 0) {
        console.log('✅ Menu items loaded from API:', data.data.length, 'items');
        return {
          success: true,
          data: data.data,
          source: 'api'
        };
      } else {
        console.warn('⚠️ API returned empty data, using fallback items');
        return {
          success: true,
          data: fallbackMenuItems,
          source: 'fallback'
        };
      }
    } catch (error) {
      console.error('❌ Error fetching menu items from API:', error.message);
      console.log('🔄 Using fallback menu items');
      return {
        success: true,
        data: fallbackMenuItems,
        source: 'fallback',
        error: error.message
      };
    }
  }

  // Get menu categories with fallback
  static async getMenuCategories() {
    try {
      console.log('🔍 Fetching menu categories from API...');
      const data = await http.get('/menu/categories');
      
      if (data && data.success && data.data && data.data.length > 0) {
        console.log('✅ Menu categories loaded from API:', data.data.length, 'categories');
        return {
          success: true,
          data: data.data,
          source: 'api'
        };
      } else {
        console.warn('⚠️ API returned empty categories, using fallback');
        return {
          success: true,
          data: fallbackCategories,
          source: 'fallback'
        };
      }
    } catch (error) {
      console.error('❌ Error fetching menu categories from API:', error.message);
      console.log('🔄 Using fallback menu categories');
      return {
        success: true,
        data: fallbackCategories,
        source: 'fallback',
        error: error.message
      };
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

  // Get items by category
  static async getItemsByCategory(category) {
    try {
      const itemsResponse = await this.getMenuItems();
      if (itemsResponse.success) {
        const filteredItems = itemsResponse.data.filter(item => 
          category === 'All' || item.category === category
        );
        return {
          success: true,
          data: filteredItems,
          source: itemsResponse.source
        };
      }
      return { success: false, data: [], error: 'Failed to load items' };
    } catch (error) {
      console.error('Error filtering items by category:', error);
      return { success: false, data: [], error: error.message };
    }
  }

  // Search items
  static async searchItems(searchTerm) {
    try {
      const itemsResponse = await this.getMenuItems();
      if (itemsResponse.success) {
        const searchResults = itemsResponse.data.filter(item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return {
          success: true,
          data: searchResults,
          source: itemsResponse.source
        };
      }
      return { success: false, data: [], error: 'Failed to search items' };
    } catch (error) {
      console.error('Error searching items:', error);
      return { success: false, data: [], error: error.message };
    }
  }
}

export default MenuService;
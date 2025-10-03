// Enhanced MenuService with tenant context fix and comprehensive fallback data
import { http } from './apiClient';
import { setTenant, getTenant } from './tenantContext';

// Comprehensive fallback menu items (matching your backend data structure)
const fallbackMenuItems = [
  // Breakfast Items
  { id: 1, name: 'Masala Dosa', category: 'Breakfast', price: 80, servings_per_batch: 1, is_active: true, image_url: '/images/masala-dosa.jpg', serving_unit: 'piece' },
  { id: 2, name: 'Idli Sambar', category: 'Breakfast', price: 60, servings_per_batch: 1, is_active: true, image_url: '/images/idli-sambar.jpg', serving_unit: 'plate' },
  { id: 3, name: 'Poha', category: 'Breakfast', price: 40, servings_per_batch: 1, is_active: true, image_url: '/images/poha.jpg', serving_unit: 'plate' },
  { id: 4, name: 'Upma', category: 'Breakfast', price: 35, servings_per_batch: 1, is_active: true, image_url: '/images/upma.jpg', serving_unit: 'bowl' },
  { id: 5, name: 'Aloo Paratha', category: 'Breakfast', price: 70, servings_per_batch: 1, is_active: true, image_url: '/images/aloo-paratha.jpg', serving_unit: 'piece' },
  { id: 6, name: 'Puri Bhaji', category: 'Breakfast', price: 60, servings_per_batch: 1, is_active: true, image_url: '/images/puri-bhaji.jpg', serving_unit: 'plate' },
  { id: 7, name: 'Medu Vada', category: 'Breakfast', price: 55, servings_per_batch: 1, is_active: true, image_url: '/images/medu-vada.jpg', serving_unit: 'piece' },
  { id: 8, name: 'Pongal', category: 'Breakfast', price: 65, servings_per_batch: 1, is_active: true, image_url: '/images/pongal.jpg', serving_unit: 'bowl' },

  // Lunch Items
  { id: 9, name: 'Chole Bhature', category: 'Lunch', price: 140, servings_per_batch: 1, is_active: true, image_url: '/images/chole-bhature.jpg', serving_unit: 'plate' },
  { id: 10, name: 'Rajma Chawal', category: 'Lunch', price: 130, servings_per_batch: 1, is_active: true, image_url: '/images/rajma-chawal.jpg', serving_unit: 'plate' },
  { id: 11, name: 'Veg Pulao', category: 'Lunch', price: 120, servings_per_batch: 1, is_active: true, image_url: '/images/veg-pulao.jpg', serving_unit: 'plate' },
  { id: 12, name: 'Jeera Rice', category: 'Lunch', price: 90, servings_per_batch: 1, is_active: true, image_url: '/images/jeera-rice.jpg', serving_unit: 'plate' },
  { id: 13, name: 'Butter Naan', category: 'Lunch', price: 50, servings_per_batch: 1, is_active: true, image_url: '/images/butter-naan.jpg', serving_unit: 'piece' },
  { id: 14, name: 'Tandoori Roti', category: 'Lunch', price: 25, servings_per_batch: 1, is_active: true, image_url: '/images/tandoori-roti.jpg', serving_unit: 'piece' },
  { id: 15, name: 'Veg Thali', category: 'Lunch', price: 220, servings_per_batch: 1, is_active: true, image_url: '/images/veg-thali.jpg', serving_unit: 'plate' },
  { id: 16, name: 'Chicken Biryani', category: 'Lunch', price: 250, servings_per_batch: 1, is_active: true, image_url: '/images/chicken-biryani.jpg', serving_unit: 'plate' },
  { id: 17, name: 'Mutton Curry', category: 'Lunch', price: 280, servings_per_batch: 1, is_active: true, image_url: '/images/mutton-curry.jpg', serving_unit: 'bowl' },
  { id: 18, name: 'Paneer Butter Masala', category: 'Lunch', price: 180, servings_per_batch: 1, is_active: true, image_url: '/images/paneer-butter-masala.jpg', serving_unit: 'bowl' },
  { id: 19, name: 'Dal Tadka', category: 'Lunch', price: 80, servings_per_batch: 1, is_active: true, image_url: '/images/dal-tadka.jpg', serving_unit: 'bowl' },
  { id: 20, name: 'Palak Paneer', category: 'Lunch', price: 170, servings_per_batch: 1, is_active: true, image_url: '/images/palak-paneer.jpg', serving_unit: 'bowl' },
  { id: 21, name: 'Chana Masala', category: 'Lunch', price: 110, servings_per_batch: 1, is_active: true, image_url: '/images/chana-masala.jpg', serving_unit: 'bowl' },
  { id: 22, name: 'Kadhai Paneer', category: 'Lunch', price: 190, servings_per_batch: 1, is_active: true, image_url: '/images/kadhai-paneer.jpg', serving_unit: 'bowl' },
  { id: 23, name: 'Egg Curry', category: 'Lunch', price: 130, servings_per_batch: 1, is_active: true, image_url: '/images/egg-curry.jpg', serving_unit: 'bowl' },
  { id: 24, name: 'Fish Curry', category: 'Lunch', price: 220, servings_per_batch: 1, is_active: true, image_url: '/images/fish-curry.jpg', serving_unit: 'bowl' },
  { id: 25, name: 'Veg Fried Rice', category: 'Lunch', price: 120, servings_per_batch: 1, is_active: true, image_url: '/images/veg-fried-rice.jpg', serving_unit: 'plate' },
  { id: 26, name: 'Hakka Noodles', category: 'Lunch', price: 130, servings_per_batch: 1, is_active: true, image_url: '/images/hakka-noodles.jpg', serving_unit: 'plate' },
  { id: 27, name: 'Veg Manchurian', category: 'Lunch', price: 140, servings_per_batch: 1, is_active: true, image_url: '/images/veg-manchurian.jpg', serving_unit: 'bowl' },

  // Snacks
  { id: 28, name: 'Pav Bhaji', category: 'Snacks', price: 90, servings_per_batch: 1, is_active: true, image_url: '/images/pav-bhaji.jpg', serving_unit: 'plate' },
  { id: 29, name: 'Vada Pav', category: 'Snacks', price: 35, servings_per_batch: 1, is_active: true, image_url: '/images/vada-pav.jpg', serving_unit: 'piece' },
  { id: 30, name: 'Dabeli', category: 'Snacks', price: 40, servings_per_batch: 1, is_active: true, image_url: '/images/dabeli.jpg', serving_unit: 'piece' },
  { id: 31, name: 'Bhel Puri', category: 'Snacks', price: 45, servings_per_batch: 1, is_active: true, image_url: '/images/bhel-puri.jpg', serving_unit: 'plate' },
  { id: 32, name: 'Pani Puri', category: 'Snacks', price: 50, servings_per_batch: 1, is_active: true, image_url: '/images/pani-puri.jpg', serving_unit: 'plate' },

  // Desserts & Drinks
  { id: 40, name: 'Gulab Jamun', category: 'Desserts', price: 40, servings_per_batch: 2, is_active: true, image_url: '/images/gulab-jamun.jpg', serving_unit: 'pieces' },
  { id: 41, name: 'Rasgulla', category: 'Desserts', price: 35, servings_per_batch: 2, is_active: true, image_url: '/images/rasgulla.jpg', serving_unit: 'pieces' },
  { id: 42, name: 'Kheer', category: 'Desserts', price: 60, servings_per_batch: 1, is_active: true, image_url: '/images/kheer.jpg', serving_unit: 'bowl' },
  { id: 43, name: 'Kulfi', category: 'Desserts', price: 45, servings_per_batch: 1, is_active: true, image_url: '/images/kulfi.jpg', serving_unit: 'piece' },
  { id: 44, name: 'Masala Chai', category: 'Beverages', price: 20, servings_per_batch: 1, is_active: true, image_url: '/images/masala-chai.jpg', serving_unit: 'cup' },
  { id: 45, name: 'Filter Coffee', category: 'Beverages', price: 25, servings_per_batch: 1, is_active: true, image_url: '/images/filter-coffee.jpg', serving_unit: 'cup' },
  { id: 46, name: 'Fresh Lime Soda', category: 'Beverages', price: 30, servings_per_batch: 1, is_active: true, image_url: '/images/lime-soda.jpg', serving_unit: 'glass' },
  { id: 47, name: 'Lassi', category: 'Beverages', price: 40, servings_per_batch: 1, is_active: true, image_url: '/images/lassi.jpg', serving_unit: 'glass' }
];

const fallbackCategories = [
  { id: 1, name: 'Breakfast', is_active: true },
  { id: 2, name: 'Lunch', is_active: true },
  { id: 3, name: 'Snacks', is_active: true },
  { id: 4, name: 'Desserts', is_active: true },
  { id: 5, name: 'Beverages', is_active: true }
];

class TenantAwareMenuService {
  // Initialize tenant context
  static initializeTenant() {
    const currentTenant = getTenant();
    if (!currentTenant) {
      console.log('🔧 Setting default tenant ID for QR billing');
      setTenant('1'); // Default to business ID 1
    }
    console.log('👤 Tenant context initialized:', getTenant());
  }

  // Get all menu items with tenant context fix
  static async getMenuItems() {
    try {
      // Ensure tenant is set
      this.initializeTenant();
      
      console.log('🔍 Fetching menu items from API with tenant:', getTenant());
      const data = await http.get('/menu/items');
      
      if (data && data.success && data.data && data.data.length > 0) {
        console.log('✅ Menu items loaded from API:', data.data.length, 'items');
        console.log('📊 API Items Preview:', data.data.slice(0, 3).map(item => `${item.name} (${item.category})`));
        console.log('🎯 Data Source: DATABASE (Real Items from Item Mapping)');
        return {
          success: true,
          data: data.data,
          source: 'database',
          count: data.data.length
        };
      } else {
        console.warn('⚠️ API returned empty data, using comprehensive fallback items');
        console.log('🔄 Fallback Items Preview:', fallbackMenuItems.slice(0, 3).map(item => `${item.name} (${item.category})`));
        console.log('🎯 Data Source: FALLBACK (Demo Items)');
        return {
          success: true,
          data: fallbackMenuItems,
          source: 'comprehensive_fallback',
          count: fallbackMenuItems.length,
          reason: 'Empty API response'
        };
      }
    } catch (error) {
      console.error('❌ Error fetching menu items from API:', error.message);
      
      // Check if it's a tenant context error
      if (error.message.includes('tenant context') || error.message.includes('GUC not set')) {
        console.log('🔧 Tenant context error detected, reinitializing...');
        this.initializeTenant();
      }
      
      console.log('🔄 Using comprehensive fallback menu items');
      console.log('🔄 Fallback Items Preview:', fallbackMenuItems.slice(0, 3).map(item => `${item.name} (${item.category})`));
      console.log('🎯 Data Source: FALLBACK (Error Recovery)');
      return {
        success: true,
        data: fallbackMenuItems,
        source: 'comprehensive_fallback',
        count: fallbackMenuItems.length,
        error: error.message
      };
    }
  }

  // Get menu categories with tenant context fix
  static async getMenuCategories() {
    try {
      this.initializeTenant();
      
      console.log('🔍 Fetching menu categories from API');
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
      return {
        success: true,
        data: fallbackCategories,
        source: 'fallback',
        error: error.message
      };
    }
  }

  // Test API connection
  static async testConnection() {
    try {
      this.initializeTenant();
      const response = await http.get('/menu/items');
      return { success: true, connected: true, tenant: getTenant() };
    } catch (error) {
      return { 
        success: false, 
        connected: false, 
        error: error.message, 
        tenant: getTenant() 
      };
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

  // Get detailed statistics
  static getMenuStats() {
    const itemsByCategory = {};
    fallbackMenuItems.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });

    return {
      totalItems: fallbackMenuItems.length,
      categories: fallbackCategories.length,
      itemsByCategory,
      priceRange: {
        min: Math.min(...fallbackMenuItems.map(item => item.price)),
        max: Math.max(...fallbackMenuItems.map(item => item.price)),
        avg: Math.round(fallbackMenuItems.reduce((sum, item) => sum + item.price, 0) / fallbackMenuItems.length)
      }
    };
  }
}

export default TenantAwareMenuService;
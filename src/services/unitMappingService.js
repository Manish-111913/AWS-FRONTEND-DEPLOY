import { http } from './apiClient';
import { getTenant } from './tenantContext';

class UnitMappingService {
  // Get business ID (for now, using a default business ID)
  static getBusinessId(explicit) {
    if (explicit) return explicit;
    const t = getTenant();
    if (!t) throw new Error('Missing tenant (businessId). Set tenant before calling unit mapping operations');
    return t;
  }

  // Get all available units categorized by type
  static async getUnitOptions() {
    try {
  const data = await http.get('/unit-mapping/units');
  if (!data.success) throw new Error(data.error || 'Failed to fetch unit options');
  return data.data;
    } catch (error) {
      console.error('Error fetching unit options:', error);
      throw error;
    }
  }

  // Get kitchen units for a business
  static async getKitchenUnits(businessId) {
    try {
      const bid = this.getBusinessId(businessId);
      const data = await http.get(`/unit-mapping/kitchen-units/${bid}`);
  if (!data.success) throw new Error(data.error || 'Failed to fetch kitchen units');
  return data.data;
    } catch (error) {
      console.error('Error fetching kitchen units:', error);
      throw error;
    }
  }

  // Save kitchen units for a business
  static async saveKitchenUnits(businessId, units) {
    try {
      const bid = this.getBusinessId(businessId);
      return await http.post(`/unit-mapping/kitchen-units/${bid}`, { units });
    } catch (error) {
      console.error('Error saving kitchen units:', error);
      throw error;
    }
  }

  // Get ingredient-scoped kitchen conversions
  static async getIngredientKitchenUnits(businessId) {
    try {
      const bid = this.getBusinessId(businessId);
      const data = await http.get(`/unit-mapping/kitchen-units/${bid}/by-ingredient`);
      if (!data.success) throw new Error(data.error || 'Failed to fetch ingredient kitchen units');
      return data.data;
    } catch (error) {
      console.error('Error fetching ingredient kitchen units:', error);
      throw error;
    }
  }

  // Save ingredient-scoped kitchen conversions
  static async saveIngredientKitchenUnits(businessId, conversions) {
    try {
      const bid = this.getBusinessId(businessId);
      return await http.post(`/unit-mapping/kitchen-units/${bid}`, { conversions });
    } catch (error) {
      console.error('Error saving ingredient kitchen units:', error);
      throw error;
    }
  }

  // Get inventory items for supplier conversions
  static async getInventoryItems(businessId) {
    try {
      const bid = this.getBusinessId(businessId);
      const data = await http.get(`/unit-mapping/inventory-items/${bid}`);
  if (!data.success) throw new Error(data.error || 'Failed to fetch inventory items');
  return data.data;
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  }

  // Get supplier conversions for a business
  static async getSupplierConversions(businessId) {
    try {
      const bid = this.getBusinessId(businessId);
      const data = await http.get(`/unit-mapping/supplier-conversions/${bid}`);
  if (!data.success) throw new Error(data.error || 'Failed to fetch supplier conversions');
  return data.data;
    } catch (error) {
      console.error('Error fetching supplier conversions:', error);
      throw error;
    }
  }

  // Save supplier conversions for a business
  static async saveSupplierConversions(businessId, conversions) {
    try {
      const bid = this.getBusinessId(businessId);
      return await http.post(`/unit-mapping/supplier-conversions/${bid}`, { conversions });
    } catch (error) {
      console.error('Error saving supplier conversions:', error);
      throw error;
    }
  }

  // Complete the unit mapping setup
  static async completeSetup(businessId) {
    try {
      const bid = this.getBusinessId(businessId);
      return await http.post(`/unit-mapping/complete-setup/${bid}`);
    } catch (error) {
      console.error('Error completing setup:', error);
      throw error;
    }
  }

  // Get all business unit conversions
  static async getBusinessConversions(businessId) {
    try {
      const bid = this.getBusinessId(businessId);
      const data = await http.get(`/unit-mapping/conversions/${bid}`);
  if (!data.success) throw new Error(data.error || 'Failed to fetch business conversions');
  return data.data;
    } catch (error) {
      console.error('Error fetching business conversions:', error);
      throw error;
    }
  }
}

export default UnitMappingService;
import { http } from './apiClient';
import notificationsApi from './notificationsApi';
import { getTenant } from './tenantContext';

class InventoryService {
  // Delete inventory batch
  static async deleteInventoryBatch(itemId, batchId) {
    try {
      const data = await http.delete(`/inventory/items/${itemId}/batches/${batchId}`);
      if (!data.success) throw new Error(data.error || 'Failed to delete inventory batch');
      return data;
    } catch (error) {
      console.error('Error deleting inventory batch:', error);
      throw error;
    }
  }

  // Get all batches for an item
  static async getItemBatches(itemId) {
    try {
      const data = await http.get(`/inventory/items/${itemId}/batches`);
      if (!data.success) throw new Error(data.error || 'Failed to fetch item batches');
      return data;
    } catch (error) {
      console.error('Error fetching item batches:', error);
      throw error;
    }
  }

  // Get inventory overview (this is actually under stock-in routes)
  static async getInventoryOverview(businessId) {
    try {
      const bid = businessId || getTenant();
      const qs = bid ? `?business_id=${bid}` : '';
      const data = await http.get(`/stock-in/inventory/overview${qs}`);
      if (!data.success) throw new Error(data.error || 'Failed to fetch inventory overview');
      return data;
    } catch (error) {
      console.error('Error fetching inventory overview:', error);
      throw error;
    }
  }

  // Get inventory items (using unit-mapping endpoint since inventory/items doesn't exist)
  static async getInventoryItems(businessId, limit = 50) {
    try {
      const bid = businessId || getTenant();
      if (!bid) throw new Error('Missing tenant (businessId). Make sure tenant is set before calling getInventoryItems');
      const data = await http.get(`/unit-mapping/inventory-items/${bid}?limit=${limit}`);
      if (!data.success) throw new Error(data.error || 'Failed to fetch inventory items');
      return data;
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      throw error;
    }
  }

  // Search helper (client-side filter after fetching a page)
  static async searchInventoryItems(query, businessId, limit = 200) {
    const data = await this.getInventoryItems(businessId, limit);
    const items = data.data || [];
    if (!query) return items;
    const q = query.trim().toLowerCase();
    return items.filter(i => i.name?.toLowerCase().includes(q));
  }

  // Create inventory item (upsert) with unit validation
  static async createInventoryItem({ name, unit_symbol = 'g', business_id, user_id = 1, source = 'manual' }) {
    if (!business_id) business_id = getTenant();
    if (!business_id) throw new Error('Missing tenant (business_id) when creating inventory item');
    // Validate unit before creating item
    try {
      await notificationsApi.validateUnit(business_id, user_id, unit_symbol, name);
    } catch (error) {
      console.error('Unit validation error:', error);
      // Continue with creation even if validation fails - notification will be created
    }

    const payload = { name, unit_symbol, business_id, source };
    const data = await http.post('/inventory/items', payload);
    if (!data.success) throw new Error(data.error || 'Failed to create inventory item');
    return data.data;
  }
}

export default InventoryService;
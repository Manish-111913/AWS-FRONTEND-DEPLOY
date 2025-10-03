import { http } from './apiClient';
import { getTenant } from './tenantContext';

class StockInService {
  // Get all stock in records
  static async getStockInRecords(page = 1, limit = 50, status = null) {
    try {
  const params = new URLSearchParams({ page, limit, ...(status ? { status } : {}) });
  return await http.get(`/stock-in?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching stock in records:', error);
      throw error;
    }
  }

  // Create new stock in record
  static async createStockIn(stockInData) {
    try {
  return await http.post('/stock-in', stockInData);
    } catch (error) {
      console.error('Error creating stock in record:', error);
      throw error;
    }
  }

  // Create draft stock in record
  static async createDraftStockIn(stockInData) {
    try {
  return await http.post('/stock-in/draft', stockInData);
    } catch (error) {
      console.error('Error creating draft stock in record:', error);
      throw error;
    }
  }

  // Get inventory overview
  static async getInventoryOverview() {
    try {
      // Endpoint still expects business_id query param? If yes add it; else rely solely on header.
      const bid = getTenant();
      const suffix = bid ? `?business_id=${bid}` : '';
      return await http.get(`/stock-in/inventory/overview${suffix}`);
    } catch (error) {
      console.error('Error fetching inventory overview:', error);
      throw error;
    }
  }

  // Get specific stock in record
  static async getStockInById(id) {
    try {
  return await http.get(`/stock-in/${id}`);
    } catch (error) {
      console.error('Error fetching stock in record:', error);
      throw error;
    }
  }

  // Convert draft to completed
  static async completeDraft(id) {
    try {
  return await http.put(`/stock-in/${id}/complete`);
    } catch (error) {
      console.error('Error completing draft:', error);
      throw error;
    }
  }

  // Delete stock in record
  static async deleteStockIn(id) {
    try {
  return await http.delete(`/stock-in/${id}`);
    } catch (error) {
      console.error('Error deleting stock in record:', error);
      throw error;
    }
  }
}

export default StockInService;
import { http } from './apiClient';
import { getTenant } from './tenantContext';
import { emitWastageCreated } from '../events/wastageEvents';

class WastageService {
  // Record wastage
  static async recordWastage(wastageData) {
    try {
  const data = await http.post('/wastage', wastageData);
  if (!data.success) throw new Error(data.error || 'Failed to record wastage');
  // Notify listeners (Dashboard) that a new wastage record was added
  emitWastageCreated({
    stock_out_id: data?.data?.stock_out_id,
    estimated_cost: data?.data?.estimated_cost,
    created_at: Date.now()
  });
  return data;
    } catch (error) {
      console.error('Error recording wastage:', error);
      throw error;
    }
  }

  // Get wastage records
  static async getWastageRecords(businessId, startDate = null, endDate = null, limit = 50) {
    try {
      const bid = businessId || getTenant();
      if (!bid) throw new Error('Missing tenant (businessId) for wastage records');
      const params = new URLSearchParams({ business_id: bid, limit });
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const data = await http.get(`/wastage?${params.toString()}`);
  if (!data.success) throw new Error(data.error || 'Failed to fetch wastage records');
  return data;
    } catch (error) {
      console.error('Error fetching wastage records:', error);
      throw error;
    }
  }

  // Get wastage reasons
  static async getWastageReasons(businessId) {
    try {
      const bid = businessId || getTenant();
      if (!bid) throw new Error('Missing tenant (businessId) for wastage reasons');
      const data = await http.get(`/wastage/reasons?business_id=${bid}`);
  if (!data.success) throw new Error(data.error || 'Failed to fetch wastage reasons');
  return data;
    } catch (error) {
      console.error('Error fetching wastage reasons:', error);
      throw error;
    }
  }

  // Get wastage summary
  static async getWastageSummary(businessId, startDate = null, endDate = null) {
    try {
      const bid = businessId || getTenant();
      if (!bid) throw new Error('Missing tenant (businessId) for wastage summary');
      const params = new URLSearchParams({ business_id: bid });
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const data = await http.get(`/wastage/summary?${params.toString()}`);
  if (!data.success) throw new Error(data.error || 'Failed to fetch wastage summary');
  return data;
    } catch (error) {
      console.error('Error fetching wastage summary:', error);
      throw error;
    }
  }

  // Create a wastage reason
  static async createWastageReason({ reason_label, reason_category = 'General', business_id }) {
    try {
      if (!business_id) business_id = getTenant();
      if (!business_id) throw new Error('Missing tenant (business_id) for creating wastage reason');
      const data = await http.post('/wastage/reasons', { reason_label, reason_category, business_id });
  if (!data.success) throw new Error(data.error || 'Failed to create wastage reason');
  return data;
    } catch (error) {
      console.error('Error creating wastage reason:', error);
      throw error;
    }
  }

  // Delete (soft delete) a wastage reason
  static async deleteWastageReason(reasonId) {
    try {
  const data = await http.delete(`/wastage/reasons/${reasonId}`);
  if (!data.success) throw new Error(data.error || 'Failed to delete wastage reason');
  return data;
    } catch (error) {
      console.error('Error deleting wastage reason:', error);
      throw error;
    }
  }
}

/**
 * Upload photos for a waste record
 * @param {Array} photos - Array of photo objects with file property
 * @param {number} stockOutId - ID of the stock out record to associate photos with
 * @returns {Promise} - Promise resolving to the upload result
 */
export const uploadWastagePhotos = async (photos, stockOutId) => {
  try {
    if (!photos || photos.length === 0) {
      return { success: true, message: 'No photos to upload', data: [] };
    }

    const formData = new FormData();
    
    // Add each photo to the form data
    photos.forEach((photo, index) => {
      formData.append('photos', photo.file, photo.file.name);
    });

    // Add stock_out_id if provided
    if (stockOutId) {
      formData.append('stock_out_id', stockOutId);
    }

  const data = await http.postForm('/wastage/photos/upload', formData);
  return data;
  } catch (error) {
    console.error('Error uploading wastage photos:', error);
    throw error;
  }
};

/**
 * Get photos for a specific waste record
 * @param {number} stockOutId - ID of the stock out record
 * @returns {Promise} - Promise resolving to the photos data
 */
export const getWastagePhotos = async (stockOutId) => {
  try {
  const data = await http.get(`/wastage/photos/${stockOutId}`);
  return data;
  } catch (error) {
    console.error(`Error getting photos for waste record ${stockOutId}:`, error);
    throw error;
  }
};

export default WastageService;
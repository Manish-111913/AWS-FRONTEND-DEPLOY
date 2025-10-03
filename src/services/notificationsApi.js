import { http, withParams, categorizeError } from './apiClient';

const BASE = 'notifications';

export const getNotifications = async (businessId, { userId = 1, status = 'unread', limit = 50 } = {}) => {
  try {
    const url = withParams(`${BASE}/${businessId}`, { userId, status, limit });
    return await http.get(url);
  } catch (error) {
    const errorInfo = categorizeError(error);
    
    // If it's a 404, it means notifications API is not implemented
    if (error.status === 404) {
      console.warn('Notifications API endpoint not found - feature not implemented');
      return { success: false, error: 'Notifications API not implemented', data: [] };
    }
    
    // For other errors, log appropriately
    if (errorInfo.type !== 'cancelled' && errorInfo.type !== 'circuit_breaker') {
      console.error('Error fetching notifications:', errorInfo.message);
    }
    
    return { success: false, error: errorInfo.message, data: [] };
  }
};

export const getUnreadCount = async (businessId, userId = 1) => {
  const url = withParams(`${BASE}/${businessId}/unread-count`, { userId });
  return http.get(url);
};

export const markRead = async (userId, ids) => {
  return http.post(`${BASE}/mark-read`, { userId, ids });
};

export const markAllRead = async (userId, businessId) => {
  return http.post(`${BASE}/mark-all-read`, { userId, businessId });
};

export const dismissNotifications = async (userId, ids) => {
  return http.post(`${BASE}/dismiss`, { userId, ids });
};

export const generateFromStockAlerts = async (businessId, userId = 1) => {
  return http.post(`${BASE}/generate/stock-alerts`, { businessId, userId });
};

export const syncFromStockAlerts = async (businessId, userId = 1) => {
  return http.post(`${BASE}/sync/stock-alerts`, { businessId, userId });
};

// Unit Mapping Notification Methods
export const checkUnitMappingSetup = async (businessId, userId = 1) => {
  return http.post(`${BASE}/unit-mapping/check-setup`, { businessId, userId });
};

export const validateUnit = async (businessId, userId = 1, unit, itemName = null) => {
  return http.post(`${BASE}/unit-mapping/validate-unit`, { businessId, userId, unit, itemName });
};

export const notifyUnitMappingSuccess = async (businessId, userId = 1, action, details = null) => {
  return http.post(`${BASE}/unit-mapping/notify-success`, { businessId, userId, action, details });
};

export const auditUnitMapping = async (businessId, userId = 1) => {
  return http.post(`${BASE}/unit-mapping/audit`, { businessId, userId });
};

// Ingredient-based mapping notifications
export const checkIncompleteRecipes = async (businessId, userId = 1, sampleLimit) => {
  const body = { businessId, userId };
  if (sampleLimit !== undefined) body.sampleLimit = sampleLimit;
  return http.post(`${BASE}/ingredient-mapping/check-incomplete-recipes`, body);
};

export const checkUnmappedIngredients = async (businessId, userId = 1) => {
  return http.post(`${BASE}/ingredient-mapping/check-unmapped-ingredients`, { businessId, userId });
};

export const checkZeroCostRecipes = async (businessId, userId = 1) => {
  return http.post(`${BASE}/ingredient-mapping/check-zero-cost-recipes`, { businessId, userId });
};

export const alertRecentRecipeChanges = async (businessId, userId = 1, days = 7) => {
  return http.post(`${BASE}/ingredient-mapping/alert-recent-recipe-changes`, { businessId, userId, days });
};

export const checkRecipeStockDiscrepancy = async (businessId, userId = 1, servings = 1) => {
  return http.post(`${BASE}/ingredient-mapping/check-recipe-stock-discrepancy`, { businessId, userId, servings });
};

// Details (read-only) for ingredient-mapping categories
export const getIncompleteRecipeDetails = async (businessId, limit = 100) => {
  const url = withParams(`${BASE}/ingredient-mapping/details/incomplete-recipes`, { businessId, limit });
  return http.get(url);
};

export const getUnmappedIngredientDetails = async (businessId, limit = 200) => {
  const url = withParams(`${BASE}/ingredient-mapping/details/unmapped-ingredients`, { businessId, limit });
  return http.get(url);
};

export const getZeroCostRecipeDetails = async (businessId, limit = 200) => {
  const url = withParams(`${BASE}/ingredient-mapping/details/zero-cost`, { businessId, limit });
  return http.get(url);
};

export const getRecentRecipeChangeDetails = async (businessId, days = 7, limit = 200) => {
  const url = withParams(`${BASE}/ingredient-mapping/details/recent-changes`, { businessId, days, limit });
  return http.get(url);
};

export const getStockDiscrepancyDetails = async (businessId, servings = 1, limit = 200) => {
  const url = withParams(`${BASE}/ingredient-mapping/details/stock-discrepancy`, { businessId, servings, limit });
  return http.get(url);
};

// Vendor management notifications
export const vendorIncompleteDetails = async (businessId, userId = 1, missingCount, examples = []) => {
  return http.post(`${BASE}/vendors/incomplete-details`, { businessId, userId, missingCount, examples });
};

export const vendorPerformanceAlert = async (businessId, userId = 1, vendorName, metric, currentValue, previousValue) => {
  return http.post(`${BASE}/vendors/performance-alert`, { businessId, userId, vendorName, metric, currentValue, previousValue });
};

export const newVendorDetected = async (businessId, userId = 1, vendorName) => {
  return http.post(`${BASE}/vendors/new-vendor-detected`, { businessId, userId, vendorName });
};

// OCR & Stock-In notifications
export const ocrSuccessReview = async (businessId, userId = 1, { vendorName = null, date = null, imageId = null } = {}) => {
  return http.post(`${BASE}/ocr/success-review`, { businessId, userId, vendorName, date, imageId });
};

export const ocrErrorCorrection = async (businessId, userId = 1, { itemName = null, imageId = null, errorMessage = null } = {}) => {
  return http.post(`${BASE}/ocr/error-correction`, { businessId, userId, itemName, imageId, errorMessage });
};

export const ocrNewVendorDetected = async (businessId, userId = 1, vendorName) => {
  return http.post(`${BASE}/ocr/new-vendor-detected`, { businessId, userId, vendorName });
};

export const ocrUnitNotRecognized = async (businessId, userId = 1, unit, itemName = null) => {
  return http.post(`${BASE}/ocr/unit-not-recognized`, { businessId, userId, unit, itemName });
};

export const ocrDuplicateBillWarning = async (businessId, userId = 1, { vendorName = null, date = null, billNumber = null, amount = null } = {}) => {
  return http.post(`${BASE}/ocr/duplicate-bill-warning`, { businessId, userId, vendorName, date, billNumber, amount });
};

export default {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  dismissNotifications,
  generateFromStockAlerts,
  syncFromStockAlerts,
  // Unit mapping methods
  checkUnitMappingSetup,
  validateUnit,
  notifyUnitMappingSuccess,
  auditUnitMapping
  ,vendorIncompleteDetails
  ,vendorPerformanceAlert
  ,newVendorDetected
  // OCR & Stock-In exports
  ,ocrSuccessReview
  ,ocrErrorCorrection
  ,ocrNewVendorDetected
  ,ocrUnitNotRecognized
  ,ocrDuplicateBillWarning
  // Ingredient-mapping methods
  ,checkIncompleteRecipes
  ,checkUnmappedIngredients
  ,checkZeroCostRecipes
  ,alertRecentRecipeChanges
  ,checkRecipeStockDiscrepancy
  // Details exports
  ,getIncompleteRecipeDetails
  ,getUnmappedIngredientDetails
  ,getZeroCostRecipeDetails
  ,getRecentRecipeChangeDetails
  ,getStockDiscrepancyDetails
};

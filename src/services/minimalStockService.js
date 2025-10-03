import { http } from './apiClient';
import { getTenant } from './tenantContext';

const MinimalStockService = {
  async getCriticalItems(businessId) {
    const bid = businessId || getTenant();
    if (!bid) throw new Error('Missing tenant (businessId) for critical items');
    return await http.get(`/minimal-stock/critical-items/${bid}`);
  },
  async getDashboardAlerts(businessId) {
    const bid = businessId || getTenant();
    if (!bid) throw new Error('Missing tenant (businessId) for dashboard alerts');
    return await http.get(`/minimal-stock/dashboard-alerts/${bid}`);
  },
  async getTrackingStatus(businessId) {
    const bid = businessId || getTenant();
    if (!bid) throw new Error('Missing tenant (businessId) for tracking status');
    return await http.get(`/minimal-stock/tracking-status/${bid}`);
  },
  async calculateReorderPoints(businessId) {
    const bid = businessId || getTenant();
    if (!bid) throw new Error('Missing tenant (businessId) for reorder point calculation');
    return await http.post('/minimal-stock/calculate-reorder-points', { businessId: bid });
  },
  async transitionPhases(businessId) {
    const bid = businessId || getTenant();
    if (!bid) throw new Error('Missing tenant (businessId) for phase transition');
    return await http.post('/minimal-stock/transition-phases', { businessId: bid });
  }
};

export default MinimalStockService;

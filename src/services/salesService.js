import axios from 'axios';
import { getTenant } from './tenantContext';
import { API_BASE_URL } from './apiClient';

// Backend server serves routes under /api; total-sales router is mounted at /api/total-sales
const BASE_API = process.env.REACT_APP_API_URL || API_BASE_URL;
const SALES_BASE = `${BASE_API}/total-sales`;

class SalesService {
  static async createSale(saleData) {
    try {
      const bid = saleData?.business_id || getTenant();
      if (!bid) throw new Error('Missing tenant (business_id) for createSale');
      const response = await axios.post(`${SALES_BASE}/sales/create`, { ...saleData, business_id: bid }, {
        headers: { 'X-Tenant-Id': String(bid) }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async getTotalSalesReport(params) {
    try {
  const bid = params?.business_id || getTenant();
  if (!bid) throw new Error('Missing tenant (business_id) for getTotalSalesReport');
  const response = await axios.get(`${SALES_BASE}/sales/total-report`, { params: { ...params, business_id: bid }, headers: { 'X-Tenant-Id': String(bid) } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default SalesService;

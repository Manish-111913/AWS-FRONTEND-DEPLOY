// Order Management Service for QR Billing System
import { http } from './apiClient';
import { getTenant } from './tenantContext';

class OrderService {
  
  // Create a new order after payment completion
  static async createOrder(orderData) {
    try {
      const businessId = getTenant() || 1;
      
      console.log('🍽️ Creating order with data:', orderData);
      
      const payload = {
        items: orderData.items.map(item => ({
          id: item.id || item.menu_item_id,
          menu_item_id: item.menu_item_id || item.id, // help backend parse correctly
          name: item.name,
          quantity: item.quantity,
          price: item.price || item.unit_price,
          customizations: item.customizations || []
        })),
        customerInfo: orderData.customerInfo || {
          name: 'QR Customer',
          phone: orderData.phone || null
        },
        paymentInfo: {
          method: orderData.paymentMethod || 'online',
          amount: orderData.total || orderData.totalAmount,
          transactionId: orderData.transactionId
        },
        tableNumber: orderData.tableNumber || `QR-${Date.now().toString().slice(-4)}`,
        orderSource: 'QR_BILLING',
        specialRequests: orderData.specialRequests || [],
        businessId: businessId
      };

      console.log('📤 Sending order payload:', payload);

      const response = await http.post('/orders', payload);
      
      if (response.success) {
        console.log('✅ Order created successfully:', response.data);
        return {
          success: true,
          orderId: response.data?.order_id,
          data: response.data,
          message: response.message || 'Order sent to kitchen!'
        };
      } else {
        throw new Error(response.error || 'Failed to create order');
      }
      
    } catch (error) {
      console.error('❌ Error creating order:', error);
      return {
        success: false,
        error: error.message || 'Failed to create order'
      };
    }
  }

  // Get kitchen queue for chef dashboard
  static async getKitchenQueue(businessId = null) {
    try {
      const bid = businessId || getTenant() || 1;
      console.log('👨‍🍳 Fetching kitchen queue for business:', bid);
      
  const response = await http.get('/orders/kitchen-queue');
      
      if (response.success) {
        const rows = Array.isArray(response.orders) ? response.orders : [];
        // Normalize any backend DB statuses to UI-friendly values
        const normalized = rows.map(o => ({
          ...o,
          status: (o.status === 'IN_PROGRESS') ? 'PREPARING' : o.status
        }));
        console.log(`✅ Kitchen queue loaded: ${normalized.length} orders`);
        return {
          success: true,
          orders: normalized,
          count: response.count || normalized.length
        };
      } else {
        throw new Error(response.error || 'Failed to fetch kitchen queue');
      }
      
    } catch (error) {
      console.error('❌ Error fetching kitchen queue:', error);
      return {
        success: false,
        error: error.message,
        orders: []
      };
    }
  }

  // Update order status (for chef dashboard)
  static async updateOrderStatus(orderId, status) {
    try {
      console.log(`📋 Updating order ${orderId} status to ${status}`);
      
  const response = await http.patch(`/orders/${orderId}/status`, { status });
      
      if (response && response.success) {
        const updated = response.data || {};
        console.log(`✅ Order ${updated.order_id || orderId} status updated to ${updated.status || status}`);
        return {
          success: true,
          orderId: updated.order_id || orderId,
          status: updated.status || status
        };
      } else {
        throw new Error(response.error || 'Failed to update order status');
      }
      
    } catch (error) {
      console.error(`❌ Error updating order ${orderId} status:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get order history for customer
  static async getOrderHistory(businessId = null) {
    try {
      const bid = businessId || getTenant() || 1;
      const response = await http.get(`/orders/kitchen-queue/${bid}`);
      
      if (response.success) {
        // Filter to show completed orders for order history
        const completedOrders = (response.orders || []).filter(order => 
          order.status === 'COMPLETED' || order.status === 'READY'
        );
        
        return {
          success: true,
          orders: completedOrders,
          count: completedOrders.length
        };
      } else {
        throw new Error(response.error || 'Failed to fetch order history');
      }
      
    } catch (error) {
      console.error('❌ Error fetching order history:', error);
      return {
        success: false,
        error: error.message,
        orders: []
      };
    }
  }

  // Helper method to calculate order total
  static calculateOrderTotal(items) {
    if (!items || !Array.isArray(items)) return 0;
    
    const subtotal = items.reduce((total, item) => {
      const price = parseFloat(item.price || 0);
      const quantity = parseInt(item.quantity || 1);
      return total + (price * quantity);
    }, 0);

    const tax = subtotal * 0.08; // 8% tax
    const deliveryFee = 3.99; // Fixed delivery fee for QR orders
    
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: (subtotal + tax + deliveryFee).toFixed(2)
    };
  }

  // Format order for display
  static formatOrderForDisplay(order) {
    if (!order) return null;
    
    return {
      ...order,
      formattedTime: this.formatTimeElapsed(order.timeElapsed),
      formattedTotal: `₹${parseFloat(order.total || 0).toFixed(2)}`,
      itemCount: (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0)
    };
  }

  // Format time elapsed for display
  static formatTimeElapsed(minutes) {
    if (!minutes || minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${Math.floor(minutes)} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 1 && remainingMinutes === 0) return '1 hour ago';
    if (remainingMinutes === 0) return `${hours} hours ago`;
    
    return `${hours}h ${remainingMinutes}m ago`;
  }

}

export default OrderService;
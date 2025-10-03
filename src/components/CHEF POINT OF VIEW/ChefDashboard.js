import React, { useState, useEffect } from 'react';
import './ChefDashboard.css';
import { Clock, ChefHat, CheckCircle2, Timer, AlertCircle, TrendingUp } from 'lucide-react';
import { http } from '../../services/apiClient';
import { getTenant } from '../../services/tenantContext';
import { realTimeService, orderStatusNotifier } from '../../services/realTimeService';

const ChefDashboard = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({}); // Track timers for each order
  const [processingOrders, setProcessingOrders] = useState(new Set());

  // Fetch pending orders and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const tenant = getTenant();
      const headers = { 
        'X-Business-Id': tenant?.businessId || '1',
        'x-user-id': '1' // TODO: Get from auth context
      };

      const [ordersResponse, statsResponse] = await Promise.all([
        http.get('/api/orders/chef/pending', { headers }),
        http.get('/api/orders/chef/stats', { headers })
      ]);

      if (ordersResponse.data.success) {
        setPendingOrders(ordersResponse.data.orders || []);
      }

      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching chef data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start preparing an order
  const startPreparing = async (orderId) => {
    if (processingOrders.has(orderId)) return;
    
    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      const tenant = getTenant();
      const headers = { 
        'X-Business-Id': tenant?.businessId || '1',
        'x-user-id': '1' // TODO: Get from auth context
      };

      const response = await http.patch(`/api/orders/${orderId}/start-preparing`, {
        chef_id: 1 // TODO: Get from auth context
      }, { headers });

      if (response.data.success) {
        // Start timer for this order
        setTimers(prev => ({
          ...prev,
          [orderId]: Date.now()
        }));
        
        // Notify status change
        orderStatusNotifier.notifyStatusChange(orderId, 'PLACED', 'IN_PROGRESS', response.data.data);
        
        fetchData(); // Refresh data
      } else {
        throw new Error(response.data.error || 'Failed to start preparation');
      }
    } catch (error) {
      console.error('Error starting preparation:', error);
      alert('Failed to start preparation: ' + error.message);
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Complete an order
  const completeOrder = async (orderId) => {
    if (processingOrders.has(orderId)) return;
    
    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      const tenant = getTenant();
      const headers = { 
        'X-Business-Id': tenant?.businessId || '1',
        'x-user-id': '1' // TODO: Get from auth context
      };

      const response = await http.patch(`/api/orders/${orderId}/complete`, {
        chef_id: 1 // TODO: Get from auth context
      }, { headers });

      if (response.data.success) {
        // Remove timer for this order
        setTimers(prev => {
          const newTimers = { ...prev };
          delete newTimers[orderId];
          return newTimers;
        });
        
        // Notify status change
        orderStatusNotifier.notifyStatusChange(orderId, 'IN_PROGRESS', 'READY', response.data.data);
        
        fetchData(); // Refresh data
      } else {
        throw new Error(response.data.error || 'Failed to complete order');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order: ' + error.message);
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Calculate elapsed time for timers
  const getElapsedTime = (orderId, status) => {
    if (status === 'IN_PROGRESS' && timers[orderId]) {
      const elapsed = Math.floor((Date.now() - timers[orderId]) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return null;
  };

  // Format time ago
  const timeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now - time) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  // Auto-refresh data with real-time service
  useEffect(() => {
    fetchData();
    
    // Subscribe to real-time updates
    const unsubscribe = realTimeService.subscribe('chef-dashboard', fetchData, 15000);
    
    return unsubscribe;
  }, []);

  // Update timers every second for in-progress orders
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => ({ ...prev })); // Force re-render to update timers
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize timers for existing in-progress orders
  useEffect(() => {
    const inProgressOrders = pendingOrders.filter(order => order.status === 'IN_PROGRESS');
    const newTimers = {};
    
    inProgressOrders.forEach(order => {
      if (!timers[order.order_id]) {
        // Estimate start time based on order placement
        const estimatedStartTime = Date.now() - (order.minutes_since_placed * 60000);
        newTimers[order.order_id] = estimatedStartTime;
      }
    });
    
    if (Object.keys(newTimers).length > 0) {
      setTimers(prev => ({ ...prev, ...newTimers }));
    }
  }, [pendingOrders, timers]);

  if (loading) {
    return (
      <div className="chef-dashboard loading">
        <div className="loading-spinner">
          <ChefHat className="spin" size={48} />
          <p>Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chef-dashboard">
      <div className="chef-header">
        <div className="header-title">
          <ChefHat size={32} className="chef-icon" />
          <div>
            <h1>Kitchen Dashboard</h1>
            <p>Manage orders and preparation</p>
          </div>
        </div>
        <div className="refresh-button" onClick={fetchData}>
          <Clock size={20} />
          <span>Refresh</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="chef-stats">
        <div className="stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.pending_orders || 0}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
        
        <div className="stat-card preparing">
          <div className="stat-icon">
            <ChefHat size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.orders_in_progress || 0}</h3>
            <p>Preparing</p>
          </div>
        </div>
        
        <div className="stat-card ready">
          <div className="stat-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.ready_orders || 0}</h3>
            <p>Ready</p>
          </div>
        </div>
        
        <div className="stat-card completed">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats.completed_today || 0}</h3>
            <p>Completed Today</p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="orders-section">
        <div className="section-header">
          <h2>Active Orders</h2>
          <span className="order-count">{pendingOrders.length} orders</span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="no-orders">
            <ChefHat size={64} className="no-orders-icon" />
            <h3>No active orders</h3>
            <p>All orders are completed. Great job!</p>
          </div>
        ) : (
          <div className="orders-grid">
            {pendingOrders.map(order => {
              const isProcessing = processingOrders.has(order.order_id);
              const elapsedTime = getElapsedTime(order.order_id, order.status);
              
              return (
                <div key={order.order_id} className={`order-card ${order.status.toLowerCase()}`}>
                  <div className="order-header">
                    <div className="order-info">
                      <h3>Order #{order.order_id}</h3>
                      <p className="table-number">{order.table_number}</p>
                    </div>
                    <div className="order-time">
                      <Clock size={16} />
                      <span>{timeAgo(order.placed_at)}</span>
                    </div>
                  </div>

                  <div className="order-items">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">{item.item_name}</span>
                        {item.customizations && (
                          <span className="item-customizations">
                            {JSON.parse(item.customizations).join(', ')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-total">
                      <strong>${parseFloat(order.total_amount).toFixed(2)}</strong>
                      {order.customer_prep_time_minutes && (
                        <span className="prep-time">
                          <Timer size={14} />
                          {order.customer_prep_time_minutes} min
                        </span>
                      )}
                    </div>

                    <div className="order-actions">
                      {order.status === 'PLACED' && (
                        <button
                          className="start-preparing-btn"
                          onClick={() => startPreparing(order.order_id)}
                          disabled={isProcessing}
                        >
                          <ChefHat size={16} />
                          {isProcessing ? 'Starting...' : 'Start Preparing'}
                        </button>
                      )}
                      
                      {order.status === 'IN_PROGRESS' && (
                        <>
                          {elapsedTime && (
                            <div className="timer-display">
                              <Timer size={16} className="timer-icon" />
                              <span className="timer-text">{elapsedTime}</span>
                            </div>
                          )}
                          <button
                            className="complete-order-btn"
                            onClick={() => completeOrder(order.order_id)}
                            disabled={isProcessing}
                          >
                            <CheckCircle2 size={16} />
                            {isProcessing ? 'Completing...' : 'Complete Order'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {order.status === 'PLACED' && order.minutes_since_placed > 15 && (
                    <div className="order-alert">
                      <AlertCircle size={16} />
                      <span>Order waiting for {Math.floor(order.minutes_since_placed)} minutes</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefDashboard;

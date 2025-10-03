import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ChefHat, 
  TriangleAlert, 
  // CheckCircle, // Commented out unused import
  Play, 
  Users, 
  Package,
  X,
  RefreshCw
} from 'lucide-react';
import OrderService from '../../services/orderService';
import './ChefPage.css';

const ChefDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load orders from database
  const loadKitchenQueue = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      console.log('👨‍🍳 Loading kitchen queue...');
      const result = await OrderService.getKitchenQueue();
      
      if (result.success) {
        const incoming = Array.isArray(result.orders) ? result.orders : [];
        // Deduplicate by order id in case backend returns duplicates
        const seen = new Set();
        const uniq = incoming.filter(o => {
          if (!o || typeof o.id === 'undefined' || o.id === null) return false;
          if (seen.has(o.id)) return false;
          seen.add(o.id);
          return true;
        });
        setOrders(uniq);
        setError(null);
        console.log(`✅ Loaded ${result.orders.length} orders in kitchen queue`);
      } else {
        setError(result.error || 'Failed to load kitchen queue');
        setOrders([]);
      }
    } catch (err) {
      console.error('❌ Error loading kitchen queue:', err);
      setError('Failed to load kitchen queue');
      setOrders([]);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  // Load orders on component mount
  useEffect(() => {
    loadKitchenQueue();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadKitchenQueue();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log(`📋 Updating order ${orderId} to ${newStatus}`);
      
      const result = await OrderService.updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        
        console.log(`✅ Order ${orderId} updated to ${newStatus}`);
        
        // If order is completed, refresh the queue after a short delay
        if (newStatus === 'COMPLETED') {
          setTimeout(() => {
            loadKitchenQueue();
          }, 2000);
        }
      } else {
        console.error('❌ Failed to update order status:', result.error);
        alert('Failed to update order status: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      alert('Error updating order status: ' + error.message);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    // Normalize potential DB status alias
    const s = status === 'IN_PROGRESS' ? 'PREPARING' : status;
    switch (s) {
      case 'PLACED': return '#ff9800'; // Orange
      case 'PREPARING': return '#2196f3'; // Blue  
      case 'READY': return '#4caf50'; // Green
      case 'COMPLETED': return '#9e9e9e'; // Gray
      default: return '#ff9800';
    }
  };

  // Get next status for button
  const getNextStatus = (currentStatus) => {
    const s = currentStatus === 'IN_PROGRESS' ? 'PREPARING' : currentStatus;
    switch (s) {
      case 'PLACED': return 'PREPARING';
      case 'PREPARING': return 'COMPLETED';
      case 'READY': return 'COMPLETED';
      default: return null;
    }
  };

  // Get action button text
  const getActionButtonText = (status) => {
    const s = status === 'IN_PROGRESS' ? 'PREPARING' : status;
    switch (s) {
      case 'PLACED': return 'Start Cooking';
      case 'PREPARING': return 'Complete Order';
      case 'READY': return 'Complete Order';
      default: return 'Update';
    }
  };
  
  if (loading) {
    return (
      <div className="chef-loading">
        <ChefHat size={48} color="#4CAF50" />
        <h3>Loading Kitchen Queue...</h3>
        <p>Fetching orders from the system</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chef-error">
        <X size={48} color="#ff4444" />
        <h3>Unable to Load Orders</h3>
        <p>{error}</p>
        <button onClick={() => loadKitchenQueue()} className="retry-button">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="chef-container">
      {/* Header */}
      <header className="chef-header">
        <div className="header-content">
          <div className="header-left">
            <ChefHat size={32} color="#4CAF50" />
            <div>
              <h1>Chef's Dashboard</h1>
            </div>
          </div>
          <div className="header-right">
            <div className="active-count-badge">{orders.length} Active</div>
            <button 
              onClick={() => loadKitchenQueue(true)} 
              className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
              disabled={refreshing}
            >
              <RefreshCw size={16} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className="time-display">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* Section Title */}
      <div className="queue-title">Order Queue</div>

      {/* Orders Grid */}
      <main className="orders-grid">
        {orders.length === 0 ? (
          <div className="no-orders">
            <Package size={64} color="#ccc" />
            <h3>No Active Orders</h3>
            <p>All orders are completed! Kitchen is ready for new orders.</p>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onStatusUpdate={updateOrderStatus}
              getStatusColor={getStatusColor}
              getNextStatus={getNextStatus}
              getActionButtonText={getActionButtonText}
            />
          ))
        )}
      </main>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ 
  order, 
  onStatusUpdate, 
  getStatusColor, 
  getNextStatus, 
  getActionButtonText 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) return;

    setIsUpdating(true);
    await onStatusUpdate(order.id, nextStatus);
    setIsUpdating(false);
  };

  const formatTimeElapsed = (placedAt) => {
    // Prefer server-provided elapsed minutes to avoid timezone issues
    let mins = typeof order.minutes_elapsed === 'number'
      ? order.minutes_elapsed
      : (placedAt ? Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000) : 0);
    if (!Number.isFinite(mins) || mins < 0) mins = 0;
    mins = Math.min(mins, 180); // clamp to 3 hours max for display
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${m ? ` ${m}m` : ''}`;
  };

  const getUrgencyClass = (placedAt) => {
    if (!placedAt) return '';
    const elapsed = Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000);
    if (elapsed > 15) return 'urgent';
    if (elapsed > 10) return 'warning';
    return '';
  };

  const timePillClass = () => {
    if (!order.placed_at && typeof order.minutes_elapsed !== 'number') return 'time-pill ok';
    const elapsed = typeof order.minutes_elapsed === 'number'
      ? order.minutes_elapsed
      : Math.floor((Date.now() - new Date(order.placed_at).getTime()) / 60000);
    if (elapsed > 15) return 'time-pill danger';
    if (elapsed > 10) return 'time-pill warning';
    return 'time-pill ok';
  };

  return (
    <div className={`order-card ${getUrgencyClass(order.placed_at)} status-${order.status.toLowerCase()}`}>
      {/* Order Header */}
      <div className="order-header">
        <div className="order-info">
          <h3>#{order.id}</h3>
          <div className="table-info">
            <Users size={16} />
            <span>{order.table_number ? `TABLE-${String(order.table_number).toUpperCase()}` : 'QR Order'}</span>
          </div>
        </div>
        <div className="order-status">
          <div className={timePillClass()}>
            <Clock size={14} />
            <span>{formatTimeElapsed(order.placed_at)}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="order-items">
        <div className="order-list-heading">Order List:</div>
        {(() => {
          const list = Array.isArray(order.items) ? order.items : [];
          // Defensive dedupe by menu_item_id or name
          const deduped = Object.values(list.reduce((acc, it) => {
            const key = it.menu_item_id ?? `${it.menu_item_name}`;
            const prev = acc[key];
            const qty = Number(it.quantity) || 0;
            if (!prev) acc[key] = { ...it, quantity: qty };
            else acc[key] = { ...prev, quantity: (Number(prev.quantity) || 0) + qty };
            return acc;
          }, {}));
          return deduped.map((item, index) => (
            <div key={index} className="order-item">
              <div className="item-main">
                <span className="item-name"><strong>{item.quantity}x</strong> {item.menu_item_name}</span>
              </div>
              {item.customizations && (
                <div className="item-customizations">
                  {item.customizations.split(',').map((custom, idx) => (
                    <span key={idx} className="customization badge">{custom.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          ));
        })()}
      </div>

      {/* Special Requests */}
      {order.special_requests && (
        <div className="special-requests">
          <div className="special-requests-title">Special Requests:</div>
          <div className="special-requests-bar">
            <TriangleAlert size={14} />
            <span>{order.special_requests}</span>
          </div>
        </div>
      )}

      {/* Status Row */}
      <div className="status-row">
        <span className="status-label">Status:</span>
        <span className="status-pill" style={{ backgroundColor: getStatusColor(order.status) }}>{order.status}</span>
      </div>

      {/* Action Buttons */}
      <div className="order-actions">
        {getNextStatus(order.status) && (
          <button
            className="action-button primary"
            onClick={handleStatusUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Updating...
              </>
            ) : (
              <>
                <Play size={16} />
                {getActionButtonText(order.status)}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChefDashboard;
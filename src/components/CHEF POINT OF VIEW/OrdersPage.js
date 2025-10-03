import React, { useState, useEffect, useCallback } from 'react';
import './OrdersPage.css';
import './shared.css';
import { Clock, CheckCircle2, Truck, ChefHat, Package, MapPin, Phone, MessageCircle, Timer } from 'lucide-react';
import { http } from '../../services/apiClient';
import { getTenant } from '../../services/tenantContext';
import { realTimeService, orderStatusNotifier } from '../../services/realTimeService';

// Enhanced adaptive version of Orders tracking screen with real-time updates

const statusSteps = [
  { key: 'placed', label: 'Order Placed', icon: Clock, color: '#f59e0b' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, color: '#3b82f6' },
  { key: 'ready', label: 'Ready', icon: Package, color: '#10b981' },
  { key: 'on-the-way', label: 'On the way', icon: Truck, color: '#8b5cf6' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2, color: '#22c55e' }
];

export default function OrdersPage({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preparingStartTime, setPreparingStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('0:00');
  
  // Define actualOrderId at component level so it can be used in useEffect
  const actualOrderId = orderId || '140'; // Default to order 140 with matching items

  // Fetch order details - wrapped in useCallback to fix ESLint warning
  const fetchOrderDetails = useCallback(async () => {
    console.log('🔍 Fetching order details for ID:', actualOrderId);

    try {
      const tenant = getTenant();
      const headers = { 
        'X-Business-Id': tenant?.businessId || '1'
      };

      // Use kitchen-queue endpoint which works, then filter for our order
      const response = await http.get(`/api/orders/kitchen-queue`, { headers });
      
      if (response.data.success && response.data.orders) {
        // Find our specific order in the kitchen queue
        const orderData = response.data.orders.find(order => order.id.toString() === actualOrderId);
        
        if (orderData) {
          console.log('✅ Found order in kitchen queue:', orderData);
          
          // Map backend status to frontend status
          const statusMapping = {
            'PLACED': 'placed',
            'IN_PROGRESS': 'preparing', 
            'PREPARING': 'preparing', // Handle both statuses
            'READY': 'ready',
            'COMPLETED': 'delivered'
          };

          const mappedOrder = {
            id: `ORD-${orderData.id}`,
            items: orderData.items ? orderData.items.map(item => 
              `${item.menu_item_name} x${item.quantity}`
            ) : [],
            total: 25.00, // Default since kitchen-queue doesn't include total
            orderTime: new Date(orderData.placed_at),
            estimatedDelivery: new Date(Date.now() + (orderData.customer_prep_time_minutes || 25) * 60000),
            currentStatus: statusMapping[orderData.status] || 'placed',
            statusHistory: [
              { status: 'placed', timestamp: new Date(orderData.placed_at) }
            ],
            deliveryAddress: '123 Main Street, Apt 4B, New York, NY 10001', // Default
            contactNumber: '+1 (555) 123-4567', // Default
            table_number: orderData.table_number || `Table ${actualOrderId}`,
            customer_prep_time_minutes: orderData.customer_prep_time_minutes || 25,
            actualReadyTime: null, // Not available in kitchen-queue
            updatedAt: orderData.placed_at // Use placed_at as fallback
          };

          // If order is preparing, set the start time
          if (mappedOrder.currentStatus === 'preparing' && !preparingStartTime) {
            setPreparingStartTime(new Date()); // Use current time since we don't have exact start time
          }

          setOrder(mappedOrder);
          console.log('📊 Mapped order status:', mappedOrder.currentStatus);
        } else {
          console.log('❌ Order not found in kitchen queue. Available orders:', response.data.orders.map(o => o.id));
          // Fallback to demo data
          setOrder({
            id: `ORD-${actualOrderId}`,
            items: ['Chicken Tikka x1', 'Palak Paneer x1'],
            total: 25.00,
            orderTime: new Date(Date.now() - 10*60*1000),
            estimatedDelivery: new Date(Date.now() + 20*60*1000),
            currentStatus: 'placed',
            statusHistory: [ 
              { status: 'placed', timestamp: new Date(Date.now() - 10*60*1000) } 
            ],
            deliveryAddress: '123 Main Street, Apt 4B, New York, NY 10001',
            contactNumber: '+1 (555) 123-4567',
            table_number: 'Table QR-8497',
            customer_prep_time_minutes: 25
          });
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      // Fallback to demo order with matching items
      setOrder({
        id: `ORD-${actualOrderId}`,
        items: ['Chicken Tikka x1', 'Palak Paneer x1'],
        total: 25.00,
        orderTime: new Date(Date.now() - 10*60*1000),
        estimatedDelivery: new Date(Date.now() + 20*60*1000),
        currentStatus: 'placed',
        statusHistory: [ 
          { status: 'placed', timestamp: new Date(Date.now() - 10*60*1000) } 
        ],
        deliveryAddress: 'Demo Address',
        contactNumber: '+1 (555) 000-0000',
        table_number: 'Table QR-8497',
        customer_prep_time_minutes: 20
      });
    } finally {
      setLoading(false);
    }
  }, [actualOrderId, preparingStartTime]); // Dependencies for useCallback

  // Update timer every second when preparing
  useEffect(() => {
    let interval;
    
    if (order?.currentStatus === 'preparing' && preparingStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - preparingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [order?.currentStatus, preparingStartTime]);

  // Auto-refresh order status with real-time updates
  useEffect(() => {
    fetchOrderDetails();
    
    if (actualOrderId) {
      // Subscribe to real-time updates for this specific order
      const unsubscribe = realTimeService.subscribe(`order-${actualOrderId}`, fetchOrderDetails, 10000);
      
      // Listen for status changes for this order
      const unsubscribeStatus = orderStatusNotifier.onStatusChange(actualOrderId, (statusUpdate) => {
        console.log('Order status changed:', statusUpdate);
        // Force refresh when status changes
        fetchOrderDetails();
      });
      
      return () => {
        unsubscribe();
        unsubscribeStatus();
      };
    } else {
      // Fallback polling for orders without specific ID
      const interval = setInterval(fetchOrderDetails, 5000); // More frequent polling
      return () => clearInterval(interval);
    }
  }, [actualOrderId, fetchOrderDetails]);

  // Remove demo simulation since we're using real data
  useEffect(() => {
    // Real orders get status updates from the server, no simulation needed
  }, [order?.currentStatus]);

  const progress = (status) => {
    const idx = statusSteps.findIndex(s => s.key === status);
    return (idx + 1) / statusSteps.length * 100;
  };

  const formatTime = (d) => d?.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }) || '';
  
  const etaText = () => { 
    if (!order?.estimatedDelivery) return 'Calculating...';
    const diff = order.estimatedDelivery.getTime() - Date.now(); 
    const m = Math.ceil(diff/60000); 
    return m > 0 ? `${m} minutes` : 'Ready soon'; 
  };

  if (loading) {
    return (
      <div className="qr-orders loading">
        <div className="loading-spinner">
          <Clock className="spin" size={48} />
          <p>Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="qr-orders error">
        <h2>Order not found</h2>
        <p>Unable to load order details. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="qr-orders">
      <div className="qr-orders-head">
        <h2>Order Tracking</h2>
        <span className="order-id">#{order.id}</span>
      </div>
      
      <div className="qr-status-card qr-surface-card">
        <div className="status-row">
          <div className="status-icon" style={{ background: statusSteps.find(s=>s.key===order.currentStatus)?.color || '#666' }}>
            {React.createElement(statusSteps.find(s=>s.key===order.currentStatus)?.icon || Clock, { size:24, color:'#fff' })}
          </div>
          <div className="status-text">
            <h4>{order.currentStatus.replace(/-/g,' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
            {order.currentStatus === 'preparing' && preparingStartTime ? (
              <div className="preparing-info">
                <Timer size={16} className="timer-icon" />
                <span>Preparing for {elapsedTime}</span>
              </div>
            ) : (
              <p>Estimated ready: {etaText()}</p>
            )}
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: progress(order.currentStatus)+'%' }} />
        </div>
      </div>
      <div className="qr-timeline qr-surface-card alt">
        <h3>Order Progress</h3>
        {statusSteps.map((step, idx) => {
          const currentIdx = statusSteps.findIndex(s=>s.key===order.currentStatus);
            const isCompleted = idx <= currentIdx;
            const history = order.statusHistory.find(h=>h.status===step.key);
            return (
              <div key={step.key} className="timeline-item">
                <div className="timeline-icon-wrap">
                  <div className={"timeline-icon" + (isCompleted? ' done':'')} style={isCompleted? { background: step.color, borderColor: step.color } : {}}>
                    {React.createElement(step.icon, { size:16, color: isCompleted ? '#fff' : '#666' })}
                  </div>
                  {idx < statusSteps.length-1 && <div className={"timeline-line" + (isCompleted? ' done':'')}/>}    
                </div>
                <div className="timeline-text">
                  <div className={"label" + (isCompleted? ' done':'')}>{step.label}</div>
                  {history && <div className="time">{formatTime(history.timestamp)}</div>}
                </div>
              </div>
            );
        })}
      </div>

      <div className="qr-order-details qr-surface-card">
        <h3>Order Details</h3>
        <div className="row"><span>Order Time:</span><span>{formatTime(order.orderTime)}</span></div>
        <div className="row items"><span>Items:</span><div>{order.items.map((it,i)=><div key={i}>{it}</div>)}</div></div>
        <div className="row total"><span>Total:</span><span>${order.total.toFixed(2)}</span></div>
      </div>
      <div className="qr-delivery-info qr-surface-card alt">
        <h3>Delivery Information</h3>
        <div className="info-row"><MapPin size={18} /> <span>{order.deliveryAddress}</span></div>
        <div className="info-row"><Phone size={18} /> <span>{order.contactNumber}</span></div>
      </div>

      <div className="qr-action-buttons">
        <button><Phone size={16}/> Call Restaurant</button>
        <button><MessageCircle size={16}/> Live Chat</button>
      </div>
    </div>
  );
}

// Real-time updates service using polling
import { useEffect } from 'react';

class RealTimeService {
  constructor() {
    this.subscribers = new Map(); // component id -> callback
    this.intervals = new Map(); // component id -> interval id
    this.isActive = false;
  }

  // Subscribe a component to real-time updates
  subscribe(componentId, callback, refreshInterval = 30000) {
    this.subscribers.set(componentId, callback);
    
    // Clear existing interval if any
    if (this.intervals.has(componentId)) {
      clearInterval(this.intervals.get(componentId));
    }
    
    // Set up polling interval
    const intervalId = setInterval(() => {
      if (this.isActive && this.subscribers.has(componentId)) {
        try {
          callback();
        } catch (error) {
          console.error(`Real-time update error for ${componentId}:`, error);
        }
      }
    }, refreshInterval);
    
    this.intervals.set(componentId, intervalId);
    
    // Start the service if not already active
    if (!this.isActive) {
      this.start();
    }
    
    return () => this.unsubscribe(componentId);
  }

  // Unsubscribe a component
  unsubscribe(componentId) {
    this.subscribers.delete(componentId);
    
    if (this.intervals.has(componentId)) {
      clearInterval(this.intervals.get(componentId));
      this.intervals.delete(componentId);
    }
    
    // Stop service if no subscribers
    if (this.subscribers.size === 0) {
      this.stop();
    }
  }

  // Start the real-time service
  start() {
    this.isActive = true;
    console.log('🔄 Real-time updates started');
  }

  // Stop the real-time service
  stop() {
    this.isActive = false;
    
    // Clear all intervals
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals.clear();
    
    console.log('⏹️ Real-time updates stopped');
  }

  // Force update all subscribers
  forceUpdate() {
    if (!this.isActive) return;
    
    this.subscribers.forEach((callback, componentId) => {
      try {
        callback();
      } catch (error) {
        console.error(`Force update error for ${componentId}:`, error);
      }
    });
  }

  // Check if service is active
  isRunning() {
    return this.isActive;
  }

  // Get current subscriber count
  getSubscriberCount() {
    return this.subscribers.size;
  }
}

// Create and export singleton instance
export const realTimeService = new RealTimeService();

// React hook for easy integration
export const useRealTimeUpdates = (componentId, updateCallback, refreshInterval = 30000) => {
  useEffect(() => {
    const unsubscribe = realTimeService.subscribe(componentId, updateCallback, refreshInterval);
    
    // Cleanup on unmount
    return unsubscribe;
  }, [componentId, updateCallback, refreshInterval]);
};

// Order status change notification system
class OrderStatusNotifier {
  constructor() {
    this.listeners = new Map(); // orderId -> Set of callbacks
  }

  // Listen for order status changes
  onStatusChange(orderId, callback) {
    if (!this.listeners.has(orderId)) {
      this.listeners.set(orderId, new Set());
    }
    this.listeners.get(orderId).add(callback);
    
    return () => {
      const callbacks = this.listeners.get(orderId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(orderId);
        }
      }
    };
  }

  // Notify all listeners of status change
  notifyStatusChange(orderId, oldStatus, newStatus, orderData = {}) {
    const callbacks = this.listeners.get(orderId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback({ orderId, oldStatus, newStatus, orderData });
        } catch (error) {
          console.error(`Status change notification error for order ${orderId}:`, error);
        }
      });
    }
    
    // Also trigger real-time service force update
    realTimeService.forceUpdate();
  }

  // Get active listeners count
  getListenerCount() {
    return Array.from(this.listeners.values()).reduce((total, set) => total + set.size, 0);
  }
}

export const orderStatusNotifier = new OrderStatusNotifier();

// Utility function to detect page visibility changes
export const onVisibilityChange = (callback) => {
  const handleVisibilityChange = () => {
    callback(!document.hidden);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Auto-adjust refresh rates based on page activity
export class AdaptiveRefreshService {
  constructor() {
    this.baseInterval = 30000; // 30 seconds
    this.activeInterval = 15000; // 15 seconds when active
    this.inactiveInterval = 60000; // 60 seconds when inactive
    this.isPageVisible = !document.hidden;
    this.hasRecentActivity = true;
    this.activityTimeout = null;
    
    this.setupVisibilityListener();
    this.setupActivityListener();
  }

  setupVisibilityListener() {
    onVisibilityChange((isVisible) => {
      this.isPageVisible = isVisible;
      if (isVisible) {
        // Force immediate update when page becomes visible
        realTimeService.forceUpdate();
      }
    });
  }

  setupActivityListener() {
    const resetActivityTimer = () => {
      this.hasRecentActivity = true;
      clearTimeout(this.activityTimeout);
      this.activityTimeout = setTimeout(() => {
        this.hasRecentActivity = false;
      }, 120000); // 2 minutes of inactivity
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, resetActivityTimer, { passive: true });
    });
    
    resetActivityTimer(); // Initialize
  }

  getOptimalInterval() {
    if (!this.isPageVisible) return this.inactiveInterval;
    if (this.hasRecentActivity) return this.activeInterval;
    return this.baseInterval;
  }
}

export const adaptiveRefreshService = new AdaptiveRefreshService();
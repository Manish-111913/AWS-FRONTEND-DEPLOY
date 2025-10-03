import { useState, useEffect } from 'react';
import * as notificationsApi from './notificationsApi';

// Custom hook to manage notification count
export const useNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      setIsLoading(true);
      
      // Check if API is available first
      const healthCheck = await fetch('http://localhost:5001/api/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }).catch(() => null);
      
      if (!healthCheck || !healthCheck.ok) {
        console.warn('Backend server not available, using fallback notification count');
        setUnreadCount(0);
        return;
      }
      
      const businessId = 1; // TODO: Get from user context
      const userId = 1; // TODO: Get from user context
      
      // Check if notifications endpoint exists by testing it
      const notificationTest = await fetch(`http://localhost:5001/api/notifications/${businessId}?userId=${userId}&status=unread&limit=1`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      }).catch(() => null);
      
      if (!notificationTest || notificationTest.status === 404) {
        console.warn('Notifications API not implemented yet, using fallback count');
        setUnreadCount(0);
        return;
      }
      
      const res = await notificationsApi.getNotifications(businessId, { 
        userId, 
        status: 'unread', 
        limit: 100 
      });
      
      if (res && res.success) {
        const unreadNotifications = (res.data || []).filter(n => !n.is_read);
        setUnreadCount(unreadNotifications.length);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.warn('Failed to fetch unread notification count (server may be offline):', error.message);
      // Don't show error to user, just set count to 0
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (notificationId) => {
    // Optimistically update the count
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const incrementCount = () => {
    setUnreadCount(prev => prev + 1);
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    unreadCount,
    isLoading,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    incrementCount
  };
};

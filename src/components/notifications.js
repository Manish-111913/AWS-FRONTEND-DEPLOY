import React, { useEffect, useMemo, useState, useRef } from 'react';
import Counter from './Counter';
import './Notifications.css';
import { FaArrowLeft, FaTimes, FaCheck } from 'react-icons/fa';
import { FiSettings, FiDollarSign } from 'react-icons/fi';
import { IoWarningOutline, IoInformationCircleOutline } from 'react-icons/io5';
import notificationsApi from '../services/notificationsApi';
import { useNotificationCount } from '../services/useNotificationCount';
import { http } from '../services/apiClient';
import { StandardSearch, StandardScrollStyles, highlightMatch, performSmartSearch, standardTextSizes } from '../styles/standardStyles';

const Notifications = ({ goTo }) => {
  // Basic identity/tenant placeholders (wire real context later)
  const businessId = 1;
  const userId = 1;

  // State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const [detailsOpenId, setDetailsOpenId] = useState(null);
  const [detailsData, setDetailsData] = useState({ status: 'idle', kind: null, rows: [], extra: {} });
  
  // Search handlers
  const clearSearch = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Use notification count hook
  const { markAsRead, markAllAsRead: updateGlobalCount, fetchUnreadCount } = useNotificationCount();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      console.log('Fetching notifications for businessId', businessId);
      
  // Do not auto-create or sync other notifications here to avoid noise.
      
      const res = await notificationsApi.getNotifications(businessId, { userId, status: 'all', limit: 100 });
      console.log('getNotifications response:', res);
      if (res && res.success) {
        const list = (res.data || []).map((n) => ({
          id: n.notification_id,
          type: n.type || 'info',
          title: n.title,
          description: n.description,
          isRead: !!n.is_read,
          created_at: n.created_at,
          // Keep only explicit action text from backend; no default 'View'
          actionText: n.action_text || null,
          related_url: n.related_url,
        }));
        console.log('Mapped notifications list:', list);
        setNotifications(list);
      } else {
        console.warn('No notifications or failed response:', res);
        setNotifications([]);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Just load notifications on mount
    loadNotifications();
    
    // Listen for refresh events from other components
    const handleRefresh = () => {
      console.log('📢 Received refresh notification event');
      loadNotifications();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('refreshNotifications', handleRefresh);
      return () => window.removeEventListener('refreshNotifications', handleRefresh);
    }
  }, []);

  // Remove auto-polling (removed the 15-second interval)

  const filtered = useMemo(() => {
    return searchQuery.trim() 
      ? performSmartSearch(notifications, searchQuery, ['title', 'description'])
      : notifications;
  }, [notifications, searchQuery]);

  const markOneRead = async (id) => {
    try {
      await notificationsApi.markRead(userId, [id]);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      markAsRead(id); // Update global count
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  const removeNotification = async (id) => {
    try {
      await notificationsApi.dismissNotifications(userId, [id]);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchUnreadCount(); // Refresh global count
    } catch (e) {
      console.error('Failed to dismiss notification', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead(userId, businessId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      updateGlobalCount(); // Update global count to 0
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const dismissAll = async () => {
    try {
      const ids = filtered.map((n) => n.id);
      if (ids.length === 0) return;
      await notificationsApi.dismissNotifications(userId, ids);
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    } catch (e) {
      console.error('Failed to dismiss all', e);
    }
  };
  
  const createTestNotification = async () => {
    try {
      const response = await http.post('/notifications/test', { 
        businessId, 
        userId, 
        message: `Test notification created at ${new Date().toLocaleTimeString()}` 
      });
      console.log('Test notification response:', response);
      if (response.success) {
        // Refresh notifications to show the new one
        loadNotifications();
      }
    } catch (e) {
      console.error('Failed to create test notification', e);
    }
  };

  // Map notification title -> details fetcher and label
  const resolveDetailsKind = (title = '') => {
    const t = title.toLowerCase();
    if (t.startsWith('recipe-stock discrepancy') || t.includes('recipe-stock discrepancies')) return 'stock';
    if (t.startsWith('recipe updated') || t.includes('recent recipe changes')) return 'recent';
    if (t.startsWith('zero-cost recipe') || t.includes('zero-cost recipes')) return 'zero';
    if (t.startsWith('unmapped ingredient') || t.includes('unmapped ingredient units')) return 'unmapped';
    if (t.startsWith('incomplete recipe') || t.includes('incomplete recipes')) return 'incomplete';
    return null;
  };

  const parseDishFromTitle = (title = '') => {
    const m = title.split(':');
    if (m.length >= 2) return m.slice(1).join(':').trim();
    return null;
  };

  const loadDetails = async (notif) => {
    const kind = resolveDetailsKind(notif.title);
    if (!kind) return;
    setDetailsOpenId(notif.id);
    setDetailsData({ status: 'loading', kind, rows: [], extra: {} });
    try {
      let res;
      switch (kind) {
        case 'stock':
          res = await notificationsApi.getStockDiscrepancyDetails(businessId, 1, 200);
          break;
        case 'recent':
          res = await notificationsApi.getRecentRecipeChangeDetails(businessId, 7, 200);
          break;
        case 'zero':
          res = await notificationsApi.getZeroCostRecipeDetails(businessId, 200);
          break;
        case 'unmapped':
          res = await notificationsApi.getUnmappedIngredientDetails(businessId, 200);
          break;
        case 'incomplete':
          res = await notificationsApi.getIncompleteRecipeDetails(businessId, 200);
          break;
        default:
          res = null;
      }
      if (res && res.success) {
        let rows = res.data || [];
        const dish = parseDishFromTitle(notif.title);
        if (dish) {
          // Try to narrow to that dish when payload contains dish fields
          rows = rows.filter((r) =>
            (r.dish_name && String(r.dish_name).toLowerCase() === dish.toLowerCase())
          );
        }
        setDetailsData({ status: 'ready', kind, rows, extra: { count: res.count, servings: res.servings } });
      } else {
        setDetailsData({ status: 'error', kind, rows: [], extra: { message: 'No details' } });
      }
    } catch (e) {
      console.error('Failed to load details', e);
      setDetailsData({ status: 'error', kind, rows: [], extra: { message: e.message } });
    }
  };

  const renderDetails = () => {
    if (!detailsOpenId) return null;
    const { status, kind, rows, extra } = detailsData;
    return (
      <div className="notification-details-panel">
        {status === 'loading' && <div style={{ padding: '8px 12px' }}>Loading details…</div>}
        {status === 'error' && <div style={{ padding: '8px 12px', color: '#b00' }}>Failed to load details: {extra?.message}</div>}
        {status === 'ready' && (
          <div style={{ padding: '8px 12px' }}>
            {kind === 'stock' && (
              <ul className="details-list">
                {rows.map((r) => (
                  <li key={`d-${r.dish_id}`}> 
                    <b>{r.dish_name}</b> — short on {r.shortage_count} ingredient(s)
                    {Array.isArray(r.shortages) && r.shortages.length > 0 && (
                      <ul className="sub-list">
                        {r.shortages.slice(0, 5).map((s, idx) => (
                          <li key={`i-${r.dish_id}-${idx}`}>{s.ingredient_name}: need {s.required_qty} {s.unit_label}, have {s.current_stock} {s.unit_label}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {kind === 'recent' && (
              <ul className="details-list">
                {rows.map((r) => (
                  <li key={`rc-${r.menu_item_id}`}>
                    <b>{r.dish_name}</b> — updated {new Date(r.updated_at).toLocaleDateString()}
                    {Array.isArray(r.changed_ingredients) && r.changed_ingredients.length > 0 && (
                      <ul className="sub-list">
                        {r.changed_ingredients.slice(0, 6).map((ci, idx) => (
                          <li key={`rc-${r.menu_item_id}-${idx}`}>
                            {ci.ingredient_name}: {ci.change_type}{ci.quantity ? ` → ${ci.quantity} ${ci.unit_label || ''}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {kind === 'zero' && (
              <ul className="details-list">
                {rows.map((r) => (
                  <li key={`zc-${r.menu_item_id}`}><b>{r.dish_name}</b> — estimated cost: {r.estimated_cost ?? '0'}</li>
                ))}
              </ul>
            )}
            {kind === 'unmapped' && (
              <ul className="details-list">
                {rows.map((r, idx) => (
                  <li key={`um-${r.dish_id}-${r.item_id}-${idx}`}>
                    <b>{r.ingredient_name}</b> in <i>{r.dish_name}</i>: recipe unit {r.recipe_unit_symbol || r.recipe_unit_id} → inventory {r.standard_unit_symbol || r.standard_unit_id}
                  </li>
                ))}
              </ul>
            )}
            {kind === 'incomplete' && (
              <ul className="details-list">
                {rows.map((r) => (
                  <li key={`ic-${r.menu_item_id}`}>
                    <b>{r.dish_name}</b> — {r.no_recipe ? 'no recipe' : `${r.ingredient_count} ingredients`} {r.invalid_count > 0 ? `(invalid: ${r.invalid_count})` : ''}
                  </li>
                ))}
              </ul>
            )}
            <div style={{ fontSize: 12, color: '#777', marginTop: 8 }}>
              Items: {(
                <Counter
                  value={Number(rows.length || 0)}
                  places={(() => { const n = Number(rows.length || 0); if (n >= 100) return [100,10,1]; if (n>=10) return [10,1]; return [1]; })()}
                  fontSize={10}
                  padding={0}
                  gap={0}
                  horizontalPadding={0}
                  borderRadius={0}
                  textColor={'currentColor'}
                  gradientHeight={0}
                  containerStyle={{ display: 'inline-block', verticalAlign: 'baseline' }}
                  counterStyle={{ lineHeight: 1 }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'critical':
        return <IoWarningOutline />;
      case 'warning':
        return <FiDollarSign />;
      case 'info':
      case 'success':
      default:
        return <IoInformationCircleOutline />;
    }
  };

  const getNotificationTag = (notification) => {
    // Check if it's a unit mapping notification by title/description
    const isUnitMapping = notification.title && (
      notification.title.includes('Unit Mapping') ||
      notification.title.includes('Kitchen Units') ||
      notification.title.includes('Supplier Conversions') ||
      notification.title.includes('Unit Conversion') ||
      notification.title.includes('Unmapped Unit')
    );

    if (isUnitMapping) {
      if (notification.type === 'success') return 'Unit Setup';
      if (notification.type === 'warning') return 'Unit Config';
      return 'Unit Mapping';
    }

    // Default behavior for other notifications
    switch (notification.type) {
      case 'success':
        return 'Restocked';
      case 'warning':
        return 'Low Stock';
      case 'critical':
        return 'Critical';
      default:
        return 'Info';
    }
  };

  const handleNotificationClick = (notification) => {
    // Only redirect; do NOT mark as read here. Use the ✓ button to mark read.
    if (notification.related_url && goTo) {
      const url = notification.related_url;
      console.log('🔗 Navigating to URL:', url);
      
      // Map backend URLs to frontend screen names based on App.js routes
      if (url.includes('/settings')) {
        goTo('settings');
      } else if (url.includes('/map2')) {
        goTo('map2');
      } else if (url.includes('/map')) {
        goTo('map');
      } else if (url.includes('/overview')) {
        goTo('overview');
      } else if (url.includes('/abc')) {
        goTo('abc');
      } else if (url.includes('/vendors')) {
        goTo('vendors');
      } else if (url.includes('/todays-sales-report')) {
        goTo('todays-sales-report');
      } else if (url.includes('/wastage-reports')) {
        // No direct wastage-reports screen in App.js, navigate to reports
        goTo('reports');
      } else if (url.includes('/reports/daily')) {
        goTo('reports');
      } else if (url.includes('/stock-in')) {
        goTo('stock-in');
      } else if (url.includes('/dashboard')) {
        goTo('dashboard');
      } else if (url.includes('/inventory')) {
        const focusMatch = url.match(/focus=([^&]+)/);
        const focusItem = focusMatch ? focusMatch[1] : null;
        goTo('overview', { focus: focusItem }); // Use 'overview' as inventory screen
      } else {
        // Try to extract the route and use it directly
        const routeMatch = url.match(/^\/([^?]+)/);
        if (routeMatch) {
          const route = routeMatch[1];
          // Check if this route exists in App.js screens
          const validRoutes = ['dashboard', 'overview', 'abc', 'map', 'map1', 'map2', 'map3', 'itemmap', 
                              'stock-in', 'stock-out', 'usage', 'todays-sales-report', 'ocr', 'vendors', 
                              'minimal-stock', 'create-reorder', 'settings', 'reports', 'sales-report'];
          if (validRoutes.includes(route)) {
            goTo(route);
          } else {
            console.warn('Unknown route:', route, 'defaulting to dashboard');
            goTo('dashboard');
          }
        }
      }
    }
    console.log('Notification clicked (no auto-read):', notification.title, notification.related_url);
  };

  return (
    <div>
      <StandardScrollStyles />
      {/* Main Notifications Page */}
      <div className="notifications-page-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <header className="notifications-header">
          <FaArrowLeft 
            className="header-icon" 
            onClick={() => goTo && goTo('dashboard')} 
            style={{ cursor: 'pointer' }}
            title="Back to Dashboard"
          />
          <h1>Notifications</h1>
          <FiSettings 
            className="header-icon" 
            onClick={() => goTo && goTo('settings')}
            style={{ cursor: 'pointer' }}
            title="Settings"
          />
        </header>

        <section className="search-filter-bar">
          <StandardSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearSearch}
            placeholder="Search notifications..."
            inputRef={searchInputRef}
          />
        </section>

        <main className="notifications-list">
          {loading && <div>Loading...</div>}
          {!loading && filtered.length === 0 && <div>No notifications</div>}
          {!loading &&
            filtered.map((notification) => (
              <>
              <div
                key={notification.id}
                className={`notification-item-card ${notification.type} ${notification.isRead ? 'is-read' : ''}`}
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: notification.isRead ? 'default' : 'pointer' }}
              >
                <div className={`notification-icon-wrapper ${notification.type}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <p className="notification-title" style={standardTextSizes.base}>
                    {highlightMatch(notification.title, searchQuery)}
                  </p>
                  <p className="notification-description" style={{ ...standardTextSizes.sm, marginBottom: '8px' }}>
                    {highlightMatch(notification.description, searchQuery)}
                  </p>
                  <div className="notification-meta">
                    <span
                      className={`notification-tag tag-${notification.type || 'info'}`}
                    >
                      {getNotificationTag(notification)}
                    </span>
                    <span style={{ fontSize: '12px', color: '#888', marginLeft: '10px' }}>
                      {new Date(notification.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {/* Removed inline 'View' action link to avoid duplicate redirection */}
                  {/* Inline details for ingredient mapping alerts */}
                  {resolveDetailsKind(notification.title) && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        className="btn-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (detailsOpenId === notification.id) {
                            setDetailsOpenId(null);
                          } else {
                            loadDetails(notification);
                          }
                        }}
                      >
                        {detailsOpenId === notification.id ? 'Hide details' : 'View details'}
                      </button>
                    </div>
                  )}
                </div>
                {!notification.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markOneRead(notification.id);
                    }}
                    className="notification-dismiss-btn"
                    title="Mark read"
                  >
                  <FaCheck />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="notification-dismiss-btn"
                  title="Dismiss"
                >
                  <FaTimes />
                </button>
              </div>
              {detailsOpenId === notification.id && renderDetails()}
              </>
            ))}
        </main>

        <footer className="notifications-footer">
          <button className="footer-btn btn-mark-all" onClick={markAllAsRead}>
            ✔ Mark All as Read
          </button>
          <button className="footer-btn btn-dismiss-all" onClick={dismissAll}>
            ✕ Dismiss All
          </button>
          <button className="footer-btn btn-refresh" style={{margin:'0 0 4rem 0'}} onClick={loadNotifications}>
            ↻ Refresh All Notifications
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Notifications;

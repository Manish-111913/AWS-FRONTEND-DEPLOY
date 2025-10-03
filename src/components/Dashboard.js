import React, { useState, useEffect, useMemo } from 'react';
import { onWastageCreated } from '../events/wastageEvents';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Home, Bell, Settings, Package, BarChart2, Users, Cpu, QrCode, IndianRupee, Trash2 } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import notificationsApi from '../services/notificationsApi';
import { getTenant } from '../services/tenantContext';
import { http, categorizeError } from '../services/apiClient';
import { useNotificationCount } from '../services/useNotificationCount';
import { ActionCard } from '../styles/standardStyles';
import './Dashboard.css';
import Counter from './Counter';

// --- START: Modal Component defined directly in this file ---
const ScanBillModal = ({ onClose, goTo }) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Scan Bill</h3>
        
        <button className="modal-button" onClick={() => { onClose(); goTo('stock-in-scan'); }}>
          Stock In
        </button>
        
        <button className="modal-button" onClick={() => { onClose(); goTo('todays-sales-report'); }}>
          Total Sales Bill
        </button>
      </div>
    </div>
  );
};
// --- END: Modal Component ---


// Chart data will be fetched from backend

// Local ActionCard wrapper to handle navigation
const LocalActionCard = ({ title, icon, screen, onClick, goTo }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (screen && goTo) {
      goTo(screen);
    }
  };

  return (
    <ActionCard title={title} icon={icon} onClick={handleClick} />
  );
};


// Helper Component for Critical Alerts
const AlertItem = ({ icon, title, description, type, screen, goTo }) => (
    <div className={`alert-item alert-${type}`} onClick={() => screen && goTo && goTo(screen)}>
        <div className="alert-icon">{icon}</div>
        <div className="alert-text">
        <p className="alert-title">{title}</p>
        <p className="alert-description">{description}</p>
        </div>
    </div>
);


// Main Dashboard Component for Mobile View
const DashboardPage = ({ goTo, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [stockAlerts, setStockAlerts] = useState({ summary: { total_alerts: 0, critical_items: 0, low_stock_items: 0 }, data: [] });
  const { unreadCount } = useNotificationCount();
  const [loading, setLoading] = useState(true);
  // New: sales/GP state
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [salesToday, setSalesToday] = useState(0);
  const [grossProfitToday, setGrossProfitToday] = useState(0);
  const [salesTrendPercent, setSalesTrendPercent] = useState(null);
  // New: chart trend state
  const [trendPeriod, setTrendPeriod] = useState('week'); // 'week' | 'month'
  const [trendData, setTrendData] = useState([]);
  const [loadingTrend, setLoadingTrend] = useState(true);
  // Dynamic wastage
  const [wastageToday, setWastageToday] = useState(null);
  const [wastageWeek, setWastageWeek] = useState(null);
  const [loadingWastage, setLoadingWastage] = useState(false);
  const [wastageError, setWastageError] = useState(null);
  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Fetch stock alerts from API and check unit mapping
  useEffect(() => {
    const fetchStockAlerts = async () => {
      try {
        setLoading(true);
        const tenant = getTenant();
        if (!tenant) {
          setStockAlerts({ summary: { total_alerts: 0, critical_items: 0, low_stock_items: 0 }, data: [] });
          return;
        }
  const result = await http.get(`/minimal-stock/dashboard-alerts/${tenant}?_ts=${Date.now()}`);
        if (result?.success) {
          setStockAlerts(result);
        } else {
          console.error('Failed to fetch stock alerts:', result?.error);
        }
      } catch (error) {
        const errorInfo = categorizeError(error);
        
        // Don't log cancelled requests or circuit breaker states
        if (errorInfo.type !== 'cancelled' && errorInfo.type !== 'circuit_breaker') {
          console.error('Error fetching stock alerts:', errorInfo.message);
        }
        
        // Set empty alerts on error to prevent UI issues
        setStockAlerts({ summary: { total_alerts: 0, critical_items: 0, low_stock_items: 0 }, data: [] });
      } finally {
        setLoading(false);
      }
    };

    const checkUnitMappingOnStartup = async () => {
      try {
        const tenant = getTenant();
        if (!tenant) return;
        console.log('Checking unit mapping setup on dashboard startup...');
        await notificationsApi.checkUnitMappingSetup(tenant, 1); // userId placeholder 1
      } catch (error) {
        const errorInfo = categorizeError(error);
        
        // Don't log cancelled requests or circuit breaker states
        if (errorInfo.type !== 'cancelled' && errorInfo.type !== 'circuit_breaker') {
          console.error('Error checking unit mapping setup:', errorInfo.message);
        }
      }
    };

    fetchStockAlerts();
    checkUnitMappingOnStartup();
  }, []);

  // Fetch wastage records (today & last 7 days) from assumed endpoint /api/wastagerecords
  useEffect(() => {
    const fetchWastage = async () => {
      try {
        setLoadingWastage(true);
        setWastageError(null);
        const tenant = getTenant();
        if (!tenant) { setWastageToday(null); setWastageWeek(null); return; }
        const now = new Date();
        const toDate = d => d.toISOString().split('T')[0];
        const dayEnd = d => { const x = new Date(d); x.setHours(23,59,59,999); return x.toISOString(); };
        const todayStr = toDate(now);
        const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6);
        const weekStartStr = toDate(weekStart);
        // Use http wrapper (auto header) with tenant query params if backend expects businessId
        const todayData = await http.get(`/wastage?start_date=${encodeURIComponent(todayStr)}&end_date=${encodeURIComponent(dayEnd(now))}&limit=5000`);
        const weekData = await http.get(`/wastage?start_date=${encodeURIComponent(weekStartStr)}&end_date=${encodeURIComponent(dayEnd(now))}&limit=5000`);
        const sum = payload => Array.isArray(payload?.data) ? payload.data.reduce((t,r)=> t + (Number(r.estimated_cost_impact || 0)),0) : 0;
        setWastageToday(sum(todayData));
        setWastageWeek(sum(weekData));
      } catch(e){
        console.error('Wastage fetch error', e);
        setWastageError(e.message);
      } finally {
        setLoadingWastage(false);
      }
    };
    fetchWastage();
    // subscribe to wastage created events
    const unsubscribe = onWastageCreated(() => {
      fetchWastage();
    });
    return () => { unsubscribe && unsubscribe(); };
  }, []);

  // Fetch today's sales + gross profit (and trend vs yesterday)
  useEffect(() => {
    const fmtLocalDate = (d) => d.toLocaleDateString('en-CA');
    const today = new Date();
    const dateStr = fmtLocalDate(today);
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        const tenant = getTenant();
        if (!tenant) { setSalesToday(0); setGrossProfitToday(0); setSalesTrendPercent(null); return; }
        const summary = await http.get(`/reports/summary?date=${encodeURIComponent(dateStr)}`);
        const comparison = await http.get(`/reports/summary-comparison?date=${encodeURIComponent(dateStr)}`);
        setSalesToday(Number(summary?.total_sales || 0));
        setGrossProfitToday(Number(summary?.gross_profit || 0));
        const pct = Number(comparison?.total_sales?.percent ?? NaN);
        setSalesTrendPercent(isNaN(pct) ? null : pct);
      } catch (e) {
        const errorInfo = categorizeError(e);
        
        // Don't log cancelled requests or circuit breaker states
        if (errorInfo.type !== 'cancelled' && errorInfo.type !== 'circuit_breaker') {
          console.error('Error fetching today summary:', errorInfo.message);
        }
        
        setSalesToday(0); setGrossProfitToday(0); setSalesTrendPercent(null);
      } finally { setLoadingSummary(false); }
    };
    fetchSummary();
  }, []);

  const formatINR = (n) => {
    try {
      return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(n || 0));
    } catch {
      return String(Math.round(Number(n || 0)));
    }
  };

  const toWeekdayShort = (label) => {
    try {
      // Ensure consistent parse by appending time; label is YYYY-MM-DD from backend
      const d = new Date(`${label}T00:00:00`);
      if (isNaN(d.getTime())) return label;
      return d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue, ...
    } catch {
      return label;
    }
  };

  // Normalize trend percent for display and arrow direction
  const normalizedTrend = useMemo(() => {
    if (loadingSummary || salesTrendPercent === null || isNaN(Number(salesTrendPercent))) {
      return { text: '--', dir: 'neutral' };
    }
    const pct = Number(salesTrendPercent);
    // Hide confusing -100% when today's sales are 0; show neutral 0%
    if (salesToday === 0 && pct <= -99.9) {
      return { text: '0%', dir: 'neutral' };
    }
    // Clamp extreme spikes for readability
    const clamped = Math.max(-100, Math.min(999, pct));
    const rounded = Math.round(clamped);
    const dir = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'neutral';
    return { text: `${rounded}%`, dir };
  }, [loadingSummary, salesTrendPercent, salesToday]);

  // Fetch sales trend for chart
  useEffect(() => {
    const fetchTrend = async () => {
      try {
        setLoadingTrend(true);
        const tenant = getTenant();
        if (!tenant) { setTrendData([]); return; }
        const json = await http.get(`/reports/trend?period=${encodeURIComponent(trendPeriod)}`);
        if (Array.isArray(json)) {
          const mapped = json.map(r => ({
            name: trendPeriod === 'week' ? toWeekdayShort(r.label) : (trendPeriod === 'month' ? `Week ${r.label}` : r.label),
            sales: Number(r.total_sales || 0)
          }));
          setTrendData(mapped);
        } else { setTrendData([]); }
      } catch (e) {
        const errorInfo = categorizeError(e);
        
        // Handle different types of errors gracefully
        switch (errorInfo.type) {
          case 'cancelled':
            console.log('Sales trend request was cancelled');
            return;
          
          case 'circuit_breaker':
            console.log('Circuit breaker is open - sales trend loading paused');
            return;
          
          case 'connection':
          case 'network':
            console.log(`Sales trend: ${errorInfo.message}`);
            break;
          
          default:
            console.error('Error fetching sales trend:', errorInfo.message);
        }
        
        // Keep existing data or show empty chart
        setTrendData([]);
      } finally { setLoadingTrend(false); }
    };
    fetchTrend();
  }, [trendPeriod]);

  // Get user's first name or fallback to email or default
  const getUserDisplayName = () => {
    if (!currentUser) return 'User';
    
    console.log('Current user data:', currentUser); // Debug log
    
    if (currentUser.fullName) {
      // Extract first name from full name
      return currentUser.fullName.split(' ')[0];
    }
    
    if (currentUser.name) {
      return currentUser.name.split(' ')[0];
    }
    
    if (currentUser.email) {
      // Extract name from email (before @)
      return currentUser.email.split('@')[0];
    }
    
    return 'User';
  };

  return (
    <div className="dashboard-container">
      {isModalOpen && <ScanBillModal onClose={closeModal} goTo={goTo} />}

      <header className="dashboard-header">
        <h1 className="header-title">INVEXIS</h1>
        
        {/* FIX: The Bell and Settings icons are now grouped together here */}
        <div className="header-icons">
          <div className="header-bell-icon" onClick={() => goTo('notifications')}>
            <Bell />
            {unreadCount > 0 && (
              <span className="bell-notification-badge" title={`${unreadCount} unread`}>
                {unreadCount > 99 ? (
                  '99+'
                ) : (
                  <Counter
                    value={unreadCount}
                    places={unreadCount >= 10 ? [10, 1] : [1]}
                    fontSize={10}
                    padding={0}
                    gap={0}
                    horizontalPadding={0}
                    borderRadius={0}
                    textColor={'white'}
                    gradientHeight={0}
                    containerStyle={{ display: 'inline-block' }}
                    counterStyle={{ lineHeight: 1 }}
                  />
                )}
              </span>
            )}
          </div>
          <Settings className="settings-icon" onClick={() => goTo('settings')} />
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-header">
            <h2 className="welcome-title">Welcome back, {getUserDisplayName()}!</h2>
            {/* The Settings icon has been moved from this location */}
        </div>

        <div className="content-grid">
          <div className="grid-row">
            <div className="card-link" onClick={() => goTo('sales-report')}>
              <div className="card sales-card">
                  <div className="card-subheader">
                    <p className="card-subtitle">Today's Sales</p>
                    <div className="sales-trend">
                      {normalizedTrend.dir === 'up' && (
                        <FontAwesomeIcon icon={faArrowUp} className="trend-up-icon" style={{ color: '#22c55e' }} />
                      )}
                      {normalizedTrend.dir === 'down' && (
                        <FontAwesomeIcon icon={faArrowDown} className="trend-down-icon" style={{ color: '#ef4444' }} />
                      )}
                      <span style={{ color: normalizedTrend.dir === 'down' ? '#ef4444' : undefined }}>
                        {normalizedTrend.text}
                      </span>
                    </div>
                  </div>
                  <p className="card-main-value">₹{loadingSummary ? '--' : formatINR(salesToday)}</p>
              </div>
            </div>
            <div className="card-link" onClick={() => goTo('inventory')}>
              <div className="card">
                  <p className="card-subtitle">Low Stock Alerts</p>
                  {loading ? (
                    <p className="card-main-value orange-text large-text">Loading...</p>
                  ) : (
                    <p className="card-main-value orange-text large-text">
                      {Array.isArray(stockAlerts.data) ? stockAlerts.data.length : (stockAlerts.summary?.total_alerts || 0)} items
                    </p>
                  )}
              </div>
            </div>
          </div>

          <div className="grid-row">
            <LocalActionCard title="Scan Bill" icon={<QrCode className="icon-blue" />} onClick={openModal} />
            <LocalActionCard title="Today's Sales" icon={<BarChart2 className="icon-green" />} screen="sales-report" goTo={goTo} />
            <ActionCard title="Manage Inventory" icon={<Users className="icon-purple" />} screen="inventory" goTo={goTo} />
            <ActionCard title="Ingredient Processing" icon={<Cpu className="icon-teal" />} screen="map" goTo={goTo} />
            {/* New: Billing card that opens the QR Billing Onboarding flow */}
            <LocalActionCard title="Billing" icon={<IndianRupee className="icon-blue" />} screen="qr-onboarding" goTo={goTo} />
            {/* Use LocalActionCard to ensure goTo invocation path is consistent and add debug logging */}
            <LocalActionCard title="QR Billing" icon={<QrCode className="icon-blue" />} screen="qr-billing" goTo={(scr)=>{ console.log('Navigating to', scr); goTo(scr); }} />
            <LocalActionCard title="Owner POV" icon={<Home className="icon-green" />} screen="owner-dashboard" goTo={goTo} />
          </div>

          <div className="card-link" onClick={() => goTo('reports')}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title-strong">Sales Overview</h3>
                <select
                  className="chart-dropdown"
                  value={trendPeriod}
                  onChange={(e) => setTrendPeriod(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="week">Last 7 days</option>
                  <option value="month">This month</option>
                </select>
              </div>
              <div className="chart-container">
                <ResponsiveContainer>
                  <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip wrapperStyle={{ fontSize: '12px', padding: '3px' }} formatter={(v) => [`₹ ${formatINR(v)}`, 'Sales']} />
                    <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} isAnimationActive={!loadingTrend} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid-row">
            <div className="card-link" onClick={() => goTo('stock-out-wastage')}>
              <div className="card dashboard-wastage-card">
                <div className="card-header">
                  <h3 className="card-title-strong small">Wastage Cost</h3>
                  <Trash2 className="icon-muted"/>
                </div>
                <div className="wastage-details">
                  <div onClick={(e)=>{e.stopPropagation(); goTo('stock-out-wastage');}} style={{cursor:'pointer'}}>
                    <p className="wastage-value-today text-blue">₹ {loadingWastage? '--' : (wastageToday==null? '--': new Intl.NumberFormat('en-IN').format(Math.round(wastageToday)))}</p>
                    <p className="wastage-label text-blue">(Today {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short'})})</p>
                  </div>
                  <div onClick={(e)=>{e.stopPropagation(); goTo('stock-out-wastage');}} style={{cursor:'pointer'}}>
                    <p className="wastage-value-week text-yellow">₹ {loadingWastage? '--' : (wastageWeek==null? '--': new Intl.NumberFormat('en-IN').format(Math.round(wastageWeek)))}</p>
                    <p className="wastage-label text-yellow">(Last 7 Days)</p>
                  </div>
                </div>
                {wastageError && <div style={{padding:'4px 8px', color:'#dc2626', fontSize:'12px'}}>Wastage data error</div>}
              </div>
            </div>
            <div className="card-link" onClick={() => goTo('reports')}>
              <div className="card dashboard-profit-card">
                <h3 className="card-title-strong small">Gross Profit</h3>
                <div className="gross-profit-main">
                    <p className="text-green large-text">₹ {loadingSummary ? '--' : formatINR(grossProfitToday)}</p>
                    <p className="card-subtitle">(Today)</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title-strong">Critical Alerts</h3>
              <span className="link" onClick={() => setShowAllAlerts(!showAllAlerts)}>
                {showAllAlerts ? 'Show Less' : 'View All'}
              </span>
            </div>
            <div className={`alerts-container ${showAllAlerts ? 'expanded' : ''}`}>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading alerts...</div>
              ) : (stockAlerts.data?.length === 0) ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No stock alerts</div>
              ) : (
                <>
                  {showAllAlerts ? (
                    // Show all alerts in scrollable container
                    <div className="alerts-scrollable">
                      {stockAlerts.data?.map((alert, index) => (
                        <AlertItem 
                          key={alert.item_id}
                          type={alert.urgency_level === 'critical' ? 'critical' : 'warning'}
                          icon={<Package />} 
                          title={`${alert.urgency_level === 'critical' ? 'Critical' : 'Low'} Stock: ${alert.name}`} 
                          description={`Current stock: ${alert.current_stock} ${alert.unit || 'units'} (Reorder at: ${alert.reorder_point || 'N/A'})`}
                          screen="inventory"
                          goTo={goTo}
                        />
                      ))}
                    </div>
                  ) : (
                    // Show only first 3 alerts
                    <>
                      {stockAlerts.data?.slice(0, 3).map((alert, index) => (
                        <AlertItem 
                          key={alert.item_id}
                          type={alert.urgency_level === 'critical' ? 'critical' : 'warning'}
                          icon={<Package />} 
                          title={`${alert.urgency_level === 'critical' ? 'Critical' : 'Low'} Stock: ${alert.name}`} 
                          description={`Current stock: ${alert.current_stock} ${alert.unit || 'units'} (Reorder at: ${alert.reorder_point || 'N/A'})`}
                          screen="inventory"
                          goTo={goTo}
                        />
                      ))}
                      {(stockAlerts.data?.length || 0) > 3 && (
                        <div style={{ padding: '10px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                          and {(stockAlerts.data?.length || 0) - 3} more items...
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
  {/** Footer nav is provided globally by App.js (FooterNav). Local nav removed to avoid conflicts. **/}
    </div>
  );
};

export default DashboardPage;
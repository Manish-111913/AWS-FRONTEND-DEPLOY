import React, { useState, useEffect, useRef } from 'react';
import OwnerDynamicTimer from './OwnerDynamicTimer';
import './OwnerDashboard.css';
import { http } from '../../services/apiClient';
import { getTenant } from '../../services/tenantContext';
// realTimeService not used to avoid frequent spinner flicker; using gentle polling instead

// Legacy mapping retained; semantic mapping added below
const legacyColorMap = {
  paid: '#22c55e',
  issue: '#ef4444',
  cash: '#facc15', // shift to yellow for semantic alignment
  empty: '#64748b'
};
const semanticColorMap = {
  ash: '#64748b',
  yellow: '#facc15',
  green: '#10b981'
};
const tableColor = (table) => {
  if (table.semantic) {
    if (table.semantic === 'green') return semanticColorMap.green;
    if (table.semantic === 'yellow') return semanticColorMap.yellow;
    return semanticColorMap.ash;
  }
  return legacyColorMap[table.status] || legacyColorMap.empty;
};

const statusText = (table) => {
  if (table.semantic) {
    if (table.semantic === 'green') return 'Occupied & Eating'; // pay-first OR Paid (eat-first) final state
    if (table.semantic === 'yellow') return 'Occupied';
    return 'Empty';
  }
  return ({
    paid: 'Paid Successfully',
    issue: 'Payment Issue',
    cash: 'Cash / Active',
    empty: 'Empty'
  }[table.status] || 'Empty');
};

export default function OwnerDashboard({ onModalChange }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [showCounter, setShowCounter] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [tables, setTables] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [counterOrders, setCounterOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [model, setModel] = useState('eat-first'); // UI model: 'eat-first' | 'pay-first'
  const [businessId, setBusinessId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const initialLoadRef = useRef(true);
  const [forceYellow, setForceYellow] = useState(false);

  // Lock background scroll when any modal/submodal is open
  useEffect(() => {
    const anyModal = selectedTable || showCounter || showAllOrders;
    if (onModalChange) onModalChange(!!anyModal);
    const body = document.body;
    if (anyModal) {
      // Preserve scroll position and prevent jump
      const scrollY = window.scrollY;
      body.dataset.prevScrollY = String(scrollY);
      body.style.top = `-${scrollY}px`;
      body.classList.add('owner-modal-open');
      body.style.position = 'fixed';
      body.style.width = '100%';
    } else {
      if (body.classList.contains('owner-modal-open')) {
        const prev = parseInt(body.dataset.prevScrollY || '0', 10);
        body.classList.remove('owner-modal-open');
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        window.scrollTo(0, prev);
      }
    }
    return () => { /* cleanup when component unmounts */
      body.classList.remove('owner-modal-open');
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
    };
  }, [selectedTable, showCounter, showAllOrders, onModalChange]);

  // Optional: pick up sessions API base override from URL (sessionsApiBase) and persist
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get('sessionsApiBase') || sp.get('apiBase');
      if (v) {
        const norm = v.replace(/\/$/, '');
        localStorage.setItem('qr.sessionsApiBaseOverride', norm);
        // also set generic apiBase for other callers if they care
        localStorage.setItem('qr.apiBaseOverride', norm);
        console.log('[OWNER][SESSIONS_API_BASE_SET]', norm);
      }
    } catch(_){}
  }, []);

  // Resolve businessId once (tenant → URL → localStorage) and store
  useEffect(() => {
    try {
      // 1) Prefer QRbilling tenant context
      const bidTenant = getTenant();
      if (bidTenant) {
        setBusinessId(bidTenant);
        try { localStorage.setItem('qr.businessId', String(bidTenant)); } catch(_){ }
        return;
      }
      // 2) Then URL param (businessId|bid|b)
      const sp = new URLSearchParams(window.location.search);
      const bidUrl = sp.get('businessId') || sp.get('bid') || sp.get('b');
      if (bidUrl && !Number.isNaN(Number(bidUrl))) {
        setBusinessId(Number(bidUrl));
        try { localStorage.setItem('qr.businessId', String(bidUrl)); } catch(_){ }
        return;
      }
      // 3) Finally localStorage
      const ls = localStorage.getItem('qr.businessId') || localStorage.getItem('qr_billing_businessId');
      if (ls && !Number.isNaN(Number(ls))) setBusinessId(Number(ls));
    } catch(_) {}
  }, []);

  // Optional: business model override via URL (?model=eat-first|pay-first or ?mode=eat_later|pay_first)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const raw = sp.get('model') || sp.get('mode');
      if (raw) {
        const v = raw.toLowerCase();
        const normalized = (v === 'pay-first' || v === 'pay_first') ? 'pay-first' : 'eat-first';
        setModel(normalized);
        try { localStorage.setItem('qr_billing_business_model', normalized); } catch(_) {}
        console.log('[OwnerDashboard] model override via URL =>', normalized);
      }
      const fy = sp.get('forceYellow') || sp.get('fy');
      if (fy && fy !== '0' && fy !== 'false') {
        setForceYellow(true);
        console.log('[OwnerDashboard] forceYellow enabled');
      }
    } catch(_) {}
  }, []);

  // Fetch owner summary with background refresh (no spinner after first load)
  useEffect(() => {
    const load = async () => {
      if (!businessId) return; // wait until tenant resolved
      try {
        if (initialLoadRef.current) setLoading(true);
        let currentModel = model;
        try {
          const stored = localStorage.getItem('qr_billing_business_model');
          if (stored) { currentModel = stored; setModel(stored); }
        } catch(_){}

        // Preferred path: MENU-BACKEND sessions overview (supports both business models + timers)
        // Allow a separate base just for owner sessions to avoid breaking other API calls.
        // Env: REACT_APP_SESSIONS_API_BASE or REACT_APP_API_BASE (absolute origin), else try same-origin http wrapper.
        const sessionsBase =
          (typeof window!=='undefined' && (localStorage.getItem('qr.sessionsApiBaseOverride') || localStorage.getItem('qr.apiBaseOverride')))
          || process.env.REACT_APP_SESSIONS_API_BASE
          || process.env.REACT_APP_API_BASE
          || '';
        const modeParam = currentModel === 'pay-first' ? 'pay_first' : 'eat_later';
        let overview = null;
        let overviewErr = null;
        try {
          if (sessionsBase) {
            try { console.log('[OwnerDashboard] sessionsBase used for overview:', sessionsBase); } catch(_) {}
            const u = new URL('/api/sessions/overview', sessionsBase.replace(/\/$/, ''));
            u.searchParams.set('businessId', String(businessId));
            u.searchParams.set('mode', modeParam);
            // add cache buster and no-store to reflect new scans instantly
            u.searchParams.set('_', String(Date.now()));
            const resp = await fetch(u.toString(), { method: 'GET', headers: { 'cache-control': 'no-store' } });
            const ct = resp.headers.get('content-type')||'';
            const data = ct.includes('application/json') ? await resp.json() : null;
            if (!resp.ok) throw new Error(data?.error || `HTTP ${resp.status}`);
            overview = data;
          } else {
            // Fallback to current API base if sessions route is mounted on same backend
            // Note: apiClient base already ends with /api, so do NOT prefix with /api here
            overview = await http.get(`/sessions/overview?businessId=${encodeURIComponent(businessId)}&mode=${encodeURIComponent(modeParam)}`);
          }
        } catch (e) {
          overviewErr = e;
        }

        if (overview && Array.isArray(overview.tables)) {
          try { console.log('[OwnerDashboard] sessions overview', overview.tables.map(t=>({table:t.table_number,color:t.color,reason:t.reason,orders:t.orders_count})) ); } catch(_){ }
          const mapped = overview.tables
            .map((t, idx) => {
              const semantic = t.color || 'ash'; // ash|yellow|green from server
              let legacy = 'empty';
              if (semantic === 'yellow') legacy = 'cash';
              if (semantic === 'green') legacy = 'paid';
              const sessionActive = !!t.session_id && (t.session_status ? t.session_status === 'active' : true);
              const ordersCount = Number(t.orders_count||0);
              const allPaid = !!t.all_paid;
              // Compute human time since first dish for pay-first when eating (green)
              let timeLabel = '0m';
              try {
                if ((currentModel === 'pay-first') && semantic === 'green' && t.first_ready_at) {
                  const start = new Date(t.first_ready_at).getTime();
                  const mins = Math.max(0, Math.floor((Date.now() - start) / 60000));
                  if (mins >= 60) {
                    const h = Math.floor(mins / 60);
                    const m = mins % 60;
                    timeLabel = m === 0 ? `${h}hr` : `${h}hr ${m}m`;
                  } else {
                    timeLabel = `${mins}m`;
                  }
                }
              } catch(_) {}
              return {
                id: t.qr_code_id || t.session_id || (idx + 1),
                name: `Table ${t.table_number}`,
                status: legacy,
                semantic,
                session_active: sessionActive,
                amount: 0,
                time: timeLabel,
                orders: [],
                customerCount: ordersCount > 0 ? 1 : 0,
                ordersCount,
                allPaid
              };
            });
          setTables(mapped);
          setError(null);
          setLastUpdated(new Date());
        } else {
          // Legacy fallback: orders/by-table if sessions overview is unavailable
          // Ensure we hit the aggregation endpoint with /api prefix
          const primaryPath = `/orders/by-table?businessId=${encodeURIComponent(businessId)}&debug=1`;
          let res = null; 
          let fetchErr = null;
          try { res = await http.get(primaryPath); } catch(e) { fetchErr = e; }
          if (res && Array.isArray(res.tables)) {
            try { console.log('[OwnerDashboard] by-table result (fallback)', res.tables.map(t=>({table:t.table_number,color:t.color,reason:t.colorReason,orders_count:t.orders_count,unpaid:t.unpaid_count}))); } catch(_) {}
            const mapped = res.tables
              .map((t, idx) => {
                let semantic = t.color; // ash|yellow|green
                if (semantic === 'yellow' && t.orders_count > 0 && Number(t.unpaid_count||0) === 0) {
                  semantic = 'green';
                }
                let legacy = 'empty';
                if (semantic === 'yellow') legacy = 'cash';
                if (semantic === 'green') legacy = 'paid';
                return {
                  id: t.qr_code_id || idx + 1,
                  name: `Table ${t.table_number}`,
                  status: legacy,
                  semantic,
                  session_active: !!t.session_id,
                  amount: 0,
                  time: '0m',
                  orders: [],
                  customerCount: t.orders_count > 0 ? 1 : 0
                };
              });
            setTables(mapped);
            setError(null);
            setLastUpdated(new Date());
          } else if (overviewErr) {
            setError(overviewErr.message || 'Failed to load sessions overview');
          } else if (fetchErr) {
            setError(fetchErr.message || 'Failed to load table payments');
          } else {
            setError('Unexpected response format');
          }
        }
      } catch (e) {
        setError(e.message || 'Failed to load table payments');
      } finally {
        setLoading(false);
        initialLoadRef.current = false;
      }
    };
    if (!businessId) return;
  try { console.log('[OwnerDashboard] init', { businessId, model, forceYellow }); } catch(_) {}
  load(); // initial fetch
    // Quick follow-up refreshes to reflect scans almost immediately
    const kick1 = setTimeout(load, 1000);
    const kick2 = setTimeout(load, 3000);
    // Gentle polling every 8s without blocking UI
    const iv = setInterval(load, 8000);
    return () => { clearInterval(iv); clearTimeout(kick1); clearTimeout(kick2); };
  }, [businessId, model]);

  const totalActiveCustomers = tables.filter(t => t.semantic && t.semantic !== 'ash').reduce((s,t)=>s+(t.customerCount||0),0);

  // Fallback: if eat-first model and backend hasn't yet assigned semantic but session_active is true, treat as yellow
  // If forceYellow=true via URL, apply for both models
  const normalizedTables = tables.map(t => {
    if ((model === 'eat-first' || forceYellow) && t.session_active) {
      // Force immediate yellow when session is active but payment not completed
      if (t.allPaid && (t.ordersCount||0) > 0) return { ...t, semantic: 'green' };
      if (t.semantic !== 'green') return { ...t, semantic: 'yellow' };
    }
    return t;
  });

  return (
    <div className="od-container">
      <header className="od-header">
        <div>
          <h1 className="od-header-title">INVEXIS Dashboard</h1>
          <p className="od-header-subtitle">Restaurant Management</p>
        </div>
        <div className="od-header-controls">
          <div className="od-model-selector">
            <label>Business Model:</label>
            <select value={model} onChange={(e) => {
              const newModel = e.target.value;
              setModel(newModel);
              try { localStorage.setItem('qr_billing_business_model', newModel); } catch(_){}
            }}>
              <option value="eat-first">Eat First (Order → Eat → Pay)</option>
              <option value="pay-first">Pay First (Order → Pay → Eat)</option>
            </select>
          </div>
          <div className="od-stats" style={{marginLeft:12}}>
            <span style={{color:'#10b981', fontWeight:700}}>Active: {normalizedTables.filter(t => t.semantic && t.semantic !== 'ash').length}</span>
          </div>
        </div>
      </header>

      {/* Counter Section to match reference UI */}
      <section style={{padding:'8px 12px'}}>
        <div style={{textAlign:'center',fontWeight:700,margin:'6px 0'}}>Counter Section</div>
        <div style={{background:'#6d28d9',color:'white',borderRadius:12,padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{opacity:.9,fontSize:13}}>Main Counter</div>
            <div style={{fontSize:12,opacity:.8}}>Total Revenue</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:18,fontWeight:800}}>₹{Number(totalRevenue||0).toFixed(0)}</div>
            <div style={{fontSize:12,opacity:.9}}>Today</div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="od-loading">
          <div className="od-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      )}

      {error && (
        <div className="od-error">
          <p>⚠️ {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <main className="od-main">
          <section className="od-tables-section">
            <div className="od-section-header">
              <h2>Tables Overview</h2>
              <div className="od-legend">
                <div className="od-legend-item">
                  <div className="od-color-dot" style={{ backgroundColor: semanticColorMap.ash }}></div>
                  <span>Empty</span>
                </div>
                {model === 'pay-first' ? (
                  <>
                    <div className="od-legend-item">
                      <div className="od-color-dot" style={{ backgroundColor: semanticColorMap.yellow }}></div>
                      <span>Occupied & Paid (preparing)</span>
                    </div>
                    <div className="od-legend-item">
                      <div className="od-color-dot" style={{ backgroundColor: semanticColorMap.green }}></div>
                      <span>Occupied & Eating</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="od-legend-item">
                      <div className="od-color-dot" style={{ backgroundColor: semanticColorMap.yellow }}></div>
                      <span>Active (Not Paid)</span>
                    </div>
                    <div className="od-legend-item">
                      <div className="od-color-dot" style={{ backgroundColor: semanticColorMap.green }}></div>
                      <span>Paid (Complete)</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="od-tables-grid">
              {normalizedTables.map((table) => {
                const sem = table.semantic || 'ash';
                const stateClass = `od-state-${sem}`; // od-state-ash|yellow|green
                const timeText = table.time && table.time !== '0m' ? table.time : '';
                return (
                  <div
                    key={table.id}
                    className={`od-table-card ${stateClass}`}
                    onClick={() => setSelectedTable(table)}
                  >
                    <div className="od-table-name">{table.name}</div>
                    <div className="od-table-status">{statusText(table)}</div>
                    <div className="od-table-bottom">
                      <div className="od-table-amount">₹{Number(table.amount||0).toFixed(0)}</div>
                      {timeText && <div className="od-table-time">{timeText}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="od-controls-section">
            <button 
              className="od-control-btn counter-btn"
              onClick={() => setShowCounter(true)}
            >
              Counter Orders
            </button>
            <button 
              className="od-control-btn orders-btn"
              onClick={() => setShowAllOrders(true)}
            >
              All Orders
            </button>
            <div style={{marginLeft:'auto',fontSize:12,color:'#aaa'}}>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ''}
            </div>
          </section>
        </main>
      )}

      {/* Table Detail Modal */}
      {selectedTable && (
        <div className="od-modal-overlay" onClick={() => setSelectedTable(null)}>
          <div className="od-modal" onClick={e => e.stopPropagation()}>
            <header className="od-modal-header">
              <h2>{selectedTable.name}</h2>
              <button className="od-close-btn" onClick={() => setSelectedTable(null)}>×</button>
            </header>
            <div className="od-modal-body">
              <div className="od-table-detail">
                <div className="od-detail-row">
                  <span>Status:</span>
                  <span style={{ color: tableColor(selectedTable) }}>
                    {statusText(selectedTable)}
                  </span>
                </div>
                {selectedTable.customerCount > 0 && (
                  <div className="od-detail-row">
                    <span>Customers:</span>
                    <span>{selectedTable.customerCount}</span>
                  </div>
                )}
                {selectedTable.amount > 0 && (
                  <div className="od-detail-row">
                    <span>Amount:</span>
                    <span>${selectedTable.amount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              {selectedTable.session_active && (
                <OwnerDynamicTimer startTime={selectedTable.time} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Counter Orders Modal */}
      {showCounter && (
        <div className="od-modal-overlay" onClick={() => setShowCounter(false)}>
          <div className="od-modal" onClick={e => e.stopPropagation()}>
            <header className="od-modal-header">
              <h2>Counter Orders</h2>
              <button className="od-close-btn" onClick={() => setShowCounter(false)}>×</button>
            </header>
            <div className="od-modal-body">
              {counterOrders.length === 0 ? (
                <p>No counter orders at the moment.</p>
              ) : (
                <div className="od-orders-list">
                  {counterOrders.map(order => (
                    <div key={order.id} className="od-order-item">
                      <h3>Order #{order.id}</h3>
                      <p>Amount: ${order.amount}</p>
                      <p>Status: {order.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Orders Modal */}
      {showAllOrders && (
        <div className="od-modal-overlay" onClick={() => setShowAllOrders(false)}>
          <div className="od-modal" onClick={e => e.stopPropagation()}>
            <header className="od-modal-header">
              <h2>All Orders</h2>
              <button className="od-close-btn" onClick={() => setShowAllOrders(false)}>×</button>
            </header>
            <div className="od-modal-body">
              <p>All orders view - Coming soon!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
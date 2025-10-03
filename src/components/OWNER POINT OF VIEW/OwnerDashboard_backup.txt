import React, { useState, useEffect } from 'react';
import OwnerDynamicTimer from './OwnerDynamicTimer';
import './OwnerDashboard.css';
import { http } from '../../services/apiClient';
import { getTenant } from '../../services/tenantContext';
import { realTimeService } from '../../services/realTimeService';

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
  }, [selectedTable, showCounter, showAllOrders]);

  // Fetch owner summary on mount and every 20s
  useEffect(() => {
    // Resolve businessId once (tenant) and store
    try {
      const bid = getTenant();
      if (bid) setBusinessId(bid);
    } catch(_) {}
  }, []);

  useEffect(() => {
    let timer;
    const load = async () => {
      if (!businessId) return; // wait until tenant resolved
      try {
        setLoading(true);
        let currentModel = model;
        try {
          const stored = localStorage.getItem('qr_billing_business_model');
          if (stored) { currentModel = stored; setModel(stored); }
        } catch(_){}

        // Map UI model to backend mode param (eat-first -> eat_later, pay-first -> pay_first)
        const backendMode = currentModel === 'pay-first' ? 'pay_first' : 'eat_later';
        // NOTE: apiClient.buildUrl already prefixes /api. Primary target is MENU-BACKEND at /api/sessions/overview.
        // However current environment might already nest a backend that lacks this route. We'll try two patterns.
        let res = null;
        let fetchError = null;
        const primaryPath = `sessions/overview?businessId=${encodeURIComponent(businessId)}&mode=${encodeURIComponent(backendMode)}`; // -> /api/sessions/overview
        const secondaryPath = `api/sessions/overview?businessId=${encodeURIComponent(businessId)}&mode=${encodeURIComponent(backendMode)}`; // -> /api/api/sessions/overview (only used if first 404 and buildUrl base lacks /api)
        try {
          res = await http.get(primaryPath);
        } catch (e) {
          fetchError = e;
          if (e.status === 404) {
            try { res = await http.get(secondaryPath); fetchError = null; } catch (e2) { fetchError = e2; }
          }
        }

        if (res && Array.isArray(res.tables)) {
          // New backend returns: { tables: [ { table_number, color, session_id, orders_count, ... } ] }
          const mapped = res.tables
            .filter(t => /^\d+$/.test(String(t.table_number||'').trim())) // numeric only
            .map((t, idx) => {
            const semantic = t.color; // ash|yellow|green
            // Derive legacy status for existing UI helpers (only needed if some code still uses status)
            let legacy = 'empty';
            if (semantic === 'yellow') legacy = 'cash';
            if (semantic === 'green') legacy = 'paid';
            return {
              id: t.qr_code_id || idx + 1,
              name: `Table ${t.table_number}`,
              status: legacy,
              semantic,
              session_active: !!(t.session_id && t.session_status === 'active'),
              amount: 0, // amount not provided in new overview (could be extended later)
              time: '0m', // no duration yet (future improvement: compute from session start if added)
              orders: [],
              customerCount: t.orders_count > 0 ? 1 : 0
            };
          });
          setTables(mapped);
          setError(null);
        } else if (res && res.error) {
          setError(res.error);
        } else if (fetchError) {
          setError(fetchError.message || 'Failed to load sessions overview');
        } else {
          setError('Unexpected response format');
        }
      } catch (loadError) {
        console.error('Failed to load owner summary:', loadError);
        setError(`Failed to load: ${loadError.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (businessId) {
      load(); // Initial load
      
      // Subscribe to real-time updates
      const unsubscribe = realTimeService.subscribe('owner-dashboard', load, 20000);
      
      return unsubscribe;
    }
  }, [businessId, model]);

  /*
  // COMMENTED OUT - Duplicate code causing parsing errors
        try {
          const stored = localStorage.getItem('qr_billing_business_model');
          if (stored) { currentModel = stored; setModel(stored); }
        } catch(_){}

        // Map UI model to backend mode param (eat-first -> eat_later, pay-first -> pay_first)
        const backendMode = currentModel === 'pay-first' ? 'pay_first' : 'eat_later';
        // NOTE: apiClient.buildUrl already prefixes /api. Primary target is MENU-BACKEND at /api/sessions/overview.
        // However current environment might already nest a backend that lacks this route. We'll try two patterns.
        let res = null;
        let fetchError = null;
        const primaryPath = `sessions/overview?businessId=${encodeURIComponent(businessId)}&mode=${encodeURIComponent(backendMode)}`; // -> /api/sessions/overview
        const secondaryPath = `api/sessions/overview?businessId=${encodeURIComponent(businessId)}&mode=${encodeURIComponent(backendMode)}`; // -> /api/api/sessions/overview (only used if first 404 and buildUrl base lacks /api)
        try {
          res = await http.get(primaryPath);
        } catch (e) {
          fetchError = e;
          if (e.status === 404) {
            try { res = await http.get(secondaryPath); fetchError = null; } catch (e2) { fetchError = e2; }
          }
        }

        if (res && Array.isArray(res.tables)) {
          // New backend returns: { tables: [ { table_number, color, session_id, orders_count, ... } ] }
  */
          const mapped = res.tables
            .filter(t => /^\d+$/.test(String(t.table_number||'').trim())) // numeric only
            .map((t, idx) => {
            const semantic = t.color; // ash|yellow|green
            // Derive legacy status for existing UI helpers (only needed if some code still uses status)
            let legacy = 'empty';
            if (semantic === 'yellow') legacy = 'cash';
            if (semantic === 'green') legacy = 'paid';
            return {
              id: t.qr_code_id || idx + 1,
              name: `Table ${t.table_number}`,
              status: legacy,
              semantic,
              session_active: !!(t.session_id && t.session_status === 'active'),
              amount: 0, // amount not provided in new overview (could be extended later)
              time: '0m', // no duration yet (future improvement: compute from session start if added)
              orders: [],
              customerCount: t.orders_count > 0 ? 1 : 0
            };
          });
          setTables(mapped);
          setError(null);
        } else if (res && res.error) {
          setError(res.error);
        } else if (fetchError) {
          setError(fetchError.message || 'Failed to load sessions overview');
        }
      } catch (e) {
        setError(e.message || 'Failed to load sessions overview');
      } finally {
        setLoading(false);
      }
    };
    load();
    timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [businessId]);
  // END OF COMMENTED OUT DUPLICATE CODE */

  const totalActiveCustomers = tables.filter(t => (t.semantic ? t.semantic !== 'ash' && t.semantic !== 'empty' : t.status !== 'empty')).reduce((s,t)=>s+(t.customerCount||0),0);

  // Fallback: if eat-first model and backend hasn't yet assigned semantic but session_active is true, treat as yellow
  const normalizedTables = tables.map(t => {
    if (!t.semantic && model === 'eat-first' && t.session_active) {
      return { ...t, semantic: 'yellow' };
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
        <div className="od-active-users">Active: {totalActiveCustomers}</div>
      </header>

      <div className="od-section">
        <h2 className="od-section-title">Counter Section</h2>
        <button className="od-counter-card" onClick={() => setShowCounter(true)}>
          <div className="od-counter-title">Main Counter</div>
          <div className="od-counter-status">Total Revenue</div>
          <div className="od-counter-bottom">
            <div className="od-counter-amount">₹{totalRevenue}</div>
            <div className="od-counter-time">Today</div>
          </div>
        </button>
      </div>

      <div className="od-section">
        <h2 className="od-section-title">Tables Overview</h2>
        <div className="od-legend">
          <div className="od-legend-item"><span className="od-legend-dot" style={{background: semanticColorMap.ash}}></span>Empty</div>
          <div className="od-legend-item"><span className="od-legend-dot" style={{background: semanticColorMap.yellow}}></span>{model === 'pay-first' ? 'Paid (Waiting Items)' : 'Active (Not Paid)'}</div>
          <div className="od-legend-item"><span className="od-legend-dot" style={{background: semanticColorMap.green}}></span>{model === 'pay-first' ? 'Item Ready' : 'Paid (Complete)'}</div>
        </div>
        <div className="od-tables-grid">
          {normalizedTables.map(table => (
            <button key={table.id} className="od-table-card" style={{background: tableColor(table)}} onClick={()=>setSelectedTable(table)}>
              <div className="od-table-name">{table.name}</div>
              <div className="od-table-status">{statusText(table)}</div>
              {(table.semantic ? table.semantic !== 'empty' : table.status !== 'empty') && (
                <div className="od-table-bottom">
                  <div className="od-table-amount">₹{table.amount}</div>
                  <div className="od-table-time">{table.time}</div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedTable && (
        <div className="od-modal-overlay" onClick={()=>setSelectedTable(null)}>
          <div className="od-modal" onClick={e=>e.stopPropagation()}>
            <div className="od-modal-header">
              <h3 className="od-modal-title">{selectedTable.name} Details</h3>
              <button className="od-close" onClick={()=>setSelectedTable(null)}>×</button>
            </div>
            <div className="od-modal-scroll">
              <section className="od-modal-section">
                <h4 className="od-modal-section-title">Current Orders</h4>
                {selectedTable.orders.length ? selectedTable.orders.map((o,i)=>(
                  <div key={i} className="od-order-item">
                    <div className="od-order-text">{o.item}</div>
                    <div className="od-order-right"><span className="od-order-qty">x{o.quantity}</span><span className="od-order-price">₹{o.price}</span></div>
                  </div>
                )): <div className="od-empty">No current orders</div>}
              </section>
              <section className="od-modal-section">
                <h4 className="od-modal-section-title">Payment Details</h4>
                <div className="od-payment-row">Status: <span className="od-badge" style={{background: tableColor(selectedTable)}}>{statusText(selectedTable)}</span></div>
                <div className="od-payment-total">Total: <span className="od-total">₹{selectedTable.amount}</span></div>
              </section>
              <section className="od-modal-section">
                <h4 className="od-modal-section-title">Time Spent</h4>
                <OwnerDynamicTimer startTime={selectedTable.time} />
              </section>
              <div className="od-actions">
                <button className="od-primary-btn" onClick={()=>setShowAllOrders(true)}>View All Orders</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCounter && (
        <div className="od-modal-overlay" onClick={()=>setShowCounter(false)}>
          <div className="od-modal" onClick={e=>e.stopPropagation()}>
            <div className="od-modal-header">
              <h3 className="od-modal-title">Main Counter</h3>
              <button className="od-close" onClick={()=>setShowCounter(false)}>×</button>
            </div>
            <div className="od-modal-scroll">
              <section className="od-modal-section">
                <h4 className="od-modal-section-title">Today's Summary</h4>
                <div className="od-counter-stats">
                  <div className="od-counter-stat">
                    <div className="od-counter-stat-value">₹{totalRevenue}</div>
                    <div className="od-counter-stat-label">Total Revenue</div>
                  </div>
                  <div className="od-counter-stat">
                    <div className="od-counter-stat-value">{counterOrders.length}</div>
                    <div className="od-counter-stat-label">Counter Orders</div>
                  </div>
                </div>
              </section>
              <section className="od-modal-section">
                <h4 className="od-modal-section-title">Counter Orders</h4>
                <div className="od-counter-desc">Takeaway, Online orders, and Walk-in customers who prefer counter billing</div>
                {counterOrders.map(order => (
                  <div key={order.id} className="od-counter-order-item">
                    <div className="od-counter-order-info">
                      <div className="od-counter-order-header">
                        <span className={`od-counter-order-type ${String(order.payment_method || '').toLowerCase()}`}>{order.payment_method || 'COUNTER'}</span>
                        <span className={`od-counter-order-status ${order.status}`}>{order.status}</span>
                      </div>
                      <div className="od-counter-order-item-name">{order.item}</div>
                      <div className="od-counter-order-time">{new Date(order.created_at).toLocaleTimeString()}</div>
                    </div>
                    <div className="od-counter-order-amount">₹{order.amount}</div>
                  </div>
                ))}
              </section>
              <section className="od-modal-section">
                <h4 className="od-modal-section-title">Counter Usage</h4>
                <div className="od-counter-usage-box">
                  <ul className="od-instructions od-counter-usage-list">
                    <li>Takeaway orders and online deliveries</li>
                    <li>Customers who prefer manual billing</li>
                    <li>Walk-in customers unfamiliar with QR ordering</li>
                    <li>All counter transactions are stored here</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Order History Submodal */}
      {showAllOrders && selectedTable && (
        <div className="od-submodal-overlay" onClick={()=>setShowAllOrders(false)}>
          <div className="od-submodal" onClick={(e)=>e.stopPropagation()}>
            <div className="od-submodal-header">
              <h4 className="od-submodal-title">All Orders - {selectedTable.name}</h4>
              <button className="od-submodal-close" onClick={()=>setShowAllOrders(false)}>×</button>
            </div>
            <div className="od-order-history-list">
              {selectedTable.orders.length ? selectedTable.orders.map((o,i)=>(
                <div key={'sub'+i} className="od-history-item">
                  <div className="od-history-info">
                    <div className="od-history-name">{o.item}</div>
                    <div className="od-history-qty">Qty: {o.quantity}</div>
                  </div>
                  <div className="od-history-price">₹{o.price}</div>
                </div>
              )): <div className="od-empty">No order history available</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  }, [selectedTable, showCounter, showAllOrders, onModalChange]);

  // Resolve businessId once (tenant) and store
  useEffect(() => {
    try {
      const bid = getTenant();
      if (bid) setBusinessId(bid);
    } catch(_) {}
  }, []);

  // Fetch owner summary with real-time updates
  useEffect(() => {
    const load = async () => {
      if (!businessId) return; // wait until tenant resolved
      try {
        setLoading(true);
        let currentModel = model;
        try {
          const stored = localStorage.getItem('qr_billing_business_model');
          if (stored) { currentModel = stored; setModel(stored); }
        } catch(_){}

        // Primary path: orders/by-table (backend should expose /api/orders/by-table)
        // Ensure we hit the new aggregation endpoint with /api prefix
        const primaryPath = `/orders/by-table?businessId=${encodeURIComponent(businessId)}&debug=1`;
        let res = null; 
        let fetchErr = null;
        try { 
          res = await http.get(primaryPath); 
        } catch(e) { 
          fetchErr = e; 
        }
        
        if (res && Array.isArray(res.tables)) {
          // Debug: log raw table colors for verification
          try { console.log('[OwnerDashboard] by-table result', res.tables.map(t=>({table:t.table_number,color:t.color,reason:t.colorReason, orders_count:t.orders_count, unpaid:t.unpaid_count}))); } catch(_) {}
          const mapped = res.tables
            .filter(t => /^\d+$/.test(String(t.table_number||'').trim()))
            .map((t, idx) => {
              let semantic = t.color; // ash|yellow|green
              // Safety correction: if backend somehow returns yellow but there are orders and unpaid_count=0 => force green
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
                amount: 0, // TODO: integrate billing total if needed
                time: '0m', // Placeholder until session duration provided
                orders: [],
                customerCount: t.orders_count > 0 ? 1 : 0
              };
            });
          setTables(mapped); 
          setError(null);
        } else if (res && res.error) {
          setError(res.error);
        } else if (fetchErr) {
          setError(fetchErr.message || 'Failed to load table payments');
        } else {
          setError('Unexpected response format');
        }
      } catch (e) {
        setError(e.message || 'Failed to load table payments');
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

  const totalActiveCustomers = tables.filter(t => t.semantic && t.semantic !== 'ash').reduce((s,t)=>s+(t.customerCount||0),0);

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
          <div className="od-stats">
            <span>Active Customers: <strong>{totalActiveCustomers}</strong></span>
            <span>Revenue Today: <strong>${totalRevenue.toFixed(2)}</strong></span>
          </div>
        </div>
      </header>

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
                <div className="od-legend-item">
                  <div className="od-color-dot" style={{ backgroundColor: semanticColorMap.yellow }}></div>
                  <span>Unpaid / Partially Paid</span>
                </div>
                <div className="od-legend-item">
                  <div className="od-color-dot" style={{ backgroundColor: semanticColorMap.green }}></div>
                  <span>All Paid</span>
                </div>
              </div>
            </div>

            <div className="od-tables-grid">
              {normalizedTables.map((table) => (
                <div
                  key={table.id}
                  className={`od-table-card ${table.semantic || 'empty'}`}
                  style={{ borderColor: tableColor(table) }}
                  onClick={() => setSelectedTable(table)}
                >
                  <div className="od-table-header">
                    <h3>{table.name}</h3>
                    <div 
                      className="od-status-indicator" 
                      style={{ backgroundColor: tableColor(table) }}
                    ></div>
                  </div>
                  <div className="od-table-info">
                    <p className="od-status">{statusText(table)}</p>
                    {table.customerCount > 0 && (
                      <p className="od-customers">{table.customerCount} customer{table.customerCount !== 1 ? 's' : ''}</p>
                    )}
                    {table.time !== '0m' && <p className="od-time">{table.time}</p>}
                  </div>
                </div>
              ))}
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
                <OwnerDynamicTimer sessionId={selectedTable.id} />
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
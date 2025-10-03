import React, { useEffect, useRef, useState } from 'react';
import './OwnerAnalytics.css';
import { http } from '../../services/apiClient';

export default function OwnerAnalytics() {
  const [data, setData] = useState({ dailyRevenue: 0, totalCustomers: 0, avgOrderValue: 0, avgTableTimeMinutes: 0, popularItems: [] });
  const [loading, setLoading] = useState(true);           // only for first load
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);    // silent background refresh
  const loadedRef = useRef(false);
  const abortRef = useRef(null);

  useEffect(() => {
    let timer;

    const load = async (background = false) => {
      try {
        // Cancel any in-flight request before starting a new one
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        if (!loadedRef.current && !background) {
          setLoading(true); // show skeleton only once
        } else {
          setRefreshing(true); // background refresh without flicker
        }

        const res = await http.get('/orders/owner-analytics', { signal: abortRef.current.signal });
        if (res?.success) {
          setData(res.data || {});
          setError(null);
        } else if (!loadedRef.current) {
          // only surface error prominently before first data load
          setError(res?.error || 'Failed to load analytics');
        }
      } catch (e) {
        if (e?.name === 'AbortError') return; // ignore aborts
        if (!loadedRef.current) setError(e.message || 'Failed to load analytics');
      } finally {
        if (!loadedRef.current) {
          setLoading(false);
          loadedRef.current = true;
        }
        setRefreshing(false);
      }
    };

    // initial load
    load(false);

    // background polling (no UI flicker) when tab is visible
    const startInterval = () => {
      timer = setInterval(() => {
        if (!document.hidden) load(true);
      }, 15000); // keep 15s but without triggering loading state
    };

    startInterval();

    const onVisibilityChange = () => {
      if (!document.hidden) {
        // refresh immediately when user returns to tab
        load(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const formatINR = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(n || 0));
  const fmtTime = (m) => {
    const mins = Number(m || 0);
    if (mins >= 60) return `${Math.floor(mins/60)}h ${mins%60}m`;
    return `${mins}m`;
  };
  return (
    <div className="oa-container">
      <header className="oa-header">
        <h1 className="oa-title">Analytics</h1>
        <p className="oa-subtitle">Today's Performance{refreshing ? ' • updating…' : ''}</p>
      </header>
      <main className="oa-main">
        <section className="oa-section">
          <h2 className="oa-section-title">Key Metrics</h2>
          <div className="oa-stats-grid">
            <div className="oa-stat-card oa-bg-green">
              <div className="oa-stat-value">₹{loading ? '--' : formatINR(data.dailyRevenue)}</div>
              <div className="oa-stat-label">Daily Revenue</div>
            </div>
            <div className="oa-stat-card oa-bg-blue">
              <div className="oa-stat-value">{loading ? '--' : Number(data.totalCustomers || 0)}</div>
              <div className="oa-stat-label">Total Customers</div>
            </div>
            <div className="oa-stat-card oa-bg-amber">
              <div className="oa-stat-value">₹{loading ? '--' : formatINR(data.avgOrderValue)}</div>
              <div className="oa-stat-label">Avg Order Value</div>
            </div>
            <div className="oa-stat-card oa-bg-purple">
              <div className="oa-stat-value">{loading ? '--' : fmtTime(data.avgTableTimeMinutes)}</div>
              <div className="oa-stat-label">Avg Table Time</div>
            </div>
          </div>
        </section>
        <section className="oa-section">
          <h2 className="oa-section-title">Popular Items Today</h2>
          {error && <div style={{color:'#ef4444', padding:'6px 8px'}}>{String(error)}</div>}
          {(data.popularItems || []).slice(0, 3).map((item, idx) => (
            <div key={idx} className="oa-popular-item">
              <div className="oa-item-info">
                <div className="oa-item-name">{item.name}</div>
                <div className="oa-item-orders">{item.orders} orders</div>
              </div>
              <div className="oa-item-rank">{idx + 1}</div>
            </div>
          ))}
          {(!loading && (!data.popularItems || data.popularItems.length === 0)) && (
            <div className="oa-empty">No items sold yet today</div>
          )}
        </section>
      </main>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import MinimalStockService from '../services/minimalStockService';
import { getTenant } from '../services/tenantContext';

const MinimalStock = ({ goTo }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      const tenant = getTenant();
      if (!tenant) {
        setError('Tenant not set. Please select a business.');
        setItems([]);
        return;
      }
      const data = await MinimalStockService.getDashboardAlerts();
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch');
      setItems(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 600,width:'100vw', margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={() => goTo && goTo('dashboard')} style={{ border: '1px solid #ddd', borderRadius: 6, padding: '6px 10px' }}>{'←'} Back</button>
        <h3 style={{ margin: 0 }}>Minimal Stock</h3>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ padding: '6px 10px', borderRadius: 6 }}>Refresh</button>
          <button onClick={() => goTo && goTo('create-reorder')} style={{ padding: '6px 10px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none' }}>Create Reorder</button>
        </div>
      </div>

      {loading && <div>Loading critical items…</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map(it => (
            <div key={it.item_id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>{it.name}</div>
                <span style={{ 
                  fontSize: 12, 
                  padding: '2px 8px', 
                  borderRadius: 999, 
                  background: it.urgency_level === 'critical' ? '#fce4ec' : '#fff8e1', 
                  color: it.urgency_level === 'critical' ? '#c2185b' : '#ef6c00' 
                }}>
                  {it.urgency_level || it.stock_status}
                </span>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: '#555' }}>
                Current: {Number(it.current_stock).toFixed(2)} {it.unit || ''} | ROP: {Number(it.reorder_point || 0).toFixed(2)} | Safety: {Number(it.safety_stock || 0).toFixed(2)}
              </div>
              {!!it.vendor_name && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                  Vendor: {it.vendor_name}
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ padding: 12, color: '#666' }}>No low stock items right now.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MinimalStock;

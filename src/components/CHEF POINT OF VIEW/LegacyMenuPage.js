import React, { useEffect, useMemo, useState } from 'react';
import './MenuPage.css';
import './shared.css';
import { Plus, Minus, Clock, X } from 'lucide-react';
import { http } from '../../services/apiClient';

// Legacy/simple Menu UI: grid of items with qty +/- and minimal chrome
// Props contract:
// - onSelectAdd(item): optional, called when an item is added from modal/add button
// - onQuantityChange(item, qty): required to notify parent about quantity changes
// - quantities: map of itemId -> qty
export default function LegacyMenuPage({ onSelectAdd, onQuantityChange, quantities = {} }) {
  const [items, setItems] = useState([]);
  const [localQuantities, setLocalQuantities] = useState(quantities);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalItem, setModalItem] = useState(null);

  // Keep in sync with parent cart state
  useEffect(() => { setLocalQuantities(quantities); }, [quantities]);

  // INR formatter
  const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v || 0));

  // Fetch QR-billing items and map to simple shape
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await http.get('/qr-billing/items');
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const mapped = data
          .filter((it) => {
            // Soft-exclude complimentary items from UI if any slipped through
            const nm = (it.name || '').toLowerCase();
            const cat = (it.category || '').toLowerCase();
            const isComplCat = /^complimentary( items)?$/.test(cat);
            const isComplName = /(chutney|sambar|podi|raita|pickle|papad|buttermilk|curd|lemon|onion|carrot|mint|coconut|salad)\s*$/.test(nm);
            return !(isComplCat || isComplName);
          })
          .map((it) => ({
            id: String(it.id ?? it.menu_item_id ?? it.name),
            name: it.name || 'Menu Item',
            description: it.description || '',
            price: it.price !== undefined && it.price !== null && it.price !== '' ? Number(it.price) : null,
            image: it.image || it.img || it.fallback_img || it.placeholder_img || '',
            isAvailable: it.is_available_to_customer !== false,
          }));
        if (!cancelled) { setItems(mapped); setError(null); }
      } catch (e) {
        if (!cancelled) setError('Failed to load menu items');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateQty = (item, change) => {
    setLocalQuantities(prev => {
      const current = prev[item.id] || 0;
      const nextQty = Math.max(0, current + change);
      const next = { ...prev, [item.id]: nextQty };
      onQuantityChange && onQuantityChange(item, nextQty);
      return next;
    });
  };

  const openDetails = (item) => setModalItem(item);
  const closeDetails = () => setModalItem(null);

  const availableItems = useMemo(() => items, [items]);

  return (
    <div className="qr-menu-container">
      <div className="qr-header"><h2>Menu</h2></div>

      {loading ? (
        <div className="loading-state">
          <Clock size={48} color="#4CAF50" />
          <h3>Loading Menu Items...</h3>
          <p>Fetching items from the kitchen</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <X size={48} color="#ff4444" />
          <h3>Unable to Load Menu</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">Try Again</button>
        </div>
      ) : (
        <>
          <div className="qr-grid">
            {availableItems.map(item => {
              const quantity = localQuantities[item.id] || 0;
              return (
                <div key={item.id} className={"qr-item" + (!item.isAvailable ? ' unavailable' : '')}>
                  <div className="qr-img-wrap" onClick={() => openDetails(item)}>
                    <img 
                      src={item.image || 'https://images.pexels.com/photos/3026805/pexels-photo-3026805.jpeg?auto=compress&cs=tinysrgb&w=400'} 
                      alt={item.name}
                      onError={(e) => { e.currentTarget.src = 'https://images.pexels.com/photos/3026805/pexels-photo-3026805.jpeg?auto=compress&cs=tinysrgb&w=400'; }}
                    />
                    {!item.isAvailable && <div className="qr-overlay">Empty</div>}
                  </div>
                  <div className="qr-info">
                    <h4 onClick={() => openDetails(item)}>{item.name}</h4>
                    <div className="qr-footer-line">
                      {item.price != null && <span className="price">{formatINR(item.price)}</span>}
                    </div>
                    <div className="qr-qty">
                      <button onClick={(e) => { e.stopPropagation(); item.isAvailable && updateQty(item, -1); }} disabled={!item.isAvailable}><Minus size={14} /></button>
                      <span>{quantity}</span>
                      <button onClick={(e) => { e.stopPropagation(); item.isAvailable && updateQty(item, 1); onSelectAdd && onSelectAdd(item); }} disabled={!item.isAvailable}><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {modalItem && (
            <div className="qr-modal-backdrop" onClick={closeDetails}>
              <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
                <div className="qr-modal-head">
                  <h3>{modalItem.name}</h3>
                  <button onClick={closeDetails}><X size={20} /></button>
                </div>
                <img 
                  src={modalItem.image || 'https://images.pexels.com/photos/3026805/pexels-photo-3026805.jpeg?auto=compress&cs=tinysrgb&w=400'} 
                  alt={modalItem.name} 
                  className="qr-modal-img"
                  onError={(e) => { e.currentTarget.src = 'https://images.pexels.com/photos/3026805/pexels-photo-3026805.jpeg?auto=compress&cs=tinysrgb&w=400'; }}
                />
                {modalItem.description && <p>{modalItem.description}</p>}
                <div className="qr-modal-footer">
                  {modalItem.price != null && <div className="modal-price">{formatINR(modalItem.price)}</div>}
                  <button className="add-btn" onClick={() => { updateQty(modalItem, 1); onSelectAdd && onSelectAdd(modalItem); closeDetails(); }}> <Plus size={16} /> Add to Cart</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

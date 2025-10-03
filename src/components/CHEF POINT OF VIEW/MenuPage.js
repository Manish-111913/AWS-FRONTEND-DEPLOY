import React, { useState, useMemo, useEffect } from 'react';
import './MenuPage.css';
import './shared.css';
import { Search, Filter, Clock, Star, Plus, Minus, X, TrendingUp, Heart, Tag, DollarSign, Timer } from 'lucide-react';
import { http } from '../../services/apiClient';
import ImageWithFallback from '../ImageWithFallback';

// Web-adapted version of the Expo Menu screen.
// Replaces React Native components with standard HTML elements and CSS classes.

// Match the previous UI exactly: only these five categories
const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Drinks'];
const filterDefs = [
  { id: 'trending', name: 'Trending', icon: TrendingUp },
  { id: 'liked', name: 'Most Liked', icon: Heart },
  { id: 'offers', name: 'Offers', icon: Tag },
  { id: 'price', name: 'Price', icon: DollarSign },
  { id: 'time', name: 'Prep Time', icon: Timer },
];

export default function MenuPage({ onSelectAdd, onQuantityChange, quantities = {} }) {
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('All');
  const [filters, setFilters] = useState([]);
  const [localQuantities, setLocalQuantities] = useState(quantities);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v || 0));

  // Sync when parent changes (e.g., cart modifications from CartPage)
  React.useEffect(()=>{ setLocalQuantities(quantities); }, [quantities]);
  const [modalItem, setModalItem] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  // Fetch mapped items for QR Billing with images; keep UI identical
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await http.get('/qr-billing/items');
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        // Map backend items to UI shape without changing the layout
        const mapped = data
          // Client-side guard: exclude complimentary-like items if any slipped through
          .filter((it) => {
            const nm = (it.name || '').toLowerCase().trim();
            const cat = (it.category || '').toLowerCase().trim();
            const isComplCat = /^complimentary( items)?$/.test(cat);
            const isComplName = /(chutney|sambar|podi|raita|pickle|papad|buttermilk|curd|lemon|onion|carrot|mint|coconut|salad)\s*$/.test(nm);
            return !(isComplCat || isComplName);
          })
          .map((it) => {
            const id = String(it.id ?? it.menu_item_id ?? it.name);
            const name = it.name || 'Menu Item';
            const image = it.image || it.img || it.fallback_img || it.placeholder_img || '';
            const price = it.price !== undefined && it.price !== null && it.price !== '' ? Number(it.price) : null;
            const prepTime = Number(it.avg_prep_time_minutes ?? 10) || 10;
            const isAvailable = it.is_available_to_customer !== false;
            const catRaw = (it.category || '').toString().toLowerCase();
            // Normalize categories to UI buckets
            let category = 'Main Course';
            if (['starters', 'starter', 'appetizer', 'appetizers', 'snack', 'snacks', 'tiffin', 'breakfast'].some(k=>catRaw.includes(k))) category = 'Starters';
            else if (['dessert', 'desserts', 'sweet', 'sweets', 'ice cream', 'pudding'].some(k=>catRaw.includes(k))) category = 'Desserts';
            else if (['drink', 'drinks', 'beverage', 'beverages', 'juice', 'soda', 'shake', 'tea', 'coffee'].some(k=>catRaw.includes(k))) category = 'Drinks';
            // Safe default description
            const description = it.description || '';
            return {
              id,
              name,
              description,
              price,
              image,
              // Preserve backend-provided image metadata for robust rendering
              img: it.img || image,
              fallback_img: it.fallback_img || '',
              fallbacks: Array.isArray(it.fallbacks) ? it.fallbacks : [],
              placeholder_img: it.placeholder_img || '',
              category,
              prepTime,
              isAvailable,
              isTrending: false,
              isLiked: true,
              hasOffer: false,
              rating: 4.8,
              customizations: [],
              recommendations: []
            };
          });
        if (!cancelled) { setItems(mapped); setError(null); }
      } catch (e) {
        if (!cancelled) setError('Failed to load menu items');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleFilter = (id) => {
    setFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const updateQty = (id, change) => {
    setLocalQuantities(prev => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] || 0) + change) };
      const item = items.find(i=>i.id===id);
      if (item && onQuantityChange) onQuantityChange(item, next[id]);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (category !== 'All' && item.category !== category) return false;
      if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filters.includes('trending') && !item.isTrending) return false;
      if (filters.includes('liked') && !item.isLiked) return false;
      if (filters.includes('offers') && !item.hasOffer) return false;
      return true;
    }).sort((a,b) => {
      if (filters.includes('price')) return a.price - b.price;
      if (filters.includes('time')) return a.prepTime - b.prepTime;
      return 0;
    });
  }, [searchText, category, filters, items]);

  const handleOpen = (item) => {
    if (!item.isAvailable) { alert('Item unavailable today.'); return; }
    setModalItem(item);
    if (item.recommendations?.length) {
      setRecommendation(item.recommendations.join(' & '));
      setTimeout(() => setRecommendation(null), 3000);
    }
  };

  return (
    <div className="qr-menu-container">
      <div className="qr-header"><h2>QR Billing Menu</h2></div>
      
      {loading ? (
        <div className="loading-state">
          <Clock size={48} color="#4CAF50" />
          <h3>Loading Menu Items...</h3>
          <p>Fetching fresh items from the kitchen</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <X size={48} color="#ff4444" />
          <h3>Unable to Load Menu</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="qr-search-bar">
            <Search size={18} />
            <input value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder="Search for food" />
            <button className="qr-filter-toggle" onClick={()=>setShowFilters(s=>!s)}>
              <Filter size={18} color="#fbbf24" />
            </button>
          </div>

      {showFilters && (
        <div className="qr-filters">
          {filterDefs.map(f => {
            const Icon = f.icon; const active = filters.includes(f.id);
            return (
              <button key={f.id} onClick={()=>toggleFilter(f.id)} className={"qr-filter-chip" + (active? ' active':'')}>
                <Icon size={14} /> {f.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="qr-categories">
        {categories.map(c => (
          <button key={c} onClick={()=>setCategory(c)} className={"qr-cat" + (category===c? ' active':'')}>{c}</button>
        ))}
      </div>

      <div className="qr-grid">
        {filtered.map(item => (
          <div key={item.id} className={"qr-item" + (!item.isAvailable? ' unavailable':'')} onClick={() => handleOpen(item)}>
            <div className="qr-img-wrap">
              <ImageWithFallback
                src={item.img || item.image}
                fallback={item.fallback_img}
                fallbacks={item.fallbacks}
                placeholder={item.placeholder_img}
                alt={item.name}
              />
              <div className="qr-badge time"><Clock size={10} /> {item.prepTime}m</div>
              {item.hasOffer && <div className="qr-badge offer">Offer</div>}
              {!item.isAvailable && <div className="qr-overlay">Empty</div>}
            </div>
            <div className="qr-info">
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              <div className="qr-footer-line">
                {item.price != null && <span className="price">{formatINR(item.price)}</span>}
                <span className="rating"><Star size={12} fill="#fbbf24" color="#fbbf24" /> {item.rating}</span>
              </div>
              <div className="qr-qty">
                <button onClick={(e)=>{e.stopPropagation(); item.isAvailable && updateQty(item.id,-1);}} disabled={!item.isAvailable}><Minus size={14}/></button>
                <span>{localQuantities[item.id]||0}</span>
                <button onClick={(e)=>{e.stopPropagation(); item.isAvailable && updateQty(item.id,1);}} disabled={!item.isAvailable}><Plus size={14}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalItem && (
        <div className="qr-modal-backdrop" onClick={()=>setModalItem(null)}>
          <div className="qr-modal" onClick={e=>e.stopPropagation()}>
            <div className="qr-modal-head">
              <h3>{modalItem.name}</h3>
              <button onClick={()=>setModalItem(null)}><X size={20} /></button>
            </div>
            <ImageWithFallback
              src={modalItem.img || modalItem.image}
              fallback={modalItem.fallback_img}
              fallbacks={modalItem.fallbacks}
              placeholder={modalItem.placeholder_img}
              alt={modalItem.name}
              className="qr-modal-img"
              style={{ borderRadius: 12 }}
            />
            <p>{modalItem.description}</p>
            <h5>Customizations</h5>
            <ul className="qr-customizations">
              {modalItem.customizations?.map((c,i)=>(<li key={i}>{c}</li>))}
            </ul>
            <div className="qr-modal-footer">
              {modalItem.price != null && <div className="modal-price">{formatINR(modalItem.price)}</div>}
              <button className="add-btn" onClick={()=>{ updateQty(modalItem.id,1); onSelectAdd && onSelectAdd(modalItem); setModalItem(null); }}> <Plus size={16}/> Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      {recommendation && (
        <div className="qr-recommend">
          Perfect Combo! Try {recommendation} with this item!
        </div>
      )}
        </>
      )}
    </div>
  );
}

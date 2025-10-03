import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, ShoppingCart, RefreshCw } from 'lucide-react';
import './MenuDisplay.css';

export default function MenuDisplay({ cart = [], setCart, onViewCart }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  // Map of itemId -> object URL created from blob
  const [imageSrcMap, setImageSrcMap] = useState({});
  // Keep track of created object URLs for cleanup
  const createdUrlsRef = useRef(new Set());

  // Use proxy for development - relative URLs will be proxied to backend
  const API_BASE = '';
  const apiUrl = (path) => path;
  const TENANT_ID = '1';
  const TRANSPARENT_PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1sG2QAAAAASUVORK5CYII=';

  // Normalize categories so "Starters" shows as expected
  const normalizeCategory = (name) => {
    if (!name) return 'Others';
    const n = String(name).trim().toLowerCase();
    if (n === 'snacks' || n === 'appetizers' || n === 'starter' || n === 'starters') return 'Starters';
    if (n === 'main course' || n === 'maincourse') return 'Main Course';
    if (n === 'signature dishes' || n === 'signature') return 'Signature Dishes';
    if (n === 'dessert' || n === 'desserts') return 'Desserts';
    if (n === 'beverage' || n === 'beverages' || n === 'drinks') return 'Beverages';
    if (n === 'complimentary') return 'Complimentary';
    return name;
  };

  const slugify = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  // Direct API call without service layer for debugging
  const loadMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading menu data directly from API...');
      
      const response = await fetch(apiUrl('/api/menu/items'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': TENANT_ID
        }
      });

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 API Response:', result);

      if (result.success && result.data && Array.isArray(result.data)) {
  // Normalize categories right away
  const items = result.data.map((it) => ({ ...it, category: normalizeCategory(it.category) }));
        console.log(`✅ Loaded ${items.length} items successfully`);
        console.log('🔍 Sample items:', items.slice(0, 3).map(item => ({
          name: item.name,
          category: item.category,
          price: item.price,
          image_url: item.image_url
        })));
        
        // Log first few image URLs for debugging
        console.log('🖼️ Image URLs check:');
        items.slice(0, 5).forEach(item => {
          console.log(`   ${item.name}: ${item.image_url || 'NO URL'}`);
          if (item.image_url) {
            console.log(`   Full URL: ${apiUrl(item.image_url)}`);
          }
        });
        setMenuItems(items);
        // Prefetch images as blobs so we can send headers
        prefetchImages(items);
        console.log('🎯 State updated with items:', items.length);
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (err) {
      console.error('❌ Error loading menu:', err);
      setError(err.message);
      
      // Fallback to demo data to ensure something displays
      const demoItems = [
        {
          id: 1,
          name: 'Paneer Butter Masala',
          category: 'Main Course',
          price: '280.00',
          image_url: '/api/images/by-name/paneer_butter_masala.jpg',
          serving_unit: 'Serving',
          servings_per_batch: '4.00',
          is_active: true
        },
        {
          id: 2,
          name: 'Garlic Naan',
          category: 'Starters',
          price: '40.00',
          image_url: '/api/images/by-name/garlic_naan.jpg',
          serving_unit: 'Piece',
          servings_per_batch: '1.00',
          is_active: true
        }
      ];
      setMenuItems(demoItems);
      prefetchImages(demoItems);
      console.log('🔄 Using fallback demo data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch image with tenant header -> blob -> object URL
  const fetchImageBlobUrl = async (path) => {
    try {
      const res = await fetch(apiUrl(path), {
        method: 'GET',
        headers: { 'X-Tenant-Id': TENANT_ID }
      });
      if (!res.ok) {
        throw new Error(`Image fetch failed ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      createdUrlsRef.current.add(url);
      return url;
    } catch (e) {
      console.warn('🖼️ Image fetch error for', path, e.message);
      return null;
    }
  };

  // Try a couple of fallbacks if direct path fails
  const fetchImageWithFallbacks = async (item) => {
    const tryPaths = [];
    if (item.image_url) tryPaths.push(item.image_url);
    const base = slugify(item.image_name || item.name);
    // Prefer jpg then png
    tryPaths.push(`/api/images/by-name/${base}.jpg`);
    tryPaths.push(`/api/images/by-name/${base}.png`);
    for (const p of tryPaths) {
      const url = await fetchImageBlobUrl(p);
      if (url) return url;
    }
    return null;
  };

  const prefetchImages = async (items) => {
    const entries = await Promise.all(
      items.map(async (it) => {
        const url = await fetchImageWithFallbacks(it);
        return [it.id, url];
      })
    );
    const map = Object.fromEntries(entries.filter(([_, url]) => url));
    setImageSrcMap((prev) => ({ ...prev, ...map }));
  };

  useEffect(() => {
    console.log('🚀 MenuDisplay component mounted');
    loadMenuData();
    return () => {
      // Cleanup created object URLs to avoid memory leaks
      createdUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      createdUrlsRef.current.clear();
    };
  }, []);

  // Simple filtering logic
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || normalizeCategory(item.category) === selectedCategory;
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      normalizeCategory(item.category).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group items by category
  const groupedItems = {};
  filteredItems.forEach(item => {
    const cat = normalizeCategory(item.category);
    if (!groupedItems[cat]) {
      groupedItems[cat] = [];
    }
    groupedItems[cat].push(item);
  });

  // Get unique categories for filter buttons
  const categories = ['All', ...new Set(menuItems.map(item => normalizeCategory(item.category)))];

  const addToCart = (item) => {
    console.log('🛒 Adding to cart:', item.name);
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const getItemQuantityInCart = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const totalItemsInCart = cart.reduce((total, item) => total + item.quantity, 0);

  console.log('🔍 Render Debug:', {
    loading,
    error,
    menuItemsCount: menuItems.length,
    filteredItemsCount: filteredItems.length,
    groupedCategories: Object.keys(groupedItems),
    searchTerm,
    selectedCategory
  });

  if (loading) {
    return (
      <div className="menu-display">
        <div className="loading-container">
          <RefreshCw className="loading-spinner" size={40} />
          <h3>Loading Menu...</h3>
          <p>Fetching items from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-display">
      {/* Header */}
      <div className="menu-header">
        <div className="menu-title">
          <h2>🍽️ Menu ({menuItems.length} items)</h2>
          {error && (
            <p className="error-text" style={{color: '#ff6b6b', fontSize: '14px'}}>
              ⚠️ {error} (showing available data)
            </p>
          )}
          <p className="menu-subtitle">
            Categories: {Object.keys(groupedItems).join(', ')}
          </p>
        </div>
        {totalItemsInCart > 0 && (
          <button className="cart-indicator" onClick={onViewCart}>
            <ShoppingCart size={20} />
            <span className="cart-count">{totalItemsInCart}</span>
            <span className="cart-text">View Cart</span>
          </button>
        )}
      </div>

      {/* Debug Section - Remove this after fixing */}
      {menuItems.length > 0 && (
        <div style={{background: '#f0f8ff', padding: '15px', margin: '10px 0', borderRadius: '8px', fontSize: '14px'}}>
          <h4>🔍 Debug Info:</h4>
          <p><strong>Total Items:</strong> {menuItems.length}</p>
          <p><strong>Sample Image URLs:</strong></p>
          {menuItems.slice(0, 3).map(item => (
            <div key={item.id} style={{marginBottom: '8px'}}>
              <strong>{item.name}:</strong><br/>
              <span style={{color: '#666'}}>{item.image_url || 'No image URL'}</span><br/>
              {item.image_url && (
                <span style={{color: '#007bff'}}>Full: {apiUrl(item.image_url)}</span>
              )}
            </div>
          ))}
          <div style={{marginTop: '10px'}}>
            <strong>Test Image:</strong><br/>
            <img 
              src={apiUrl('/api/images/by-name/lassi.jpg')} 
              alt="Test" 
              style={{width: '100px', height: '75px', objectFit: 'cover', border: '1px solid #ccc'}}
              onLoad={() => console.log('✅ Direct image test successful')}
              onError={() => console.log('❌ Direct image test failed')}
            />
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="menu-controls">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <button onClick={loadMenuData} className="refresh-button">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Category Filters */}
      <div className="category-filters">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category} {category !== 'All' && groupedItems[category] ? `(${groupedItems[category].length})` : ''}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="menu-content">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="no-items">
            <ShoppingCart size={64} color="#ccc" />
            <h3>No items found</h3>
            <p>
              {searchTerm 
                ? `No items match "${searchTerm}"` 
                : selectedCategory !== 'All' 
                ? `No items in ${selectedCategory} category`
                : 'No menu items available'
              }
            </p>
            <button onClick={loadMenuData} className="reload-btn">
              <RefreshCw size={16} />
              Reload Menu
            </button>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="category-section">
              <h3 className="category-title">{category} ({items.length} items)</h3>
              <div className="items-grid">
                {items.map(item => (
                  <div key={item.id} className="menu-item-card">
                    <div className="item-image">
                      <img 
                        src={imageSrcMap[item.id] || (item.image_url ? TRANSPARENT_PX : require('../../assets/placeholder-menu-item.png'))} 
                        alt={item.name}
                        crossOrigin="anonymous"
                        onError={(e) => {
                          console.log('🖼️ Image load failed for:', item.name, 'URL:', e.target.src);
                          if (!e.target.dataset.fallbackAttempted) {
                            e.target.dataset.fallbackAttempted = 'true';
                            if(!e.target.dataset.fallback){ e.target.dataset.fallback='1'; e.target.src = require('../../assets/placeholder-menu-item.png'); }
                          }
                        }}
                        onLoad={(e) => {
                          console.log('✅ Image loaded successfully for:', item.name);
                        }}
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          backgroundColor: '#f5f5f5'
                        }}
                      />
                      {/* If blob not yet fetched, show a lightweight skeleton and trigger fetch */}
                      {!imageSrcMap[item.id] && item.image_url && (
                        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#222'}}>
                          <span style={{color: '#aaa', fontSize: 12}}>Loading image…</span>
                        </div>
                      )}
                      {getItemQuantityInCart(item.id) > 0 && (
                        <div className="quantity-badge">
                          {getItemQuantityInCart(item.id)}
                        </div>
                      )}
                    </div>
                    
                    <div className="item-info">
                      <h4 className="item-name">{item.name}</h4>
                      <p className="item-details">
                        Serves: {item.servings_per_batch} {item.serving_unit}
                        {item.is_active ? ' | ✅ Available' : ' | ❌ Unavailable'}
                      </p>
                      <div className="item-footer">
                        <span className="item-price">₹{item.price}</span>
                        <button 
                          className="add-btn"
                          onClick={() => addToCart(item)}
                          disabled={!item.is_active}
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
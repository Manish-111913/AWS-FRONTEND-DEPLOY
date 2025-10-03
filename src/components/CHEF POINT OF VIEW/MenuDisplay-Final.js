import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, ShoppingCart } from 'lucide-react';
import './MenuDisplay.css';

export default function MenuDisplay({ cart = [], setCart, onViewCart }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [imageBlobs, setImageBlobs] = useState({});
  const blobUrlsRef = useRef(new Set());

  const TENANT_ID = '1';

  // Load menu data
  const loadMenuData = async () => {
    try {
      console.log('🔄 Loading menu data...');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/menu/items', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': TENANT_ID
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 API Response:', result);

      if (result.success && result.data && Array.isArray(result.data)) {
        console.log(`✅ Loaded ${result.data.length} items successfully`);
        setMenuItems(result.data);
        
        // Load images after menu items are set
        loadImages(result.data);
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (err) {
      console.error('❌ Error loading menu:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load images with tenant headers
  const loadImages = async (items) => {
    console.log('🖼️ Loading images for', items.length, 'items...');
    
    const imagePromises = items.map(async (item) => {
      if (!item.image_url) return [item.id, null];
      
      try {
        console.log('📸 Fetching image for:', item.name, 'URL:', item.image_url);
        
        const response = await fetch(item.image_url, {
          method: 'GET',
          headers: {
            'X-Tenant-Id': TENANT_ID
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          blobUrlsRef.current.add(blobUrl);
          console.log('✅ Image loaded for:', item.name);
          return [item.id, blobUrl];
        } else {
          console.warn('❌ Image failed for:', item.name, 'Status:', response.status);
          return [item.id, null];
        }
      } catch (error) {
        console.warn('💥 Image error for:', item.name, error.message);
        return [item.id, null];
      }
    });

    const results = await Promise.all(imagePromises);
    const blobMap = Object.fromEntries(results);
    setImageBlobs(blobMap);
    console.log('🎯 Image loading complete. Loaded:', Object.values(blobMap).filter(Boolean).length, 'images');
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    console.log('🚀 MenuDisplay component mounted');
    loadMenuData();
    
    return () => {
      console.log('🧹 Cleaning up blob URLs...');
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    };
  }, []);

  // Helper functions
  const getItemQuantityInCart = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const addToCart = (item) => {
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

  const totalItemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Normalize category names
  const normalizeCategory = (category) => {
    if (!category) return 'Others';
    const normalized = category.toLowerCase();
    if (normalized.includes('snack') || normalized.includes('starter') || normalized.includes('appetizer')) {
      return 'Starters';
    }
    if (normalized.includes('main')) {
      return 'Main Course';
    }
    return category;
  };

  // Simple filtering
  const filteredItems = menuItems.filter(item => {
    const normalizedCategory = normalizeCategory(item.category);
    const matchesCategory = selectedCategory === 'All' || normalizedCategory === selectedCategory;
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      normalizedCategory.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group items by category
  const groupedItems = {};
  filteredItems.forEach(item => {
    const category = normalizeCategory(item.category);
    if (!groupedItems[category]) {
      groupedItems[category] = [];
    }
    groupedItems[category].push(item);
  });

  // Get unique categories
  const categories = ['All', ...new Set(menuItems.map(item => normalizeCategory(item.category)))];

  if (loading) {
    return (
      <div className="menu-container">
        <div className="loading-state" style={{textAlign: 'center', padding: '50px'}}>
          <h2>🔄 Loading Menu...</h2>
          <p>Please wait while we load the menu items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-container">
        <div className="error-state" style={{textAlign: 'center', padding: '50px', color: 'red'}}>
          <h2>❌ Error Loading Menu</h2>
          <p>{error}</p>
          <button onClick={loadMenuData} style={{padding: '10px 20px', marginTop: '10px'}}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-container">
      {/* Header */}
      <div className="menu-header">
        <div className="menu-title">
          <h2>🍽️ Menu ({menuItems.length} items)</h2>
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

      {/* Debug Info */}
      <div style={{background: '#f0f8ff', padding: '15px', margin: '10px 0', borderRadius: '8px', fontSize: '14px'}}>
        <h4>🔍 Debug Info:</h4>
        <p><strong>Total Items:</strong> {menuItems.length}</p>
        <p><strong>Images Loaded:</strong> {Object.values(imageBlobs).filter(Boolean).length}/{menuItems.length}</p>
        <p><strong>API Status:</strong> {error ? '❌ Error' : '✅ Working'}</p>
      </div>

      {/* Search and Filter */}
      <div className="menu-controls" style={{padding: '20px 0', borderBottom: '1px solid #eee'}}>
        <div className="search-container" style={{marginBottom: '15px', position: 'relative'}}>
          <Search size={20} style={{position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666'}} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 45px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>
        
        <div className="category-filters" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                background: selectedCategory === category ? '#007bff' : 'white',
                color: selectedCategory === category ? 'white' : '#333',
                cursor: 'pointer'
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="menu-content" style={{padding: '20px 0'}}>
        {Object.keys(groupedItems).length === 0 ? (
          <div style={{textAlign: 'center', padding: '50px', color: '#666'}}>
            <h3>No items found</h3>
            <p>Try adjusting your search or category filter</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="category-section" style={{marginBottom: '40px'}}>
              <h3 className="category-title" style={{color: '#333', marginBottom: '20px', borderBottom: '2px solid #007bff', paddingBottom: '10px'}}>
                {category} ({items.length} items)
              </h3>
              <div className="items-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                {items.map(item => (
                  <div key={item.id} className="menu-item-card" style={{border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
                    <div className="item-image" style={{position: 'relative', height: '200px', backgroundColor: '#f5f5f5'}}>
                      <img 
                        src={imageBlobs[item.id] || require('../../assets/placeholder-menu-item.png')}
                        alt={item.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          console.log('❌ Image display failed for:', item.name);
                          if (!e.target.dataset.fallbackSet) {
                            e.target.dataset.fallbackSet = 'true';
                            if(!e.target.dataset.fallback){ e.target.dataset.fallback='1'; e.target.src = require('../../assets/placeholder-menu-item.png'); }
                          }
                        }}
                        onLoad={() => {
                          console.log('✅ Image displayed for:', item.name);
                        }}
                      />
                      {getItemQuantityInCart(item.id) > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {getItemQuantityInCart(item.id)}
                        </div>
                      )}
                    </div>
                    
                    <div className="item-info" style={{padding: '15px'}}>
                      <h4 className="item-name" style={{margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold'}}>
                        {item.name}
                      </h4>
                      <p className="item-details" style={{color: '#666', fontSize: '14px', margin: '5px 0'}}>
                        Serves: {item.servings_per_batch || 1} {item.serving_unit || 'portion'}
                      </p>
                      <div className="item-footer" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px'}}>
                        <span className="item-price" style={{fontSize: '20px', fontWeight: 'bold', color: '#007bff'}}>
                          ₹{item.price}
                        </span>
                        <button 
                          className="add-btn"
                          onClick={() => addToCart(item)}
                          style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
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
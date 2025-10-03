import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, ShoppingCart, RefreshCw, AlertCircle, Filter } from 'lucide-react';
import './MenuDisplay.css';

export default function MenuDisplay({ cart = [], setCart, onViewCart }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [retryCount, setRetryCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState(['All']);
  const [dataSource, setDataSource] = useState('api');

  // Direct API call without service layer for debugging
  const loadMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading menu data directly from API...');
      
      const response = await fetch('http://localhost:5001/api/menu/items', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 API Response:', result);

      if (result.success && result.data && Array.isArray(result.data)) {
        const items = result.data;
        console.log(`✅ Loaded ${items.length} items successfully`);
        console.log('🔍 Sample items:', items.slice(0, 3).map(item => ({
          name: item.name,
          category: item.category,
          price: item.price
        })));
        
        setMenuItems(items);
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
          category: 'Snacks',
          price: '40.00',
          image_url: '/api/images/by-name/garlic_naan.jpg',
          serving_unit: 'Piece',
          servings_per_batch: '1.00',
          is_active: true
        }
      ];
      setMenuItems(demoItems);
      console.log('🔄 Using fallback demo data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 MenuDisplay component mounted');
    loadMenuData();
  }, []);

  // Filter and search logic
  const filteredItems = useMemo(() => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [menuItems, selectedCategory, searchTerm]);

  // Group items by category for display
  const groupedItems = useMemo(() => {
    console.log('🔍 DEBUGGING: Processing items for display');
    console.log(`   Total menuItems: ${menuItems.length}`);
    console.log(`   Filtered items: ${filteredItems.length}`);
    console.log(`   Selected category: ${selectedCategory}`);
    console.log(`   Search term: "${searchTerm}"`);
    
    const groups = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    
    console.log('📊 Final grouped items:', Object.keys(groups).map(cat => `${cat}: ${groups[cat].length} items`));
    
    return groups;
  }, [filteredItems]);

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image_url || '/images/placeholder-food.jpg',
          category: item.category,
          customizations: []
        }];
      }
    });
  };

  const getItemQuantityInCart = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const totalItemsInCart = cart.reduce((total, item) => total + item.quantity, 0);

  if (loading) {
    return (
      <div className="menu-display-loading">
        <div className="spinner"></div>
        <p>Loading menu items...</p>
        <p className="loading-subtext">Please wait while we fetch your delicious options</p>
      </div>
    );
  }

  if (error && menuItems.length === 0) {
    return (
      <div className="menu-display-error">
        <AlertCircle size={48} color="#ff4444" />
        <h3>Unable to load menu</h3>
        <p>Error: {error}</p>
        <button onClick={() => {
          setRetryCount(prev => prev + 1);
          loadMenuData();
        }} className="retry-btn">
          <RefreshCw size={16} />
          Retry ({retryCount + 1})
        </button>
        <p className="error-help">
          If this problem persists, please contact support or try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="menu-display">
      {/* Header with cart indicator */}
      <div className="menu-header">
        <div className="menu-title">
          <h2>Our Menu</h2>
          <p>
            {filteredItems.length} items available
            {dataSource === 'fallback' && (
              <span className="data-source-indicator">
                <AlertCircle size={14} />
                Demo Mode
              </span>
            )}
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

      {/* Error banner for fallback mode */}
      {error && dataSource === 'fallback' && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={loadMenuData} className="banner-retry">
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
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
        
        <button 
          className={`filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* Category Filter */}
      {showFilters && (
        <div className="filter-panel">
          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items Display */}
      <div className="menu-content">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="no-items">
            <ShoppingCart size={64} color="#ccc" />
            <h3>No items found</h3>
            <p>
              {searchTerm 
                ? `No items match "${searchTerm}"${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}`
                : selectedCategory !== 'All' 
                ? `No items found in ${selectedCategory} category`
                : 'No menu items are currently available'
              }
            </p>
            {(searchTerm || selectedCategory !== 'All') && (
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
              >
                Clear Filters
              </button>
            )}
            {menuItems.length === 0 && (
              <button onClick={loadMenuData} className="reload-menu-btn">
                <RefreshCw size={16} />
                Reload Menu
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="category-section">
              <h3 className="category-title">{category}</h3>
              <div className="items-grid">
                {items.map(item => (
                  <div key={item.id} className="menu-item-card">
                    <div className="item-image">
                      <img 
                        src={item.image_url || '/images/placeholder-food.jpg'} 
                        alt={item.name}
                        onError={(e) => {
                          // Try different fallback images
                          if (!e.target.dataset.fallbackAttempted) {
                            e.target.dataset.fallbackAttempted = 'true';
                            if(!e.target.dataset.fallback){ e.target.dataset.fallback='1'; e.target.src = require('../../assets/placeholder-menu-item.png'); }
                          }
                        }}
                      />
                      {getItemQuantityInCart(item.id) > 0 && (
                        <div className="quantity-badge">
                          {getItemQuantityInCart(item.id)}
                        </div>
                      )}
                    </div>
                    
                    <div className="item-info">
                      <h4 className="item-name">{item.name}</h4>
                      <p className="item-details">
                        Serves: {item.servings_per_batch || 1} | 
                        Unit: {item.serving_unit || 'piece'}
                      </p>
                      <div className="item-footer">
                        <span className="item-price">₹{item.price}</span>
                        <button 
                          className="add-btn"
                          onClick={() => addToCart(item)}
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